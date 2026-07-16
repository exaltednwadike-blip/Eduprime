"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/components/ToastContext";

const levels = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "600 Level"];

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleContinue = () => {
    if (!selectedLevel) {
      showToast({ type: "warning", title: "Select a level", message: "Please choose your study level to continue." });
      return;
    }

    setSaving(true);
    localStorage.setItem("eduprimeLevel", selectedLevel);
    showToast({ type: "success", title: "You're all set!", message: `Welcome to ${selectedLevel}.` });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#052e16] text-white">
      <header className="border-b border-white/10 bg-[#052e16] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="EduPrime" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl bg-[#064e23] p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#16a34a]/15">
            <GraduationCap className="h-7 w-7 text-[#22c55e]" />
          </div>

          <h1 className="mt-4 text-center text-2xl font-semibold text-white sm:text-3xl">What level are you?</h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            This helps us tailor your study materials and CBT questions to the right level.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedLevel(level)}
                className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                  selectedLevel === level
                    ? "border-transparent bg-[#16a34a] text-[#052e16]"
                    : "border-white/10 bg-slate-950/80 text-slate-200 hover:border-[#16a34a]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="mt-8 w-full rounded-full bg-[#1a5c2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2db54a] disabled:opacity-70"
          >
            {saving ? "Setting up..." : "Continue to Dashboard"}
          </button>
        </div>
      </main>
    </div>
  );
}