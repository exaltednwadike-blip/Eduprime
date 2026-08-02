"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type Question = {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
  type: string;
  year: number | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: number | null;
};

export default function StudyHubPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [theoryRevealed, setTheoryRevealed] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Theme classes
  const card = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const cardText = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const filterBtn = (active: boolean) =>
    active
      ? "bg-[#16a34a] text-white border-transparent"
      : isDark
      ? "border-white/20 text-slate-300 hover:border-[#16a34a] hover:text-white"
      : "border-gray-300 text-gray-600 hover:border-[#16a34a] hover:text-[#16a34a]";

  // Check onboarding
  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) router.push("/onboarding");
  }, [router]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      const { data } = await supabase.from("subjects").select("id, name").order("name");
      setSubjects(data || []);
      setLoadingSubjects(false);
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
      setQuestions([]);
      const { data } = await supabase
        .from("categories")
        .select("id, subject_id, name")
        .eq("subject_id", selectedSubject.id)
        .order("name");
      setCategories(data || []);
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
      setQuestions([]);
      const { data } = await supabase
        .from("topics")
        .select("id, category_id, name")
        .eq("category_id", selectedCategory.id)
        .order("name");
      setTopics(data || []);
      setLoadingTopics(false);
    };
    fetchTopics();
  }, [selectedCategory]);

  // Fetch questions when topic selected
  useEffect(() => {
    if (!selectedTopic) return;
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setTheoryRevealed(false);
      const { data } = await supabase
        .from("questions")
        .select("id, question, answer, explanation, type, year, option_a, option_b, option_c, option_d, correct_option")
        .eq("topic_id", selectedTopic.id)
        .order("created_at");
      setQuestions(data || []);
      setLoadingQuestions(false);
    };
    fetchQuestions();
  }, [selectedTopic]);

  const currentQuestion = questions[currentIndex];

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setTheoryRevealed(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setTheoryRevealed(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (selectedAnswer !== null) return; // already answered
    setSelectedAnswer(index);

    // Log attempt to database
    const logAttempt = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentQuestion) return;
      await supabase.from("question_attempts").insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        subject_id: selectedSubject?.id,
        correct: index === currentQuestion.correct_option,
      });
    };
    logAttempt();
  };

  const getOptionStyle = (index: number) => {
    if (selectedAnswer === null) {
      return isDark
        ? "border-white/10 bg-white/5 text-white hover:border-[#16a34a] hover:bg-white/10 cursor-pointer"
        : "border-gray-200 bg-white text-gray-900 hover:border-[#16a34a] cursor-pointer";
    }
    if (index === currentQuestion?.correct_option) {
      return "border-green-500 bg-green-500/20 text-green-300 cursor-default";
    }
    if (index === selectedAnswer) {
      return "border-red-500 bg-red-500/20 text-red-300 cursor-default";
    }
    return isDark
      ? "border-white/5 bg-white/5 text-slate-500 cursor-default opacity-50"
      : "border-gray-100 bg-gray-50 text-gray-400 cursor-default opacity-50";
  };

  const options = currentQuestion
    ? [currentQuestion.option_a, currentQuestion.option_b, currentQuestion.option_c, currentQuestion.option_d].filter(Boolean)
    : [];

  return (
    <div className="space-y-4 p-4 sm:p-6">

      {/* Header */}
      <div className={`rounded-xl ${card} p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16a34a]/20">
            <BookOpen size={20} className="text-[#16a34a]" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${cardText}`}>Study Hub</h1>
            <p className={`text-xs ${muted}`}>Select a topic to start studying</p>
          </div>
        </div>
      </div>

      {/* Subject filter */}
      <div className={`rounded-xl ${card} p-4`}>
        <p className={`text-xs font-medium uppercase tracking-wide ${muted} mb-3`}>Select Subject</p>
        {loadingSubjects ? (
          <p className={`text-sm ${muted}`}>Loading...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${filterBtn(selectedSubject?.id === subject.id)}`}
              >
                {subject.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category filter */}
      {selectedSubject && (
        <div className={`rounded-xl ${card} p-4`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${muted} mb-3`}>Select Category</p>
          {loadingCategories ? (
            <p className={`text-sm ${muted}`}>Loading...</p>
          ) : categories.length === 0 ? (
            <p className={`text-sm ${muted}`}>No categories found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${filterBtn(selectedCategory?.id === category.id)}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Topic filter */}
      {selectedCategory && (
        <div className={`rounded-xl ${card} p-4`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${muted} mb-3`}>Select Topic</p>
          {loadingTopics ? (
            <p className={`text-sm ${muted}`}>Loading...</p>
          ) : topics.length === 0 ? (
            <p className={`text-sm ${muted}`}>No topics found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${filterBtn(selectedTopic?.id === topic.id)}`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      {selectedTopic && (
        <>
          {loadingQuestions ? (
            <div className={`rounded-xl ${card} p-8 text-center`}>
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent mx-auto" />
              <p className={`mt-3 text-sm ${muted}`}>Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className={`rounded-xl ${card} p-8 text-center`}>
              <p className={`text-sm ${muted}`}>No questions found for this topic yet.</p>
            </div>
          ) : (
            <div className={`rounded-xl ${card} p-5`}>

              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <p className={`text-xs font-medium ${muted}`}>
                  Question {currentIndex + 1} of {questions.length}
                </p>
                <div className="flex items-center gap-2">
                  {currentQuestion?.year && (
                    <span className={`text-xs ${muted}`}>{currentQuestion.year}</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    currentQuestion?.type === "mcq"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}>
                    {currentQuestion?.type?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className={`mb-5 h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                <div
                  className="h-1.5 rounded-full bg-[#16a34a] transition-all"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <h2 className={`text-base font-semibold ${cardText} mb-5 leading-relaxed`}>
                {currentQuestion?.question}
              </h2>

              {/* MCQ Options */}
              {currentQuestion?.type === "mcq" && options.length > 0 && (
                <div className="space-y-3 mb-5">
                  {options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${getOptionStyle(index)}`}
                    >
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Theory - Show Answer button */}
              {currentQuestion?.type === "theory" && (
                <button
                  onClick={() => setTheoryRevealed(true)}
                  className={`mb-5 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    isDark
                      ? "border-white/20 text-slate-300 hover:bg-white/10"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {theoryRevealed ? "Answer shown below" : "Show Answer"}
                </button>
              )}

              {/* Answer + Explanation for MCQ */}
              {currentQuestion?.type === "mcq" && selectedAnswer !== null && (
                <div className={`rounded-xl p-4 mb-5 ${
                  selectedAnswer === currentQuestion.correct_option
                    ? "bg-green-500/10 border border-green-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${
                    selectedAnswer === currentQuestion.correct_option ? "text-green-400" : "text-red-400"
                  }`}>
                    {selectedAnswer === currentQuestion.correct_option ? "Correct!" : "Incorrect"}
                  </p>
                  <p className={`text-sm ${cardText}`}>
                    <span className="font-medium">Correct answer:</span> {String.fromCharCode(65 + (currentQuestion.correct_option ?? 0))}. {options[currentQuestion.correct_option ?? 0]}
                  </p>
                  {currentQuestion.explanation && (
                    <p className={`mt-2 text-sm ${muted}`}>
                      <span className="font-medium">Explanation:</span> {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Answer + Explanation for Theory */}
              {currentQuestion?.type === "theory" && theoryRevealed && (
                <div className={`rounded-xl p-4 mb-5 border ${
                  isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                }`}>
                  <p className={`text-sm font-semibold mb-1 ${cardText}`}>Answer</p>
                  <p className={`text-sm ${cardText}`}>{currentQuestion.answer}</p>
                  {currentQuestion.explanation && (
                    <p className={`mt-2 text-sm ${muted}`}>
                      <span className="font-medium">Explanation:</span> {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
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

                <span className={`text-xs ${muted}`}>
                  {currentIndex + 1} / {questions.length}
                </span>

                <button
                  onClick={goNext}
                  disabled={currentIndex === questions.length - 1}
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
          <p className={`text-sm font-medium ${cardText}`}>Select a subject to start studying</p>
          <p className={`text-xs ${muted} mt-1`}>Choose from the subjects above</p>
        </div>
      )}
    </div>
  );
}