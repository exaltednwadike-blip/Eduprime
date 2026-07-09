"use client";

import { useEffect, useState } from "react";
import { BookOpen, Layers, Tag, List, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const statsConfig = [
  { label: "Total Subjects", table: "subjects", icon: BookOpen, color: "text-emerald-400 bg-emerald-500/15" },
  { label: "Total Categories", table: "categories", icon: Layers, color: "text-violet-400 bg-violet-500/15" },
  { label: "Total Topics", table: "topics", icon: Tag, color: "text-amber-400 bg-amber-500/15" },
  { label: "Total Questions", table: "questions", icon: List, color: "text-sky-400 bg-sky-500/15" },
];

export default function AdminHomePage() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthChecked(true); return; }

      const { data: adminData } = await supabase
        .from("admins")
        .select("email")
        .eq("email", user.email)
        .single();

      setIsAdmin(!!adminData);
      setAuthChecked(true);

      if (!adminData) return;

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

    checkAdminAndLoad();
  }, []);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2db54a] border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f0f]">
        <div className="text-center">
          <p className="text-xl font-semibold text-white">Access Denied</p>
          <p className="mt-2 text-gray-400">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="rounded-2xl border border-white/10 bg-[#0f2914] p-4 sm:p-6">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-1.5 text-xs text-gray-400 sm:text-sm">
          Overview of EduPrime subjects, categories, topics, and questions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-[#0f2914] border border-white/10 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{stat.label}</span>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stat.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {loading ? "..." : counts[index].toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}