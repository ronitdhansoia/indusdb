import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const isAdminRoute = pathname.startsWith("/admin");
  const isEmployeeRoute = pathname.startsWith("/employee");

  // Not logged in -> send to login
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Role gating
  if (isAdminRoute && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/employee";
    return NextResponse.redirect(url);
  }
  if (isEmployeeRoute && session.role !== "employee") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*"],
};
