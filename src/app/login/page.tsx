import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="auth-layout auth-layout-split">
      <section className="auth-intro-panel">
        <p className="eyebrow">Platform access</p>
        <h1>Sign in to the live PoleQA workspace inside Odirico OS.</h1>
        <p className="muted">
          The app is structured as a platform: PoleQA is live now, while PM Platform and Training
          stay visible as the next modules in the product story.
        </p>

        <div className="auth-module-list">
          <div className="auth-module-item">
            <strong>PoleQA</strong>
            <span>Live inspection and QA/QC workflow</span>
          </div>
          <div className="auth-module-item">
            <strong>PM Platform</strong>
            <span>Planned project delivery layer</span>
          </div>
          <div className="auth-module-item">
            <strong>Training</strong>
            <span>Simulation-based readiness layer</span>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <LoginForm />
      </section>
    </main>
  );
}
