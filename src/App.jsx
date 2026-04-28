import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { supabase, isSupabaseConfigured } from './supabase';

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
  Check,
  CheckCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  Clock,
  Inbox,
  Layout,
  Repeat,
  Heart,
  BookOpen,
  Briefcase,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Hooks ---

const useSpeechRecognition = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;

    let finalTranscript = '';

    rec.onstart = () => setIsListening(true);
    rec.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        onResult(finalTranscript);
      }
    };
    rec.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
    };
    rec.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };

    rec.start();
    setRecognition(rec);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  return { isListening, startListening, stopListening };
};



// --- Sub-components ---

const BottomNav = ({ activeTab, setActiveTab }) => (
  <nav className="bottom-nav">
    <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
      <Layout size={24} />
      <span>Focus</span>
    </button>
    <button onClick={() => setActiveTab('inbox')} className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}>
      <Inbox size={24} />
      <span>Inbox</span>
    </button>
    <button onClick={() => setActiveTab('tasks')} className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}>
      <CheckCircle size={24} />
      <span>Tâches</span>
    </button>
    <button onClick={() => setActiveTab('more')} className={`nav-item ${activeTab === 'more' ? 'active' : ''}`}>
      <List size={24} />
      <span>Plus</span>
    </button>
  </nav>
);

const Sidebar = ({ activeTab, setActiveTab }) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <div className="sidebar-logo">CaptureFlow</div>
    </div>
    <nav className="sidebar-menu">
      <button onClick={() => setActiveTab('dashboard')} className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
        <Layout size={20} />
        <span>Tableau de bord</span>
      </button>
      <button onClick={() => setActiveTab('inbox')} className={`sidebar-item ${activeTab === 'inbox' ? 'active' : ''}`}>
        <Inbox size={20} />
        <span>Boîte d'entrée</span>
      </button>
      <button onClick={() => setActiveTab('tasks')} className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}>
        <CheckCircle size={20} />
        <span>Mes Tâches</span>
      </button>
      <button onClick={() => setActiveTab('routines')} className={`sidebar-item ${activeTab === 'routines' ? 'active' : ''}`}>
        <Repeat size={20} />
        <span>Routines</span>
      </button>
      <button onClick={() => setActiveTab('rituals')} className={`sidebar-item ${activeTab === 'rituals' ? 'active' : ''}`}>
        <Check size={20} />
        <span>Rituels</span>
      </button>
      <button onClick={() => setActiveTab('tracking')} className={`sidebar-item ${activeTab === 'tracking' ? 'active' : ''}`}>
        <Heart size={20} />
        <span>Suivi</span>
      </button>
      <button onClick={() => setActiveTab('library')} className={`sidebar-item ${activeTab === 'library' ? 'active' : ''}`}>
        <BookOpen size={20} />
        <span>Bibliothèque</span>
      </button>
    </nav>
    <div style={{ marginTop: 'auto', padding: '16px' }}>
      <button onClick={() => supabase.auth.signOut()} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontSize: '14px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
        <span>Déconnexion</span>
      </button>
    </div>
  </aside>
);

const ContextToggle = ({ activeContext, setActiveContext }) => (
  <div className="context-toggle">
    <button 
      className={activeContext === 'perso' ? 'active' : ''} 
      onClick={() => setActiveContext('perso')}
    >
      <User size={16} />
      <span>Perso</span>
    </button>
    <button 
      className={activeContext === 'work' ? 'active' : ''} 
      onClick={() => setActiveContext('work')}
    >
      <Briefcase size={16} />
      <span>Travail</span>
    </button>
  </div>
);

const EntryCard = ({ entry, onClick, onDelete }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card" 
    style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer', position: 'relative' }}
  >
    <div onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span className="tag">{entry.category}</span>
        <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginRight: '24px' }}>
          {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{entry.reformulatedContent}</h3>
      <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {entry.rawContent}
      </p>
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className={`status-dot status-${entry.status.replace(/\s/g, '-')}`} />
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>{entry.status}</span>
        </div>
        
        {(entry.dueDate || entry.dueTime) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}>
            <Clock size={14} />
            <span>{entry.dueDate} {entry.dueTime}</span>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', opacity: 0.6 }}>{entry.type}</span>
      </div>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); if(confirm("Supprimer ?")) onDelete(entry.id); }}
      style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--error)', opacity: 0.5 }}
    >
      <X size={18} />
    </button>
  </motion.div>
);

