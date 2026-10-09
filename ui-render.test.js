const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const logic = require("./logic");

function runUi(data, expression) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        value: "",
        innerHTML: "",
        textContent: "",
        reset: () => {},
        showModal: () => {},
        close: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} }
      });
    }
    return elements.get(id);
  };
  const source = fs.readFileSync("./app.js", "utf8").split('\ndocument.querySelectorAll(".nav-btn").forEach')[0];
  const context = {
    CaptureFlowLogic: logic,
    console,
    structuredClone,
    localStorage: {
      getItem: () => JSON.stringify(data),
      setItem: () => {}
    },
    document: {
      getElementById: element,
      querySelectorAll: () => [],
      querySelector: () => null
    },
    setTimeout: () => 0,
    clearTimeout: () => {}
  };
  vm.runInNewContext(`${source}\n${expression}`, context);
  return context.result;
}

test("Aujourd'hui sépare En cours, À faire et En attente sans doublon", () => {
  const html = runUi({
    meta: { version: 7 },
    settings: { contextFilter: "all", priorityFilter: "all", todayTab: "waiting" },
    projects: [], notes: [], improvements: [], recurringTasks: [], activitySessions: [],
    tasks: [
      { id: "doing", title: "Tâche active", status: "doing", context: "pro", priority: "high", dueDate: new Date().toISOString().slice(0, 10) },
      { id: "today", title: "Tâche du jour", status: "today", context: "pro", priority: "medium" },
      { id: "waiting", title: "Tâche bloquée", status: "waiting", context: "pro", priority: "low" }
    ]
  }, 'renderToday(); globalThis.result=document.getElementById("todayView").innerHTML;');

  assert.match(html, /En cours/);
  assert.match(html, /À faire aujourd’hui/);
  assert.match(html, /En attente/);
  assert.match(html, /Tâche bloquée/);
  assert.doesNotMatch(html, /Tâche active/);
  assert.doesNotMatch(html, /Tâche du jour/);
});

test("le sélecteur de projet est filtré et trié selon le contexte de la tâche", () => {
  const html = runUi({
    meta: { version: 7 },
    settings: { contextFilter: "all", priorityFilter: "all" },
    projects: [
      { id: "z", name: "Zulu", context: "pro" },
      { id: "perso", name: "Maison", context: "perso" },
      { id: "a", name: "Alpha", context: "pro" }
    ],
    tasks: [], notes: [], improvements: [], recurringTasks: [], activitySessions: []
  }, 'document.getElementById("taskContext").value="pro"; populateProjectSelect(); globalThis.result=document.getElementById("taskProject").innerHTML;');

  assert.ok(html.indexOf("Alpha") < html.indexOf("Zulu"));
  assert.doesNotMatch(html, /Maison/);
  assert.match(html, /Aucun projet/);
});

test("les cartes projets compactes gardent les métriques essentielles", () => {
  const html = runUi({
    meta: { version: 7 },
    settings: { contextFilter: "all", priorityFilter: "all" },
    projects: [{ id: "p1", name: "Alpha", description: "Description secondaire détaillée", context: "pro", status: "active", updatedAt: "2026-08-25T08:00:00.000Z" }],
    tasks: [{ id: "t1", projectId: "p1", title: "Tâche", status: "done", context: "pro", priority: "high", legacyTimeSeconds: 600, legacyTimeReviewed: true }],
    notes: [], improvements: [], recurringTasks: [], activitySessions: []
  }, 'renderProjects(); globalThis.result=document.getElementById("projectsView").innerHTML;');

  assert.match(html, /project-card-compact/);
  assert.match(html, /progression/);
  assert.match(html, /temps total/);
  assert.doesNotMatch(html, /Description secondaire détaillée/);
});


test("une amélioration terminée disparaît du backlog actif", () => {
  const html = runUi({
    meta: { version: 8 },
    settings: { contextFilter: "pro", priorityFilter: "all" },
    projects: [], tasks: [], notes: [], recurringTasks: [], activitySessions: [],
    improvements: [
      { id: "active", text: "Encore à faire", context: "pro", priority: "high", status: "doing", createdAt: "2026-10-02T08:00:00.000Z" },
      { id: "done", text: "Déjà terminée", context: "pro", priority: "medium", status: "done", createdAt: "2026-10-02T07:00:00.000Z" }
    ]
  }, 'renderImprovements(); globalThis.result=document.getElementById("improvementsView").innerHTML;');

  assert.match(html, /Encore à faire/);
  assert.doesNotMatch(html, /Déjà terminée/);
});

test("un nouveau post-it hérite du contexte Personnel courant", () => {
  const contextValue = runUi({
    meta: { version: 8 },
    settings: { contextFilter: "perso", priorityFilter: "all" },
    projects: [], tasks: [], notes: [], improvements: [], recurringTasks: [], activitySessions: []
  }, 'openNewNote(); globalThis.result=document.getElementById("noteContext").value;');

  assert.equal(contextValue, "perso");
});

test("les post-it restent strictement isolés entre Personnel et Professionnel", () => {
  const html = runUi({
    meta: { version: 8 },
    settings: { contextFilter: "perso", priorityFilter: "all" },
    projects: [], tasks: [], improvements: [], recurringTasks: [], activitySessions: [],
    notes: [
      { id: "perso", title: "Maison", content: "Personnel", context: "perso", color: "yellow" },
      { id: "pro", title: "Bureau", content: "Professionnel", context: "pro", color: "blue" }
    ]
  }, 'renderNotes(); globalThis.result=document.getElementById("notesView").innerHTML;');

  assert.match(html, /Maison/);
  assert.doesNotMatch(html, /Bureau/);
});

