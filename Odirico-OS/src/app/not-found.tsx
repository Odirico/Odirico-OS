import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing-shell">
      <section className="landing-panel">
        <p className="eyebrow">404</p>
        <h1>That page does not exist.</h1>
        <p className="muted">Use the dashboard to get back to active QA work.</p>
        <Link className="primary-button" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
