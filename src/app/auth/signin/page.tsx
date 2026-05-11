"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 bg-[var(--card)] rounded-xl border border-[var(--border)]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            RA
          </div>
          <h1 className="text-2xl font-bold">Review Arena</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            AI Code Review Comparison Tool
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="admin@reviewarena.dev"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          {error && (
            <p className="text-[var(--destructive)] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-[var(--border)]" />
              <span className="px-3 text-sm text-[var(--muted-foreground)]">or</span>
              <div className="flex-1 border-t border-[var(--border)]" />
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full py-2.5 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
