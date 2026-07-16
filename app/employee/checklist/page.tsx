"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { TodoDTO } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState, Spinner } from "@/components/ui";
import { Check, Plus, Trash } from "@/components/icons";
import { cn } from "@/lib/utils";

export default function ChecklistPage() {
  const [todos, setTodos] = useState<TodoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { todos } = await api<{ todos: TodoDTO[] }>("/api/todos");
    setTodos(todos);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setAdding(true);
    try {
      const { todo } = await api<{ todo: TodoDTO }>("/api/todos", {
        method: "POST",
        json: { text: value },
      });
      setTodos((prev) => [todo, ...prev]);
      setText("");
      inputRef.current?.focus();
    } finally {
      setAdding(false);
    }
  }

  async function toggle(todo: TodoDTO) {
    const done = !todo.done;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done } : t))
    );
    await api(`/api/todos/${todo.id}`, {
      method: "PATCH",
      json: { done },
    }).catch(load);
  }

  async function remove(todo: TodoDTO) {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    await api(`/api/todos/${todo.id}`, { method: "DELETE" }).catch(load);
  }

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className="animate-fade">
      <PageHeader
        title="My Checklist"
        subtitle="A private space for your own reminders and notes."
      />

      <div className="mx-auto max-w-xl">
        <form onSubmit={add} className="mb-4 flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a personal to-do…"
            className="w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-text placeholder:text-faint focus-ring"
          />
          <button
            type="submit"
            disabled={adding || !text.trim()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm transition-all hover:bg-accent-hover disabled:opacity-50 active:scale-95"
            aria-label="Add"
          >
            {adding ? <Spinner /> : <Plus className="h-5 w-5" />}
          </button>
        </form>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted">
            <Spinner className="h-6 w-6" />
          </div>
        ) : todos.length === 0 ? (
          <EmptyState
            icon={<Check className="h-5 w-5" />}
            title="Your checklist is empty"
            description="Jot down anything you want to remember today."
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {todos.map((t) => (
              <div
                key={t.id}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
              >
                <button
                  onClick={() => toggle(t)}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                    t.done
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border-strong hover:border-accent"
                  )}
                  aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                >
                  {t.done && <Check className="h-3.5 w-3.5" />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    t.done ? "text-faint line-through" : "text-text"
                  )}
                >
                  {t.text}
                </span>
                <button
                  onClick={() => remove(t)}
                  className="rounded-lg p-1.5 text-faint opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </Card>
        )}

        {todos.length > 0 && (
          <p className="mt-3 text-center text-xs text-faint">
            {remaining} remaining · {todos.length - remaining} done
          </p>
        )}
      </div>
    </div>
  );
}
