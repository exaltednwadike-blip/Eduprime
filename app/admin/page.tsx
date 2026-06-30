"use client";

import { useEffect, useState } from "react";
import { BookOpen, Layers, Tag, List } from "lucide-react";
import { supabase } from "@/lib/supabase";

const statsConfig = [
  { label: "Total Subjects", table: "subjects", icon: BookOpen },
  { label: "Total Categories", table: "categories", icon: Layers },
  { label: "Total Topics", table: "topics", icon: Tag },
  { label: "Total Questions", table: "questions", icon: List },
];

export default function AdminHomePage() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          statsConfig.map((stat) =>
            supabase.from(stat.table).select("id", { count: "exact", head: true })
          )
        );

        const nextCounts = results.map((result) => {
          if (result.error) {
            throw new Error(result.error.message);
          }
          return result.count ?? 0;
        });

        setCounts(nextCounts);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#064e23] p-6 sm:p-8">
        <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-slate-400">Overview of EduPrime subjects, categories, topics, and questions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon as any;
          return (
            <div key={stat.label} className="rounded-3xl bg-[#065f2c] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between text-slate-400">
                <span>{stat.label}</span>
                <Icon className="h-6 w-6 text-[#16a34a]" />
              </div>
              <div className="mt-6 text-5xl font-semibold text-white">
                {loading ? "..." : counts[index].toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="rounded-3xl bg-[#065f2c] p-6 text-slate-300">Loading dashboard stats...</div>
      )}
      {error && (
        <div className="rounded-3xl bg-rose-500/10 p-6 text-rose-200">{error}</div>
      )}
    </div>
  );
}



