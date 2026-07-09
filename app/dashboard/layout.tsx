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
    if (window.innerWidth < 768) setCollapsed(true);

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/signin");
        setAuthChecked(true);
        return;
      }
      setUser(data.user);
      setAuthChecked(true);
    })();
  }, [router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        router.push("/signin");
      } else if (session) {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    document.documentElement.style.background = theme === "dark" ? "#0a1f0f" : "#f9fafb";
    localStorage.setItem("eduprimeTheme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const value = useMemo(() => ({ theme, toggle }), [theme]);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(" ").filter(Boolean).map((n) => n[0]?.toUpperCase() ?? "").slice(0, 2).join("");
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "?";
  };

  const getFirstName = (name?: string | null, email?: string | null) => {
    if (name) return name.split(" ")[0];
    if (email) return email.split("@")[0];
    return "Student";
  };

  const pageTitle = useMemo(() => {
    const titleMap: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/dashboard/study-hub": "Study Hub",
      "/dashboard/cbt": "CBT Simulator",
      "/dashboard/leaderboard": "Leaderboard",
      "/dashboard/progress": "Progress",
      "/dashboard/notifications": "Notifications",
      "/dashboard/settings": "Settings",
      "/dashboard/profile": "Profile",
    };
    return titleMap[pathname || ""] || "Dashboard";
  }, [pathname]);

  if (!mounted || !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2db54a] border-t-transparent" />
      </div>
    );
  }

  const isDark = theme === "dark";
  const shellBg = isDark ? "bg-[#0a1f0f]" : "bg-[#f9fafb]";
  const shellText = isDark ? "text-white" : "text-gray-900";
  const navBg = isDark ? "bg-[#0f2914]" : "bg-white";
  const navBorder = isDark ? "border-white/10" : "border-gray-200";
  const navIcon = isDark ? "text-white/70 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100";
  const navTitle = isDark ? "text-white" : "text-gray-900";

  return (
    <ThemeContext.Provider value={value}>
      <ToastProvider>
        <div className={`min-h-screen ${shellBg} ${shellText}`}>
          <div className="flex">

            {/* SIDEBAR */}
            <aside
              className={`sticky top-0 z-20 flex h-screen flex-shrink-0 flex-col transition-all duration-200 ${collapsed ? "w-14" : "w-56"}`}
              style={{ background: "#0f2914" }}
            >
              {/* Logo */}
              <div className={`flex h-16 items-center border-b border-white/10 px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
                {!collapsed && (
                  <img src="/logo.png" alt="EduPrime" className="h-9 w-auto" />
                )}
                <button
                  onClick={() => setCollapsed((c) => !c)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"
                >
                  {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
                </button>
              </div>

              {/* Nav items */}
              <nav className="mt-3 flex-1 space-y-0.5 px-2">
                {sidebarItems.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        collapsed ? "justify-center" : "gap-3"
                      } ${active ? "bg-[#2db54a] text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Icon size={18} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}

                {user?.email === ADMIN_EMAIL && (
                  <Link
                    href="/admin"
                    className={`mt-2 flex items-center rounded-lg border border-white/20 px-3 py-2 text-sm font-medium transition-colors ${
                      collapsed ? "justify-center" : "gap-3"
                    } ${pathname?.startsWith("/admin") ? "bg-[#2db54a] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <ShieldAlert size={18} />
                    {!collapsed && <span className="truncate">Admin Panel</span>}
                  </Link>
                )}
              </nav>

              {/* User profile at bottom */}
              {!collapsed && (
                <div className="border-t border-white/10 p-3">
                  <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/10 transition">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2db54a] text-xs font-bold text-white">
                      {getInitials(user?.user_metadata?.full_name, user?.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white capitalize">
                        {getFirstName(user?.user_metadata?.full_name, user?.email)}
                      </p>
                      <p className="text-xs text-white/50">View Profile</p>
                    </div>
                  </Link>
                </div>
              )}

              {collapsed && (
                <div className="border-t border-white/10 p-2">
                  <Link href="/dashboard/profile" className="flex justify-center rounded-lg p-2 hover:bg-white/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2db54a] text-xs font-bold text-white">
                      {getInitials(user?.user_metadata?.full_name, user?.email)}
                    </div>
                  </Link>
                </div>
              )}
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex min-h-screen flex-1 flex-col overflow-hidden">

              {/* Navbar */}
              <header className={`flex h-14 flex-shrink-0 items-center justify-between border-b px-4 sm:px-6 ${navBg} ${navBorder}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCollapsed((c) => !c)} className={`rounded-lg p-1.5 ${navIcon}`}>
                    <Menu size={18} />
                  </button>
                  <h2 className={`text-base font-semibold ${navTitle}`}>{pageTitle}</h2>
                </div>

                <div className="flex items-center gap-2">
                  {/* Theme toggle */}
                  <button onClick={toggle} className={`rounded-lg p-1.5 ${navIcon}`} title="Toggle theme">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>

                  {/* Notification bell */}
                  <button className={`relative rounded-lg p-1.5 ${navIcon}`}>
                    <BellIcon size={18} />
                  </button>

                  {/* Avatar + dropdown arrow */}
                  <Link href="/dashboard/profile" className="flex items-center gap-1.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a5c2a] text-xs font-bold text-white">
                      {getInitials(user?.user_metadata?.full_name, user?.email)}
                    </div>
                    <span className={`hidden sm:block text-sm font-medium ${navTitle} capitalize`}>
                      {getFirstName(user?.user_metadata?.full_name, user?.email)}
                    </span>
                  </Link>
                </div>
              </header>

              {/* Page content */}
              <main className={`flex-1 overflow-auto ${isDark ? "bg-[#0a1f0f]" : "bg-[#f9fafb]"}`}>
                {children}
              </main>
            </div>
          </div>
        </div>
      </ToastProvider>
    </ThemeContext.Provider>
  );
}