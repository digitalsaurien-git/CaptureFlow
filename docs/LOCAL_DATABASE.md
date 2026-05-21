# Local Database

CaptureFlow can run locally with PostgreSQL through Docker Compose.

## 1. Create local environment file

Copy `.env.local.example` to `.env.local`, then adjust values only if needed.

```env
DATABASE_URL="postgresql://captureflow:captureflow@localhost:5432/captureflow?schema=public"
CAPTUREFLOW_WEBHOOK_SECRET="replace-with-a-long-random-local-secret"
```

## 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

## 3. Generate Prisma client

```bash
npm.cmd run db:generate
```

On Linux or inside Coolify, use:

```bash
npm run db:generate
```

## 4. Apply migrations locally

```bash
npm.cmd run db:migrate -- --name init
```

If the migration already exists, use:

```bash
npm.cmd run db:deploy
```

## 5. Run the app

```bash
npm.cmd run dev
```

Open:

```txt
http://127.0.0.1:3000
```

## Notes

- The local Docker password is only for development.
- Production credentials must be generated and stored in Coolify.
- No production secret should be committed.