function projectFixture(settings={}) {
  return {
    meta: { version: 8 },
    settings: { contextFilter: "all", priorityFilter: "all", currentView: "projectDetail", currentProjectId: "p1", ...settings },
    projects: [
      { id: "p1", name: "Alpha & RH", context: "pro", status: "active" },
      { id: "p2", name: "Bravo", context: "pro", status: "paused" },
      { id: "p3", name: "Maison", context: "perso", status: "active" }
    ],
    tasks: [
      ...["inbox","today","doing","waiting","waiting_reply","well"].map((status,i)=>({ id: status, projectId: "p1", title: `Action ${status}`, status, context: "pro", priority: "high", manualOrder: i*2 })),
      { id: "done", projectId: "p1", title: "Action achevée", status: "done", context: "pro", priority: "high", manualOrder: 1 },
      { id: "bravo", projectId: "p2", title: "Action Bravo", status: "today", context: "pro", priority: "low" },
      { id: "perso", projectId: "p3", title: "Action maison", status: "doing", context: "perso", priority: "high" },
      { id: "free", title: "Action sans projet", status: "doing", context: "pro", priority: "high" }
    ],
    notes: [], improvements: [], recurringTasks: [], activitySessions: []
  };
}

test("la liste d'un projet garde tous les statuts non terminés et sépare les terminées", () => {
  const html = runUi(projectFixture(), 'renderProjectDetail(); globalThis.result=document.getElementById("projectDetailView").innerHTML;');
  for (const status of ["inbox","today","doing","waiting","waiting_reply","well"]) assert.match(html, new RegExp(`Action ${status}`));
  assert.doesNotMatch(html, /Action achevée|Action Bravo|Action maison|Action sans projet/);
  assert.match(html, /En cours <span class="badge">6/);
  assert.match(html, /Terminées <span class="badge">1/);

  const doneHtml = runUi(projectFixture(), 'setProjectTaskFilter("done"); globalThis.result=document.getElementById("projectDetailView").innerHTML;');
  assert.match(doneHtml, /Action achevée/);
  assert.doesNotMatch(doneHtml, /Action doing|Action waiting/);
});

test("la vue tâches par projet regroupe les tâches avec références et respecte le contexte", () => {
  const html = runUi(projectFixture({ currentView: "projects", projectsTab: "tasks", contextFilter: "pro" }), 'renderProjects(); globalThis.result=document.getElementById("projectsView").innerHTML;');
  assert.match(html, /Liste des projets/);
  assert.match(html, /Tâches par projet/);
  assert.equal((html.match(/<section class="card project-task-group">/g)||[]).length, 2);
  assert.match(html, /project-reference[^>]*onclick="openProjectWorkspace\('p1'\)"/);
  assert.match(html, /Alpha &amp; RH/);
  assert.match(html, /Action Bravo/);
  assert.doesNotMatch(html, /Action maison|Action sans projet|Action achevée/);
});

test("les filtres de priorité et les terminées s'appliquent aussi à la vue groupée", () => {
  const data = projectFixture({ currentView: "projects", projectsTab: "tasks", contextFilter: "pro", priorityFilter: "high" });
  const html = runUi(data, 'renderProjects(); globalThis.result=document.getElementById("projectsView").innerHTML;');
  assert.doesNotMatch(html, /Action Bravo|Action achevée/);
  const doneHtml = runUi(data, 'setProjectTaskFilter("done"); globalThis.result=document.getElementById("projectsView").innerHTML;');
  assert.match(doneHtml, /Action achevée/);
  assert.doesNotMatch(doneHtml, /Action doing|Action Bravo/);
});

test("terminer puis rouvrir une tâche la déplace automatiquement entre les deux listes", () => {
  const result = runUi(projectFixture(), `
    openTask("doing");
    document.getElementById("taskProject").value="p1";
    document.getElementById("taskStatus").value="done";
    saveTaskFromForm();
    const active=document.getElementById("projectDetailView").innerHTML;
    setProjectTaskFilter("done");
    const done=document.getElementById("projectDetailView").innerHTML;
    document.getElementById("taskStatus").value="waiting_reply";
    saveTaskFromForm();
    const doneAfterReopen=document.getElementById("projectDetailView").innerHTML;
    setProjectTaskFilter("active");
    globalThis.result={active,done,doneAfterReopen,activeAfterReopen:document.getElementById("projectDetailView").innerHTML};
  `);
  assert.doesNotMatch(result.active, /Action doing/);
  assert.match(result.done, /Action doing/);
  assert.doesNotMatch(result.doneAfterReopen, /Action doing/);
  assert.match(result.activeAfterReopen, /Action doing/);
});

test("réordonner une tâche active ignore les tâches terminées intercalées", () => {
  const result = runUi(projectFixture(), 'moveTask("inbox",1,"project"); globalThis.result=state.tasks.map(t=>({id:t.id,order:t.manualOrder}));');
  assert.equal(result.find(t=>t.id==="inbox").order, 2);
  assert.equal(result.find(t=>t.id==="today").order, 0);
  assert.equal(result.find(t=>t.id==="done").order, 1);
});

test("ouvrir un projet remet la liste active par défaut, même après consultation des terminées", () => {
  const html = runUi(projectFixture({ projectTaskFilter: "done" }), 'openProjectWorkspace("p1"); globalThis.result=document.getElementById("projectDetailView").innerHTML;');
  assert.match(html, /Action doing/);
  assert.doesNotMatch(html, /Action achevée/);
});
