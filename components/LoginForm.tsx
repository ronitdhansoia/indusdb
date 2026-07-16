"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Spinner } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to sign in.");
        setLoading(false);
        return;
      }
      router.replace(data.user.role === "admin" ? "/admin" : "/employee");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email">
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@indusappliances.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      {error && (
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full" size="md">
        {loading ? <Spinner /> : "Sign in"}
      </Button>
    </form>
  );
}
