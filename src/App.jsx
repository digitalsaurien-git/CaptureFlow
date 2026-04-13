import React, { useState } from 'react';
import { useStore } from './store';
import { 
  Plus, 
  Mic, 
  Home, 
  Calendar, 
  List, 
  Settings, 
  ChevronRight, 
  Search,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Hooks ---

const useSpeechRecognition = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.start();
  };

  return { isListening, startListening };
};


// --- Sub-components ---

const BottomNav = ({ activeTab, setActiveTab }) => (
  <nav className="bottom-nav">
    <button onClick={() => setActiveTab('home')} className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
      <Home size={24} />
      <span>Accueil</span>
    </button>
    <button onClick={() => setActiveTab('today')} className={`nav-item ${activeTab === 'today' ? 'active' : ''}`}>
      <Calendar size={24} />
      <span>Aujourd'hui</span>
    </button>
    <button onClick={() => setActiveTab('all')} className={`nav-item ${activeTab === 'all' ? 'active' : ''}`}>
      <List size={24} />
      <span>Toutes</span>
    </button>
    <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
      <Settings size={24} />
      <span>Paramètres</span>
    </button>
  </nav>
);

const EntryCard = ({ entry, onClick }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="glass-card" 
    style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <span className="tag">{entry.category}</span>
      <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
        {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{entry.reformulatedContent}</h3>
    <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {entry.rawContent}
    </p>
    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center' }}>
      <span className={`status-dot status-${entry.status.replace(/\s/g, '-')}`} />
      <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{entry.status}</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: '11px', opacity: 0.6 }}>{entry.type}</span>
    </div>
  </motion.div>
);

// --- Main Screens ---

const HomeScreen = ({ entries, onAddEntry, onEntryClick }) => {
  const [inputText, setInputText] = useState('');
  const { isListening, startListening } = useSpeechRecognition((transcript) => {
    onAddEntry(transcript);
  });


  const handleAdd = () => {
    if (inputText.trim()) {
      onAddEntry(inputText);
      setInputText('');
    }
  };

  return (
    <div className="app-container">
      <header className="screen-header">
        <h1>CaptureFlow</h1>
        <p>Libérez votre esprit instantanément</p>
      </header>

      <section className="glass-card" style={{ padding: '24px', marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '500' }}>Que voulez-vous capturer ?</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            style={{ 
              width: '64px', height: '64px', borderRadius: '50%', 
              background: isListening ? '#ff4b4b' : 'var(--primary)', 
              color: isListening ? 'white' : 'var(--on-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              boxShadow: isListening ? '0 0 20px rgba(255, 75, 75, 0.4)' : '0 0 20px rgba(167, 200, 255, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onClick={startListening}
          >
            {isListening ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Mic size={32} />
              </motion.div>
            ) : (
              <Mic size={32} />
            )}
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Écrivez quelque chose..." 
              style={{ width: '100%', height: '64px', paddingLeft: '20px', paddingRight: '60px', borderRadius: '32px' }}
            />
            <button 
              onClick={handleAdd}
              style={{ position: 'absolute', right: '12px', top: '12px', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px' }}>Récents</h2>
          <ChevronRight size={20} style={{ opacity: 0.5 }} />
        </div>
        {entries.slice(0, 5).map(entry => (
          <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} />
        ))}
      </section>
    </div>
  );
};

const TodayScreen = ({ entries, onEntryClick }) => {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayEntries = entries.filter(e => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const tasks = todayEntries.filter(e => e.type === 'tâche');
  const others = todayEntries.filter(e => e.type !== 'tâche');

  return (
    <div className="app-container">
      <header className="screen-header">
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}>Aujourd'hui</p>
        <h1 style={{ textTransform: 'capitalize' }}>{today}</h1>
      </header>

      {tasks.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--primary)' }}>Focus du jour</h2>
          {tasks.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} />
          ))}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Dernières captures</h2>
        {others.length > 0 ? (
          others.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} />
          ))
        ) : (
          <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>Rien pour l'instant. Capturez une idée !</p>
        )}
      </section>
    </div>
  );
};

