import type { PlatformRole } from "@/lib/auth/roles";
import type { DashboardMode } from "@/lib/tickets/workspace";

export type AppearanceTheme = "classic" | "ocean" | "sunrise";
export type DensityMode = "comfortable" | "compact";
export type PrimaryMetricPreference =
  | "urgent"
  | "overdue"
  | "missing-docs"
  | "my-queue";
export type LandingPagePreference = "dashboard" | "tickets";

export type UserPreferences = {
  theme: AppearanceTheme;
  density: DensityMode;
  primaryMetric: PrimaryMetricPreference;
  preferredDashboardMode: DashboardMode | "auto";
  landingPage: LandingPagePreference;
};

export type OrgSettings = {
  roleLabels: Record<PlatformRole, string>;
};

export const defaultOrgSettings: OrgSettings = {
  roleLabels: {
    pm: "PM",
    qc: "QC",
    designer: "Designer",
    client: "Client",
    admin: "Admin",
  },
};

export const defaultUserPreferences: UserPreferences = {
  theme: "classic",
  density: "comfortable",
  primaryMetric: "urgent",
  preferredDashboardMode: "auto",
  landingPage: "dashboard",
};
