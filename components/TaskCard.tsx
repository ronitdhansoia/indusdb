"use client";

import type { TaskDTO, TaskStatus } from "@/lib/types";
import { cn, relativeDue, formatMoney, PRIORITY_META } from "@/lib/utils";
import { Avatar, Badge } from "./ui";
import { StatusControl } from "./StatusControl";
import { Calendar, Flag, Pencil, Trash } from "./icons";

const priorityBar: Record<string, string> = {
  low: "bg-todo",
  medium: "bg-progress",
  high: "bg-danger",
};

export function TaskCard({
  task,
  showAssignee = false,
  onStatusChange,
  onEdit,
  onDelete,
  busy,
}: {
  task: TaskDTO;
  showAssignee?: boolean;
  onStatusChange?: (status: TaskStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  busy?: boolean;
}) {
  const due = relativeDue(task.dueDate);
  const dueTone =
    due.tone === "overdue"
      ? "text-danger"
      : due.tone === "soon"
        ? "text-progress"
        : "text-muted";

  return (
    <div
      className={cn(
        "group relative flex gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-all hover:border-border-strong hover:shadow-md",
        task.status === "done" && "opacity-75"
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-1",
          priorityBar[task.priority]
        )}
      />

      <div className="min-w-0 flex-1 pl-1">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "text-[15px] font-semibold leading-snug text-text",
              task.status === "done" && "line-through decoration-faint"
            )}
          >
            {task.title}
          </h3>

          {(onEdit || onDelete) && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="rounded-lg p-1.5 text-faint hover:bg-surface-2 hover:text-text"
                  aria-label="Edit task"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="rounded-lg p-1.5 text-faint hover:bg-danger-soft hover:text-danger"
                  aria-label="Delete task"
                >
                  <Trash className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {task.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", dueTone)}>
            <Calendar className="h-3.5 w-3.5" />
            {due.label}
          </span>

          <Badge tone={PRIORITY_META[task.priority].color}>
            <Flag className="h-3 w-3" />
            {PRIORITY_META[task.priority].label}
          </Badge>

          {task.amount > 0 && (
            <Badge tone="accent">{formatMoney(task.amount)}</Badge>
          )}

          {showAssignee && task.assignedTo && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              <Avatar name={task.assignedTo.name} size={20} />
              {task.assignedTo.name}
            </span>
          )}
        </div>

        {onStatusChange && (
          <div className="mt-3.5">
            <StatusControl
              value={task.status}
              onChange={onStatusChange}
              disabled={busy}
            />
          </div>
        )}
      </div>
    </div>
  );
}
