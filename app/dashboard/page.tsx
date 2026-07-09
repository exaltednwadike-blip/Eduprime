"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Monitor,
  Trophy,
  Sparkles,
  ClipboardList,
  TrendingUp,
  Clock,
  Lightbulb,
  Target,
  ArrowRight,
  CheckCircle2,
  Star,
  LogIn,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "./layout";

type Subject = {
  id: string;
  name: string;
  description: string | null;
};

type ActivityEntry = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  type?: string | null;
};

const tips = [
  "Spaced repetition is proven to improve long-term memory retention by up to 80%.",
  "Teach what you learn. Explaining a concept to someone else cements your understanding.",
  "Practice past questions under timed conditions to simulate real exam pressure.",
  "Break study sessions into 25-minute focused blocks with 5-minute breaks (Pomodoro technique).",
  "Review your mistakes after every CBT — wrong answers teach more than right ones.",
  "The night before an exam, sleep is more valuable than last-minute cramming.",
  "Connect new information to what you already know — associations make recall easier.",
  "In anatomy, always learn structure before function — it makes physiology make sense.",
  "Draw diagrams. Visual representation of pathways and structures boosts recall significantly.",
  "For biochemistry pathways, focus on the rate-limiting enzyme first — examiners love those.",
  "Group muscles by their nerve supply — it makes clinical questions much easier.",
  "When studying physiology, always ask 'what happens if this fails?' — that's how diseases begin.",
  "Read past questions before reading your textbook — it tells you what actually gets examined.",
  "Study in a group once a week — other people catch what you missed.",
  "Mnemonics are powerful but only if you create them yourself.",
  "Don't highlight everything. If everything is important, nothing is.",
  "The best time to review a topic is 24 hours after you first studied it.",
  "Drink water consistently during study sessions — dehydration reduces concentration.",
  "For MCQs, eliminate obviously wrong options first before guessing.",
  "Your brain consolidates memory during sleep — pulling all-nighters before exams backfires.",
  "In physiology, master the action potential — it appears in neurology, cardiology, and muscle physiology.",
  "Biochemistry and physiology overlap heavily — studying them together saves time.",
  "For anatomy practicals, handle the prosection confidently — examiners notice hesitation.",
  "Set a specific goal before each study session: 'I will finish the brachial plexus today.'",
  "Use the EduPrime CBT simulator weekly — consistency beats cramming every time.",
  "Every organ has a blood supply, nerve supply, and lymphatic drainage — learn all three.",
  "When you feel overwhelmed, study the smallest possible unit until confidence returns.",
];

function formatRelativeTime(dateStr: string) {
  const then = new Date(dateStr).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function activityIcon(type?: string | null) {
  switch (type) {
    case "login":
      return <LogIn size={16} className="text-sky-400" />;
    case "token":
      return <Star size={16} className="text-amber-400" />;
    default:
      return <CheckCircle2 size={16} className="text-emerald-400" />;
  }
}

// Original illustration (not a copy of any licensed asset) — clipboard + graduation cap,
// swap for a real illustration asset later by replacing this with an <img src="/illustration.svg" />
function BannerIllustration() {
  return (
    <svg viewBox="0 0 200 180" className="h-28 w-28 sm:h-32 sm:w-32" fill="none">
      <rect x="40" y="20" width="90" height="120" rx="10" fill="#0f2914" stroke="#16a34a" strokeWidth="2" />
      <rect x="70" y="10" width="30" height="18" rx="4" fill="#16a34a" />
      <line x1="55" y1="55" x2="115" y2="55" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
      <line x1="55" y1="72" x2="115" y2="72" stroke="#065f2c" strokeWidth="3" strokeLinecap="round" />
      <line x1="55" y1="89" x2="100" y2="89" stroke="#065f2c" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 55 l6 6 l10 -12" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 72 l6 6 l10 -12" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(95,110)">
        <path d="M40 10 L75 26 L40 42 L5 26 Z" fill="#22c55e" />
        <path d="M20 33 v18 c0 6 10 12 20 12 s20 -6 20 -12 v-18" stroke="#16a34a" strokeWidth="3" fill="none" />
        <line x1="75" y1="26" x2="75" y2="46" stroke="#16a34a" strokeWidth="2" />
      </g>
      <circle cx="165" cy="30" r="3" fill="#22c55e" opacity="0.6" />
      <circle cx="178" cy="45" r="2" fill="#22c55e" opacity="0.5" />
      <circle cx="160" cy="60" r="2.5" fill="#22c55e" opacity="0.4" />
    </svg>
  );
}

// Small self-contained SVG donut — no chart library dependency
function ProgressDonut({ percent, isDark }: { percent: number; isDark: boolean }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg viewBox="0 0 140 140" className="h-24 w-24">
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"}
        strokeWidth="10"
      />
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="#16a34a"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x="70"
        y="66"
        textAnchor="middle"
        className={isDark ? "fill-white" : "fill-gray-900"}
        style={{ fontSize: "22px", fontWeight: 700 }}
      >
        {percent}%
      </text>
      <text
        x="70"
        y="86"
        textAnchor="middle"
        className={isDark ? "fill-slate-400" : "fill-gray-500"}
        style={{ fontSize: "9px" }}
      >
        Overall Progress
      </text>
    </svg>
  );
}

