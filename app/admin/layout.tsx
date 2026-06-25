"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "./AdminShell";

const ADMIN_EMAIL = "exaltednwadike@gmail.com";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.email || data.user.email !== ADMIN_EMAIL) {
        setStatus("unauthorized");
        router.replace("/dashboard");
        return;
      }

      setUserEmail(data.user.email);
      setStatus("authorized");
    };

    checkUser();
  }, [router]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="rounded-3xl border border-white/10 bg-[#111827] px-8 py-6 text-center text-lg font-semibold">
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
