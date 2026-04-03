"use client";

import { useEffect, useMemo, useState } from "react";

import type { PlatformRole } from "@/lib/auth/roles";
import type { DashboardMode } from "@/lib/tickets/workspace";
import {
  defaultOrgSettings,
  defaultUserPreferences,
  type OrgSettings,
  type UserPreferences,
} from "@/lib/settings/types";

const ORG_SETTINGS_KEY = "poleqa-org-settings";
const USER_SETTINGS_PREFIX = "poleqa-user-settings";
const SETTINGS_EVENT = "poleqa-settings-changed";

function getUserSettingsKey(email: string | null | undefined) {
  return `${USER_SETTINGS_PREFIX}:${email?.toLowerCase() ?? "anonymous"}`;
}

function readJson<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);

  if (!raw) return fallback;

  try {
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function dispatchSettingsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

function persistJson(key: string, value: object) {
  window.localStorage.setItem(key, JSON.stringify(value));
  dispatchSettingsChanged();
}

function applyPreferencesToDocument(preferences: UserPreferences) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.density = preferences.density;
}

export function getRoleLabel(role: PlatformRole, orgSettings: OrgSettings) {
  return orgSettings.roleLabels[role] || role.toUpperCase();
}

export function getDashboardModeLabel(
  mode: DashboardMode,
  orgSettings: OrgSettings,
) {
  switch (mode) {
    case "pm":
      return `${getRoleLabel("pm", orgSettings)} Overview`;
    case "qc":
      return `${getRoleLabel("qc", orgSettings)} Dashboard`;
    case "designer":
      return `${getRoleLabel("designer", orgSettings)} Dashboard`;
    case "client":
      return `${getRoleLabel("client", orgSettings)} Dashboard`;
    case "distribution":
      return "Distribution Dashboard";
    case "transmission":
      return "Transmission Dashboard";
  }
}

export function useSettings(email: string | null | undefined) {
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(defaultOrgSettings);
  const [userSettings, setUserSettings] = useState<UserPreferences>(defaultUserPreferences);

  useEffect(() => {
    function loadSettings() {
      setOrgSettings(readJson(ORG_SETTINGS_KEY, defaultOrgSettings));
      const preferences = readJson(getUserSettingsKey(email), defaultUserPreferences);
      setUserSettings(preferences);
      applyPreferencesToDocument(preferences);
    }

    loadSettings();
    window.addEventListener("storage", loadSettings);
    window.addEventListener(SETTINGS_EVENT, loadSettings);

    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener(SETTINGS_EVENT, loadSettings);
    };
  }, [email]);

  useEffect(() => {
    applyPreferencesToDocument(userSettings);
  }, [userSettings]);

  const api = useMemo(
    () => ({
      orgSettings,
      userSettings,
      roleLabel(role: PlatformRole) {
        return getRoleLabel(role, orgSettings);
      },
      dashboardModeLabel(mode: DashboardMode) {
        return getDashboardModeLabel(mode, orgSettings);
      },
      updateOrgSettings(updater: (current: OrgSettings) => OrgSettings) {
        setOrgSettings((current) => {
          const next = updater(current);
          persistJson(ORG_SETTINGS_KEY, next);
          return next;
        });
      },
      updateUserSettings(updater: (current: UserPreferences) => UserPreferences) {
        setUserSettings((current) => {
          const next = updater(current);
          persistJson(getUserSettingsKey(email), next);
          return next;
        });
      },
    }),
    [email, orgSettings, userSettings],
  );

  return api;
}
