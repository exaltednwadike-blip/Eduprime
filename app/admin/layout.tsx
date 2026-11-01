"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "./AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  const checkAdmin = async (email: string | undefined | null) => {
    if (!email) {
      setStatus("unauthorized");
      router.replace("/dashboard");
      return;
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("email")
      .ilike("email", email)
      .maybeSingle();

    if (!adminRow) {
      setStatus("unauthorized");
      router.replace("/dashboard");
      return;
    }

    setUserEmail(email);
    setStatus("authorized");
  };

  useEffect(() => {
    // First attempt: check whatever session is available right away
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        await checkAdmin(data.user.email);
      }
      // If there's no user yet, don't redirect immediately - the
      // onAuthStateChange listener below will catch the session
      // once it finishes rehydrating.
    })();

    // Safety net: react to the session actually becoming available,
    // in case the first getUser() call above ran before it was ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (session?.user?.email) {
        checkAdmin(session.user.email);
      } else if (event === "SIGNED_OUT") {
        setStatus("unauthorized");
        router.replace("/signin");
      }
    });

    // Final fallback: if nothing has resolved after a few seconds,
    // stop waiting and treat as unauthorized rather than hanging forever.
    const timeout = setTimeout(() => {
      setStatus((current) => {
        if (current === "checking") {
          router.replace("/dashboard");
          return "unauthorized";
        }
        return current;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-4 text-sm text-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Checking admin access...
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return null;
  }

  return <AdminShell userEmail={userEmail!}>{children}</AdminShell>;
}