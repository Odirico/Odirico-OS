import { cache } from "react";

import { redirect } from "next/navigation";

import { buildUserContext } from "@/lib/auth/roles";
import { DEMO_USER, hasDemoSession } from "@/lib/demo-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getSession = cache(async () => {
  if (await hasDemoSession()) {
    return DEMO_USER;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export const getUserContext = cache(async () => {
  const user = await getSession();

  return user ? buildUserContext(user) : null;
});

export async function requireUser() {
  const context = await getUserContext();

  if (!context) {
    redirect("/login");
  }

  return context.user;
}

export async function requireUserContext() {
  const context = await getUserContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}
