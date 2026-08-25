(function exposeCaptureFlowLogic(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CaptureFlowLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildCaptureFlowLogic() {
  const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };

  function priorityManualSort(items) {
    return [...items].sort((a, b) => {
      const priorityDifference = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
      if (priorityDifference) return priorityDifference;
      const orderDifference = (Number(a.manualOrder) || 0) - (Number(b.manualOrder) || 0);
      if (orderDifference) return orderDifference;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
  }

  function isUnreviewedLegacyTask(task) {
    return Math.max(0, Number(task?.legacyTimeSeconds) || 0) > 0 && !task?.legacyTimeReviewed;
  }

  function isUnreviewedLongSession(session) {
    return (Number(session?.durationSeconds) || 0) > 14400 && !session?.reviewedAt;
  }

  return { priorityRank, priorityManualSort, isUnreviewedLegacyTask, isUnreviewedLongSession };
});
