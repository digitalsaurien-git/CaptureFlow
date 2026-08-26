const test = require("node:test");
const assert = require("node:assert/strict");
const ExcelJS = require("exceljs");
const { buildActivityReport, buildActivityWorkbook } = require("./logic");

const state = {
  projects: [
    { id: "pro-a", name: "Projet Alpha", context: "pro", status: "active", createdAt: "2026-08-01T08:00:00.000Z" },
    { id: "perso", name: "Maison", context: "perso", status: "active", createdAt: "2026-08-01T08:00:00.000Z" }
  ],
  tasks: [
    { id: "t1", title: "Bilan", projectId: "pro-a", context: "pro", priority: "urgent", status: "done", legacyTimeSeconds: 600, legacyTimeReviewed: true },
    { id: "t2", title: "Courses", projectId: "perso", context: "perso", priority: "medium", status: "today", legacyTimeSeconds: 0, legacyTimeReviewed: false }
  ],
  activitySessions: [
    { id: "s1", taskId: "t1", projectId: "pro-a", context: "pro", startedAt: "2026-08-25T08:00:00.000Z", endedAt: "2026-08-25T08:30:00.000Z", durationSeconds: 1800 },
    { id: "s2", taskId: "t2", projectId: "perso", context: "perso", startedAt: "2026-08-25T09:00:00.000Z", endedAt: "2026-08-25T09:10:00.000Z", durationSeconds: 600 }
  ]
};

test("l'export respecte le contexte et les projets sélectionnés", () => {
  const report = buildActivityReport(state, {
    context: "pro",
    projectIds: ["pro-a"]
  });

  assert.equal(report.general.projectCount, 1);
  assert.equal(report.general.taskCount, 1);
  assert.equal(report.general.sessionCount, 1);
  assert.equal(report.general.totalSeconds, 2400);
  assert.deepEqual(report.general.projectNames, ["Projet Alpha"]);
  assert.equal(report.sessions[0].id, "s1");
});

test("le classeur Excel contient les quatre feuilles et des durées numériques", async () => {
  const report = buildActivityReport(state, { context: "pro" });
  const workbook = buildActivityWorkbook(ExcelJS, report);

  assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), [
    "Synthèse générale",
    "Détail par projet",
    "Détail des tâches",
    "Sessions d’activité"
  ]);
  assert.equal(workbook.getWorksheet("Détail par projet").rowCount, 2);
  assert.equal(workbook.getWorksheet("Détail des tâches").rowCount, 2);
  assert.equal(workbook.getWorksheet("Sessions d’activité").rowCount, 2);
  assert.equal(
    workbook.getWorksheet("Synthèse générale").getCell("B14").value,
    2400 / 86400
  );

  const buffer = await workbook.xlsx.writeBuffer();
  assert.equal(Buffer.from(buffer).subarray(0, 2).toString("utf8"), "PK");
  assert.ok(buffer.byteLength > 5000);
});
