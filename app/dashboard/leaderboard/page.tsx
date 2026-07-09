"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";
import { Trophy, Medal, Crown } from "lucide-react";

type LeaderboardEntry = {
  user_id: string;
  full_name: string;
  subject_name: string;
  best_score: number;
  tests_taken: number;
  avg_score: number;
};

type Subject = {
  id: string;
  name: string;
};

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [tab, setTab] = useState<"alltime" | "weekly">("alltime");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const card = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const cardText = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const rowBg = isDark ? "bg-[#065f2c]" : "bg-gray-50";
  const activeTab = "bg-[#16a34a] text-white";
  const inactiveTab = isDark ? "bg-white/10 text-slate-300" : "bg-gray-100 text-gray-600";

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");
      setSubjects(subjectData || []);
    };
    init();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [tab, selectedSubject]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    const view = tab === "alltime" ? "leaderboard_alltime" : "leaderboard_weekly";

    let query = supabase
      .from(view)
      .select("*")
      .order("best_score", { ascending: false })
      .limit(10);

    if (selectedSubject !== "all") {
      query = query.eq("subject_id", selectedSubject);
    }

    const { data, error } = await query;

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown size={18} className="text-yellow-400" />;
    if (index === 1) return <Medal size={18} className="text-gray-400" />;
    if (index === 2) return <Medal size={18} className="text-amber-600" />;
    return <span className={`text-sm font-bold ${muted}`}>#{index + 1}</span>;
  };

  const getFirstName = (fullName: string) => {
    if (!fullName) return "Student";
    return fullName.split(" ")[0];
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">

      {/* Header */}
      <div className={`rounded-xl ${card} p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <Trophy size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${cardText}`}>Leaderboard</h1>
            <p className={`text-xs ${muted}`}>Top 10 highest CBT scorers per subject</p>
          </div>
        </div>
      </div>

      {/* Tabs + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Weekly / All-time tabs */}
        <div className="flex rounded-lg overflow-hidden w-fit">
          <button
            onClick={() => setTab("alltime")}
            className={`px-4 py-2 text-sm font-medium transition ${tab === "alltime" ? activeTab : inactiveTab}`}
          >
            All Time
          </button>
          <button
            onClick={() => setTab("weekly")}
            className={`px-4 py-2 text-sm font-medium transition ${tab === "weekly" ? activeTab : inactiveTab}`}
          >
            This Week
          </button>
        </div>

        {/* Subject filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className={`rounded-lg border px-3 py-2 text-sm focus:outline-none ${
            isDark
              ? "bg-[#064e23] border-white/10 text-white"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Leaderboard table */}
      <div className={`rounded-xl ${card} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className={`p-8 text-center ${muted}`}>
            <Trophy size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No results yet</p>
            <p className="text-xs mt-1">Be the first to complete a CBT and appear here!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Table header */}
            <div className={`grid grid-cols-12 px-4 py-2 text-xs font-medium uppercase tracking-wide ${muted}`}>
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Student</div>
              <div className="col-span-3">Subject</div>
              <div className="col-span-2 text-center">Best Score</div>
              <div className="col-span-2 text-center">Tests</div>
            </div>

            {/* Rows */}
            {entries.map((entry, index) => {
              const isCurrentUser = entry.user_id === currentUserId;
              return (
                <div
                  key={`${entry.user_id}-${entry.subject_name}-${index}`}
                  className={`grid grid-cols-12 items-center px-4 py-3 transition ${
                    isCurrentUser
                      ? "bg-[#16a34a]/20 border-l-2 border-[#16a34a]"
                      : index % 2 === 0
                      ? rowBg
                      : ""
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankIcon(index)}
                  </div>
                  <div className="col-span-4">
                    <p className={`text-sm font-semibold ${cardText} ${isCurrentUser ? "text-[#16a34a]" : ""}`}>
                      {getFirstName(entry.full_name)}
                      {isCurrentUser && <span className="ml-1 text-xs text-[#16a34a]">(You)</span>}
                    </p>
                  </div>
                  <div className="col-span-3">
                    <span className={`text-xs ${muted}`}>{entry.subject_name}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm font-bold ${
                      entry.best_score >= 80 ? "text-[#16a34a]" :
                      entry.best_score >= 60 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {Math.round(entry.best_score)}%
                    </span>
                  </div>
                  <div className={`col-span-2 text-center text-xs ${muted}`}>
                    {entry.tests_taken}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className={`text-center text-xs ${muted}`}>
        Rankings update in real time. Complete CBT exams to appear on the leaderboard.
      </p>
    </div>
  );
}