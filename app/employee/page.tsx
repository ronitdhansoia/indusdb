"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { TaskDTO, TaskStatus } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState, Spinner } from "@/components/ui";
import { TaskCard } from "@/components/TaskCard";
import { Tasks as TasksIcon, Circle, Clock, Check } from "@/components/icons";

const columns: {
  status: TaskStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
}[] = [
  { status: "todo", label: "To do", icon: Circle, tint: "text-todo" },
  { status: "in_progress", label: "In progress", icon: Clock, tint: "text-progress" },
  { status: "done", label: "Done", icon: Check, tint: "text-done" },
];

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { tasks } = await api<{ tasks: TaskDTO[] }>("/api/tasks");
    setTasks(tasks);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(task: TaskDTO, status: TaskStatus) {
    setBusyId(task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      const res = await api<{ spawnedNext?: boolean }>(
        `/api/tasks/${task.id}`,
        { method: "PATCH", json: { status } }
      );
      if (res?.spawnedNext) await load();
    } catch {
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function updatePunches(id: string, punches: string[]) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, punches } : t)));
  }

  const grouped = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const openCount = grouped.todo.length + grouped.in_progress.length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <PageHeader
        title="My Tasks"
        subtitle={
          openCount === 0
            ? "You're all caught up. Nice work! 🎉"
            : `You have ${openCount} task${openCount === 1 ? "" : "s"} to work on.`
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<TasksIcon className="h-5 w-5" />}
          title="No tasks assigned yet"
          description="When your admin assigns you work, it will show up here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((col) => {
            const items = grouped[col.status];
            return (
              <div key={col.status} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <col.icon className={`h-4 w-4 ${col.tint}`} />
                  <h2 className="text-sm font-semibold text-text">{col.label}</h2>
                  <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-faint">
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <Card className="border-dashed bg-transparent p-6 text-center text-[13px] text-faint shadow-none">
                    Nothing here
                  </Card>
                ) : (
                  items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      busy={busyId === t.id}
                      onStatusChange={(s) => changeStatus(t, s)}
                      showPunch
                      punchEditable
                      onPunchUpdated={(p) => updatePunches(t.id, p)}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
