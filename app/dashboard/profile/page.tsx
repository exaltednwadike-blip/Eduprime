"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";
import { Camera, ClipboardList, Monitor, Trophy, Sparkles, Settings, Loader2, Lock, Award, Download, Star } from "lucide-react";

export default function ProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<string>("");
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [cbtTestsTaken, setCbtTestsTaken] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [presence, setPresence] = useState<string>("Offline");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeLevel");
    if (stored) setLevel(stored);

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);

      const [
        { data: attemptsData },
        { data: cbtData },
        { data: badgeData },
        { data: certificateData },
        { data: badgeCatalogData },
        { data: earnedBadgeData },
        { data: profileData },
        { data: topicData },
        { data: followData },
        { data: followerData },
        { data: presenceData },
      ] = await Promise.all([
        supabase.from("question_attempts").select("id").eq("user_id", user.id),
        supabase.from("cbt_results").select("percentage").eq("user_id", user.id),
        supabase.from("user_badges").select("id, badge_name, badge_description, badge_icon, earned_at").eq("user_id", user.id).order("earned_at", { ascending: false }),
        supabase.from("topic_completions").select("id, topic_id, topic_name, percentage, completed_at, topics(name)").eq("user_id", user.id).order("completed_at", { ascending: false }),
        supabase.from("badges").select("id, name, description, icon").order("name"),
        supabase.from("user_badges").select("id, badge_id, badge_name, badge_description, badge_icon, earned_at").eq("user_id", user.id).order("earned_at", { ascending: false }),
        supabase.from("profiles").select("avatar_url, username, bio").eq("id", user.id).maybeSingle(),
        supabase.from("topics").select("id, name"),
        supabase.from("user_follows").select("id").eq("following_id", user.id),
        supabase.from("user_follows").select("id").eq("follower_id", user.id),
        supabase.from("user_presence").select("is_online, last_seen").eq("user_id", user.id).maybeSingle(),
      ]);

      setQuestionsAnswered(attemptsData?.length || 0);
      setCbtTestsTaken(cbtData?.length || 0);
      setBadges(badgeData || []);
      setAvatarUrl(profileData?.avatar_url || null);
      setUsername(profileData?.username || user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "student");
      setBio(profileData?.bio || "Study smarter, stay consistent, and keep growing.");
      setFollowers(followerData?.length || 0);
      setFollowing(followData?.length || 0);
      setPresence(presenceData?.is_online ? "Online" : "Offline");
      setAllBadges(badgeCatalogData || []);
      setUserBadges(earnedBadgeData || []);

      const topicNameById = (topicData || []).reduce((map: Record<string, string>, topic: any) => {
        map[topic.id] = topic.name;
        return map;
      }, {});

      const normalizedCertificates = (certificateData || []).map((item: any) => ({
        ...item,
        topic_name: item?.topics?.name || item?.topic_name || topicNameById[item?.topic_id] || "Completed topic",
      }));
      setCertificates(normalizedCertificates);

      if (cbtData && cbtData.length > 0) {
        const avg = cbtData.reduce((sum: number, r: any) => sum + Number(r.percentage || 0), 0) / cbtData.length;
        setAverageScore(Math.round(avg));
      } else {
        setAverageScore(0);
      }

      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const initials = (name?: string | null, email?: string | null) => {
    if (name) return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return "?";
  };

  const displayName = useMemo(() => {
    const rawName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
    return rawName
      .split(" ")
      .filter(Boolean)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }, [user]);

  const earnedBadgeSet = useMemo(() => {
    return new Set(
      (userBadges || []).map((badge: any) => badge.badge_id || badge.badge_name || badge.name || badge.id)
    );
  }, [userBadges]);

  const availableEarnedBadges = useMemo(
    () => (allBadges || []).filter((badge: any) => earnedBadgeSet.has(badge.id) || earnedBadgeSet.has(badge.name)),
    [allBadges, earnedBadgeSet]
  );

  const availableLockedBadges = useMemo(
    () => (allBadges || []).filter((badge: any) => !earnedBadgeSet.has(badge.id) && !earnedBadgeSet.has(badge.name)),
    [allBadges, earnedBadgeSet]
  );

  const lockedBadges = [
    { badge_name: "Study Starter", badge_description: "Answer 10 questions to unlock this badge.", badge_icon: "✨" },
    { badge_name: "Streak Igniter", badge_description: "Maintain a 3-day study streak to unlock this badge.", badge_icon: "🔥" },
    { badge_name: "Exam Ready", badge_description: "Take 3 CBT exams to unlock this badge.", badge_icon: "🧠" },
    { badge_name: "Top Scorer", badge_description: "Reach 80% in your best CBT score to unlock this badge.", badge_icon: "🏆" },
  ];

  const generateCertificate = (topic: any) => {
    const win = window.open("", "_blank");
    if (!win) return;

    const score = topic.percentage ?? 0;
    const date = new Date(topic.completed_at).toLocaleDateString();
    const printHtml = `
      <html>
        <head>
          <title>EduPrime Certificate</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
            .certificate { max-width: 760px; margin: 40px auto; border: 2px solid #16a34a; border-radius: 18px; padding: 40px; background: white; }
            .logo { text-align: center; color: #166534; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 12px; }
            h1 { text-align: center; color: #166534; margin-bottom: 12px; }
            p { text-align: center; font-size: 18px; }
            h2 { text-align: center; font-size: 32px; margin: 0; }
            h3 { text-align: center; font-size: 26px; color: #15803d; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="logo">EduPrime</div>
            <h1>EduPrime Certificate of Completion</h1>
            <p>This certifies that</p>
            <h2>${displayName}</h2>
            <p>has successfully completed</p>
            <h3>${topic.topic_name}</h3>
            <p>with a score of <strong>${score}%</strong> on ${date}</p>
          </div>
        </body>
      </html>
    `;

    win.document.write(printHtml);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);

    try {
      const filePath = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatar = publicUrlData?.publicUrl;

      if (!avatar) throw new Error("Avatar URL not available");

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: avatar }, { onConflict: "id" });

      if (updateError) throw updateError;

      setAvatarUrl(avatar);
    } catch (error) {
      console.error("Avatar upload failed:", error);
    } finally {
      setUploadingAvatar(false);
      if (event.target) event.target.value = "";
    }
  };

  const openAvatarPicker = () => fileInputRef.current?.click();

  // ---- theme tokens ----
  const cardBg = isDark ? "bg-[#0d2417] border border-white/5" : "bg-white border border-gray-200";
  const cardShadow = isDark ? "shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "shadow-sm";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const heading = isDark ? "text-white" : "text-gray-900";
  const bannerBg = isDark ? "bg-[#0f3d20]" : "bg-white";
  const avatarBg = isDark ? "bg-white/10" : "bg-emerald-50";
  const levelPill = isDark ? "bg-[#123821] text-[#22c55e]" : "bg-emerald-50 text-emerald-600";

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {/* Profile header */}
      <div className={`rounded-2xl border ${isDark ? "border-white/10 " + bannerBg : "border-gray-200 " + bannerBg} p-4 sm:p-6`}>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="relative">
            <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold ${avatarBg} ${heading}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                initials(user?.user_metadata?.full_name, user?.email)
              )}
            </div>
            <button
              type="button"
              onClick={openAvatarPicker}
              className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border ${isDark ? "border-[#0d2417] bg-[#16a34a] text-white" : "border-white bg-[#16a34a] text-white"}`}
              aria-label="Upload profile photo"
            >
              {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-xl font-semibold sm:text-2xl ${heading}`}>{displayName}</h2>
            <p className={`truncate text-sm ${muted}`}>{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${levelPill}`}>
                {level || "Level not set"}
              </span>
              <Link
                href="/dashboard/settings"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isDark ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Settings size={12} />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: "Questions Answered", value: loading ? "..." : questionsAnswered, icon: ClipboardList, color: "text-emerald-400 bg-emerald-500/15" },
          { label: "CBT Tests Taken", value: loading ? "..." : cbtTestsTaken, icon: Monitor, color: "text-violet-400 bg-violet-500/15" },
          { label: "Average Score", value: loading ? "..." : `${averageScore}%`, icon: Trophy, color: "text-amber-400 bg-amber-500/15" },
          { label: "Tokens Earned", value: 0, icon: Sparkles, color: "text-sky-400 bg-sky-500/15" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl ${cardBg} p-3 sm:p-4 ${cardShadow}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${muted}`}>{stat.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stat.color}`}>
                <stat.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className={`mt-2 text-xl font-semibold sm:text-2xl ${heading}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#16a34a]" />
          <h3 className={`text-sm font-semibold ${heading}`}>Achievements</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {(allBadges || []).map((badge: any) => {
            const isEarned = earnedBadgeSet.has(badge.id) || earnedBadgeSet.has(badge.name);
            const earnedRecord = (userBadges || []).find(
              (entry: any) => (entry.badge_id && entry.badge_id === badge.id) || (entry.badge_name && entry.badge_name === badge.name)
            );

            return (
              <div
                key={badge.id || badge.name}
                className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"} ${isEarned ? "opacity-100" : "opacity-60"}`}
              >
                <div className="flex items-center justify-center rounded-full bg-[#16a34a]/10 p-3 text-3xl shadow-inner">
                  <span className={isEarned ? "text-[#16a34a]" : "text-gray-500"}>{badge.icon || "🏅"}</span>
                </div>
                <p className={`mt-3 text-sm font-semibold ${heading}`}>{badge.name}</p>
                <p className={`mt-1 text-xs ${muted}`}>{badge.description}</p>
                {isEarned ? (
                  <p className={`mt-2 text-[10px] ${muted}`}>
                    Earned on {earnedRecord?.earned_at ? new Date(earnedRecord.earned_at).toLocaleDateString() : "recently"}
                  </p>
                ) : (
                  <p className={`mt-2 text-[10px] ${muted}`}>How to unlock: {badge.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl ${cardBg} p-4 ${cardShadow}`}>
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-[#16a34a]" />
          <h3 className={`text-sm font-semibold ${heading}`}>Certificates</h3>
        </div>
        {certificates.length === 0 ? (
          <p className={`text-sm ${muted}`}>Complete topics in the Study Hub to earn certificates</p>
        ) : (
          <div className="space-y-3">
            {certificates.map((certificate: any) => (
              <div
                key={certificate.id}
                className={`flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between ${isDark ? "bg-white/5" : "bg-gray-50"}`}
              >
                <div>
                  <p className={`text-sm font-semibold ${heading}`}>{certificate.topic_name}</p>
                  <p className={`text-xs ${muted}`}>
                    {Number(certificate.percentage ?? 0)}% · {new Date(certificate.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => generateCertificate(certificate)}
                  className="inline-flex items-center justify-center rounded-lg bg-[#16a34a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#22c55e]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download Certificate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
    </div>
  );
}