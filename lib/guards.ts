import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { SessionPayload } from "./auth";

/**
 * Ensure a request is authenticated. Returns the session, or a NextResponse
 * error to return early.
 */
export async function requireAuth(): Promise<
  { session: SessionPayload } | { error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireAdmin(): Promise<
  { session: SessionPayload } | { error: NextResponse }
> {
  const res = await requireAuth();
  if ("error" in res) return res;
  if (res.session.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return res;
}
