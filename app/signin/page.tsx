"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      showToast({ type: "error", title: "Sign in failed", message: "Please enter both email and password" });
      return;
    }

    if (!validateEmail(email)) {
      showToast({ type: "error", title: "Sign in failed", message: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (error || !data?.session) {
        const msg = error?.message || "Invalid email or password";
        const lower = msg.toLowerCase();
        if (lower.includes("invalid") || lower.includes("credentials")) {
          showToast({ type: "error", title: "Sign in failed", message: "Incorrect email or password. Please try again." });
        } else if (lower.includes("not found") || lower.includes("no user") || lower.includes("no account") || lower.includes("not exist")) {
          showToast({ type: "error", title: "Account not found", message: "No account found with this email. Please sign up." });
        } else {
          showToast({ type: "error", title: "Sign in failed", message: msg });
        }
        return;
      }

      showToast({ type: "success", title: "Welcome back!", message: "You have signed in successfully." });
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      showToast({ type: "error", title: "Connection error", message: "Please check your internet connection and try again." });
    }
  };

  const handleGoogleSignIn = async () => {
    // clear any previous inline error state
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });
    } catch (err) {
      showToast({ type: 'error', title: 'Sign in failed', message: 'Unable to sign in with Google' });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#052e16] text-white">
      <header className="border-b border-white/10 bg-[#052e16] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-white">Edu</span>
            <span className="text-[#16a34a]">Prime</span>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-3xl bg-[#064e23] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <h1 className="text-3xl font-semibold text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to access your study hub.</p>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-lg font-bold">G</span>
              <span>{googleLoading ? 'Continuing...' : 'Continue with Google'}</span>
            </button>

            <div className="mt-4 flex items-center gap-3">
              <hr className="flex-1 border-white/10" />
              <span className="text-sm text-slate-400">or</span>
              <hr className="flex-1 border-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-medium text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30"
                placeholder="Enter your password"
              />
            </label>

            {/* Errors are shown via toasts */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#16a34a] px-5 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-semibold text-white hover:text-[#16a34a]">
              Sign Up
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}



