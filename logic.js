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

  function projectOptionsForContext(projects, context) {
    return (Array.isArray(projects) ? projects : [])
      .filter(project => project?.context === context)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr", {
        sensitivity: "base"
      }));
  }

  function statusAfterTimerStart() {
    return "doing";
  }

  function shouldStopTimerForStatus(status) {
    return status !== "doing";
  }

  function sessionDurationSeconds(startedAt, endedAt) {
    const milliseconds = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    if (!Number.isFinite(milliseconds)) return 1;
    return Math.max(1, Math.floor(milliseconds / 1000));
  }

  function sessionInDateRange(session, from = "", to = "") {
    const date = String(session?.startedAt || "").slice(0, 10);
    if (!date) return false;
    return (!from || date >= from) && (!to || date <= to);
  }

  function buildActivityReport(source, filters = {}) {
    const projects = Array.isArray(source?.projects) ? source.projects : [];
    const tasks = Array.isArray(source?.tasks) ? source.tasks : [];
    const activitySessions = Array.isArray(source?.activitySessions) ? source.activitySessions : [];
    const context = filters.context || "all";
    const priority = filters.priority || "all";
    const from = filters.from || "";
    const to = filters.to || "";
    const hasDateFilter = Boolean(from || to);
    const selectedProjectIds = Array.isArray(filters.projectIds)
      ? [...new Set(filters.projectIds.filter(Boolean))]
      : [];
    const taskById = new Map(tasks.map(task => [task.id, task]));

    const contextMatches = item => context === "all" || item?.context === context;
    const priorityMatches = task => priority === "all" || task?.priority === priority;
    const projectMatches = projectId =>
      selectedProjectIds.length === 0 || selectedProjectIds.includes(projectId || "__none__");
    const sessionTask = session => taskById.get(session.taskId);
    const sessionContext = session => session.context || sessionTask(session)?.context || "";
    const sessionProjectId = session => session.projectId || sessionTask(session)?.projectId || null;

    const filteredProjects = projects
      .filter(project => contextMatches(project) && projectMatches(project.id))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr", {
        sensitivity: "base"
      }));
    const filteredTasks = tasks.filter(task =>
      contextMatches(task) && priorityMatches(task) && projectMatches(task.projectId)
    );
    const filteredTaskIds = new Set(filteredTasks.map(task => task.id));
    const filteredSessions = activitySessions
      .filter(session => {
        const task = sessionTask(session);
        const contextOk = context === "all" || sessionContext(session) === context;
        const priorityOk = priority === "all" || (task && task.priority === priority);
        return contextOk && priorityOk && projectMatches(sessionProjectId(session)) &&
          sessionInDateRange(session, from, to);
      })
      .sort((a, b) => String(a.startedAt || "").localeCompare(String(b.startedAt || "")));

    const validatedLegacySeconds = task =>
      task?.legacyTimeReviewed ? Math.max(0, Number(task.legacyTimeSeconds) || 0) : 0;
    const sessionsForTask = taskId => filteredSessions.filter(session => session.taskId === taskId);
    const sessionsForProject = projectId =>
      filteredSessions.filter(session => sessionProjectId(session) === (projectId || null));
    const secondsOf = sessions =>
      sessions.reduce((sum, session) => sum + Math.max(0, Number(session.durationSeconds) || 0), 0);
    const rangeOf = sessions => {
      if (!sessions.length) return { first: "", last: "" };
      const starts = sessions.map(session => session.startedAt).filter(Boolean).sort();
      const ends = sessions.map(session => session.endedAt || session.startedAt).filter(Boolean).sort();
      return { first: starts[0] || "", last: ends[ends.length - 1] || "" };
    };
    const lastOf = values => values.filter(Boolean).sort().at(-1) || "";

    const projectRows = filteredProjects.map(project => {
      const projectTasks = filteredTasks.filter(task => task.projectId === project.id);
      const sessions = sessionsForProject(project.id);
      const sessionSeconds = secondsOf(sessions);
      const legacyValidatedSeconds = projectTasks.reduce(
        (sum, task) => sum + validatedLegacySeconds(task),
        0
      );
      const legacyRetainedSeconds = hasDateFilter ? 0 : legacyValidatedSeconds;
      const doneTasks = projectTasks.filter(task => task.status === "done").length;
      const range = rangeOf(sessions);
      return {
        id: project.id,
        name: project.name || "Projet sans nom",
        context: project.context || "",
        status: project.status || "",
        taskCount: projectTasks.length,
        doneTasks,
        remainingTasks: projectTasks.length - doneTasks,
        progressPercent: projectTasks.length ? Math.round(doneTasks / projectTasks.length * 100) : 0,
        sessionCount: sessions.length,
        sessionSeconds,
        legacyValidatedSeconds,
        legacyRetainedSeconds,
        totalSeconds: sessionSeconds + legacyRetainedSeconds,
        startedAt: project.createdAt || "",
        firstActivityAt: range.first,
        lastActivityAt: hasDateFilter ? range.last : lastOf([
          range.last,
          project.updatedAt,
          ...projectTasks.map(task => task.updatedAt)
        ]),
        completedAt: project.completedAt || ""
      };
    });

    const unassignedTasks = filteredTasks.filter(task => !task.projectId);
    const unassignedSessions = sessionsForProject(null);
    if (unassignedTasks.length || unassignedSessions.length) {
      const sessionSeconds = secondsOf(unassignedSessions);
      const legacyValidatedSeconds = unassignedTasks.reduce(
        (sum, task) => sum + validatedLegacySeconds(task),
        0
      );
      const doneTasks = unassignedTasks.filter(task => task.status === "done").length;
      const range = rangeOf(unassignedSessions);
      projectRows.push({
        id: "__none__",
        name: "Sans projet",
        context,
        status: "",
        taskCount: unassignedTasks.length,
        doneTasks,
        remainingTasks: unassignedTasks.length - doneTasks,
        progressPercent: unassignedTasks.length
          ? Math.round(doneTasks / unassignedTasks.length * 100)
          : 0,
        sessionCount: unassignedSessions.length,
        sessionSeconds,
        legacyValidatedSeconds,
        legacyRetainedSeconds: hasDateFilter ? 0 : legacyValidatedSeconds,
        totalSeconds: sessionSeconds + (hasDateFilter ? 0 : legacyValidatedSeconds),
        startedAt: "",
        firstActivityAt: range.first,
        lastActivityAt: hasDateFilter ? range.last : lastOf([
          range.last,
          ...unassignedTasks.map(task => task.updatedAt)
        ]),
        completedAt: ""
      });
    }

    const projectTotalById = new Map(projectRows.map(project => [project.id, project.totalSeconds]));
    const taskRows = filteredTasks.map(task => {
      const sessions = sessionsForTask(task.id);
      const range = rangeOf(sessions);
      const sessionSeconds = secondsOf(sessions);
      const legacyValidatedSeconds = validatedLegacySeconds(task);
      const legacyRetainedSeconds = hasDateFilter ? 0 : legacyValidatedSeconds;
      return {
        id: task.id,
        projectId: task.projectId || "__none__",
        project: projects.find(project => project.id === task.projectId)?.name || "Sans projet",
        context: task.context || "",
        title: task.title || "Tâche sans titre",
        status: task.status || "",
        priority: task.priority || "",
        dueDate: task.dueDate || "",
        sessionCount: sessions.length,
        sessionSeconds,
        legacyValidatedSeconds,
        legacyRetainedSeconds,
        totalSeconds: sessionSeconds + legacyRetainedSeconds,
        projectTotalSeconds: projectTotalById.get(task.projectId || "__none__") || 0,
        firstActivityAt: range.first,
        lastActivityAt: range.last,
        comment: task.remaining || task.description || ""
      };
    });

    const sessionRows = filteredSessions.map(session => {
      const task = sessionTask(session);
      const projectId = sessionProjectId(session);
      return {
        id: session.id,
        projectId: projectId || "__none__",
        project: projects.find(project => project.id === projectId)?.name || "Sans projet",
        context: sessionContext(session),
        taskId: session.taskId || "",
        task: task?.title || "Tâche supprimée",
        status: task?.status || "",
        priority: task?.priority || "",
        date: String(session.startedAt || "").slice(0, 10),
        startedAt: session.startedAt || "",
        endedAt: session.endedAt || "",
        durationSeconds: Math.max(0, Number(session.durationSeconds) || 0),
        reviewed: Boolean(session.reviewedAt),
        comment: task?.remaining || task?.description || ""
      };
    });

    const totalSessionSeconds = sessionRows.reduce((sum, session) => sum + session.durationSeconds, 0);
    const totalLegacyValidatedSeconds = taskRows.reduce(
      (sum, task) => sum + task.legacyValidatedSeconds,
      0
    );
    const totalLegacyRetainedSeconds = hasDateFilter ? 0 : totalLegacyValidatedSeconds;
    const doneTasks = filteredTasks.filter(task => task.status === "done").length;

    return {
      filters: { context, priority, from, to, projectIds: selectedProjectIds },
      hasDateFilter,
      general: {
        projectCount: filteredProjects.length,
        projectNames: filteredProjects.map(project => project.name || "Projet sans nom"),
        taskCount: filteredTasks.length,
        doneTasks,
        remainingTasks: filteredTasks.length - doneTasks,
        sessionCount: sessionRows.length,
        totalSessionSeconds,
        totalLegacyValidatedSeconds,
        totalLegacyRetainedSeconds,
        totalSeconds: totalSessionSeconds + totalLegacyRetainedSeconds,
        activeTimerCount: filteredTasks.filter(task => task.timerStartedAt).length
      },
      projects: projectRows,
      tasks: taskRows,
      sessions: sessionRows,
      tracedTasks: taskRows.filter(task => task.totalSeconds > 0 || task.legacyValidatedSeconds > 0),
      unreviewedLegacyTasks: filteredTasks.filter(isUnreviewedLegacyTask),
      unreviewedLongSessions: filteredSessions.filter(isUnreviewedLongSession),
      filteredTaskIds
    };
  }

  function buildActivityWorkbook(ExcelJS, report) {
    if (!ExcelJS?.Workbook) throw new Error("Bibliothèque Excel indisponible.");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CaptureFlow";
    workbook.created = new Date();
    const duration = seconds => Math.max(0, Number(seconds) || 0) / 86400;
    const contextLabel = value => ({ pro: "Professionnel", perso: "Personnel", all: "Tous" })[value] || value;
    const statusLabel = value => ({ inbox: "Corbeille", today: "À faire aujourd’hui", doing: "En cours", waiting: "En attente", done: "Terminé", well: "Puits", active: "Actif", paused: "En pause", completed: "Terminé" })[value] || value;
    const priorityLabel = value => ({ urgent: "Urgente", high: "Haute", medium: "Moyenne", low: "Basse" })[value] || value;
    const styleSheet = (sheet, durationColumns = []) => {
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
      sheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF155E54" } };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
      sheet.getRow(1).height = 28;
      durationColumns.forEach(key => {
        sheet.getColumn(key).numFmt = "[h]:mm:ss";
      });
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
      });
    };

    const summary = workbook.addWorksheet("Synthèse générale");
    summary.columns = [{ key: "label", width: 38 }, { key: "value", width: 70 }];
    summary.addRows([
      { label: "Indicateur", value: "Valeur" },
      { label: "Période du", value: report.filters.from || "Toutes les dates" },
      { label: "Période au", value: report.filters.to || "Toutes les dates" },
      { label: "Contexte", value: contextLabel(report.filters.context) },
      { label: "Priorité", value: priorityLabel(report.filters.priority) || "Toutes" },
      { label: "Nombre de projets", value: report.general.projectCount },
      { label: "Projets concernés", value: report.general.projectNames.join(", ") || "Sans projet uniquement" },
      { label: "Nombre de tâches", value: report.general.taskCount },
      { label: "Tâches terminées", value: report.general.doneTasks },
      { label: "Tâches restantes", value: report.general.remainingTasks },
      { label: "Nombre de sessions", value: report.general.sessionCount },
      { label: "Temps des sessions", value: duration(report.general.totalSessionSeconds) },
      { label: "Temps historique validé", value: duration(report.general.totalLegacyValidatedSeconds) },
      { label: "Temps total retenu", value: duration(report.general.totalSeconds) },
      { label: "Chronomètres actifs exclus", value: report.general.activeTimerCount },
      { label: "Règle temps historique", value: report.hasDateFilter
        ? "Exclu des totaux de période car aucune date fiable n’est enregistrée."
        : "Inclus uniquement lorsqu’il a été corrigé ou validé." }
    ]);
    summary.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF155E54" } };
    });
    [12, 13, 14].forEach(row => { summary.getCell(`B${row}`).numFmt = "[h]:mm:ss"; });
    summary.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; });

    const projectSheet = workbook.addWorksheet("Détail par projet");
    projectSheet.columns = [
      { header: "Projet", key: "name", width: 30 },
      { header: "Contexte", key: "context", width: 18 },
      { header: "Statut", key: "status", width: 18 },
      { header: "Progression", key: "progress", width: 14 },
      { header: "Tâches", key: "taskCount", width: 10 },
      { header: "Terminées", key: "doneTasks", width: 12 },
      { header: "Restantes", key: "remainingTasks", width: 12 },
      { header: "Sessions", key: "sessionCount", width: 10 },
      { header: "Temps sessions", key: "sessionDuration", width: 18 },
      { header: "Temps historique validé", key: "legacyDuration", width: 22 },
      { header: "Temps total retenu", key: "totalDuration", width: 20 },
      { header: "Début du projet", key: "startedAt", width: 22 },
      { header: "Première activité", key: "firstActivityAt", width: 22 },
      { header: "Dernière activité", key: "lastActivityAt", width: 22 },
      { header: "Fin du projet", key: "completedAt", width: 22 }
    ];
    projectSheet.addRows(report.projects.map(project => ({
      ...project,
      context: contextLabel(project.context),
      status: statusLabel(project.status),
      progress: `${project.progressPercent} %`,
      sessionDuration: duration(project.sessionSeconds),
      legacyDuration: duration(project.legacyValidatedSeconds),
      totalDuration: duration(project.totalSeconds)
    })));
    styleSheet(projectSheet, ["sessionDuration", "legacyDuration", "totalDuration"]);

    const taskSheet = workbook.addWorksheet("Détail des tâches");
    taskSheet.columns = [
      { header: "Projet", key: "project", width: 30 },
      { header: "Contexte", key: "context", width: 18 },
      { header: "Tâche", key: "title", width: 38 },
      { header: "Statut", key: "status", width: 20 },
      { header: "Priorité", key: "priority", width: 14 },
      { header: "Échéance", key: "dueDate", width: 14 },
      { header: "Sessions", key: "sessionCount", width: 10 },
      { header: "Temps sessions", key: "sessionDuration", width: 18 },
      { header: "Temps historique validé", key: "legacyDuration", width: 22 },
      { header: "Temps cumulé tâche", key: "totalDuration", width: 20 },
      { header: "Temps cumulé projet", key: "projectDuration", width: 20 },
      { header: "Première activité", key: "firstActivityAt", width: 22 },
      { header: "Dernière activité", key: "lastActivityAt", width: 22 },
      { header: "Commentaire / reste à faire", key: "comment", width: 48 }
    ];
    taskSheet.addRows(report.tasks.map(task => ({
      ...task,
      context: contextLabel(task.context),
      status: statusLabel(task.status),
      priority: priorityLabel(task.priority),
      sessionDuration: duration(task.sessionSeconds),
      legacyDuration: duration(task.legacyValidatedSeconds),
      totalDuration: duration(task.totalSeconds),
      projectDuration: duration(task.projectTotalSeconds)
    })));
    styleSheet(taskSheet, ["sessionDuration", "legacyDuration", "totalDuration", "projectDuration"]);

    const sessionSheet = workbook.addWorksheet("Sessions d’activité");
    sessionSheet.columns = [
      { header: "Projet", key: "project", width: 30 },
      { header: "Contexte", key: "context", width: 18 },
      { header: "Tâche", key: "task", width: 38 },
      { header: "Statut", key: "status", width: 20 },
      { header: "Priorité", key: "priority", width: 14 },
      { header: "Date", key: "date", width: 14 },
      { header: "Début", key: "startedAt", width: 24 },
      { header: "Fin", key: "endedAt", width: 24 },
      { header: "Durée", key: "duration", width: 16 },
      { header: "Validée / corrigée", key: "reviewed", width: 20 },
      { header: "Commentaire / reste à faire", key: "comment", width: 48 }
    ];
    sessionSheet.addRows(report.sessions.map(session => ({
      ...session,
      context: contextLabel(session.context),
      status: statusLabel(session.status),
      priority: priorityLabel(session.priority),
      duration: duration(session.durationSeconds),
      reviewed: session.reviewed ? "Oui" : "Non"
    })));
    styleSheet(sessionSheet, ["duration"]);
    return workbook;
  }

  return {
    priorityRank,
    priorityManualSort,
    isUnreviewedLegacyTask,
    isUnreviewedLongSession,
    projectOptionsForContext,
    statusAfterTimerStart,
    shouldStopTimerForStatus,
    sessionDurationSeconds,
    sessionInDateRange,
    buildActivityReport,
    buildActivityWorkbook
  };
});
