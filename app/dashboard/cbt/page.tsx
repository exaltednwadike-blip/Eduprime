"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type Question = {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
};

const totalTimes = [10, 20, 30, 45, 60];

export default function CbtPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [stage, setStage] = useState<"setup" | "exam" | "results">("setup");

  // Auth
  const [user, setUser] = useState<any>(null);

  // Setup state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedTime, setSelectedTime] = useState(20);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);

  // Exam state
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  // Persistence guard
  const [resultsSaved, setResultsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // URL-based prefill (from Study Hub "Practice" button: /dashboard/cbt?subject=xxx&topic=yyy)
  const [urlPrefillTopicId, setUrlPrefillTopicId] = useState<string | null>(null);

  // Check onboarding
  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) router.push("/onboarding");
  }, [router]);

  // Fetch current user
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  // Pick up subject/topic params from the URL once, on mount
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    const subjectParam = searchParams.get("subject");
    if (topicParam && subjectParam) {
      setUrlPrefillTopicId(topicParam);
    }
  }, [searchParams]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSetup(true);
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");
      if (error) {
        showToast({ type: "error", title: "Error", message: "Failed to load subjects." });
      } else {
        setSubjects(data || []);
      }
      setLoadingSetup(false);
    };
    fetchSubjects();
  }, []);

  // Auto-select subject from URL once subjects have loaded
  useEffect(() => {
    if (!urlPrefillTopicId || subjects.length === 0 || selectedSubject) return;
    const subjectParam = searchParams.get("subject");
    const match = subjects.find((s) => s.id === subjectParam);
    if (match) setSelectedSubject(match);
  }, [subjects, urlPrefillTopicId, searchParams, selectedSubject]);

  // Fetch categories when subject selected
  useEffect(() => {
    if (!selectedSubject) return;
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setCategories([]);
      setTopics([]);
      setSelectedCategory(null);
      setSelectedTopic(null);
      const { data, error } = await supabase
        .from("categories")
        .select("id, subject_id, name")
        .eq("subject_id", selectedSubject.id)
        .order("name");
      if (error) {
        showToast({ type: "error", title: "Error", message: "Failed to load categories." });
      } else {
        setCategories(data || []);
      }
      setLoadingCategories(false);
    };
    fetchCategories();
  }, [selectedSubject]);

  // Once categories load, find the one containing our target topic (from URL)
  useEffect(() => {
    if (!urlPrefillTopicId || categories.length === 0 || selectedCategory) return;
    (async () => {
      const { data: topicRow } = await supabase
        .from("topics")
        .select("id, category_id")
        .eq("id", urlPrefillTopicId)
        .maybeSingle();
      if (!topicRow) return;
      const match = categories.find((c) => c.id === topicRow.category_id);
      if (match) setSelectedCategory(match);
    })();
  }, [categories, urlPrefillTopicId, selectedCategory]);

  // Fetch topics when category selected
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchTopics = async () => {
      setLoadingTopics(true);
      setTopics([]);
      setSelectedTopic(null);
      const { data, error } = await supabase
        .from("topics")
        .select("id, category_id, name")
        .eq("category_id", selectedCategory.id)
        .order("name");
      if (error) {
        showToast({ type: "error", title: "Error", message: "Failed to load topics." });
      } else {
        setTopics(data || []);
      }
      setLoadingTopics(false);
    };
    fetchTopics();
  }, [selectedCategory]);

  // Once topics load, select the exact one from the URL and clear the prefill flag
  useEffect(() => {
    if (!urlPrefillTopicId || topics.length === 0 || selectedTopic) return;
    const match = topics.find((t) => t.id === urlPrefillTopicId);
    if (match) {
      setSelectedTopic(match);
      setUrlPrefillTopicId(null);
    }
  }, [topics, urlPrefillTopicId, selectedTopic]);

  // Countdown timer
  useEffect(() => {
    if (stage !== "exam") return;
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
    if (!selectedTopic) {
      showToast({ type: "warning", title: "Select a topic", message: "Please select a subject, category and topic first." });
      return;
    }

    setLoadingExam(true);
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, answer, explanation, option_a, option_b, option_c, option_d, correct_option")
      .eq("topic_id", selectedTopic.id)
      .eq("type", "mcq");

    setLoadingExam(false);

    if (error) {
      showToast({ type: "error", title: "Failed to load", message: "Unable to load questions. Please try again." });
      return;
    }

    if (!data || data.length === 0) {
      showToast({ type: "info", title: "No questions", message: "No MCQ questions available for this topic yet." });
      return;
    }

    setExamQuestions(data);
    setAnswers(Array(data.length).fill(null));
    setCurrentIndex(0);
    setSelectedChoice(null);
    setTimeLeft(selectedTime * 60);
    setResultsSaved(false);
    setStage("exam");
  };

  const goToNext = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = selectedChoice;
    setAnswers(updatedAnswers);

    if (currentIndex + 1 >= examQuestions.length) {
      setStage("results");
      return;
    }

    setCurrentIndex(currentIndex + 1);
    setSelectedChoice(updatedAnswers[currentIndex + 1] ?? null);
  };

  const goToPrevious = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = selectedChoice;
    setAnswers(updatedAnswers);
    setCurrentIndex(currentIndex - 1);
    setSelectedChoice(updatedAnswers[currentIndex - 1] ?? null);
  };

  const resetExam = () => {
    setStage("setup");
    setExamQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedChoice(null);
    setTimeLeft(0);
    setResultsSaved(false);
  };

  const score = answers.reduce<number>((total, selected, index) => {
    if (selected === null || selected === undefined) return total;
    return examQuestions[index]?.correct_option === selected ? total + 1 : total;
  }, 0);

  const percentage = examQuestions.length
    ? Math.round((score / examQuestions.length) * 100)
    : 0;

  const resultMessage =
    percentage >= 80
      ? "Excellent!"
      : percentage >= 60
      ? "Good effort!"
      : "Keep studying!";

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // --- Persist results to Supabase once the exam finishes ---
  useEffect(() => {
    if (stage !== "results" || resultsSaved || !user || examQuestions.length === 0) return;

    const saveResults = async () => {
      setSaving(true);

      const timeTakenSeconds = selectedTime * 60 - timeLeft;

      const { error: cbtError } = await supabase.from("cbt_results").insert({
        user_id: user.id,
        subject_id: selectedSubject?.id,
        topic_id: selectedTopic?.id,
        score,
        total_questions: examQuestions.length,
        percentage,
        time_taken: timeTakenSeconds,
      });

      const attemptRows = examQuestions
        .map((q, idx) => ({
          user_id: user.id,
          question_id: q.id,
          subject_id: selectedSubject?.id,
          correct: answers[idx] !== null && answers[idx] === q.correct_option,
        }))
        .filter((_, idx) => answers[idx] !== null);

      const { error: attemptsError } =
        attemptRows.length > 0
          ? await supabase.from("question_attempts").insert(attemptRows)
          : { error: null };

      await supabase.from("user_activity").insert({
        user_id: user.id,
        type: "cbt",
        title: `Completed ${selectedSubject?.name || "CBT"}`,
        description: `${selectedTopic?.name || ""} — Score: ${percentage}%`,
      });

      const answeredCount = answers.filter((a) => a !== null).length;
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
          .update({ completed: goalRow.completed + answeredCount })
          .eq("id", goalRow.id);
      } else {
        await supabase.from("daily_goals").insert({
          user_id: user.id,
          goal_date: todayStr,
          target: 25,
          completed: answeredCount,
        });
      }

      if (cbtError || attemptsError) {
        showToast({
          type: "error",
          title: "Save issue",
          message: "Your results are shown, but may not have saved fully to your history.",
        });
      }

      setResultsSaved(true);
      setSaving(false);
    };

    saveResults();
  }, [stage, resultsSaved, user, examQuestions, answers, score, percentage, selectedSubject, selectedTopic, selectedTime, timeLeft, showToast]);

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">

        {/* SETUP SCREEN */}
        {stage === "setup" && (
          <section>
            <h1 className="text-xl font-semibold sm:text-3xl">CBT Simulator</h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Select your subject, category and topic, set your total exam time, then start.
            </p>

            <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">

              {/* Subject */}
              <div>
                <p className="mb-2.5 text-xs font-medium text-slate-400 sm:mb-3 sm:text-sm">Select Subject</p>
                {loadingSetup ? (
                  <p className="text-sm text-slate-400">Loading subjects...</p>
                ) : (
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
                          selectedSubject?.id === subject.id
                            ? "border-transparent bg-[#1a5c2a] text-white"
                            : "border-white/20 text-slate-300 hover:border-[#1a5c2a]"
                        }`}
                      >
                        {subject.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              {selectedSubject && (
                <div>
                  <p className="mb-2.5 text-xs font-medium text-slate-400 sm:mb-3 sm:text-sm">Select Category</p>
                  {loadingCategories ? (
                    <p className="text-sm text-slate-400">Loading categories...</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-slate-400">No categories found for this subject.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
                            selectedCategory?.id === category.id
                              ? "border-transparent bg-[#1a5c2a] text-white"
                              : "border-white/20 text-slate-300 hover:border-[#1a5c2a]"
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Topic */}
              {selectedCategory && (
                <div>
                  <p className="mb-2.5 text-xs font-medium text-slate-400 sm:mb-3 sm:text-sm">Select Topic</p>
                  {loadingTopics ? (
                    <p className="text-sm text-slate-400">Loading topics...</p>
                  ) : topics.length === 0 ? (
                    <p className="text-sm text-slate-400">No topics found for this category.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
                            selectedTopic?.id === topic.id
                              ? "border-transparent bg-[#2db54a] text-white"
                              : "border-white/20 text-slate-300 hover:border-[#2db54a]"
                          }`}
                        >
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Total Exam Time */}
              {selectedTopic && (
                <>
                  <div>
                    <p className="mb-2.5 text-xs font-medium text-slate-400 sm:mb-3 sm:text-sm">Total Exam Time</p>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {totalTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
                            selectedTime === time
                              ? "border-transparent bg-[#1a5c2a] text-white"
                              : "border-white/20 text-slate-300 hover:border-[#1a5c2a]"
                          }`}
                        >
                          {time} mins
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startExam}
                    disabled={loadingExam}
                    className="rounded-full bg-[#1a5c2a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2db54a] disabled:opacity-60 sm:px-8 sm:py-3 sm:text-base"
                  >
                    {loadingExam ? "Loading questions..." : "Start Exam"}
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* EXAM SCREEN */}
        {stage === "exam" && examQuestions[currentIndex] && (
          <section>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold sm:text-2xl">Exam in Progress</h1>
                <p className="truncate text-xs text-slate-400 sm:text-sm">
                  {selectedSubject?.name} — {selectedTopic?.name}
                </p>
              </div>
              <div className={`flex-shrink-0 rounded-xl px-3 py-2 text-base font-bold sm:rounded-2xl sm:px-5 sm:py-3 sm:text-xl ${
                timeLeft < 60
                  ? "bg-red-500/20 text-red-400"
                  : "bg-[#1a5c2a]/30 text-[#2db54a]"
              }`}>
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-1.5 w-full rounded-full bg-white/10 sm:mb-6 sm:h-2">
              <div
                className="h-full rounded-full bg-[#2db54a] transition-all"
                style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6">
              <p className="text-xs text-[#2db54a] uppercase tracking-widest mb-1 sm:text-sm">
                Question {currentIndex + 1} of {examQuestions.length}
              </p>
              <h2 className="text-base font-semibold text-white mt-3 sm:text-xl">
                {examQuestions[currentIndex].question}
              </h2>

              {/* Options */}
              <div className="mt-5 grid gap-2.5 sm:mt-6 sm:gap-3">
                {[
                  examQuestions[currentIndex].option_a,
                  examQuestions[currentIndex].option_b,
                  examQuestions[currentIndex].option_c,
                  examQuestions[currentIndex].option_d,
                ].map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedChoice(index)}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition sm:rounded-2xl sm:px-4 sm:py-4 ${
                      selectedChoice === index
                        ? "border-[#2db54a] bg-[#1a5c2a]/20 text-white"
                        : "border-white/10 bg-slate-950/80 text-slate-200 hover:border-[#1a5c2a]"
                    }`}
                  >
                    <span className="mr-2 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold sm:mr-3 sm:h-7 sm:w-7">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="mt-6 flex gap-2.5 sm:mt-8 sm:gap-3">
                {currentIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className="rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-[#1a5c2a] hover:text-white sm:px-6 sm:py-3 sm:text-sm"
                  >
                    ← Previous
                  </button>
                )}
                <button
                  onClick={goToNext}
                  className="rounded-full bg-[#1a5c2a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2db54a] sm:px-6 sm:py-3 sm:text-sm"
                >
                  {currentIndex + 1 >= examQuestions.length ? "Finish Exam" : "Next →"}
                </button>
              </div>
            </div>

            {/* Question navigator dots */}
            <div className="mt-5 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
              {examQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const updatedAnswers = [...answers];
                    updatedAnswers[currentIndex] = selectedChoice;
                    setAnswers(updatedAnswers);
                    setCurrentIndex(index);
                    setSelectedChoice(updatedAnswers[index] ?? null);
                  }}
                  className={`h-7 w-7 rounded-full text-[11px] font-bold transition sm:h-8 sm:w-8 sm:text-xs ${
                    index === currentIndex
                      ? "bg-[#2db54a] text-white"
                      : answers[index] !== null
                      ? "bg-[#1a5c2a] text-white"
                      : "bg-white/10 text-slate-400 hover:bg-white/20"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* RESULTS SCREEN */}
        {stage === "results" && (
          <section>
            <h1 className="text-xl font-semibold sm:text-3xl">Exam Results</h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              {selectedSubject?.name} — {selectedTopic?.name}
              {saving && <span className="ml-2 text-xs text-[#2db54a]">Saving...</span>}
            </p>

            {/* Score card */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-center sm:mt-8 sm:rounded-3xl sm:p-8">
              <p className="text-5xl font-bold text-[#2db54a] sm:text-7xl">{percentage}%</p>
              <p className="mt-3 text-base text-white sm:text-xl">
                You scored {score} out of {examQuestions.length}
              </p>
              <p className="mt-2 text-sm text-slate-300 sm:text-lg">{resultMessage}</p>
            </div>

            {/* Question review */}
            <div className="mt-8 space-y-3 sm:mt-10 sm:space-y-4">
              <h2 className="text-lg font-semibold sm:text-xl">Question Review</h2>
              {examQuestions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correct_option;
                const options = [
                  question.option_a,
                  question.option_b,
                  question.option_c,
                  question.option_d,
                ];
                return (
                  <div
                    key={question.id}
                    className={`rounded-xl border p-3.5 sm:rounded-2xl sm:p-5 ${
                      isCorrect
                        ? "border-green-500/30 bg-green-500/10"
                        : "border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white sm:text-base">
                      {index + 1}. {question.question}
                    </p>
                    <p className="mt-2 text-xs sm:text-sm">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                        {userAnswer !== null
                          ? `${String.fromCharCode(65 + userAnswer)}. ${options[userAnswer]}`
                          : "Not answered"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="mt-1 text-xs text-green-400 sm:text-sm">
                        Correct answer: {String.fromCharCode(65 + question.correct_option)}. {options[question.correct_option]}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                        <span className="font-medium text-slate-300">Explanation:</span>{" "}
                        {question.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetExam}
              className="mt-6 rounded-full bg-[#1a5c2a] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2db54a] sm:mt-8 sm:px-8 sm:py-3 sm:text-base"
            >
              Try Again
            </button>
          </section>
        )}
      </main>
    </div>
  );
}