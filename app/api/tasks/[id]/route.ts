import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/guards";

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
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name")
      .lean();

    const t = populated as unknown as {
      _id: unknown;
      title: string;
      description?: string;
      status: string;
      priority: string;
      assignedTo?: { _id: unknown; name: string } | null;
      dueDate?: Date | null;
      completedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };

    return NextResponse.json({
      task: {
        id: String(t._id),
        title: t.title,
        description: t.description ?? "",
        status: t.status,
        priority: t.priority,
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
