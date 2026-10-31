"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, MoreVertical, Share } from "lucide-react";

type Platform = "ios" | "android";

const captions: Record<Platform, string[]> = {
  ios: [
    "Tap the Share button at the bottom of Safari.",
    "Scroll down and tap Add to Home Screen.",
    "Tap Add. EduPrime now opens like an app.",
  ],
  android: [
    "Tap the menu (three dots) at the top right of Chrome.",
    "Tap Install app, or Add to Home screen.",
    "Confirm. EduPrime now opens like an app.",
  ],
};

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-6 py-3.5 text-sm font-medium text-fg transition hover:bg-raised";

function Tap() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="absolute h-9 w-9 rounded-full bg-primary/30 motion-safe:animate-ping" />
      <span className="absolute h-7 w-7 rounded-full border-2 border-primary" />
    </span>
  );
}

function ScreenLayer({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div className={`absolute inset-0 transition-opacity duration-500 ${show ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}

function PageLines() {
  return (
    <div className="space-y-2 px-4 pt-5">
      <div className="h-3 w-1/2 rounded bg-line" />
      <div className="h-2 w-5/6 rounded bg-raised" />
      <div className="h-2 w-2/3 rounded bg-raised" />
      <div className="mt-4 h-16 rounded-xl bg-primary-soft" />
      <div className="h-10 rounded-xl bg-raised" />
    </div>
  );
}

function HomeScreen({ show }: { show: boolean }) {
  const dummy = Array.from({ length: 7 });
  return (
    <ScreenLayer show={show}>
      <div className="h-full bg-gradient-to-b from-primary-soft to-raised px-5 pt-12">
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {dummy.map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="h-10 w-10 rounded-[12px] bg-line" />
              <span className="h-1.5 w-8 rounded bg-line" />
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <span
              className={`h-10 w-10 overflow-hidden rounded-[12px] shadow-md transition-all duration-500 ${
                show ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            >
              <img src="/logo.png" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-[8px] font-medium text-fg">EduPrime</span>
          </div>
        </div>
      </div>
    </ScreenLayer>
  );
}

function IosPhone({ step }: { step: number }) {
  return (
    <>
      <ScreenLayer show={step < 2}>
        <div className="h-full bg-surface">
          <PageLines />
          <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-around border-t border-line bg-raised px-4 text-muted">
            <span className="h-3 w-3 rounded-sm bg-line" />
            <span className="h-3 w-3 rounded-sm bg-line" />
            <span className="relative flex h-9 w-9 items-center justify-center text-primary">
              <Share size={18} />
              {step === 0 && <Tap />}
            </span>
            <span className="h-3 w-3 rounded-sm bg-line" />
            <span className="h-3 w-3 rounded-sm bg-line" />
          </div>

          <div
            className={`absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-3 shadow-2xl transition-transform duration-500 ${
              step === 1 ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-line" />
            <div className="space-y-1.5 text-[10px] text-fg">
              <div className="rounded-lg bg-raised px-3 py-2.5">Add to Bookmarks</div>
              <div className="relative rounded-lg bg-primary-soft px-3 py-2.5 font-medium text-primary ring-1 ring-primary">
                Add to Home Screen
                {step === 1 && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="relative flex h-6 w-6 items-center justify-center">
                      <span className="absolute h-6 w-6 rounded-full bg-primary/30 motion-safe:animate-ping" />
                      <span className="h-3 w-3 rounded-full bg-primary" />
                    </span>
                  </span>
                )}
              </div>
              <div className="rounded-lg bg-raised px-3 py-2.5">Copy</div>
            </div>
          </div>
        </div>
      </ScreenLayer>
      <HomeScreen show={step === 2} />
    </>
  );
}

function AndroidPhone({ step }: { step: number }) {
  return (
    <>
      <ScreenLayer show={step < 2}>
        <div className="h-full bg-surface">
          <div className="flex h-11 items-center gap-2 border-b border-line bg-raised px-3">
            <span className="h-5 flex-1 rounded-full bg-line" />
            <span className="relative flex h-8 w-8 items-center justify-center text-primary">
              <MoreVertical size={18} />
              {step === 0 && <Tap />}
            </span>
          </div>
          <PageLines />

          <div
            className={`absolute right-2 top-11 w-[150px] origin-top-right rounded-xl border border-line bg-surface p-1.5 text-[10px] text-fg shadow-2xl transition-all duration-300 ${
              step === 1 ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <div className="rounded-lg px-3 py-2">New tab</div>
            <div className="relative rounded-lg bg-primary-soft px-3 py-2 font-medium text-primary ring-1 ring-primary">
              Install app
              {step === 1 && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span className="absolute h-5 w-5 rounded-full bg-primary/30 motion-safe:animate-ping" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                </span>
              )}
            </div>
            <div className="rounded-lg px-3 py-2">Settings</div>
          </div>
        </div>
      </ScreenLayer>
      <HomeScreen show={step === 2} />
    </>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("android");
  const [step, setStep] = useState(0);
  const [installEvent, setInstallEvent] = useState<any>(null);

  useEffect(() => {
    document.documentElement.style.background = "";

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (standalone) {
      router.replace("/dashboard");
      return;
    }

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) setPlatform("ios");

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [router]);

  useEffect(() => {
    setStep(0);
    const id = setInterval(() => setStep((s) => (s + 1) % 3), 2800);
    return () => clearInterval(id);
  }, [platform]);

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const goOn = () => router.replace("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      <header className="mx-auto flex w-full max-w-xl items-center gap-2.5 px-5 py-4">
        <img src="/logo-mark-light.png" alt="" className="h-9 w-auto" />
        <span className="font-heading text-lg font-semibold text-fg">EduPrime</span>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-5 pb-10 text-center">
        <h1 className="mt-2 text-2xl font-semibold text-fg sm:text-3xl">Put EduPrime on your home screen</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">Open it in one tap, like any other app. It takes ten seconds.</p>

        <div className="mt-5 inline-flex rounded-full bg-raised p-1 text-sm">
          {(["ios", "android"] as Platform[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPlatform(item)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${
                platform === item ? "bg-surface text-fg shadow-sm" : "text-muted"
              }`}
            >
              {item === "ios" ? "iPhone" : "Android"}
            </button>
          ))}
        </div>

        <div className="relative mt-6 h-[400px] w-[220px] overflow-hidden rounded-[32px] border-[6px] border-fg/80 bg-surface shadow-xl">
          {platform === "ios" ? <IosPhone step={step} /> : <AndroidPhone step={step} />}
        </div>

        <div className="mt-5 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${step === i ? "w-6 bg-primary" : "w-1.5 bg-line"}`}
            />
          ))}
        </div>
        <p className="mt-3 min-h-[2.5rem] max-w-xs text-sm font-medium text-fg">
          Step {step + 1}: {captions[platform][step]}
        </p>
        {platform === "ios" && <p className="text-xs text-muted">On iPhone this only works in Safari.</p>}

        <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
          {platform === "android" && installEvent && (
            <button type="button" onClick={install} className={primaryButton}>
              <Download size={16} />
              Install now
            </button>
          )}
          <button type="button" onClick={goOn} className={platform === "android" && installEvent ? secondaryButton : primaryButton}>
            Continue to EduPrime
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}