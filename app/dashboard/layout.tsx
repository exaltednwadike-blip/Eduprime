"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ToastProvider } from "@/components/ToastContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Monitor, Users, BarChart2, Bell as BellIcon, Settings as SettingsIcon, User, ShieldAlert, X, Sun, Moon, BookMarked, Trophy, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setOffline, updatePresence } from "@/lib/presence";
import GuidedTour from "@/components/GuidedTour";

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
  { key: "flashcards", label: "Flashcards", href: "/dashboard/flashcards", icon: BookMarked },
  { key: "people", label: "People", href: "/dashboard/people", icon: Users },
  { key: "leaderboard", label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  { key: "progress", label: "Progress", href: "/dashboard/progress", icon: BarChart2 },
  { key: "notifications", label: "Notifications", href: "/dashboard/notifications", icon: BellIcon },
  { key: "settings", label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
  { key: "profile", label: "Profile", href: "/dashboard/profile", icon: User },
];

const tabItems = [
  { key: "home", label: "Home", href: "/dashboard", icon: Home },
  { key: "study-hub", label: "Study", href: "/dashboard/study-hub", icon: BookOpen },
  { key: "cbt", label: "CBT", href: "/dashboard/cbt", icon: Monitor },
  { key: "flashcards", label: "Cards", href: "/dashboard/flashcards", icon: BookMarked },
];

const isActivePath = (pathname: string | null, href: string) =>
  pathname === href || (href !== "/dashboard" && !!pathname?.startsWith(href + "/"));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeTheme");
    if (stored === "light" || stored === "dark") setTheme(stored);
    setMounted(true);

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/signin");
        setAuthChecked(true);
        return;
      }
      setUser(data.user);
      const { data: adminData } = await supabase
        .from("admins")
        .select("email")
        .eq("email", data.user.email)
        .single();
      setIsAdmin(!!adminData);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("onboarded, tour_done, level")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileData && !profileData.onboarded) {
        router.replace("/onboarding");
        return;
      }
      if (profileData?.onboarded && profileData.level) {
        localStorage.setItem("eduprimeLevel", `${profileData.level} Level`);
      }
      setShowTour(!!profileData?.onboarded && !profileData?.tour_done);
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
    if (!user) return;

    const syncPresenceAndCount = async () => {
      await updatePresence(supabase, user.id, pathname || undefined);

      const [wavesRes, followsRes] = await Promise.all([
        supabase.from("user_waves").select("id").eq("receiver_id", user.id),
        supabase.from("user_follows").select("id").eq("following_id", user.id),
      ]);

      setNotificationCount((wavesRes.data?.length || 0) + (followsRes.data?.length || 0));
    };

    syncPresenceAndCount();
    const interval = setInterval(syncPresenceAndCount, 60000);

    const presenceChannel = supabase.channel("presence");
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        // keep the channel active for online user tracking without altering the rest of the dashboard
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      clearInterval(interval);
      setOffline(supabase, user.id);
      presenceChannel.unsubscribe();
    };
  }, [user, pathname]);

  useEffect(() => {
    document.documentElement.style.background = theme === "dark" ? "#0B1210" : "#F6F8F7";
    localStorage.setItem("eduprimeTheme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => document.documentElement.removeAttribute("data-theme");
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const value = useMemo(() => ({ theme, toggle }), [theme]);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(" ").filter(Boolean).map((n) => n[0]?.toUpperCase() ?? "").slice(0, 2).join("");
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
      "/dashboard/flashcards": "Flashcards",
      "/dashboard/people": "People",
      "/dashboard/leaderboard": "Leaderboard",
      "/dashboard/progress": "Progress",
      "/dashboard/notifications": "Notifications",
      "/dashboard/settings": "Settings",
      "/dashboard/profile": "Profile",
    };
    const path = pathname || "";
    if (titleMap[path]) return titleMap[path];
    const match = Object.keys(titleMap)
      .filter((key) => key !== "/dashboard" && path.startsWith(key + "/"))
      .sort((a, b) => b.length - a.length)[0];
    return match ? titleMap[match] : "Dashboard";
  }, [pathname]);

  if (!mounted || !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isDark = theme === "dark";

  const SidebarContent = () => (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-line px-3">
        <img src={isDark ? "/logo-mark-dark.png" : "/logo-mark-light.png"} alt="EduPrime" className="h-9 w-auto" />
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-raised hover:text-fg">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2">
        {sidebarItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              data-tour={item.key} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-primary-soft font-semibold text-primary" : "text-muted hover:bg-raised hover:text-fg"
              }`}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`mt-2 flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm font-medium transition-colors ${
              pathname?.startsWith("/admin") ? "bg-primary-soft text-primary" : "text-muted hover:bg-raised hover:text-fg"
            }`}
          >
            <ShieldAlert size={18} />
            <span className="truncate">Admin Panel</span>
          </Link>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-raised">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            {getInitials(user?.user_metadata?.full_name, user?.email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold capitalize text-fg">
              {getFirstName(user?.user_metadata?.full_name, user?.email)}
            </p>
            <p className="text-xs text-muted">View Profile</p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <ThemeContext.Provider value={value}>
      <ToastProvider>
        <div className="min-h-screen bg-canvas text-fg">
          <div className="flex">

            {/* Desktop sidebar */}
            {!isMobile && (
              <aside className="sticky top-0 z-20 h-screen w-56 flex-shrink-0">
                <SidebarContent />
              </aside>
            )}

            {/* Mobile menu drawer */}
            {isMobile && sidebarOpen && (
              <>
                <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setSidebarOpen(false)} />
                <aside className="fixed left-0 top-0 z-40 h-full w-64 shadow-xl">
                  <SidebarContent />
                </aside>
              </>
            )}

            {/* Main content */}
            <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
              <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
                <h2 className="text-base font-semibold text-fg">{pageTitle}</h2>

                <div className="flex items-center gap-1">
                  <button onClick={toggle} className="rounded-lg p-2 text-muted transition hover:bg-raised hover:text-fg" title="Toggle theme">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <Link href="/dashboard/notifications" className="relative rounded-lg p-2 text-muted transition hover:bg-raised hover:text-fg">
                    <BellIcon size={18} />
                    {notificationCount > 0 && (
                      <span className="absolute right-0 top-0 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/dashboard/profile" className="ml-1 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                      {getInitials(user?.user_metadata?.full_name, user?.email)}
                    </div>
                    <span className="hidden text-sm font-medium capitalize text-fg sm:block">
                      {getFirstName(user?.user_metadata?.full_name, user?.email)}
                    </span>
                  </Link>
                </div>
              </header>

              <main className={`flex-1 overflow-auto bg-canvas ${isMobile ? "pb-20" : ""}`}>
                {children}
              </main>
            </div>
          </div>

          {/* Mobile bottom tab bar */}
          {isMobile && (
            <nav
              className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface px-1 pt-1.5"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {tabItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    data-tour={`tab-${item.key}`} className={`flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                data-tour="tab-more" onClick={() => setSidebarOpen(true)}
                className="flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] font-medium text-muted"
              >
                <MoreHorizontal size={20} />
                More
              </button>
            </nav>
          )}
        </div>
        {showTour && pathname === "/dashboard" && user && (
          <GuidedTour userId={user.id} isMobile={isMobile} onDone={() => setShowTour(false)} />
        )}
      </ToastProvider>
    </ThemeContext.Provider>
  );
}