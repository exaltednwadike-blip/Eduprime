"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };

export default function StudyHubSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const subjectId = Array.isArray(params.subject) ? params.subject[0] : params.subject ?? "";

  const [subject, setSubject] = useState<Subject | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const panel = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const heading = isDark ? "text-white" : "text-gray-900";
  const body = isDark ? "text-slate-300" : "text-gray-600";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const rowHover = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const divider = isDark ? "divide-white/5" : "divide-gray-100";

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) router.push("/onboarding");
  }, [router]);

  useEffect(() => {
    if (!subjectId) return;

    let active = true;

    const fetchSubjectAndCategories = async () => {
      setLoading(true);
      const [subjectRes, categoriesRes] = await Promise.all([
        supabase.from("subjects").select("id, name").eq("id", subjectId).single(),
        supabase.from("categories").select("id, subject_id, name").eq("subject_id", subjectId).order("name"),
      ]);

      if (!active) return;

      setSubject((subjectRes.data as Subject | null) ?? null);
      setCategories((categoriesRes.data as Category[]) || []);
      setLoading(false);
    };

    fetchSubjectAndCategories();

    return () => {
      active = false;
    };
  }, [subjectId]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl ${panel} p-4`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Subject</p>
            <h1 className={`mt-1 text-xl font-bold ${heading}`}>
              {loading ? "Loading..." : subject?.name || "Subject"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/study-hub")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22c55e]"
          >
            <ArrowLeft size={16} />
            Back to Subjects
          </button>
        </div>
      </div>

      <div className={`rounded-xl ${panel} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className={`p-8 text-center ${body}`}>
            <p className="text-sm">No categories found for this subject yet.</p>
          </div>
        ) : (
          <div className={`max-h-[70vh] divide-y overflow-y-auto ${divider}`}>
            {categories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                onClick={() => router.push(`/dashboard/study-hub/${subjectId}/${category.id}`)}
                className={`flex w-full items-center justify-between px-5 py-4 text-left transition ${rowHover}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a]/20 text-sm font-bold text-[#16a34a]">
                    {index + 1}
                  </div>
                  <span className={`text-sm font-medium ${heading}`}>{category.name}</span>
                </div>
                <ChevronRight size={18} className={muted} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
