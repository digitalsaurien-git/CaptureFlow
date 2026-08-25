const test = require("node:test");
const assert = require("node:assert/strict");
const { priorityManualSort, isUnreviewedLegacyTask, isUnreviewedLongSession } = require("./logic");

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
