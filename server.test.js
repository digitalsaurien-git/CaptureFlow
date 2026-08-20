process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.CAPTUREFLOW_USERNAME = "kader";
process.env.CAPTUREFLOW_PASSWORD = "secret";
process.env.SESSION_SECRET = "test-secret-long-enough-for-unit-tests";

const test = require("node:test");
const assert = require("node:assert/strict");

// Les fonctions pures sont vérifiées sans démarrer l’application.
const originalExit = process.exit;
process.exit = code => { throw new Error(`unexpected exit ${code}`); };
const { app, pool, validState, createSessionToken, verifySessionToken } = require("./server");
process.exit = originalExit;

test("validState accepte une sauvegarde CaptureFlow", () => {
  assert.equal(validState({ projects: [], tasks: [], notes: [] }), true);
  assert.equal(validState({ projects: [], tasks: {} , notes: [] }), false);
});

test("le jeton de session signé est vérifiable", () => {
  const token = createSessionToken("kader");
  assert.equal(verifySessionToken(token).username, "kader");
  assert.equal(verifySessionToken(`${token}x`), null);
});

test("connexion puis lecture et écriture de l’état", async t => {
  let stored = null;
  let revision = 0;
  pool.query = async (sql, params=[]) => {
    if(sql.startsWith("SELECT data")) return { rowCount: stored?1:0, rows: stored?[{data:stored,revision,updated_at:new Date()}]:[] };
    if(sql.startsWith("INSERT INTO")) {
      stored=JSON.parse(params[1]);revision=1;
      return {rowCount:1,rows:[{revision,updated_at:new Date()}]};
    }
    if(sql.startsWith("UPDATE")) {
      if(Number(params[2])!==revision)return {rowCount:0,rows:[]};
      stored=JSON.parse(params[0]);revision+=1;
      return {rowCount:1,rows:[{revision,updated_at:new Date()}]};
    }
    return {rowCount:1,rows:[{}]};
  };
  const server=app.listen(0);
  t.after(()=>server.close());
  await new Promise(resolve=>server.once("listening",resolve));
  const base=`http://127.0.0.1:${server.address().port}`;

  const login=await fetch(`${base}/api/login`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:"kader",password:"secret"})});
  assert.equal(login.status,200);
  const cookie=login.headers.get("set-cookie").split(";")[0];
  const data={meta:{version:6},settings:{},projects:[],tasks:[],notes:[],activitySessions:[],improvements:[],recurringTasks:[]};
  const saved=await fetch(`${base}/api/state`,{method:"PUT",headers:{"content-type":"application/json",cookie},body:JSON.stringify({data,revision:0})});
  assert.equal(saved.status,200);
  assert.equal((await saved.json()).revision,1);
  const loaded=await fetch(`${base}/api/state`,{headers:{cookie}});
  assert.equal(loaded.status,200);
  assert.equal((await loaded.json()).data.meta.version,6);
});
