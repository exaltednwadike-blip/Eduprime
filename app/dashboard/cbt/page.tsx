"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const { showToast } = useToast();

  const [stage, setStage] = useState<"setup" | "exam" | "results">("setup");

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

  // Check onboarding
  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) router.push("/onboarding");
  }, [router]);

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

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-4xl px-6 py-10 sm:px-8">

        {/* SETUP SCREEN */}
        {stage === "setup" && (
          <section>
            <h1 className="text-3xl font-semibold">CBT Simulator</h1>
            <p className="mt-2 text-slate-400">
              Select your subject, category and topic, set your total exam time, then start.
            </p>

            <div className="mt-8 space-y-8">

              {/* Subject */}
              <div>
                <p className="mb-3 text-sm font-medium text-slate-400">Select Subject</p>
                {loadingSetup ? (
                  <p className="text-sm text-slate-400">Loading subjects...</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
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
                  <p className="mb-3 text-sm font-medium text-slate-400">Select Category</p>
                  {loadingCategories ? (
                    <p className="text-sm text-slate-400">Loading categories...</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-slate-400">No categories found for this subject.</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
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
                  <p className="mb-3 text-sm font-medium text-slate-400">Select Topic</p>
                  {loadingTopics ? (
                    <p className="text-sm text-slate-400">Loading topics...</p>
                  ) : topics.length === 0 ? (
                    <p className="text-sm text-slate-400">No topics found for this category.</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
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
                    <p className="mb-3 text-sm font-medium text-slate-400">Total Exam Time</p>
                    <div className="flex flex-wrap gap-3">
                      {totalTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
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
                    className="rounded-full bg-[#1a5c2a] px-8 py-3 font-semibold text-white transition hover:bg-[#2db54a] disabled:opacity-60"
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
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-semibold">Exam in Progress</h1>
                <p className="text-sm text-slate-400">
                  {selectedSubject?.name} — {selectedTopic?.name}
                </p>
              </div>
              <div className={`rounded-2xl px-5 py-3 text-xl font-bold ${
                timeLeft < 60
                  ? "bg-red-500/20 text-red-400"
                  : "bg-[#1a5c2a]/30 text-[#2db54a]"
              }`}>
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#2db54a] transition-all"
                style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-[#2db54a] uppercase tracking-widest mb-1">
                Question {currentIndex + 1} of {examQuestions.length}
              </p>
              <h2 className="text-xl font-semibold text-white mt-3">
                {examQuestions[currentIndex].question}
              </h2>

              {/* Options */}
              <div className="mt-6 grid gap-3">
                {[
                  examQuestions[currentIndex].option_a,
                  examQuestions[currentIndex].option_b,
                  examQuestions[currentIndex].option_c,
                  examQuestions[currentIndex].option_d,
                ].map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedChoice(index)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left text-sm transition ${
                      selectedChoice === index
                        ? "border-[#2db54a] bg-[#1a5c2a]/20 text-white"
                        : "border-white/10 bg-slate-950/80 text-slate-200 hover:border-[#1a5c2a]"
                    }`}
                  >
                    <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="mt-8 flex gap-3">
                {currentIndex > 0 && (
                  <button
                    onClick={goToPrevious}
                    className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-[#1a5c2a] hover:text-white"
                  >
                    ← Previous
                  </button>
                )}
                <button
                  onClick={goToNext}
                  className="rounded-full bg-[#1a5c2a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2db54a]"
                >
                  {currentIndex + 1 >= examQuestions.length ? "Finish Exam" : "Next →"}
                </button>
              </div>
            </div>

            {/* Question navigator dots */}
            <div className="mt-6 flex flex-wrap gap-2">
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
                  className={`h-8 w-8 rounded-full text-xs font-bold transition ${
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
            <h1 className="text-3xl font-semibold">Exam Results</h1>
            <p className="mt-2 text-slate-400">
              {selectedSubject?.name} — {selectedTopic?.name}
            </p>

            {/* Score card */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-7xl font-bold text-[#2db54a]">{percentage}%</p>
              <p className="mt-3 text-xl text-white">
                You scored {score} out of {examQuestions.length}
              </p>
              <p className="mt-2 text-lg text-slate-300">{resultMessage}</p>
            </div>

            {/* Question review */}
            <div className="mt-10 space-y-4">
              <h2 className="text-xl font-semibold">Question Review</h2>
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
                    className={`rounded-2xl border p-5 ${
                      isCorrect
                        ? "border-green-500/30 bg-green-500/10"
                        : "border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    <p className="font-semibold text-white">
                      {index + 1}. {question.question}
                    </p>
                    <p className="mt-2 text-sm">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                        {userAnswer !== null
                          ? `${String.fromCharCode(65 + userAnswer)}. ${options[userAnswer]}`
                          : "Not answered"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="mt-1 text-sm text-green-400">
                        Correct answer: {String.fromCharCode(65 + question.correct_option)}. {options[question.correct_option]}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="mt-2 text-sm text-slate-400">
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
              className="mt-8 rounded-full bg-[#1a5c2a] px-8 py-3 font-semibold text-white transition hover:bg-[#2db54a]"
            >
              Try Again
            </button>
          </section>
        )}
      </main>
    </div>
  );
}