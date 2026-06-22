"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const levels = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "600 Level"];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const handleContinue = () => {
    if (!selectedLevel) return;
    localStorage.setItem("eduprimeLevel", selectedLevel);
    router.push("/study-hub");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#0f172a] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-white">Edu</span>
            <span className="text-[#f59e0b]">Prime</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full rounded-3xl bg-[#111827] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:p-10">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Welcome to EduPrime</h1>
            <p className="text-base leading-7 text-slate-300 sm:text-lg">Select your level to get started</p>
          </div>

          <div className="mt-10 rounded-3xl bg-[#0f172a] p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f59e0b]">Your Level</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {levels.map((level) => {
                const isSelected = selectedLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedLevel(level)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      isSelected
                        ? "border-[#f59e0b] bg-[#f59e0b]/15 text-white"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-[#f59e0b] hover:bg-white/10"
                    }`}
                  >
                    <span className="text-lg font-semibold">{level}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedLevel}
                className={`inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition sm:w-auto ${
                  selectedLevel
                    ? "bg-[#f59e0b] text-[#0f172a] hover:bg-orange-400"
                    : "cursor-not-allowed bg-white/10 text-slate-500"
                }`}
              >
                Continue to Study Hub
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
