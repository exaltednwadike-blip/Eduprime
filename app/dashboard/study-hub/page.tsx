"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BookOpen, Monitor, Trophy, Target, CheckCircle, LogIn, Star, TrendingUp, ChevronRight } from "lucide-react";

type Stats = {
  questionsAnswered: number;
  cbtTestsTaken: number;
  averageScore: number;
  tokensEarned: number;
};

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
};

type SubjectProgress = {
  name: string;
  attempted: number;
  total: number;
  percentage: number;
};

type DailyGoal = {
  target: number;
  completed: number;
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
  "When studying physiology, always ask what happens if this fails — that is how diseases begin.",
  "Read past questions before reading your textbook — it tells you what actually gets examined.",
  "Study in a group once a week — other people catch what you missed.",
  "Mnemonics are powerful but only if you create them yourself.",
  "Do not highlight everything. If everything is important, nothing is.",
  "The best time to review a topic is 24 hours after you first studied it.",
  "Drink water consistently during study sessions — dehydration reduces concentration.",
  "For MCQs, eliminate obviously wrong options first before guessing.",
  "Your brain consolidates memory during sleep — pulling all-nighters before exams backfires.",
  "In physiology, master the action potential — it appears in neurology, cardiology, and muscle physiology.",
  "Biochemistry and physiology overlap heavily — studying them together saves time.",
  "For anatomy practicals, handle the prosection confidently — examiners notice hesitation.",
  "Set a specific goal before each study session.",
  "Use the EduPrime CBT simulator weekly — consistency beats cramming every time.",
  "Every organ has a blood supply, nerve supply, and lymphatic drainage — learn all three.",
  "When you feel overwhelmed, study the smallest possible unit until confidence returns.",
];

