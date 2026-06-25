"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastContext";

type Question = {
  id: number;
  course_code: string;
  year: string;
  question: string;
  answer: string;
  topic: string;
};

export default function StudyHubPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [visibleAnswers, setVisibleAnswers] = useState<number[]>([]);
  const [savedLevel, setSavedLevel] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) {
      router.push("/onboarding");
      return;
    }
    setSavedLevel(level);
  }, [router]);

  const { showToast } = useToast();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(false);

      const { data, error: fetchError } = await supabase.from<Question>("questions").select("*");

      if (fetchError || !data) {
        setError(true);
        setQuestions([]);
        showToast({ type: "error", title: "Failed to load", message: "Unable to load questions. Please try again later." });
      } else {
        setQuestions(data);
      }

      setLoading(false);
    };

    fetchQuestions();
  }, [showToast]);

  const filters = useMemo(() => {
    const courseCodes = Array.from(new Set(questions.map((question) => question.course_code)));
    return ["All", ...courseCodes];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return questions.filter((item) => {
      const matchesFilter = selectedFilter === "All" || item.course_code === selectedFilter;
      const matchesSearch =
        query === "" ||
        item.course_code.toLowerCase().includes(query) ||
        item.topic.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [questions, searchTerm, selectedFilter]);

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter);
  };

  const toggleAnswer = (id: number) => {
    setVisibleAnswers((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <section className="rounded-3xl p-6 sm:p-10">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-semibold">Study Hub</h1>
            <p className="text-sm text-slate-400">{savedLevel ? `Studying as: ${savedLevel}` : ""}</p>
            <p className="text-base leading-7 text-slate-300 sm:text-lg">
              Search past questions by course code - College of Medicine, UNEC.
            </p>
          </div>

          <div className="mt-8 space-y-4 sm:mt-10">
            <label className="block text-sm font-medium text-slate-300" htmlFor="search">
              Search by course code or topic
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="e.g. ANA 201 or Neuroanatomy"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {filters.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handleFilterClick(filter)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none ${
                    isActive
                      ? "border-transparent bg-[#f59e0b] text-[#0f172a]"
                      : "border-white/20 bg-transparent text-slate-200 hover:border-[#f59e0b] hover:bg-white/10"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </section>

        <section id="questions" className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <div className="col-span-full rounded-3xl p-8 text-center text-slate-300">Loading questions...</div>
          )}
          {error && !loading && (
            <div className="col-span-full rounded-3xl p-8 text-center text-slate-300">Failed to load questions</div>
          )}
          {!loading && !error && filteredQuestions.map((question) => (
            <article key={question.id} className="rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#f59e0b] px-3 py-1 text-xs font-semibold uppercase text-[#0f172a]">
                  {question.course_code}
                </span>
                <span className="text-sm text-slate-400">{question.year}</span>
              </div>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#f59e0b]">{question.topic}</p>
              <h2 className="mt-4 text-lg font-semibold">{question.question}</h2>
              {visibleAnswers.includes(question.id) && (
                <div className="mt-4 rounded-2xl p-4 text-sm leading-6 text-slate-200">
                  <span className="font-semibold">Answer:</span> {question.answer}
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleAnswer(question.id)}
                className="mt-5 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
              >
                {visibleAnswers.includes(question.id) ? "Hide Answer" : "Show Answer"}
              </button>
            </article>
          ))}
          {!loading && !error && filteredQuestions.length === 0 && (
            <div className="col-span-full rounded-3xl p-8 text-center text-slate-300">No questions match your search.</div>
          )}
        </section>
      </main>
    </div>
  );
}
