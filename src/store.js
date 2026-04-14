import { useState, useEffect } from 'react';

const STORAGE_KEY = 'captureflow_entries';

export const useStore = () => {
  const [entries, setEntries] = useState([]);

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
          type: 'tâche',
          category: 'Bushcraft',
          status: 'à traiter',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        },
        {
          id: '2',
          rawContent: 'Idée de génie pour le projet CaptureFlow',
          reformulatedContent: 'Idée de génie pour le projet CaptureFlow',
          type: 'idée',
          category: 'Idées',
          status: 'en cours',
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
        type: classification.type,
        category: category,
        status: 'à traiter',
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
    // URL du backend (à modifier par l'URL de prod une fois déployé)
    const API_URL = 'http://localhost:3001/api/inbox';

    try {
      const response = await fetch(API_URL);
      if (!response.ok) return;
      
      const newItems = await response.json();
      if (newItems.length > 0) {
        console.log(`[Webhook] Synchronisation de ${newItems.length} nouveaux messages depis le serveur`);
        newItems.forEach(item => {
          addEntry(item.text, { 
            context: item.context, 
            source: item.source 
          });
        });
        return true;
      }
    } catch (error) {
      // On ne loggue l'erreur que si on n'est pas en mode "silencieux" pour éviter de polluer la console
      console.warn('[Backend Offline] Impossible de contacter le serveur d\'ingestion');
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

  return { entries, addEntry, updateEntry, deleteEntry, syncWebhook };
};

// V1 Classification Logic (Regex & Keywords)
const classifyContent = (text) => {
  const lowText = text.toLowerCase();
  
  let type = 'note';
  if (lowText.includes('faire') || lowText.includes('acheter') || lowText.includes('task')) type = 'tâche';
  if (lowText.includes('idée') || lowText.includes('penser à')) type = 'idée';
  if (lowText.includes('rappeler') || lowText.includes('suivi')) type = 'suivi';
  if (lowText.includes('lien') || lowText.includes('voir')) type = 'référence';

  let category = 'Perso';
  if (lowText.includes('boulot') || lowText.includes('travail') || lowText.includes('réunion')) category = 'Travail';
  if (lowText.includes('course') || lowText.includes('manger') || lowText.includes('magasin')) category = 'Courses';
  if (lowText.includes('santé') || lowText.includes('sport') || lowText.includes('docteur')) category = 'Santé';
  if (lowText.includes('bois') || lowText.includes('bushcraft') || lowText.includes('couteau')) category = 'Bushcraft';
  if (type === 'idée') category = 'Idées';

  // Basic reformulation simulation
  let reformulated = text.charAt(0).toUpperCase() + text.slice(1);
  if (type === 'tâche' && !lowText.startsWith('faire')) reformulated = `À faire : ${reformulated}`;

  return { type, category, reformulated };
};
