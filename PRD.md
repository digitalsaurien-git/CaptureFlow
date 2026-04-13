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

### 4. Spécifications Techniques (Stack V1)
- **Frontend** : Vite + React.
- **Styling** : Vanilla CSS (Modern, Responsive, Mobile-first).
- **Logique IA** : Local simulation / Regex pour la V1 (évolutif vers LLM/Integrations).
- **Stockage** : LocalStorage (pour la V1 - "full portable").
- **Déploiement** : GitHub Pages ou similaire.

### 5. Design & UX
- **Esthétique** : Design sobre, premium, rassurant (vibrant mais calme).
- **Expérience** : < 3 clics pour capturer une idée.
- **Typographie** : Inter ou Outfit (Google Fonts).

### 6. Fonctionnalités Développées (Suivi)
- [ ] Initialisation du projet (CaptureFlow structure)
- [ ] Configuration du système de design (CSS Variables, Typography)
- [ ] Écran d'accueil (Capture + Historique)
- [ ] Vue "Aujourd'hui"
- [ ] Vue "Toutes les entrées" + Filtres
- [ ] Fiche détail & Mode Édition
- [ ] Logique de classification automatique
- [ ] Intégration Voix (Web Speech API)
