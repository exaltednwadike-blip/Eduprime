"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  Lightbulb,
  LogIn,
  Plus,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useMySubjects } from "@/lib/useMySubjects";

type ActivityEntry = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  type?: string | null;
};

type LastStudy = {
  subjectId: string;
  categoryId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  index: number;
  total: number;
};

type ExamCountdown = { id: string; exam_name: string; exam_date: string };
type AnonymousStat = { subject: string; students_studied_today: number; questions_answered_today: number };

const tips = [
  "Spaced repetition is one of the best-supported ways to improve long-term memory.",
  "Teach what you learn. Explaining a concept to someone else cements your understanding.",
  "Practice past questions under timed conditions to simulate real exam pressure.",
  "Break study sessions into 25-minute focused blocks with 5-minute breaks (Pomodoro technique).",
  "Review your mistakes after every CBT. Wrong answers teach more than right ones.",
  "The night before an exam, sleep is more valuable than last-minute cramming.",
  "Connect new information to what you already know. Associations make recall easier.",
  "In anatomy, always learn structure before function. It makes physiology make sense.",
  "Draw diagrams. Visual representation of pathways and structures boosts recall significantly.",
  "For biochemistry pathways, focus on the rate-limiting enzyme first. Examiners love those.",
  "Group muscles by their nerve supply. It makes clinical questions much easier.",
  "When studying physiology, always ask 'what happens if this fails?' That's how diseases begin.",
  "Read past questions before reading your textbook. It tells you what actually gets examined.",
  "Study in a group once a week. Other people catch what you missed.",
  "Mnemonics are powerful but only if you create them yourself.",
  "Don't highlight everything. If everything is important, nothing is.",
  "The best time to review a topic is 24 hours after you first studied it.",
  "Drink water consistently during study sessions. Dehydration reduces concentration.",
  "For MCQs, eliminate obviously wrong options first before guessing.",
  "Your brain consolidates memory during sleep. Pulling all-nighters before exams backfires.",
  "In physiology, master the action potential. It appears in neurology, cardiology, and muscle physiology.",
  "Biochemistry and physiology overlap heavily. Studying them together saves time.",
  "For anatomy practicals, handle the prosection confidently. Examiners notice hesitation.",
  "Set a specific goal before each study session: 'I will finish the brachial plexus today.'",
  "Use the EduPrime CBT simulator weekly. Consistency beats cramming every time.",
  "Every organ has a blood supply, nerve supply, and lymphatic drainage. Learn all three.",
  "When you feel overwhelmed, study the smallest possible unit until confidence returns.",
];

const card = "rounded-2xl border border-line bg-surface p-4";
const iconTile = "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary";
const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-raised";
const fieldClass =
  "w-full rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";

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

