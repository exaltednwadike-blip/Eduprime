"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, List, UploadCloud, Menu, ChevronLeft, Layers, Tag, ArrowLeft, X } from "lucide-react";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSidebarToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  return (
    <div className="min-h-screen bg-[#052e16] text-white">
      <div className="flex">

        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 flex-shrink-0 flex-col transition-transform duration-200 md:sticky md:top-0 md:z-20 md:translate-x-0 md:transition-all ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${collapsed ? "md:w-14" : "md:w-60"}`}
          style={{ background: "#052e16" }}
        >
          <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 px-3">
            <div className={`flex min-w-0 items-center gap-2 ${collapsed ? "md:w-full md:justify-center" : ""}`}>
              <img src="/logo.png" alt="EduPrime logo" className="h-6 w-6 flex-shrink-0 rounded-full object-cover" />
              <span className={`truncate text-sm font-bold tracking-tight ${collapsed ? "md:hidden" : ""}`}>
                <span className="text-white">Edu</span>
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                  Prime Admin
                </span>
              </span>
            </div>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-white/80 hover:bg-white/5 md:inline-flex"
            >
              {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex-shrink-0 items-center justify-center rounded-lg p-1.5 text-white/80 hover:bg-white/5 md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2">
            {sidebarItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-white/5 ${
                    collapsed ? "md:justify-center md:gap-0" : ""
                  } ${active ? "bg-[#16a34a] text-[#052e16] font-semibold" : "text-slate-200"}`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-2 pb-3">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-lg border border-white/20 px-2.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 ${
                collapsed ? "md:justify-center md:gap-0" : ""
              }`}
            >
              <ArrowLeft size={14} className="flex-shrink-0" />
              <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Back to Dashboard</span>
            </Link>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col bg-[#081021]">
          <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 px-3 sm:h-14 sm:px-6">
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleSidebarToggle}
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-white/80 hover:bg-white/10"
              >
                <Menu size={16} />
              </button>
              <div className="text-sm font-semibold text-white sm:text-base">EduPrime Admin</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="max-w-[100px] truncate sm:max-w-[200px]">{userEmail}</div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-3 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}