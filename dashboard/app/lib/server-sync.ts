import { saveApprovals, savePriorities, saveTasks, type Approval, type Priority, type Task } from "./data";
import { apiFetch } from "./api-fetch";

/** Pull server state into localStorage so existing pages stay in sync with SQLite. */
export async function syncFromServer(): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined") return { ok: true };

  try {
    const [prioRes, taskRes, apprRes] = await Promise.all([
      fetch("/api/priorities"),
      fetch("/api/tasks"),
      fetch("/api/approvals"),
    ]);

    if (prioRes.ok) {
      const { priorities } = (await prioRes.json()) as { priorities: Priority[] };
      if (Array.isArray(priorities)) {
        savePriorities(priorities);
      }
    }

    if (taskRes.ok) {
      const { tasks } = (await taskRes.json()) as { tasks: Task[] };
      if (Array.isArray(tasks)) {
        saveTasks(
          tasks.map((t) => ({
            id: t.id,
            description: t.description,
            agent: t.agent,
            priority: t.priority as Task["priority"],
            risk: t.risk as Task["risk"],
            status: t.status,
            createdAt: t.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
            completedAt: t.completedAt?.slice(0, 10),
          }))
        );
      }
    }

    if (apprRes.ok) {
      const { approvals } = (await apprRes.json()) as { approvals: Approval[] };
      if (Array.isArray(approvals)) {
        saveApprovals(
          approvals.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            agent: a.agent,
            projectId: a.projectId,
            risk: a.risk,
            status: a.status,
            createdAt: a.createdAt,
          }))
        );
      }
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "sync failed" };
  }
}

export async function persistPriorities(priorities: Priority[]) {
  savePriorities(priorities);
  await apiFetch("/api/priorities", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priorities }),
  });
}

export async function persistTask(task: Task, allTasks: Task[]) {
  saveTasks(allTasks);
  await apiFetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task }),
  });
}

export async function removeTask(id: string, remaining: Task[]) {
  saveTasks(remaining);
  await apiFetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
