"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { EmployeeDTO, TaskDTO } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Avatar, EmptyState, Spinner } from "@/components/ui";
import { WeekNav } from "@/components/WeekNav";
import { Users } from "@/components/icons";
import {
  cn,
  startOfWeek,
  addDays,
  weekDays,
  isSunday,
  sameDay,
  formatMoney,
  WEEKDAY_SHORT,
} from "@/lib/utils";

const sumAmount = (ts: TaskDTO[]) => ts.reduce((s, t) => s + (t.amount || 0), 0);
const doneCount = (ts: TaskDTO[]) => ts.filter((t) => t.status === "done").length;

export default function AdminDaily() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [e, t] = await Promise.all([
          api<{ employees: EmployeeDTO[] }>("/api/employees"),
          api<{ tasks: TaskDTO[] }>("/api/tasks"),
        ]);
        setEmployees(e.employees);
        setTasks(t.tasks);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const today = useMemo(() => new Date(), []);
  const isCurrentWeek = sameDay(weekStart, startOfWeek(today));

  // grid[employeeId][dayIndex] = tasks
  const grid = useMemo(() => {
    const map = new Map<string, TaskDTO[][]>();
    for (const e of employees) map.set(e.id, Array.from({ length: 7 }, () => []));
    for (const t of tasks) {
      if (!t.dueDate || !t.assignedTo) continue;
      const d = new Date(t.dueDate);
      const idx = days.findIndex((day) => sameDay(day, d));
      if (idx === -1) continue;
      map.get(t.assignedTo.id)?.[idx].push(t);
    }
    return map;
  }, [employees, tasks, days]);

  // Totals
  const dayTotals = useMemo(() => {
    return days.map((_, idx) => {
      let money = 0;
      for (const e of employees) money += sumAmount(grid.get(e.id)?.[idx] ?? []);
      return money;
    });
  }, [days, employees, grid]);

  const weekMoney = dayTotals.reduce((s, m) => s + m, 0);
  const weekTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return days.some((day) => sameDay(day, d));
  });
  const collected = weekTasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => s + (t.amount || 0), 0);

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
        title="Daily Tracker"
        subtitle="Each employee's work and money, day by day. Sunday is an off day."
      >
        <WeekNav
          weekStart={weekStart}
          isCurrentWeek={isCurrentWeek}
          onPrev={() => setWeekStart((w) => addDays(w, -7))}
          onNext={() => setWeekStart((w) => addDays(w, 7))}
          onToday={() => setWeekStart(startOfWeek(new Date()))}
        />
      </PageHeader>

      {/* Week summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <SummaryTile label="Money this week" value={formatMoney(weekMoney)} accent />
        <SummaryTile label="Collected (done)" value={formatMoney(collected)} />
        <SummaryTile
          label="Tasks this week"
          value={`${weekTasks.filter((t) => t.status === "done").length}/${weekTasks.length}`}
          sub="done"
        />
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No employees yet"
          description="Add team members to start tracking their daily work."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-faint">
                    Employee
                  </th>
                  {days.map((d, i) => {
                    const off = isSunday(d);
                    const isToday = sameDay(d, today);
                    return (
                      <th
                        key={i}
                        className={cn(
                          "px-3 py-3 text-center text-[12px] font-semibold",
                          off ? "text-faint" : "text-muted",
                          isToday && "bg-accent-soft"
                        )}
                      >
                        <div className="uppercase tracking-wide">{WEEKDAY_SHORT[i]}</div>
                        <div className="mt-0.5 text-[11px] font-normal text-faint">
                          {off ? "Off" : d.getDate()}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wide text-faint">
                    Week ₹
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const row = grid.get(e.id) ?? [];
                  const weekTotal = row.reduce((s, ts) => s + sumAmount(ts), 0);
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2/50"
                    >
                      <td className="sticky left-0 z-10 bg-surface px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={e.name} size={30} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-text">
                              {e.name}
                            </p>
                            <p className="truncate text-[11px] text-faint">
                              {e.jobTitle || "Team member"}
                            </p>
                          </div>
                        </div>
                      </td>
                      {days.map((d, i) => {
                        const cell = row[i] ?? [];
                        const off = isSunday(d);
                        const money = sumAmount(cell);
                        const isToday = sameDay(d, today);
                        return (
                          <td
                            key={i}
                            className={cn(
                              "px-3 py-3 text-center align-middle",
                              off && "bg-surface-2/40",
                              isToday && "bg-accent-soft/40"
                            )}
                          >
                            {cell.length === 0 ? (
                              <span className="text-faint">·</span>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="text-[13px] font-semibold text-text">
                                  {money > 0 ? formatMoney(money) : `${cell.length}`}
                                </span>
                                <span className="mt-0.5 text-[10.5px] text-faint">
                                  {doneCount(cell)}/{cell.length} done
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right text-[13px] font-semibold text-text">
                        {formatMoney(weekTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border-strong bg-surface-2/60">
                  <td className="sticky left-0 z-10 bg-surface-2/60 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted">
                    Daily total
                  </td>
                  {dayTotals.map((m, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-3 py-3 text-center text-[12.5px] font-semibold",
                        isSunday(days[i]) ? "text-faint" : "text-text"
                      )}
                    >
                      {m > 0 ? formatMoney(m) : "·"}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-accent">
                    {formatMoney(weekMoney)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <p className="mt-3 text-xs text-faint">
        Money is the total of task amounts due each day. Only tasks with a due
        date appear here.
      </p>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn("p-4", accent && "border-accent/30 bg-accent-soft/40")}>
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight sm:text-2xl",
          accent ? "text-accent" : "text-text"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-faint">{sub}</p>}
    </Card>
  );
}
