"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type {
  EmployeeDTO,
  TaskDTO,
  TaskStatus,
  TaskPriority,
  Recurrence,
} from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { TaskCard } from "@/components/TaskCard";
import { Plus, Tasks as TasksIcon } from "@/components/icons";
import {
  cn,
  isSunday,
  nextPaymentDate,
  describeRecurrence,
  formatDate,
  WEEKDAY_LONG,
} from "@/lib/utils";

type FormState = {
  id?: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: TaskPriority;
  amount: string;
  dueDate: string;
  status: TaskStatus;
  recurrence: Recurrence;
  recurrenceDay: number;
  dailyPunch: boolean;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  amount: "",
  dueDate: "",
  status: "todo",
  recurrence: "none",
  recurrenceDay: 0,
  dailyPunch: false,
};

const statusFilters: { value: "all" | TaskStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TaskDTO | null>(null);

  const editing = Boolean(form.id);

  async function load() {
    const [{ tasks }, { employees }] = await Promise.all([
      api<{ tasks: TaskDTO[] }>("/api/tasks"),
      api<{ employees: EmployeeDTO[] }>("/api/employees"),
    ]);
    setTasks(tasks);
    setEmployees(employees);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (employeeFilter !== "all" && t.assignedTo?.id !== employeeFilter)
        return false;
      return true;
    });
  }, [tasks, statusFilter, employeeFilter]);

  function openCreate() {
    setForm({ ...emptyForm, assignedTo: employees[0]?.id ?? "" });
    setError("");
    setModalOpen(true);
  }

  function openEdit(t: TaskDTO) {
    setForm({
      id: t.id,
      title: t.title,
      description: t.description,
      assignedTo: t.assignedTo?.id ?? "",
      priority: t.priority,
      amount: t.amount ? String(t.amount) : "",
      dueDate: toDateInput(t.dueDate),
      status: t.status,
      recurrence: t.recurrence,
      recurrenceDay: t.recurrenceDay,
      dailyPunch: t.dailyPunch,
    });
    setError("");
    setModalOpen(true);
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo,
        priority: form.priority,
        amount: form.amount ? Number(form.amount) : 0,
        recurrence: form.recurrence,
        recurrenceDay: form.recurrenceDay,
        dailyPunch: form.recurrence === "monthly" ? form.dailyPunch : false,
        // For recurring tasks the server derives the due date from the schedule.
        dueDate: form.recurrence === "none" ? form.dueDate || null : undefined,
        ...(editing ? { status: form.status } : {}),
      };
      if (editing) {
        await api(`/api/tasks/${form.id}`, { method: "PATCH", json: payload });
      } else {
        await api("/api/tasks", { method: "POST", json: payload });
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(task: TaskDTO, status: TaskStatus) {
    setBusyId(task.id);
    // optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status } : t))
    );
    try {
      const res = await api<{ spawnedNext?: boolean }>(
        `/api/tasks/${task.id}`,
        { method: "PATCH", json: { status } }
      );
      // A completed recurring payment creates the next occurrence: refresh.
      if (res?.spawnedNext) await load();
    } catch {
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api(`/api/tasks/${id}`, { method: "DELETE" }).catch(load);
  }

  const noEmployees = employees.length === 0;

  // Sunday is the weekly off day; warn if a task is scheduled for one.
  const dueDateHint =
    form.dueDate && isSunday(new Date(form.dueDate + "T00:00:00"))
      ? "Heads up: that's a Sunday (off day)."
      : undefined;

  return (
    <div className="animate-fade">
      <PageHeader
        title="Tasks"
        subtitle="Assign work, set priorities, and follow it to done."
      >
        <Button onClick={openCreate} disabled={noEmployees}>
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex gap-1 rounded-xl bg-surface-2 p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
                statusFilter === f.value
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="sm:w-56">
          <Select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="all">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : noEmployees ? (
        <EmptyState
          icon={<TasksIcon className="h-5 w-5" />}
          title="Add an employee first"
          description="You need at least one team member before you can assign tasks."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<TasksIcon className="h-5 w-5" />}
          title="No tasks here"
          description="Try a different filter, or create a new task."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              showAssignee
              busy={busyId === t.id}
              onStatusChange={(s) => changeStatus(t, s)}
              onEdit={() => openEdit(t)}
              onDelete={() => setConfirmDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit task" : "New task"}
        description={
          editing
            ? "Update the details or reassign this task."
            : "Assign a task to a team member."
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="task-form" disabled={saving}>
              {saving ? <Spinner /> : editing ? "Save changes" : "Create task"}
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={save} className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Follow up with walk-in leads"
              required
            />
          </Field>
          <Field label="Description" hint="Optional details or instructions.">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add any context the team member needs…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Assign to">
              <Select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹)" hint="Money paid for this task.">
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Repeats" hint="Recurring payment schedule.">
              <Select
                value={form.recurrence}
                onChange={(e) => {
                  const r = e.target.value as Recurrence;
                  setForm({
                    ...form,
                    recurrence: r,
                    recurrenceDay: r === "weekly" ? 5 : 0,
                    dailyPunch: r === "monthly",
                  });
                }}
              >
                <option value="none">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </Field>
          </div>

          {form.recurrence === "none" ? (
            <Field label="Due date" hint={dueDateHint}>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          ) : (
            <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pay day">
                  {form.recurrence === "monthly" ? (
                    <Select
                      value={String(form.recurrenceDay)}
                      onChange={(e) =>
                        setForm({ ...form, recurrenceDay: Number(e.target.value) })
                      }
                    >
                      <option value="0">Last day (end of month)</option>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Select
                      value={String(form.recurrenceDay)}
                      onChange={(e) =>
                        setForm({ ...form, recurrenceDay: Number(e.target.value) })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6].map((d) => (
                        <option key={d} value={d}>
                          {WEEKDAY_LONG[d - 1]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Next payment">
                  <div className="rounded-xl border border-border-strong bg-surface-2 px-3.5 py-2.5 text-sm font-medium text-text">
                    {formatDate(
                      nextPaymentDate(form.recurrence, form.recurrenceDay)
                    )}
                  </div>
                </Field>
              </div>
              {form.recurrence === "monthly" && (
                <label className="mt-3 flex items-start gap-2.5 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={form.dailyPunch}
                    onChange={(e) =>
                      setForm({ ...form, dailyPunch: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>
                    Requires daily punch-in
                    <span className="block text-xs font-normal text-muted">
                      The employee marks the task done each working day (Sundays
                      off) to earn the month&apos;s pay.
                    </span>
                  </span>
                </label>
              )}

              <p className="mt-2.5 text-xs text-muted">
                {describeRecurrence(form.recurrence, form.recurrenceDay)}. When
                this payment is marked done, the next one is created
                automatically.
              </p>
            </div>
          )}

          {editing && (
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TaskStatus })
                }
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </Select>
            </Field>
          )}

          {error && (
            <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete task?"
        description={`"${confirmDelete?.title}" will be permanently removed.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">This action can&apos;t be undone.</p>
      </Modal>
    </div>
  );
}
