const STORAGE_KEY = "captureflow_local_v1";

const defaultState = {
  meta: { version: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  settings: { contextFilter: "all", priorityFilter: "all", currentView: "dashboard", dashboardTab: "overview", adminTab: "backup", activityTab: "summary", calendarMonth: new Date().toISOString().slice(0,7), currentProjectId: null, projectTab: "tasks" },
  projects: [],
  tasks: [],
  notes: [],
  activitySessions: [],
  improvements: [],
  recurringTasks: []
};

let state = loadState();
let fileHandle = null;
let cloudReady = false;
let cloudRevision = 0;
let cloudSaveTimer = null;
let cloudSaving = false;
let cloudSaveRequested = false;

const viewMeta = {
  dashboard: ["Tableau de bord", "Vue d’ensemble de ton activité"],
  today: ["Aujourd’hui", "Tes priorités et tâches du jour"],
  calendar: ["Calendrier", "Échéances et charge de travail par date"],
  inbox: ["Corbeille", "Tout ce que tu viens de capturer"],
  kanban: ["Kanban", "Déplace les cartes pour faire avancer ton travail"],
  projects: ["Projets", "Objectifs, progression et tâches associées"],
  activity: ["Journal d’activité", "Temps de travail, sessions, tâches et projets"],
  improvements: ["Améliorations", "Dicte et priorise les évolutions à apporter à l’application"],
  well: ["Le puits", "Idées et tâches mises de côté"],
  notes: ["Post-it", "Notes rapides et idées visuelles"],
  admin: ["Administration", "Sauvegardes, restauration et réglages"]
};

function uid(prefix="id"){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function esc(v=""){ return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDate(v){ if(!v) return ""; return new Date(v+"T12:00:00").toLocaleDateString("fr-FR"); }
function todayISO(){ return new Date().toISOString().slice(0,10); }

function normalizeState(parsed){
  const merged = { ...structuredClone(defaultState), ...(parsed||{}),
    meta:{...defaultState.meta,...(parsed?.meta||{})},
    settings:{...defaultState.settings,...(parsed?.settings||{})},
    projects:Array.isArray(parsed?.projects)?parsed.projects:[],
    tasks:Array.isArray(parsed?.tasks)?parsed.tasks:[],
    notes:Array.isArray(parsed?.notes)?parsed.notes:[],
    activitySessions:Array.isArray(parsed?.activitySessions)?parsed.activitySessions:[],
    improvements:Array.isArray(parsed?.improvements)?parsed.improvements:[],
    recurringTasks:Array.isArray(parsed?.recurringTasks)?parsed.recurringTasks:[]
  };
  merged.meta.version=6;
  merged.tasks.forEach((t,i)=>{
    if(!Array.isArray(t.checklist)) t.checklist=[];
    if(t.remaining===undefined) t.remaining="";
    if(t.manualOrder===undefined) t.manualOrder=i;
    if(t.legacyTimeSeconds===undefined){
      const journaled=merged.activitySessions.filter(s=>s.taskId===t.id).reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
      t.legacyTimeSeconds=Math.max(0,(Number(t.timeSpentSeconds)||0)-journaled);
    }
    if(t.legacyTimeReviewed===undefined) t.legacyTimeReviewed=false;
  });
  merged.improvements.forEach(item=>{ if(!item.context) item.context="pro"; });
  return merged;
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(defaultState);
    return normalizeState(JSON.parse(raw));
  }catch(e){
    console.error(e);
    return structuredClone(defaultState);
  }
}
function saveState(){
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const el = document.getElementById("saveState");
  if(el) el.textContent = cloudReady ? "Synchronisation en attente…" : "Copie locale enregistrée";
  queueCloudSave();
  renderCurrent();
}

function entityDate(item){ return item?.updatedAt||item?.endedAt||item?.createdAt||item?.startedAt||""; }
function mergeEntityArrays(current=[],incoming=[]){
  const byId=new Map();
  [...current,...incoming].forEach(item=>{
    if(!item?.id)return;
    const old=byId.get(item.id);
    if(!old||entityDate(item)>=entityDate(old))byId.set(item.id,item);
  });
  return [...byId.values()];
}
function mergeStates(current,incoming,forceContext=null){
  const next=normalizeState(incoming);
  const collections=["projects","tasks","notes","activitySessions","improvements","recurringTasks"];
  if(forceContext){
    collections.forEach(key=>next[key].forEach(item=>{item.context=forceContext;}));
    next.tasks.forEach(task=>{ task.timerStartedAt=null; });
  }
  const merged=normalizeState(current);
  collections.forEach(key=>{merged[key]=mergeEntityArrays(merged[key],next[key]);});
  merged.meta.updatedAt=new Date().toISOString();
  return merged;
}

function queueCloudSave(){
  if(!cloudReady)return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(flushCloudSave,450);
}
async function flushCloudSave(){
  if(!cloudReady)return;
  if(cloudSaving){cloudSaveRequested=true;return;}
  cloudSaving=true;
  const el=document.getElementById("saveState");
  if(el){el.className="save-state";el.textContent="Synchronisation…";}
  try{
    const response=await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:state,revision:cloudRevision})});
    const result=await response.json();
    if(response.status===401){showLogin();return;}
    if(response.status===409){
      cloudRevision=result.revision||0;
      state=mergeStates(result.data||defaultState,state);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      cloudSaveRequested=true;
    }else if(!response.ok) throw new Error(result.error||`Erreur ${response.status}`);
    else{
      cloudRevision=result.revision;
      if(el){el.className="save-state";el.textContent="Sauvegardé sur le serveur à "+new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}
    }
  }catch(error){
    console.error(error);
    if(el){el.className="save-state sync-error";el.textContent="Serveur indisponible — copie locale conservée";}
  }finally{
    cloudSaving=false;
    if(cloudSaveRequested){cloudSaveRequested=false;setTimeout(flushCloudSave,100);}
  }
}

