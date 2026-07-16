"use client";

import { useState } from "react";
import type { TaskDTO } from "@/lib/types";
import { api } from "@/lib/api-client";
import {
  cn,
  dateKey,
  monthLabel,
  punchProgress,
  periodRange,
  formatMoney,
} from "@/lib/utils";
import { Check, Repeat } from "./icons";

const WD = ["M", "T", "W", "T", "F", "S", "S"];

export function PunchTracker({
  task,
  canEditAny,
  onUpdated,
}: {
  task: TaskDTO;
  /** Admin: may toggle any working day. Employees can only punch today. */
  canEditAny: boolean;
  onUpdated: (punches: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [error, setError] = useState("");

  const prog = punchProgress(task);
  if (!prog) return null;

  const range = periodRange(task);
  // Show the pay month; fall back to the start's month.
  const monthRef = task.periodMonth || (range?.start ?? "").slice(0, 7);
  const [y, m] = monthRef.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon-first

  const today = new Date();
  const todayKey = dateKey(today);
  const todayInPeriod =
    !!range &&
    todayKey >= range.start &&
    todayKey <= range.end &&
    today.getDay() !== 0;
  const punchedToday = task.punches.includes(todayKey);
  const settled = task.status === "done";
  const earned = Math.round((task.amount * prog.done) / (prog.total || 1));

  // date === undefined -> "punch today" (server stamps the real date)
  async function toggle(date?: string) {
    if (busy) return;
    setError("");
    const key = date ?? todayKey;
    const original = task.punches;
    const set = new Set(original);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    onUpdated(Array.from(set).sort());
    setBusy(true);
    try {
      const res = await api<{ punches: string[] }>(
        `/api/tasks/${task.id}/punch`,
        { method: "POST", json: date ? { date } : {} }
      );
      onUpdated(res.punches);
    } catch (e) {
      onUpdated(original);
      setError(e instanceof Error ? e.message : "Could not punch in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3.5 rounded-xl border border-border bg-surface-2/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
          <Repeat className="h-3.5 w-3.5 text-accent" />
          Daily punch-in
        </span>
        <span className="text-[12px] font-medium text-muted">
          {prog.done}/{prog.total} days
        </span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${prog.pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-faint">
        <span>{monthLabel(task.periodMonth)}</span>
        {task.amount > 0 && (
          <span>
            Earned{" "}
            <span className="font-semibold text-accent">
              {formatMoney(earned)}
            </span>{" "}
            of {formatMoney(task.amount)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!canEditAny && (
          <button
            onClick={() => toggle()}
            disabled={!todayInPeriod || settled || busy}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium transition-all disabled:opacity-40",
              punchedToday
                ? "bg-done-soft text-done"
                : "bg-accent text-accent-fg hover:bg-accent-hover"
            )}
          >
            <Check className="h-3.5 w-3.5" />
            {punchedToday ? "Punched today" : "Punch today"}
          </button>
        )}
        <button
          onClick={() => setShowCal((s) => !s)}
          className="inline-flex h-8 items-center rounded-lg border border-border-strong px-3 text-[12.5px] font-medium text-muted transition-colors hover:bg-surface"
        >
          {showCal ? "Hide calendar" : "View calendar"}
        </button>
      </div>

      {!canEditAny && (
        <p className="mt-2 text-[11px] text-faint">
          You can only punch in for today. Sundays are off.
        </p>
      )}

      {error && (
        <p className="mt-2 text-[11.5px] font-medium text-danger">{error}</p>
      )}

      {showCal && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-faint">
            {WD.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dt = new Date(y, m - 1, day);
              const key = dateKey(dt);
              const isSun = dt.getDay() === 0;
              const inPeriod =
                !!range && key >= range.start && key <= range.end && !isSun;
              const punched = task.punches.includes(key);
              const isToday = key === todayKey;
              return (
                <button
                  key={day}
                  disabled={!inPeriod || !canEditAny || busy}
                  onClick={() => canEditAny && inPeriod && toggle(key)}
                  title={isSun ? "Off day" : inPeriod ? key : "Before task start"}
                  className={cn(
                    "flex h-7 items-center justify-center rounded-md text-[11px] font-medium transition-all",
                    !inPeriod
                      ? "cursor-default bg-transparent text-faint/40"
                      : punched
                        ? "bg-accent text-accent-fg"
                        : "bg-surface text-muted",
                    canEditAny && inPeriod && "cursor-pointer hover:bg-accent-soft",
                    isToday && inPeriod && !punched && "ring-1 ring-accent"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {canEditAny && (
            <p className="mt-2 text-[11px] text-faint">
              Tap any working day to adjust (admin correction).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
