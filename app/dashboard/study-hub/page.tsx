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
  type: string;
  year: number | null;
};

export default function StudyHubPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [savedLevel, setSavedLevel] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [visibleAnswers, setVisibleAnswers] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Check onboarding
  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) {
      router.push("/onboarding");
      return;
    }
    setSavedLevel(level);
  }, [router]);

  // Fetch subjects on load
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");
      if (error) {
        showToast({ type: "error", title: "Error", message: "Failed to load subjects." });
      } else {
        setSubjects(data || []);
      }
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
      setQuestions([]);
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
      setQuestions([]);
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

  // Fetch questions when topic selected
  useEffect(() => {
    if (!selectedTopic) return;
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setQuestions([]);
      const { data, error } = await supabase
        .from("questions")
        .select("id, question, answer, explanation, type, year")
        .eq("topic_id", selectedTopic.id)
        .order("created_at");
      if (error) {
        showToast({ type: "error", title: "Error", message: "Failed to load questions." });
      } else {
        setQuestions(data || []);
      }
      setLoadingQuestions(false);
    };
    fetchQuestions();
  }, [selectedTopic]);

  const toggleAnswer = (id: string) => {
    setVisibleAnswers((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const filteredQuestions = questions.filter((q) =>
    searchTerm.trim() === "" ||
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Study Hub</h1>
          {savedLevel && (
            <p className="mt-1 text-sm text-slate-400">Studying as: {savedLevel}</p>
          )}
          <p className="mt-2 text-slate-400">
            Browse questions by subject, category and topic.
          </p>
        </div>

        {/* Subject Filter */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-slate-400">Select Subject</p>
          {loadingSubjects ? (
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
                      : "border-white/20 bg-transparent text-slate-300 hover:border-[#1a5c2a] hover:bg-white/5"
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        {selectedSubject && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-slate-400">Select Category</p>
            {loadingCategories ? (
              <p className="text-sm text-slate-400">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-400">No categories found for this subject yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedCategory?.id === category.id
                        ? "border-transparent bg-[#1a5c2a] text-white"
                        : "border-white/20 bg-transparent text-slate-300 hover:border-[#1a5c2a] hover:bg-white/5"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Topic Filter */}
        {selectedCategory && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-slate-400">Select Topic</p>
            {loadingTopics ? (
              <p className="text-sm text-slate-400">Loading topics...</p>
            ) : topics.length === 0 ? (
              <p className="text-sm text-slate-400">No topics found for this category yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selectedTopic?.id === topic.id
                        ? "border-transparent bg-[#2db54a] text-white"
                        : "border-white/20 bg-transparent text-slate-300 hover:border-[#2db54a] hover:bg-white/5"
                    }`}
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

       

        {/* Questions */}
        {!selectedSubject && (
          <div className="mt-12 text-center text-slate-400">
            Select a subject above to start browsing questions.
          </div>
        )}

        {selectedTopic && loadingQuestions && (
          <div className="mt-8 text-center text-slate-400">Loading questions...</div>
        )}

        {selectedTopic && !loadingQuestions && filteredQuestions.length === 0 && (
          <div className="mt-8 text-center text-slate-400">
            No questions found for this topic yet.
          </div>
        )}

        {selectedTopic && !loadingQuestions && filteredQuestions.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuestions.map((question) => (
              <article
                key={question.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#1a5c2a] px-3 py-1 text-xs font-semibold uppercase text-white">
                    {selectedSubject?.name}
                  </span>
                  {question.year && (
                    <span className="text-sm text-slate-400">{question.year}</span>
                  )}
                </div>
                <p className="mt-3 text-xs uppercase tracking-widest text-[#2db54a]">
                  {selectedTopic.name}
                </p>
                <h2 className="mt-4 text-base font-semibold text-white">
                  {question.question}
                </h2>

                {visibleAnswers.includes(question.id) && (
                  <div className="mt-4 rounded-2xl bg-slate-950/80 p-4 text-sm text-slate-200">
                    <p><span className="font-semibold text-white">Answer:</span> {question.answer}</p>
                    {question.explanation && (
                      <p className="mt-2 text-slate-400">
                        <span className="font-semibold text-slate-300">Explanation:</span> {question.explanation}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleAnswer(question.id)}
                  className="mt-4 rounded-full bg-[#1a5c2a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2db54a]"
                >
                  {visibleAnswers.includes(question.id) ? "Hide Answer" : "Show Answer"}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}