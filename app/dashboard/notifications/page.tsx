"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Star, LogIn, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../layout";

type ActivityEntry = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
};

function activityIcon(type: string) {
  switch (type) {
    case "cbt":
      return <CheckCircle2 size={18} className="text-emerald-400" />;
    case "study":
      return <BookOpen size={18} className="text-sky-400" />;
    case "token":
      return <Star size={18} className="text-amber-400" />;
    case "login":
      return <LogIn size={18} className="text-violet-400" />;
    default:
      return <Bell size={18} className="text-slate-400" />;
  }
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) + `, ${time}`;
}

function groupByDay(entries: ActivityEntry[]) {
  const groups: Record<string, ActivityEntry[]> = {};
  entries.forEach((entry) => {
    const dateKey = new Date(entry.created_at).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  });
  return groups;
}

function dayLabel(dateKey: string) {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const pushMergedEntry = (items: any[], type: string, title: string, description: string | null, created_at: string) => {
    if (!items) return;
    items.forEach((item) => {
      if (!item) return;
      setActivity((prev) => [
        ...prev,
        {
          id: item.id || `${type}-${Math.random().toString(36).slice(2)}`,
          type,
          title: title.replace("{name}", item.sender_name || item.name || "A learner"),
          description: description?.replace("{name}", item.sender_name || item.name || "A learner") || null,
          created_at: item.created_at || created_at,
        },
      ]);
    });
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchActivity = async () => {
      setLoading(true);
      try {
        const [{ data: regularData }, { data: waveData }, { data: followData }, { data: badgeData }] = await Promise.all([
          supabase.from("user_activity").select("id, type, title, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
          supabase.from("user_waves").select("id, sender_name, created_at").eq("receiver_id", user.id).order("created_at", { ascending: false }),
          supabase.from("user_follows").select("id, follower_name, created_at").eq("following_id", user.id).order("created_at", { ascending: false }),
          supabase.from("user_badges").select("id, badge_name, earned_at").eq("user_id", user.id).order("earned_at", { ascending: false }),
        ]);

        const merged = [
          ...(regularData || []).map((entry: any) => ({ ...entry, source: "activity" })),
          ...(waveData || []).map((entry: any) => ({
            id: entry.id,
            type: "wave",
            title: `${entry.sender_name || "A learner"} waved at you`,
            description: "You received a social wave.",
            created_at: entry.created_at,
            source: "wave",
          })),
          ...(followData || []).map((entry: any) => ({
            id: entry.id,
            type: "follow",
            title: `${entry.follower_name || "A learner"} started following you`,
            description: "You gained a new follower.",
            created_at: entry.created_at,
            source: "follow",
          })),
          ...(badgeData || []).map((entry: any) => ({
            id: entry.id,
            type: "badge",
            title: `New badge earned: ${entry.badge_name || "Achievement"}`,
            description: "You unlocked a badge in your profile.",
            created_at: entry.earned_at,
            source: "badge",
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setActivity(merged.slice(0, 50));
      } catch (error) {
        console.error("Unable to load notifications:", error);
        setActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  const grouped = useMemo(() => groupByDay(activity), [activity]);
  const dayKeys = useMemo(() => Object.keys(grouped), [grouped]);

  // ---- theme tokens ----
  const cardBg = isDark ? "bg-[#0d2417] border border-white/5" : "bg-white border border-gray-200";
  const cardShadow = isDark ? "shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const heading = isDark ? "text-white" : "text-gray-900";
  const iconBg = isDark ? "bg-white/5" : "bg-gray-100";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className={`flex items-center gap-2 text-lg font-semibold sm:text-xl ${heading}`}>
          <Bell size={20} className="text-[#22c55e]" /> Notifications
        </h1>
        <p className={`mt-1 text-xs sm:text-sm ${muted}`}>Your recent activity across EduPrime.</p>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#16a34a]" />
        </div>
      ) : activity.length === 0 ? (
        <div className={`rounded-xl ${cardBg} p-8 text-center ${cardShadow}`}>
          <Bell size={28} className={`mx-auto opacity-40 ${muted}`} />
          <p className={`mt-3 text-sm font-medium ${heading}`}>No notifications yet</p>
          <p className={`mt-1 text-xs ${muted}`}>Complete a CBT exam or study session to see activity here.</p>
        </div>
      ) : (
        dayKeys.map((dayKey) => (
          <div key={dayKey}>
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${muted}`}>{dayLabel(dayKey)}</p>
            <div className={`overflow-hidden rounded-xl ${cardBg} ${cardShadow}`}>
              {grouped[dayKey].map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3.5 sm:p-4 ${
                    idx !== grouped[dayKey].length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                    {activityIcon(item.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${heading}`}>{item.title}</p>
                    {item.description && <p className={`mt-0.5 text-xs ${muted}`}>{item.description}</p>}
                  </div>
                  <span className={`flex-shrink-0 whitespace-nowrap text-[11px] ${muted}`}>
                    {new Date(item.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}