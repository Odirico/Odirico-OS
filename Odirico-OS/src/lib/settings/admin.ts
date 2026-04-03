import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  getDisplayName,
  getRolesFromUser,
  getTeamLabels,
  type PlatformRole,
  type SessionUser,
} from "@/lib/auth/roles";

export type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  roles: PlatformRole[];
  teams: string[];
};

export async function listManagedUsers() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw error;
  }

  return (data.users ?? [])
    .filter((user): user is typeof user & { email: string } => Boolean(user.email))
    .map((user) => {
      const sessionUser = user as SessionUser;

      return {
        id: user.id,
        email: user.email,
        displayName: getDisplayName(sessionUser),
        roles: getRolesFromUser(sessionUser),
        teams: getTeamLabels(sessionUser),
      } satisfies ManagedUser;
    })
    .sort((left, right) => left.email.localeCompare(right.email));
}
