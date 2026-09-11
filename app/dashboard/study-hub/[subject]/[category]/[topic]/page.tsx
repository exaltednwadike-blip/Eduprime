"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type Question = {
  id: string;
  topic_id: string;
  question: string;
  answer: string;
  explanation: string | null;
  type: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: number | null;
};

export default function StudyHubTopicPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const subjectId = Array.isArray(params.subject) ? params.subject[0] : params.subject ?? "";
  const categoryId = Array.isArray(params.category) ? params.category[0] : params.category ?? "";
  const topicId = Array.isArray(params.topic) ? params.topic[0] : params.topic ?? "";

  const [subject, setSubject] = useState<Subject | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [theoryRevealed, setTheoryRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  const panel = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const heading = isDark ? "text-white" : "text-gray-900";
  const body = isDark ? "text-slate-300" : "text-gray-600";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const soft = isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200";
  const badge = isDark ? "bg-[#16a34a]/20 text-[#86efac]" : "bg-[#16a34a]/10 text-[#15803d]";
  const explanationBg = isDark ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200";

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) router.push("/onboarding");
  }, [router]);

  useEffect(() => {
    if (!subjectId || !categoryId || !topicId) return;

    let active = true;

    const fetchTopicData = async () => {
      setLoading(true);
      setSelectedAnswer(null);
      setTheoryRevealed(false);
      setCurrentIndex(0);

      const [subjectRes, categoryRes, topicRes, questionsRes] = await Promise.all([
        supabase.from("subjects").select("id, name").eq("id", subjectId).single(),
        supabase.from("categories").select("id, subject_id, name").eq("id", categoryId).single(),
        supabase.from("topics").select("id, category_id, name").eq("id", topicId).single(),
        supabase
          .from("questions")
          .select("id, topic_id, question, answer, explanation, type, option_a, option_b, option_c, option_d, correct_option")
          .eq("topic_id", topicId)
          .order("created_at"),
      ]);

      if (!active) return;

      setSubject((subjectRes.data as Subject | null) ?? null);
      setCategory((categoryRes.data as Category | null) ?? null);
      setTopic((topicRes.data as Topic | null) ?? null);
      setQuestions((questionsRes.data as Question[]) || []);
      setLoading(false);
    };

    fetchTopicData();

    return () => {
      active = false;
    };
  }, [subjectId, categoryId, topicId]);

  useEffect(() => {
    setSelectedAnswer(null);
    setTheoryRevealed(false);
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex] ?? null;
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const optionLabels = ["A", "B", "C", "D"];

  const questionOptions = useMemo(() => {
    if (!currentQuestion) return [] as Array<{ label: string; value: string | null }>;
    return [
      { label: "A", value: currentQuestion.option_a },
      { label: "B", value: currentQuestion.option_b },
      { label: "C", value: currentQuestion.option_c },
      { label: "D", value: currentQuestion.option_d },
    ];
  }, [currentQuestion]);

  const handleOptionSelect = (index: number) => {
    if (!currentQuestion || selectedAnswer !== null) return;
    setSelectedAnswer(index);
  };

  const getOptionClassName = (index: number) => {
    if (!currentQuestion) return "";

    if (selectedAnswer === null) {
      return isDark
        ? "border-white/10 bg-white/5 text-white hover:border-[#16a34a] hover:bg-white/10"
        : "border-gray-200 bg-white text-gray-900 hover:border-[#16a34a]";
    }

    if (index === currentQuestion.correct_option) {
      return "border-green-500 bg-green-500/20 text-green-300";
    }

    if (index === selectedAnswer) {
      return "border-red-500 bg-red-500/20 text-red-300";
    }

    return isDark ? "border-white/10 bg-white/5 text-slate-400 opacity-60" : "border-gray-200 bg-gray-50 text-gray-400 opacity-70";
  };

  const isLastQuestion = currentIndex >= questions.length - 1;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl ${panel} p-4`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
              {subject?.name || "Subject"} / {category?.name || "Category"} / {topic?.name || "Topic"}
            </p>
            <h1 className={`mt-1 text-xl font-bold ${heading}`}>
              {loading ? "Loading..." : topic?.name || "Topic"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/study-hub/${subjectId}/${categoryId}`)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22c55e]"
          >
            <ArrowLeft size={16} />
            Back to Topics
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`rounded-xl ${panel} p-12`}>
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" />
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className={`rounded-xl ${panel} p-8 text-center`}>
          <p className={`text-sm ${body}`}>No questions found for this topic yet.</p>
        </div>
      ) : (
        <div className={`rounded-xl ${panel} p-4 sm:p-6`}>
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className={muted}>Question {currentIndex + 1} of {questions.length}</span>
              <span className={badge}>
                {currentQuestion?.type === "MCQ" ? "MCQ" : "Theory"}
              </span>
            </div>
            <div className={`h-2 overflow-hidden rounded-full ${soft}`}>
              <div
                className="h-full rounded-full bg-[#16a34a] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className={`rounded-xl border p-4 sm:p-5 ${soft}`}>
            <h2 className={`text-lg font-semibold ${heading}`}>{currentQuestion?.question}</h2>

            {currentQuestion?.type === "MCQ" ? (
              <div className="mt-5 space-y-3">
                {questionOptions.map((option, index) => {
                  const value = option.value ?? "";
                  if (!value) return null;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleOptionSelect(index)}
                      disabled={selectedAnswer !== null}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${getOptionClassName(index)}`}
                    >
                      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#16a34a]/20 text-xs font-bold text-[#16a34a]">
                        {optionLabels[index]}
                      </span>
                      <span className="flex-1 leading-relaxed">{value}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5">
                {!theoryRevealed ? (
                  <button
                    type="button"
                    onClick={() => setTheoryRevealed(true)}
                    className="rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22c55e]"
                  >
                    Reveal Answer
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className={`rounded-xl border p-3 ${explanationBg}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Answer</p>
                      <p className={`mt-2 text-sm leading-relaxed ${heading}`}>{currentQuestion?.answer}</p>
                    </div>

                    {currentQuestion?.explanation && (
                      <div className={`rounded-xl border p-3 ${explanationBg}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Explanation</p>
                        <p className={`mt-2 text-sm leading-relaxed ${body}`}>{currentQuestion.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentQuestion?.type === "MCQ" && selectedAnswer !== null && (
              <div className="mt-5 space-y-3">
                <div className={`rounded-xl border p-3 ${explanationBg}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
                    {selectedAnswer === currentQuestion.correct_option ? "Correct" : "Incorrect"}
                  </p>
                  <p className={`mt-2 text-sm leading-relaxed ${heading}`}>
                    {selectedAnswer === currentQuestion.correct_option
                      ? "Great job! That is the correct answer."
                      : `The correct answer is ${optionLabels[currentQuestion.correct_option ?? 0]}.`}
                  </p>
                </div>

                {currentQuestion.explanation && (
                  <div className={`rounded-xl border p-3 ${explanationBg}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Explanation</p>
                    <p className={`mt-2 text-sm leading-relaxed ${body}`}>{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className="rounded-lg border border-[#16a34a] px-4 py-2 text-sm font-medium text-[#16a34a] transition hover:bg-[#16a34a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
              disabled={isLastQuestion}
              className="rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22c55e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
