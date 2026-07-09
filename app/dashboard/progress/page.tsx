"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, TrendingUp, Target, Award, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../layout";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string };
type Topic = { id: string; category_id: string };
type CbtResult = {
  id: string;
  subject_id: string | null;
  percentage: number;
  score: number;
  total_questions: number;
  created_at: string;
};

export default function ProgressPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, number>>({});
  const [correctBySubject, setCorrectBySubject] = useState<Record<string, Set<string>>>({});
  const [attemptedBySubject, setAttemptedBySubject] = useState<Record<string, number>>({});
  const [cbtResults, setCbtResults] = useState<CbtResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);

      const [
        { data: subjectData },
        { data: categoryData },
        { data: topicData },
        { data: questionData },
        { data: attemptsData },
        { data: cbtData },
      ] = await Promise.all([
        supabase.from("subjects").select("id, name"),
        supabase.from("categories").select("id, subject_id"),
        supabase.from("topics").select("id, category_id"),
        supabase.from("questions").select("id, topic_id"),
        supabase.from("question_attempts").select("question_id, subject_id, correct").eq("user_id", user.id),
        supabase
          .from("cbt_results")
          .select("id, subject_id, percentage, score, total_questions, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      setSubjects(subjectData || []);
      setCategories(categoryData || []);
      setTopics(topicData || []);
      setCbtResults(cbtData || []);

      // Walk subjects -> categories -> topics -> questions to count total questions per subject
      const categoryToSubject: Record<string, string> = {};
      (categoryData || []).forEach((c: any) => {
        categoryToSubject[c.id] = c.subject_id;
      });
      const topicToSubject: Record<string, string> = {};
      (topicData || []).forEach((t: any) => {
        const subjId = categoryToSubject[t.category_id];
        if (subjId) topicToSubject[t.id] = subjId;
      });
      const questionToSubject: Record<string, string> = {};
      const countsBySubject: Record<string, number> = {};
      (questionData || []).forEach((q: any) => {
        const subjId = topicToSubject[q.topic_id];
        if (subjId) {
          questionToSubject[q.id] = subjId;
          countsBySubject[subjId] = (countsBySubject[subjId] || 0) + 1;
        }
      });
      setQuestionsBySubject(countsBySubject);

      // Distinct correctly-answered questions per subject, and total attempted per subject
      const correctSets: Record<string, Set<string>> = {};
      const attemptCounts: Record<string, number> = {};
      (attemptsData || []).forEach((a: any) => {
        if (!a.subject_id) return;
        attemptCounts[a.subject_id] = (attemptCounts[a.subject_id] || 0) + 1;
        if (a.correct) {
          if (!correctSets[a.subject_id]) correctSets[a.subject_id] = new Set();
          correctSets[a.subject_id].add(a.question_id);
        }
      });
      setCorrectBySubject(correctSets);
      setAttemptedBySubject(attemptCounts);

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const subjectStats = useMemo(() => {
    return subjects
      .map((s) => {
        const total = questionsBySubject[s.id] || 0;
        const correct = correctBySubject[s.id]?.size || 0;
        const attempted = attemptedBySubject[s.id] || 0;
        const mastery = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
        return { id: s.id, name: s.name, total, correct, attempted, mastery, accuracy };
      })
      .filter((s) => s.total > 0)
      .sort((a, b) => b.mastery - a.mastery);
  }, [subjects, questionsBySubject, correctBySubject, attemptedBySubject]);

  const overallMastery = useMemo(() => {
    if (subjectStats.length === 0) return 0;
    return Math.round(subjectStats.reduce((sum, s) => sum + s.mastery, 0) / subjectStats.length);
  }, [subjectStats]);

  const totalQuestionsAnswered = useMemo(
    () => Object.values(attemptedBySubject).reduce((a, b) => a + b, 0),
    [attemptedBySubject]
  );

  const cbtAverage = useMemo(() => {
    if (cbtResults.length === 0) return 0;
    return Math.round(cbtResults.reduce((sum, r) => sum + Number(r.percentage), 0) / cbtResults.length);
  }, [cbtResults]);

  const bestScore = useMemo(() => {
    if (cbtResults.length === 0) return 0;
    return Math.max(...cbtResults.map((r) => Number(r.percentage)));
  }, [cbtResults]);

  const subjectNameById = useMemo(() => {
    const map: Record<string, string> = {};
    subjects.forEach((s) => (map[s.id] = s.name));
    return map;
  }, [subjects]);

  // ---- theme tokens ----
  const cardBg = isDark ? "bg-[#0d2417] border border-white/5" : "bg-white border border-gray-200";
  const cardShadow = isDark ? "shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const heading = isDark ? "text-white" : "text-gray-900";
  const trackBg = isDark ? "bg-white/10" : "bg-gray-200";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#16a34a]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className={`flex items-center gap-2 text-lg font-semibold sm:text-xl ${heading}`}>
          <BarChart2 size={20} className="text-[#22c55e]" /> Progress Tracker
        </h1>
        <p className={`mt-1 text-xs sm:text-sm ${muted}`}>Track your performance across all subjects over time.</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: "Overall Mastery", value: `${overallMastery}%`, icon: Target, color: "text-emerald-400 bg-emerald-500/15" },
          { label: "Questions Answered", value: totalQuestionsAnswered, icon: BarChart2, color: "text-sky-400 bg-sky-500/15" },
          { label: "CBT Average", value: `${cbtAverage}%`, icon: TrendingUp, color: "text-violet-400 bg-violet-500/15" },
          { label: "Best CBT Score", value: `${bestScore}%`, icon: Award, color: "text-amber-400 bg-amber-500/15" },
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

      {/* Per-subject breakdown */}
      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <h2 className={`text-sm font-semibold ${heading}`}>Mastery by Subject</h2>
        {subjectStats.length === 0 ? (
          <p className={`mt-3 text-sm ${muted}`}>No subjects with attempted questions yet. Start studying to see your breakdown here.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {subjectStats.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className={heading}>{s.name}</span>
                  <span className={muted}>
                    {s.correct}/{s.total} questions · {s.mastery}%
                  </span>
                </div>
                <div className={`mt-1 h-2 overflow-hidden rounded-full ${trackBg}`}>
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all"
                    style={{ width: `${s.mastery}%` }}
                  />
                </div>
                {s.attempted > 0 && (
                  <p className={`mt-1 text-[11px] ${muted}`}>
                    {s.attempted} question{s.attempted !== 1 ? "s" : ""} attempted · {s.accuracy}% accuracy on attempts
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CBT history */}
      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <h2 className={`text-sm font-semibold ${heading}`}>CBT Exam History</h2>
        {cbtResults.length === 0 ? (
          <p className={`mt-3 text-sm ${muted}`}>No CBT exams taken yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {[...cbtResults].reverse().map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-lg p-2.5 ${isDark ? "bg-white/5" : "bg-gray-50"}`}
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm font-medium ${heading}`}>
                    {r.subject_id ? subjectNameById[r.subject_id] || "Unknown subject" : "Unknown subject"}
                  </p>
                  <p className={`text-[11px] ${muted}`}>
                    {new Date(r.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {r.score}/{r.total_questions} correct
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.percentage >= 70
                      ? "bg-emerald-500/15 text-emerald-400"
                      : r.percentage >= 50
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {r.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}