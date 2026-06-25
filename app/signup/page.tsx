"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 6;
};

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showToast({ type: "error", title: "Passwords do not match", message: "Please make sure both passwords are the same." });
      return;
    }

    if (!fullName.trim() || !email.trim() || !password) {
      showToast({ type: "error", title: "Sign up failed", message: "Please fill in all fields" });
      return;
    }

    if (!validateEmail(email)) {
      showToast({ type: "error", title: "Sign up failed", message: "Please enter a valid email address" });
      return;
    }

    if (!validatePassword(password)) {
      showToast({ type: "error", title: "Password too short", message: "Your password must be at least 6 characters long." });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error || !data?.user) {
        const msg = error?.message || "Unable to sign up. Please try again.";
        const lower = msg.toLowerCase();
        if (lower.includes("already") || lower.includes("registered") || lower.includes("duplicate")) {
          showToast({ type: "error", title: "Email already registered", message: "An account with this email already exists. Please sign in." });
        } else {
          showToast({ type: "error", title: "Sign up failed", message: msg });
        }
        return;
      }

      const user = data.user;
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email,
        full_name: fullName,
      });

      if (profileError) {
        showToast({ type: "error", title: "Sign up partial", message: "Account created, but failed to save profile." });
        return;
      }

      showToast({ type: "success", title: "Account created!", message: "Welcome to EduPrime! Please select your level." });
      router.push("/onboarding");
    } catch (err) {
      setLoading(false);
      showToast({ type: "error", title: "Sign up failed", message: "Please check your internet connection and try again." });
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });
    } catch (err) {
      showToast({ type: 'error', title: 'Sign up failed', message: 'Unable to sign in with Google' });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#0f172a] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-white">Edu</span>
            <span className="text-[#f59e0b]">Prime</span>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-3xl bg-[#111827] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <h1 className="text-3xl font-semibold text-white">Create Your Account</h1>
          <p className="mt-2 text-sm text-slate-400">Start your journey with EduPrime.</p>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3"
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
              Full Name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
                placeholder="Your full name"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
                placeholder="Enter your password"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
                placeholder="Confirm your password"
              />
            </label>

            {/* Errors shown via toasts */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#f59e0b] px-5 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <a href="/signin" className="font-semibold text-white hover:text-[#f59e0b]">
              Sign In
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
