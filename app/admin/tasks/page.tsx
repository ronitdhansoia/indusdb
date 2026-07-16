"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { EmployeeDTO, TaskDTO, TaskStatus, TaskPriority } from "@/lib/types";
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
import { cn } from "@/lib/utils";

type FormState = {
  id?: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  dueDate: "",
  status: "todo",
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
      dueDate: toDateInput(t.dueDate),
      status: t.status,
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
        dueDate: form.dueDate || null,
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
      await api(`/api/tasks/${task.id}`, { method: "PATCH", json: { status } });
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
            <Field label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
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
          </div>

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
