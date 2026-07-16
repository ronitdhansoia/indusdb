export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Deterministic warm hue for an avatar based on the name. */
export function avatarHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function relativeDue(input: string | Date | null | undefined): {
  label: string;
  tone: "overdue" | "soon" | "normal" | "none";
} {
  if (!input) return { label: "No due date", tone: "none" };
  const due = new Date(input);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(due) - startOfDay(now)) / 86400000);

  if (diffDays < 0)
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      tone: "overdue",
    };
  if (diffDays === 0) return { label: "Due today", tone: "soon" };
  if (diffDays === 1) return { label: "Due tomorrow", tone: "soon" };
  if (diffDays <= 3) return { label: `Due in ${diffDays}d`, tone: "soon" };
  return { label: formatDate(due), tone: "normal" };
}

export const STATUS_META = {
  todo: { label: "To do", color: "todo" },
  in_progress: { label: "In progress", color: "progress" },
  done: { label: "Done", color: "done" },
} as const;

export const PRIORITY_META = {
  low: { label: "Low", color: "todo" },
  medium: { label: "Medium", color: "progress" },
  high: { label: "High", color: "danger" },
} as const;
