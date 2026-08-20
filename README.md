# CaptureFlow — version web synchronisée V6

CaptureFlow réunit dans une seule application les tâches, projets, post-it, tâches récurrentes, améliorations et journaux d’activité professionnels et personnels.

## Changements par rapport à la V5 locale

- Interface et fonctions de la V5 conservées.
- Connexion protégée par identifiant et mot de passe.
- Sauvegarde centrale dans PostgreSQL avec copie locale de secours.
- Synchronisation des données entre le poste professionnel et le poste personnel.
- Import avec fusion d’une sauvegarde en contexte **Professionnel**.
- Import avec fusion d’une sauvegarde en contexte **Personnel**.
- Restauration complète toujours disponible séparément.
- Gestion des conflits de révision pour limiter l’écrasement entre deux postes.

## Variables obligatoires

Copier les noms de `.env.example` dans les variables d’environnement Coolify :

- `DATABASE_URL` : URL PostgreSQL privée de la base CaptureFlow ;
- `CAPTUREFLOW_USERNAME` : identifiant de connexion ;
- `CAPTUREFLOW_PASSWORD` : mot de passe de connexion ;
- `SESSION_SECRET` : chaîne aléatoire longue et unique ;
- `NODE_ENV=production` ;
- `PORT=3000`.

Ajouter `DATABASE_SSL=true` uniquement si la connexion PostgreSQL exige TLS.

## Déploiement Coolify

Le dépôt contient un `Dockerfile`. Dans Coolify :

1. sélectionner le dépôt et la branche `main` ;
2. choisir la construction par Dockerfile ;
3. exposer le port `3000` ;
4. lier une base PostgreSQL dédiée à CaptureFlow ;
5. renseigner les variables ci-dessus ;
6. déployer puis vérifier `/healthz` ;
7. ajouter l’URL `sslip.io` et `captureflow.digitalsaurien.net` à la même ressource.

La table `captureflow_state` est créée automatiquement au premier démarrage.

## Première migration des données

1. Se connecter à la nouvelle application.
2. Ouvrir **Administration → Sauvegardes & réglages**.
3. Cliquer sur **Importer comme Professionnel** et choisir la sauvegarde du poste professionnel.
4. Cliquer sur **Importer comme Personnel** et choisir la sauvegarde du poste personnel.
5. Contrôler les compteurs, projets, sessions et filtres.
6. Télécharger une nouvelle sauvegarde JSON consolidée.

Les imports par fusion conservent les données déjà présentes. Les identifiants identiques sont dédupliqués et la version la plus récemment modifiée est conservée.

## Développement local

```bash
npm install
npm run check
npm test
npm start
```

Le mode serveur requiert PostgreSQL et les variables de `.env.example`.
