import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { requireAuth, requireAdmin } from "@/lib/guards";
import { nextPaymentDate, normalizeRecurrence, type Recurrence } from "@/lib/utils";

type LeanTask = {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: string;
  priority: string;
  amount?: number;
  recurrence?: string;
  recurrenceDay?: number;
  assignedTo?: { _id: mongoose.Types.ObjectId; name: string } | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeTask(t: LeanTask) {
  return {
    id: String(t._id),
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    amount: t.amount ?? 0,
    recurrence: (t.recurrence ?? "none") as Recurrence,
    recurrenceDay: t.recurrenceDay ?? 0,
    assignedTo: t.assignedTo
      ? { id: String(t.assignedTo._id), name: t.assignedTo.name }
      : null,
    dueDate: t.dueDate ?? null,
    completedAt: t.completedAt ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}


/** Coerce a request value into a non-negative money amount. */
function parseAmount(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

// GET /api/tasks -> admin: all (with ?employee= & ?status= filters); employee: own
export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: Record<string, unknown> = {};

  if (session.role === "employee") {
    filter.assignedTo = session.sub;
  } else {
    const employee = searchParams.get("employee");
    if (employee) filter.assignedTo = employee;
  }

  const status = searchParams.get("status");
  if (status && ["todo", "in_progress", "done"].includes(status)) {
    filter.status = status;
  }

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name")
    .sort({ createdAt: -1 })
    .lean<LeanTask[]>();

  return NextResponse.json({ tasks: tasks.map(serializeTask) });
}

// POST /api/tasks -> create & assign a task (admin only)
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  try {
    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      amount,
      recurrence,
      recurrenceDay,
    } = await req.json();

    if (!title || !assignedTo) {
      return NextResponse.json(
        { error: "Title and assignee are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const employee = await User.findOne({ _id: assignedTo, role: "employee" });
    if (!employee) {
      return NextResponse.json(
        { error: "Assigned employee not found." },
        { status: 404 }
      );
    }

    const rec = normalizeRecurrence(recurrence, recurrenceDay);
    // For recurring payments, land the task on its next pay date so it shows
    // up in the daily/weekly tracker on the right day.
    const resolvedDue =
      rec.recurrence !== "none"
        ? nextPaymentDate(rec.recurrence, rec.recurrenceDay)
        : dueDate
          ? new Date(dueDate)
          : null;

    const task = await Task.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : undefined,
      assignedTo,
      assignedBy: session.sub,
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      amount: parseAmount(amount),
      recurrence: rec.recurrence,
      recurrenceDay: rec.recurrenceDay,
      dueDate: resolvedDue,
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name")
      .lean<LeanTask>();

    return NextResponse.json({ task: serializeTask(populated!) }, { status: 201 });
  } catch (err) {
    console.error("create task error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
