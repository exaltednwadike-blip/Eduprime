"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, Sparkles, ArrowUpRight, Waves } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";

type ProfileCard = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_online?: boolean;
};

export default function PeoplePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [people, setPeople] = useState<ProfileCard[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [waveMap, setWaveMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setCurrentUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio")
        .neq("id", user?.id || "")
        .order("username", { ascending: true })
        .limit(40);

      const normalized = (profileData || []) as ProfileCard[];
      const ids = normalized.map((person) => person.id);

      let followMap: Record<string, boolean> = {};
      let waveMapRecord: Record<string, boolean> = {};

      if (user && ids.length > 0) {
        const [{ data: followData }, { data: waveData }] = await Promise.all([
          supabase.from("user_follows").select("following_id").eq("follower_id", user.id).in("following_id", ids),
          supabase.from("user_waves").select("receiver_id").eq("sender_id", user.id).in("receiver_id", ids),
        ]);

        followMap = (followData || []).reduce((acc: Record<string, boolean>, item: any) => {
          acc[item.following_id] = true;
          return acc;
        }, {});

        waveMapRecord = (waveData || []).reduce((acc: Record<string, boolean>, item: any) => {
          acc[item.receiver_id] = true;
          return acc;
        }, {});
      }

      const { data: presenceData } = await supabase.from("user_presence").select("user_id, is_online").in("user_id", ids);
      const onlineMap = (presenceData || []).reduce((acc: Record<string, boolean>, item: any) => {
        acc[item.user_id] = !!item.is_online;
        return acc;
      }, {} as Record<string, boolean>);

      setPeople(
        normalized.map((person) => ({
          ...person,
          is_online: !!onlineMap[person.id],
        }))
      );
      setFollowingMap(followMap);
      setWaveMap(waveMapRecord);
      setLoading(false);
    };

    load();
  }, []);

  const filteredPeople = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return people;
    return people.filter((person) => {
      const username = (person.username || "").toLowerCase();
      const fullName = (person.full_name || "").toLowerCase();
      return username.includes(term) || fullName.includes(term);
    });
  }, [people, query]);

  const toggleFollow = async (profileId: string) => {
    if (!currentUser) return;

    const isFollowing = !!followingMap[profileId];

    if (isFollowing) {
      await supabase.from("user_follows").delete().eq("follower_id", currentUser.id).eq("following_id", profileId);
      setFollowingMap((prev) => ({ ...prev, [profileId]: false }));
      return;
    }

    await supabase.from("user_follows").insert({
      follower_id: currentUser.id,
      following_id: profileId,
      created_at: new Date().toISOString(),
    });
    setFollowingMap((prev) => ({ ...prev, [profileId]: true }));
  };

  const sendWave = async (profileId: string) => {
    if (!currentUser) return;
    const alreadyWaved = !!waveMap[profileId];
    if (alreadyWaved) return;

    await supabase.from("user_waves").insert({
      sender_id: currentUser.id,
      receiver_id: profileId,
      created_at: new Date().toISOString(),
    });
    setWaveMap((prev) => ({ ...prev, [profileId]: true }));
  };

  const card = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const text = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl ${card} p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-lg font-bold ${text}`}>People</h1>
            <p className={`text-xs ${muted}`}>Connect with classmates and study partners.</p>
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? "border-white/10 bg-[#0b1f12]" : "border-gray-200 bg-white"}`}>
            <Search size={16} className={muted} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username"
              className={`w-full bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-slate-400" : "text-gray-900 placeholder:text-gray-500"}`}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`rounded-xl ${card} p-10 text-center ${muted}`}>Loading learners...</div>
      ) : filteredPeople.length === 0 ? (
        <div className={`rounded-xl ${card} p-10 text-center ${muted}`}>No people match your search.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPeople.map((person) => (
            <div key={person.id} className={`rounded-xl ${card} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#16a34a]/20 text-sm font-bold text-[#16a34a]">
                    {person.avatar_url ? <img src={person.avatar_url} alt={person.username || "Person"} className="h-full w-full object-cover" /> : (person.username || person.full_name || "ST").slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/dashboard/people/${person.id}`} className={`font-semibold ${text}`}>
                      {person.full_name || person.username || "Learner"}
                    </Link>
                    <p className={`text-xs ${muted}`}>@{person.username || "student"}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${person.is_online ? "bg-[#16a34a]/15 text-[#22c55e]" : "bg-slate-500/10 text-slate-400"}`}>
                  {person.is_online ? "Online" : "Offline"}
                </span>
              </div>

              <p className={`mt-3 text-sm ${muted}`}>{person.bio || "Aspiring learner building momentum."}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => toggleFollow(person.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${followingMap[person.id] ? "border border-[#16a34a] text-[#16a34a]" : "bg-[#16a34a] text-white hover:bg-[#22c55e]"}`}
                >
                  <span className="inline-flex items-center gap-1.5"> <UserPlus size={14} /> {followingMap[person.id] ? "Following" : "Follow"}</span>
                </button>
                <button
                  onClick={() => sendWave(person.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${waveMap[person.id] ? "border-emerald-500/30 bg-emerald-500/10 text-[#22c55e]" : "border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a]/10"}`}
                >
                  <span className="inline-flex items-center gap-1.5"> <Waves size={14} /> {waveMap[person.id] ? "Waved" : "Wave"}</span>
                </button>
              </div>

              <Link href={`/dashboard/people/${person.id}`} className={`mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#16a34a]`}>
                View profile <ArrowUpRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
