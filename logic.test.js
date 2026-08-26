const test = require("node:test");
const assert = require("node:assert/strict");
const {
  priorityManualSort,
  isUnreviewedLegacyTask,
  isUnreviewedLongSession,
  projectOptionsForContext,
  statusAfterTimerStart,
  shouldStopTimerForStatus,
  sessionDurationSeconds,
  sessionInDateRange,
  buildActivityReport
} = require("./logic");

test("la priorité prime sur l'ordre manuel", () => {
  const tasks = [
    { id: "low", priority: "low", manualOrder: 1 },
    { id: "urgent-2", priority: "urgent", manualOrder: 20 },
    { id: "high", priority: "high", manualOrder: 0 },
    { id: "urgent-1", priority: "urgent", manualOrder: 10 }
  ];
  assert.deepEqual(priorityManualSort(tasks).map(task => task.id), ["urgent-1", "urgent-2", "high", "low"]);
});

test("un temps ancien corrigé ne reste pas à corriger", () => {
  assert.equal(isUnreviewedLegacyTask({ legacyTimeSeconds: 600, legacyTimeReviewed: false }), true);
  assert.equal(isUnreviewedLegacyTask({ legacyTimeSeconds: 600, legacyTimeReviewed: true }), false);
  assert.equal(isUnreviewedLegacyTask({ legacyTimeSeconds: 0, legacyTimeReviewed: false }), false);
});

test("une session longue validée ne reste pas signalée", () => {
  assert.equal(isUnreviewedLongSession({ durationSeconds: 18000 }), true);
  assert.equal(isUnreviewedLongSession({ durationSeconds: 18000, reviewedAt: "2026-08-25T08:00:00.000Z" }), false);
});

test("les projets proposés respectent le contexte et l'ordre alphabétique", () => {
  const projects = [
    { id: "p-z", name: "Zèbre", context: "pro" },
    { id: "p-a", name: "Alpha", context: "pro" },
    { id: "perso", name: "Maison", context: "perso" }
  ];
  assert.deepEqual(projectOptionsForContext(projects, "pro").map(project => project.id), ["p-a", "p-z"]);
  assert.deepEqual(projectOptionsForContext(projects, "perso").map(project => project.id), ["perso"]);
});

test("démarrer une tâche la place toujours en cours", () => {
  for (const status of ["inbox", "today", "waiting", "well", "done"]) {
    assert.equal(statusAfterTimerStart(status), "doing");
  }
});

test("pause, attente et fin clôturent la session avec une durée exacte", () => {
  assert.equal(shouldStopTimerForStatus("doing"), false);
  assert.equal(shouldStopTimerForStatus("waiting"), true);
  assert.equal(shouldStopTimerForStatus("done"), true);
  assert.equal(
    sessionDurationSeconds("2026-08-25T08:00:00.000Z", "2026-08-25T08:42:17.000Z"),
    2537
  );
});

test("la période inclut ses dates de début et de fin", () => {
  const session = { startedAt: "2026-08-25T08:00:00.000Z" };
  assert.equal(sessionInDateRange(session, "2026-08-25", "2026-08-25"), true);
  assert.equal(sessionInDateRange(session, "2026-08-26", ""), false);
  assert.equal(sessionInDateRange({}, "", ""), false);
});

test("le rapport ne compte jamais deux fois une session", () => {
  const report = buildActivityReport({
    projects: [{ id: "p1", name: "Alpha", context: "pro", status: "active" }],
    tasks: [{
      id: "t1",
      title: "Préparer le bilan",
      projectId: "p1",
      context: "pro",
      priority: "high",
      status: "done",
      legacyTimeSeconds: 600,
      legacyTimeReviewed: true
    }],
    activitySessions: [{
      id: "s1",
      taskId: "t1",
      projectId: "p1",
      context: "pro",
      startedAt: "2026-08-25T08:00:00.000Z",
      endedAt: "2026-08-25T08:30:00.000Z",
      durationSeconds: 1800
    }]
  }, { context: "pro" });

  assert.equal(report.general.sessionCount, 1);
  assert.equal(report.general.totalSessionSeconds, 1800);
  assert.equal(report.general.totalLegacyRetainedSeconds, 600);
  assert.equal(report.general.totalSeconds, 2400);
  assert.equal(report.projects[0].totalSeconds, 2400);
  assert.equal(report.tasks[0].totalSeconds, 2400);
});

test("un temps historique sans date est exclu d'une période mais reste documenté", () => {
  const report = buildActivityReport({
    projects: [],
    tasks: [{
      id: "t1",
      title: "Ancienne tâche",
      projectId: null,
      context: "perso",
      priority: "medium",
      status: "done",
      legacyTimeSeconds: 900,
      legacyTimeReviewed: true
    }],
    activitySessions: []
  }, { context: "perso", from: "2026-08-01", to: "2026-08-31" });

  assert.equal(report.general.totalLegacyValidatedSeconds, 900);
  assert.equal(report.general.totalLegacyRetainedSeconds, 0);
  assert.equal(report.general.totalSeconds, 0);
  assert.equal(report.tasks[0].legacyValidatedSeconds, 900);
});
