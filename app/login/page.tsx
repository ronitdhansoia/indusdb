import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";
import { Brand } from "@/components/Brand";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "admin" ? "/admin" : "/employee");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-accent lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fff 0, transparent 40%), radial-gradient(circle at 80% 60%, #fff 0, transparent 45%)",
          }}
        />
        <div className="relative">
          <div className="[&_*]:!text-white">
            <Brand />
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            Every task, every teammate, tracked in one calm place.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Assign work, follow progress in real time, and keep the Indus
            Appliances team moving through the day.
          </p>
        </div>
        <div className="relative flex gap-8 text-white/80">
          <div>
            <p className="text-2xl font-semibold text-white">Assign</p>
            <p className="text-sm">tasks in seconds</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">Track</p>
            <p className="text-sm">status live</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">Deliver</p>
            <p className="text-sm">on time</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-text">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Sign in to your Indus Tracker workspace.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
