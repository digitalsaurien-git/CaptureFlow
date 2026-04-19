# Evolution de CaptureFlow - Phase 2 : Organisation par Espaces

## 1. Vision d'Architecture
CaptureFlow évolue d'un simple flux chronologique vers un système d'organisation par contextes et espaces dédiés, tout en gardant une capture unique et sans friction.

## 2. Structure Fonctionnelle Recommandée

### A. Flux d'Information (Le "Pipeline")
1. **CAPTURE** (Text, Voice, Webhook) -> toujours vers la **INBOX**.
2. **TRAITEMENT** (Inbox) -> l'utilisateur qualifie l'entrée :
   - Type : Tâche, Routine, Suivi, Référence.
   - Contexte : Perso, Travail.
3. **STOKAGE & CONSULTATION** -> l'entrée disparaît de l'Inbox et apparaît dans l'**ESPACE** dédié.

### B. Les Espaces (Menus)
- **Dashboard (Accueil)** : Vue d'ensemble minimaliste.
- **Inbox** : Le sas de traitement (Boîte d'entrée).
- **Tâches** : Gestion des actions (onglets Perso/Travail).
- **Routines** : Habitudes et exercices répétitifs.
- **Suivi** : Données quantitatives/états (Santé, migraines, voiture).
- **Bibliothèque** : Contenus statiques et références (Livres, résumés).

## 3. Données Minimales à Stocker (Schéma JSON)
Chaque entrée disposera des champs suivants :
- `id`: unique identifier.
- `rawContent`: texte brut capturé.
- `title`: titre généré ou résumé court.
- `notes`: contenu détaillé.
- `type`: `inbox` | `task` | `routine` | `tracking` | `reference`.
- `context`: `perso` | `work`.
- `status`: `todo` | `done` | `archived`.
- `timestamp`: date de création.
- `metadata`: (optionnel) ex: `{ intensity: 5 }` pour migraines.

## 4. Plan de Mise en Œuvre

### Phase 1 : Consolidation du Store et Navigation (Immédiat)
- [ ] Mettre à jour `store.js` pour gérer les nouveaux `type` et le filtrage par `context`.
- [ ] Créer la barre de navigation principale (Bottom Nav pour mobile-first).
- [ ] Implémenter le Dashboard léger.

### Phase 2 : Traitement de l'Inbox
- [ ] Transformer la liste actuelle en "Inbox" avec boutons de classification rapide.
- [ ] Ajout d'une fiche détail enrichie (Résumé + Notes).

### Phase 3 : Déploiement des Espaces
- [ ] Écran Tâches (Bascule UI Perso/Travail).
- [ ] Écran Routines (Liste simple avec "Check" journalier).
- [ ] Écran Suivi (Saisie rapide de mesures).
- [ ] Écran Bibliothèque (Liste de cartes avec source future Notion en tête).

### Phase 4 : Améliorations UX
- [ ] Dictée vocale améliorée avec auto-classification.
- [ ] Webhook enrichi pour iPhone.

## 5. Ce qui peut être ajouté tout de suite (Quick Wins)
1. **La barre de navigation** : Permet de circuler entre les futurs espaces même s'ils sont vides au départ.
2. **Le sélecteur Perso/Travail** au niveau global (Dashboard).
3. **Le type 'inbox' par défaut** pour toutes les nouvelles entrées.
4. **Classification automatique des tâches** : Les entrées contenant des verbes d'action (acheter, appeler, finir, etc.) sont directement routées vers l'espace Tâches.
