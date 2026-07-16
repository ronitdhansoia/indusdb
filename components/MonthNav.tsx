"use client";

import { monthKey, monthLabel } from "@/lib/utils";
import { Button } from "./ui";

export function MonthNav({
  month,
  onPrev,
  onNext,
  onToday,
  isCurrentMonth,
}: {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentMonth: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-xl border border-border-strong bg-surface">
        <button
          onClick={onPrev}
          className="flex h-10 w-10 items-center justify-center rounded-l-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
          aria-label="Previous month"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <span className="min-w-[130px] px-2 text-center text-sm font-semibold text-text">
          {monthLabel(monthKey(month))}
        </span>
        <button
          onClick={onNext}
          className="flex h-10 w-10 items-center justify-center rounded-r-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
          aria-label="Next month"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      {!isCurrentMonth && (
        <Button variant="outline" size="sm" onClick={onToday}>
          This month
        </Button>
      )}
    </div>
  );
}
