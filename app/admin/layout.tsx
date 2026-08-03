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
      // If there's no user yet, don't redirect immediately — the
      // onAuthStateChange listener below will catch the session
      // once it finishes rehydrating.
    })();

    // Safety net: react to the session actually becoming available,
    // in case the first getUser() call above ran before it was ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      <div className="min-h-screen flex items-center justify-center bg-[#052e16] text-white">
        <div className="rounded-3xl border border-white/10 bg-[#064e23] px-8 py-6 text-center text-lg font-semibold">
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
