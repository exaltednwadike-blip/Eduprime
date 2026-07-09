"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../layout";
import { ClipboardList, Monitor, Trophy, Sparkles, Settings, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<string>("");
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [cbtTestsTaken, setCbtTestsTaken] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeLevel");
    if (stored) setLevel(stored);

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);

      const [{ data: attemptsData }, { data: cbtData }] = await Promise.all([
        supabase.from("question_attempts").select("id").eq("user_id", user.id),
        supabase.from("cbt_results").select("percentage").eq("user_id", user.id),
      ]);

      setQuestionsAnswered(attemptsData?.length || 0);
      setCbtTestsTaken(cbtData?.length || 0);

      if (cbtData && cbtData.length > 0) {
        const avg = cbtData.reduce((sum: number, r: any) => sum + Number(r.percentage || 0), 0) / cbtData.length;
        setAverageScore(Math.round(avg));
      } else {
        setAverageScore(0);
      }

      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const initials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return "?";
  };

  const displayName = useMemo(() => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  }, [user]);

  // ---- theme tokens ----
  const cardBg = isDark ? "bg-[#0d2417] border border-white/5" : "bg-white border border-gray-200";
  const cardShadow = isDark ? "shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const heading = isDark ? "text-white" : "text-gray-900";
  const bannerBg = isDark ? "bg-[#0f3d20]" : "bg-white";
  const avatarBg = isDark ? "bg-white/10" : "bg-emerald-50";
  const levelPill = isDark ? "bg-[#123821] text-[#22c55e]" : "bg-emerald-50 text-emerald-600";

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {/* Profile header */}
      <div className={`rounded-2xl border ${isDark ? "border-white/10 " + bannerBg : "border-gray-200 " + bannerBg} p-4 sm:p-6`}>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-2xl font-semibold ${avatarBg} ${heading}`}>
            {initials(user?.user_metadata?.full_name, user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-xl font-semibold sm:text-2xl ${heading}`}>{displayName}</h2>
            <p className={`truncate text-sm ${muted}`}>{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${levelPill}`}>
                {level || "Level not set"}
              </span>
              <Link
                href="/dashboard/settings"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Settings size={12} />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: "Questions Answered", value: loading ? "..." : questionsAnswered, icon: ClipboardList, color: "text-emerald-400 bg-emerald-500/15" },
          { label: "CBT Tests Taken", value: loading ? "..." : cbtTestsTaken, icon: Monitor, color: "text-violet-400 bg-violet-500/15" },
          { label: "Average Score", value: loading ? "..." : `${averageScore}%`, icon: Trophy, color: "text-amber-400 bg-amber-500/15" },
          { label: "Tokens Earned", value: 0, icon: Sparkles, color: "text-sky-400 bg-sky-500/15" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl ${cardBg} p-3 sm:p-4 ${cardShadow}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${muted}`}>{stat.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stat.color}`}>
                <stat.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className={`mt-2 text-xl font-semibold sm:text-2xl ${heading}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}