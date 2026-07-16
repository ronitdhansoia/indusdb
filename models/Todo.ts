import mongoose, { Schema, model, models, type Model } from "mongoose";

/**
 * A lightweight personal checklist item owned by a single user.
 * Separate from Task (which is admin-assigned and tracked).
 */
export interface ITodo {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  text: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Todo: Model<ITodo> =
  (models.Todo as Model<ITodo>) || model<ITodo>("Todo", TodoSchema);
