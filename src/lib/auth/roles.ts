import type { User } from "@supabase/supabase-js";

import { resolveDesignerAlias } from "@/lib/team/designers";
import type { DashboardMode } from "@/lib/tickets/workspace";

export const PLATFORM_ROLES = ["pm", "qc", "designer", "client", "admin"] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export type SessionUser = Pick<User, "id" | "email" | "app_metadata" | "user_metadata">;

export type UserContext = {
  user: SessionUser;
  roles: PlatformRole[];
  displayName: string;
  designerName: string | null;
  teamLabels: string[];
  allowedModes: DashboardMode[];
  defaultMode: DashboardMode;
  canMassImport: boolean;
  isClientOnly: boolean;
};

const MODE_ORDER: DashboardMode[] = [
  "pm",
  "qc",
  "designer",
  "distribution",
  "transmission",
  "client",
];

function normalizeRole(value: string): PlatformRole | null {
  const role = value.trim().toLowerCase();

  if (role === "qa") return "qc";
  if (role === "viewer") return "client";
  if (role === "project-manager" || role === "project_manager") return "pm";

  return PLATFORM_ROLES.includes(role as PlatformRole) ? (role as PlatformRole) : null;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function inferRolesFromEmail(email: string | null | undefined): PlatformRole[] {
  const value = email?.toLowerCase() ?? "";

  if (value.includes("admin")) return ["admin"];
  if (value.includes("qc") || value.includes("qa")) return ["qc"];
  if (value.includes("design")) return ["designer"];
  if (value.includes("client")) return ["client"];

  return ["pm"];
}

export function getRolesFromUser(user: SessionUser): PlatformRole[] {
  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  const roleValues = [
    ...(Array.isArray(metadata?.roles) ? metadata.roles : []),
    ...(typeof metadata?.role === "string" ? [metadata.role] : []),
  ]
    .filter((value): value is string => typeof value === "string")
    .map(normalizeRole)
    .filter((value): value is PlatformRole => Boolean(value));

  return roleValues.length > 0 ? unique(roleValues) : inferRolesFromEmail(user.email);
}

export function getDisplayName(user: SessionUser) {
  const userMetadata = user.user_metadata as Record<string, unknown> | undefined;
  const metadata = user.app_metadata as Record<string, unknown> | undefined;

  const displayName =
    (typeof userMetadata?.full_name === "string" && userMetadata.full_name) ||
    (typeof metadata?.display_name === "string" && metadata.display_name) ||
    user.email?.split("@")[0] ||
    "Team Member";

  return displayName;
}

export function getDesignerName(user: SessionUser) {
  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  const userMetadata = user.user_metadata as Record<string, unknown> | undefined;

  if (typeof metadata?.designer_name === "string") {
    return metadata.designer_name;
  }

  if (
    Array.isArray(metadata?.roles) &&
    metadata.roles.some((role) => typeof role === "string" && normalizeRole(role) === "designer")
  ) {
    return resolveDesignerAlias(user.id).name;
  }

  if (typeof userMetadata?.full_name === "string" && userMetadata.full_name) {
    return userMetadata.full_name;
  }

  return null;
}

export function getTeamLabels(user: SessionUser) {
  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  const rawTeams = Array.isArray(metadata?.teams) ? metadata.teams : [];
  const teams = rawTeams.filter((value): value is string => typeof value === "string");

  return teams.length > 0 ? unique(teams) : ["Alpha"];
}

export function getAllowedModes(roles: PlatformRole[]) {
  const allowedModes = new Set<DashboardMode>();

  if (roles.includes("admin") || roles.includes("pm")) {
    allowedModes.add("pm");
  }

  if (roles.includes("admin") || roles.includes("pm") || roles.includes("qc")) {
    allowedModes.add("qc");
  }

  if (roles.includes("admin") || roles.includes("pm") || roles.includes("designer")) {
    allowedModes.add("designer");
  }

  if (roles.includes("admin") || roles.includes("pm") || roles.includes("qc") || roles.includes("designer")) {
    allowedModes.add("distribution");
    allowedModes.add("transmission");
  }

  if (roles.includes("admin") || roles.includes("client")) {
    allowedModes.add("client");
  }

  if (allowedModes.size === 0) {
    allowedModes.add("pm");
  }

  return MODE_ORDER.filter((mode) => allowedModes.has(mode));
}

export function getDefaultMode(roles: PlatformRole[]): DashboardMode {
  if (roles.includes("admin") || roles.includes("pm")) return "pm";
  if (roles.includes("qc")) return "qc";
  if (roles.includes("designer")) return "designer";
  if (roles.includes("client")) return "client";
  return "pm";
}

export function canManageOrganization(roles: PlatformRole[]) {
  return roles.includes("admin") || roles.includes("pm");
}

export function buildUserContext(user: SessionUser): UserContext {
  const roles = getRolesFromUser(user);

  return {
    user,
    roles,
    displayName: getDisplayName(user),
    designerName: getDesignerName(user),
    teamLabels: getTeamLabels(user),
    allowedModes: getAllowedModes(roles),
    defaultMode: getDefaultMode(roles),
    canMassImport: roles.some((role) => ["admin", "pm", "qc"].includes(role)),
    isClientOnly: roles.length === 1 && roles[0] === "client",
  };
}