const EmptyState = ({ icon: Icon, title, description, example, actionLabel }) => (
  <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface-low)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
    <Icon size={48} style={{ color: 'var(--primary)', opacity: 0.5, marginBottom: '20px' }} />
    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{title}</h3>
    <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '20px', lineHeight: '1.5' }}>{description}</p>
    <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px', fontSize: '12px', display: 'inline-block', border: '1px solid var(--border-color)' }}>
      <span style={{ opacity: 0.5, marginRight: '8px' }}>Exemple :</span>
      <span style={{ fontStyle: 'italic', fontWeight: '500' }}>"{example}"</span>
    </div>
    {actionLabel && (
      <div style={{ marginTop: '24px', fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
         ↑ {actionLabel}
      </div>
    )}
  </div>
);


// --- Main Screens ---

const DashboardScreen = ({ entries, rituals, ritualLogs, onAddLog, activeContext, setActiveContext, onAddEntry, onEntryClick, onDeleteEntry, onNavigate }) => {
  const [inputText, setInputText] = useState('');
  const { isListening, startListening, stopListening } = useSpeechRecognition((transcript) => {
    if (transcript.trim()) {
      onAddEntry(transcript, { context: activeContext });
    }
  });

  const handleAdd = () => {
    if (inputText.trim()) {
      onAddEntry(inputText, { context: activeContext });
      setInputText('');
    }
  };

  const priorityTasks = entries.filter(e => 
    e.type === 'task' && 
    e.context === activeContext && 
    e.status === 'todo'
  ).slice(0, 3);

  const inboxCount = entries.filter(e => e.type === 'inbox').length;

  const today = new Date().toISOString().split('T')[0];
  const activeRituals = rituals?.filter(r => r.isActive) || [];

  return (
    <div className="app-container">
      <header className="screen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1>CaptureFlow</h1>
          <SyncStatus />
        </div>
        <div style={{ marginTop: '20px' }}>
          <ContextToggle activeContext={activeContext} setActiveContext={setActiveContext} />
        </div>
      </header>

      {entries.length < 3 && (
        <section style={{ marginBottom: '32px', padding: '24px', background: 'var(--primary-container)', borderRadius: '24px', color: 'var(--on-primary-container)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Bienvenue 👋</h2>
          <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5', marginBottom: '16px' }}>
            Capturez vos pensées brutes ici. L'application extrait automatiquement les tâches, les dates et les classe pour vous.
          </p>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase' }}>
            <span>Saisie</span> → <span>Inbox</span> → <span>Classification</span>
          </div>
        </section>
      )}

      <section className="glass-card capture-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? <Check size={28} /> : <Mic size={28} />}
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Notez quelque chose..." 
              style={{ width: '100%', height: '56px', borderRadius: '28px' }}
            />
            <button className="add-button" onClick={handleAdd}>
              <Plus size={20} />
            </button>
          </div>
        </div>
      </section>

      {inboxCount > 0 && (
        <div 
          onClick={() => onNavigate('inbox')}
          className="inbox-alert" 
          style={{ 
            marginBottom: '32px', padding: '16px 20px', borderRadius: '16px', 
            background: 'var(--surface)', border: '1px solid var(--primary)', color: 'var(--primary)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Inbox size={18} />
            <span>{inboxCount} élément{inboxCount > 1 ? 's' : ''} à trier maintenant</span>
          </div>
          <ChevronRight size={18} />
        </div>
      )}

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Priorités du moment</h2>
        </div>
        {priorityTasks.length > 0 ? (
          priorityTasks.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} onDelete={onDeleteEntry} />
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '14px', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
             Utilisez la capture ci-dessus pour ajouter des tâches.
          </div>
        )}
      </section>

      <section style={{ marginTop: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Rituels du jour</h2>
          <button onClick={() => onNavigate('rituals')} style={{ fontSize: '12px', opacity: 0.7, display: 'flex', alignItems: 'center' }}>
            Voir tout <ChevronRight size={14} />
          </button>
        </div>
        {activeRituals.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeRituals.map(ritual => {
              const log = ritualLogs?.find(l => l.ritualId === ritual.id && l.date === today);
              const isDone = log?.status === 'done';
              return (
                <div key={ritual.id} 
                  onClick={() => onAddLog(ritual.id, today, isDone ? 'skipped' : 'done', null, null)}
                  className="glass-card" 
                  style={{ 
                    cursor: 'pointer', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: isDone ? 'var(--primary-container)' : 'var(--surface)',
                    color: isDone ? 'var(--on-primary-container)' : 'var(--on-surface)'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', border: '2px solid',
                      borderColor: isDone ? 'var(--primary)' : 'var(--on-surface-variant)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'var(--primary)' : 'transparent'
                    }}>
                      {isDone && <Check size={14} color="var(--on-primary)" />}
                    </div>
                    <span style={{ fontWeight: '500', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.7 : 1 }}>
                      {ritual.name}
                    </span>
                  </div>
                  {ritual.isMinimumVital && <span style={{ fontSize: '12px', opacity: 0.5 }}>Min. Vital</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--surface-high)', fontSize: '14px', opacity: 0.7 }}>
            Aucun rituel actif.
          </div>
        )}
      </section>

      <section style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button onClick={() => onNavigate('routines')} className="space-link" style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '16px', textAlign: 'left' }}>
          <Repeat size={20} style={{ marginBottom: '8px', color: 'var(--primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '14px' }}>Routines</div>
          <div style={{ fontSize: '11px', opacity: 0.5 }}>Habitudes & répétitions</div>
        </button>
        <button onClick={() => onNavigate('tracking')} className="space-link" style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '16px', textAlign: 'left' }}>
          <Heart size={20} style={{ marginBottom: '8px', color: 'var(--error)' }} />
          <div style={{ fontWeight: '700', fontSize: '14px' }}>Suivi</div>
          <div style={{ fontSize: '11px', opacity: 0.5 }}>Santé & mesures</div>
        </button>
        <button onClick={() => onNavigate('library')} className="space-link" style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '16px', textAlign: 'left', gridColumn: 'span 2' }}>
          <BookOpen size={20} style={{ marginBottom: '8px', color: 'var(--secondary)' }} />
          <div style={{ fontWeight: '700', fontSize: '14px' }}>Bibliothèque</div>
          <div style={{ fontSize: '11px', opacity: 0.5 }}>Références, liens & archives</div>
        </button>
      </section>
    </div>
  );
};

const InboxScreen = ({ entries, onEntryClick, onDeleteEntry, onUpdateEntry }) => {
  const inboxItems = entries.filter(e => e.type === 'inbox');

  return (
    <div className="app-container">
      <header className="screen-header">
        <h1>Boîte d'entrée</h1>
        <p>{inboxItems.length} élément{inboxItems.length > 1 ? 's' : ''} en attente</p>
      </header>

      {inboxItems.length > 0 ? (
        inboxItems.map(entry => (
          <div key={entry.id} style={{ position: 'relative', marginBottom: '16px' }}>
            <EntryCard entry={entry} onClick={() => onEntryClick(entry)} onDelete={onDeleteEntry} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '-4px', paddingBottom: '12px', paddingLeft: '8px' }}>
               <button onClick={() => onUpdateEntry(entry.id, { type: 'task' })} className="tag" style={{ background: 'var(--primary-container)' }}>Tâche</button>
               <button onClick={() => onUpdateEntry(entry.id, { type: 'routine' })} className="tag">Routine</button>
               <button onClick={() => onUpdateEntry(entry.id, { type: 'tracking' })} className="tag">Suivi</button>
               <button onClick={() => onUpdateEntry(entry.id, { type: 'reference' })} className="tag">Référence</button>
            </div>
          </div>
        ))
      ) : (
        <EmptyState 
           icon={Inbox}
           title="Boîte d'entrée vide"
           description="Tout commence ici. Capturez vos idées brutes sans réfléchir, vous pourrez les traiter plus tard."
           example="Acheter du pain pour ce soir"
           actionLabel="Utilisez la capture rapide sur le tableau de bord"
        />
      )}
    </div>
  );
};

const TasksScreen = ({ entries, activeContext, setActiveContext, onEntryClick, onDeleteEntry }) => {
  const tasks = entries.filter(e => e.type === 'task' && e.context === activeContext);

  return (
    <div className="app-container">
      <header className="screen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1>Mes Tâches</h1>
          <ContextToggle activeContext={activeContext} setActiveContext={setActiveContext} />
        </div>
      </header>

      <section>
        {tasks.length > 0 ? (
          tasks.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} onDelete={onDeleteEntry} />
          ))
        ) : (
          <EmptyState 
            icon={CheckCircle}
            title={`Aucune tâche ${activeContext === 'perso' ? 'personnelle' : 'professionnelle'}`}
            description="Organisez vos actions. Séparez le pro du perso avec le sélecteur ci-dessus."
            example={activeContext === 'perso' ? "Appeler le dentiste mardi 10h" : "Finir le rapport de performance"}
          />
        )}
      </section>
    </div>
  );
};

