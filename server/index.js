import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'database.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Clé API simple pour V1 (À configurer via variable d'environnement en prod)
const API_KEY = process.env.API_KEY || 'capture-flow-secret-key';

// Middleware de sécurité
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Accès non autorisé (Clé API manquante ou invalide)' });
  }
};

// Initialisation de la "base de données" (fichier JSON)
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({ inbox: [] }, null, 2));
  }
}

// Endpoint Webhook - POST /api/inbox (Protéger par clé API)
app.post('/api/inbox', authMiddleware, async (req, res) => {
  const { text, context, source } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'Texte manquant' });
  }

  try {
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    const newEntry = {
      id: Date.now().toString(),
      text,
      context,
      source: source || 'external',
      receivedAt: new Date().toISOString()
    };
    
    data.inbox.push(newEntry);
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));

    console.log(`[Inbox] Nouveau message reçu via ${source || 'inconnu'}`);
    
    res.json({ 
      success: true, 
      message: "Entrée reçue et stockée", 
      created: 1 
    });
  } catch (error) {
    console.error('Erreur stockage:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoint Fetch - GET /api/inbox (Protéger par clé API pour la synchro frontend)
app.get('/api/inbox', authMiddleware, async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    const currentInbox = [...data.inbox];
    
    // On vide l'inbox après lecture (consommation par le frontend)
    data.inbox = [];
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    
    res.json(currentInbox);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lecture' });
  }
});

// Santé du serveur
app.get('/health', (req, res) => res.send('Backend CaptureFlow is running!'));

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Serveur Backend CaptureFlow démarré !
------------------------------------------
URL Webhook (POST) : http://localhost:${PORT}/api/inbox
URL Fetch (GET)     : http://localhost:${PORT}/api/inbox
Health Check       : http://localhost:${PORT}/health
------------------------------------------
Port : ${PORT} (Prêt pour déploiement distant)
    `);
  });
});
