# CaptureFlow

CaptureFlow est une V1 propre dediee a la capture rapide, la boite d'entree,
les statuts simples, l'archivage, un webhook securise et une persistance fiable
sur PostgreSQL.

## Perimetre V1

- Capture rapide.
- Boite d'entree.
- Statuts simples : `INBOX`, `TODO`, `DONE`, `ARCHIVED`.
- Archivage.
- Webhook securise par secret serveur.
- Persistance PostgreSQL.
- Documentation projet.

## Hors perimetre V1

- IA.
- OCR.
- Transcription audio.
- Notifications.
- Multi-utilisateur complexe.
- Integrations externes.

## Stack cible

- Next.js.
- TypeScript.
- Tailwind CSS.
- Prisma.
- PostgreSQL.
- Vitest.
- Coolify sur Hostinger KVM.

## Documentation

- `docs/ENVIRONMENT.md` describes required environment variables.
- `docs/LOCAL_DATABASE.md` describes local PostgreSQL setup.
- `docs/DEPLOYMENT.md` describes the Coolify deployment path.
