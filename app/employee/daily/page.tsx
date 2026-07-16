"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { TaskDTO } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge, Spinner } from "@/components/ui";
import { WeekNav } from "@/components/WeekNav";
import {
  cn,
  startOfWeek,
  addDays,
  weekDays,
  isSunday,
  sameDay,
  formatMoney,
  WEEKDAY_LONG,
  STATUS_META,
} from "@/lib/utils";

const sumAmount = (ts: TaskDTO[]) => ts.reduce((s, t) => s + (t.amount || 0), 0);

export default function EmployeeDaily() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { tasks } = await api<{ tasks: TaskDTO[] }>("/api/tasks");
        setTasks(tasks);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const today = useMemo(() => new Date(), []);
  const isCurrentWeek = sameDay(weekStart, startOfWeek(today));

  const byDay = useMemo(() => {
    return days.map((day) =>
      tasks.filter((t) => t.dueDate && sameDay(new Date(t.dueDate), day))
    );
  }, [days, tasks]);

  const weekMoney = byDay.reduce((s, ts) => s + sumAmount(ts), 0);
  const allWeekTasks = byDay.flat();
  const collected = allWeekTasks
    .filter((t) => t.status === "done")
    .reduce((s, t) => s + (t.amount || 0), 0);
  const doneCount = allWeekTasks.filter((t) => t.status === "done").length;

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
        title="My Week"
        subtitle="Your tasks and earnings, day by day. Sunday is your day off."
      >
        <WeekNav
          weekStart={weekStart}
          isCurrentWeek={isCurrentWeek}
          onPrev={() => setWeekStart((w) => addDays(w, -7))}
          onNext={() => setWeekStart((w) => addDays(w, 7))}
          onToday={() => setWeekStart(startOfWeek(new Date()))}
        />
      </PageHeader>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <SummaryTile label="This week" value={formatMoney(weekMoney)} accent />
        <SummaryTile label="Collected" value={formatMoney(collected)} />
        <SummaryTile
          label="Tasks"
          value={`${doneCount}/${allWeekTasks.length}`}
          sub="done"
        />
      </div>

      <div className="space-y-3">
        {days.map((day, i) => {
          const dayTasks = byDay[i];
          const off = isSunday(day);
          const isToday = sameDay(day, today);
          const money = sumAmount(dayTasks);

          return (
            <Card
              key={i}
              className={cn(
                "overflow-hidden",
                off && "bg-surface-2/40",
                isToday && "ring-2 ring-accent/30"
              )}
            >
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-surface-2 leading-none">
                    <span className="text-[15px] font-semibold text-text">
                      {day.getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {WEEKDAY_LONG[i]}
                      {isToday && (
                        <span className="ml-2 text-[11px] font-medium text-accent">
                          Today
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-faint">
                      {off
                        ? "Weekly off"
                        : dayTasks.length === 0
                          ? "No tasks"
                          : `${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>
                {money > 0 && <Badge tone="accent">{formatMoney(money)}</Badge>}
              </div>

              {off ? (
                <div className="px-5 pb-4 text-sm text-faint">
                  Enjoy your day off. 🌤️
                </div>
              ) : dayTasks.length === 0 ? null : (
                <div className="divide-y divide-border border-t border-border">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-2.5"
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          t.status === "done"
                            ? "bg-done"
                            : t.status === "in_progress"
                              ? "bg-progress"
                              : "bg-todo"
                        )}
                      />
                      <span
                        className={cn(
                          "flex-1 truncate text-sm",
                          t.status === "done"
                            ? "text-faint line-through"
                            : "text-text"
                        )}
                      >
                        {t.title}
                      </span>
                      {t.amount > 0 && (
                        <span className="text-[13px] font-medium text-muted">
                          {formatMoney(t.amount)}
                        </span>
                      )}
                      <Badge tone={STATUS_META[t.status].color}>
                        {STATUS_META[t.status].label}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
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