const getDayTip = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return tips[dayOfYear % tips.length];
};

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "cbt": return <Monitor size={16} className="text-[#2db54a]" />;
    case "study": return <BookOpen size={16} className="text-blue-400" />;
    case "token": return <Star size={16} className="text-yellow-400" />;
    default: return <LogIn size={16} className="text-gray-400" />;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ questionsAnswered: 0, cbtTestsTaken: 0, averageScore: 0, tokensEarned: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>({ target: 25, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [savedLevel, setSavedLevel] = useState("Not set");

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (level) setSavedLevel(level);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/signin"); return; }
      setUser(user);

      // Fetch stats
      const [cbtRes, attemptsRes, activityRes] = await Promise.all([
        supabase.from("cbt_results").select("score, total_questions, percentage").eq("user_id", user.id),
        supabase.from("question_attempts").select("id, subject_id, correct").eq("user_id", user.id),
        supabase.from("user_activity").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const cbtData = cbtRes.data || [];
      const attemptsData = attemptsRes.data || [];
      const activityData = activityRes.data || [];

      const avgScore = cbtData.length > 0
        ? Math.round(cbtData.reduce((sum, r) => sum + Number(r.percentage), 0) / cbtData.length)
        : 0;

      setStats({
        questionsAnswered: attemptsData.length,
        cbtTestsTaken: cbtData.length,
        averageScore: avgScore,
        tokensEarned: cbtData.length * 10 + attemptsData.length,
      });

      // If no activity, add a login entry
      if (activityData.length === 0) {
        setActivities([{
          id: "login",
          type: "login",
          title: "Welcome to EduPrime",
          description: "Start studying to track your progress",
          created_at: new Date().toISOString(),
        }]);
      } else {
        setActivities(activityData);
      }

      // Fetch subject progress
      const { data: subjects } = await supabase.from("subjects").select("id, name");
      if (subjects && attemptsData.length > 0) {
        const { data: totalQuestions } = await supabase.from("questions").select("id, topic_id");
        const { data: topics } = await supabase.from("topics").select("id, category_id");
        const { data: categories } = await supabase.from("categories").select("id, subject_id");

        const progress: SubjectProgress[] = subjects.map((subject) => {
          const subjectCategories = (categories || []).filter(c => c.subject_id === subject.id);
          const subjectTopics = (topics || []).filter(t => subjectCategories.some(c => c.id === t.category_id));
          const subjectQuestions = (totalQuestions || []).filter(q => subjectTopics.some(t => t.id === q.topic_id));
          const attempted = attemptsData.filter(a => a.subject_id === subject.id).length;
          const total = subjectQuestions.length;
          const percentage = total > 0 ? Math.round((attempted / total) * 100) : 0;
          return { name: subject.name, attempted, total, percentage };
        });

        setSubjectProgress(progress.filter(p => p.total > 0));
      }

      // Fetch or create daily goal
      const today = new Date().toISOString().split("T")[0];
      const { data: goalData } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("goal_date", today)
        .single();

      if (goalData) {
        setDailyGoal({ target: goalData.target, completed: goalData.completed });
      } else {
        await supabase.from("daily_goals").insert({ user_id: user.id, goal_date: today, target: 25, completed: 0 });
        setDailyGoal({ target: 25, completed: 0 });
      }

      setLoading(false);
    };

    fetchAll();
  }, [router]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] || "Student";

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const overallProgress = subjectProgress.length > 0
    ? Math.round(subjectProgress.reduce((sum, s) => sum + s.percentage, 0) / subjectProgress.length)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a5c2a] border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d2b17] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-[#2db54a] uppercase tracking-widest">Good to see you again</p>
            <h1 className="mt-1 text-3xl font-bold text-white capitalize">{firstName}</h1>
            <p className="mt-2 text-sm text-gray-300">Keep your momentum going with today's study plan.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/dashboard/study-hub" className="inline-flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2db54a] transition">
                <BookOpen size={16} /> Continue Studying
              </Link>
              <Link href="/dashboard/cbt" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition">
                <Monitor size={16} /> Take CBT
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex flex-col gap-2 text-right">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-gray-400">Level</p>
              <p className="font-semibold text-white">{savedLevel}</p>
              {savedLevel === "Not set" && (
                <Link href="/dashboard/settings" className="text-xs text-[#2db54a] hover:underline">Set your level</Link>
              )}
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-gray-400">Today</p>
              <p className="text-sm font-semibold text-white">{today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Questions Answered", value: stats.questionsAnswered.toLocaleString(), icon: <BookOpen size={20} />, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "CBT Tests Taken", value: stats.cbtTestsTaken.toLocaleString(), icon: <Monitor size={20} />, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Average Score", value: `${stats.averageScore}%`, icon: <Trophy size={20} />, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Tokens Earned", value: stats.tokensEarned.toLocaleString(), icon: <Star size={20} />, color: "text-[#1a5c2a]", bg: "bg-green-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <div className={`rounded-lg ${stat.bg} p-2 ${stat.color}`}>{stat.icon}</div>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Study Progress */}
        <div className="lg:col-span-1 rounded-xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#1a5c2a]" /> Study Progress
            </h2>
            <Link href="/dashboard/progress" className="text-xs text-[#1a5c2a] hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {/* Circular progress */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#1a5c2a" strokeWidth="3"
                  strokeDasharray={`${overallProgress} ${100 - overallProgress}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{overallProgress}%</span>
                <span className="text-xs text-gray-400">Overall</span>
              </div>
            </div>
          </div>

          {subjectProgress.length > 0 ? (
            <div className="space-y-3">
              {subjectProgress.map((subject) => (
                <div key={subject.name}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{subject.name}</span>
                    <span>{subject.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-[#1a5c2a] transition-all"
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-400">Start studying to see your progress</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 rounded-xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{getTimeAgo(activity.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-1 space-y-4">

          {/* Daily Goal */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-[#1a5c2a]" />
              <h2 className="font-semibold text-gray-900">Daily Goal</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">Answer {dailyGoal.target} questions today</p>
            <div className="h-2 rounded-full bg-gray-100 mb-2">
              <div
                className="h-2 rounded-full bg-[#1a5c2a] transition-all"
                style={{ width: `${Math.min((dailyGoal.completed / dailyGoal.target) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>{dailyGoal.completed} completed</span>
              <span>{dailyGoal.target - dailyGoal.completed > 0 ? `${dailyGoal.target - dailyGoal.completed} remaining` : "Goal reached!"}</span>
            </div>
            <Link
              href="/dashboard/study-hub"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a5c2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2db54a] transition"
            >
              <CheckCircle size={16} /> Let's go!
            </Link>
          </div>

          {/* Tip of the Day */}
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-500 text-lg">💡</span>
              <h2 className="font-semibold text-gray-900">Tip of the Day</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed italic">"{getDayTip()}"</p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pb-2">
        Stay focused and keep pushing forward. You're doing great! — EduPrime 2026
      </div>

    </div>
  );
}