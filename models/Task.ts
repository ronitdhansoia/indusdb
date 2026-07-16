import mongoose, { Schema, model, models, type Model } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type Recurrence = "none" | "weekly" | "monthly";

export interface ITask {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  amount: number; // money associated with the task (₹)
  recurrence: Recurrence; // recurring payment schedule
  recurrenceDay: number; // monthly: 0 = end of month, 1-28 = day; weekly: 1-6 = Mon-Sat
  dailyPunch: boolean; // employee must punch in daily during the period
  periodMonth: string; // "YYYY-MM" the punches belong to (for daily-punch tasks)
  punches: string[]; // "YYYY-MM-DD" working days the employee marked done
  assignedTo: mongoose.Types.ObjectId; // employee
  assignedBy: mongoose.Types.ObjectId; // admin
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
    },
    amount: { type: Number, default: 0, min: 0 },
    recurrence: {
      type: String,
      enum: ["none", "weekly", "monthly"],
      default: "none",
    },
    recurrenceDay: { type: Number, default: 0 },
    dailyPunch: { type: Boolean, default: false },
    periodMonth: { type: String, default: "" },
    punches: { type: [String], default: [] },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Task: Model<ITask> =
  (models.Task as Model<ITask>) || model<ITask>("Task", TaskSchema);