function daysUntil(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function activityIcon(type?: string | null) {
  switch (type) {
    case "login":
      return <LogIn size={16} className="text-muted" />;
    case "token":
      return <Star size={16} className="text-highlight" />;
    default:
      return <CheckCircle2 size={16} className="text-primary" />;
  }
}

// Reads every row of a table in pages of 1000, so counts stay correct as content grows.
async function fetchAllPages(query: (from: number, to: number) => any): Promise<any[]> {
  const pageSize = 1000;
  const rows: any[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<string>("");
  const [lastStudy, setLastStudy] = useState<LastStudy | null>(null);

  const { subjects, hasChosen, loading: subjectsLoading } = useMySubjects();

  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [subjectProgress, setSubjectProgress] = useState<Record<string, number>>({});

  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [cbtTestsTaken, setCbtTestsTaken] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  const [dailyGoal, setDailyGoal] = useState<{ target: number; completed: number } | null>(null);
  const [goalInput, setGoalInput] = useState("25");
  const [savingGoal, setSavingGoal] = useState(false);

  const [studyStreak, setStudyStreak] = useState({ current: 0, longest: 0, freeze: 0 });
  const [challenge, setChallenge] = useState<any>(null);
  const [challengeAttempt, setChallengeAttempt] = useState<any>(null);
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [anonymousStats, setAnonymousStats] = useState<AnonymousStat[]>([]);
  const [examCountdowns, setExamCountdowns] = useState<ExamCountdown[]>([]);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [showExamForm, setShowExamForm] = useState(false);
  const [savingExam, setSavingExam] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedLevel = localStorage.getItem("eduprimeLevel");
    if (storedLevel) setLevel(storedLevel);

    try {
      const raw = localStorage.getItem("eduprimeLastStudy");
      if (raw) {
        const parsed = JSON.parse(raw) as LastStudy;
        if (parsed?.subjectId && parsed?.categoryId && parsed?.topicId) setLastStudy(parsed);
      }
    } catch {
      // ignore unreadable saved position
    }

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const refreshStreak = async () => {
      const { data: streakData } = await supabase
        .from("study_streaks")
        .select("current_streak, longest_streak, streak_freeze, last_study_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!streakData) {
        const { data: created } = await supabase
          .from("study_streaks")
          .insert({ user_id: user.id, current_streak: 1, longest_streak: 1, streak_freeze: 0, last_study_date: new Date().toISOString() })
          .select("current_streak, longest_streak, streak_freeze")
          .single();
        setStudyStreak({ current: created?.current_streak || 1, longest: created?.longest_streak || 1, freeze: created?.streak_freeze || 0 });
        return;
      }

      const today = new Date();
      const last = streakData.last_study_date ? new Date(streakData.last_study_date) : null;
      const diffDays = last ? Math.floor((today.getTime() - last.getTime()) / 86400000) : 99;

      let nextCurrent = streakData.current_streak || 1;
      if (!last) nextCurrent = 1;
      else if (diffDays === 0) nextCurrent = streakData.current_streak || 1;
      else if (diffDays === 1) nextCurrent = (streakData.current_streak || 0) + 1;
      else nextCurrent = 1;

      const nextLongest = Math.max(streakData.longest_streak || 0, nextCurrent);
      const nextFreeze = streakData.streak_freeze || 0;

      await supabase
        .from("study_streaks")
        .upsert(
          {
            user_id: user.id,
            current_streak: nextCurrent,
            longest_streak: nextLongest,
            streak_freeze: nextFreeze,
            last_study_date: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      setStudyStreak({ current: nextCurrent, longest: nextLongest, freeze: nextFreeze });
    };

    const loadDailyChallenge = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data: challengeData } = await supabase
        .from("daily_challenges")
        .select("id, question, option_a, option_b, option_c, option_d, correct_option, explanation, challenge_date")
        .eq("challenge_date", today)
        .maybeSingle();

      setChallenge(challengeData || null);

      if (challengeData) {
        const { data: attemptData } = await supabase
          .from("daily_challenge_attempts")
          .select("selected_option, correct, explanation")
          .eq("user_id", user.id)
          .eq("challenge_id", challengeData.id)
          .maybeSingle();
        setChallengeAttempt(attemptData || null);
      }
    };

    const loadAnonymousStats = async () => {
      const { data } = await supabase
        .from("anonymous_study_stats")
        .select("subject, students_studied_today, questions_answered_today")
        .limit(3);
      setAnonymousStats((data || []) as AnonymousStat[]);
    };

    const loadExamCountdowns = async () => {
      const { data } = await supabase
        .from("exam_countdowns")
        .select("id, exam_name, exam_date")
        .eq("user_id", user.id)
        .order("exam_date", { ascending: true })
        .limit(3);
      setExamCountdowns((data || []) as ExamCountdown[]);
    };

    void Promise.all([refreshStreak(), loadDailyChallenge(), loadAnonymousStats(), loadExamCountdowns()]);

    const fetchAll = async () => {
      setLoading(true);

      const [categoryRows, topicRows, questionRows] = await Promise.all([
        fetchAllPages((a, b) => supabase.from("categories").select("id, subject_id").order("id").range(a, b)),
        fetchAllPages((a, b) => supabase.from("topics").select("id, category_id").order("id").range(a, b)),
        fetchAllPages((a, b) => supabase.from("questions").select("id, topic_id").order("id").range(a, b)),
      ]);

      const categoryToSubject: Record<string, string> = {};
      categoryRows.forEach((c: any) => {
        categoryToSubject[String(c.id)] = String(c.subject_id);
      });
      const topicToSubject: Record<string, string> = {};
      topicRows.forEach((t: any) => {
        const subjId = categoryToSubject[String(t.category_id)];
        if (subjId) topicToSubject[String(t.id)] = subjId;
      });

      const countsBySubject: Record<string, number> = {};
      questionRows.forEach((q: any) => {
        const subjId = topicToSubject[String(q.topic_id)];
        if (subjId) countsBySubject[subjId] = (countsBySubject[subjId] || 0) + 1;
      });
      setQuestionCounts(countsBySubject);

      const [{ data: attemptsData }, { data: cbtData }, { data: activityData }, { data: goalData }] =
        await Promise.all([
          supabase.from("question_attempts").select("question_id, subject_id, correct").eq("user_id", user.id),
          supabase.from("cbt_results").select("percentage, created_at").eq("user_id", user.id),
          supabase
            .from("user_activity")
            .select("id, title, description, type, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3),
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
          const key = String(a.subject_id);
          if (!correctBySubject[key]) correctBySubject[key] = new Set();
          correctBySubject[key].add(String(a.question_id));
        }
      });
      const progressBySubject: Record<string, number> = {};
      Object.keys(countsBySubject).forEach((subjId) => {
        const total = countsBySubject[subjId];
        const correct = correctBySubject[subjId]?.size || 0;
        progressBySubject[subjId] = total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
      });
      setSubjectProgress(progressBySubject);

      setRecentActivity((activityData || []) as ActivityEntry[]);

      if (goalData) {
        setDailyGoal({ target: goalData.target, completed: goalData.completed });
      } else {
        setDailyGoal(null);
      }

      setLoading(false);
    };

    void fetchAll();
  }, [user]);

  const firstName = useMemo(() => {
    const fullName = user?.user_metadata?.full_name || user?.email || "Student";
    const first = String(fullName).split(" ")[0].split("@")[0];
    return first === first.toUpperCase() ? first.charAt(0) + first.slice(1).toLowerCase() : first;
  }, [user]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const tipOfTheDay = useMemo(() => {
    const seed = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return tips[Math.abs(hash) % tips.length];
  }, []);

  const visibleSubjects = useMemo(() => {
    const withQuestions = subjects.filter((s) => (questionCounts[s.id] || 0) > 0);
    const without = subjects.filter((s) => !(questionCounts[s.id] || 0));
    return [...withQuestions, ...without].slice(0, 3);
  }, [subjects, questionCounts]);

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

  const submitDailyChallenge = async () => {
    if (!user || !challenge || challengeChoice === null) return;

    const isCorrect = challengeChoice === Number(challenge.correct_option);
    const explanation = challenge.explanation || "Try again tomorrow for another challenge.";

    await supabase.from("daily_challenge_attempts").upsert(
      {
        user_id: user.id,
        challenge_id: challenge.id,
        selected_option: challengeChoice,
        correct: isCorrect,
        explanation,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "user_id,challenge_id" }
    );

    setChallengeAttempt({ selected_option: challengeChoice, correct: isCorrect, explanation });
    setChallengeFeedback({ correct: isCorrect, explanation });
  };

  const addExamCountdown = async () => {
    if (!user || !examName.trim() || !examDate) return;

    setSavingExam(true);
    const { data } = await supabase
      .from("exam_countdowns")
      .insert({ user_id: user.id, exam_name: examName.trim(), exam_date: examDate })
      .select("id, exam_name, exam_date");

    if (data && data.length > 0) {
      setExamCountdowns((prev) =>
        [...prev, ...(data as ExamCountdown[])].sort(
          (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
        )
      );
      setExamName("");
      setExamDate("");
      setShowExamForm(false);
    }
    setSavingExam(false);
  };

  const challengeOptionClass = (index: number) => {
    if (challengeAttempt) {
      const picked = Number(challengeAttempt.selected_option);
      const right = Number(challenge?.correct_option);
      if (index === right) return "border-primary bg-primary-soft text-fg";
      if (index === picked) return "border-danger bg-danger-soft text-fg";
      return "border-line bg-surface text-muted";
    }
    return challengeChoice === index
      ? "border-primary bg-primary-soft text-fg"
      : "border-line bg-surface text-fg hover:border-primary";
  };

  const challengeResult =
    challengeFeedback ??
    (challengeAttempt
      ? { correct: !!challengeAttempt.correct, explanation: challengeAttempt.explanation || "" }
      : null);

  const resumeHref = lastStudy
    ? `/dashboard/study-hub/${lastStudy.subjectId}/${lastStudy.categoryId}/${lastStudy.topicId}${lastStudy.index > 0 ? `?q=${lastStudy.index}` : ""}`
    : "/dashboard/study-hub";
  const resumePercent = lastStudy && lastStudy.total > 0 ? ((lastStudy.index + 1) / lastStudy.total) * 100 : 0;

  const stats = [
    {
      label: "Streak",
      value: `${studyStreak.current} day${studyStreak.current === 1 ? "" : "s"}`,
      icon: Flame,
      color: "text-highlight",
    },
    { label: "Answered", value: loading ? "..." : String(questionsAnswered), icon: ClipboardList, color: "text-primary" },
    {
      label: "CBT average",
      value: loading ? "..." : cbtTestsTaken > 0 ? `${averageScore}%` : "-",
      icon: Target,
      color: "text-primary",
    },
  ];

  const showMore =
    true; // tip and exam countdown are always shown, so the section always has content

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{greeting}</p>
          <h1 className="truncate text-2xl font-semibold text-fg">{firstName}</h1>
        </div>
        {level ? (
          <span className="flex-shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            {level}
          </span>
        ) : (
          <Link href="/dashboard/settings" className="flex-shrink-0 text-xs font-medium text-primary hover:underline">
            Set your level
          </Link>
        )}
      </div>

      {/* Continue studying */}
      <section className="rounded-2xl border border-primary/30 bg-primary-soft p-4 sm:p-5">
        <p className="text-xs font-medium text-primary">{lastStudy ? "Continue studying" : "Start studying"}</p>
        {lastStudy ? (
          <>
            <p className="mt-1 text-base font-semibold text-fg">
              {lastStudy.subjectName} · {lastStudy.topicName}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Question {lastStudy.index + 1} of {lastStudy.total}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-primary" style={{ width: `${resumePercent}%` }} />
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">Pick a subject and topic to begin.</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link href={resumeHref} className={primaryButton}>
            {lastStudy ? "Resume" : "Open Study Hub"}
            <ArrowRight size={16} />
          </Link>
          <Link href="/dashboard/cbt" className="text-sm font-medium text-primary hover:underline">
            Take a CBT exam
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-surface p-3">
            <stat.icon size={18} className={stat.color} />
            <p className="mt-1.5 text-base font-semibold text-fg sm:text-lg">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Daily goal */}
      <section className={card}>
        <div className="flex items-center gap-3">
          <span className={iconTile}>
            <Target size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">Daily goal</p>
            <p className="text-xs text-muted">
              {dailyGoal
                ? `Answer ${dailyGoal.target} questions today`
                : "Set how many questions you want to answer each day."}
            </p>
          </div>
          {dailyGoal && (
            <Link href="/dashboard/study-hub" className={primaryButton}>
              Start
            </Link>
          )}
        </div>

        {dailyGoal ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((dailyGoal.completed / dailyGoal.target) * 100))}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs text-muted">
              {dailyGoal.completed} / {dailyGoal.target}
            </span>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min={1}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className={`${fieldClass} w-24`}
              aria-label="Daily question goal"
            />
            <button onClick={saveGoal} disabled={savingGoal} className={primaryButton}>
              {savingGoal ? "Saving..." : "Set goal"}
            </button>
          </div>
        )}
      </section>

      {/* Your subjects */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Your subjects</h2>
          <Link href="/dashboard/study-hub" className="text-sm font-medium text-primary hover:underline">
            {subjects.length > 3 ? `See all ${subjects.length}` : "See all"}
          </Link>
        </div>

        {!subjectsLoading && !hasChosen && subjects.length > 0 && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-raised px-3 py-2 text-xs text-muted">
            <span>Showing every subject. Choose the ones you offer.</span>
            <Link href="/dashboard/settings" className="flex-shrink-0 font-medium text-primary hover:underline">
              Choose subjects
            </Link>
          </div>
        )}

        {subjectsLoading || loading ? (
          <div className="animate-pulse space-y-px overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="h-14 bg-raised" />
            <div className="h-14 bg-raised" />
            <div className="h-14 bg-raised" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
            No subjects have been added yet.
          </div>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {visibleSubjects.map((subject) => {
              const count = questionCounts[subject.id] || 0;
              const pct = subjectProgress[subject.id] || 0;
              return (
                <Link
                  key={subject.id}
                  href={`/dashboard/study-hub/${subject.id}`}
                  className="block px-4 py-3 transition hover:bg-raised"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className={`font-medium ${count > 0 ? "text-fg" : "text-muted"}`}>{subject.name}</span>
                    <span className="text-xs text-muted">{count > 0 ? `${pct}%` : "No questions yet"}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  {count > 0 && <p className="mt-1 text-xs text-muted">{count} questions</p>}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Also today */}
      {showMore && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Also today</h2>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Tip of the day */}
            <div className={card}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-raised text-highlight">
                  <Lightbulb size={18} />
                </span>
                <p className="text-sm font-semibold text-fg">Tip of the day</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{tipOfTheDay}</p>
            </div>

            {/* Exam countdown */}
            <div className={card}>
              <div className="flex items-center gap-3">
                <span className={iconTile}>
                  <CalendarDays size={18} />
                </span>
                <p className="text-sm font-semibold text-fg">Exam countdown</p>
              </div>

              {examCountdowns.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {examCountdowns.map((item) => {
                    const days = daysUntil(item.exam_date);
                    return (
                      <p key={item.id} className="text-sm text-muted">
                        Your {item.exam_name} is {days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}.
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">No exam saved yet.</p>
              )}

              {showExamForm ? (
                <div className="mt-3 space-y-2">
                  <input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="Exam name"
                    className={fieldClass}
                  />
                  <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={fieldClass} />
                  <div className="flex gap-2">
                    <button onClick={addExamCountdown} disabled={savingExam || !examName.trim() || !examDate} className={primaryButton}>
                      {savingExam ? "Saving..." : "Save exam"}
                    </button>
                    <button onClick={() => setShowExamForm(false)} className={secondaryButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowExamForm(true)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  <Plus size={14} /> Add an exam date
                </button>
              )}
            </div>

            {/* Daily challenge: only when there is one today */}
            {challenge && (
              <div className={`${card} md:col-span-2`}>
                <div className="flex items-center gap-3">
                  <span className={iconTile}>
                    <Zap size={18} />
                  </span>
                  <p className="text-sm font-semibold text-fg">Daily challenge</p>
                </div>
                <p className="mt-3 text-sm font-medium text-fg">{challenge.question}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[challenge.option_a, challenge.option_b, challenge.option_c, challenge.option_d].map((option, index) => {
                    if (!option) return null;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={!!challengeAttempt}
                        onClick={() => setChallengeChoice(index)}
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default ${challengeOptionClass(index)}`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </button>
                    );
                  })}
                </div>

                {!challengeAttempt && (
                  <button onClick={submitDailyChallenge} disabled={challengeChoice === null} className={`${primaryButton} mt-3`}>
                    Submit answer
                  </button>
                )}

                {challengeResult && (
                  <p className={`mt-3 text-sm ${challengeResult.correct ? "text-primary" : "text-danger"}`}>
                    {challengeResult.correct ? "Correct" : "Incorrect"}
                    {challengeResult.explanation ? `: ${challengeResult.explanation}` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Recent activity: only when there is some */}
            {recentActivity.length > 0 && (
              <div className={card}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-raised text-muted">
                    <Clock size={18} />
                  </span>
                  <p className="text-sm font-semibold text-fg">Recent activity</p>
                </div>
                <div className="mt-3 space-y-3">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="mt-0.5">{activityIcon(item.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg">{item.title}</p>
                        {item.description && <p className="text-xs text-muted">{item.description}</p>}
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted">{formatRelativeTime(item.created_at)}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/notifications"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View all activity <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* Anonymous stats: only when there are some */}
            {anonymousStats.length > 0 && (
              <div className={card}>
                <p className="text-sm font-semibold text-fg">Students studying today</p>
                <div className="mt-3 space-y-1.5">
                  {anonymousStats.map((stat) => (
                    <p key={stat.subject} className="text-sm text-muted">
                      {stat.students_studied_today} students studied {stat.subject} today
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}