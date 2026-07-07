"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeLevel");
    if (stored) setLevel(stored);

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  const initials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(" ").map((n) => n[0]).slice(0,2).join("").toUpperCase();
    if (email) return email.slice(0,2).toUpperCase();
    return "?";
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl p-6 bg-[#064e23]">
        <div className="flex items-center gap-6">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-3xl font-semibold text-white">
            {initials(user?.user_metadata?.full_name, user?.email)}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user?.user_metadata?.full_name || user?.email}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-3 rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-[#16a34a]">{level || "Level not set"}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">Questions Answered</div>
            <div className="mt-2 text-xl font-semibold">—</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">CBT Tests Taken</div>
            <div className="mt-2 text-xl font-semibold">—</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <div className="text-sm text-slate-400">Tokens Earned</div>
            <div className="mt-2 text-xl font-semibold">—</div>
          </div>
        </div>
      </div>
    </div>
  );
}



