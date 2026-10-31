"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthShell, {
  GoogleButton,
  Notice,
  OrDivider,
  PasswordInput,
  fieldClass,
  primaryButton,
  secondaryButton,
} from "@/components/AuthShell";

export default function SignUpPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sent, setSent] = useState(false);
  const [exists, setExists] = useState(false);

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
    setExists(false);

    const name = fullName.trim();
    if (!name) {
      setError("Enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    if (password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already")) {
        setExists(true);
        setError("An account with this email already exists.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // Supabase returns an empty identities list when the email is already registered.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setExists(true);
      setError("An account with this email already exists.");
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      return;
    }

    setSent(true);
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
    setInfo("");
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
    setInfo("We sent it again. Check your inbox and your spam folder.");
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${email.trim()}.`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <MailCheck size={26} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Tap the link in the email and you will be signed in automatically. If you cannot see it, check your spam folder.
        </p>

        <div className="mt-5 space-y-3">
          {error && <Notice kind="error">{error}</Notice>}
          {info && <Notice kind="info">{info}</Notice>}
          <button type="button" onClick={handleResend} className={secondaryButton}>
            Send it again
          </button>
          <Link href="/signin" className="block text-center text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute.">
      <GoogleButton label="Continue with Google" onClick={handleGoogle} loading={googleLoading} />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
          className={fieldClass}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className={fieldClass}
        />
        <PasswordInput value={password} onChange={setPassword} placeholder="Password (at least 6 characters)" autoComplete="new-password" />

        {error && <Notice kind="error">{error}</Notice>}
        {exists && (
          <Link href="/signin" className="block text-sm font-medium text-primary hover:underline">
            Sign in instead
          </Link>
        )}

        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}