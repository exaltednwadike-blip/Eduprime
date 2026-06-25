"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, List, UploadCloud, Menu, ChevronLeft } from "lucide-react";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: Home },
  { key: "subjects", label: "Subjects", href: "/admin/subjects", icon: BookOpen },
  { key: "questions", label: "Questions", href: "/admin/questions", icon: List },
  { key: "bulk-upload", label: "Bulk Upload", href: "/admin/bulk-upload", icon: UploadCloud },
];

export function AdminShell({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="flex">
        <aside className={`sticky top-0 z-20 h-screen flex-shrink-0 transition-all duration-200 ${collapsed ? "w-16" : "w-72"}`} style={{ background: "#0f172a" }}>
          <div className="flex h-16 items-center justify-between px-4">
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-white">Edu</span>
                {!collapsed && <span className="text-[#f59e0b]">Prime Admin</span>}
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
                    active ? "bg-[#f59e0b] text-[#0f172a]" : "text-slate-200"
                  }`}
                >
                  <Icon />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
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
