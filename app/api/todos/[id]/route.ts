import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Todo } from "@/models/Todo";
import { requireAuth } from "@/lib/guards";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/todos/[id] -> toggle done or edit text (owner only)
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;

  try {
    const body = await req.json();
    await connectDB();
    const todo = await Todo.findOne({ _id: id, owner: session.sub });
    if (!todo) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (typeof body.done === "boolean") todo.done = body.done;
    if (typeof body.text === "string" && body.text.trim()) {
      todo.text = body.text.trim();
    }
    await todo.save();
    return NextResponse.json({
      todo: {
        id: todo._id.toString(),
        text: todo.text,
        done: todo.done,
        createdAt: todo.createdAt,
      },
    });
  } catch (err) {
    console.error("update todo error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE /api/todos/[id] -> owner only
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { id } = await params;
  try {
    await connectDB();
    const todo = await Todo.findOneAndDelete({ _id: id, owner: session.sub });
    if (!todo) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete todo error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
