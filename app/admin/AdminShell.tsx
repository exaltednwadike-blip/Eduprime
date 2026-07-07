"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, List, UploadCloud, Menu, ChevronLeft, Layers, Tag, ArrowLeft } from "lucide-react";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: Home },
  { key: "subjects", label: "Subjects", href: "/admin/subjects", icon: BookOpen },
  { key: "categories", label: "Categories", href: "/admin/categories", icon: Layers },
  { key: "topics", label: "Topics", href: "/admin/topics", icon: Tag },
  { key: "questions", label: "Questions", href: "/admin/questions", icon: List },
  { key: "bulk-upload", label: "Bulk Upload", href: "/admin/bulk-upload", icon: UploadCloud },
];

export function AdminShell({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#052e16] text-white">
      <div className="flex">
        <aside className={`sticky top-0 z-20 h-screen flex-shrink-0 transition-all duration-200 ${collapsed ? "w-16" : "w-72"}`} style={{ background: "#052e16" }}>
          <div className="flex h-16 items-center justify-between px-4">
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
              <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                <img src="/logo.png" alt="EduPrime logo" className="h-8 w-8 rounded-full object-cover" />
                {!collapsed && (
                  <span className="flex items-center gap-1">
                    <span className="text-white">Edu</span>
                    <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">Prime Admin</span>
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setCollapsed((c) => !c)} className="inline-flex items-center justify-center rounded-full p-2 text-white/80 hover:bg-white/5">
              {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className="mt-4 px-2">
            {sidebarItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon as any;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors hover:bg-white/5 ${
                    active ? "bg-[#16a34a] text-[#052e16]" : "text-slate-200"
                  }`}
                >
                  <Icon />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-2 pb-4">
            <Link
              href="/dashboard"
              className={`flex items-center rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 ${collapsed ? "justify-center" : "gap-2"}`}
            >
              <ArrowLeft size={16} />
              {!collapsed && <span className="truncate">Back to Dashboard</span>}
            </Link>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col bg-[#081021]">
          <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
            <div className="text-lg font-semibold text-white">EduPrime Admin</div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div>{userEmail}</div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 sm:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
