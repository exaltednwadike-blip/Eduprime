"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ToastProvider } from "@/components/ToastContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Monitor, Trophy, BarChart2, Bell as BellIcon, Settings as SettingsIcon, User, ShieldAlert, Menu, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "exaltednwadike@gmail.com";

type Theme = "dark" | "light";

const ThemeContext = createContext({
  theme: "light" as Theme,
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
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeTheme");
    if (stored === "light" || stored === "dark") setTheme(stored);
    setMounted(true);
    if (window.innerWidth < 768) setCollapsed(true);

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/signin");
        return;
      }
      setUser(data.user);
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
    document.documentElement.style.background = theme === "dark" ? "#0d1f12" : "#f9fafb";
    localStorage.setItem("eduprimeTheme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const value = useMemo(() => ({ theme, toggle }), [theme]);

  const handleToggleSidebar = () => setCollapsed((c) => !c);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("");
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "?";
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

    if (titleMap[pathname || ""])
      return titleMap[pathname || ""];

    const segment = (pathname || "").replace("/dashboard/", "").replace("/dashboard", "");
    if (!segment) return "Dashboard";

    return segment
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [pathname]);

  if (!mounted) return null;

  const shellBg = theme === "dark" ? "bg-[#0d1f12]" : "bg-[#f9fafb]";
  const shellText = theme === "dark" ? "text-white" : "text-[#111827]";
  const navbarBg = theme === "dark" ? "bg-[#1a2e1e]" : "bg-white";
  const navbarBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const navbarIcon = theme === "dark" ? "text-white/80 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100";
  const contentBg = theme === "dark" ? "bg-[#0d1f12]" : "bg-[#f9fafb]";

  return (
    <ThemeContext.Provider value={value}>
      <ToastProvider>
        <div className={`min-h-screen ${shellBg} ${shellText}`}>
          <div className="flex">
            <aside
              className={`sticky top-0 z-20 h-screen flex-shrink-0 transition-all duration-200 ${collapsed ? "w-14" : "w-56"}`}
              style={{ background: "#1a5c2a" }}
            >
              <div className={`flex h-14 items-center ${collapsed ? "justify-center" : "justify-between"} px-3`}>
                {!collapsed && (
                  <div className="flex items-center">
                    <img src="/logo.png" alt="EduPrime" className="h-8 w-auto" />
                  </div>
                )}
                <button
                  aria-label="Toggle sidebar"
                  onClick={handleToggleSidebar}
                  className="inline-flex items-center justify-center rounded-full p-2 text-white hover:bg-white/10"
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
                      className={`group mb-1 flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        collapsed ? "justify-center" : "gap-3"
                      } ${active ? "bg-white font-semibold text-[#1a5c2a]" : "text-white/80 hover:bg-white/10"}`}
                    >
                      <span className="inline-flex items-center justify-center">
                        <Icon size={18} />
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
                {user?.email === ADMIN_EMAIL && (
                  <Link
                    href="/admin"
                    className={`group mt-3 flex items-center rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium transition-colors ${
                      collapsed ? "justify-center" : "gap-3"
                    } ${pathname === "/admin" ? "bg-white font-semibold text-[#1a5c2a]" : "text-white/80 hover:bg-white/10"}`}
                  >
                    <ShieldAlert size={18} />
                    {!collapsed && <span className="truncate">Admin Panel</span>}
                  </Link>
                )}
              </nav>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col">
              <header className={`flex h-14 items-center justify-between border-b px-4 sm:px-6 ${navbarBg} ${navbarBorder}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCollapsed((c) => !c)}
                    className={`inline-flex items-center justify-center rounded-full p-2 ${navbarIcon}`}
                  >
                    <Menu size={18} />
                  </button>
                  <h2 className="text-base font-semibold">{pageTitle}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <button className={`rounded-full p-2 ${navbarIcon}`}>
                    <BellIcon size={18} />
                  </button>
                  <div
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a5c2a] text-sm font-semibold text-white"
                    title={user?.email || "User"}
                  >
                    {getInitials(user?.user_metadata?.full_name, user?.email)}
                  </div>
                </div>
              </header>

              <main className={`flex-1 overflow-auto p-4 sm:p-6 lg:p-8 ${contentBg}`}>{children}</main>
            </div>
          </div>
        </div>
      </ToastProvider>
    </ThemeContext.Provider>
  );
}


