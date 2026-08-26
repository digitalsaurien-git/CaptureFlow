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
