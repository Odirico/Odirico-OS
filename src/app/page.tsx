import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSession();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="landing-shell">
      <section className="landing-panel">
        <div>
          <p className="eyebrow">Odirico OS</p>
          <h1>Operational software for inspection, field reporting, and project delivery.</h1>
          <p className="muted">
            PoleQA is the first module inside Odirico OS, built to give infrastructure teams
            a clearer operational workspace for tickets, inspections, and follow-through.
          </p>
        </div>

        <div className="landing-actions">
          <Link className="primary-button" href="/login">
            Sign in
          </Link>
          <Link className="inline-link" href="/dashboard">
            View protected app
          </Link>
        </div>
      </section>
    </main>
  );
}
