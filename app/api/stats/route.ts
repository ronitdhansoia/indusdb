import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/guards";

// GET /api/stats -> high level counts for the admin dashboard
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await connectDB();

  const [employeeCount, statusAgg, overdue] = await Promise.all([
    User.countDocuments({ role: "employee" }),
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.countDocuments({
      status: { $ne: "done" },
      dueDate: { $ne: null, $lt: new Date() },
    }),
  ]);

  const statusCounts: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };
  for (const s of statusAgg) statusCounts[s._id] = s.count;
  const totalTasks = statusCounts.todo + statusCounts.in_progress + statusCounts.done;

  return NextResponse.json({
    employees: employeeCount,
    tasks: {
      total: totalTasks,
      ...statusCounts,
      overdue,
      completionRate:
        totalTasks === 0 ? 0 : Math.round((statusCounts.done / totalTasks) * 100),
    },
  });
}
