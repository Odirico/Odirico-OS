import { NextResponse } from "next/server";

import { DEMO_AUTH_COOKIE, isDemoAuthEnabled } from "@/lib/demo-auth";

export async function POST() {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json({ error: "Demo mode is disabled." }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
