import { NextResponse } from "next/server";

import { canManageOrganization, PLATFORM_ROLES, type PlatformRole } from "@/lib/auth/roles";
import { getUserContext } from "@/lib/auth/session";
import { resolveDesignerAlias } from "@/lib/team/designers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const TEAM_OPTIONS = ["Alpha", "Bravo", "Charlie"] as const;

function mapRolesToProfileRole(roles: PlatformRole[]) {
  if (roles.includes("admin") || roles.includes("pm")) return "admin" as const;
  if (roles.includes("qc")) return "qa" as const;
  if (roles.includes("designer")) return "designer" as const;
  return "viewer" as const;
}

export async function POST(request: Request) {
  const userContext = await getUserContext();

  if (!userContext) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canManageOrganization(userContext.roles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        userId?: string;
        displayName?: string;
        roles?: string[];
        teams?: string[];
      }
    | null;

  if (!payload?.userId || !payload.displayName || !payload.roles || !payload.teams) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const roles = payload.roles.filter((role): role is PlatformRole =>
    PLATFORM_ROLES.includes(role as PlatformRole),
  );
  const teams = payload.teams.filter((team): team is (typeof TEAM_OPTIONS)[number] =>
    TEAM_OPTIONS.includes(team as (typeof TEAM_OPTIONS)[number]),
  );

  if (roles.length === 0 || teams.length === 0) {
    return NextResponse.json({ error: "At least one role and one team are required." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const existingUserResult = await admin.auth.admin.getUserById(payload.userId);

  if (existingUserResult.error || !existingUserResult.data.user) {
    return NextResponse.json({ error: "Unable to load that user." }, { status: 404 });
  }

  const existingUser = existingUserResult.data.user;
  const designerAlias = resolveDesignerAlias(payload.userId).name;
  const appMetadata = {
    ...(existingUser.app_metadata ?? {}),
    roles,
    teams,
    display_name: payload.displayName,
    designer_name: roles.includes("designer") ? designerAlias : undefined,
  };
  const userMetadata = {
    ...(existingUser.user_metadata ?? {}),
    full_name: payload.displayName,
  };

  const updateResult = await admin.auth.admin.updateUserById(payload.userId, {
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  });

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
  }

  const profilesTable = admin.from("profiles") as any;
  const profileResult = await profilesTable.upsert(
    {
      id: payload.userId,
      full_name: payload.displayName,
      role: mapRolesToProfileRole(roles),
    },
    {
      onConflict: "id",
    },
  );

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: payload.userId,
      displayName: payload.displayName,
      roles,
      teams,
    },
  });
}
