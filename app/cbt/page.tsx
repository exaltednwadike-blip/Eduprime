"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CbtQuestion = {
  id: number;
  course: string;
  question: string;
  options: string[];
  correct: number;
};

const cbtQuestions: CbtQuestion[] = [
  {
    id: 1,
    course: "ANA 201",
    question: "What type of joint is the hip joint?",
    options: ["Hinge joint", "Ball and socket joint", "Pivot joint", "Saddle joint"],
    correct: 1,
  },
  {
    id: 2,
    course: "ANA 201",
    question: "How many cervical vertebrae does the human body have?",
    options: ["5", "6", "7", "8"],
    correct: 2,
  },
  {
    id: 3,
    course: "PHS 201",
    question: "What is the normal resting membrane potential of a neuron?",
    options: ["-55mV", "-70mV", "-90mV", "-40mV"],
    correct: 1,
  },
  {
    id: 4,
    course: "PHS 201",
    question: "Which ion rushes INTO the cell during depolarization?",
    options: ["Potassium (K+)", "Chloride (Cl-)", "Sodium (Na+)", "Calcium (Ca2+)",],
    correct: 2,
  },
  {
    id: 5,
    course: "BCH 201",
    question: "What is the end product of glycolysis?",
    options: ["Acetyl CoA", "Glucose-6-phosphate", "Pyruvate", "Lactate"],
    correct: 2,
  },
  {
    id: 6,
    course: "BCH 201",
    question: "How many ATP molecules are produced per glucose in glycolysis?",
    options: ["2", "4", "32", "36"],
    correct: 0,
  },
];

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

  const startExam = () => {
    const available = cbtQuestions.filter((item) => item.course === selectedCourse);
    const built: CbtQuestion[] = Array.from({ length: selectedCount }, (_, index) => {
      const original = available[index % available.length];
      return {
        ...original,
        id: original.id * 100 + index,
      };
    });

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
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#0f172a] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-white">Edu</span>
            <span className="text-[#f59e0b]">Prime</span>
          </div>
          <a
            href="#start"
            className="rounded-full bg-[#f59e0b] px-5 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        {stage === "setup" && (
          <section className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10">
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
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
                >
                  {courses.map((course) => (
                    <option key={course} value={course} className="bg-[#0f172a] text-white">
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
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 ${
                        selectedCount === count
                          ? "bg-[#f59e0b] text-[#0f172a]"
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
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#f59e0b] px-7 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400"
            >
              Start Exam
            </button>
          </section>
        )}

        {stage === "exam" && (
          <section className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Exam in Progress</h1>
                <p className="text-sm text-slate-400">Course: {selectedCourse}</p>
              </div>
              <div className="rounded-3xl bg-white/5 px-4 py-3 text-lg font-semibold text-[#f59e0b] sm:px-6">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm uppercase tracking-[0.2em] text-[#f59e0b]">
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
                          ? "border-[#f59e0b] bg-[#f59e0b]/15 text-white"
                          : "border-white/10 bg-slate-950/80 text-slate-200 hover:border-[#f59e0b] hover:bg-white/5"
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
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#f59e0b] px-6 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400"
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
              <p className="text-xl font-semibold text-[#f59e0b]">{resultMessage}</p>
            </div>

            <button
              type="button"
              onClick={resetExam}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#f59e0b] px-7 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400"
            >
              Try Again
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
