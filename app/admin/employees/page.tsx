"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { EmployeeDTO } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Spinner,
} from "@/components/ui";
import { Plus, Users, Pencil, Trash } from "@/components/icons";
import { formatDate } from "@/lib/utils";

type FormState = {
  id?: string;
  name: string;
  email: string;
  jobTitle: string;
  password: string;
  active: boolean;
};

const empty: FormState = {
  name: "",
  email: "",
  jobTitle: "",
  password: "",
  active: true,
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<EmployeeDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editing = Boolean(form.id);

  async function load() {
    const { employees } = await api<{ employees: EmployeeDTO[] }>("/api/employees");
    setEmployees(employees);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(e: EmployeeDTO) {
    setForm({
      id: e.id,
      name: e.name,
      email: e.email,
      jobTitle: e.jobTitle,
      password: "",
      active: e.active,
    });
    setError("");
    setModalOpen(true);
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/employees/${form.id}`, {
          method: "PATCH",
          json: {
            name: form.name,
            jobTitle: form.jobTitle,
            active: form.active,
            ...(form.password ? { password: form.password } : {}),
          },
        });
      } else {
        await api("/api/employees", {
          method: "POST",
          json: {
            name: form.name,
            email: form.email,
            jobTitle: form.jobTitle,
            password: form.password,
          },
        });
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api(`/api/employees/${confirmDelete.id}`, { method: "DELETE" });
      setConfirmDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade">
      <PageHeader
        title="Employees"
        subtitle="Add team members and track how their work is progressing."
      >
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add employee
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No employees yet"
          description="Add your first team member to start assigning tasks."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add employee
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {employees.map((e) => {
            const pct =
              e.stats.total === 0
                ? 0
                : Math.round((e.stats.done / e.stats.total) * 100);
            return (
              <Card key={e.id} className="group p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={e.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-text">
                        {e.name}
                      </p>
                      {!e.active && <Badge tone="danger">Inactive</Badge>}
                    </div>
                    <p className="truncate text-[13px] text-muted">
                      {e.jobTitle || "Team member"}
                    </p>
                    <p className="truncate text-xs text-faint">{e.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(e)}
                      className="rounded-lg p-1.5 text-faint hover:bg-surface-2 hover:text-text"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(e)}
                      className="rounded-lg p-1.5 text-faint hover:bg-danger-soft hover:text-danger"
                      aria-label="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="To do" value={e.stats.todo} />
                  <Stat label="Doing" value={e.stats.in_progress} />
                  <Stat label="Done" value={e.stats.done} />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-faint">{pct}%</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit employee" : "Add employee"}
        description={
          editing
            ? "Update details or reset their password."
            : "Create a login for a new team member."
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="employee-form" disabled={saving}>
              {saving ? <Spinner /> : editing ? "Save changes" : "Add employee"}
            </Button>
          </>
        }
      >
        <form id="employee-form" onSubmit={save} className="space-y-4">
          <Field label="Full name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Priya Sharma"
              required
            />
          </Field>
          <Field label="Email" hint={editing ? "Email can't be changed." : undefined}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="priya@indusappliances.com"
              disabled={editing}
              required
            />
          </Field>
          <Field label="Job title">
            <Input
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              placeholder="Sales Executive"
            />
          </Field>
          <Field
            label={editing ? "Reset password" : "Password"}
            hint={editing ? "Leave blank to keep current password." : "At least 6 characters."}
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required={!editing}
            />
          </Field>

          {editing && (
            <label className="flex items-center gap-2.5 text-sm text-text">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Active — can sign in and receive tasks
            </label>
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
        title="Remove employee?"
        description={`This permanently deletes ${confirmDelete?.name} and all of their tasks.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove} disabled={deleting}>
              {deleting ? <Spinner /> : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Joined {confirmDelete ? formatDate(confirmDelete.createdAt) : ""}. This
          action can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-2 py-2">
      <p className="text-lg font-semibold text-text">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
        {label}
      </p>
    </div>
  );
}
