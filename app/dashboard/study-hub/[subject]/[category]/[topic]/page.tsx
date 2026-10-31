"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  correct_option: number | string | null;
};

const isMcq = (q: Question) => q.type?.trim().toLowerCase() === "mcq";

const getCorrectIndex = (value: number | string | null): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const v = value.trim().toUpperCase();
  const letters = ["A", "B", "C", "D"];
  if (letters.includes(v)) return letters.indexOf(v);
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

type OptionState = "idle" | "correct" | "wrong" | "dim";

const optionStyles: Record<OptionState, string> = {
  idle: "border-line bg-surface text-fg hover:border-primary hover:bg-primary-soft",
  correct: "border-primary bg-primary-soft text-fg",
  wrong: "border-danger bg-danger-soft text-fg",
  dim: "border-line bg-surface text-muted",
};

const badgeStyles: Record<OptionState, string> = {
  idle: "border border-line bg-canvas text-muted",
  correct: "bg-primary text-on-primary",
  wrong: "bg-danger text-on-danger",
  dim: "border border-line bg-canvas text-muted",
};

const optionLabels = ["A", "B", "C", "D"];

const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40";
const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40";

export default function StudyHubTopicPage() {
  const router = useRouter();
  const params = useParams();

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
      const loadedQuestions = (questionsRes.data as Question[]) || [];
      setQuestions(loadedQuestions);
      const startAt = Number(new URLSearchParams(window.location.search).get("q"));
      setCurrentIndex(Number.isInteger(startAt) && startAt > 0 && startAt < loadedQuestions.length ? startAt : 0);
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
  const isMcqQuestion = currentQuestion ? isMcq(currentQuestion) : false;
  const correctIndex = currentQuestion ? getCorrectIndex(currentQuestion.correct_option) : null;
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  useEffect(() => {
    if (!subject || !topic || questions.length === 0) return;
    if (String(topic.id) !== String(topicId)) return;
    try {
      localStorage.setItem(
        "eduprimeLastStudy",
        JSON.stringify({
          subjectId,
          categoryId,
          topicId,
          subjectName: subject.name,
          topicName: topic.name,
          index: currentIndex,
          total: questions.length,
        })
      );
    } catch {
      // storage can be unavailable (private mode); resuming is only a convenience
    }
  }, [subject, topic, questions.length, currentIndex, subjectId, categoryId, topicId]);

  const isLastQuestion = currentIndex >= questions.length - 1;

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

  const getOptionState = (index: number): OptionState => {
    if (selectedAnswer === null) return "idle";
    if (index === correctIndex) return "correct";
    if (index === selectedAnswer) return "wrong";
    return "dim";
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {subject?.name || "Subject"} / {category?.name || "Category"}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-fg">
            {loading ? "Loading..." : topic?.name || "Topic"}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/dashboard/study-hub/${subjectId}/${categoryId}`)}
          className={`${secondaryButton} flex-shrink-0 self-start`}
        >
          <ArrowLeft size={16} />
          Back to topics
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-1 rounded-full bg-line" />
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <div className="h-5 w-3/4 rounded bg-line" />
            <div className="h-12 rounded-xl bg-raised" />
            <div className="h-12 rounded-xl bg-raised" />
            <div className="h-12 rounded-xl bg-raised" />
            <div className="h-12 rounded-xl bg-raised" />
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">No questions found for this topic yet.</p>
        </div>
      ) : (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-medium text-primary">
                {isMcqQuestion ? "MCQ" : "Theory"}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <p className="text-[17px] font-medium leading-relaxed text-fg sm:text-lg">
              {currentQuestion?.question}
            </p>

            {isMcqQuestion ? (
              <div className="mt-5 space-y-2.5">
                {questionOptions.map((option, index) => {
                  if (!option.value) return null;
                  const state = getOptionState(index);

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleOptionSelect(index)}
                      disabled={selectedAnswer !== null}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-[15px] leading-snug transition disabled:cursor-default ${optionStyles[state]}`}
                    >
                      <span
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${badgeStyles[state]}`}
                      >
                        {state === "correct" ? (
                          <Check size={14} />
                        ) : state === "wrong" ? (
                          <X size={14} />
                        ) : (
                          optionLabels[index]
                        )}
                      </span>
                      <span className="flex-1">{option.value}</span>
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
                    className="w-full rounded-xl border border-dashed border-primary/50 bg-primary-soft px-4 py-3 text-sm font-medium text-primary transition hover:border-primary"
                  >
                    Reveal answer
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-primary/30 bg-primary-soft p-3 sm:p-4">
                      <p className="text-xs font-medium text-primary">Answer</p>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-fg">{currentQuestion?.answer}</p>
                    </div>

                    {currentQuestion?.explanation && (
                      <div className="rounded-xl bg-raised p-3 sm:p-4">
                        <p className="text-xs font-medium text-muted">Explanation</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-fg">{currentQuestion.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isMcqQuestion && selectedAnswer !== null && (
              <div className="mt-4 space-y-3">
                <p
                  className={`text-sm font-medium ${selectedAnswer === correctIndex ? "text-primary" : "text-danger"}`}
                >
                  {selectedAnswer === correctIndex
                    ? "Correct"
                    : `Incorrect. The correct answer is ${optionLabels[correctIndex ?? 0]}.`}
                </p>

                {currentQuestion?.explanation && (
                  <div className="rounded-xl bg-raised p-3 sm:p-4">
                    <p className="text-xs font-medium text-muted">Explanation</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className={secondaryButton}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
              disabled={isLastQuestion}
              className={primaryButton}
            >
              Next question
            </button>
          </div>
        </>
      )}
    </div>
  );
}