const AllEntriesScreen = ({ entries, onEntryClick }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filtered = entries.filter(e => {
    const matchSearch = e.rawContent.toLowerCase().includes(search.toLowerCase()) || 
                       e.reformulatedContent.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || e.type === filterType;
    return matchSearch && matchType;
  });

  const types = ['All', 'tâche', 'note', 'idée', 'suivi', 'référence'];

  return (
    <div className="app-container">
      <header className="screen-header">
        <h1>Toutes les entrées</h1>
      </header>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', opacity: 0.5 }} />
          <input 
            placeholder="Rechercher..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '48px', height: '48px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {types.map(t => (
            <button 
              key={t}
              onClick={() => setFilterType(t)}
              className="tag"
              style={{ 
                background: filterType === t ? 'var(--primary)' : 'var(--surface-high)',
                color: filterType === t ? 'var(--on-primary)' : 'var(--primary)',
                whiteSpace: 'nowrap'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        {filtered.map(entry => (
          <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} />
        ))}
      </div>
    </div>
  );
};

const DetailView = ({ entry, onClose, onUpdate, onDelete }) => {
  const [reformulated, setReformulated] = useState(entry.reformulatedContent);
  const [type, setType] = useState(entry.type);
  const [category, setCategory] = useState(entry.category);
  const [status, setStatus] = useState(entry.status);

  const handleSave = () => {
    onUpdate(entry.id, { reformulatedContent: reformulated, type, category, status });
    onClose();
  };

  const types = ['tâche', 'note', 'idée', 'suivi', 'référence'];
  const categories = ['Travail', 'Perso', 'Courses', 'Santé', 'Bushcraft', 'Idées'];
  const statuses = ['à traiter', 'en cours', 'terminé', 'archivé'];

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'var(--bg-color)', zIndex: 200, padding: '24px',
        overflowY: 'auto'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={onClose} style={{ opacity: 0.7 }}><X size={28} /></button>
        <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Détails</h2>
        <button onClick={handleSave} style={{ color: 'var(--primary)', fontWeight: '700' }}>Enregistrer</button>
      </header>

      <section style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Contenu Reformulé</label>
        <textarea 
          value={reformulated}
          onChange={(e) => setReformulated(e.target.value)}
          style={{ width: '100%', minHeight: '120px', fontSize: '18px', lineHeight: '1.4', background: 'var(--surface-high)' }}
        />
      </section>

      <section style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Capture Originale</label>
        <div className="glass-card" style={{ padding: '16px', fontSize: '14px', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
          {entry.rawContent}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%' }}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Catégorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%' }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </section>

      <footer style={{ marginTop: 'auto', textAlign: 'center', opacity: 0.4, fontSize: '11px' }}>
        <p>Créé le {new Date(entry.createdAt).toLocaleString()}</p>
        <button 
          onClick={() => { if(confirm("Supprimer ?")) { onDelete(entry.id); onClose(); } }}
          style={{ marginTop: '24px', color: 'var(--error)' }}
        >
          Supprimer cette entrée
        </button>
      </footer>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const { entries, addEntry, updateEntry, deleteEntry } = useStore();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEntry, setSelectedEntry] = useState(null);

  const renderScreen = () => {
    switch(activeTab) {
      case 'home': return <HomeScreen entries={entries} onAddEntry={addEntry} onEntryClick={setSelectedEntry} />;
      case 'today': return <TodayScreen entries={entries} onEntryClick={setSelectedEntry} />;
      case 'all': return <AllEntriesScreen entries={entries} onEntryClick={setSelectedEntry} />;
      default: return <HomeScreen entries={entries} onAddEntry={addEntry} onEntryClick={setSelectedEntry} />;
    }
  };

  return (
    <div className="App">
      {renderScreen()}
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence>
        {selectedEntry && (
          <DetailView 
            entry={selectedEntry} 
            onClose={() => setSelectedEntry(null)} 
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
