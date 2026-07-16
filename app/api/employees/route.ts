import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { requireAdmin } from "@/lib/guards";

// GET /api/employees -> list all employees with task stats (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await connectDB();
  const employees = await User.find({ role: "employee" })
    .sort({ createdAt: -1 })
    .lean();

  // Aggregate task counts per employee
  const stats = await Task.aggregate([
    {
      $group: {
        _id: { assignedTo: "$assignedTo", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);

  const statMap = new Map<string, { todo: number; in_progress: number; done: number }>();
  for (const s of stats) {
    const id = String(s._id.assignedTo);
    const entry = statMap.get(id) ?? { todo: 0, in_progress: 0, done: 0 };
    entry[s._id.status as "todo" | "in_progress" | "done"] = s.count;
    statMap.set(id, entry);
  }

  const data = employees.map((e) => {
    const s = statMap.get(String(e._id)) ?? { todo: 0, in_progress: 0, done: 0 };
    const total = s.todo + s.in_progress + s.done;
    return {
      id: String(e._id),
      name: e.name,
      email: e.email,
      jobTitle: e.jobTitle ?? "",
      active: e.active,
      createdAt: e.createdAt,
      stats: { ...s, total },
    };
  });

  return NextResponse.json({ employees: data });
}

// POST /api/employees -> create an employee (admin only)
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { name, email, password, jobTitle } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }
    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectDB();
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "employee",
      jobTitle: jobTitle ? String(jobTitle).trim() : undefined,
    });

    return NextResponse.json(
      {
        employee: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle ?? "",
          active: user.active,
          createdAt: user.createdAt,
          stats: { todo: 0, in_progress: 0, done: 0, total: 0 },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create employee error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
