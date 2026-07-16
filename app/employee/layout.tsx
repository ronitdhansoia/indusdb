import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "employee") redirect("/admin");

  return (
    <AppShell user={{ name: session.name, email: session.email }} role="employee">
      {children}
    </AppShell>
  );
}
