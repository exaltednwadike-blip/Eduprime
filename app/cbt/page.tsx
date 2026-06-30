"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CbtQuestion = {
  id: number;
  course: string;
  question: string;
  options: string[];
  correct: number;
};

type CbtQuestionRecord = {
  id: number;
  course_code: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
};

const courses = ["ANA 201", "PHS 201", "BCH 201"];
const questionCounts = [5, 10];

export default function CbtPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"setup" | "exam" | "results">("setup");
  const [selectedCourse, setSelectedCourse] = useState("ANA 201");
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [examQuestions, setExamQuestions] = useState<CbtQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) {
      router.push("/onboarding");
    }
  }, [router]);

  useEffect(() => {
    if (stage !== "exam") {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setStage("results");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage]);

  const startExam = async () => {
    setLoadingQuestions(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from<CbtQuestionRecord>("questions")
      .select("id, course_code, question, option_a, option_b, option_c, option_d, correct_option")
      .eq("course_code", selectedCourse)
      .eq("type", "mcq")
      .neq("option_a", "")
      .neq("option_b", "")
      .neq("option_c", "")
      .neq("option_d", "")
      .limit(selectedCount);

    setLoadingQuestions(false);

    if (error) {
      setFetchError("Failed to load questions");
      return;
    }

    if (!data || data.length === 0) {
      setFetchError("No questions available for this course yet");
      return;
    }

    const built: CbtQuestion[] = data.map((record, index) => ({
      id: record.id * 100 + index,
      course: record.course_code,
      question: record.question,
      options: [record.option_a, record.option_b, record.option_c, record.option_d],
      correct: record.correct_option,
    }));

    setExamQuestions(built);
    setAnswers(Array(selectedCount).fill(null));
    setCurrentIndex(0);
    setSelectedChoice(null);
    setTimeLeft(selectedCount === 10 ? 20 * 60 : 10 * 60);
    setStage("exam");
  };

  const nextQuestion = () => {
    setAnswers((current) => {
      const nextAnswers = [...current];
      nextAnswers[currentIndex] = selectedChoice;
      return nextAnswers;
    });

    if (currentIndex + 1 >= examQuestions.length) {
      setStage("results");
      return;
    }

    setCurrentIndex(currentIndex + 1);
    setSelectedChoice(answers[currentIndex + 1] ?? null);
  };

  const resetExam = () => {
    setStage("setup");
    setSelectedCourse("ANA 201");
    setSelectedCount(5);
    setExamQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedChoice(null);
    setTimeLeft(0);
  };

  const score = answers.reduce((total, selected, index) => {
    if (selected === null) {
      return total;
    }
    return examQuestions[index]?.correct === selected ? total + 1 : total;
  }, 0);

  const percentage = examQuestions.length ? (score / examQuestions.length) * 100 : 0;
  const resultMessage =
    percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good effort!" : "Keep studying!";

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-[#052e16] text-white">
      <header className="border-b border-white/10 bg-[#052e16] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <img src="/logo.png" alt="EduPrime logo" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-white">Edu</span>
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">Prime</span>
          </div>
          <a
            href="#start"
            className="rounded-full bg-[#16a34a] px-5 py-2 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        {stage === "setup" && (
          <section className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">CBT Simulator</h1>
              <p className="text-base leading-7 text-slate-300 sm:text-lg">
                Choose your course and exam length, then start your timed practice.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-300">Course</span>
                <select
                  value={selectedCourse}
                  onChange={(event) => setSelectedCourse(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30"
                >
                  {courses.map((course) => (
                    <option key={course} value={course} className="bg-[#052e16] text-white">
                      {course}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-300">Number of questions</span>
                <div className="flex flex-wrap gap-3">
                  {questionCounts.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSelectedCount(count)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#16a34a]/50 ${
                        selectedCount === count
                          ? "bg-[#16a34a] text-[#052e16]"
                          : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={startExam}
              disabled={loadingQuestions}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#16a34a] px-7 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingQuestions ? "Loading questions..." : "Start Exam"}
            </button>

            {loadingQuestions && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#16a34a]" />
                Fetching exam questions...
              </div>
            )}

            {fetchError && !loadingQuestions && (
              <p className="mt-4 text-sm text-rose-400">{fetchError}</p>
            )}
          </section>
        )}

        {stage === "exam" && (
          <section className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Exam in Progress</h1>
                <p className="text-sm text-slate-400">Course: {selectedCourse}</p>
              </div>
              <div className="rounded-3xl bg-white/5 px-4 py-3 text-lg font-semibold text-[#16a34a] sm:px-6">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm uppercase tracking-[0.2em] text-[#16a34a]">
                  Question {currentIndex + 1} of {examQuestions.length}
                </p>
                <span className="text-sm text-slate-400">{selectedCount} minute exam</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">{examQuestions[currentIndex]?.question}</h2>

              <div className="mt-6 grid gap-3">
                {examQuestions[currentIndex]?.options.map((option, optionIndex) => {
                  const isSelected = selectedChoice === optionIndex;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedChoice(optionIndex)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left text-sm transition ${
                        isSelected
                          ? "border-[#16a34a] bg-[#16a34a]/15 text-white"
                          : "border-white/10 bg-slate-950/80 text-slate-200 hover:border-[#16a34a] hover:bg-white/5"
                      }`}
                    >
                      <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-xs font-semibold text-slate-200">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={nextQuestion}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#16a34a] px-6 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
              >
                {currentIndex + 1 >= examQuestions.length ? "Finish Exam" : "Next Question"}
              </button>
            </div>
          </section>
        )}

        {stage === "results" && (
          <section className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Exam Results</h1>
              <p className="text-base leading-7 text-slate-300 sm:text-lg">
                You scored {score} out of {examQuestions.length}.
              </p>
              <p className="text-xl font-semibold text-[#16a34a]">{resultMessage}</p>
            </div>

            <button
              type="button"
              onClick={resetExam}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#16a34a] px-7 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
            >
              Try Again
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
