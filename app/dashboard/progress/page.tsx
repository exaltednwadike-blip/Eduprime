"use client";

import { BarChart2 } from "lucide-react";

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl p-6 bg-[#111827]">
        <div className="flex items-center gap-3">
          <BarChart2 />
          <h1 className="text-2xl font-semibold">Progress Tracker</h1>
        </div>
        <div className="mt-6 text-slate-400">Coming Soon — Track your performance across all courses over time.</div>
      </div>
    </div>
  );
}
