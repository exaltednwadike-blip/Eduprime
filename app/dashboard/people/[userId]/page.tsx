"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Waves, Trophy, Activity } from "lucide-react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";

export default function UserProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasWaved, setHasWaved] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [presence, setPresence] = useState("Offline");
  const [cbtScores, setCbtScores] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const { data: currentUserData } = await supabase.auth.getUser();
      setCurrentUser(currentUserData.user || null);

      const [{ data: profileData }, { data: followData }, { data: followerData }, { data: presenceData }, { data: scoresData }] = await Promise.all([
        supabase.from("profiles").select("id, username, full_name, avatar_url, bio").eq("id", userId).maybeSingle(),
        supabase.from("user_follows").select("id").eq("follower_id", currentUserData.user?.id || "").eq("following_id", userId),
        supabase.from("user_follows").select("id").eq("following_id", userId),
        supabase.from("user_presence").select("is_online").eq("user_id", userId).maybeSingle(),
        supabase.from("cbt_results").select("id, percentage, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      ]);

      setProfile(profileData);
      setIsFollowing((followData || []).length > 0);
      setFollowers((followerData || []).length);
      setPresence(presenceData?.is_online ? "Online" : "Offline");
      setCbtScores(scoresData || []);

      const { data: followingData } = await supabase.from("user_follows").select("id").eq("follower_id", userId);
      setFollowing(followingData?.length || 0);

      const { data: waveData } = await supabase
        .from("user_waves")
        .select("id")
        .eq("sender_id", currentUserData.user?.id || "")
        .eq("receiver_id", userId);
      setHasWaved((waveData || []).length > 0);
    };

    load();
  }, [userId]);

  const handleFollow = async () => {
    if (!currentUser) return;
    if (isFollowing) {
      await supabase.from("user_follows").delete().eq("follower_id", currentUser.id).eq("following_id", userId);
      setIsFollowing(false);
      setFollowers((count) => Math.max(0, count - 1));
      return;
    }

    await supabase.from("user_follows").insert({ follower_id: currentUser.id, following_id: userId, created_at: new Date().toISOString() });
    setIsFollowing(true);
    setFollowers((count) => count + 1);
  };

  const handleWave = async () => {
    if (!currentUser || hasWaved) return;
    await supabase.from("user_waves").insert({ sender_id: currentUser.id, receiver_id: userId, created_at: new Date().toISOString() });
    setHasWaved(true);
  };

  const card = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const text = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";

  if (!profile) {
    return <div className={`m-6 rounded-xl ${card} p-10 text-center ${muted}`}>Loading profile...</div>;
  }

  const displayName = profile.full_name || profile.username || "Learner";

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Link href="/dashboard/people" className={`inline-flex items-center gap-2 text-sm font-medium ${text}`}>
        <ArrowLeft size={16} /> Back to people
      </Link>

      <div className={`rounded-2xl ${card} p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#16a34a]/20 text-lg font-bold text-[#16a34a]">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" /> : (profile.username || displayName).slice(0,2).toUpperCase()}
            </div>
            <div>
              <h1 className={`text-xl font-bold ${text}`}>{displayName}</h1>
              <p className={`text-sm ${muted}`}>@{profile.username || "student"}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleFollow} className={`rounded-lg px-4 py-2 text-sm font-semibold ${isFollowing ? "border border-[#16a34a] text-[#16a34a]" : "bg-[#16a34a] text-white hover:bg-[#22c55e]"}`}>
              <span className="inline-flex items-center gap-2"><UserPlus size={14} /> {isFollowing ? "Following" : "Follow"}</span>
            </button>
            <button onClick={handleWave} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${hasWaved ? "border-emerald-500/30 bg-emerald-500/10 text-[#22c55e]" : "border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a]/10"}`}>
              <span className="inline-flex items-center gap-2"><Waves size={14} /> {hasWaved ? "Waved" : "Wave"}</span>
            </button>
          </div>
        </div>

        <p className={`mt-4 text-sm ${muted}`}>{profile.bio || "No bio yet — just a focused learner building progress."}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[{ label: "Followers", value: followers }, { label: "Following", value: following }, { label: "Presence", value: presence }].map((item) => (
          <div key={item.label} className={`rounded-xl ${card} p-4`}>
            <p className={`text-xs uppercase tracking-wide ${muted}`}>{item.label}</p>
            <p className={`mt-2 text-xl font-bold ${text}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl ${card} p-4`}>
        <div className="mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-[#16a34a]" />
          <h2 className={`font-semibold ${text}`}>Recent CBT scores</h2>
        </div>

        {cbtScores.length === 0 ? (
          <p className={`text-sm ${muted}`}>No CBT results yet.</p>
        ) : (
          <div className="space-y-2">
            {cbtScores.map((score) => (
              <div key={score.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <span className={`text-sm ${text}`}>{new Date(score.created_at).toLocaleDateString()}</span>
                <span className="text-sm font-semibold text-[#16a34a]">{Math.round(Number(score.percentage || 0))}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
