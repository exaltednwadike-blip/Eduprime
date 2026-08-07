"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../layout";
import { useToast } from "@/components/ToastContext";
import { User, Sun, Moon, GraduationCap, Mail, LogOut, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { showToast } = useToast();

  const [level, setLevel] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeLevel");
    if (stored) setLevel(stored);

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email || null);
      setNameInput(data.user?.user_metadata?.full_name || "");
    })();
  }, []);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLevel(e.target.value);
    localStorage.setItem("eduprimeLevel", e.target.value);
    showToast({ type: "success", title: "Level updated", message: "Your study level has been saved." });
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast({ type: "warning", title: "Name required", message: "Please enter a name before saving." });
      return;
    }

    setSavingName(true);
    const { data: updatedUser, error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    setSavingName(false);

    if (error) {
      showToast({ type: "error", title: "Couldn't save", message: "Something went wrong updating your name." });
      return;
    }

    if (updatedUser?.user) {
      setNameInput(updatedUser.user.user_metadata?.full_name || trimmed);
    }

    showToast({ type: "success", title: "Name updated", message: "This is now how the app addresses you." });
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

  // ---- theme tokens ----
  const cardBg = isDark ? "bg-[#0d2417] border border-white/5" : "bg-white border border-gray-200";
  const cardShadow = isDark ? "shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const heading = isDark ? "text-white" : "text-gray-900";
  const inputBg = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400";
  const rowBg = isDark ? "bg-white/5" : "bg-gray-50";

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div>
        <h1 className={`text-lg font-semibold sm:text-xl ${heading}`}>Settings</h1>
        <p className={`mt-1 text-xs sm:text-sm ${muted}`}>Manage your name, level, theme, and account.</p>
      </div>

      {/* Display name */}
      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <h2 className={`flex items-center gap-2 text-sm font-semibold ${heading}`}>
          <User size={15} className="text-[#22c55e]" /> Display Name
        </h2>
        <p className={`mt-1 text-xs ${muted}`}>
          This is the name shown across the app — sidebar, dashboard greeting, and profile.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className={`flex-1 rounded-lg border px-3.5 py-2.5 text-sm ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#16a34a]`}
          />
          <button
            onClick={handleSaveName}
            disabled={savingName}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e] disabled:opacity-60"
          >
            {savingName ? <Loader2 size={14} className="animate-spin" /> : null}
            {savingName ? "Saving..." : "Save Name"}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <h2 className={`flex items-center gap-2 text-sm font-semibold ${heading}`}>
          {isDark ? <Moon size={15} className="text-[#22c55e]" /> : <Sun size={15} className="text-[#22c55e]" />} Theme
        </h2>
        <div className="mt-3">
          <button
            onClick={handleToggle}
            className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold ${rowBg} ${heading}`}
          >
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
            {isDark ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </div>

      {/* Level */}
      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <h2 className={`flex items-center gap-2 text-sm font-semibold ${heading}`}>
          <GraduationCap size={15} className="text-[#22c55e]" /> Study Level
        </h2>
        <div className="mt-3">
          <select
            value={level}
            onChange={handleLevelChange}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm sm:w-auto ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#16a34a]`}
          >
            <option value="">Select level</option>
            <option value="100 Level">100 Level</option>
            <option value="200 Level">200 Level</option>
            <option value="300 Level">300 Level</option>
            <option value="400 Level">400 Level</option>
            <option value="500 Level">500 Level</option>
            <option value="600 Level">600 Level</option>
          </select>
        </div>
      </div>

      {/* Account */}
      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <h2 className={`flex items-center gap-2 text-sm font-semibold ${heading}`}>
          <Mail size={15} className="text-[#22c55e]" /> Account
        </h2>
        <div className={`mt-3 rounded-lg ${rowBg} p-3.5`}>
          <p className={`text-xs ${muted}`}>Email</p>
          <p className={`mt-0.5 truncate text-sm font-semibold ${heading}`}>{userEmail}</p>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
      >
        <LogOut size={15} />
        Sign Out
      </button>
    </div>
  );
}