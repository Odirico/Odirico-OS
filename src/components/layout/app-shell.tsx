"use client";

import Link from "next/link";

import type { ReactNode } from "react";

import { canManageOrganization, type UserContext } from "@/lib/auth/roles";
import { useSettings } from "@/lib/settings/client";

type AppShellProps = {
  currentPath: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  userContext: UserContext;
};

const navItems: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tickets", label: "Tickets" },
  { href: "/settings", label: "Settings" },
];

const platformModules = [
  {
    label: "PoleQA",
    status: "Live",
    href: "/dashboard",
    external: false,
  },
  {
    label: "PM Platform",
    status: "Planned",
    href: "https://odirico.com/products.html#pm",
    external: true,
  },
  {
    label: "Training",
    status: "Planned",
    href: "https://odirico.com/products.html#training",
    external: true,
  },
];

export function AppShell({
  currentPath,
  title,
  subtitle,
  children,
  userContext,
}: AppShellProps) {
  const settings = useSettings(userContext.user.email);
  const canManageOrg = canManageOrganization(userContext.roles);
  const roleSummary = userContext.roles.map((role) => settings.roleLabel(role)).join(" | ");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">OS</div>
          <div>
            <div className="brand-name">Odirico OS</div>
            <div className="brand-subtitle">PoleQA live now. PM and Training next.</div>
          </div>
        </div>

        <div className="sidebar-module-panel">
          <p className="sidebar-label">Platform modules</p>
          <div className="sidebar-module-list">
            {platformModules.map((item) => {
              const content = (
                <>
                  <span>{item.label}</span>
                  <span className={item.status === "Live" ? "module-pill live" : "module-pill"}>
                    {item.status}
                  </span>
                </>
              );

              return item.external ? (
                <a
                  key={item.label}
                  className="sidebar-module-link"
                  href={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {content}
                </a>
              ) : (
                <Link key={item.label} className="sidebar-module-link" href={item.href as never}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href as never}
                className={active ? "sidebar-link active" : "sidebar-link"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p>{roleSummary}</p>
          <p>{userContext.displayName}</p>
          <p>
            {canManageOrg
              ? "You can manage teams, rename role titles, and tune workspace defaults in Settings."
              : "Use Settings to personalize your theme, dashboard focus, and layout density."}
          </p>
        </div>
      </aside>

      <main className="page-frame">
        <header className="page-header">
          <div>
            <p className="eyebrow">Odirico OS / PoleQA</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}
