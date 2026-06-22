"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const sampleQuestions = [
  {
    id: 1,
    course: "ANA 201",
    year: "2023",
    question: "Name the three meninges that cover the brain and spinal cord.",
    answer: "Dura mater, Arachnoid mater, and Pia mater",
    topic: "Neuroanatomy",
  },
  {
    id: 2,
    course: "ANA 201",
    year: "2022",
    question: "What type of joint is the hip joint?",
    answer: "Ball and socket synovial joint",
    topic: "Joints",
  },
  {
    id: 3,
    course: "PHS 201",
    year: "2023",
    question: "What is the normal resting membrane potential of a neuron?",
    answer: "-70mV",
    topic: "Neurophysiology",
  },
  {
    id: 4,
    course: "PHS 201",
    year: "2022",
    question: "What is the Frank-Starling law of the heart?",
    answer: "The force of cardiac contraction is proportional to the initial length of the cardiac muscle fiber",
    topic: "Cardiac Physiology",
  },
  {
    id: 5,
    course: "BCH 201",
    year: "2023",
    question: "What is the end product of glycolysis?",
    answer: "Pyruvate (2 molecules per glucose)",
    topic: "Metabolism",
  },
  {
    id: 6,
    course: "BCH 201",
    year: "2022",
    question: "What is the role of ATP in the cell?",
    answer: "ATP is the universal energy currency of the cell, storing and transferring chemical energy",
    topic: "Bioenergetics",
  },
];

const filters = ["All", "ANA 201", "PHS 201", "BCH 201"];

export default function StudyHubPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [visibleAnswers, setVisibleAnswers] = useState<number[]>([]);
  const [savedLevel, setSavedLevel] = useState<string>("");

  useEffect(() => {
    const level = localStorage.getItem("eduprimeLevel");
    if (!level) {
      router.push("/onboarding");
      return;
    }
    setSavedLevel(level);
  }, [router]);

  const filteredQuestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return sampleQuestions.filter((item) => {
      const matchesFilter = selectedFilter === "All" || item.course === selectedFilter;
      const matchesSearch =
        query === "" ||
        item.course.toLowerCase().includes(query) ||
        item.topic.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [searchTerm, selectedFilter]);

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter);
  };

  const toggleAnswer = (id: number) => {
    setVisibleAnswers((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#0f172a] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-white">Edu</span>
            <span className="text-[#f59e0b]">Prime</span>
          </div>
          <a
            href="#questions"
            className="rounded-full bg-[#f59e0b] px-5 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <section className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Study Hub</h1>
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/30"
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
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 ${
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
          {filteredQuestions.map((question) => (
            <article key={question.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#f59e0b] px-3 py-1 text-xs font-semibold uppercase text-[#0f172a]">
                  {question.course}
                </span>
                <span className="text-sm text-slate-400">{question.year}</span>
              </div>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#f59e0b]">{question.topic}</p>
              <h2 className="mt-4 text-lg font-semibold text-white">{question.question}</h2>
              {visibleAnswers.includes(question.id) && (
                <div className="mt-4 rounded-2xl bg-slate-950/80 p-4 text-sm leading-6 text-slate-200">
                  <span className="font-semibold text-slate-100">Answer:</span> {question.answer}
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleAnswer(question.id)}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {visibleAnswers.includes(question.id) ? "Hide Answer" : "Show Answer"}
              </button>
            </article>
          ))}
          {filteredQuestions.length === 0 && (
            <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
              No questions match your search. Try a different course code or topic.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
