"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Layers, Tag, List, UploadCloud, ArrowLeft, BookMarked } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/topics", label: "Topics", icon: Tag },
  { href: "/admin/questions", label: "Questions", icon: List },
  { href: "/admin/flashcards", label: "Flashcards", icon: BookMarked },
  { href: "/admin/bulk-upload", label: "Bulk Upload", icon: UploadCloud },
];

export function AdminShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0a1f0f]">
      <aside className="sticky top-0 z-20 flex h-screen w-56 flex-shrink-0 flex-col border-r border-white/10" style={{ background: "#0f2914" }}>
        <div className="flex h-16 items-center border-b border-white/10 px-4">
          <img src="/logo.png" alt="EduPrime" className="h-9 w-auto" />
          <span className="ml-2 text-sm font-bold text-[#2db54a]">Admin</span>
        </div>

        <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-[#2db54a] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <p className="truncate px-2 text-xs text-white/40">{userEmail}</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b border-white/10 bg-[#0f2914] px-6">
          <span className="text-base font-semibold text-white">EduPrime Admin</span>
        </header>
        <main className="flex-1 overflow-auto bg-[#0a1f0f]">
          {children}
        </main>
      </div>
    </div>
  );
}
