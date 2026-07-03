import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#052e16] text-white">
      <header className="w-full">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="EduPrime" className="h-10 w-auto" />
            <span className="sr-only">EduPrime</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/signin"
              className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="ml-2 rounded-md bg-[#2db54a] px-4 py-2 text-sm font-semibold text-[#052e16] shadow-sm hover:brightness-95"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-8">
        {/* Hero */}
        <section className="mt-8 rounded-xl bg-[#052e16] px-6 py-12 sm:mt-12 sm:px-10 sm:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Study Smarter. Pass Faster.
            </h1>
            <p className="mt-4 text-base text-slate-200 sm:text-lg">
              Nigeria's #1 past question repository and CBT simulator for College of Medicine students at
              UNEC
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-[#2db54a] px-6 py-3 text-sm font-semibold text-[#052e16] shadow-md"
              >
                Get Started Free
              </Link>

              <Link href="/signin" className="mt-2 text-sm text-slate-200 underline sm:mt-0 sm:ml-4">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-10 grid gap-6 sm:grid-cols-3">
          <article className="flex flex-col justify-between rounded-lg bg-[#1a5c2a] p-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Study Hub</h3>
              <p className="mt-3 text-sm text-slate-100">
                Browse past questions by topic to focus your revision where it matters most.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-block rounded-md bg-[#2db54a] px-4 py-2 text-sm font-semibold text-[#052e16]"
              >
                Browse Questions
              </Link>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-lg bg-[#1a5c2a] p-6">
            <div>
              <h3 className="text-lg font-semibold text-white">CBT Simulator</h3>
              <p className="mt-3 text-sm text-slate-100">Practice under timed exam conditions and track progress.</p>
            </div>
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-block rounded-md bg-[#2db54a] px-4 py-2 text-sm font-semibold text-[#052e16]"
              >
                Start Practicing
              </Link>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-lg bg-[#1a5c2a] p-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Peer Sharing</h3>
              <p className="mt-3 text-sm text-slate-100">Collaborate and share resources with your classmates.</p>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-slate-200">
                Coming Soon
              </span>
            </div>
          </article>
        </section>

        {/* How it works */}
        <section className="mt-12 rounded-lg bg-white/5 p-6 sm:p-8">
          <h2 className="text-center text-xl font-semibold text-white">How it works</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2db54a] text-sm font-semibold text-[#052e16]">1</div>
              <h4 className="text-md font-medium text-white">Create your account</h4>
              <p className="text-sm text-slate-200">Sign up with your university email to get started.</p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2db54a] text-sm font-semibold text-[#052e16]">2</div>
              <h4 className="text-md font-medium text-white">Select your level and subject</h4>
              <p className="text-sm text-slate-200">Pick your course and year to see targeted past questions.</p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2db54a] text-sm font-semibold text-[#052e16]">3</div>
              <h4 className="text-md font-medium text-white">Study, practice, and pass</h4>
              <p className="text-sm text-slate-200">Use the Study Hub and CBT simulator to prepare effectively.</p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="mt-12 rounded-lg bg-[#052e16] p-6 text-center sm:p-10">
          <h2 className="text-xl font-semibold text-white">Join hundreds of College of Medicine students already studying smarter</h2>
          <div className="mt-6 flex justify-center">
            <Link
              href="/signup"
              className="inline-block rounded-md bg-[#2db54a] px-6 py-3 text-sm font-semibold text-[#052e16]"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-white/10 bg-[#052e16] px-6 py-6 text-center text-sm text-slate-300 sm:px-8">
        © 2026 EduPrime. Built for Nigerian medical students.
      </footer>
    </div>
  );
}



