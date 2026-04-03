import type { NextRequest } from "next/server";

import { cookies } from "next/headers";

export const DEMO_AUTH_COOKIE = "poleqa_demo_auth";

export const DEMO_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@poleqa.local",
  app_metadata: {
    roles: ["pm"],
    teams: ["Alpha", "Bravo"],
    display_name: "Demo PM",
  },
  user_metadata: {
    full_name: "Demo PM",
  },
};

export function isDemoAuthEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true";
}

export async function hasDemoSession() {
  if (!isDemoAuthEnabled()) return false;

  const cookieStore = await cookies();
  return cookieStore.get(DEMO_AUTH_COOKIE)?.value === "1";
}

export function hasDemoSessionOnRequest(request: NextRequest) {
  if (!isDemoAuthEnabled()) return false;

  return request.cookies.get(DEMO_AUTH_COOKIE)?.value === "1";
}
