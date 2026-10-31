"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";
import { BookOpen, ChevronRight } from "lucide-react";

type Subject = { id: string; name: string };

type SubjectWithCount = Subject & { flashcard_count?: number };

export default function FlashcardsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
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
    const fetchSubjects = async () => {
      setLoading(true);

      const { data: subjectsData } = await supabase.from("subjects").select("id, name").order("name");
      const subjectList = (subjectsData || []) as SubjectWithCount[];

      if (subjectList.length > 0) {
        const [catRes, topicRes] = await Promise.all([
          supabase.from("categories").select("id, subject_id"),
          supabase.from("topics").select("id, category_id"),
        ]);

        const categorySubject = new Map<string, string>();
        for (const c of catRes.data || []) categorySubject.set(c.id as string, c.subject_id as string);

        const topicSubject = new Map<string, string>();
        for (const tp of topicRes.data || []) {
          const sid = categorySubject.get(tp.category_id as string);
          if (sid) topicSubject.set(tp.id as string, sid);
        }

        const countMap = new Map<string, number>();
        const pageSize = 1000;
        for (let from = 0; ; from += pageSize) {
          const { data: rows, error } = await supabase
            .from("questions")
            .select("topic_id")
            .order("id")
            .range(from, from + pageSize - 1);
          if (error || !rows || rows.length === 0) break;
          for (const row of rows) {
            const sid = topicSubject.get(row.topic_id as string);
            if (sid) countMap.set(sid, (countMap.get(sid) || 0) + 1);
          }
          if (rows.length < pageSize) break;
        }

        for (const subject of subjectList) {
          subject.flashcard_count = countMap.get(subject.id) || 0;
        }
      }

      setSubjects(subjectList);
      setLoading(false);
    };

    fetchSubjects();
  }, []);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl ${panel} p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16a34a]/20">
            <BookOpen size={20} className="text-[#16a34a]" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${heading}`}>Flashcards</h1>
            <p className={`text-xs ${body}`}>Choose a subject to continue</p>
          </div>
        </div>
      </div>

      <div className={`rounded-xl ${panel} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" />
          </div>
        ) : subjects.length === 0 ? (
          <div className={`p-8 text-center ${body}`}>
            <p className="text-sm">No subjects available yet.</p>
          </div>
        ) : (
          <div className={`max-h-[70vh] divide-y overflow-y-auto ${divider}`}>
            {subjects.map((subject, index) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => router.push(`/dashboard/flashcards/${subject.id}`)}
                className={`flex w-full items-center justify-between px-5 py-4 text-left transition ${rowHover}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16a34a]/20 text-sm font-bold text-[#16a34a]">
                    {index + 1}
                  </div>
                  <div>
                    <span className={`block text-sm font-medium ${heading}`}>{subject.name}</span>
                    <span className={`text-xs ${muted}`}>
                      {subject.flashcard_count || 0} flashcard{(subject.flashcard_count || 0) === 1 ? "" : "s"}
                    </span>
                  </div>
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
