"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthShell, { GoogleButton, Notice, OrDivider, PasswordInput, fieldClass, primaryButton } from "@/components/AuthShell";

export default function SignInPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);

  useEffect(() => {
    document.documentElement.style.background = "";
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setUnconfirmed(false);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (signInError) {
      setLoading(false);
      const message = signInError.message.toLowerCase();
      if (message.includes("not confirmed")) {
        setUnconfirmed(true);
        setError("Please confirm your email first. Check your inbox for the link.");
      } else if (message.includes("invalid login")) {
        setError("Wrong email or password.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    router.replace("/dashboard");
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (oauthError) {
      setGoogleLoading(false);
      setError(oauthError.message);
    }
  };

  const handleResend = async () => {
    setError("");
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setUnconfirmed(false);
    setInfo("We sent a new confirmation email. Check your inbox.");
  };

  const handleForgot = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Type your email above first, then tap Forgot password.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo(`If an account exists for ${email.trim()}, we sent a link to reset the password.`);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to carry on studying.">
      <GoogleButton label="Continue with Google" onClick={handleGoogle} loading={googleLoading} />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className={fieldClass}
        />
        <PasswordInput value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" />

        <div className="text-right">
          <button type="button" onClick={handleForgot} className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </button>
        </div>

        {error && <Notice kind="error">{error}</Notice>}
        {unconfirmed && (
          <button type="button" onClick={handleResend} className="text-sm font-medium text-primary hover:underline">
            Resend confirmation email
          </button>
        )}
        {info && <Notice kind="info">{info}</Notice>}

        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to EduPrime?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}