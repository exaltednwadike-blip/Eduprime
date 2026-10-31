"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";
import { Crown, Trophy } from "lucide-react";

type LeaderboardEntry = {
  user_id: string;
  full_name: string;
  subject_name: string;
  subject_id: string;
  best_score: number;
  tests_taken: number;
  avg_score: number;
};

type Subject = { id: string; name: string };

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [leaderboardTab, setLeaderboardTab] = useState<"alltime" | "weekly">("alltime");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const card = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const cardText = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const activeTab = "bg-[#16a34a] text-white";
  const inactiveTab = isDark ? "bg-white/10 text-slate-300" : "bg-gray-100 text-gray-600";

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) setCurrentUserId(userData.user.id);

      const { data: subjectData } = await supabase.from("subjects").select("id, name").order("name");
      setSubjects(subjectData || []);
    };

    load();
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      const view = leaderboardTab === "alltime" ? "leaderboard_alltime" : "leaderboard_weekly";

      let query = supabase.from(view).select("*").order("best_score", { ascending: false }).limit(10);
      if (selectedSubject !== "all") {
        query = query.eq("subject_id", selectedSubject);
      }

      const { data } = await query;
      if (!active) return;
      setEntries((data || []) as LeaderboardEntry[]);
      setLoading(false);
    };

    run();

    return () => {
      active = false;
    };
  }, [leaderboardTab, selectedSubject]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl ${card} p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16a34a]/20">
            <Trophy size={20} className="text-[#16a34a]" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${cardText}`}>Leaderboard</h1>
            <p className={`text-xs ${muted}`}>See how you rank against other students</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit overflow-hidden rounded-lg">
          <button
            onClick={() => setLeaderboardTab("alltime")}
            className={`px-4 py-2 text-sm font-medium ${leaderboardTab === "alltime" ? activeTab : inactiveTab}`}
          >
            All Time
          </button>
          <button
            onClick={() => setLeaderboardTab("weekly")}
            className={`px-4 py-2 text-sm font-medium ${leaderboardTab === "weekly" ? activeTab : inactiveTab}`}
          >
            Weekly
          </button>
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className={`rounded-lg border px-3 py-2 text-sm ${isDark ? "bg-[#064e23] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"}`}
        >
          <option value="all">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </div>

      <div className={`rounded-xl ${card} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className={`p-8 text-center ${muted}`}>
            <Trophy size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No leaderboard entries yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((entry, index) => (
              <div
                key={`${entry.user_id}-${entry.subject_id}-${index}`}
                className={`grid grid-cols-12 items-center gap-2 px-4 py-3 ${index % 2 === 0 ? (isDark ? "bg-white/5" : "bg-gray-50") : ""}`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  {index === 0 ? (
                    <Crown size={18} className="text-yellow-400" />
                  ) : (
                    <span className={`text-xs font-bold ${muted}`}>#{index + 1}</span>
                  )}
                </div>
                <div className="col-span-5">
                  <p className={`text-sm font-semibold ${cardText}`}>{entry.full_name || "Student"}</p>
                  {entry.user_id === currentUserId && <span className="text-[10px] text-[#16a34a]">You</span>}
                </div>
                <div className="col-span-3 text-xs text-gray-400">{entry.subject_name}</div>
                <div className="col-span-3 text-right text-sm font-semibold text-[#16a34a]">
                  {Math.round(entry.best_score)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}