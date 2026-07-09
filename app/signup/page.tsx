"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState("");
  const { showToast } = useToast();

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      showToast({ type: "error", title: "Sign up failed", message: "Please enter your full name." });
      return;
    }

    if (!email.trim()) {
      showToast({ type: "error", title: "Sign up failed", message: "Please enter your email address." });
      return;
    }

    if (!password) {
      showToast({ type: "error", title: "Sign up failed", message: "Please enter a password." });
      return;
    }

    if (password.length < 6) {
      showToast({ type: "error", title: "Password too short", message: "Your password must be at least 6 characters long." });
      return;
    }

    if (password !== confirmPassword) {
      showToast({ type: "error", title: "Passwords do not match", message: "Please make sure both passwords are the same." });
      return;
    }

    setLoading(true);

    // Clear any lingering session first — otherwise an already-logged-in account
    // stays active in this browser and the new signup gets masked by it.
    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error || !data?.user) {
      setLoading(false);
      const msg = error?.message?.toLowerCase() || "";
      if (msg.includes("already") || msg.includes("registered") || msg.includes("duplicate")) {
        showToast({ type: "error", title: "Email already registered", message: "An account with this email already exists. Please sign in." });
      } else {
        showToast({ type: "error", title: "Sign up failed", message: error?.message || "Unable to sign up. Please try again." });
      }
      return;
    }

    // Note: with email confirmation required, there is no active session yet for
    // this new user, so this insert may be blocked by RLS until they confirm and
    // log in. Flagging this — a Postgres trigger on auth.users is the more
    // reliable way to create the profiles row automatically.
    await supabase.from("profiles").insert({
      id: data.user.id,
      email,
      full_name: fullName,
    });

    setLoading(false);
    setSignedUpEmail(email);
    setSignupComplete(true);
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      showToast({ type: "error", title: "Sign up failed", message: "Unable to sign up with Google." });
      setGoogleLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen bg-[#052e16] text-white">
        <header className="border-b border-white/10 bg-[#052e16] px-6 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="EduPrime" className="h-10 w-auto" />
            </Link>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-3xl bg-[#064e23] p-8 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#16a34a]/15">
              <MailCheck className="h-7 w-7 text-[#22c55e]" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white">Check your email</h1>
            <p className="mt-2 text-sm text-slate-400">
              We've sent a confirmation link to <span className="font-semibold text-white">{signedUpEmail}</span>.
              Click the link in that email to activate your account, then sign in.
            </p>
            <Link
              href="/signin"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#16a34a] px-5 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
            >
              Go to Sign In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#052e16] text-white">
      <header className="border-b border-white/10 bg-[#052e16] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="EduPrime" className="h-10 w-auto" />
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl bg-[#064e23] p-8 shadow-xl">
          <h1 className="text-3xl font-semibold text-white">Create Your Account</h1>
          <p className="mt-2 text-sm text-slate-400">Start your journey with EduPrime.</p>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-slate-100 disabled:opacity-70"
            >
              <span className="text-lg font-bold">G</span>
              <span>{googleLoading ? "Continuing..." : "Continue with Google"}</span>
            </button>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-white/10" />
              <span className="text-sm text-slate-400">or</span>
              <hr className="flex-1 border-white/10" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full rounded-full bg-[#1a5c2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2db54a] disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/signin" className="font-semibold text-[#86efac] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}