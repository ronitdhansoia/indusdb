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

const moneyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format a number as Indian rupees, e.g. 1234 -> "₹1,234". */
export function formatMoney(n: number | null | undefined): string {
  return moneyFmt.format(n ?? 0);
}

/* ------------------------------- week helpers ------------------------------ */

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** The 7 dates (Mon..Sun) of the week starting at `monday`. */
export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** e.g. "14 – 20 Jul" for the given Monday. */
export function weekRangeLabel(monday: Date): string {
  const end = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const sameMonth = monday.getMonth() === end.getMonth();
  const startStr = monday.toLocaleDateString(
    undefined,
    sameMonth ? { day: "numeric" } : opts
  );
  return `${startStr} – ${end.toLocaleDateString(undefined, opts)}`;
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
