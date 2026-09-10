"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";

type Subject = { id: string; name: string };
type Category = { id: string; name: string; subject_id: string };
type Topic = { id: string; category_id: string; name: string };
type Question = {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: number | null;
  type: string;
};

const TIME_OPTIONS = [10, 20, 30, 45, 60];

export default function CategoryExamPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const rawSubjectId = Array.isArray(params.subject) ? params.subject[0] : params.subject;
  const rawCategoryId = Array.isArray(params.category) ? params.category[0] : params.category;
  const subjectId = rawSubjectId ?? "";
  const categoryId = rawCategoryId ?? "";

  const [subject, setSubject] = useState<Subject | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);

  const panel = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const heading = isDark ? "text-white" : "text-gray-900";
  const body = isDark ? "text-slate-300" : "text-gray-600";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const rowHover = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const divider = isDark ? "divide-white/5" : "divide-gray-100";
  const softPanel = isDark ? "bg-black/10 border border-white/10" : "bg-gray-50 border border-gray-200";
  const optionNeutral = isDark
    ? "border-white/10 bg-white/5 text-white hover:border-[#16a34a] hover:bg-white/10"
    : "border-gray-200 bg-white text-gray-900 hover:border-[#16a34a]";

  useEffect(() => {
    if (!subjectId || !categoryId) return;

    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const [subjectRes, categoryRes, topicsRes] = await Promise.all([
        supabase.from("subjects").select("id, name").eq("id", subjectId).single(),
        supabase.from("categories").select("id, name, subject_id").eq("id", categoryId).single(),
        supabase.from("topics").select("id, category_id, name").eq("category_id", categoryId).order("name"),
      ]);

      if (!active) return;

      if (subjectRes.error || categoryRes.error) {
        setError("Unable to load the selected subject or category.");
        setSubject(null);
        setCategory(null);
        setTopics([]);
        setLoading(false);
        return;
      }

      setSubject(subjectRes.data as Subject | null);
      setCategory(categoryRes.data as Category | null);
      setTopics((topicsRes.data as Topic[]) || []);

      const firstTopic = (topicsRes.data as Topic[] | null)?.[0];
      setSelectedTopicId(firstTopic?.id ?? null);
      setLoading(false);
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [subjectId, categoryId]);

  useEffect(() => {
    if (!examStarted || examFinished) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          finishExam();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [examStarted, examFinished]);

  const currentQuestion = questions[currentIndex] ?? null;

  const score = useMemo(
    () =>
      questions.reduce((total, question) => {
        const selected = answers[question.id];
        return total + (selected !== undefined && selected === question.correct_option ? 1 : 0);
      }, 0),
    [questions, answers]
  );

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const finishExam = () => {
    setExamFinished(true);
    setExamStarted(false);
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (!examStarted || examFinished) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleStartExam = async () => {
    if (!selectedTopicId) {
      setError("Please select a topic to begin the exam.");
      return;
    }

    setIsFetchingQuestions(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("questions")
      .select("id, question, answer, explanation, type, option_a, option_b, option_c, option_d, correct_option")
      .eq("topic_id", selectedTopicId)
      .eq("type", "mcq")
      .order("created_at");

    setIsFetchingQuestions(false);

    if (fetchError) {
      setError(fetchError.message || "Unable to load exam questions.");
      return;
    }

    const mcqQuestions = (data as Question[]) || [];

    if (mcqQuestions.length === 0) {
      setError("No MCQ questions are available for this topic yet.");
      return;
    }

    setQuestions(mcqQuestions);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(duration * 60);
    setExamStarted(true);
    setExamFinished(false);
  };

  const optionLabels = ["A", "B", "C", "D"];

  const getOptionStyles = (question: Question, optionIndex: number) => {
    const selectedIndex = answers[question.id];

    if (selectedIndex === undefined) {
      return optionNeutral;
    }

    if (question.correct_option === optionIndex) {
      return "border-green-500 bg-green-500/15 text-green-700 dark:text-green-300";
    }

    if (selectedIndex === optionIndex) {
      return "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300";
    }

    return isDark ? "border-white/5 bg-white/5 text-slate-500" : "border-gray-100 bg-gray-50 text-gray-400";
  };

  const topicSelected = topics.find((topic) => topic.id === selectedTopicId);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl ${panel} p-4`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
              {subject?.name || "Subject"} / {category?.name || "Category"}
            </p>
            <h1 className={`mt-1 text-xl font-bold ${heading}`}>
              {topicSelected?.name || "Select a topic"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/cbt/${subjectId}`)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#16a34a] bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22c55e]"
          >
            <ArrowLeft size={16} />
            Back to Categories
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`rounded-xl ${panel} p-10 text-center`}>
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" />
        </div>
      ) : (
        <>
          {!examStarted && !examFinished && (
            <div className={`rounded-xl ${panel} p-5`}>
              <p className={`text-sm font-semibold ${heading}`}>Choose a topic</p>

              <div className={`mt-4 divide-y overflow-hidden rounded-xl ${divider} ${isDark ? "bg-black/10" : "bg-gray-50"}`}>
                {topics.map((topic, index) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${rowHover} ${selectedTopicId === topic.id ? (isDark ? "bg-[#16a34a]/10" : "bg-[#16a34a]/5") : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#16a34a]/20 text-xs font-bold text-[#16a34a]">
                        {index + 1}
                      </span>
                      <span className={`text-sm font-medium ${heading}`}>{topic.name}</span>
                    </div>
                    <ChevronRight size={16} className={muted} />
                  </button>
                ))}
              </div>

              {topics.length === 0 && (
                <div className={`mt-4 rounded-lg border border-dashed ${isDark ? "border-white/10 text-slate-300" : "border-gray-300 text-gray-600"} p-6 text-center`}>
                  No topics are available for this category.
                </div>
              )}

              {selectedTopicId && (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className={`mb-2 text-sm font-medium ${heading}`}>Total time</p>
                    <div className="flex flex-wrap gap-2">
                      {TIME_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setDuration(option)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            duration === option
                              ? "border-[#16a34a] bg-[#16a34a] text-white"
                              : isDark
                                ? "border-white/10 text-slate-200 hover:border-[#16a34a]"
                                : "border-gray-300 text-gray-700 hover:border-[#16a34a] hover:text-[#16a34a]"
                          }`}
                        >
                          {option} mins
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartExam}
                    disabled={isFetchingQuestions}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#22c55e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Clock3 size={16} />
                    {isFetchingQuestions ? "Loading Questions..." : "Start Exam"}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}

          {examStarted && currentQuestion && (
            <div className={`rounded-xl ${panel} p-5`}>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${muted}`}>Question {currentIndex + 1} / {questions.length}</p>
                  <h2 className={`mt-1 text-lg font-semibold ${heading}`}>Topic: {topicSelected?.name}</h2>
                </div>

                <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${isDark ? "border-white/10 bg-black/10 text-white" : "border-gray-200 bg-gray-50 text-gray-900"}`}>
                  Time left: {formatTime(timeLeft)}
                </div>
              </div>

              <div className={`mb-6 h-2 rounded-full ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                <div
                  className="h-2 rounded-full bg-[#16a34a] transition-all"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              <div className="space-y-4">
                <p className={`text-lg font-medium leading-relaxed ${heading}`}>{currentQuestion.question}</p>

                <div className="space-y-3">
                  {[currentQuestion.option_a, currentQuestion.option_b, currentQuestion.option_c, currentQuestion.option_d].map((option, index) => {
                    if (!option) return null;
                    const isSelected = answers[currentQuestion.id] === index;
                    const optionClass = isSelected
                      ? "border-[#16a34a] bg-[#16a34a]/10 text-[#16a34a]"
                      : isDark
                        ? "border-white/10 bg-white/5 text-white hover:border-[#16a34a] hover:bg-white/10"
                        : "border-gray-200 bg-white text-gray-900 hover:border-[#16a34a]";

                    return (
                      <button
                        key={`${currentQuestion.id}-${index}`}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion.id, index)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${optionClass}`}
                      >
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                          {optionLabels[index]}
                        </span>
                        <span className="leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((value) => Math.max(value - 1, 0))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#16a34a] px-4 py-2 text-sm font-medium text-[#16a34a] transition hover:bg-[#16a34a]/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex === questions.length - 1) {
                      finishExam();
                      return;
                    }
                    setCurrentIndex((value) => value + 1);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#22c55e]"
                >
                  {currentIndex === questions.length - 1 ? "Finish Exam" : "Next"}
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      index === currentIndex
                        ? "border-[#16a34a] bg-[#16a34a] text-white"
                        : answers[question.id] !== undefined
                          ? isDark
                            ? "border-green-500/50 bg-green-500/10 text-green-300"
                            : "border-green-500/50 bg-green-500/10 text-green-700"
                          : isDark
                            ? "border-white/10 bg-white/5 text-slate-300"
                            : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {examFinished && (
            <div className={`rounded-xl ${panel} p-5`}>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Exam Complete</p>
                  <h2 className={`mt-1 text-2xl font-bold ${heading}`}>Results</h2>
                </div>

                <div className="rounded-xl bg-[#16a34a] px-4 py-3 text-white">
                  <div className="text-3xl font-bold">{percentage}%</div>
                  <div className="text-xs uppercase tracking-wide opacity-80">Score</div>
                </div>
              </div>

              <div className={`mb-6 rounded-xl ${softPanel} p-4`}>
                <p className={`text-sm ${body}`}>
                  You scored <span className="font-bold text-[#16a34a]">{score}</span> out of <span className="font-bold ${heading}">{questions.length}</span> questions.
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => {
                  const selectedIndex = answers[question.id];
                  const correctIndex = question.correct_option ?? 0;
                  const isCorrect = selectedIndex === correctIndex;

                  return (
                    <div key={question.id} className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-black/10" : "border-gray-200 bg-white"}`}>
                      <p className={`text-sm font-semibold ${heading}`}>
                        Question {index + 1}: {question.question}
                      </p>

                      <div className="mt-3 space-y-2">
                        {[question.option_a, question.option_b, question.option_c, question.option_d].map((option, optionIndex) => {
                          if (!option) return null;
                          const active = optionIndex === correctIndex || optionIndex === selectedIndex;
                          const activeClass = optionIndex === correctIndex
                            ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
                            : optionIndex === selectedIndex
                              ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
                              : isDark
                                ? "border-white/10 bg-white/5 text-slate-300"
                                : "border-gray-200 bg-gray-50 text-gray-600";

                          if (!active && !isCorrect && selectedIndex === undefined) {
                            return null;
                          }

                          return (
                            <div key={`${question.id}-${optionIndex}`} className={`rounded-lg border px-3 py-2 text-sm ${activeClass}`}>
                              <span className="mr-2 font-semibold">{optionLabels[optionIndex]}.</span>
                              {option}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 space-y-1 text-sm">
                        <p className={isCorrect ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}>
                          {isCorrect ? "Correct" : `Your answer: ${selectedIndex !== undefined ? optionLabels[selectedIndex] : "No selection"}`}
                        </p>
                        <p className={`text-${isDark ? "slate-300" : "gray-600"}`}>
                          Correct answer: {optionLabels[correctIndex]}.
                        </p>
                        {question.explanation && (
                          <p className={`text-sm ${body}`}>
                            <span className={`font-semibold ${heading}`}>Explanation:</span> {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/cbt/${subjectId}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#16a34a] bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22c55e]"
                >
                  <ArrowLeft size={16} />
                  Back to Categories
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExamFinished(false);
                    setExamStarted(false);
                    setQuestions([]);
                    setAnswers({});
                    setCurrentIndex(0);
                    setSelectedTopicId(topicSelected?.id ?? null);
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${isDark ? "border-white/10 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  Retake Exam
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
