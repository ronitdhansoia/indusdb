"use client";

import { weekRangeLabel } from "@/lib/utils";
import { Button } from "./ui";

export function WeekNav({
  weekStart,
  onPrev,
  onNext,
  onToday,
  isCurrentWeek,
}: {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentWeek: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-xl border border-border-strong bg-surface">
        <button
          onClick={onPrev}
          className="flex h-10 w-10 items-center justify-center rounded-l-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
          aria-label="Previous week"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <span className="min-w-[110px] px-2 text-center text-sm font-semibold text-text">
          {weekRangeLabel(weekStart)}
        </span>
        <button
          onClick={onNext}
          className="flex h-10 w-10 items-center justify-center rounded-r-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
          aria-label="Next week"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      {!isCurrentWeek && (
        <Button variant="outline" size="sm" onClick={onToday}>
          This week
        </Button>
      )}
    </div>
  );
}
