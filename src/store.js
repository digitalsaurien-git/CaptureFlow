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

  const addEntry = (rawContent) => {
    // Basic AI simulation for V1
    const classification = classifyContent(rawContent);
    
    const newEntry = {
      id: crypto.randomUUID(),
      rawContent,
      reformulatedContent: classification.reformulated,
      type: classification.type,
      category: classification.category,
      status: 'à traiter',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };

    const updated = [newEntry, ...entries];
    saveEntries(updated);
    return newEntry;
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

  return { entries, addEntry, updateEntry, deleteEntry };
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
