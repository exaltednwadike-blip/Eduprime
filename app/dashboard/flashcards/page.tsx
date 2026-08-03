"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";
import { BookOpen, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type Flashcard = {
  id: string;
  front: string;
  back: string;
  explanation: string | null;
};

export default function FlashcardsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  const card = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const cardText = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const filterBtn = (active: boolean) =>
    active
      ? "bg-[#16a34a] text-white border-transparent"
      : isDark
      ? "border-white/20 text-slate-300 hover:border-[#16a34a] hover:text-white"
      : "border-gray-300 text-gray-600 hover:border-[#16a34a] hover:text-[#16a34a]";

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) router.push("/onboarding");
  }, [router]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      const { data } = await supabase.from("subjects").select("id, name").order("name");
      setSubjects(data || []);
      setLoadingSubjects(false);
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    const fetch = async () => {
      setLoadingCategories(true);
      setCategories([]);
      setTopics([]);
      setSelectedCategory(null);
      setSelectedTopic(null);
      setFlashcards([]);
      const { data } = await supabase
        .from("categories")
        .select("id, subject_id, name")
        .eq("subject_id", selectedSubject.id)
        .order("name");
      setCategories(data || []);
      setLoadingCategories(false);
    };
    fetch();
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedCategory) return;
    const fetch = async () => {
      setLoadingTopics(true);
      setTopics([]);
      setSelectedTopic(null);
      setFlashcards([]);
      const { data } = await supabase
        .from("topics")
        .select("id, category_id, name")
        .eq("category_id", selectedCategory.id)
        .order("name");
      setTopics(data || []);
      setLoadingTopics(false);
    };
    fetch();
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedTopic) return;
    const fetch = async () => {
      setLoadingCards(true);
      setFlashcards([]);
      setCurrentIndex(0);
      setRevealed(false);
      const { data } = await supabase
        .from("flashcards")
        .select("id, front, back, explanation")
        .eq("topic_id", selectedTopic.id)
        .order("created_at");
      setFlashcards(data || []);
      setLoadingCards(false);
    };
    fetch();
  }, [selectedTopic]);

  const currentCard = flashcards[currentIndex];

  const goNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRevealed(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setRevealed(false);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setRevealed(false);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">

      {/* Header */}
      <div className={`rounded-xl ${card} p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16a34a]/20">
            <BookOpen size={20} className="text-[#16a34a]" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${cardText}`}>Flashcards</h1>
            <p className={`text-xs ${muted}`}>Select a topic to start reviewing</p>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className={`rounded-xl ${card} p-4`}>
        <p className={`text-xs font-medium uppercase tracking-wide ${muted} mb-3`}>Select Subject</p>
        {loadingSubjects ? (
          <p className={`text-sm ${muted}`}>Loading...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${filterBtn(selectedSubject?.id === s.id)}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      {selectedSubject && (
        <div className={`rounded-xl ${card} p-4`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${muted} mb-3`}>Select Category</p>
          {loadingCategories ? (
            <p className={`text-sm ${muted}`}>Loading...</p>
          ) : categories.length === 0 ? (
            <p className={`text-sm ${muted}`}>No categories found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${filterBtn(selectedCategory?.id === c.id)}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Topic */}
      {selectedCategory && (
        <div className={`rounded-xl ${card} p-4`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${muted} mb-3`}>Select Topic</p>
          {loadingTopics ? (
            <p className={`text-sm ${muted}`}>Loading...</p>
          ) : topics.length === 0 ? (
            <p className={`text-sm ${muted}`}>No topics found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${filterBtn(selectedTopic?.id === t.id)}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flashcard display */}
      {selectedTopic && (
        <>
          {loadingCards ? (
            <div className={`rounded-xl ${card} p-8 text-center`}>
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent mx-auto" />
              <p className={`mt-3 text-sm ${muted}`}>Loading flashcards...</p>
            </div>
          ) : flashcards.length === 0 ? (
            <div className={`rounded-xl ${card} p-8 text-center`}>
              <p className={`text-sm ${muted}`}>No flashcards found for this topic yet.</p>
            </div>
          ) : currentIndex >= flashcards.length ? (
            <div className={`rounded-xl ${card} p-8 text-center`}>
              <p className={`text-lg font-bold ${cardText} mb-2`}>All done!</p>
              <p className={`text-sm ${muted} mb-4`}>You have reviewed all {flashcards.length} flashcards.</p>
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#22c55e] transition"
              >
                <RotateCcw size={16} /> Start Over
              </button>
            </div>
          ) : (
            <div className={`rounded-xl ${card} p-5`}>

              {/* Progress */}
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-medium ${muted}`}>
                  Card {currentIndex + 1} of {flashcards.length}
                </p>
                <button
                  onClick={restart}
                  className={`inline-flex items-center gap-1 text-xs ${muted} hover:text-[#16a34a] transition`}
                >
                  <RotateCcw size={12} /> Restart
                </button>
              </div>

              {/* Progress bar */}
              <div className={`mb-5 h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                <div
                  className="h-1.5 rounded-full bg-[#16a34a] transition-all"
                  style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>

              {/* Front */}
              <div className={`rounded-xl p-5 mb-4 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={`text-xs font-medium uppercase tracking-wide text-[#16a34a] mb-2`}>Question</p>
                <p className={`text-base font-semibold ${cardText} leading-relaxed`}>{currentCard.front}</p>
              </div>

              {/* Reveal button */}
              {!revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full rounded-xl border-2 border-dashed border-[#16a34a]/40 py-4 text-sm font-medium text-[#16a34a] hover:border-[#16a34a] hover:bg-[#16a34a]/5 transition"
                >
                  Click to reveal answer
                </button>
              )}

              {/* Back + Explanation */}
              {revealed && (
                <div className={`rounded-xl p-5 mb-4 border ${
                  isDark ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"
                }`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-green-400 mb-2">Answer</p>
                  <p className={`text-base font-semibold ${cardText} leading-relaxed`}>{currentCard.back}</p>
                  {currentCard.explanation && (
                    <div className={`mt-3 pt-3 border-t ${isDark ? "border-green-500/20" : "border-green-200"}`}>
                      <p className={`text-xs font-medium uppercase tracking-wide ${muted} mb-1`}>Explanation</p>
                      <p className={`text-sm ${muted} leading-relaxed`}>{currentCard.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
                    isDark
                      ? "border-white/20 text-slate-300 hover:bg-white/10"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <span className={`text-xs ${muted}`}>{currentIndex + 1} / {flashcards.length}</span>

                <button
                  onClick={goNext}
                  disabled={currentIndex === flashcards.length - 1}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#22c55e] disabled:opacity-40"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!selectedSubject && (
        <div className={`rounded-xl ${card} p-8 text-center`}>
          <BookOpen size={32} className="mx-auto mb-3 text-[#16a34a] opacity-50" />
          <p className={`text-sm font-medium ${cardText}`}>Select a subject to start reviewing</p>
          <p className={`text-xs ${muted} mt-1`}>Choose from the subjects above</p>
        </div>
      )}
    </div>
  );
}