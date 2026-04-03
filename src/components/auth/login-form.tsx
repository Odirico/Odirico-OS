"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { createClientSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoModeEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true";
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextPath = ((searchParams.get("next") as Route | null) ?? "/dashboard") as Route;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createClientSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  async function handleDemoLogin() {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/demo", {
      method: "POST",
    });

    if (!response.ok) {
      setError("Unable to start demo mode right now.");
      return;
    }

    startTransition(() => {
      router.push(nextPath);
      router.refresh();
    });
  }

  async function handleResetPassword() {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(payload.error ?? "Unable to send reset email.");
      return;
    }

    setMessage(payload.message ?? "If the email exists, a reset link has been sent.");
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div className="auth-heading">
        <p className="eyebrow">PoleQA</p>
        <h1>Sign in</h1>
        <p>Use Supabase Auth to access the protected QA workspace.</p>
      </div>

      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="sarah@poleqa.io"
          required
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-message">{message}</p> : null}

      <div className="auth-actions">
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "Signing in..." : "Sign in"}
        </button>
        <button
          className="ghost-button"
          disabled={!email || isPending}
          onClick={handleResetPassword}
          type="button"
        >
          Send reset link
        </button>
        {demoModeEnabled ? (
          <button
            className="ghost-button"
            disabled={isPending}
            onClick={handleDemoLogin}
            type="button"
          >
            Continue in demo mode
          </button>
        ) : null}
      </div>

      {demoModeEnabled ? (
        <p className="form-message">
          Demo mode bypasses Supabase sign-in and loads sample QA/QC tickets locally.
        </p>
      ) : null}
    </form>
  );
}
