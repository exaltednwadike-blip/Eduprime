"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Step = { target: string; title: string; text: string };
type Rect = { top: number; left: number; width: number; height: number };

const PAD = 6;

const intro: Step = {
  target: "",
  title: "Welcome to EduPrime",
  text: "Here is a quick tour of where everything is. It takes about 30 seconds.",
};

const desktopSteps: Step[] = [
  intro,
  {
    target: "study-hub",
    title: "Study Hub",
    text: "Practise past questions topic by topic. Tap an answer to see if you were right, with a full explanation. No timer.",
  },
  {
    target: "cbt",
    title: "CBT Simulator",
    text: "Sit a timed exam like the real thing. You get your score and a full review at the end.",
  },
  {
    target: "flashcards",
    title: "Flashcards",
    text: "Quick revision cards built from the same questions. Flip one to see the answer.",
  },
  {
    target: "leaderboard",
    title: "Leaderboard",
    text: "See how you rank against other students, this week and all time.",
  },
  {
    target: "progress",
    title: "Progress",
    text: "Track what you have answered and how your scores are improving.",
  },
  {
    target: "settings",
    title: "Settings",
    text: "Change your name, level, subjects and theme any time.",
  },
];

const mobileSteps: Step[] = [
  intro,
  {
    target: "tab-study-hub",
    title: "Study",
    text: "Practise past questions topic by topic. Tap an answer to see if you were right, with a full explanation.",
  },
  {
    target: "tab-cbt",
    title: "CBT",
    text: "Sit a timed exam like the real thing. You get your score and a full review at the end.",
  },
  {
    target: "tab-flashcards",
    title: "Cards",
    text: "Quick revision cards built from the same questions. Flip one to see the answer.",
  },
  {
    target: "tab-more",
    title: "More",
    text: "Leaderboard, Progress, Notifications, Settings and your profile are all in here.",
  },
];

const shade = "absolute bg-black/45 backdrop-blur-[3px] transition-all duration-300";
const primaryButton =
  "rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:bg-primary-hover";
const secondaryButton =
  "rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-medium text-fg transition hover:bg-raised";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export default function GuidedTour({
  userId,
  isMobile,
  onDone,
}: {
  userId: string;
  isMobile: boolean;
  onDone: () => void;
}) {
  const steps = isMobile ? mobileSteps : desktopSteps;
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  const measure = useCallback(() => {
    setSize({ w: window.innerWidth, h: window.innerHeight });
    if (!step.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) {
      setRect(null);
      return;
    }
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const finish = useCallback(async () => {
    onDone();
    await supabase.from("profiles").update({ tour_done: true }).eq("id", userId);
  }, [onDone, userId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const cardW = Math.max(240, Math.min(320, size.w - 32));
  let cardStyle: React.CSSProperties = { width: cardW };

  if (!rect) {
    cardStyle = { ...cardStyle, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else if (rect.top > size.h * 0.55) {
    cardStyle = {
      ...cardStyle,
      bottom: size.h - rect.top + 12,
      left: clamp(rect.left + rect.width / 2 - cardW / 2, 16, Math.max(16, size.w - cardW - 16)),
    };
  } else if (size.w >= 768 && rect.left < size.w / 3) {
    cardStyle = {
      ...cardStyle,
      left: rect.left + rect.width + 16,
      top: clamp(rect.top, 16, Math.max(16, size.h - 260)),
    };
  } else {
    cardStyle = {
      ...cardStyle,
      top: rect.top + rect.height + 12,
      left: clamp(rect.left + rect.width / 2 - cardW / 2, 16, Math.max(16, size.w - cardW - 16)),
    };
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product tour">
      {rect ? (
        <>
          <div className={shade} style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
          <div className={shade} style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
          <div className={shade} style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }} />
          <div className={shade} style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
          <div
            className="absolute rounded-xl ring-2 ring-primary transition-all duration-300"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
        </>
      ) : (
        <div className={shade} style={{ inset: 0 }} />
      )}

      <div className="absolute rounded-2xl border border-line bg-surface p-4 shadow-2xl" style={cardStyle}>
        <p className="text-xs font-medium text-primary">
          {index === 0 ? "Quick tour" : `Step ${index} of ${steps.length - 1}`}
        </p>
        <h2 className="mt-1 text-base font-semibold text-fg">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => void finish()} className="text-xs font-medium text-muted hover:text-fg">
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} className={secondaryButton}>
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? void finish() : setIndex((i) => i + 1))}
              className={primaryButton}
            >
              {index === 0 ? "Start" : isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}