"use client";

import { useMemo, useState } from "react";
import type { TaskDTO } from "@/lib/types";
import {
  cn,
  dateKey,
  formatMoney,
  describeRecurrence,
  taskOccurrencesInMonth,
  PRIORITY_META,
} from "@/lib/utils";
import { Avatar, Badge, Modal } from "./ui";
import { Repeat, Check } from "./icons";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Occ = { task: TaskDTO; punchDone: boolean };

function dotClass(o: Occ): string {
  if (o.task.dailyPunch) return o.punchDone ? "bg-done" : "bg-progress";
  if (o.task.recurrence !== "none") return "bg-accent";
  return `bg-${PRIORITY_META[o.task.priority].color}`;
}

export function MonthCalendar({
  month,
  tasks,
  showAssignee = false,
}: {
  month: Date;
  tasks: TaskDTO[];
  showAssignee?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const year = month.getFullYear();
  const m = month.getMonth() + 1; // 1-based

  // dateKey -> occurrences
  const byDay = useMemo(() => {
    const map = new Map<string, Occ[]>();
    for (const task of tasks) {
      for (const dk of taskOccurrencesInMonth(task, year, m)) {
        const entry = map.get(dk) ?? [];
        entry.push({ task, punchDone: task.punches?.includes(dk) ?? false });
        map.set(dk, entry);
      }
    }
    return map;
  }, [tasks, year, m]);

  const daysInMonth = new Date(year, m, 0).getDate();
  const firstWeekday = (new Date(year, m - 1, 1).getDay() + 6) % 7; // Mon-first
  const todayKey = dateKey(new Date());

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedOccs = selected ? byDay.get(selected) ?? [] : [];

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border bg-surface-2/50">
          {DOW.map((d, i) => (
            <div
              key={d}
              className={cn(
                "px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide",
                i === 6 ? "text-faint" : "text-muted"
              )}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={idx}
                  className="min-h-[84px] border-b border-r border-border bg-surface-2/30 last:border-r-0"
                />
              );
            }
            const dt = new Date(year, m - 1, day);
            const dk = dateKey(dt);
            const isSun = dt.getDay() === 0;
            const isToday = dk === todayKey;
            const occs = byDay.get(dk) ?? [];
            const col = idx % 7;

            return (
              <button
                key={idx}
                onClick={() => occs.length && setSelected(dk)}
                className={cn(
                  "min-h-[84px] border-b border-r border-border p-1.5 text-left align-top transition-colors last:border-r-0",
                  col === 6 && "border-r-0",
                  isSun ? "bg-surface-2/40" : "hover:bg-surface-2/50",
                  occs.length ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                      isToday
                        ? "bg-accent text-accent-fg"
                        : isSun
                          ? "text-faint"
                          : "text-text"
                    )}
                  >
                    {day}
                  </span>
                  {isSun && (
                    <span className="text-[9px] font-medium uppercase tracking-wide text-faint">
                      Off
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {occs.slice(0, 3).map((o, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1"
                      title={o.task.title}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass(o))}
                      />
                      <span className="truncate text-[11px] leading-tight text-muted">
                        {o.task.title}
                      </span>
                    </div>
                  ))}
                  {occs.length > 3 && (
                    <span className="block text-[10px] font-medium text-faint">
                      +{occs.length - 3} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> Recurring
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-progress" /> Priority / to-do
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-done" /> Punched day
        </span>
      </div>

      {/* Day detail */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={
          selected
            ? new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : ""
        }
        description={`${selectedOccs.length} task${selectedOccs.length === 1 ? "" : "s"}`}
      >
        <div className="space-y-2">
          {selectedOccs.map((o, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/40 p-3"
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass(o))} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{o.task.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <Badge tone={PRIORITY_META[o.task.priority].color}>
                    {PRIORITY_META[o.task.priority].label}
                  </Badge>
                  {o.task.amount > 0 && (
                    <Badge tone="accent">{formatMoney(o.task.amount)}</Badge>
                  )}
                  {o.task.recurrence !== "none" && (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Repeat className="h-3 w-3" />
                      {describeRecurrence(o.task.recurrence, o.task.recurrenceDay)}
                    </span>
                  )}
                  {o.task.dailyPunch && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        o.punchDone ? "text-done" : "text-progress"
                      )}
                    >
                      <Check className="h-3 w-3" />
                      {o.punchDone ? "Punched" : "Not punched"}
                    </span>
                  )}
                </div>
              </div>
              {showAssignee && o.task.assignedTo && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Avatar name={o.task.assignedTo.name} size={22} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
