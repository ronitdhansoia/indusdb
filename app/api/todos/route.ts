import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Todo } from "@/models/Todo";
import { requireAuth } from "@/lib/guards";

// GET /api/todos -> current user's personal checklist
export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  await connectDB();
  const todos = await Todo.find({ owner: session.sub })
    .sort({ done: 1, createdAt: -1 })
    .lean();

  return NextResponse.json({
    todos: todos.map((t) => ({
      id: String(t._id),
      text: t.text,
      done: t.done,
      createdAt: t.createdAt,
    })),
  });
}

// POST /api/todos -> add a personal checklist item
export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  try {
    const { text } = await req.json();
    if (!text || !String(text).trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }
    await connectDB();
    const todo = await Todo.create({
      owner: session.sub,
      text: String(text).trim(),
    });
    return NextResponse.json(
      {
        todo: {
          id: todo._id.toString(),
          text: todo.text,
          done: todo.done,
          createdAt: todo.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create todo error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
