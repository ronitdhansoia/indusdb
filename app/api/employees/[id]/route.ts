import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { requireAdmin } from "@/lib/guards";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/employees/[id] -> update name/jobTitle/active/password (admin)
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    const body = await req.json();
    await connectDB();
    const user = await User.findById(id);
    if (!user || user.role !== "employee") {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (typeof body.name === "string") user.name = body.name.trim();
    if (typeof body.jobTitle === "string") user.jobTitle = body.jobTitle.trim();
    if (typeof body.active === "boolean") user.active = body.active;
    if (typeof body.password === "string" && body.password.length >= 6) {
      user.passwordHash = await bcrypt.hash(body.password, 10);
    }
    await user.save();

    return NextResponse.json({
      employee: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle ?? "",
        active: user.active,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("update employee error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE /api/employees/[id] -> remove employee and their tasks (admin)
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    await connectDB();
    const user = await User.findById(id);
    if (!user || user.role !== "employee") {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    await Task.deleteMany({ assignedTo: user._id });
    await user.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete employee error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
