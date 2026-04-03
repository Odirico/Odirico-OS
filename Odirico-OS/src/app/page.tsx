import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getSession();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="landing-shell">
      <section className="landing-panel">
        <div>
          <p className="eyebrow">PoleQA</p>
          <h1>Project management platform for structured ticket operations.</h1>
          <p className="muted">
            Ticket-first project management workspace with role-aware dashboards,
            persistent filters, export actions, and structured team assignment.
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
