import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <span className="text-white">Edu</span>
          <span className="text-[#f59e0b]">Prime</span>
        </div>
        <Link
          href="/onboarding"
          className="rounded-full bg-[#f59e0b] px-5 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400"
        >
          Get Started
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-16 sm:px-8">
        <section className="flex flex-col items-start justify-center rounded-3xl bg-[#111827] px-6 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.35)] sm:px-12 sm:py-16">
          <p className="mb-4 rounded-full bg-white/5 px-4 py-2 text-sm text-[#f59e0b]">Nigeria's #1 past question repository</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Study Smarter. Pass Faster.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Nigeria's #1 past question repository and CBT simulator for university students.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex rounded-full bg-[#f59e0b] px-7 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-orange-400"
          >
            Start Studying Free
          </Link>
        </section>

        <section id="features" className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
            <div>
              <h2 className="text-xl font-semibold text-white">Unified Vault</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Browse organized past questions by course code and level, so you can revise fast and effectively.
              </p>
            </div>
            <Link
              href="/study-hub"
              className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Browse Questions →
            </Link>
          </div>
          <div className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
            <div>
              <h2 className="text-xl font-semibold text-white">CBT Simulator</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Practice under timed exam conditions with instant scoring and analytics to improve your performance.
              </p>
            </div>
            <Link
              href="/cbt"
              className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Start Exam →
            </Link>
          </div>
          <div className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
            <div>
              <h2 className="text-xl font-semibold text-white">Peer Sharing</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Upload notes to earn tokens, share with classmates, and build a stronger study community.
              </p>
            </div>
            <span className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-300">
              Coming Soon
            </span>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0f172a] px-6 py-6 text-sm text-slate-400 sm:px-8">
        <div className="mx-auto max-w-6xl text-center">
          © 2026 EduPrime. Built for Nigerian students.
        </div>
      </footer>
    </div>
  );
}
