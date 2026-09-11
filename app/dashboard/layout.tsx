"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ToastProvider } from "@/components/ToastContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Monitor, Users, BarChart2, Bell as BellIcon, Settings as SettingsIcon, User, ShieldAlert, Menu, X, Sun, Moon, BookMarked } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setOffline, updatePresence } from "@/lib/presence";

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
  { key: "community", label: "Community", href: "/dashboard/community", icon: Users },
  { key: "progress", label: "Progress", href: "/dashboard/progress", icon: BarChart2 },
  { key: "notifications", label: "Notifications", href: "/dashboard/notifications", icon: BellIcon },
  { key: "settings", label: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
  { key: "profile", label: "Profile", href: "/dashboard/profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("dark");

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
    document.documentElement.style.background = theme === "dark" ? "#0a1f0f" : "#f9fafb";
    localStorage.setItem("eduprimeTheme", theme);
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
      "/dashboard/community": "Community",
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

  const SidebarContent = () => (
    <div className="flex h-full flex-col" style={{ background: "#0f2914" }}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-3">
        <img src="/logo.png" alt="EduPrime" className="h-9 w-auto" />
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2">
        {sidebarItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-[#2db54a] text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
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
            className={`mt-2 flex items-center gap-3 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium transition-colors ${
              pathname?.startsWith("/admin") ? "bg-[#2db54a] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ShieldAlert size={18} />
            <span className="truncate">Admin Panel</span>
          </Link>
        )}
      </nav>

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
    </div>
  );

  return (
    <ThemeContext.Provider value={value}>
      <ToastProvider>
        <div className={`min-h-screen ${shellBg} ${shellText}`}>
          <div className="flex">

            {/* Desktop sidebar */}
            {!isMobile && (
              <aside className="sticky top-0 z-20 h-screen w-56 flex-shrink-0">
                <SidebarContent />
              </aside>
            )}

            {/* Mobile sidebar overlay */}
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
              <header className={`flex h-14 flex-shrink-0 items-center justify-between border-b px-4 sm:px-6 ${navBg} ${navBorder}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSidebarOpen((o) => !o)} className={`rounded-lg p-1.5 ${navIcon}`}>
                    <Menu size={18} />
                  </button>
                  <h2 className={`text-base font-semibold ${navTitle}`}>{pageTitle}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={toggle} className={`rounded-lg p-1.5 ${navIcon}`} title="Toggle theme">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <Link href="/dashboard/notifications" className={`relative rounded-lg p-1.5 ${navIcon}`}>
                    <BellIcon size={18} />
                    {notificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#16a34a] px-1 text-[10px] font-bold text-white">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
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
