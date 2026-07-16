import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { requireAuth } from "@/lib/guards";
import { dateKey } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/tasks/[id]/punch
// Toggle a working-day punch for a daily-punch task.
// Body: { date?: "YYYY-MM-DD" } (defaults to today). Owner employee or admin.
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  try {
    const body = await req.json().catch(() => ({}));
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
    if (!task.dailyPunch) {
      return NextResponse.json(
        { error: "This task does not use daily punch-in." },
        { status: 400 }
      );
    }

    const date =
      typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : dateKey(new Date());

    // Must fall in this task's period month.
    if (!date.startsWith(task.periodMonth)) {
      return NextResponse.json(
        { error: "That day is outside this payment period." },
        { status: 400 }
      );
    }
    // Sunday is the off day; no punching.
    const [y, m, d] = date.split("-").map(Number);
    if (new Date(y, m - 1, d).getDay() === 0) {
      return NextResponse.json(
        { error: "Sunday is an off day." },
        { status: 400 }
      );
    }

    // Toggle
    const set = new Set(task.punches);
    if (set.has(date)) set.delete(date);
    else set.add(date);
    task.punches = Array.from(set).sort();
    await task.save();

    return NextResponse.json({
      id: String(task._id),
      punches: task.punches,
      periodMonth: task.periodMonth,
      dailyPunch: task.dailyPunch,
    });
  } catch (err) {
    console.error("punch error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
