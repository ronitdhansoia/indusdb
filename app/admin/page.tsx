"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import type { Stats, EmployeeDTO, TaskDTO } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, ProgressBar, Avatar, Badge, EmptyState, Spinner } from "@/components/ui";
import { PRIORITY_META, STATUS_META, relativeDue } from "@/lib/utils";
import { Users, Tasks, Clock, TrendUp } from "@/components/icons";

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            accent ? "bg-accent-soft text-accent" : "bg-surface-2 text-faint"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-text">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[13px] text-faint">{sub}</p>}
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, e, t] = await Promise.all([
          api<Stats>("/api/stats"),
          api<{ employees: EmployeeDTO[] }>("/api/employees"),
          api<{ tasks: TaskDTO[] }>("/api/tasks"),
        ]);
        setStats(s);
        setEmployees(e.employees);
        setTasks(t.tasks);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const recent = tasks.slice(0, 6);
  const rankedEmployees = [...employees].sort(
    (a, b) => b.stats.total - a.stats.total
  );

  return (
    <div className="animate-fade">
      <PageHeader
        title="Dashboard"
        subtitle="A live snapshot of your team's day."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Employees"
          value={stats?.employees ?? 0}
          sub="on the team"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Active tasks"
          value={(stats?.tasks.todo ?? 0) + (stats?.tasks.in_progress ?? 0)}
          sub={`${stats?.tasks.in_progress ?? 0} in progress`}
          icon={<Tasks className="h-4 w-4" />}
        />
        <StatCard
          label="Completion"
          value={`${stats?.tasks.completionRate ?? 0}%`}
          sub={`${stats?.tasks.done ?? 0} of ${stats?.tasks.total ?? 0} done`}
          icon={<TrendUp className="h-4 w-4" />}
          accent
        />
        <StatCard
          label="Overdue"
          value={stats?.tasks.overdue ?? 0}
          sub="need attention"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* Team progress */}
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight text-text">
              Team progress
            </h2>
            <Link
              href="/admin/employees"
              className="text-[13px] font-medium text-accent hover:underline"
            >
              Manage →
            </Link>
          </div>

          {rankedEmployees.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No employees yet"
              description="Add your first team member to start assigning work."
            />
          ) : (
            <div className="space-y-4">
              {rankedEmployees.map((e) => {
                const pct =
                  e.stats.total === 0
                    ? 0
                    : Math.round((e.stats.done / e.stats.total) * 100);
                return (
                  <div key={e.id} className="flex items-center gap-3.5">
                    <Avatar name={e.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text">
                          {e.name}
                        </p>
                        <span className="shrink-0 text-xs text-faint">
                          {e.stats.done}/{e.stats.total} done
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={pct} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent tasks */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight text-text">
              Recent tasks
            </h2>
            <Link
              href="/admin/tasks"
              className="text-[13px] font-medium text-accent hover:underline"
            >
              All →
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={<Tasks className="h-5 w-5" />}
              title="No tasks yet"
              description="Create a task to see it here."
            />
          ) : (
            <div className="space-y-1">
              {recent.map((t) => {
                const due = relativeDue(t.dueDate);
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full bg-${PRIORITY_META[t.priority].color}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {t.title}
                      </p>
                      <p className="truncate text-xs text-faint">
                        {t.assignedTo?.name ?? "Unassigned"} ·{" "}
                        {due.label}
                      </p>
                    </div>
                    <Badge tone={STATUS_META[t.status].color}>
                      {STATUS_META[t.status].label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
