# CaptureFlow - Product Requirements Document (PRD)

## Version: 1.0 (Initial V1)
## Date: 2026-04-13

### 1. Objectif du Projet
Créer un "cerveau externe" mobile-first simple permettant de capturer instantanément des pensées, tâches ou informations par texte ou voix, avec une classification intelligente automatique.

### 2. Public Cible
Utilisateurs ayant besoin de réduire leur charge mentale, se dispersant facilement, et cherchant un outil sans friction pour noter et organiser leurs idées.

### 3. Fonctionnalités Clés
- **Capture Instantanée** : Entrée via champ texte ou dictée vocale (Web Speech API).
- **Classification Intelligente (IA)** : Détection automatique du type, de la catégorie et du statut initial.
- **Organisation** :
    - **Types** : tâche, note, idée, suivi, référence.
    - **Catégories** : Travail, Perso, Courses, Santé, Bushcraft, Idées.
    - **Statuts** : à traiter (initial), en cours, terminé, archivé.
- **Vues** :
    - **Accueil** : Accès rapide capture + historique récent.
    - **Aujourd'hui** : Focus sur les entrées du jour et tâches actives.
    - **Toutes les entrées** : Recherche et filtrage (type, catégorie, statut).
- **Fiche Détail** : Consultation, correction de la classification et édition du contenu reformulé.

### 4. Spécifications Techniques (Architecture Full-Stack V1)
- **Frontend** : Vite + React (Client)
- **Backend** : Node.js + Express (Indépendant)
- **Styling** : Vanilla CSS
- **Logique IA** : Local simulation / Regex
- **Stockage** : 
    - **Frontend** : LocalStorage (Cache & UI)
    - **Backend** : JSON Database (Persistance réelle, prêt pour SQLite/Supabase)
- **Déploiement** : Frontend (Vercel/Static) + Backend (Render/Heroku/Railway)
- **Point d'entrée** : API distante permanente (`/api/inbox`)

### 5. Design & UX
- **Esthétique** : Design sobre, premium, rassurant (vibrant mais calme).
- **Expérience** : < 3 clics pour capturer une idée.
- **Typographie** : Inter ou Outfit (Google Fonts).

### 6. Fonctionnalités Développées (Suivi)
- [x] Initialisation du projet (CaptureFlow structure)
- [x] Configuration du système de design (CSS Variables, Typography)
- [x] Écran d'accueil (Capture + Historique)
- [x] Vue "Aujourd'hui"
- [x] Vue "Toutes les entrées" + Filtres
- [x] Fiche détail & Mode Édition
- [x] Logique de classification automatique
- [x] Intégration Voix (Web Speech API fonctionnelle)
- [x] Webhook Ingestion (POST /api/inbox pour raccourcis iOS)
- [x] Sécurisation par API Key (Frontend & Backend)
- [x] Indicateur visuel de synchronisation Cloud
- [ ] **(Phase 2)** Architecture par Espaces (Dashboard, Inbox, Tâches, Routines, Suivi, Bibliothèque)
- [ ] **(Phase 2)** Bascule Contextuelle (Perso / Travail)
- [ ] **(Phase 2)** Système de fiches enrichies (Notes + Résumés)

### 7. Structure Cible (Phase 2)
- **Dashboard** : Tâches prioritaires + Capture rapide + Bascule contexte.
- **Inbox** : Point d'entrée unique pour triage.
- **Tâches** : Séparation stricte Perso/Travail.
- **Routines** : Suivi d'habitudes.
- **Suivi** : Journal de données (Santé, migraines, etc.).
- **Bibliothèque** : Références et contenus externes.


