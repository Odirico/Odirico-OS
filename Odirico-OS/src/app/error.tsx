"use client";

import { useEffect } from "react";

import { sendOperationalAlert } from "@/lib/monitoring/alerts";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void sendOperationalAlert("render_failure", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="landing-shell">
      <section className="landing-panel error-panel">
        <p className="eyebrow">Something went wrong</p>
        <h1>We hit an unexpected error.</h1>
        <p className="muted">
          The failure has been logged. You can retry the render without losing the
          whole session.
        </p>
        <button className="primary-button" onClick={() => reset()} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
