"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
        redirectTo: "/admin",
      });

      if (!result || result.error) {
        setError("Sign in failed. Check your details and try again.");
      } else {
        window.location.assign(result.url ?? "/admin");
      }
    } catch {
      setError("We could not sign you in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label className="field">
        Email address
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label className="field">
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p className="form-server-error" role="alert">
          {error}
        </p>
      )}
      <button className="button button-dark" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
