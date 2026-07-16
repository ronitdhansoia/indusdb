import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/guards";
import { nextPaymentDate, normalizeRecurrence, monthKey } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/tasks/[id]
// - Admin: may edit any field (title, description, priority, dueDate, assignedTo, status)
// - Employee: may only update the status of a task assigned to them
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  try {
    const body = await req.json();
    await connectDB();
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const isAdmin = session.role === "admin";
    const isOwner = String(task.assignedTo) === session.sub;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prevStatus = task.status;

    // Status update (allowed for both admin and owning employee)
    if (typeof body.status === "string") {
      if (!["todo", "in_progress", "done"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      task.status = body.status;
      task.completedAt = body.status === "done" ? new Date() : null;
    }

    // Admin-only edits
    if (isAdmin) {
      if (typeof body.title === "string") task.title = body.title.trim();
      if (typeof body.description === "string")
        task.description = body.description.trim();
      if (
        typeof body.priority === "string" &&
        ["low", "medium", "high"].includes(body.priority)
      ) {
        task.priority = body.priority;
      }
      if (body.amount !== undefined) {
        const n = Number(body.amount);
        task.amount = Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
      }
      if (body.recurrence !== undefined) {
        const rec = normalizeRecurrence(body.recurrence, body.recurrenceDay);
        task.recurrence = rec.recurrence;
        task.recurrenceDay = rec.recurrenceDay;
        // Re-anchor the due date to the next pay date when recurrence is set,
        // unless the admin passed an explicit dueDate in the same request.
        if (rec.recurrence !== "none" && body.dueDate === undefined) {
          task.dueDate = nextPaymentDate(rec.recurrence, rec.recurrenceDay);
        }
        if (rec.recurrence !== "monthly") task.dailyPunch = false;
      }
      if (body.dailyPunch !== undefined) {
        task.dailyPunch = task.recurrence === "monthly" && Boolean(body.dailyPunch);
        if (task.dailyPunch && task.dueDate) {
          task.periodMonth = monthKey(new Date(task.dueDate));
        }
      }
      if (body.dueDate !== undefined) {
        task.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      }
      if (typeof body.assignedTo === "string") {
        const employee = await User.findOne({
          _id: body.assignedTo,
          role: "employee",
        });
        if (!employee) {
          return NextResponse.json(
            { error: "Assigned employee not found." },
            { status: 404 }
          );
        }
        task.assignedTo = employee._id;
      }
    }

    await task.save();

    // Recurring payment: when it's marked done (paid), spawn the next
    // occurrence for the following period so the schedule keeps going.
    let spawnedNext = false;
    if (
      task.recurrence &&
      task.recurrence !== "none" &&
      task.status === "done" &&
      prevStatus !== "done"
    ) {
      const from = task.dueDate ? new Date(task.dueDate) : new Date();
      from.setDate(from.getDate() + 1); // move past the paid period
      const next = nextPaymentDate(task.recurrence, task.recurrenceDay, from);
      await Task.create({
        title: task.title,
        description: task.description,
        status: "todo",
        priority: task.priority,
        amount: task.amount,
        recurrence: task.recurrence,
        recurrenceDay: task.recurrenceDay,
        dailyPunch: task.dailyPunch,
        periodMonth: task.dailyPunch && next ? monthKey(next) : "",
        punches: [], // fresh period starts with no punches
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        dueDate: next,
      });
      spawnedNext = true;
    }

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name")
      .lean();

    const t = populated as unknown as {
      _id: unknown;
      title: string;
      description?: string;
      status: string;
      priority: string;
      amount?: number;
      recurrence?: string;
      recurrenceDay?: number;
      dailyPunch?: boolean;
      periodMonth?: string;
      punches?: string[];
      assignedTo?: { _id: unknown; name: string } | null;
      dueDate?: Date | null;
      completedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };

    return NextResponse.json({
      spawnedNext,
      task: {
        id: String(t._id),
        title: t.title,
        description: t.description ?? "",
        status: t.status,
        priority: t.priority,
        amount: t.amount ?? 0,
        recurrence: t.recurrence ?? "none",
        recurrenceDay: t.recurrenceDay ?? 0,
        dailyPunch: t.dailyPunch ?? false,
        periodMonth: t.periodMonth ?? "",
        punches: t.punches ?? [],
        assignedTo: t.assignedTo
          ? { id: String(t.assignedTo._id), name: t.assignedTo.name }
          : null,
        dueDate: t.dueDate ?? null,
        completedAt: t.completedAt ?? null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      },
    });
  } catch (err) {
    console.error("update task error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] -> admin only
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await connectDB();
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete task error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