function showLogin(message=""){
  cloudReady=false;
  document.getElementById("authScreen").classList.remove("hidden");
  const error=document.getElementById("loginError");
  error.textContent=message;error.classList.toggle("hidden",!message);
}
async function initializeCloud(){
  try{
    const session=await fetch("/api/session");
    if(!session.ok){showLogin();return;}
    const response=await fetch("/api/state");
    if(!response.ok)throw new Error("Chargement serveur impossible");
    const result=await response.json();
    cloudRevision=result.revision||0;
    if(result.data){state=normalizeState(result.data);localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
    cloudReady=true;
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("contextFilter").value=state.settings.contextFilter||"all";
    document.getElementById("priorityFilter").value=state.settings.priorityFilter||"all";
    setView(state.settings.currentView||"dashboard");
    if(!result.data)await flushCloudSave();
    else document.getElementById("saveState").textContent="Données synchronisées";
  }catch(error){
    console.error(error);showLogin("Le serveur de données est momentanément indisponible.");
  }
}

const { priorityRank, priorityManualSort, isUnreviewedLegacyTask, isUnreviewedLongSession } = CaptureFlowLogic;
function filtered(items){
  const c = state.settings.contextFilter;
  const p = state.settings.priorityFilter || "all";
  return items.filter(x => (c === "all" || x.context === c) && (!x.priority || p === "all" || x.priority === p));
}
function sortTasks(items){
  return [...items].sort((a,b) => {
    const pa = priorityRank[a.priority] ?? 9, pb = priorityRank[b.priority] ?? 9;
    if(pa !== pb) return pa - pb;
    if(a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if(a.dueDate) return -1;
    if(b.dueDate) return 1;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
}
function elapsedSeconds(t){
  const base = Number(t.timeSpentSeconds)||0;
  if(!t.timerStartedAt) return base;
  return base + Math.max(0, Math.floor((Date.now()-new Date(t.timerStartedAt).getTime())/1000));
}
function formatDuration(seconds){
  const h=Math.floor(seconds/3600), m=Math.floor((seconds%3600)/60), s=seconds%60;
  return h ? `${h}h${String(m).padStart(2,"0")}` : `${m}m${String(s).padStart(2,"0")}`;
}
function formatDurationLong(seconds){
  seconds=Math.max(0,Math.round(Number(seconds)||0));
  const h=Math.floor(seconds/3600), m=Math.floor((seconds%3600)/60);
  if(h && m) return `${h} h ${m} min`;
  if(h) return `${h} h`;
  return `${m} min`;
}
function fmtDateTime(v){
  if(!v) return "";
  return new Date(v).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
}
function taskSessions(taskId){
  return state.activitySessions.filter(s=>s.taskId===taskId);
}
function sessionTotal(sessions){
  return sessions.reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
}
function sessionRange(sessions){
  if(!sessions.length) return {first:"",last:""};
  const starts=sessions.map(s=>s.startedAt).filter(Boolean).sort();
  const ends=sessions.map(s=>s.endedAt||s.startedAt).filter(Boolean).sort();
  return {first:starts[0]||"",last:ends[ends.length-1]||""};
}
function legacySeconds(t){
  return Math.max(0,Number(t?.legacyTimeSeconds)||0);
}
function taskTrackedSeconds(t){
  return legacySeconds(t) + sessionTotal(taskSessions(t.id)) + (t.timerStartedAt ? Math.max(0,Math.floor((Date.now()-new Date(t.timerStartedAt).getTime())/1000)) : 0);
}
function projectSessions(projectId){
  return state.activitySessions.filter(s=>s.projectId===projectId);
}

function projectName(id){
  return state.projects.find(p=>p.id===id)?.name || "";
}

function manualTaskSort(items){
  return priorityManualSort(items);
}
function normalizeOrder(items){
  items.forEach((t,i)=>t.manualOrder=i);
}
function moveTask(id,direction,scope="project"){
  const t=state.tasks.find(x=>x.id===id); if(!t)return;
  let items=[];
  if(scope==="project") items=state.tasks.filter(x=>x.projectId===t.projectId);
  else if(scope==="today") items=state.tasks.filter(x=>(x.status==="today" || (x.dueDate===todayISO() && x.status!=="done")));
  else items=state.tasks.filter(x=>!x.projectId);
  items=manualTaskSort(items.filter(x=>(priorityRank[x.priority]??9)===(priorityRank[t.priority]??9)));
  const i=items.findIndex(x=>x.id===id), j=i+direction;
  if(i<0||j<0||j>=items.length)return;
  [items[i].manualOrder,items[j].manualOrder]=[items[j].manualOrder,items[i].manualOrder];
  saveState();
}

function taskCard(t, compact=false){
  const overdue = t.dueDate && t.dueDate < todayISO() && t.status!=="done";
  const running = Boolean(t.timerStartedAt);
  return `<article class="task-card" draggable="true" data-task-id="${t.id}" data-priority="${t.priority}" onclick="openTask('${t.id}')">
    <div class="task-title-row"><span class="task-title">${esc(t.title)}</span><span>${priorityIcon(t.priority)}</span></div>
    ${!compact && t.description ? `<div class="muted">${esc(t.description).slice(0,180)}</div>`:""}
    ${!compact && t.remaining ? `<div class="remaining-preview"><strong>Reste à faire :</strong> ${esc(t.remaining).slice(0,180)}</div>`:""}
    <div class="task-meta">
      <span class="badge ${t.context}">${t.context==="pro"?"Pro":"Perso"}</span>
      ${t.projectId?`<span class="badge">${esc(projectName(t.projectId))}</span>`:""}
      ${t.dueDate?`<span class="badge ${overdue?"overdue":""}">${fmtDate(t.dueDate)}</span>`:""}
      ${t.estimate?`<span class="badge">Prévu ${t.estimate} min</span>`:""}
      ${taskTrackedSeconds(t)>0||running?`<span class="badge timer-badge ${running && elapsedSeconds(t)>14400?"timer-warning":""}">${running?"⏱":"Temps"} ${formatDuration(taskTrackedSeconds(t))}${running && elapsedSeconds(t)>14400?" · à vérifier":""}</span>`:""}
      ${(t.tags||[]).map(x=>`<span class="badge">#${esc(x)}</span>`).join("")}
    </div>
    <div class="inline-actions">
      <button class="btn small ${running?"danger":"secondary"}" onclick="event.stopPropagation();toggleTimer('${t.id}')">${running?"Pause":"Démarrer"}</button>
    </div>
  </article>`;
}
function priorityIcon(p){ return ({urgent:"🔴",high:"🟠",medium:"🟡",low:"🟢"})[p]||""; }

function setView(view){
  state.settings.currentView=view;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(view+"View").classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const meta=view==="projectDetail"?["Projet","Tâches, Kanban et activité du projet"]:viewMeta[view];
  document.getElementById("viewTitle").textContent=meta[0];
  document.getElementById("viewSubtitle").textContent=meta[1];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderCurrent();
}
function renderCurrent(){
  const view=state.settings.currentView||"today";
  ({dashboard:renderDashboard,today:renderToday,calendar:renderCalendar,inbox:renderInbox,kanban:renderKanban,projects:renderProjects,projectDetail:renderProjectDetail,activity:renderActivity,improvements:renderImprovements,well:renderWell,notes:renderNotes,admin:renderAdmin})[view]();
}
function empty(msg){ return `<div class="empty">${esc(msg)}</div>`; }

function renderToday(){
  const tasks=manualTaskSort(filtered(state.tasks.filter(t=>t.status==="today" || (t.dueDate===todayISO() && t.status!=="done"))));
  const doing=sortTasks(filtered(state.tasks.filter(t=>t.status==="doing")));
  const totalMin=[...tasks,...doing].reduce((s,t)=>s+(Number(t.estimate)||0),0);
  document.getElementById("todayView").innerHTML=`
    <div class="grid stats-grid">
      <div class="card"><div class="muted">À faire</div><div class="stat-value">${tasks.length}</div></div>
      <div class="card"><div class="muted">En cours</div><div class="stat-value">${doing.length}</div></div>
      <div class="card"><div class="muted">Temps prévu</div><div class="stat-value">${Math.floor(totalMin/60)}h${String(totalMin%60).padStart(2,"0")}</div></div>
      <div class="card"><div class="muted">Terminées aujourd’hui</div><div class="stat-value">${filtered(state.tasks.filter(t=>t.status==="done" && t.completedAt?.slice(0,10)===todayISO())).length}</div></div>
    </div>
    <div class="section-title"><h3>En cours</h3></div>
    <div class="task-list">${doing.length?doing.map(t=>taskCard(t)).join(""):empty("Aucune tâche en cours.")}</div>
    <div class="section-title"><h3>À faire aujourd’hui</h3><button class="btn small secondary" onclick="openNewTask('today')">Ajouter</button></div>
    <div class="task-list">${tasks.length?tasks.map(t=>`<div class="ordered-task"><div class="order-buttons"><button class="icon-btn" onclick="moveTask('${t.id}',-1,'today')">↑</button><button class="icon-btn" onclick="moveTask('${t.id}',1,'today')">↓</button></div>${taskCard(t)}</div>`).join(""):empty("Ta journée est vide. Ajoute une tâche ou déplace-en une depuis la corbeille.")}</div>`;
  bindDrag();
}


function changeCalendarMonth(delta){
  const current=(state.settings.calendarMonth||todayISO().slice(0,7))+"-01T12:00:00";
  const d=new Date(current); d.setMonth(d.getMonth()+delta);
  state.settings.calendarMonth=d.toISOString().slice(0,7);
  saveState();
}
function renderCalendar(){
  const month=state.settings.calendarMonth||todayISO().slice(0,7);
  const [year,monthNum]=month.split("-").map(Number);
  const first=new Date(year,monthNum-1,1);
  const days=new Date(year,monthNum,0).getDate();
  const offset=(first.getDay()+6)%7;
  const monthLabel=first.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  const dueTasks=sortTasks(filtered(state.tasks.filter(t=>t.dueDate && t.dueDate.startsWith(month) && t.status!=="done")));
  const cells=[];
  for(let i=0;i<offset;i++) cells.push(`<div class="calendar-day empty-day"></div>`);
  for(let day=1;day<=days;day++){
    const date=`${month}-${String(day).padStart(2,"0")}`;
    const dayTasks=dueTasks.filter(t=>t.dueDate===date);
    cells.push(`<div class="calendar-day ${date===todayISO()?"calendar-today":""}">
      <div class="calendar-day-head"><strong>${day}</strong><button class="icon-btn" onclick="openNewTaskForDate('${date}')" title="Ajouter">+</button></div>
      <div class="calendar-tasks">${dayTasks.map(t=>`<button class="calendar-task p-${t.priority}" onclick="openTask('${t.id}')">${priorityIcon(t.priority)} ${esc(t.title)}</button>`).join("")}</div>
    </div>`);
  }
  document.getElementById("calendarView").innerHTML=`
    <div class="calendar-toolbar">
      <button class="btn secondary" onclick="changeCalendarMonth(-1)">← Mois précédent</button>
      <h3>${monthLabel.charAt(0).toUpperCase()+monthLabel.slice(1)}</h3>
      <button class="btn secondary" onclick="changeCalendarMonth(1)">Mois suivant →</button>
    </div>
    <div class="calendar-weekdays">${["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(x=>`<div>${x}</div>`).join("")}</div>
    <div class="calendar-grid">${cells.join("")}</div>`;
}
function openNewTaskForDate(date){
  openNewTask("today");
  document.getElementById("taskDueDate").value=date;
}

function renderInbox(){
  const tasks=sortTasks(filtered(state.tasks.filter(t=>t.status==="inbox")));
  document.getElementById("inboxView").innerHTML=`
    <div class="searchbar"><input id="inboxSearch" placeholder="Rechercher..." oninput="renderInboxFiltered()"><button class="btn primary" onclick="openNewTask('inbox')">+ Capturer</button></div>
    <div id="inboxList" class="task-list">${tasks.length?tasks.map(t=>taskCard(t)).join(""):empty("La corbeille est vide.")}</div>`;
  bindDrag();
}
function renderInboxFiltered(){
  const q=document.getElementById("inboxSearch").value.toLowerCase();
  const tasks=sortTasks(filtered(state.tasks.filter(t=>t.status==="inbox" && (t.title+" "+t.description).toLowerCase().includes(q))));
  document.getElementById("inboxList").innerHTML=tasks.length?tasks.map(t=>taskCard(t)).join(""):empty("Aucun résultat.");
}

const kanbanColumns=[
  ["inbox","Corbeille"],["today","À faire"],["doing","En cours"],["waiting","En attente"],["done","Terminé"]
];
function renderKanban(){
  document.getElementById("kanbanView").innerHTML=`<div class="card kanban-info"><strong>Kanban général</strong><p class="muted">Cette vue contient uniquement les tâches sans projet. Les tâches rattachées à un projet sont gérées dans le Kanban du projet.</p></div><div class="kanban">${kanbanColumns.map(([key,label])=>{
    const tasks=sortTasks(filtered(state.tasks.filter(t=>t.status===key && !t.projectId)));
    return `<section class="kanban-col"><h3>${label}<span>${tasks.length}</span></h3><div class="dropzone" data-status="${key}">${tasks.map(t=>taskCard(t,true)).join("")}</div></section>`;
  }).join("")}</div>`;
  bindDrag();
}

function renderProjects(){
  const projects=filtered(state.projects);
  document.getElementById("projectsView").innerHTML=`
    <div class="section-title"><h3>${projects.length} projet(s)</h3><button class="btn primary" onclick="openNewProject()">+ Nouveau projet</button></div>
    <div class="grid project-grid">${projects.length?projects.map(p=>{
      const tasks=state.tasks.filter(t=>t.projectId===p.id);
      const done=tasks.filter(t=>t.status==="done").length;
      const pct=tasks.length?Math.round(done/tasks.length*100):0;
      const sessions=projectSessions(p.id), tracked=sessionTotal(sessions)+tasks.reduce((sum,t)=>sum+legacySeconds(t),0), range=sessionRange(sessions);
      return `<article class="card project-card project-workspace-card" onclick="openProjectWorkspace('${p.id}')">
        <div class="project-card-head">
          <div>
            <h3>${esc(p.name)}</h3>
            <div class="task-meta"><span class="badge ${p.context}">${p.context==="pro"?"Pro":"Perso"}</span><span class="badge">${projectStatusLabel(p.status)}</span></div>
          </div>
          <button class="icon-btn project-edit-btn" onclick="event.stopPropagation();editProject('${p.id}')" title="Modifier le projet">✏️</button>
        </div>
        <p class="muted">${esc(p.description||"Aucune description")}</p>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <p class="muted">${done}/${tasks.length} tâches terminées · ${pct}%</p>
        <div class="task-meta">
          <span class="badge">${sessions.length} session(s)</span>
          <span class="badge">${formatDurationLong(tracked)}</span>
          ${range.first?`<span class="badge">${fmtDateTime(range.first)} → ${fmtDateTime(range.last)}</span>`:""}
          ${p.dueDate?`<span class="badge">Cible : ${fmtDate(p.dueDate)}</span>`:""}
        </div>
      </article>`;
    }).join(""):empty("Aucun projet.")}</div>`;
}
function projectStatusLabel(status){
  return ({active:"Actif",paused:"En pause",completed:"Terminé"})[status]||status;
}
function taskStatusLabel(status){
  return ({inbox:"Corbeille",today:"À faire",doing:"En cours",waiting:"En attente",done:"Terminé",well:"Puits"})[status]||status;
}
function openProjectWorkspace(id,tab="tasks"){
  const p=state.projects.find(x=>x.id===id); if(!p)return;
  state.settings.currentProjectId=id;
  state.settings.projectTab=tab;
  state.settings.currentView="projectDetail";
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById("projectDetailView").classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.querySelector('.nav-btn[data-view="projects"]')?.classList.add("active");
  document.getElementById("viewTitle").textContent=p.name;
  document.getElementById("viewSubtitle").textContent="Espace projet · tâches, Kanban, activité et synthèse";
  renderProjectDetail();
}
function setProjectTab(tab){
  state.settings.projectTab=tab;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  renderProjectDetail();
}
function projectTaskRow(t){
  const checklist=t.checklist||[];
  const checked=checklist.filter(x=>x.done).length;
  const progress=checklist.length?`${checked}/${checklist.length} étapes`:"Aucune checklist";
  return `<tr class="clickable-row">
    <td class="order-cell">
      <button class="icon-btn" onclick="event.stopPropagation();moveTask('${t.id}',-1,'project')" title="Monter">↑</button>
      <button class="icon-btn" onclick="event.stopPropagation();moveTask('${t.id}',1,'project')" title="Descendre">↓</button>
    </td>
    <td onclick="openTask('${t.id}')"><strong>${esc(t.title)}</strong>${t.description?`<div class="muted row-description">${esc(t.description).slice(0,110)}</div>`:""}${t.remaining?`<div class="remaining-row"><strong>Reste :</strong> ${esc(t.remaining).slice(0,120)}</div>`:""}</td>
    <td onclick="openTask('${t.id}')"><span class="badge">${taskStatusLabel(t.status)}</span></td>
    <td onclick="openTask('${t.id}')">${priorityIcon(t.priority)} ${({urgent:"Urgente",high:"Haute",medium:"Moyenne",low:"Basse"})[t.priority]||""}</td>
    <td onclick="openTask('${t.id}')">${progress}</td>
    <td onclick="openTask('${t.id}')">${t.dueDate?fmtDate(t.dueDate):"—"}</td>
    <td onclick="openTask('${t.id}')">${formatDurationLong(taskTrackedSeconds(t))}</td>
  </tr>`;
}
function renderProjectDetail(){
  const id=state.settings.currentProjectId;
  const p=state.projects.find(x=>x.id===id);
  if(!p){ setView("projects"); return; }
  const tab=state.settings.projectTab||"tasks";
  const tasks=manualTaskSort(state.tasks.filter(t=>t.projectId===id));
  const done=tasks.filter(t=>t.status==="done").length;
  const pct=tasks.length?Math.round(done/tasks.length*100):0;
  const sessions=projectSessions(id);
  const tracked=sessionTotal(sessions)+tasks.reduce((sum,t)=>sum+legacySeconds(t),0);
  const range=sessionRange(sessions);
  const tabButton=(key,label)=>`<button class="project-tab ${tab===key?"active":""}" onclick="setProjectTab('${key}')">${label}</button>`;
  let body="";

  if(tab==="tasks"){
    body=`<div class="project-toolbar"><button class="btn primary" onclick="openNewTaskForProject('${id}')">+ Nouvelle tâche</button></div>
      <div class="card table-wrap">${tasks.length?`<table class="table project-task-table"><thead><tr><th>Ordre</th><th>Tâche</th><th>Statut</th><th>Priorité</th><th>Checklist</th><th>Échéance</th><th>Temps</th></tr></thead><tbody>${tasks.map(projectTaskRow).join("")}</tbody></table>`:empty("Aucune tâche dans ce projet.")}</div>`;
  }else if(tab==="kanban"){
    body=`<div class="project-toolbar"><button class="btn primary" onclick="openNewTaskForProject('${id}')">+ Nouvelle tâche</button></div>
      <div class="kanban">${kanbanColumns.map(([key,label])=>{
        const col=tasks.filter(t=>t.status===key);
        return `<section class="kanban-col"><h3>${label}<span>${col.length}</span></h3><div class="dropzone project-dropzone" data-status="${key}" data-project-id="${id}">${col.map(t=>taskCard(t,true)).join("")}</div></section>`;
      }).join("")}</div>`;
  }else if(tab==="activity"){
    const taskRows=tasks.map(t=>{
      const ss=taskSessions(t.id), r=sessionRange(ss);
      return `<tr><td>${esc(t.title)}</td><td>${ss.length}</td><td><strong>${formatDurationLong(taskTrackedSeconds(t))}</strong></td><td>${r.first?fmtDateTime(r.first):"—"}</td><td>${r.last?fmtDateTime(r.last):"—"}</td></tr>`;
    }).join("");
    body=`<div class="grid stats-grid">
        <div class="card"><div class="muted">Temps total</div><div class="stat-value">${formatDurationLong(tracked)}</div></div>
        <div class="card"><div class="muted">Sessions</div><div class="stat-value">${sessions.length}</div></div>
        <div class="card"><div class="muted">Tâches</div><div class="stat-value">${tasks.length}</div></div>
        <div class="card"><div class="muted">Période</div><div class="stat-small">${range.first?`${fmtDateTime(range.first)}<br>→ ${fmtDateTime(range.last)}`:"Aucune activité"}</div></div>
      </div>
      <div class="section-title"><h3>Temps par tâche</h3></div>
      <div class="card table-wrap">${taskRows?`<table class="table"><thead><tr><th>Tâche</th><th>Sessions</th><th>Temps</th><th>Première activité</th><th>Dernière activité</th></tr></thead><tbody>${taskRows}</tbody></table>`:empty("Aucune activité.")}</div>`;
  }else{
    body=`<div class="project-overview-grid">
      <div class="card"><h3>Description</h3><p>${esc(p.description||"Aucune description")}</p></div>
      <div class="card"><h3>Progression</h3><div class="progress"><span style="width:${pct}%"></span></div><p>${done}/${tasks.length} tâches terminées · ${pct}%</p></div>
      <div class="card"><h3>Planning</h3><p><strong>Date cible :</strong> ${p.dueDate?fmtDate(p.dueDate):"Non renseignée"}</p><p><strong>Statut :</strong> ${projectStatusLabel(p.status)}</p></div>
      <div class="card"><h3>Activité</h3><p><strong>${formatDurationLong(tracked)}</strong> · ${sessions.length} session(s)</p><p>${range.first?`${fmtDateTime(range.first)} → ${fmtDateTime(range.last)}`:"Aucune session"}</p></div>
    </div>`;
  }

  document.getElementById("projectDetailView").innerHTML=`
    <div class="project-detail-head card">
      <button class="btn secondary" onclick="setView('projects')">← Projets</button>
      <div class="project-detail-title"><h3>${esc(p.name)}</h3><div class="task-meta"><span class="badge ${p.context}">${p.context==="pro"?"Pro":"Perso"}</span><span class="badge">${projectStatusLabel(p.status)}</span></div></div>
      <button class="btn secondary" onclick="editProject('${id}')">✏️ Modifier</button>
    </div>
    <div class="project-tabs">${tabButton("tasks","Tâches")}${tabButton("kanban","Kanban")}${tabButton("activity","Activité")}${tabButton("overview","Synthèse")}</div>
    ${body}`;
  bindDrag();
}
function openNewTaskForProject(projectId){
  openNewTask("today");
  document.getElementById("taskProject").value=projectId;
}

function recurringProjectOptions(selected=""){
  return `<option value="">Aucun projet</option>`+state.projects.map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${esc(p.name)}</option>`).join("");
}
function openNewRecurring(){
  document.getElementById("recurringForm").reset();
  document.getElementById("recurringId").value="";
  document.getElementById("recurringDialogTitle").textContent="Nouvelle tâche récurrente";
  document.getElementById("recurringProject").innerHTML=recurringProjectOptions("");
  document.getElementById("deleteRecurringBtn").classList.add("hidden");
  document.getElementById("recurringDialog").showModal();
}
function editRecurring(id){
  const r=state.recurringTasks.find(x=>x.id===id); if(!r)return;
  document.getElementById("recurringId").value=r.id;
  document.getElementById("recurringDialogTitle").textContent="Modifier la tâche récurrente";
  document.getElementById("recurringTitle").value=r.title;
  document.getElementById("recurringContext").value=r.context;
  document.getElementById("recurringProject").innerHTML=recurringProjectOptions(r.projectId||"");
  document.getElementById("recurringFrequency").value=r.frequency;
  document.getElementById("recurringWeekday").value=String(r.weekday??1);
  document.getElementById("recurringEstimate").value=r.estimate||0;
  document.getElementById("recurringPriority").value=r.priority||"medium";
  document.getElementById("deleteRecurringBtn").classList.remove("hidden");
  document.getElementById("recurringDialog").showModal();
}
function saveRecurringFromForm(){
  const id=document.getElementById("recurringId").value;
  const existing=state.recurringTasks.find(x=>x.id===id);
  const data={
    id:id||uid("recurring"),
    title:document.getElementById("recurringTitle").value.trim(),
    context:document.getElementById("recurringContext").value,
    projectId:document.getElementById("recurringProject").value||null,
    frequency:document.getElementById("recurringFrequency").value,
    weekday:Number(document.getElementById("recurringWeekday").value),
    estimate:Number(document.getElementById("recurringEstimate").value)||0,
    priority:document.getElementById("recurringPriority").value,
    createdAt:existing?.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  if(existing)Object.assign(existing,data);else state.recurringTasks.unshift(data);
  saveState();
}
function deleteRecurring(){
  const id=document.getElementById("recurringId").value;
  if(id&&confirm("Supprimer cette tâche récurrente ?")){
    state.recurringTasks=state.recurringTasks.filter(x=>x.id!==id);
    saveState();document.getElementById("recurringDialog").close();
  }
}
function recurringDueToday(r){
  return r.frequency==="daily" || (r.frequency==="weekly" && new Date().getDay()===Number(r.weekday));
}
function createTaskFromRecurring(id,startNow=false){
  const r=state.recurringTasks.find(x=>x.id===id); if(!r)return;
  const t={
    id:uid("task"),title:r.title,description:"Tâche créée depuis une récurrence.",remaining:"",
    context:r.context,projectId:r.projectId||null,status:startNow?"doing":"today",priority:r.priority||"medium",
    dueDate:todayISO(),estimate:r.estimate||0,tags:["récurrente"],checklist:[],manualOrder:Date.now(),
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null,
    timeSpentSeconds:0,legacyTimeSeconds:0,timerStartedAt:startNow?new Date().toISOString():null,recurringSourceId:r.id
  };
  if(startNow) state.tasks.forEach(other=>{if(other.timerStartedAt)stopTimer(other)});
  state.tasks.unshift(t);
  saveState();
}
function renderRecurringContent(){
  const items=filtered(state.recurringTasks);
  return `<div class="section-title"><h3>Tâches récurrentes</h3><button class="btn primary" onclick="openNewRecurring()">+ Nouvelle récurrence</button></div>
    <div class="recurring-grid">${items.length?items.map(r=>`
      <article class="card recurring-card ${recurringDueToday(r)?"due-today":""}">
        <div class="task-title-row"><strong>${esc(r.title)}</strong><button class="icon-btn" onclick="editRecurring('${r.id}')">✏️</button></div>
        <div class="task-meta">
          <span class="badge ${r.context}">${r.context==="pro"?"Pro":"Perso"}</span>
          ${r.projectId?`<span class="badge">${esc(projectName(r.projectId))}</span>`:""}
          <span class="badge">${r.frequency==="daily"?"Tous les jours":"Chaque "+["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"][r.weekday]}</span>
          <span class="badge">${r.estimate||0} min</span>
        </div>
        ${recurringDueToday(r)?`<p class="recurring-due">Prévue aujourd’hui</p>`:""}
        <div class="inline-actions">
          <button class="btn small secondary" onclick="createTaskFromRecurring('${r.id}',false)">Ajouter à Aujourd’hui</button>
          <button class="btn small primary" onclick="createTaskFromRecurring('${r.id}',true)">Démarrer maintenant</button>
        </div>
      </article>`).join(""):empty("Aucune tâche récurrente.")}</div>`;
}

function renderWell(){
  const tasks=sortTasks(filtered(state.tasks.filter(t=>t.status==="well")));
  document.getElementById("wellView").innerHTML=`
    <div class="section-title"><h3>Idées et tâches en attente</h3><button class="btn primary" onclick="openNewTask('well')">+ Ajouter au puits</button></div>
    <div class="task-list">${tasks.length?tasks.map(t=>taskCard(t)).join(""):empty("Le puits est vide.")}</div>`;
  bindDrag();
}

function renderNotes(){
  const notes=filtered(state.notes);
  document.getElementById("notesView").innerHTML=`
    <div class="section-title"><h3>${notes.length} post-it</h3><button class="btn primary" onclick="openNewNote()">+ Nouveau post-it</button></div>
    <div class="grid note-grid">${notes.length?notes.map(n=>`<article class="card note ${n.color}" onclick="openNote('${n.id}')"><h3>${esc(n.title)}</h3><div>${esc(n.content)}</div><p class="muted">${n.context==="pro"?"Professionnel":"Personnel"}</p></article>`).join(""):empty("Aucun post-it.")}</div>`;
}


function activityContextSessions(){
  const c=state.settings.contextFilter;
  return state.activitySessions.filter(s=>c==="all"||s.context===c);
}
function activityContextTasks(){
  const c=state.settings.contextFilter;
  return state.tasks.filter(t=>c==="all"||t.context===c);
}
function setLegacyTime(taskId){
  const t=state.tasks.find(x=>x.id===taskId); if(!t)return;
  const minutes=prompt("Temps ancien non journalisé pour cette tâche, en minutes :", String(Math.round(legacySeconds(t)/60)));
  if(minutes===null)return;
  const n=Number(minutes);
  if(Number.isNaN(n)||n<0){alert("Durée invalide.");return}
  t.legacyTimeSeconds=Math.round(n*60);
  t.legacyTimeReviewed=true;
  t.timeSpentSeconds=t.legacyTimeSeconds+sessionTotal(taskSessions(t.id));
  t.updatedAt=new Date().toISOString();
  saveState();
}
function editSession(id){
  const s=state.activitySessions.find(x=>x.id===id); if(!s)return;
  const minutes=prompt("Durée réelle de cette session en minutes :", String(Math.round((s.durationSeconds||0)/60)));
  if(minutes===null) return;
  const n=Number(minutes);
  if(Number.isNaN(n)||n<0){alert("Durée invalide.");return}
  s.durationSeconds=Math.round(n*60);
  s.reviewedAt=new Date().toISOString();
  s.updatedAt=new Date().toISOString();
  const t=state.tasks.find(x=>x.id===s.taskId);
  if(t)t.timeSpentSeconds=legacySeconds(t)+sessionTotal(taskSessions(t.id));
  saveState();
}
function deleteSession(id){
  if(confirm("Supprimer cette session du journal d’activité ?")){
    const s=state.activitySessions.find(x=>x.id===id);
    state.activitySessions=state.activitySessions.filter(x=>x.id!==id);
    const t=s?state.tasks.find(x=>x.id===s.taskId):null;
    if(t)t.timeSpentSeconds=legacySeconds(t)+sessionTotal(taskSessions(t.id));
    saveState();
  }
}
function setActivityTab(tab){
  state.settings.activityTab=tab;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  renderActivity();
}
function activityTaskTable(rows, emptyMessage="Aucune activité tâche enregistrée."){
  if(!rows.length)return empty(emptyMessage);
  return `<div class="card table-wrap"><table class="table"><thead><tr><th>Tâche</th><th>Projet</th><th>Sessions</th><th>Temps total</th><th>Première</th><th>Dernière</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.project)}</td><td>${x.sessions}</td><td><strong>${formatDurationLong(x.total)}</strong></td><td>${x.first?fmtDateTime(x.first):"—"}</td><td>${x.last?fmtDateTime(x.last):"—"}</td></tr>`).join("")}</tbody></table></div>`;
}
function renderActivity(){
  const sessions=[...activityContextSessions()].sort((a,b)=>(b.startedAt||"").localeCompare(a.startedAt||""));
  const contextTasks=activityContextTasks();
  const total=sessionTotal(sessions)+contextTasks.reduce((sum,t)=>sum+legacySeconds(t),0), range=sessionRange(sessions);
  const taskIds=[...new Set([...sessions.map(s=>s.taskId).filter(Boolean),...contextTasks.filter(t=>legacySeconds(t)>0).map(t=>t.id)])];

  const taskRows=taskIds.map(id=>{
    const t=state.tasks.find(x=>x.id===id);
    const ss=sessions.filter(s=>s.taskId===id), r=sessionRange(ss);
    const projectId=t?.projectId||ss.find(s=>s.projectId)?.projectId||null;
    return {id,name:t?.title||"Tâche supprimée",projectId,project:projectId?projectName(projectId):"—",sessions:ss.length,total:(t?legacySeconds(t):0)+sessionTotal(ss),first:r.first,last:r.last};
  }).sort((a,b)=>b.total-a.total);

  const projectRows=filtered(state.projects).map(p=>{
    const ss=sessions.filter(s=>s.projectId===p.id), r=sessionRange(ss);
    const attachedTasks=state.tasks.filter(t=>t.projectId===p.id && (state.settings.contextFilter==="all"||t.context===state.settings.contextFilter));
    const legacy=attachedTasks.reduce((sum,t)=>sum+legacySeconds(t),0);
    return {id:p.id,name:p.name,tasks:attachedTasks.length,sessions:ss.length,total:legacy+sessionTotal(ss),first:r.first,last:r.last};
  }).filter(x=>x.total>0||x.sessions>0).sort((a,b)=>b.total-a.total);

  const running=state.tasks.filter(t=>t.timerStartedAt && (state.settings.contextFilter==="all"||t.context===state.settings.contextFilter));
  const legacyTasks=contextTasks.filter(isUnreviewedLegacyTask);
  const longSessions=sessions.filter(isUnreviewedLongSession);
  const correctionCount=legacyTasks.length+longSessions.length;
  const tab=state.settings.activityTab||"summary";
  const tabButton=(key,label,count="")=>`<button class="activity-tab ${tab===key?"active":""}" onclick="setActivityTab('${key}')">${label}${count!==""?` <span>${count}</span>`:""}</button>`;
  const projectGroups=projectRows.map(project=>{
    const rows=taskRows.filter(task=>task.projectId===project.id);
    return `<details class="activity-group"><summary><span><strong>${esc(project.name)}</strong><small>${project.tasks} tâche(s) · ${project.sessions} session(s)</small></span><strong>${formatDurationLong(project.total)}</strong></summary>${activityTaskTable(rows,"Aucune tâche chronométrée dans ce projet.")}</details>`;
  }).join("");
  const withoutProject=taskRows.filter(task=>!task.projectId);
  let body="";
  if(tab==="projects"){
    body=projectGroups||empty("Aucune activité rattachée à un projet.");
  }else if(tab==="withoutProject"){
    body=activityTaskTable(withoutProject,"Aucune activité sans projet.");
  }else if(tab==="sessions"){
    body=`<div class="card table-wrap">${sessions.length?`<table class="table"><thead><tr><th>Début</th><th>Fin</th><th>Tâche</th><th>Projet</th><th>Durée</th><th>Correction</th></tr></thead><tbody>${sessions.map(s=>{
      const t=state.tasks.find(x=>x.id===s.taskId), p=state.projects.find(x=>x.id===s.projectId);
      const warning=isUnreviewedLongSession(s);
      return `<tr class="${warning?"session-warning":""}"><td>${fmtDateTime(s.startedAt)}</td><td>${fmtDateTime(s.endedAt)}</td><td>${esc(t?.title||"Tâche supprimée")}</td><td>${esc(p?.name||"—")}</td><td><strong>${formatDurationLong(s.durationSeconds)}</strong>${warning?" ⚠":""}</td><td><button class="btn small secondary" onclick="editSession('${s.id}')">Corriger</button> <button class="btn small danger" onclick="deleteSession('${s.id}')">Supprimer</button></td></tr>`;
    }).join("")}</tbody></table>`:empty("Aucune session enregistrée.")}</div>`;
  }else if(tab==="corrections"){
    body=`${legacyTasks.length?`<div class="card correction-list"><h3>Temps anciens sans détail</h3>${legacyTasks.map(t=>`<div><span>${esc(t.title)} : <strong>${formatDurationLong(legacySeconds(t))}</strong></span><button class="btn small secondary" onclick="setLegacyTime('${t.id}')">Corriger et valider</button></div>`).join("")}</div>`:""}
      ${longSessions.length?`<div class="card correction-list"><h3>Sessions longues à vérifier</h3>${longSessions.map(s=>{const t=state.tasks.find(x=>x.id===s.taskId);return `<div><span>${esc(t?.title||"Tâche supprimée")} : <strong>${formatDurationLong(s.durationSeconds)}</strong></span><button class="btn small secondary" onclick="editSession('${s.id}')">Corriger et valider</button></div>`;}).join("")}</div>`:""}
      ${!correctionCount?empty("Aucun temps à corriger."):""}`;
  }else{
    body=`<div class="grid activity-overview-grid">
      <div class="card"><h3>Projets actifs</h3>${projectRows.slice(0,5).map(x=>`<div class="activity-ranking"><span>${esc(x.name)}</span><strong>${formatDurationLong(x.total)}</strong></div>`).join("")||`<p class="muted">Aucune activité projet.</p>`}</div>
      <div class="card"><h3>Tâches les plus suivies</h3>${taskRows.slice(0,5).map(x=>`<div class="activity-ranking"><span>${esc(x.name)}</span><strong>${formatDurationLong(x.total)}</strong></div>`).join("")||`<p class="muted">Aucune activité tâche.</p>`}</div>
    </div>`;
  }

  document.getElementById("activityView").innerHTML=`
    ${running.length?`<div class="warning-box"><strong>Chronomètre actif :</strong> ${running.map(t=>`${esc(t.title)} — ${formatDurationLong(elapsedSeconds(t))}${elapsedSeconds(t)>14400?" ⚠ durée à vérifier":""}`).join("<br>")}</div>`:""}
    ${correctionCount?`<button class="warning-box warning-button" onclick="setActivityTab('corrections')"><strong>${correctionCount} temps à corriger</strong> · Ouvrir la liste</button>`:""}
    <div class="grid stats-grid">
      <div class="card"><div class="muted">Temps enregistré</div><div class="stat-value">${formatDurationLong(total)}</div></div>
      <div class="card"><div class="muted">Sessions</div><div class="stat-value">${sessions.length}</div></div>
      <div class="card"><div class="muted">Tâches tracées</div><div class="stat-value">${taskIds.length}</div></div>
      <div class="card"><div class="muted">Période</div><div class="stat-small">${range.first?`${fmtDateTime(range.first)}<br>→ ${fmtDateTime(range.last)}`:"Aucune session"}</div></div>
    </div>
    <div class="activity-tabs">${tabButton("summary","Synthèse")}${tabButton("projects","Par projet",projectRows.length)}${tabButton("withoutProject","Sans projet",withoutProject.length)}${tabButton("sessions","Détail des sessions",sessions.length)}${tabButton("corrections","À corriger",correctionCount)}</div>
    <div class="activity-tab-body">${body}</div>`;
}

function addImprovement(text=null){
  const input=document.getElementById("improvementInput");
  const value=(text??input?.value??"").trim();
  if(!value)return;
  state.improvements.unshift({
    id:uid("improvement"),
    text:value,
    context:state.settings.contextFilter==="perso"?"perso":"pro",
    priority:"medium",
    status:"idea",
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  });
  if(input)input.value="";
  saveState();
}
function dictateImprovement(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert("La dictée vocale n’est pas disponible dans ce navigateur.");return}
  const rec=new SR();rec.lang="fr-FR";rec.interimResults=false;rec.maxAlternatives=1;
  const btn=document.getElementById("improvementVoiceBtn");
  if(btn)btn.textContent="⏺ Écoute...";
  rec.onresult=e=>addImprovement(e.results[0][0].transcript);
  rec.onerror=e=>alert("Dictée interrompue : "+e.error);
  rec.onend=()=>{const b=document.getElementById("improvementVoiceBtn");if(b)b.textContent="🎤 Dicter une amélioration";};
  rec.start();
}
function updateImprovement(id,field,value){
  const item=state.improvements.find(x=>x.id===id); if(!item)return;
  item[field]=value; item.updatedAt=new Date().toISOString(); saveState();
}
function deleteImprovement(id){
  if(confirm("Supprimer cette amélioration ?")){
    state.improvements=state.improvements.filter(x=>x.id!==id);saveState();
  }
}
function renderImprovements(){
  const rank={urgent:0,high:1,medium:2,low:3};
  const items=filtered(state.improvements).sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9)||(b.createdAt||"").localeCompare(a.createdAt||""));
  document.getElementById("improvementsView").innerHTML=`
    <div class="card improvement-capture">
      <h3>Capturer une amélioration</h3>
      <p class="muted">Dicte une idée : chaque dictée ajoute immédiatement une nouvelle ligne à la liste.</p>
      <div class="improvement-entry">
        <input id="improvementInput" placeholder="Ex. Ajouter un filtre par formateur..." onkeydown="if(event.key==='Enter'){event.preventDefault();addImprovement()}">
        <button id="improvementVoiceBtn" class="btn primary" onclick="dictateImprovement()">🎤 Dicter une amélioration</button>
        <button class="btn secondary" onclick="addImprovement()">Ajouter</button>
      </div>
    </div>
    <div class="section-title"><h3>Backlog d’améliorations</h3><span class="muted">${items.length} élément(s)</span></div>
    <div class="improvement-list">${items.length?items.map((x,i)=>`
      <div class="card improvement-row">
        <div class="improvement-index">${i+1}</div>
        <div class="improvement-text"><textarea class="improvement-textarea" onchange="updateImprovement('${x.id}','text',this.value)">${esc(x.text)}</textarea><div class="muted"><span class="badge ${x.context}">${x.context==="perso"?"Perso":"Pro"}</span> Ajoutée le ${fmtDateTime(x.createdAt)}</div></div>
        <select onchange="updateImprovement('${x.id}','priority',this.value)">
          <option value="urgent" ${x.priority==="urgent"?"selected":""}>Urgente</option>
          <option value="high" ${x.priority==="high"?"selected":""}>Haute</option>
          <option value="medium" ${x.priority==="medium"?"selected":""}>Moyenne</option>
          <option value="low" ${x.priority==="low"?"selected":""}>Basse</option>
        </select>
        <select onchange="updateImprovement('${x.id}','status',this.value)">
          <option value="idea" ${x.status==="idea"?"selected":""}>À étudier</option>
          <option value="planned" ${x.status==="planned"?"selected":""}>Planifiée</option>
          <option value="doing" ${x.status==="doing"?"selected":""}>En cours</option>
          <option value="done" ${x.status==="done"?"selected":""}>Terminée</option>
        </select>
        <button class="icon-btn" onclick="deleteImprovement('${x.id}')" title="Supprimer">×</button>
      </div>`).join(""):empty("Aucune amélioration. Utilise le bouton de dictée pour commencer.")}</div>`;
}



function setDashboardTab(tab){
  state.settings.dashboardTab=tab;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  renderDashboard();
}
function dashboardTabs(){
  const tab=state.settings.dashboardTab||"overview";
  const items=[["overview","Synthèse"],["today","Aujourd’hui"],["calendar","Calendrier"],["kanban","Kanban"],["activity","Journal d’activité"],["recurring","Récurrentes"],["well","Puits"],["inbox","Corbeille"]];
  return `<div class="hub-tabs">${items.map(([k,l])=>`<button class="hub-tab ${tab===k?"active":""}" onclick="setDashboardTab('${k}')">${l}</button>`).join("")}</div>`;
}
function captureRenderedView(tempId, renderer){
  renderer();
  const el=document.getElementById(tempId);
  return el ? el.innerHTML : "";
}
function renderDashboard(){
  const tab=state.settings.dashboardTab||"overview";
  const target=document.getElementById("dashboardView");
  let body="";
  if(tab==="overview"){
    renderDashboardOverview();
    body=target.innerHTML;
  }else if(tab==="today"){
    renderToday(); body=document.getElementById("todayView").innerHTML;
  }else if(tab==="calendar"){
    renderCalendar(); body=document.getElementById("calendarView").innerHTML;
  }else if(tab==="kanban"){
    renderKanban(); body=document.getElementById("kanbanView").innerHTML;
  }else if(tab==="activity"){
    renderActivity(); body=document.getElementById("activityView").innerHTML;
  }else if(tab==="well"){
    renderWell(); body=document.getElementById("wellView").innerHTML;
  }else if(tab==="inbox"){
    renderInbox(); body=document.getElementById("inboxView").innerHTML;
  }else if(tab==="recurring"){
    body=renderRecurringContent();
  }
  target.innerHTML=dashboardTabs()+`<div class="hub-body">${body}</div>`;
  bindDrag();
}

function renderDashboardOverview(){
  const tasks=filtered(state.tasks);
  const done=tasks.filter(t=>t.status==="done").length;
  const overdue=tasks.filter(t=>t.dueDate && t.dueDate<todayISO() && t.status!=="done").length;
  const activeProjects=filtered(state.projects.filter(p=>p.status==="active")).length;
  const sessions=activityContextSessions();
  const totalTracked=sessionTotal(sessions)+tasks.reduce((sum,t)=>sum+legacySeconds(t),0);
  const running=tasks.filter(t=>t.timerStartedAt);
  const byProject=filtered(state.projects).map(p=>{
    const pt=tasks.filter(t=>t.projectId===p.id);
    const ps=projectSessions(p.id).filter(s=>state.settings.contextFilter==="all"||s.context===state.settings.contextFilter);
    const range=sessionRange(ps);
    return {name:p.name,total:pt.length,done:pt.filter(t=>t.status==="done").length,sessions:ps.length,tracked:sessionTotal(ps)+pt.reduce((sum,t)=>sum+legacySeconds(t),0),first:range.first,last:range.last};
  });
  document.getElementById("dashboardView").innerHTML=`
    ${running.length?`<div class="warning-box"><strong>Chronomètre en cours :</strong> ${running.map(t=>`${esc(t.title)} — ${formatDurationLong(elapsedSeconds(t))}${elapsedSeconds(t)>14400?" ⚠ durée anormalement longue":""}`).join("<br>")}</div>`:""}
    <div class="grid stats-grid">
      <div class="card"><div class="muted">Tâches totales</div><div class="stat-value">${tasks.length}</div></div>
      <div class="card"><div class="muted">Terminées</div><div class="stat-value">${done}</div></div>
      <div class="card"><div class="muted">Temps tracé</div><div class="stat-value">${formatDurationLong(totalTracked)}</div></div>
      <div class="card"><div class="muted">Sessions</div><div class="stat-value">${sessions.length}</div></div>
      <div class="card"><div class="muted">En retard</div><div class="stat-value">${overdue}</div></div>
      <div class="card"><div class="muted">Projets actifs</div><div class="stat-value">${activeProjects}</div></div>
    </div>
    <div class="section-title"><h3>Avancement et temps par projet</h3></div>
    <div class="card table-wrap">${byProject.length?`<table class="table"><thead><tr><th>Projet</th><th>Progression</th><th>Tâches</th><th>Sessions</th><th>Temps</th><th>Période</th></tr></thead><tbody>${byProject.map(x=>{
      const pct=x.total?Math.round(x.done/x.total*100):0;
      return `<tr><td>${esc(x.name)}</td><td><div class="progress"><span style="width:${pct}%"></span></div> ${pct}%</td><td>${x.done}/${x.total}</td><td>${x.sessions}</td><td><strong>${formatDurationLong(x.tracked)}</strong></td><td>${x.first?`${fmtDateTime(x.first)} → ${fmtDateTime(x.last)}`:"—"}</td></tr>`;
    }).join("")}</tbody></table>`:empty("Aucune donnée projet.")}</div>`;
}


function setAdminTab(tab){
  state.settings.adminTab=tab;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  renderAdmin();
}
function renderAdmin(){
  const tab=state.settings.adminTab||"backup";
  let body="";
  if(tab==="backup"){
    renderAdminBackup(); body=document.getElementById("adminView").innerHTML;
  }else{
    renderImprovements(); body=document.getElementById("improvementsView").innerHTML;
  }
  document.getElementById("adminView").innerHTML=`
    <div class="hub-tabs">
      <button class="hub-tab ${tab==="backup"?"active":""}" onclick="setAdminTab('backup')">Sauvegardes & réglages</button>
      <button class="hub-tab ${tab==="improvements"?"active":""}" onclick="setAdminTab('improvements')">Améliorations</button>
    </div>
    <div class="hub-body">${body}</div>`;
}

function renderAdminBackup(){
  document.getElementById("adminView").innerHTML=`
    <div class="admin-grid">
      <section class="card admin-card"><h3>Sauvegarde JSON</h3><p class="muted">Enregistre toutes les tâches, projets, post-it et réglages dans un fichier.</p>
        <div class="inline-actions"><button class="btn primary" onclick="saveJsonAs()">Choisir un fichier</button><button class="btn secondary" onclick="downloadJson()">Télécharger une copie</button></div>
        <p class="muted">Le choix direct du chemin fonctionne surtout dans Chrome et Edge récents. Sinon, le téléchargement classique est utilisé.</p>
      </section>
      <section class="card admin-card"><h3>Restaurer complètement</h3><p class="muted">Remplace toutes les données actuelles par une sauvegarde CaptureFlow JSON.</p>
        <div class="inline-actions"><button class="btn secondary" onclick="openJsonFile()">Restaurer un JSON</button></div>
      </section>
      <section class="card admin-card"><h3>Fusionner les anciennes applications</h3><p class="muted">Ajoute une sauvegarde sans effacer les données présentes. Le contexte choisi est appliqué à tout le fichier.</p>
        <div class="inline-actions"><button class="btn primary" onclick="openMergeJson('pro')">Importer comme Professionnel</button><button class="btn primary" onclick="openMergeJson('perso')">Importer comme Personnel</button></div>
      </section>
      <section class="card admin-card"><h3>Copie locale de secours</h3><p class="muted">Les données sont synchronisées sur le serveur et une copie de secours reste dans ce navigateur.</p>
        <button class="btn secondary" onclick="exportClipboard()">Copier le JSON</button>
      </section>
      <section class="card admin-card"><h3>Données d’exemple</h3><p class="muted">Ajoute quelques éléments pour découvrir l’interface.</p>
        <button class="btn secondary" onclick="seedDemo()">Charger des exemples</button>
      </section>
      <section class="card admin-card"><h3>Réinitialisation</h3><p class="muted">Efface toutes les données locales de ce navigateur.</p>
        <button class="btn danger" onclick="resetAll()">Tout effacer</button>
      </section>
      <section class="card admin-card"><h3>Informations</h3>
        <p class="muted">Version : ${state.meta.version}<br>Dernière modification : ${new Date(state.meta.updatedAt).toLocaleString("fr-FR")}<br>Tâches : ${state.tasks.length}<br>Projets : ${state.projects.length}<br>Post-it : ${state.notes.length}<br>Sessions : ${state.activitySessions.length}<br>Tâches récurrentes : ${state.recurringTasks.length}<br>Améliorations : ${state.improvements.length}</p>
      </section>
    </div>`;
}


function normalizeChecklist(t){
  if(!Array.isArray(t.checklist)) t.checklist=[];
  return t.checklist;
}
function renderChecklistEditor(items=[]){
  const box=document.getElementById("taskChecklistEditor");
  if(!box)return;
  box.innerHTML=items.length?items.map((item,i)=>`
    <div class="checklist-edit-row">
      <input type="checkbox" data-check-index="${i}" ${item.done?"checked":""}>
      <input type="text" data-check-text="${i}" value="${esc(item.text||"")}" placeholder="Étape à réaliser">
      <button type="button" class="icon-btn" onclick="removeChecklistEditorItem(${i})">×</button>
    </div>`).join(""):`<div class="muted checklist-empty">Aucune étape. Ajoute une ligne si la tâche doit être détaillée.</div>`;
}
function readChecklistEditor(){
  const texts=[...document.querySelectorAll("#taskChecklistEditor [data-check-text]")];
  return texts.map(input=>{
    const i=input.dataset.checkText;
    const checkbox=document.querySelector(`#taskChecklistEditor [data-check-index="${i}"]`);
    return {id:input.dataset.itemId||uid("check"),text:input.value.trim(),done:Boolean(checkbox?.checked)};
  }).filter(x=>x.text);
}
function addChecklistEditorItem(){
  const items=readChecklistEditor();
  items.push({id:uid("check"),text:"",done:false});
  renderChecklistEditor(items);
  setTimeout(()=>document.querySelector("#taskChecklistEditor [data-check-text]:last-of-type")?.focus(),50);
}
function removeChecklistEditorItem(index){
  const items=readChecklistEditor();
  items.splice(index,1);
  renderChecklistEditor(items);
}

function populateProjectSelect(selected=""){
  const sel=document.getElementById("taskProject");
  sel.innerHTML=`<option value="">Aucun projet</option>`+state.projects.map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${esc(p.name)}</option>`).join("");
}
function openNewTask(status="inbox"){
  document.getElementById("taskForm").reset();
  document.getElementById("taskId").value="";
  document.getElementById("taskRemaining").value="";
  document.getElementById("taskDialogTitle").textContent="Nouvelle tâche";
  document.getElementById("taskStatus").value=status;
  document.getElementById("taskEstimate").value=30;
  document.getElementById("deleteTaskBtn").classList.add("hidden");
  renderChecklistEditor([]);
  document.getElementById("taskActivitySummary").classList.add("hidden");
  populateProjectSelect();
  document.getElementById("taskDialog").showModal();
  setTimeout(()=>document.getElementById("taskTitle").focus(),50);
}
function openTask(id){
  const t=state.tasks.find(x=>x.id===id); if(!t)return;
  document.getElementById("taskId").value=t.id;
  document.getElementById("taskDialogTitle").textContent="Modifier la tâche";
  document.getElementById("taskTitle").value=t.title;
  document.getElementById("taskDescription").value=t.description||"";
  document.getElementById("taskRemaining").value=t.remaining||"";
  document.getElementById("taskContext").value=t.context;
  populateProjectSelect(t.projectId||"");
  document.getElementById("taskStatus").value=t.status;
  document.getElementById("taskPriority").value=t.priority;
  document.getElementById("taskDueDate").value=t.dueDate||"";
  document.getElementById("taskEstimate").value=t.estimate||0;
  document.getElementById("taskTags").value=(t.tags||[]).join(", ");
  renderChecklistEditor(normalizeChecklist(t));
  document.getElementById("deleteTaskBtn").classList.remove("hidden");
  const sessions=taskSessions(t.id), range=sessionRange(sessions);
  const summary=document.getElementById("taskActivitySummary");
  summary.classList.remove("hidden");
  summary.innerHTML=`<strong>Activité</strong><span>${sessions.length} session(s)</span><span>${formatDurationLong(taskTrackedSeconds(t))} au total</span>${range.first?`<span>Du ${fmtDateTime(range.first)} au ${fmtDateTime(range.last)}</span>`:""}`;
  document.getElementById("taskDialog").showModal();
}
function saveTaskFromForm(){
  const id=document.getElementById("taskId").value;
  const existing=state.tasks.find(x=>x.id===id);
  const status=document.getElementById("taskStatus").value;
  const data={
    id:id||uid("task"),
    title:document.getElementById("taskTitle").value.trim(),
    description:document.getElementById("taskDescription").value.trim(),
    remaining:document.getElementById("taskRemaining").value.trim(),
    context:document.getElementById("taskContext").value,
    projectId:document.getElementById("taskProject").value||null,
    status,
    priority:document.getElementById("taskPriority").value,
    dueDate:document.getElementById("taskDueDate").value||null,
    estimate:Number(document.getElementById("taskEstimate").value)||0,
    tags:document.getElementById("taskTags").value.split(",").map(x=>x.trim()).filter(Boolean),
    checklist:readChecklistEditor(),
    manualOrder:existing && existing.priority===document.getElementById("taskPriority").value?existing.manualOrder:Date.now(),
    createdAt:existing?.createdAt||new Date().toISOString(),
    updatedAt:new Date().toISOString(),
    completedAt:status==="done"?(existing?.completedAt||new Date().toISOString()):null,
    timeSpentSeconds:existing?.timeSpentSeconds||0,
    legacyTimeSeconds:existing?.legacyTimeSeconds||0,
    legacyTimeReviewed:existing?.legacyTimeReviewed||false,
    timerStartedAt:status==="done"?null:(existing?.timerStartedAt||null)
  };
  if(status==="done" && existing?.timerStartedAt){
    stopTimer(existing);
    data.timeSpentSeconds = existing.timeSpentSeconds;
    data.timerStartedAt = null;
  }
  if(existing) Object.assign(existing,data); else state.tasks.unshift(data);
  saveState();
}
function deleteTask(){
  const id=document.getElementById("taskId").value;
  if(id && confirm("Supprimer définitivement cette tâche ?")){
    state.tasks=state.tasks.filter(x=>x.id!==id); saveState(); document.getElementById("taskDialog").close();
  }
}

function openNewProject(){
  document.getElementById("projectForm").reset();
  document.getElementById("projectId").value="";
  document.getElementById("projectDialogTitle").textContent="Nouveau projet";
  document.getElementById("deleteProjectBtn").classList.add("hidden");
  document.getElementById("projectDialog").showModal();
}
function editProject(id){
  const p=state.projects.find(x=>x.id===id); if(!p)return;
  document.getElementById("projectId").value=p.id;
  document.getElementById("projectDialogTitle").textContent="Modifier le projet";
  document.getElementById("projectName").value=p.name;
  document.getElementById("projectDescription").value=p.description||"";
  document.getElementById("projectContext").value=p.context;
  document.getElementById("projectStatus").value=p.status;
  document.getElementById("projectDueDate").value=p.dueDate||"";
  document.getElementById("deleteProjectBtn").classList.remove("hidden");
  document.getElementById("projectDialog").showModal();
}
function saveProjectFromForm(){
  const id=document.getElementById("projectId").value, existing=state.projects.find(x=>x.id===id);
  const data={id:id||uid("project"),name:document.getElementById("projectName").value.trim(),description:document.getElementById("projectDescription").value.trim(),context:document.getElementById("projectContext").value,status:document.getElementById("projectStatus").value,dueDate:document.getElementById("projectDueDate").value||null,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(existing)Object.assign(existing,data);else state.projects.unshift(data);
  saveState();
  if(existing && state.settings.currentView==="projectDetail") renderProjectDetail();
}
function deleteProject(){
  const id=document.getElementById("projectId").value;
  const linked=state.tasks.filter(t=>t.projectId===id).length;
  if(id && confirm(`Supprimer ce projet ? ${linked} tâche(s) seront conservées sans projet.`)){
    state.projects=state.projects.filter(x=>x.id!==id);
    state.tasks.forEach(t=>{if(t.projectId===id)t.projectId=null});
    saveState(); document.getElementById("projectDialog").close();
  }
}

function openNewNote(){
  document.getElementById("noteForm").reset(); document.getElementById("noteId").value="";
  document.getElementById("noteDialogTitle").textContent="Nouveau post-it";
  document.getElementById("deleteNoteBtn").classList.add("hidden"); document.getElementById("noteDialog").showModal();
}
function openNote(id){
  const n=state.notes.find(x=>x.id===id); if(!n)return;
  document.getElementById("noteId").value=n.id; document.getElementById("noteTitle").value=n.title; document.getElementById("noteContent").value=n.content||""; document.getElementById("noteContext").value=n.context; document.getElementById("noteColor").value=n.color;
  document.getElementById("noteDialogTitle").textContent="Modifier le post-it"; document.getElementById("deleteNoteBtn").classList.remove("hidden"); document.getElementById("noteDialog").showModal();
}
function saveNoteFromForm(){
  const id=document.getElementById("noteId").value, existing=state.notes.find(x=>x.id===id);
  const data={id:id||uid("note"),title:document.getElementById("noteTitle").value.trim(),content:document.getElementById("noteContent").value.trim(),context:document.getElementById("noteContext").value,color:document.getElementById("noteColor").value,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(existing)Object.assign(existing,data);else state.notes.unshift(data); saveState();
}
function deleteNote(){
  const id=document.getElementById("noteId").value;
  if(id&&confirm("Supprimer ce post-it ?")){state.notes=state.notes.filter(x=>x.id!==id);saveState();document.getElementById("noteDialog").close();}
}


function stopTimer(t){
  if(!t?.timerStartedAt) return;
  const startedAt=t.timerStartedAt;
  const endedAt=new Date().toISOString();
  let durationSeconds=Math.max(1,Math.floor((new Date(endedAt)-new Date(startedAt))/1000));
  let reviewedAt=null;

  if(durationSeconds > 14400){
    const actualMinutes=prompt(
      `Cette session dure ${formatDurationLong(durationSeconds)}.

Le chrono a peut-être été oublié. Indique la durée réelle en minutes, ou valide la valeur proposée.`,
      String(Math.round(durationSeconds/60))
    );
    if(actualMinutes!==null && actualMinutes.trim()!=="" && !Number.isNaN(Number(actualMinutes))){
      durationSeconds=Math.max(1,Math.round(Number(actualMinutes)*60));
      reviewedAt=new Date().toISOString();
    }
  }

  state.activitySessions.unshift({
    id:uid("session"),
    taskId:t.id,
    projectId:t.projectId||null,
    context:t.context,
    startedAt,
    endedAt,
    durationSeconds,
    createdAt:new Date().toISOString(),
    reviewedAt
  });

  t.timeSpentSeconds = (Number(t.timeSpentSeconds)||0) + durationSeconds;
  t.timerStartedAt = null;
  t.updatedAt = new Date().toISOString();
}
function toggleTimer(id){
  const t=state.tasks.find(x=>x.id===id); if(!t)return;
  if(t.timerStartedAt){
    stopTimer(t);
  }else{
    state.tasks.forEach(other=>{ if(other.id!==id && other.timerStartedAt) stopTimer(other); });
    t.timerStartedAt=new Date().toISOString();
    if(t.status==="inbox"||t.status==="today") t.status="doing";
    t.updatedAt=new Date().toISOString();
  }
  saveState();
}

function bindDrag(){
  document.querySelectorAll(".task-card").forEach(card=>{
    card.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",card.dataset.taskId);e.stopPropagation()});
  });
  document.querySelectorAll(".dropzone").forEach(zone=>{
    zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("drag-over")});
    zone.addEventListener("dragleave",()=>zone.classList.remove("drag-over"));
    zone.addEventListener("drop",e=>{
      e.preventDefault();zone.classList.remove("drag-over");
      const id=e.dataTransfer.getData("text/plain"),t=state.tasks.find(x=>x.id===id);
      if(t){
        t.status=zone.dataset.status;
        if(zone.dataset.projectId) t.projectId=zone.dataset.projectId;
        t.updatedAt=new Date().toISOString();
        t.completedAt=t.status==="done"?new Date().toISOString():null;
        saveState();
      }
    });
  });
}

async function saveJsonAs(){
  const content=JSON.stringify(state,null,2);
  try{
    if("showSaveFilePicker" in window){
      fileHandle=await window.showSaveFilePicker({suggestedName:`captureflow-${todayISO()}.json`,types:[{description:"Sauvegarde CaptureFlow",accept:{"application/json":[".json"]}}]});
      const writable=await fileHandle.createWritable(); await writable.write(content); await writable.close();
      alert("Sauvegarde enregistrée.");
    }else downloadJson();
  }catch(e){ if(e.name!=="AbortError") alert("Sauvegarde impossible : "+e.message); }
}
function downloadJson(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`captureflow-${todayISO()}.json`;a.click();URL.revokeObjectURL(a.href);
}
async function openJsonFile(){
  try{
    if("showOpenFilePicker" in window){
      const [handle]=await window.showOpenFilePicker({types:[{description:"Sauvegarde CaptureFlow",accept:{"application/json":[".json"]}}],multiple:false});
      const file=await handle.getFile(); await importJsonText(await file.text()); fileHandle=handle;
    }else document.getElementById("jsonFileInput").click();
  }catch(e){if(e.name!=="AbortError")alert("Ouverture impossible : "+e.message)}
}
async function openMergeJson(context){
  const input=document.getElementById("mergeJsonFileInput");
  input.dataset.context=context;
  input.click();
}
async function importJsonText(text,mode="replace",forceContext=null){
  try{
    const parsed=JSON.parse(text);
    if(!Array.isArray(parsed.tasks)||!Array.isArray(parsed.projects)||!Array.isArray(parsed.notes)) throw new Error("format invalide");
    const imported=normalizeState(parsed);
    if(mode==="merge"){
      const label=forceContext==="perso"?"Personnel":"Professionnel";
      const summary=`${imported.tasks.length} tâche(s), ${imported.projects.length} projet(s), ${imported.notes.length} post-it et ${imported.activitySessions.length} session(s)`;
      if(confirm(`Fusionner ${summary} dans le contexte ${label} ?\n\nLes données déjà présentes seront conservées.`)){
        state=mergeStates(state,imported,forceContext);
        saveState();setView("dashboard");
        alert(`Import ${label} terminé. La sauvegarde est en cours de synchronisation sur le serveur.`);
      }
    }else if(confirm("Remplacer toutes les données actuelles par cette sauvegarde ?\n\nUtilise plutôt les boutons de fusion pour réunir tes données Pro et Perso.")){
      state=imported;saveState();setView(state.settings?.currentView||"dashboard");
    }
  }catch(e){alert("Fichier JSON invalide : "+e.message)}
}
async function exportClipboard(){
  try{await navigator.clipboard.writeText(JSON.stringify(state,null,2));alert("JSON copié.");}catch(e){alert("Copie impossible.");}
}
function resetAll(){
  if(confirm("Effacer toutes les données CaptureFlow, sur le serveur et dans ce navigateur ? Cette action est irréversible sans sauvegarde JSON.")){state=structuredClone(defaultState);saveState();setView("dashboard");}
}
function seedDemo(){
  if(state.tasks.length||state.projects.length||state.notes.length){if(!confirm("Ajouter les exemples aux données existantes ?"))return}
  const p1={id:uid("project"),name:"Préparer le plan de formation",description:"Centraliser les besoins, arbitrer et produire la version validée.",context:"pro",status:"active",dueDate:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  const p2={id:uid("project"),name:"Organisation personnelle",description:"Petits travaux et rendez-vous à organiser.",context:"perso",status:"active",dueDate:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  state.projects.push(p1,p2);
  state.tasks.push(
    {id:uid("task"),title:"Recueillir les besoins des managers",description:"Consolider les réponses reçues.",context:"pro",projectId:p1.id,status:"today",priority:"high",dueDate:todayISO(),estimate:45,tags:["formation"],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null,timeSpentSeconds:0,timerStartedAt:null},
    {id:uid("task"),title:"Préparer la réunion de cadrage",description:"Ordre du jour et documents nécessaires.",context:"pro",projectId:p1.id,status:"doing",priority:"medium",dueDate:null,estimate:60,tags:["réunion"],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null,timeSpentSeconds:0,timerStartedAt:null},
    {id:uid("task"),title:"Prendre rendez-vous garage",description:"Comparer deux créneaux.",context:"perso",projectId:p2.id,status:"inbox",priority:"medium",dueDate:null,estimate:10,tags:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null,timeSpentSeconds:0,timerStartedAt:null},
    {id:uid("task"),title:"Idée d’automatisation à étudier",description:"Tester plus tard une exportation automatique.",context:"pro",projectId:null,status:"well",priority:"low",dueDate:null,estimate:30,tags:["idée"],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null,timeSpentSeconds:0,timerStartedAt:null}
  );
  state.notes.push({id:uid("note"),title:"À ne pas oublier",content:"Préparer les documents avant jeudi.",context:"pro",color:"yellow",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  saveState();
}

function dictateInto(targetId, append=false){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert("La dictée vocale n’est pas disponible dans ce navigateur. Utilise Chrome ou Edge récent.");return}
  const rec=new SR();rec.lang="fr-FR";rec.interimResults=false;rec.maxAlternatives=1;
  const btn=document.activeElement; if(btn) btn.textContent="⏺";
  rec.onresult=e=>{
    const text=e.results[0][0].transcript;
    const target=document.getElementById(targetId);
    target.value=append && target.value ? target.value+" "+text : text;
    target.dispatchEvent(new Event("input"));
  };
  rec.onerror=e=>alert("Dictée interrompue : "+e.error);
  rec.onend=()=>{ if(btn) btn.textContent="🎤"; };
  rec.start();
}
function quickVoiceTask(){
  openNewTask("inbox");
  setTimeout(()=>dictateInto("taskTitle"),300);
}

document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
document.getElementById("contextFilter").value=state.settings.contextFilter||"all";
document.getElementById("contextFilter").addEventListener("change",e=>{state.settings.contextFilter=e.target.value;saveState()});
document.getElementById("priorityFilter").value=state.settings.priorityFilter||"all";
document.getElementById("priorityFilter").addEventListener("change",e=>{state.settings.priorityFilter=e.target.value;saveState()});
document.getElementById("quickAddBtn").addEventListener("click",()=>openNewTask("inbox"));
document.getElementById("voiceQuickBtn").addEventListener("click",quickVoiceTask);
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.close).close()));
document.getElementById("taskForm").addEventListener("submit",e=>{e.preventDefault();saveTaskFromForm();document.getElementById("taskDialog").close()});
document.getElementById("projectForm").addEventListener("submit",e=>{e.preventDefault();saveProjectFromForm();document.getElementById("projectDialog").close()});
document.getElementById("noteForm").addEventListener("submit",e=>{e.preventDefault();saveNoteFromForm();document.getElementById("noteDialog").close()});
document.getElementById("recurringForm").addEventListener("submit",e=>{e.preventDefault();saveRecurringFromForm();document.getElementById("recurringDialog").close()});
document.getElementById("deleteTaskBtn").addEventListener("click",deleteTask);
document.getElementById("deleteProjectBtn").addEventListener("click",deleteProject);
document.getElementById("deleteNoteBtn").addEventListener("click",deleteNote);
document.getElementById("deleteRecurringBtn").addEventListener("click",deleteRecurring);
document.getElementById("voiceRecurringTitleBtn").addEventListener("click",()=>dictateInto("recurringTitle"));
document.getElementById("voiceTitleBtn").addEventListener("click",()=>dictateInto("taskTitle"));
document.getElementById("voiceDescriptionBtn").addEventListener("click",()=>dictateInto("taskDescription",true));
document.getElementById("voiceRemainingBtn").addEventListener("click",()=>dictateInto("taskRemaining",true));
document.getElementById("voiceNoteBtn").addEventListener("click",()=>dictateInto("noteContent",true));
document.getElementById("addChecklistItemBtn").addEventListener("click",addChecklistEditorItem);
document.getElementById("jsonFileInput").addEventListener("change",async e=>{const f=e.target.files[0];if(f)await importJsonText(await f.text());e.target.value=""});
document.getElementById("mergeJsonFileInput").addEventListener("change",async e=>{const f=e.target.files[0],context=e.target.dataset.context;if(f)await importJsonText(await f.text(),"merge",context);e.target.value=""});

document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const button=document.getElementById("loginButton"),error=document.getElementById("loginError");
  button.disabled=true;button.textContent="Connexion…";error.classList.add("hidden");
  try{
    const response=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:document.getElementById("loginUsername").value,password:document.getElementById("loginPassword").value})});
    if(!response.ok)throw new Error("Identifiant ou mot de passe incorrect.");
    document.getElementById("loginPassword").value="";
    await initializeCloud();
  }catch(err){error.textContent=err.message;error.classList.remove("hidden");}
  finally{button.disabled=false;button.textContent="Se connecter";}
});
document.getElementById("logoutBtn").addEventListener("click",async()=>{await fetch("/api/logout",{method:"POST"});location.reload();});

window.openTask=openTask;window.openNewTask=openNewTask;window.moveTask=moveTask;window.setDashboardTab=setDashboardTab;window.setAdminTab=setAdminTab;window.setActivityTab=setActivityTab;window.openNewRecurring=openNewRecurring;window.editRecurring=editRecurring;window.createTaskFromRecurring=createTaskFromRecurring;window.openProjectWorkspace=openProjectWorkspace;window.setProjectTab=setProjectTab;window.editProject=editProject;window.openNewTaskForProject=openNewTaskForProject;window.removeChecklistEditorItem=removeChecklistEditorItem;window.openNewTaskForDate=openNewTaskForDate;window.changeCalendarMonth=changeCalendarMonth;window.toggleTimer=toggleTimer;window.editSession=editSession;window.setLegacyTime=setLegacyTime;window.deleteSession=deleteSession;window.addImprovement=addImprovement;window.dictateImprovement=dictateImprovement;window.updateImprovement=updateImprovement;window.deleteImprovement=deleteImprovement;window.openNewProject=openNewProject;window.openNewNote=openNewNote;window.openNote=openNote;window.renderInboxFiltered=renderInboxFiltered;
window.saveJsonAs=saveJsonAs;window.downloadJson=downloadJson;window.openJsonFile=openJsonFile;window.openMergeJson=openMergeJson;window.exportClipboard=exportClipboard;window.resetAll=resetAll;window.seedDemo=seedDemo;

setView(state.settings.currentView||"dashboard");
initializeCloud();
setInterval(()=>{ if(state.tasks.some(t=>t.timerStartedAt)) renderCurrent(); },1000);
