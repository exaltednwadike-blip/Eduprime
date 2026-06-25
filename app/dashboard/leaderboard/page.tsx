"use client";

import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl p-6 bg-[#111827]">
        <div className="flex items-center gap-3">
          <Trophy />
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
        </div>
        <div className="mt-6 text-slate-400">Coming Soon — See how you rank against other College of Medicine students.</div>
      </div>
    </div>
  );
}
