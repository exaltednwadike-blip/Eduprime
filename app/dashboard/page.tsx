"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart2, BookOpen, ClipboardList, Monitor, Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "./layout";

type Course = {
  id: number;
  course_code: string;
  course_name: string;
};

const tips = [
  "Spaced repetition is proven to improve long-term memory retention by up to 80%.",
  "Teach what you learn. Explaining a concept to someone else cements your understanding.",
  "Practice past questions under timed conditions to simulate real exam pressure.",
  "Break study sessions into 25-minute focused blocks with 5-minute breaks (Pomodoro technique).",
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

export default function DashboardHome() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeLevel");
    if (stored) setLevel(stored);

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    const fetchCourseData = async () => {
      const { data: courseData } = await supabase.from("courses").select("id, course_code, course_name");
      if (courseData) {
        setCourses(courseData);
      }

      const { data: questionData } = await supabase.from("questions").select("course_code");
      if (questionData) {
        const counts: Record<string, number> = {};
        questionData.forEach((question) => {
          counts[question.course_code] = (counts[question.course_code] || 0) + 1;
        });
        setQuestionCounts(counts);
      }
    };

    fetchCourseData();
  }, []);

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

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#064e23] p-6 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-[#16a34a]">Good to see you again</p>
            <h1 className="mt-3 text-4xl font-semibold">Welcome back, {firstName}</h1>
            <p className="mt-4 max-w-xl text-slate-400">Keep your momentum going with today's study plan and course progress overview.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-[#065f2c] px-4 py-3 text-sm text-slate-300">
              <div className="font-semibold text-[#16a34a]">Level</div>
              <div className="mt-2 text-xl font-semibold text-white">{level || "Not set"}</div>
            </div>
            <div className="rounded-3xl bg-[#065f2c] px-4 py-3 text-sm text-slate-300">
              <div className="font-semibold text-[#16a34a]">Today</div>
              <div className="mt-2 text-xl font-semibold text-white">{today}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Questions Answered</span>
            <ClipboardList className="h-6 w-6 text-[#16a34a]" />
          </div>
          <div className="mt-6 text-4xl font-semibold">0</div>
        </div>
        <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>CBT Tests Taken</span>
            <Monitor className="h-6 w-6 text-[#16a34a]" />
          </div>
          <div className="mt-6 text-4xl font-semibold">0</div>
        </div>
        <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Average Score</span>
            <Trophy className="h-6 w-6 text-[#16a34a]" />
          </div>
          <div className="mt-6 text-4xl font-semibold">0%</div>
        </div>
        <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Tokens Earned</span>
            <Sparkles className="h-6 w-6 text-[#16a34a]" />
          </div>
          <div className="mt-6 text-4xl font-semibold">0</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          {courses.map((course) => (
            <div key={course.id} className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#16a34a]">{course.course_code}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{course.course_name}</h2>
                </div>
                <Link href="/dashboard/study-hub" className="inline-flex items-center rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]">
                  Study Now
                </Link>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-0 rounded-full bg-[#16a34a] transition-all duration-300" />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                <span>0% progress</span>
                <span>{questionCounts[course.course_code] || 0} questions available</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#065f2c] text-[#16a34a]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#16a34a]">Tip of the Day</p>
              <h3 className="mt-2 text-2xl font-semibold">Study smarter today</h3>
            </div>
          </div>
          <p className="mt-6 text-slate-300">{tipOfTheDay}</p>
        </div>
      </section>
    </div>
  );
}



