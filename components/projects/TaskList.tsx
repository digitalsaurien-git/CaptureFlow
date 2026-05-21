"use client";

import { TaskItem, type TaskView } from "@/components/projects/TaskItem";

type TaskListProps = {
  onChanged?: () => void;
  projectId: string;
  tasks: TaskView[];
};

export function TaskList({ onChanged, projectId, tasks }: TaskListProps) {
  async function updateTask(taskId: string, payload: { status?: string; progress?: string }) {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      onChanged?.();
    }
  }

  async function archiveTask(taskId: string) {
    if (!window.confirm("Archiver cette tache ?")) {
      return;
    }

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      onChanged?.();
    }
  }

  async function reorder(taskIds: string[]) {
    const response = await fetch(`/api/projects/${projectId}/tasks/reorder`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ taskIds })
    });

    if (response.ok) {
      onChanged?.();
    }
  }

  function moveTask(taskId: string, direction: -1 | 1) {
    const index = tasks.findIndex((task) => task.id === taskId);

    if (index < 0) {
      return;
    }

    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= tasks.length) {
      return;
    }

    const reordered = [...tasks];
    const [task] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, task);

    void reorder(reordered.map((item) => item.id));
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Aucune tache pour ce projet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <TaskItem
          canMoveDown={index < tasks.length - 1}
          canMoveUp={index > 0}
          key={task.id}
          onArchive={(taskId) => void archiveTask(taskId)}
          onMoveDown={(taskId) => moveTask(taskId, 1)}
          onMoveUp={(taskId) => moveTask(taskId, -1)}
          onUpdate={(taskId, payload) => void updateTask(taskId, payload)}
          task={task}
        />
      ))}
    </div>
  );
}
