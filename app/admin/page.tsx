"use client";

import { useEffect, useState } from "react";
import { BookOpen, Layers, Tag, List, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const statsConfig = [
  { label: "Subjects", table: "subjects", icon: BookOpen },
  { label: "Categories", table: "categories", icon: Layers },
  { label: "Topics", table: "topics", icon: Tag },
  { label: "Questions", table: "questions", icon: List },
];

export default function AdminHomePage() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The admin layout already guards this page, so only load the numbers here.
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          statsConfig.map((stat) =>
            supabase.from(stat.table).select("id", { count: "exact", head: true })
          )
        );

        const nextCounts = results.map((result) => {
          if (result.error) throw new Error(result.error.message);
          return result.count ?? 0;
        });

        setCounts(nextCounts);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-fg sm:text-2xl">Admin dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Overview of EduPrime subjects, categories, topics, and questions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{stat.label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-fg">
                {loading ? "..." : counts[index].toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger bg-danger-soft p-4 text-sm text-fg">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-danger" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}