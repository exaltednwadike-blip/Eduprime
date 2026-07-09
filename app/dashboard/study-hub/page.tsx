"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Check,
  Loader2,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../layout";

type Subject = { id: string; name: string; description: string | null };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type FlashCard = {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function StudyHubPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questionsByTopic, setQuestionsByTopic] = useState<Record<string, number>>({});
  const [correctByTopic, setCorrectByTopic] = useState<Record<string, Set<string>>>({});

  const [search, setSearch] = useState("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // --- Flashcard session state ---
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeSubjectName, setActiveSubjectName] = useState("");
  const [queue, setQueue] = useState<FlashCard[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [gotItCount, setGotItCount] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [totalInSession, setTotalInSession] = useState(0);
  const [loadingCards, setLoadingCards] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);

      const [{ data: subjectData }, { data: categoryData }, { data: topicData }, { data: questionData }, { data: attemptsData }] =
        await Promise.all([
          supabase.from("subjects").select("id, name, description"),
          supabase.from("categories").select("id, subject_id, name"),
          supabase.from("topics").select("id, category_id, name"),
          supabase.from("questions").select("id, topic_id"),
          supabase.from("question_attempts").select("question_id, correct").eq("user_id", user.id),
        ]);

      setSubjects(subjectData || []);
      setCategories(categoryData || []);
      setTopics(topicData || []);

      const questionToTopic: Record<string, string> = {};
      const countsByTopic: Record<string, number> = {};
      (questionData || []).forEach((q: any) => {
        questionToTopic[q.id] = q.topic_id;
        countsByTopic[q.topic_id] = (countsByTopic[q.topic_id] || 0) + 1;
      });
      setQuestionsByTopic(countsByTopic);

      const correctSets: Record<string, Set<string>> = {};
      (attemptsData || []).forEach((a: any) => {
        if (!a.correct) return;
        const topicId = questionToTopic[a.question_id];
        if (!topicId) return;
        if (!correctSets[topicId]) correctSets[topicId] = new Set();
        correctSets[topicId].add(a.question_id);
      });
      setCorrectByTopic(correctSets);

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const categoriesFor = (subjectId: string) => categories.filter((c) => c.subject_id === subjectId);
  const topicsFor = (categoryId: string) => topics.filter((t) => t.category_id === categoryId);

  const topicProgress = (topicId: string) => {
    const total = questionsByTopic[topicId] || 0;
    const correct = correctByTopic[topicId]?.size || 0;
    return total > 0 ? Math.min(100, Math.round((correct / total) * 100)) : 0;
  };

  // Search matches subject, category, or topic name; matching topics auto-expand their parents
  const searchLower = search.trim().toLowerCase();
  const filteredData = useMemo(() => {
    if (!searchLower) return { subjects, categories, topics };

    const matchTopics = topics.filter((t) => t.name.toLowerCase().includes(searchLower));
    const matchCategoriesDirect = categories.filter((c) => c.name.toLowerCase().includes(searchLower));
    const matchSubjectsDirect = subjects.filter((s) => s.name.toLowerCase().includes(searchLower));

    const catIdsFromTopics = new Set(matchTopics.map((t) => t.category_id));
    const relevantCategories = categories.filter(
      (c) => catIdsFromTopics.has(c.id) || matchCategoriesDirect.some((mc) => mc.id === c.id)
    );

    const subjIdsFromCats = new Set(relevantCategories.map((c) => c.subject_id));
    const relevantSubjects = subjects.filter(
      (s) => subjIdsFromCats.has(s.id) || matchSubjectsDirect.some((ms) => ms.id === s.id)
    );

    // If a subject/category matched directly (not via a topic), show all its children
    const relevantTopics =
      matchTopics.length > 0 || matchCategoriesDirect.length === 0
        ? topics.filter(
            (t) =>
              matchTopics.some((mt) => mt.id === t.id) ||
              matchCategoriesDirect.some((mc) => mc.id === t.category_id)
          )
        : topics.filter((t) => relevantCategories.some((c) => c.id === t.category_id));

    return { subjects: relevantSubjects, categories: relevantCategories, topics: relevantTopics };
  }, [searchLower, subjects, categories, topics]);

  useEffect(() => {
    if (!searchLower) return;
    // Auto-expand the first matching subject/category so results are visible immediately
    if (filteredData.subjects.length > 0) setExpandedSubject(filteredData.subjects[0].id);
    if (filteredData.categories.length > 0) setExpandedCategory(filteredData.categories[0].id);
  }, [searchLower, filteredData]);

  const startFlashcards = async (subject: Subject, topic: Topic) => {
    setLoadingCards(true);
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, answer, explanation")
      .eq("topic_id", topic.id);

    setLoadingCards(false);

    if (error || !data || data.length === 0) {
      return;
    }

    setActiveTopic(topic);
    setActiveSubjectName(subject.name);
    setQueue(shuffle(data));
    setTotalInSession(data.length);
    setGotItCount(0);
    setRepeatCount(0);
    setFlipped(false);
    setSessionDone(false);
  };

  const logAttempt = async (questionId: string, correct: boolean, subjectId: string) => {
    if (!user) return;
    await supabase.from("question_attempts").insert({
      user_id: user.id,
      question_id: questionId,
      subject_id: subjectId,
      correct,
    });
  };

  const findSubjectIdForTopic = (topic: Topic) => {
    const category = categories.find((c) => c.id === topic.category_id);
    return category?.subject_id || null;
  };

  const handleGotIt = async () => {
    if (!activeTopic || queue.length === 0) return;
    const card = queue[0];
    const subjectId = findSubjectIdForTopic(activeTopic);
    if (subjectId) logAttempt(card.id, true, subjectId);

    const nextQueue = queue.slice(1);
    setGotItCount((c) => c + 1);
    setFlipped(false);

    if (nextQueue.length === 0) {
      await finishSession();
    } else {
      setQueue(nextQueue);
    }
  };

  const handleRepeat = async () => {
    if (!activeTopic || queue.length === 0) return;
    const card = queue[0];
    const subjectId = findSubjectIdForTopic(activeTopic);
    if (subjectId) logAttempt(card.id, false, subjectId);

    // send this card to the back of the queue so it comes up again this session
    const nextQueue = [...queue.slice(1), card];
    setRepeatCount((c) => c + 1);
    setFlipped(false);

    // avoid an infinite loop if only one card remains and keeps getting repeated —
    // still let the user keep reviewing it, they can exit whenever they choose
    setQueue(nextQueue);
  };

  const finishSession = async () => {
    setSessionDone(true);
    if (!user || !activeTopic) return;

    await supabase.from("user_activity").insert({
      user_id: user.id,
      type: "study",
      title: `Studied ${activeSubjectName}`,
      description: `${activeTopic.name} — ${totalInSession} cards reviewed`,
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: goalRow } = await supabase
      .from("daily_goals")
      .select("id, completed")
      .eq("user_id", user.id)
      .eq("goal_date", todayStr)
      .maybeSingle();

    if (goalRow) {
      await supabase
        .from("daily_goals")
        .update({ completed: goalRow.completed + totalInSession })
        .eq("id", goalRow.id);
    } else {
      await supabase.from("daily_goals").insert({
        user_id: user.id,
        goal_date: todayStr,
        target: 25,
        completed: totalInSession,
      });
    }
  };

  const exitSession = () => {
    setActiveTopic(null);
    setQueue([]);
    setFlipped(false);
    setSessionDone(false);
  };

  // ---- theme tokens ----
  const cardBg = isDark ? "bg-[#0d2417] border border-white/5" : "bg-white border border-gray-200";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const heading = isDark ? "text-white" : "text-gray-900";
  const trackBg = isDark ? "bg-white/10" : "bg-gray-200";
  const hoverRow = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const inputBg = isDark ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500" : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400";

  // ===================== FLASHCARD SESSION VIEW =====================
  if (activeTopic) {
    const currentCard = queue[0];

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <button
          onClick={exitSession}
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${muted} hover:${heading}`}
        >
          <ArrowLeft size={15} /> Back to Study Hub
        </button>

        <div>
          <h1 className={`text-lg font-semibold sm:text-xl ${heading}`}>{activeTopic.name}</h1>
          <p className={`text-xs sm:text-sm ${muted}`}>{activeSubjectName}</p>
        </div>

        {loadingCards ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-[#16a34a]" />
          </div>
        ) : sessionDone ? (
          <div className={`rounded-xl ${cardBg} p-6 text-center sm:p-8`}>
            <Check className="mx-auto h-10 w-10 text-[#22c55e]" />
            <h2 className={`mt-3 text-lg font-semibold ${heading}`}>Session complete!</h2>
            <p className={`mt-1 text-sm ${muted}`}>
              {gotItCount} marked as got it · {repeatCount} repeated
            </p>
            <div className="mt-5 flex justify-center gap-2.5">
              <button
                onClick={exitSession}
                className="rounded-full bg-[#16a34a] px-5 py-2 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
              >
                Back to Study Hub
              </button>
            </div>
          </div>
        ) : currentCard ? (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className={muted}>
                {gotItCount} / {totalInSession} mastered
              </span>
              <span className={muted}>{queue.length} left this session</span>
            </div>
            <div className={`h-1.5 overflow-hidden rounded-full ${trackBg}`}>
              <div
                className="h-full rounded-full bg-[#16a34a] transition-all"
                style={{ width: `${(gotItCount / totalInSession) * 100}%` }}
              />
            </div>

            {/* Flip card */}
            <button
              onClick={() => setFlipped((f) => !f)}
              className={`w-full rounded-2xl ${cardBg} p-6 text-left transition sm:p-8 min-h-[220px] flex flex-col justify-center`}
            >
              {!flipped ? (
                <>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#22c55e]">Question</p>
                  <p className={`text-base font-medium sm:text-lg ${heading}`}>{currentCard.question}</p>
                  <p className={`mt-5 text-xs ${muted}`}>Tap card to reveal answer</p>
                </>
              ) : (
                <>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#22c55e]">Answer</p>
                  <p className={`text-base font-medium sm:text-lg ${heading}`}>{currentCard.answer}</p>
                  {currentCard.explanation && (
                    <p className={`mt-3 text-sm ${muted}`}>{currentCard.explanation}</p>
                  )}
                </>
              )}
            </button>

            {/* Actions */}
            {flipped && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRepeat}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/20"
                >
                  <RotateCcw size={16} /> Repeat
                </button>
                <button
                  onClick={handleGotIt}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#16a34a] px-4 py-3 text-sm font-semibold text-[#052e16] transition hover:bg-[#22c55e]"
                >
                  <Check size={16} /> Got it
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  // ===================== BROWSE VIEW =====================
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#16a34a]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className={`text-lg font-semibold sm:text-xl ${heading}`}>Study Hub</h1>
        <p className={`mt-1 text-xs sm:text-sm ${muted}`}>
          Search or browse a topic, then study it as flashcards.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects, categories, or topics..."
          className={`w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm ${inputBg} focus:outline-none focus:ring-2 focus:ring-[#16a34a]`}
        />
      </div>

      {filteredData.subjects.length === 0 && (
        <div className={`rounded-lg ${cardBg} p-5 text-center text-sm ${muted}`}>
          {searchLower ? "No matches found." : "No subjects have been added yet."}
        </div>
      )}

      <div className="space-y-2">
        {filteredData.subjects.map((subject) => {
          const isOpen = expandedSubject === subject.id;
          const subjectCats = filteredData.categories.filter((c) => c.subject_id === subject.id);

          return (
            <div key={subject.id} className={`overflow-hidden rounded-lg ${cardBg}`}>
              <button
                onClick={() => setExpandedSubject(isOpen ? null : subject.id)}
                className={`flex w-full items-center justify-between gap-2 p-3 text-left sm:p-4 ${hoverRow}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isOpen ? <ChevronDown size={16} className="flex-shrink-0 text-[#22c55e]" /> : <ChevronRight size={16} className="flex-shrink-0 text-[#22c55e]" />}
                  <h2 className={`truncate text-sm font-semibold sm:text-base ${heading}`}>{subject.name}</h2>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/5 p-2.5 sm:p-4">
                  {subjectCats.length === 0 && (
                    <p className={`text-xs sm:text-sm ${muted}`}>No categories match.</p>
                  )}
                  <div className="space-y-1.5">
                    {subjectCats.map((category) => {
                      const catOpen = expandedCategory === category.id;
                      const catTopics = filteredData.topics.filter((t) => t.category_id === category.id);

                      return (
                        <div key={category.id} className={`overflow-hidden rounded-md ${isDark ? "bg-black/20" : "bg-gray-50"}`}>
                          <button
                            onClick={() => setExpandedCategory(catOpen ? null : category.id)}
                            className={`flex w-full items-center gap-2 p-2.5 text-left text-xs font-medium sm:text-sm ${heading}`}
                          >
                            {catOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            {category.name}
                          </button>

                          {catOpen && (
                            <div className="space-y-1 px-2.5 pb-2.5">
                              {catTopics.length === 0 && <p className={`text-[11px] ${muted}`}>No topics match.</p>}
                              {catTopics.map((topic) => {
                                const count = questionsByTopic[topic.id] || 0;
                                const tPct = topicProgress(topic.id);
                                return (
                                  <div
                                    key={topic.id}
                                    className={`flex flex-col gap-2 rounded-md p-2.5 sm:flex-row sm:items-center sm:justify-between ${isDark ? "bg-white/5" : "bg-white"}`}
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      <Layers size={13} className={`flex-shrink-0 ${muted}`} />
                                      <div className="min-w-0">
                                        <p className={`truncate text-xs font-medium sm:text-sm ${heading}`}>{topic.name}</p>
                                        <p className={`text-[11px] ${muted}`}>
                                          {count} card{count !== 1 ? "s" : ""} · {tPct}% mastered
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => startFlashcards(subject, topic)}
                                      disabled={count === 0 || loadingCards}
                                      className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#16a34a] px-3 py-1.5 text-[11px] font-semibold text-[#052e16] transition hover:bg-[#22c55e] disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto sm:text-xs"
                                    >
                                      <Layers size={12} />
                                      Study
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}