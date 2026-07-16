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

/* ----------------------------- recurring pay ------------------------------ */
export type Recurrence = "none" | "weekly" | "monthly";

// recurrenceDay encoding:
//   monthly: 0 = last day (end of month); 1..28 = that day of the month
//   weekly:  1..6 = Mon..Sat (matches Date.getDay(); Sunday is the off day)

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** The next date a recurring payment is due, on or after `from`. */
export function nextPaymentDate(
  recurrence: Recurrence,
  recurrenceDay: number,
  from: Date = new Date()
): Date | null {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (recurrence === "monthly") {
    const target = (y: number, m: number) => {
      if (recurrenceDay === 0) return new Date(y, m, lastDayOfMonth(y, m));
      return new Date(y, m, Math.min(recurrenceDay, lastDayOfMonth(y, m)));
    };
    let d = target(base.getFullYear(), base.getMonth());
    if (d < base) d = target(base.getFullYear(), base.getMonth() + 1);
    return d;
  }

  if (recurrence === "weekly") {
    const d = new Date(base);
    const add = ((recurrenceDay - d.getDay()) % 7 + 7) % 7;
    d.setDate(d.getDate() + add);
    return d;
  }

  return null;
}

/** Validate/normalize recurrence inputs into a {recurrence, recurrenceDay} pair. */
export function normalizeRecurrence(
  recurrence: unknown,
  recurrenceDay: unknown
): { recurrence: Recurrence; recurrenceDay: number } {
  const r: Recurrence =
    recurrence === "weekly" || recurrence === "monthly" ? recurrence : "none";
  let day = Number(recurrenceDay);
  if (!Number.isInteger(day)) day = 0;
  if (r === "monthly") day = Math.max(0, Math.min(28, day)); // 0 = end of month
  else if (r === "weekly") day = Math.max(1, Math.min(6, day || 5)); // Mon-Sat
  else day = 0;
  return { recurrence: r, recurrenceDay: day };
}

/* -------------------------- daily punch helpers --------------------------- */

/** Local date as "YYYY-MM-DD". */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local month as "YYYY-MM". */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * "YYYY-MM-DD" for the current instant in a given IANA timezone.
 * Used server-side to decide what "today" is regardless of where the
 * server runs (Vercel is UTC), so employees can't backdate punches.
 */
export function todayKeyInTz(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return dateKey(new Date());
  }
}

/** Count of working days (Mon-Sat, Sunday off) in a "YYYY-MM" month. */
export function workingDaysInMonth(periodMonth: string): number {
  const [y, m] = periodMonth.split("-").map(Number);
  if (!y || !m) return 0;
  const days = new Date(y, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(y, m - 1, d).getDay() !== 0) count++;
  }
  return count;
}

/** Friendly label for a "YYYY-MM" period, e.g. "July 2026". */
export function monthLabel(periodMonth: string): string {
  const [y, m] = periodMonth.split("-").map(Number);
  if (!y || !m) return "";
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Punch progress for a daily-punch task: days done vs working days in its month. */
export function punchProgress(task: {
  dailyPunch?: boolean;
  periodMonth?: string;
  punches?: string[];
}): { done: number; total: number; pct: number } | null {
  if (!task.dailyPunch || !task.periodMonth) return null;
  const total = workingDaysInMonth(task.periodMonth);
  const done = (task.punches ?? []).filter((p) =>
    p.startsWith(task.periodMonth!)
  ).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Human description of a recurrence, e.g. "Monthly, end of month". */
export function describeRecurrence(
  recurrence: Recurrence,
  recurrenceDay: number
): string {
  if (recurrence === "monthly") {
    return recurrenceDay === 0
      ? "Monthly, end of month"
      : `Monthly, on the ${ordinal(recurrenceDay)}`;
  }
  if (recurrence === "weekly") {
    const name = WEEKDAY_LONG[(recurrenceDay - 1 + 7) % 7] ?? "Friday";
    return `Weekly, ${name}`;
  }
  return "";
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
