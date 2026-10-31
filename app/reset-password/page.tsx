"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthShell, { Notice, PasswordInput, primaryButton } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.style.background = "";

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
    })();

    const timer = setTimeout(() => setReady((current) => (current === null ? false : current)), 4000);

    return () => {
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/dashboard");
  };

  if (ready === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!ready) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link has expired or was already used.">
        <Link href="/signin" className={primaryButton}>
          Back to sign in
        </Link>
        <p className="mt-3 text-center text-sm text-muted">Tap Forgot password there to get a new link.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you will remember.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <PasswordInput value={password} onChange={setPassword} placeholder="New password (at least 6 characters)" autoComplete="new-password" />
        {error && <Notice kind="error">{error}</Notice>}
        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          {saving ? "Saving..." : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}