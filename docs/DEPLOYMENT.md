# Deployment

CaptureFlow V1 targets a Hostinger KVM running Coolify with PostgreSQL.

## Required services

- One web application service for the Next.js app.
- One PostgreSQL database service.

## Environment variables

Set these variables in Coolify on the web application service:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
CAPTUREFLOW_WEBHOOK_SECRET="a-long-random-production-secret"
```

Use the PostgreSQL connection string provided by Coolify. Do not reuse the local
example password in production.

## Build settings

Recommended Coolify settings:

```txt
Install command: npm.cmd install
Build command: npm.cmd run build
Start command: npm.cmd run start
Port: 3000
```

On Linux servers, Coolify will usually run `npm` rather than `npm.cmd`:

```txt
Install command: npm install
Build command: npm run db:generate && npm run build
Start command: npm run start
Port: 3000
```

## Database migrations

Before starting the production app for the first time, run:

```bash
npm run db:deploy
```

This applies the committed Prisma migrations to PostgreSQL.

For later deployments, keep using:

```bash
npm run db:deploy
```

Do not use `prisma migrate dev` in production.

## First deployment checklist

- PostgreSQL service exists in Coolify.
- `DATABASE_URL` is configured on the web app service.
- `CAPTUREFLOW_WEBHOOK_SECRET` is configured with a long random value.
- `npm run db:deploy` has completed successfully.
- The app starts on port `3000`.
- `/`, `/inbox`, and `/archive` return HTTP 200.
- Webhook requests without the secret return 401.