const MoreScreen = ({ entries, onEntryClick, onDeleteEntry, explicitType }) => {
  const [activeSubTab, setActiveSubTab] = useState(explicitType || 'routines'); // routines | tracking | reference

  const filtered = entries.filter(e => {
    if (activeSubTab === 'routines') return e.type === 'routine';
    if (activeSubTab === 'tracking') return e.type === 'tracking';
    if (activeSubTab === 'reference') return e.type === 'reference';
    return false;
  });

  const getTitle = () => {
    if (activeSubTab === 'routines') return 'Routines';
    if (activeSubTab === 'tracking') return 'Suivi';
    if (activeSubTab === 'reference') return 'Bibliothèque';
  };

  const getEmptyState = () => {
    if (activeSubTab === 'routines') return {
      icon: Repeat,
      title: "Aucune routine",
      description: "Le secret est dans la répétition. Suivez vos habitudes quotidiennes ici.",
      example: "Méditation 10 minutes chaque matin"
    };
    if (activeSubTab === 'tracking') return {
      icon: Heart,
      title: "Aucun suivi",
      description: "Mesurez ce qui compte pour vous : santé, budget, ou progrès personnels.",
      example: "Migraine intensité 7/10 ce matin"
    };
    return {
      icon: BookOpen,
      title: "Bibliothèque vide",
      description: "Archivez vos ressources pour ne jamais les perdre (liens, livres, notes).",
      example: "Lien vers la documentation React"
    };
  };

  const empty = getEmptyState();

  return (
    <div className="app-container">
      <header className="screen-header">
        <h1>{getTitle()}</h1>
      </header>

      {/* Only show subtabs on mobile/More view */}
      {!explicitType && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button onClick={() => setActiveSubTab('routines')} className={`tag ${activeSubTab === 'routines' ? 'active-tag' : ''}`}>Routines</button>
          <button onClick={() => setActiveSubTab('tracking')} className={`tag ${activeSubTab === 'tracking' ? 'active-tag' : ''}`}>Suivi</button>
          <button onClick={() => setActiveSubTab('reference')} className={`tag ${activeSubTab === 'reference' ? 'active-tag' : ''}`}>Bibliothèque</button>
        </div>
      )}

      <section>
        {filtered.length > 0 ? (
          filtered.map(entry => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onEntryClick(entry)} onDelete={onDeleteEntry} />
          ))
        ) : (
          <EmptyState {...empty} />
        )}
      </section>
    </div>
  );
};

