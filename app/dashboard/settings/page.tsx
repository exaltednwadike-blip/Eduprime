"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../layout";
import { useToast } from "@/components/ToastContext";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [level, setLevel] = useState<string>(localStorage.getItem("eduprimeLevel") || "");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email || null);
    })();
  }, []);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLevel(e.target.value);
    localStorage.setItem("eduprimeLevel", e.target.value);
    showToast({ type: "success", title: "Level updated", message: "Your study level has been saved." });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    showToast({ type: "info", title: "Signed out", message: "You have been signed out successfully." });
    router.push("/signin");
  };

  const handleToggle = () => {
    toggle();
    showToast({ type: "info", title: "Theme changed", message: "Display mode updated." });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl p-6 bg-[#111827]">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-slate-400">Theme</h2>
          <div className="mt-3 flex items-center gap-4">
            <button onClick={handleToggle} className="inline-flex items-center gap-3 rounded-full bg-white/5 px-4 py-2">
              <span className="font-semibold">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-slate-400">Level</h2>
          <div className="mt-3">
            <select value={level} onChange={handleLevelChange} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
              <option value="">Select level</option>
              <option value="100 Level">100 Level</option>
              <option value="200 Level">200 Level</option>
              <option value="300 Level">300 Level</option>
              <option value="400 Level">400 Level</option>
              <option value="500 Level">500 Level</option>
              <option value="600 Level">600 Level</option>
            </select>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-slate-400">Account</h2>
          <div className="mt-3 rounded-2xl bg-white/5 p-4">
            <p className="text-sm text-slate-200">Email</p>
            <p className="mt-1 font-semibold">{userEmail}</p>
          </div>
        </section>

        <div className="mt-6">
          <button onClick={signOut} className="rounded-full bg-[#f59e0b] px-5 py-2 font-semibold text-[#0f172a]">Sign Out</button>
        </div>
      </div>
    </div>
  );
}