export default function DashboardHome() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<string>("");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [subjectProgress, setSubjectProgress] = useState<Record<string, number>>({});

  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [cbtTestsTaken, setCbtTestsTaken] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  const [dailyGoal, setDailyGoal] = useState<{ target: number; completed: number } | null>(null);
  const [goalInput, setGoalInput] = useState("25");
  const [savingGoal, setSavingGoal] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedLevel = localStorage.getItem("eduprimeLevel");
    if (storedLevel) setLevel(storedLevel);

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);

      // --- Content tree: subjects -> categories -> topics -> questions ---
      const [{ data: subjectData }, { data: categoryData }, { data: topicData }, { data: questionData }] =
        await Promise.all([
          supabase.from("subjects").select("id, name, description"),
          supabase.from("categories").select("id, subject_id"),
          supabase.from("topics").select("id, category_id"),
          supabase.from("questions").select("id, topic_id"),
        ]);

      if (subjectData) setSubjects(subjectData);

      const categoryToSubject: Record<string, string> = {};
      (categoryData || []).forEach((c: any) => {
        categoryToSubject[c.id] = c.subject_id;
      });
      const topicToSubject: Record<string, string> = {};
      (topicData || []).forEach((t: any) => {
        const subjId = categoryToSubject[t.category_id];
        if (subjId) topicToSubject[t.id] = subjId;
      });

      const countsBySubject: Record<string, number> = {};
      (questionData || []).forEach((q: any) => {
        const subjId = topicToSubject[q.topic_id];
        if (subjId) countsBySubject[subjId] = (countsBySubject[subjId] || 0) + 1;
      });
      setQuestionCounts(countsBySubject);

      // --- User-specific stats ---
      const [{ data: attemptsData }, { data: cbtData }, { data: activityData }, { data: goalData }] =
        await Promise.all([
          supabase.from("question_attempts").select("question_id, subject_id, correct").eq("user_id", user.id),
          supabase.from("cbt_results").select("percentage, created_at").eq("user_id", user.id),
          supabase
            .from("user_activity")
            .select("id, title, description, type, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("daily_goals")
            .select("target, completed")
            .eq("user_id", user.id)
            .eq("goal_date", todayDateString())
            .maybeSingle(),
        ]);

      setQuestionsAnswered(attemptsData?.length || 0);

      setCbtTestsTaken(cbtData?.length || 0);
      if (cbtData && cbtData.length > 0) {
        const avg = cbtData.reduce((sum: number, r: any) => sum + Number(r.percentage || 0), 0) / cbtData.length;
        setAverageScore(Math.round(avg));
      } else {
        setAverageScore(0);
      }

      const correctBySubject: Record<string, Set<string>> = {};
      (attemptsData || []).forEach((a: any) => {
        if (a.correct && a.subject_id) {
          if (!correctBySubject[a.subject_id]) correctBySubject[a.subject_id] = new Set();
          correctBySubject[a.subject_id].add(a.question_id);
        }
      });
      const progressBySubject: Record<string, number> = {};
      Object.keys(countsBySubject).forEach((subjId) => {
        const total = countsBySubject[subjId];
        const correct = correctBySubject[subjId]?.size || 0;
        progressBySubject[subjId] = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
      });
      setSubjectProgress(progressBySubject);

      setRecentActivity(activityData || []);

      if (goalData) {
        setDailyGoal({ target: goalData.target, completed: goalData.completed });
      } else {
        setDailyGoal(null);
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const firstName = useMemo(() => {
    const fullName = user?.user_metadata?.full_name || user?.email || "Student";
    return fullName.split(" ")[0];
  }, [user]);

  const today = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const tipOfTheDay = useMemo(() => {
    const seed = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return tips[Math.abs(hash) % tips.length];
  }, []);

  const overallProgress = useMemo(() => {
    const values = Object.values(subjectProgress);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [subjectProgress]);

  const saveGoal = async () => {
    if (!user) return;
    const n = Math.max(1, Number(goalInput) || 25);
    setSavingGoal(true);
    const { error } = await supabase
      .from("daily_goals")
      .upsert(
        { user_id: user.id, goal_date: todayDateString(), target: n, completed: 0 },
        { onConflict: "user_id,goal_date" }
      );
    if (!error) {
      setDailyGoal({ target: n, completed: 0 });
    }
    setSavingGoal(false);
  };

  // ---- theme tokens ----
  // Banner stays a richer green; content cards use a darker, more muted tone
  // to create the visual hierarchy seen in the reference design.
  const bannerBg = isDark ? "bg-[#0f3d20]" : "bg-white";
  const cardBg = isDark ? "bg-[#0d2417] border border-white/5" : "bg-white border border-gray-200";
  const cardShadow = isDark ? "shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const heading = isDark ? "text-white" : "text-gray-900";
  const subtleBg = isDark ? "bg-[#123821]" : "bg-emerald-50";
  const trackBg = isDark ? "bg-white/10" : "bg-gray-200";

  return (
    <div className="space-y-4">
      {/* Welcome banner */}
      <section className={`rounded-2xl border ${isDark ? "border-white/10 " + bannerBg : "border-gray-200 " + bannerBg} p-4 sm:p-6`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className={`flex items-center gap-2 text-sm ${muted}`}>
              <span className="text-lg">👋</span> Welcome back,
            </p>
            <h1 className={`mt-1 text-2xl font-semibold sm:text-3xl ${heading}`}>{firstName}</h1>
            <p className={`mt-2 max-w-xl text-sm ${muted}`}>
              Keep your momentum going with today's study plan and course progress overview.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/study-hub"
                className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
              >
                <BookOpen size={16} />
                Continue Studying
              </Link>
              <Link
                href="/dashboard/cbt"
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  isDark
                    ? "border-white/20 text-white hover:bg-white/10"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Monitor size={16} />
                Take CBT
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <BannerIllustration />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className={`rounded-2xl ${isDark ? "bg-black/30" : subtleBg} px-4 py-3 text-xs ${muted}`}>
                <div className="flex items-center gap-1.5 font-semibold text-[#22c55e]">
                  <Clock size={13} /> Today
                </div>
                <div className={`mt-1 text-sm font-semibold ${heading}`}>{today}</div>
              </div>
              <div className={`rounded-2xl ${isDark ? "bg-black/30" : subtleBg} px-4 py-3 text-xs ${muted}`}>
                <div className="flex items-center gap-1.5 font-semibold text-[#22c55e]">
                  <TrendingUp size={13} /> Level
                </div>
                <div className={`mt-1 text-sm font-semibold ${heading}`}>
                  {level || (
                    <Link href="/dashboard/settings" className="text-[#22c55e] hover:underline">
                      Set your level →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Questions Answered", value: loading ? "..." : questionsAnswered, icon: ClipboardList, color: "text-emerald-400 bg-emerald-500/15" },
          { label: "CBT Tests Taken", value: loading ? "..." : cbtTestsTaken, icon: Monitor, color: "text-violet-400 bg-violet-500/15" },
          { label: "Average Score", value: loading ? "..." : `${averageScore}%`, icon: Trophy, color: "text-amber-400 bg-amber-500/15" },
          // No tokens table exists yet — kept honestly at 0 rather than fabricated
          { label: "Tokens Earned", value: 0, icon: Sparkles, color: "text-sky-400 bg-sky-500/15" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl ${cardBg} p-3 sm:p-4 ${cardShadow}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${muted}`}>{stat.label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </span>
            </div>
            <div className={`mt-2 text-xl font-semibold sm:text-2xl ${heading}`}>{stat.value}</div>
          </div>
        ))}
      </section>

      {/* Progress / Activity / Sidebar */}
      <section className="grid gap-3 xl:grid-cols-3 items-start">
        {/* Study Progress Overview */}
        <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
          <h3 className={`flex items-center gap-2 text-sm font-semibold ${heading}`}>
            <TrendingUp size={15} className="text-[#22c55e]" /> Study Progress Overview
          </h3>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <ProgressDonut percent={overallProgress} isDark={isDark} />
            <div className="w-full space-y-2.5">
              {subjects.length === 0 && <p className={`text-sm ${muted}`}>No subjects added yet.</p>}
              {subjects.slice(0, 4).map((subject) => {
                const pct = subjectProgress[subject.id] || 0;
                return (
                  <div key={subject.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={heading}>{subject.name}</span>
                      <span className={muted}>{pct}%</span>
                    </div>
                    <div className={`mt-1 h-2 overflow-hidden rounded-full ${trackBg}`}>
                      <div
                        className="h-full rounded-full bg-[#16a34a] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            href="/dashboard/progress"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#22c55e] hover:underline"
          >
            View full progress <ArrowRight size={14} />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
          <h3 className={`flex items-center gap-2 text-sm font-semibold ${heading}`}>
            <Clock size={15} className="text-[#22c55e]" /> Recent Activity
          </h3>
          <div className="mt-4 space-y-3.5">
            {recentActivity.length === 0 ? (
              <div className={`flex flex-col items-center gap-2 py-6 text-center ${muted}`}>
                <Clock size={24} className="opacity-50" />
                <p className="text-sm">No recent activity yet.</p>
                <p className="text-xs">Start studying to see your progress here.</p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5">{activityIcon(item.type)}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${heading}`}>{item.title}</p>
                    {item.description && <p className={`text-xs ${muted}`}>{item.description}</p>}
                  </div>
                  <span className={`whitespace-nowrap text-xs ${muted}`}>{formatRelativeTime(item.created_at)}</span>
                </div>
              ))
            )}
          </div>
          {recentActivity.length > 0 && (
            <Link
              href="/dashboard/notifications"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#22c55e] hover:underline"
            >
              View all activity <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Sidebar: Tip of the Day + Daily Goal */}
        <div className="space-y-3">
          <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${subtleBg} text-amber-400`}>
                <Lightbulb className="h-4 w-4" />
              </span>
              <h3 className={`text-sm font-semibold ${heading}`}>Tip of the Day</h3>
            </div>
            <p className={`mt-3 text-sm italic ${muted}`}>&ldquo;{tipOfTheDay}&rdquo;</p>
          </div>

          <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${subtleBg} text-[#22c55e]`}>
                <Target className="h-4 w-4" />
              </span>
              <h3 className={`text-sm font-semibold ${heading}`}>Daily Goal</h3>
            </div>

            {dailyGoal ? (
              <>
                <p className={`mt-3 text-sm ${muted}`}>Answer {dailyGoal.target} questions today</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className={`h-2 flex-1 overflow-hidden rounded-full ${trackBg}`}>
                    <div
                      className="h-full rounded-full bg-[#16a34a] transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((dailyGoal.completed / dailyGoal.target) * 100))}%` }}
                    />
                  </div>
                  <span className={`whitespace-nowrap text-xs ${muted}`}>
                    {dailyGoal.completed} / {dailyGoal.target}
                  </span>
                </div>
                <Link
                  href="/dashboard/study-hub"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
                >
                  <span>🚀</span> Let's go!
                </Link>
              </>
            ) : (
              <div className="mt-3 space-y-2">
                <p className={`text-sm ${muted}`}>Set how many questions you want to answer daily.</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className={`w-20 rounded-lg px-3 py-2 text-sm ${
                      isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-[#16a34a]`}
                  />
                  <button
                    onClick={saveGoal}
                    disabled={savingGoal}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#16a34a] px-3 py-2 text-sm font-semibold text-[#052e16] hover:bg-[#22c55e] disabled:opacity-60"
                  >
                    <span>🚀</span>
                    {savingGoal ? "Saving..." : "Set Goal"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Your Subjects */}
      <section>
        <h3 className={`mb-2 text-sm font-semibold ${heading}`}>Your Subjects</h3>
        <div className="grid gap-2">
          {subjects.map((subject) => (
            <div key={subject.id} className={`rounded-xl ${cardBg} p-3 sm:p-4 ${cardShadow}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={`text-base font-semibold ${heading}`}>{subject.name}</h2>
                  {subject.description && <p className={`mt-0.5 text-sm ${muted}`}>{subject.description}</p>}
                </div>
                <Link
                  href="/dashboard/study-hub"
                  className="inline-flex items-center rounded-full bg-[#16a34a] px-4 py-1.5 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
                >
                  Study Now
                </Link>
              </div>

              <div className={`mt-3 h-2 overflow-hidden rounded-full ${trackBg}`}>
                <div
                  className="h-full rounded-full bg-[#16a34a] transition-all duration-300"
                  style={{ width: `${subjectProgress[subject.id] || 0}%` }}
                />
              </div>
              <div className={`mt-1.5 flex items-center justify-between text-sm ${muted}`}>
                <span>{subjectProgress[subject.id] || 0}% progress</span>
                <span>{questionCounts[subject.id] || 0} questions available</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer message */}
      <div className={`flex flex-col gap-1 pt-2 text-xs sm:flex-row sm:items-center sm:justify-between ${muted}`}>
        <p>Stay focused and keep pushing forward. You're doing great! 💪</p>
        <p>EduPrime © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
