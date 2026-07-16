"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui";
import { Logout, Dashboard, Users, Tasks, Check } from "./icons";
import { Brand } from "./Brand";

type Role = "admin" | "employee";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Nav lives on the client so we never pass component functions across the
// server -> client boundary (which React can't serialize).
const NAVS: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: Dashboard },
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/tasks", label: "Tasks", icon: Tasks },
  ],
  employee: [
    { href: "/employee", label: "My Tasks", icon: Tasks },
    { href: "/employee/checklist", label: "Checklist", icon: Check },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  employee: "Team member",
};

export function AppShell({
  user,
  role,
  children,
}: {
  user: { name: string; email: string };
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const nav = NAVS[role];
  const roleLabel = ROLE_LABEL[role];

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/admin" && href !== "/employee" && pathname.startsWith(href));

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const navLinks = (
    <>
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-surface text-text shadow-sm md:bg-accent-soft md:text-accent"
                : "text-muted hover:bg-surface hover:text-text md:hover:bg-surface-2"
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] transition-colors",
                active ? "md:text-accent" : "text-faint group-hover:text-muted"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface-2/60 px-4 py-6 md:flex">
        <div className="px-2">
          <Brand />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">{navLinks}</nav>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">
                {user.name}
              </p>
              <p className="truncate text-xs text-faint">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
          >
            <Logout className="h-4 w-4" />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Brand compact />
        <div className="flex items-center gap-2">
          <Avatar name={user.name} size={32} />
          <button
            onClick={logout}
            disabled={loggingOut}
            className="rounded-lg p-2 text-muted hover:bg-surface-2"
            aria-label="Sign out"
          >
            <Logout className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="sticky top-[57px] z-20 flex gap-1 overflow-x-auto border-b border-border bg-bg/90 px-3 py-2 backdrop-blur md:hidden">
        {navLinks}
      </nav>

      {/* Main */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
