"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { TaskDTO } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/ui";
import { MonthNav } from "@/components/MonthNav";
import { MonthCalendar } from "@/components/MonthCalendar";
import {
  startOfMonth,
  addMonths,
  sameDay,
  taskOccurrencesInMonth,
} from "@/lib/utils";

export default function EmployeeCalendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { tasks } = await api<{ tasks: TaskDTO[] }>("/api/tasks");
        setTasks(tasks);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isCurrentMonth = sameDay(month, startOfMonth(new Date()));
  const scheduled = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth() + 1;
    return tasks.filter((t) => taskOccurrencesInMonth(t, y, m).length > 0).length;
  }, [tasks, month]);

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
        title="My Calendar"
        subtitle={`${scheduled} task${scheduled === 1 ? "" : "s"} on your calendar this month. Sundays are off.`}
      >
        <MonthNav
          month={month}
          isCurrentMonth={isCurrentMonth}
          onPrev={() => setMonth((mo) => addMonths(mo, -1))}
          onNext={() => setMonth((mo) => addMonths(mo, 1))}
          onToday={() => setMonth(startOfMonth(new Date()))}
        />
      </PageHeader>

      <MonthCalendar month={month} tasks={tasks} />
    </div>
  );
}
