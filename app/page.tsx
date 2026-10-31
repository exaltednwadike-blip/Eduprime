"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookMarked, CheckCircle2, Clock, Flame, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

const primaryButton =
  "ep-glow inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover";

const amberTile = "bg-[color-mix(in_srgb,var(--highlight)_16%,transparent)] text-highlight";
const greenTile = "bg-primary-soft text-primary";

function Countdown() {
  const [seconds, setSeconds] = useState(1499);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s <= 1380 ? 1499 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return <>{m}:{s} left</>;
}

function FloatCard({ pos, index, children }: { pos: string; index: number; children: React.ReactNode }) {
  return (
    <div
      className={`ep-float absolute ${pos}`}
      style={{ animationDuration: `${5 + index * 0.6}s`, animationDelay: `-${index * 1.3}s` }}
    >
      <div
        className="ep-card flex w-[140px] items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lg shadow-black/5 sm:w-[200px] sm:gap-2.5 sm:p-3"
        style={{ "--d": `${index * 3}s` } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // The dashboard sets an inline page background; clear it so this page is always light.
    document.documentElement.style.background = "";

    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        window.location.replace("/dashboard");
        return;
      }
      setChecking(false);
    };

    void checkSession();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-canvas text-fg">
      <style>{`
        @keyframes ep-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes ep-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes ep-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes ep-cycle {
          0% { opacity: 0; transform: translateY(18px) scale(0.9); }
          4% { opacity: 1; transform: translateY(-4px) scale(1.03); }
          7% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(0) scale(1); }
          56%, 100% { opacity: 0; transform: translateY(-18px) scale(0.96); }
        }
        @keyframes ep-cycle-soft {
          0% { opacity: 0; }
          6% { opacity: 1; }
          50% { opacity: 1; }
          58%, 100% { opacity: 0; }
        }
        @keyframes ep-pop { 0%, 4% { transform: scale(0); } 9% { transform: scale(1.3); } 13%, 100% { transform: scale(1); } }
        @keyframes ep-fill { 0%, 6% { width: 0; } 20%, 100% { width: 85%; } }
        @keyframes ep-flick { 0%, 100% { transform: rotate(-6deg) scale(1); } 50% { transform: rotate(6deg) scale(1.14); } }
        @keyframes ep-swap-a { 0%, 45% { opacity: 1; } 50%, 95% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes ep-swap-b { 0%, 45% { opacity: 0; } 50%, 95% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes ep-ring { 0% { transform: scale(0.8); opacity: 0.7; } 100% { transform: scale(1.22); opacity: 0; } }
        @keyframes ep-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(21, 128, 61, 0.35); } 50% { box-shadow: 0 0 0 10px rgba(21, 128, 61, 0); } }
        @keyframes ep-drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-30px, 24px); } }

        .ep-rise { animation: ep-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .ep-float { animation: ep-float 5s ease-in-out infinite; }
        .ep-bob { animation: ep-bob 6s ease-in-out infinite; }
        .ep-card { animation: ep-cycle 15s ease-in-out infinite both; animation-delay: var(--d); }
        .ep-pop { animation: ep-pop 15s ease-out infinite both; animation-delay: var(--d); }
        .ep-fill { width: 85%; animation: ep-fill 15s ease-out infinite both; animation-delay: var(--d); }
        .ep-flick { animation: ep-flick 1.6s ease-in-out infinite; }
        .ep-swap-a { animation: ep-swap-a 4s ease-in-out infinite; }
        .ep-swap-b { animation: ep-swap-b 4s ease-in-out infinite; }
        .ep-ring { animation: ep-ring 4s ease-out infinite; }
        .ep-glow { animation: ep-glow 2.4s ease-in-out infinite; }
        .ep-drift { animation: ep-drift 14s ease-in-out infinite; }

        /* If the device asks for reduced motion, keep the gentle fades but drop the movement. */
        @media (prefers-reduced-motion: reduce) {
          .ep-rise, .ep-float, .ep-bob, .ep-pop, .ep-flick, .ep-ring, .ep-glow, .ep-drift { animation: none; }
          .ep-card { animation-name: ep-cycle-soft; }
        }
      `}</style>

      <div className="ep-drift pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-soft blur-3xl" />
      <div
        className="ep-drift pointer-events-none absolute -left-24 top-[60%] h-72 w-72 rounded-full bg-primary-soft blur-3xl"
        style={{ animationDelay: "-7s" }}
      />

      <header className="relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-mark-light.png" alt="" className="h-9 w-auto" />
            <span className="font-heading text-lg font-semibold text-fg">EduPrime</span>
          </Link>
          <Link href="/signin" className="text-sm font-medium text-muted transition hover:text-fg">
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 items-center px-5 sm:px-8">
        <section className="grid w-full items-center gap-6 pb-10 pt-2 lg:grid-cols-2 lg:gap-10 lg:pb-14">
          <div>
            <span
              className="ep-rise inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
              style={{ animationDelay: "0.05s" }}
            >
              For Nigerian medical students
            </span>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              <span className="ep-rise block" style={{ animationDelay: "0.15s" }}>
                Study smarter.
              </span>
              <span className="ep-rise block text-primary" style={{ animationDelay: "0.3s" }}>
                Pass faster.
              </span>
            </h1>
            <p
              className="ep-rise mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "0.45s" }}
            >
              Past questions, a timed CBT simulator and flashcards, built for medical students.
            </p>
            <div className="ep-rise mt-8" style={{ animationDelay: "0.6s" }}>
              <Link href="/signup" className={primaryButton}>
                Get started free
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Student inside the circle, with floating cards */}
          <div className="relative mx-auto h-[400px] w-full max-w-[380px] sm:h-[500px] sm:max-w-[480px] lg:h-[540px]">
            <div className="absolute left-1/2 top-[4%] -translate-x-1/2">
              <div className="relative h-[280px] w-[280px] sm:h-[370px] sm:w-[370px] lg:h-[410px] lg:w-[410px]">
                <div className="absolute inset-0 rounded-full bg-primary-soft" />
                <div className="ep-ring absolute inset-0 rounded-full border-2 border-primary/30" />
                <div
                  className="ep-ring absolute inset-0 rounded-full border-2 border-primary/30"
                  style={{ animationDelay: "2s" }}
                />
              </div>
            </div>

            <span className="ep-float absolute left-[12%] top-[8%] h-3 w-3 rounded-full bg-primary/40" style={{ animationDelay: "-1s" }} />
            <span className="ep-float absolute right-[16%] top-[56%] h-2.5 w-2.5 rounded-full bg-highlight/60" style={{ animationDelay: "-2.5s" }} />
            <span className="ep-float absolute left-[6%] top-[44%] h-2 w-2 rounded-full bg-primary/50" style={{ animationDelay: "-4s" }} />

            <div className="absolute inset-x-0 bottom-0 flex justify-center">
              <img
                src="/landing/student-1.webp"
                alt="A smiling medical student in a white coat holding a phone"
                className="ep-bob h-[320px] w-auto max-w-none sm:h-[420px] lg:h-[465px]"
              />
            </div>

            <FloatCard pos="left-0 top-[12%] sm:-left-4" index={0}>
              <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9 ${greenTile}`}>
                <span className="ep-pop flex">
                  <CheckCircle2 size={18} />
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-fg sm:text-sm">Correct</span>
                <span className="block text-[11px] text-muted sm:text-xs">Median nerve</span>
              </span>
            </FloatCard>

            <FloatCard pos="right-0 top-[33%] sm:-right-6" index={1}>
              <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9 ${greenTile}`}>
                <Clock size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-fg sm:text-sm">CBT exam</span>
                <span className="block text-[11px] tabular-nums text-muted sm:text-xs">
                  <Countdown />
                </span>
              </span>
            </FloatCard>

            <FloatCard pos="left-0 top-[58%] sm:-left-6" index={2}>
              <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9 ${amberTile}`}>
                <Target size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-fg sm:text-sm">Score</span>
                <span className="block text-[11px] text-muted sm:text-xs">85% in Anatomy</span>
                <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-line">
                  <span className="ep-fill block h-full rounded-full bg-primary" />
                </span>
              </span>
            </FloatCard>

            <FloatCard pos="right-0 top-[3%] sm:-right-4" index={3}>
              <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9 ${amberTile}`}>
                <span className="ep-flick flex">
                  <Flame size={18} />
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-fg sm:text-sm">5-day streak</span>
                <span className="block text-[11px] text-muted sm:text-xs">Keep it going</span>
              </span>
            </FloatCard>

            <FloatCard pos="right-0 top-[73%] sm:-right-4" index={4}>
              <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9 ${greenTile}`}>
                <BookMarked size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-fg sm:text-sm">Flashcard</span>
                <span className="relative block h-4 text-[11px] text-muted sm:text-xs">
                  <span className="ep-swap-a absolute inset-0 whitespace-nowrap">Aldehyde group?</span>
                  <span className="ep-swap-b absolute inset-0 whitespace-nowrap font-medium text-primary">-CHO</span>
                </span>
              </span>
            </FloatCard>
          </div>
        </section>
      </main>
    </div>
  );
}