const RitualsScreen = ({ rituals, ritualLogs, onAddRitual, onUpdateRitual, onAddLog }) => {
  const [newRitualName, setNewRitualName] = useState('');
  const [isMinVitalMode, setIsMinVitalMode] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    if (newRitualName.trim()) {
      onAddRitual({ name: newRitualName.trim(), isMinimumVital: isMinVitalMode });
      setNewRitualName('');
    }
  };

  const getLogForDay = (ritualId, dateStr) => {
    return ritualLogs.find(l => l.ritualId === ritualId && l.date === dateStr);
  };

  const toggleLog = (ritualId, dateStr) => {
    const log = getLogForDay(ritualId, dateStr);
    const newStatus = log?.status === 'done' ? 'skipped' : 'done';
    onAddLog(ritualId, dateStr, newStatus, null, null);
  };

  // Generate last 7 days
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const activeRituals = rituals.filter(r => r.isActive && (!isMinVitalMode || r.isMinimumVital));

  return (
    <div className="app-container">
      <header className="screen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1>Rituels</h1>
          <button 
            onClick={() => setIsMinVitalMode(!isMinVitalMode)}
            className={`tag ${isMinVitalMode ? 'active-tag' : ''}`}
            style={{ fontWeight: '600' }}
          >
            Minimum Vital
          </button>
        </div>
      </header>

      <section className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <input 
          value={newRitualName}
          onChange={(e) => setNewRitualName(e.target.value)}
          placeholder="Nouveau rituel..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--on-surface)' }}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} className="add-button" style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Plus size={20} />
        </button>
      </section>

      <section>
        {activeRituals.map(ritual => (
          <div key={ritual.id} className="glass-card" style={{ padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                {ritual.name}
                {ritual.isMinimumVital && <span style={{ color: 'var(--primary)', marginLeft: '8px', fontSize: '12px' }}>★</span>}
              </h3>
              <button 
                onClick={() => onUpdateRitual(ritual.id, { isActive: false })}
                style={{ fontSize: '12px', opacity: 0.5 }}
              >
                Archiver
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
              {last7Days.map(dateStr => {
                const log = getLogForDay(ritual.id, dateStr);
                const isToday = dateStr === today;
                return (
                  <button 
                    key={dateStr}
                    onClick={() => toggleLog(ritual.id, dateStr)}
                    style={{ 
                      flex: 1, 
                      height: '36px', 
                      borderRadius: '6px',
                      background: log?.status === 'done' ? 'var(--primary)' : 'var(--surface-high)',
                      border: isToday ? '1px solid var(--on-surface)' : 'none',
                      opacity: isToday ? 1 : 0.7,
                      color: log?.status === 'done' ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title={dateStr}
                  >
                    {log?.status === 'done' && <Check size={16} />}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', opacity: 0.5 }}>
              <span>J-6</span>
              <span>Aujourd'hui</span>
            </div>
          </div>
        ))}
        {activeRituals.length === 0 && (
          <EmptyState 
            icon={CheckCircle}
            title="Aucun rituel actif"
            description="Créez des rituels pour construire vos habitudes quotidiennes."
            example="Méditation, Lecture, Sport..."
          />
        )}
      </section>
    </div>
  );
};


const DetailView = ({ entry, onClose, onUpdate, onDelete }) => {
  const [reformulated, setReformulated] = useState(entry.reformulatedContent);
  const [notes, setNotes] = useState(entry.notes || '');
  const [type, setType] = useState(entry.type);
  const [context, setContext] = useState(entry.context || 'perso');
  const [status, setStatus] = useState(entry.status);

  const handleSave = () => {
    onUpdate(entry.id, { reformulatedContent: reformulated, notes, type, context, status });
    onClose();
  };

  const types = ['inbox', 'task', 'routine', 'tracking', 'reference'];
  const statuses = ['todo', 'done', 'archived'];

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

      <section style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Notes & Détails</label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter des notes pour reprendre plus tard..."
          style={{ width: '100%', minHeight: '100px', fontSize: '16px', lineHeight: '1.4', background: 'var(--surface-high)' }}
        />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%' }}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '8px' }}>Contexte</label>
          <select value={context} onChange={(e) => setContext(e.target.value)} style={{ width: '100%' }}>
             <option value="perso">Perso</option>
             <option value="work">Travail</option>
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

const SyncStatus = () => {
  const { isSyncing, lastSyncError } = useStore();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`sync-indicator ${lastSyncError ? 'offline' : (isSyncing ? 'syncing' : 'online')}`}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '6px', 
        fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
        padding: '6px 12px', borderRadius: '100px',
        background: 'var(--surface-high)',
        color: lastSyncError ? 'var(--error)' : 'var(--on-surface-variant)'
      }}
    >
      {isSyncing ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCw size={14} />
        </motion.div>
      ) : lastSyncError ? (
        <CloudOff size={14} />
      ) : (
        <Cloud size={14} style={{ color: 'var(--primary)' }} />
      )}
      <span>{isSyncing ? 'Synchronisation' : (lastSyncError ? 'Hors-ligne' : 'Cloud Prêt')}</span>
    </motion.div>
  );
};

// --- Main App ---

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color)', color: 'var(--on-surface)' }}>
      <form onSubmit={handleLogin} className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>CaptureFlow Login</h2>
        {error && <div style={{ color: 'var(--error)', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--on-surface)' }} />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--on-surface)' }} />
        <button type="submit" disabled={loading} style={{ height: '48px', borderRadius: '8px', width: '100%', background: 'var(--primary)', color: 'var(--on-primary)', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthInitialized(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthInitialized(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authInitialized) return null;

  if (!isSupabaseConfigured) {
    return (
      <div style={{ 
        display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', 
        background: 'var(--bg-color)', color: 'var(--on-surface)', textAlign: 'center', padding: '20px' 
      }}>
        <div className="glass-card" style={{ padding: '40px', maxWidth: '500px', border: '1px solid var(--error)' }}>
          <CloudOff size={48} style={{ color: 'var(--error)', marginBottom: '20px' }} />
          <h2 style={{ marginBottom: '16px', color: 'var(--error)' }}>Configuration Manquante</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '24px' }}>
            Les variables d'environnement <strong>VITE_SUPABASE_URL</strong> et <strong>VITE_SUPABASE_ANON_KEY</strong> sont absentes de votre fichier .env.local.
          </p>
          <div style={{ background: 'var(--surface-high)', padding: '16px', borderRadius: '12px', fontSize: '13px', textAlign: 'left', fontFamily: 'monospace' }}>
            # Exemple .env.local<br/>
            VITE_SUPABASE_URL=votre_url<br/>
            VITE_SUPABASE_ANON_KEY=votre_cle
          </div>
          <p style={{ marginTop: '24px', fontSize: '14px', opacity: 0.7 }}>
            Veuillez configurer ces variables et redémarrer le serveur Vite.
          </p>
        </div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return <CaptureFlowMain />;
}


function CaptureFlowMain() {
  const { 
    entries, 
    rituals,
    ritualLogs,
    activeContext, 
    setActiveContext, 
    addEntry, 
    updateEntry, 
    deleteEntry, 
    addRitual,
    updateRitual,
    addRitualLog,
    syncWebhook 
  } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    syncWebhook();
    const interval = setInterval(() => {
      syncWebhook();
    }, 20000);

    const handleFocus = () => syncWebhook();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncWebhook]);

  const renderScreen = () => {
    switch(activeTab) {
      case 'dashboard': 
        return <DashboardScreen entries={entries} rituals={rituals} ritualLogs={ritualLogs} onAddLog={addRitualLog} activeContext={activeContext} setActiveContext={setActiveContext} onAddEntry={addEntry} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} onNavigate={setActiveTab} />;
      case 'inbox': 
        return <InboxScreen entries={entries} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} onUpdateEntry={updateEntry} />;
      case 'tasks': 
        return <TasksScreen entries={entries} activeContext={activeContext} setActiveContext={setActiveContext} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} />;
      case 'routines':
        return <MoreScreen key="routines" entries={entries} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} explicitType="routines" />;
      case 'rituals':
        return <RitualsScreen rituals={rituals} ritualLogs={ritualLogs} onAddRitual={addRitual} onUpdateRitual={updateRitual} onAddLog={addRitualLog} />;
      case 'tracking':
        return <MoreScreen key="tracking" entries={entries} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} explicitType="tracking" />;
      case 'library':
        return <MoreScreen key="library" entries={entries} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} explicitType="reference" />;
      case 'more': 
        return <MoreScreen key="more" entries={entries} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} />;
      default: 
        return <DashboardScreen entries={entries} rituals={rituals} ritualLogs={ritualLogs} onAddLog={addRitualLog} activeContext={activeContext} setActiveContext={setActiveContext} onAddEntry={addEntry} onEntryClick={setSelectedEntry} onDeleteEntry={deleteEntry} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="App app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {renderScreen()}
      </main>
      
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
