"use client";

import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn, initials, avatarHue } from "@/lib/utils";
import { X } from "./icons";

/* ----------------------------------- Button ---------------------------------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm border border-transparent",
    outline:
      "bg-surface text-text border border-border-strong hover:bg-surface-2",
    ghost: "text-muted hover:text-text hover:bg-surface-2 border border-transparent",
    danger:
      "bg-danger-soft text-danger border border-transparent hover:brightness-95",
  };
  const sizes = {
    sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
    md: "h-10 px-4 text-sm gap-2 rounded-xl",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all focus-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------ Card ----------------------------------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ----------------------------------- Badge ----------------------------------- */
const badgeTones: Record<string, string> = {
  todo: "bg-todo-soft text-todo",
  progress: "bg-progress-soft text-progress",
  done: "bg-done-soft text-done",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  tone = "todo",
  className,
  children,
}: {
  tone?: keyof typeof badgeTones | string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tracking-tight",
        badgeTones[tone] ?? badgeTones.todo,
        className
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------- Avatar ---------------------------------- */
export function Avatar({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  const hue = avatarHue(name);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 55% 52%), hsl(${
          (hue + 40) % 360
        } 60% 42%))`,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------------ Field ---------------------------------- */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-faint focus-ring transition-shadow";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(inputBase, "resize-none", props.className)} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(inputBase, "appearance-none cursor-pointer pr-9", props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2378716a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.75rem center",
      }}
    >
      {props.children}
    </select>
  );
}

/* ------------------------------------ Modal ---------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg animate-rise rounded-t-3xl sm:rounded-3xl border border-border bg-surface shadow-lg">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-text">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-faint hover:bg-surface-2 hover:text-text transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- ProgressBar ------------------------------- */
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* --------------------------------- EmptyState -------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-faint">
          {icon}
        </div>
      )}
      <p className="font-medium text-text">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------- Spinner ---------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}
