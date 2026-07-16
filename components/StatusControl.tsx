"use client";

import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Circle, Clock, Check } from "./icons";

const options: {
  value: TaskStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: string;
}[] = [
  { value: "todo", label: "To do", icon: Circle, active: "bg-surface text-todo shadow-sm" },
  {
    value: "in_progress",
    label: "Doing",
    icon: Clock,
    active: "bg-surface text-progress shadow-sm",
  },
  { value: "done", label: "Done", icon: Check, active: "bg-surface text-done shadow-sm" },
];

export function StatusControl({
  value,
  onChange,
  disabled,
}: {
  value: TaskStatus;
  onChange: (s: TaskStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl bg-surface-2 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-all disabled:opacity-50",
              active ? o.active : "text-faint hover:text-muted"
            )}
          >
            <o.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
