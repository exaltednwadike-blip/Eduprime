"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const fieldClass =
  "w-full rounded-[10px] border border-line bg-surface px-3.5 py-3 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";
export const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-5 py-3 text-sm font-medium text-fg transition hover:bg-raised disabled:cursor-not-allowed disabled:opacity-50";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-canvas text-fg lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src="/landing/study-night.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <h2 className="text-3xl font-semibold leading-tight">
            Study smarter.
            <br />
            Pass faster.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/80">
            Past questions, a timed CBT simulator and flashcards, built for medical students.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col">
        <header className="px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <img src="/logo-mark-light.png" alt="" className="h-9 w-auto" />
            <span className="font-heading text-lg font-semibold text-fg">EduPrime</span>
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-12 sm:px-8">
          <h1 className="text-2xl font-semibold text-fg sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function GoogleButton({
  label,
  onClick,
  loading,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className={secondaryButton}>
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
          <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
      )}
      {label}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${fieldClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-fg"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function Notice({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  return (
    <p
      className={`rounded-[10px] px-3.5 py-2.5 text-sm ${
        kind === "error" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"
      }`}
    >
      {children}
    </p>
  );
}