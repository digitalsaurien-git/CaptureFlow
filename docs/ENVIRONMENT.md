# Environment

CaptureFlow V1 uses only two required environment variables.

## Required variables

```env
DATABASE_URL="postgresql://captureflow:captureflow@localhost:5432/captureflow?schema=public"
CAPTUREFLOW_WEBHOOK_SECRET="change-me"
```

## DATABASE_URL

`DATABASE_URL` points Prisma to the PostgreSQL database.

For Coolify, this value should come from the PostgreSQL service connection string.
Do not commit real production credentials.

## CAPTUREFLOW_WEBHOOK_SECRET

`CAPTUREFLOW_WEBHOOK_SECRET` protects the capture webhook.

The V1 webhook will reject requests that do not provide the expected secret.
Use a long random value in production.

## Planned Prisma commands

These commands are intended for later steps, after dependencies and PostgreSQL are
available:

```bash
npm.cmd install
npm.cmd run typecheck
npm.cmd run db:generate
npm.cmd run db:deploy
```

The initial migration is committed in `prisma/migrations`.
