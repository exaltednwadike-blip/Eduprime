"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ToastProvider } from "@/components/ToastContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Monitor, Trophy, BarChart2, Bell as BellIcon, Settings as SettingsIcon, User, ShieldAlert, Menu, ChevronLeft, Sun, Moon } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "exaltednwadike@gmail.com";

type Theme = "dark" | "light";

const ThemeContext = createContext({
  theme: "dark" as Theme,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const sidebarItems = [
  { key: "home", label: "Home", href: "/dashboard", icon: Home },
  { key: "study-hub", label: "Study Hub", href: "/dashboard/study-hub", icon: BookOpen },
  { key: "cbt", label: "CBT Simulator", href: "/dashboard/cbt", icon: Monitor },
  { key: "leaderboard", label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  { key: "progress", label: "Progress", href: "/dashboard/progress", icon: BarChart2 },
  { key: "notifications", label: "Notifications", href: "/dashboard/notifications", icon: BellIcon },
  { key: "settings", label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
  { key: "profile", label: "Profile", href: "/dashboard/profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeTheme");
    if (stored === "light" || stored === "dark") setTheme(stored);
    setMounted(true);
    // default collapsed on mobile
    if (window.innerWidth < 768) setCollapsed(true);

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/signin');
        setAuthChecked(true);
        return;
      }
      setUser(data.user);
      setAuthChecked(true);
    })();
  }, [router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        router.push('/signin');
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    document.documentElement.style.background = theme === "dark" ? "#052e16" : "#f8fafc";
    localStorage.setItem("eduprimeTheme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const value = useMemo(() => ({ theme, toggle }), [theme]);

  const handleToggleSidebar = () => setCollapsed((c) => !c);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "?";
  };

  if (!mounted) return null;

  const textColor = theme === "dark" ? "text-white" : "text-[#052e16]";
  const bgColor = theme === "dark" ? "bg-[#052e16]" : "bg-[#f8fafc]";
  const panelBg = theme === "dark" ? "bg-[#064e23]" : "bg-white";

  return (
    <ThemeContext.Provider value={value}>
      <ToastProvider>
        <div className={`${bgColor} min-h-screen ${textColor}`}>
          <div className="flex">
          <aside
            className={`sticky top-0 z-20 h-screen flex-shrink-0 transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}
            style={{ background: "#052e16" }}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <div className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
                <div className="text-2xl font-bold tracking-tight">
                  <span className="text-white">Edu</span>
                  {!collapsed && <span className="text-[#16a34a]">Prime</span>}
                </div>
              </div>
              <button
                aria-label="Toggle sidebar"
                onClick={handleToggleSidebar}
                className="hidden md:inline-flex items-center justify-center rounded-full p-2 text-white/80 hover:bg-white/5"
              >
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
                    className={`group mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/5 ${
                      active ? "bg-[#16a34a] text-[#052e16]" : "text-slate-200"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center`}>
                      <Icon />
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
              {user?.email === ADMIN_EMAIL && (
                <Link
                  href="/admin"
                  className={`group mt-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/5 ${
                    pathname === "/admin" ? "bg-[#16a34a] text-[#052e16]" : "text-slate-200"
                  }`}
                >
                  <ShieldAlert />
                  {!collapsed && <span className="truncate">Admin Panel</span>}
                </Link>
              )}
            </nav>

            <div className="mt-auto px-4 py-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCollapsed((c) => !c)}
                  className="inline-flex items-center justify-center rounded-full bg-white/5 p-2 text-white/80"
                >
                  <Menu size={16} />
                </button>
                {!collapsed && (
                  <button
                    onClick={toggle}
                    className="ml-2 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm"
                  >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    <span className="text-slate-200">{theme === "dark" ? "Dark" : "Light"}</span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          <div className="flex min-h-screen flex-1 flex-col">
            <header className={`flex h-16 items-center justify-between px-6 ${panelBg} border-b border-white/5`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCollapsed((c) => !c)}
                  className="md:hidden inline-flex items-center justify-center rounded-full bg-white/5 p-2 text-white/80"
                >
                  <Menu size={18} />
                </button>
                <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <span className={theme === "dark" ? "text-white" : "text-[#052e16]"}>Edu</span>
                  <span className="text-[#16a34a]">Prime</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="rounded-full p-2 text-slate-300 hover:bg-white/5">
                  <BellIcon />
                </button>
                <div
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-white"
                  title={user?.email || "User"}
                >
                  {getInitials(user?.user_metadata?.full_name, user?.email)}
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-6 sm:p-8">{children}</main>
          </div>
        </div>
      </div>
      </ToastProvider>
    </ThemeContext.Provider>
  );
}



