"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";
import Link from "next/link";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { showToast } = useToast();

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      showToast({ type: "error", title: "Sign in failed", message: "Please enter both email and password." });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error || !data?.session) {
      const msg = error?.message?.toLowerCase() || "";
      if (msg.includes("invalid") || msg.includes("credentials")) {
        showToast({ type: "error", title: "Sign in failed", message: "Incorrect email or password. Please try again." });
      } else if (msg.includes("not found") || msg.includes("no user")) {
        showToast({ type: "error", title: "Account not found", message: "No account found with this email. Please sign up." });
      } else {
        showToast({ type: "error", title: "Sign in failed", message: "Something went wrong. Please try again." });
      }
      return;
    }

    showToast({ type: "success", title: "Welcome back!", message: "You have signed in successfully." });
    window.location.href = "/dashboard";
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) {
      showToast({ type: "error", title: "Sign in failed", message: "Unable to sign in with Google." });
      setGoogleLoading(false);
    }
  };

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
          <h1 className="text-3xl font-semibold text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to access your study hub.</p>

          <div className="mt-8 space-y-4">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
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

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full rounded-full bg-