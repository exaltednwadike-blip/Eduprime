"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Tag,
  List,
  UploadCloud,
  ArrowLeft,
  BookMarked,
  Menu,
  X,
  ListChecks,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/topics", label: "Topics", icon: Tag },
  { href: "/admin/questions", label: "Questions", icon: List },
  { href: "/admin/flashcards", label: "Flashcards", icon: BookMarked },
  { href: "/admin/bulk-upload", label: "Bulk Upload", icon: UploadCloud },
  { href: "/admin/subject-tagging", label: "Subject tagging", icon: ListChecks },
];

export function AdminShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeTheme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.background = theme === "dark" ? "#0B1210" : "#F6F8F7";
    localStorage.setItem("eduprimeTheme", theme);
    return () => document.documentElement.removeAttribute("data-theme");
  }, [theme]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && !!pathname?.startsWith(href + "/"));

  const SidebarContent = () => (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-2">
          <img
            src={theme === "dark" ? "/logo-mark-dark.png" : "/logo-mark-light.png"}
            alt="EduPrime"
            className="h-9 w-auto"
          />
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-fg"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-primary-soft font-semibold text-primary" : "text-muted hover:bg-raised hover:text-fg"
              }`}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-line p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted transition hover:bg-raised hover:text-fg"
        >
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </Link>
        <p className="truncate px-2 text-xs text-muted">{userEmail}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas text-fg">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="sticky top-0 z-20 h-screen w-56 flex-shrink-0">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile sidebar */}
      {isMobile && sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 z-40 h-full w-64 shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-fg"
            >
              <Menu size={20} />
            </button>
          )}
          <span className="text-base font-semibold text-fg">EduPrime Admin</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden max-w-xs truncate text-xs text-muted sm:block">{userEmail}</span>
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="rounded-lg p-2 text-muted transition hover:bg-raised hover:text-fg"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-canvas">{children}</main>
      </div>
    </div>
  );
}