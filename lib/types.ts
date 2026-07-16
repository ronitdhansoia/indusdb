export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface EmployeeRef {
  id: string;
  name: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: EmployeeRef | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDTO {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  active: boolean;
  createdAt: string;
  stats: { todo: number; in_progress: number; done: number; total: number };
}

export interface TodoDTO {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface Stats {
  employees: number;
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
    completionRate: number;
  };
}
