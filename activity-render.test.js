const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const logic = require("./logic");

function renderActivityWith(data) {
  const activityView = { innerHTML: "" };
  const source = fs.readFileSync("./app.js", "utf8").split('\ndocument.querySelectorAll(".nav-btn").forEach')[0];
  const context = {
    CaptureFlowLogic: logic,
    console,
    structuredClone,
    localStorage: {
      getItem: () => JSON.stringify(data),
      setItem: () => {}
    },
    document: { getElementById: () => activityView }
  };
  vm.runInNewContext(`${source}\nrenderActivity();`, context);
  return activityView.innerHTML;
}

test("le journal présente les vues synthèse, projet, sans projet, sessions et corrections", () => {
  const html = renderActivityWith({
    meta: { version: 6 },
    settings: { contextFilter: "all", priorityFilter: "all", activityTab: "summary" },
    projects: [{ id: "p1", name: "Projet Alpha", context: "pro" }],
    tasks: [
      { id: "t1", title: "Tâche projet", context: "pro", projectId: "p1", priority: "high", legacyTimeSeconds: 600, legacyTimeReviewed: true },
      { id: "t2", title: "Tâche libre", context: "pro", projectId: null, priority: "medium", legacyTimeSeconds: 0 }
    ],
    notes: [], improvements: [], recurringTasks: [], activitySessions: [
      { id: "s1", taskId: "t2", projectId: null, context: "pro", startedAt: "2026-08-25T08:00:00.000Z", endedAt: "2026-08-25T08:30:00.000Z", durationSeconds: 1800 }
    ]
  });
  for (const label of ["Synthèse", "Par projet", "Sans projet", "Détail des sessions", "À corriger"]) assert.match(html, new RegExp(label));
  assert.match(html, /Projet Alpha/);
  assert.match(html, /Tâche libre/);
  assert.doesNotMatch(html, /temps à corriger/);
});

test("seuls les temps non validés alimentent le bandeau de correction", () => {
  const html = renderActivityWith({
    meta: { version: 6 },
    settings: { contextFilter: "all", priorityFilter: "all", activityTab: "summary" },
    projects: [], notes: [], improvements: [], recurringTasks: [], activitySessions: [],
    tasks: [{ id: "t1", title: "Ancienne tâche", context: "pro", priority: "medium", legacyTimeSeconds: 900, legacyTimeReviewed: false }]
  });
  assert.match(html, /1 temps à corriger/);
});
