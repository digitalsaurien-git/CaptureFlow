const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 3000);
const USERNAME = process.env.CAPTUREFLOW_USERNAME || "";
const PASSWORD = process.env.CAPTUREFLOW_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const COOKIE_NAME = "captureflow_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

for (const [name, value] of Object.entries({
  CAPTUREFLOW_USERNAME: USERNAME,
  CAPTUREFLOW_PASSWORD: PASSWORD,
  SESSION_SECRET,
  DATABASE_URL
})) {
  if (!value) {
    console.error(`Variable obligatoire absente : ${name}`);
    process.exit(1);
  }
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function createSessionToken(username) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token = "") {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.username !== USERNAME || Number(decoded.expiresAt) < Date.now() / 1000) return null;
    return decoded;
  } catch {
    return null;
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map(part => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    return [decodeURIComponent(part.slice(0, index).trim()), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function validState(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  return ["projects", "tasks", "notes"].every(key => Array.isArray(data[key]));
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS captureflow_state (
      account TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "12mb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(self)");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  next();
});

function requireAuth(req, res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  const session = verifySessionToken(token);
  if (!session) return res.status(401).json({ error: "AUTH_REQUIRED" });
  req.session = session;
  next();
}

app.get("/healthz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    res.status(503).json({ status: "error", message: error.message });
  }
});

app.get("/api/session", requireAuth, (req, res) => {
  res.json({ authenticated: true, username: req.session.username });
});

app.post("/api/login", (req, res) => {
  const usernameOk = safeEqual(req.body?.username || "", USERNAME);
  const passwordOk = safeEqual(req.body?.password || "", PASSWORD);
  if (!usernameOk || !passwordOk) return res.status(401).json({ error: "IDENTIFIANTS_INVALIDES" });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(createSessionToken(USERNAME))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`);
  res.json({ authenticated: true, username: USERNAME });
});

app.post("/api/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.status(204).end();
});

app.get("/api/state", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT data, revision, updated_at FROM captureflow_state WHERE account = $1", [req.session.username]);
    if (!result.rowCount) return res.json({ data: null, revision: 0, updatedAt: null });
    const row = result.rows[0];
    res.json({ data: row.data, revision: row.revision, updatedAt: row.updated_at });
  } catch (error) {
    next(error);
  }
});

app.put("/api/state", requireAuth, async (req, res, next) => {
  try {
    const data = req.body?.data;
    const expectedRevision = Number(req.body?.revision || 0);
    if (!validState(data)) return res.status(400).json({ error: "ETAT_INVALIDE" });

    if (expectedRevision === 0) {
      const inserted = await pool.query(
        "INSERT INTO captureflow_state(account, data, revision) VALUES($1, $2::jsonb, 1) ON CONFLICT DO NOTHING RETURNING revision, updated_at",
        [req.session.username, JSON.stringify(data)]
      );
      if (inserted.rowCount) return res.json({ revision: inserted.rows[0].revision, updatedAt: inserted.rows[0].updated_at });
    } else {
      const updated = await pool.query(
        "UPDATE captureflow_state SET data = $1::jsonb, revision = revision + 1, updated_at = NOW() WHERE account = $2 AND revision = $3 RETURNING revision, updated_at",
        [JSON.stringify(data), req.session.username, expectedRevision]
      );
      if (updated.rowCount) return res.json({ revision: updated.rows[0].revision, updatedAt: updated.rows[0].updated_at });
    }

    const current = await pool.query("SELECT data, revision, updated_at FROM captureflow_state WHERE account = $1", [req.session.username]);
    res.status(409).json({
      error: "CONFLIT_REVISION",
      data: current.rows[0]?.data || null,
      revision: current.rows[0]?.revision || 0,
      updatedAt: current.rows[0]?.updated_at || null
    });
  } catch (error) {
    next(error);
  }
});

for (const asset of ["index.html", "app.js", "logic.js", "styles.css"]) {
  app.get(asset === "index.html" ? ["/", "/index.html"] : `/${asset}`, (_req, res) => {
    res.sendFile(path.join(__dirname, asset));
  });
}
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "ERREUR_SERVEUR" });
});

if (require.main === module) {
  ensureSchema()
    .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`CaptureFlow écoute sur le port ${PORT}`)))
    .catch(error => {
      console.error("Initialisation PostgreSQL impossible", error);
      process.exit(1);
    });
}

module.exports = { app, pool, validState, createSessionToken, verifySessionToken };
