import { useState, useEffect } from 'react';

const STORAGE_KEY = 'captureflow_entries';
const API_KEY = 'capture-flow-secret-key'; // Doit matcher le backend

export const useStore = () => {
  const [entries, setEntries] = useState([]);
  const [activeContext, setActiveContext] = useState('perso'); // 'perso' | 'work'
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      // Sample data for V1
      const initial = [
        {
          id: '1',
          rawContent: 'Acheter des sardines pour le bivouac bushcraft',
          reformulatedContent: 'À faire : Acheter des sardines pour le bivouac bushcraft',
          type: 'task',
          category: 'Bushcraft',
          context: 'perso',
          status: 'todo',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        },
        {
          id: '2',
          rawContent: 'Idée de génie pour le projet CaptureFlow',
          reformulatedContent: 'Idée de génie pour le projet CaptureFlow',
          type: 'task',
          category: 'Idées',
          context: 'work',
          status: 'todo',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        }
      ];
      setEntries(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }, []);

  const saveEntries = (newEntries) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  };

  const addEntry = (rawContent, metadata = {}) => {
    // Split by common connectors: period, newline, or explicit keywords
    // This simulates AI segmentation for V1
    const segments = rawContent
      .split(/\. |\n| puis | ensuite | et aussi /i)
      .map(s => s.trim())
      .filter(s => s.length > 2);
    
    if (segments.length === 0) return [];

    const newEntries = segments.map(segment => {
      const classification = classifyContent(segment);
      
      // Override category if provided in metadata (e.g. from Shortcut)
      const category = metadata.context 
        ? (metadata.context.charAt(0).toUpperCase() + metadata.context.slice(1)) 
        : classification.category;

      return {
        id: crypto.randomUUID(),
        rawContent: segment,
        reformulatedContent: classification.reformulated,
        type: classification.type === 'task' ? 'task' : 'inbox', 
        category: category,
        context: metadata.context === 'work' ? 'work' : 'perso',
        status: 'todo',
        dueDate: classification.dueDate || null,
        dueTime: classification.dueTime || null,
        source: metadata.source || 'app',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };
    });

    const updated = [...newEntries, ...entries];
    saveEntries(updated);
    return newEntries;
  };

  const syncWebhook = async () => {
    const API_URL = 'http://localhost:3001/api/inbox';
    
    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const response = await fetch(API_URL, {
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const newItems = await response.json();
      if (newItems.length > 0) {
        console.log(`[Webhook] Synchronisation de ${newItems.length} messages`);
        newItems.forEach(item => {
          addEntry(item.text, { 
            context: item.context, 
            source: item.source 
          });
        });
        setIsSyncing(false);
        return true;
      }
    } catch (error) {
      console.warn('[Backend Offline]', error.message);
      setLastSyncError(error.message);
    } finally {
      // On laisse souffler un peu l'indicateur
      setTimeout(() => setIsSyncing(false), 800);
    }
    return false;
  };

  const updateEntry = (id, updates) => {
    const updated = entries.map(e => 
      e.id === id ? { ...e, ...updates, modifiedAt: new Date().toISOString() } : e
    );
    saveEntries(updated);
  };

  const deleteEntry = (id) => {
    const updated = entries.filter(e => e.id !== id);
    saveEntries(updated);
  };

  return { 
    entries, 
    activeContext, 
    setActiveContext, 
    addEntry, 
    updateEntry, 
    deleteEntry, 
    syncWebhook, 
    isSyncing, 
    lastSyncError 
  };
};

// V1 Classification Logic (Regex & Keywords)
const classifyContent = (text) => {
  const lowText = text.toLowerCase();
  
  let type = 'inbox';
  
  // Detection simple des tâches (mots d'action)
  const taskKeywords = [
    'faire', 'acheter', 'appeler', 'finir', 'réparer', 'penser à', 
    'rappeler', 'envoyer', 'donner', 'prendre', 'voir', 'task', 'rendez-vous'
  ];
  
  if (taskKeywords.some(kw => lowText.includes(kw))) {
    type = 'task';
  }

  // Extraction Date & Heure
  const { dueDate, dueTime, cleanText } = detectDateTime(text);

  // Autres types (restent dans l'Inbox si pas classés manuellement, mais detectés pour info)
  if (lowText.includes('suivi') || lowText.includes('santé') || lowText.includes('migraine')) type = 'tracking';
  if (lowText.includes('lien') || lowText.includes('voir') || lowText.includes('livre') || lowText.includes('notice')) type = 'reference';
  if (lowText.includes('habitude') || lowText.includes('routine') || lowText.includes('exercice')) type = 'routine';

  let category = 'Général';
  if (lowText.includes('boulot') || lowText.includes('travail') || lowText.includes('réunion')) category = 'Travail';
  if (lowText.includes('course') || lowText.includes('manger') || lowText.includes('magasin')) category = 'Courses';
  if (lowText.includes('santé') || lowText.includes('sport') || lowText.includes('docteur')) category = 'Santé';
  if (lowText.includes('bois') || lowText.includes('bushcraft') || lowText.includes('couteau')) category = 'Bushcraft';

  // Basic reformulation simulation
  let reformulated = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
  if (type === 'task' && !lowText.startsWith('faire') && !lowText.startsWith('à faire')) {
     reformulated = `À faire : ${reformulated}`;
  }

  return { type, category, reformulated, dueDate, dueTime };
};

const detectDateTime = (text) => {
  let lowText = text.toLowerCase();
  let dueDate = null;
  let dueTime = null;
  let cleanText = text;

  // 1. Détection de l'heure (ex: 8h, 14h30)
  const timeMatch = lowText.match(/(\d{1,2}h\d{0,2})/);
  if (timeMatch) {
    dueTime = timeMatch[1];
    cleanText = cleanText.replace(new RegExp(timeMatch[1], 'i'), '').trim();
  }

  // 2. Détection de la date / jour
  const dayKeywords = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche', 'demain', "aujourd'hui"];
  for (const day of dayKeywords) {
    if (lowText.includes(day)) {
      dueDate = day;
      cleanText = cleanText.replace(new RegExp(day, 'i'), '').trim();
      break; 
    }
  }

  // 3. Détection format date simple (21/04 ou le 21)
  const dateMatch = lowText.match(/(\d{1,2}\/\d{1,2})/) || lowText.match(/(?:le\s)(\d{1,2})/);
  if (dateMatch && !dueDate) {
    dueDate = dateMatch[1];
    cleanText = cleanText.replace(new RegExp(dateMatch[0], 'i'), '').trim();
  }

  // Nettoyage final des connecteurs orphelins (à, le, pour)
  cleanText = cleanText.replace(/\s(à|le|pour|au|ce|cette)\s?$/i, '').trim();
  // Double espaces
  cleanText = cleanText.replace(/\s\s+/g, ' ');

  return { dueDate, dueTime, cleanText };
};
