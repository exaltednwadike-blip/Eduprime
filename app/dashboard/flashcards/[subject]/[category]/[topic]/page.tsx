"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type Flashcard = {
  id: string;
  front: string;
  back: string;
  explanation: string | null;
  topic_id: string;
};

export default function FlashcardsTopicPage() {
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
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  const panel = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const heading = isDark ? "text-white" : "text-gray-900";
  const body = isDark ? "text-slate-300" : "text-gray-600";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const soft = isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200";
  const badge = isDark ? "bg-[#16a34a]/20 text-[#86efac]" : "bg-[#16a34a]/10 text-[#15803d]";

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) router.push("/onboarding");
  }, [router]);

  useEffect(() => {
    if (!subjectId || !categoryId || !topicId) return;

    let active = true;

    const fetchTopicData = async () => {
      setLoading(true);
      setCurrentIndex(0);
      setRevealed(false);

      const [subjectRes, categoryRes, topicRes, cardsRes] = await Promise.all([
        supabase.from("subjects").select("id, name").eq("id", subjectId).single(),
        supabase.from("categories").select("id, subject_id, name").eq("id", categoryId).single(),
        supabase.from("topics").select("id, category_id, name").eq("id", topicId).single(),
        supabase.from("flashcards").select("id, front, back, explanation, topic_id").eq("topic_id", topicId).order("created_at"),
      ]);

      if (!active) return;

      setSubject((subjectRes.data as Subject | null) ?? null);
      setCategory((categoryRes.data as Category | null) ?? null);
      setTopic((topicRes.data as Topic | null) ?? null);
      setCards((cardsRes.data as Flashcard[]) || []);
      setLoading(false);
    };

    fetchTopicData();

    return () => {
      active = false;
    };
  }, [subjectId, categoryId, topicId]);

  const currentCard = cards[currentIndex] ?? null;
  const progressPercent = cards.length ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const isDone = cards.length > 0 && currentIndex >= cards.length;

  const goPrev = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setRevealed(false);
  };

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((index) => index + 1);
      setRevealed(false);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setRevealed(false);
  };

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
            onClick={() => router.push(`/dashboard/flashcards/${subjectId}/${categoryId}`)}
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
      ) : cards.length === 0 ? (
        <div className={`rounded-xl ${panel} p-8 text-center`}>
          <p className={`text-sm ${body}`}>No flashcards found for this topic yet.</p>
        </div>
      ) : isDone ? (
        <div className={`rounded-xl ${panel} p-8 text-center`}>
          <p className={`text-2xl font-bold ${heading}`}>All done!</p>
          <p className={`mt-2 text-sm ${body}`}>
            You reviewed all {cards.length} flashcards in this topic.
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#22c55e]"
          >
            <RotateCcw size={16} />
            Start Over
          </button>
        </div>
      ) : (
        <div className={`rounded-xl ${panel} p-4 sm:p-6`}>
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className={muted}>Card {currentIndex + 1} of {cards.length}</span>
              <button
                type="button"
                onClick={restart}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${badge}`} 
              >
                <RotateCcw size={12} /> Restart
              </button>
            </div>
            <div className={`h-2 overflow-hidden rounded-full ${soft}`}>
              <div
                className="h-full rounded-full bg-[#16a34a] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className={`rounded-xl border p-4 sm:p-5 ${soft}`}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Front</p>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badge}`}>
                Flashcard
              </span>
            </div>
            <p className={`text-lg font-semibold leading-relaxed ${heading}`}>{currentCard?.front}</p>

            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-6 w-full rounded-xl border-2 border-dashed border-[#16a34a]/50 bg-[#16a34a]/5 px-4 py-3 text-sm font-medium text-[#16a34a] transition hover:border-[#16a34a] hover:bg-[#16a34a]/10"
              >
                Reveal Answer
              </button>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-[#16a34a]/25 bg-[#16a34a]/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#16a34a]">Answer</p>
                  <p className={`mt-2 text-base font-medium leading-relaxed ${heading}`}>{currentCard?.back}</p>
                </div>

                {currentCard?.explanation && (
                  <div className={`rounded-xl border p-4 ${soft}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Explanation</p>
                    <p className={`mt-2 text-sm leading-relaxed ${body}`}>{currentCard.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded-lg border border-[#16a34a] px-4 py-2 text-sm font-medium text-[#16a34a] transition hover:bg-[#16a34a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === cards.length - 1}
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
