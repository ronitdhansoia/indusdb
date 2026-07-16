"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { EmployeeDTO, TaskDTO } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Select, Spinner } from "@/components/ui";
import { MonthNav } from "@/components/MonthNav";
import { MonthCalendar } from "@/components/MonthCalendar";
import {
  startOfMonth,
  addMonths,
  sameDay,
  taskOccurrencesInMonth,
} from "@/lib/utils";

export default function AdminCalendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, e] = await Promise.all([
          api<{ tasks: TaskDTO[] }>("/api/tasks"),
          api<{ employees: EmployeeDTO[] }>("/api/employees"),
        ]);
        setTasks(t.tasks);
        setEmployees(e.employees);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      employeeFilter === "all"
        ? tasks
        : tasks.filter((t) => t.assignedTo?.id === employeeFilter),
    [tasks, employeeFilter]
  );

  const isCurrentMonth = sameDay(month, startOfMonth(new Date()));
  const scheduled = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth() + 1;
    return filtered.filter((t) => taskOccurrencesInMonth(t, y, m).length > 0)
      .length;
  }, [filtered, month]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <PageHeader
        title="Task Calendar"
        subtitle={`${scheduled} task${scheduled === 1 ? "" : "s"} across the team this month. Sundays are off.`}
      >
        <MonthNav
          month={month}
          isCurrentMonth={isCurrentMonth}
          onPrev={() => setMonth((mo) => addMonths(mo, -1))}
          onNext={() => setMonth((mo) => addMonths(mo, 1))}
          onToday={() => setMonth(startOfMonth(new Date()))}
        />
      </PageHeader>

      <div className="mb-4 sm:w-64">
        <Select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
        >
          <option value="all">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </div>

      <MonthCalendar month={month} tasks={filtered} showAssignee />
    </div>
  );
}
