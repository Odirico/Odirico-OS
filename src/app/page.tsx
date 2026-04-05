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
    <main className="landing-shell landing-shell-platform">
      <section className="landing-panel landing-panel-platform">
        <div className="landing-copy">
          <p className="eyebrow">Odirico OS</p>
          <h1>One platform for inspection, project delivery, and training readiness.</h1>
          <p className="muted landing-lead">
            PoleQA is live today inside Odirico OS. PM Platform and Training are positioned as
            the next modules so the product story stays clean as the platform grows.
          </p>

          <div className="landing-actions">
            <Link className="primary-button" href="/login">
              Sign in
            </Link>
            <a className="inline-link" href="https://odirico.com/products.html">
              View product overview
            </a>
          </div>
        </div>

        <aside className="module-summary-grid" aria-label="Odirico OS modules">
          <article className="module-summary-card module-summary-card-live">
            <span className="module-status">Live module</span>
            <h2>PoleQA</h2>
            <p>Inspection, QA/QC ticketing, and field documentation workflows for infrastructure teams.</p>
          </article>

          <article className="module-summary-card">
            <span className="module-status module-status-planned">Planned next</span>
            <h2>PM Platform</h2>
            <p>Schedule visibility, resource alignment, and project controls within the same platform shell.</p>
          </article>

          <article className="module-summary-card">
            <span className="module-status module-status-planned">Readiness layer</span>
            <h2>Training</h2>
            <p>Simulation-based onboarding and workflow readiness tied to how the platform is actually used.</p>
          </article>
        </aside>
      </section>
    </main>
  );
}
