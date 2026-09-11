"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/app/dashboard/layout";
import { Crown, Users, Trophy, Flame, UserPlus, Plus, ShieldCheck, Search } from "lucide-react";

type LeaderboardEntry = {
  user_id: string;
  full_name: string;
  subject_name: string;
  subject_id: string;
  best_score: number;
  tests_taken: number;
  avg_score: number;
};

type Subject = { id: string; name: string };

type StudyGroup = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

type GroupMember = {
  id: string;
  user_id: string;
  first_name: string;
  full_name: string;
};

type SubjectStat = {
  subject: string;
  students_studied_today: number;
  questions_answered_today: number;
};

function makeInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function CommunityPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [tab, setTab] = useState<"leaderboard" | "groups" | "stats" | "chat">("leaderboard");
  const [leaderboardTab, setLeaderboardTab] = useState<"alltime" | "weekly">("alltime");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, GroupMember[]>>({});
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [chatGroupId, setChatGroupId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [onlineMembers, setOnlineMembers] = useState<any[]>([]);

  const card = isDark ? "bg-[#064e23] border border-white/10" : "bg-white border border-gray-200";
  const cardText = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const activeTab = "bg-[#16a34a] text-white";
  const inactiveTab = isDark ? "bg-white/10 text-slate-300" : "bg-gray-100 text-gray-600";

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) setCurrentUserId(userData.user.id);

      const [{ data: subjectData }, { data: statData }] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("anonymous_study_stats").select("subject, students_studied_today, questions_answered_today").limit(6),
      ]);

      setSubjects(subjectData || []);
      setSubjectStats((statData || []) as SubjectStat[]);
    };

    load();
  }, []);

  useEffect(() => {
    if (tab !== "leaderboard") return;
    const run = async () => {
      setLoading(true);
      const view = leaderboardTab === "alltime" ? "leaderboard_alltime" : "leaderboard_weekly";

      let query = supabase.from(view).select("*").order("best_score", { ascending: false }).limit(10);
      if (selectedSubject !== "all") {
        query = query.eq("subject_id", selectedSubject);
      }

      const { data } = await query;
      setEntries((data || []) as LeaderboardEntry[]);
      setLoading(false);
    };

    run();
  }, [tab, leaderboardTab, selectedSubject]);

  useEffect(() => {
    if (tab !== "groups") return;
    const loadGroups = async () => {
      if (!currentUserId) return;

      try {
        const { data: groupData } = await supabase
          .from("study_groups")
          .select("id, name, invite_code, created_by, created_at")
          .contains("members", [currentUserId]);

        const groupList = (groupData || []) as StudyGroup[];
        setGroups(groupList);
        setChatGroupId((prev) => prev || groupList[0]?.id || "");

        if (groupList.length === 0) return;

        const memberMap: Record<string, GroupMember[]> = {};
        for (const group of groupList) {
          const { data: membersData } = await supabase
            .from("group_members")
            .select("id, user_id, first_name, full_name")
            .eq("group_id", group.id);
          memberMap[group.id] = (membersData || []) as GroupMember[];
        }
        setGroupMembers(memberMap);
      } catch (error) {
        console.error("Load groups failed", error);
      }
    };

    loadGroups();
  }, [tab, currentUserId]);

  useEffect(() => {
    if (tab !== "chat" || !chatGroupId || !currentUserId) return;

    const loadMessages = async () => {
      try {
        const { data: messageData } = await supabase
          .from("group_messages")
          .select("id, group_id, user_id, content, created_at, profiles(username)")
          .eq("group_id", chatGroupId)
          .order("created_at", { ascending: true })
          .limit(40);

        setChatMessages(messageData || []);

        const { data: membersData } = await supabase
          .from("user_presence")
          .select("user_id, is_online, last_seen, topic")
          .neq("user_id", currentUserId)
          .eq("is_online", true)
          .limit(30);
        setOnlineMembers(membersData || []);
      } catch (error) {
        console.error("Load chat failed", error);
      }
    };

    loadMessages();

    const channel = supabase
      .channel(`group-chat-${chatGroupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${chatGroupId}` },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [tab, chatGroupId, currentUserId]);

  const createGroup = async () => {
    if (!groupName.trim() || !currentUserId) return;

    const invite = makeInviteCode();
    const { error } = await supabase.from("study_groups").insert({
      name: groupName.trim(),
      invite_code: invite,
      created_by: currentUserId,
      members: [currentUserId],
    });

    if (!error) {
      setGroupName("");
      setMessage(`Group created! Invite code: ${invite}`);
      setTab("groups");
    }
  };

  const joinGroup = async () => {
    if (!inviteCode.trim() || !currentUserId) return;

    const { data: match, error } = await supabase
      .from("study_groups")
      .select("id")
      .eq("invite_code", inviteCode.trim())
      .maybeSingle();

    if (error || !match) {
      setMessage("Invalid invite code.");
      return;
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", match.id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("group_members").insert({
        group_id: match.id,
        user_id: currentUserId,
        first_name: "Student",
        full_name: "Student",
      });
      await supabase.from("study_groups").update({ members: [currentUserId] }).eq("id", match.id);
    }

    setInviteCode("");
    setMessage("Joined the study group.");
    setTab("groups");
  };

  const getFirstName = (fullName: string) => (fullName || "Student").split(" ")[0];

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatGroupId || !currentUserId) return;

    try {
      await supabase.from("group_messages").insert({
        group_id: chatGroupId,
        user_id: currentUserId,
        content: chatInput.trim(),
      });
      setChatInput("");
    } catch (error) {
      console.error("Message send failed", error);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl ${card} p-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16a34a]/20">
            <Users size={20} className="text-[#16a34a]" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${cardText}`}>Community</h1>
            <p className={`text-xs ${muted}`}>Celebrate progress and study together</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "leaderboard", label: "Leaderboard" },
          { key: "groups", label: "Study Groups" },
          { key: "stats", label: "Anonymous Stats" },
          { key: "chat", label: "Chat" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as any)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === item.key ? activeTab : inactiveTab}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-lg border border-[#16a34a]/30 bg-[#16a34a]/10 px-3 py-2 text-sm text-[#16a34a]">
          {message}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-lg overflow-hidden w-fit">
              <button onClick={() => setLeaderboardTab("alltime")} className={`px-4 py-2 text-sm font-medium ${leaderboardTab === "alltime" ? activeTab : inactiveTab}`}>
                All Time
              </button>
              <button onClick={() => setLeaderboardTab("weekly")} className={`px-4 py-2 text-sm font-medium ${leaderboardTab === "weekly" ? activeTab : inactiveTab}`}>
                Weekly
              </button>
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm ${isDark ? "bg-[#064e23] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"}`}
            >
              <option value="all">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div className={`rounded-xl ${card} overflow-hidden`}>
            {loading ? (
              <div className="flex items-center justify-center p-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16a34a] border-t-transparent" />
              </div>
            ) : entries.length === 0 ? (
              <div className={`p-8 text-center ${muted}`}>
                <Trophy size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No leaderboard entries yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {entries.map((entry, index) => (
                  <div key={`${entry.user_id}-${entry.subject_id}-${index}`} className={`grid grid-cols-12 items-center gap-2 px-4 py-3 ${index % 2 === 0 ? (isDark ? "bg-white/5" : "bg-gray-50") : ""}`}>
                    <div className="col-span-1 flex items-center justify-center">
                      {index === 0 ? <Crown size={18} className="text-yellow-400" /> : <span className={`text-xs font-bold ${muted}`}>#{index + 1}</span>}
                    </div>
                    <div className="col-span-5">
                      <p className={`text-sm font-semibold ${cardText}`}>{entry.full_name || "Student"}</p>
                      {entry.user_id === currentUserId && <span className="text-[10px] text-[#16a34a]">You</span>}
                    </div>
                    <div className="col-span-3 text-xs text-gray-400">{entry.subject_name}</div>
                    <div className="col-span-3 text-right text-sm font-semibold text-[#16a34a]">{Math.round(entry.best_score)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "groups" && (
        <div className="space-y-4">
          <div className={`rounded-xl ${card} p-4`}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={`text-xs font-medium uppercase tracking-wide ${muted}`}>Create a new group</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "bg-[#0b1f12] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                />
                <button onClick={createGroup} className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#22c55e]">
                  <Plus size={16} /> Create Group
                </button>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-medium uppercase tracking-wide ${muted}`}>Join by invite code</label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "bg-[#0b1f12] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                />
                <button onClick={joinGroup} className="inline-flex items-center gap-2 rounded-lg border border-[#16a34a] px-4 py-2 text-sm font-semibold text-[#16a34a] hover:bg-[#16a34a]/10">
                  <UserPlus size={16} /> Join Group
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {groups.length === 0 ? (
              <div className={`rounded-xl ${card} p-8 text-center ${muted}`}>
                <Users size={28} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No groups joined yet.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className={`rounded-xl ${card} p-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-base font-semibold ${cardText}`}>{group.name}</h3>
                    <span className="rounded-full bg-[#16a34a]/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#16a34a]">
                      {group.invite_code}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(groupMembers[group.id] || []).map((member) => (
                      <div key={member.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                        <span className={`text-sm ${cardText}`}>{getFirstName(member.full_name || member.first_name || "Student")}</span>
                        <ShieldCheck size={14} className="text-[#16a34a]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="grid gap-4 md:grid-cols-3">
          {subjectStats.map((stat) => (
            <div key={stat.subject} className={`rounded-xl ${card} p-4`}>
              <h3 className={`text-base font-semibold ${cardText}`}>{stat.subject}</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${muted}`}>Students studied today</span>
                  <span className="text-lg font-bold text-[#16a34a]">{stat.students_studied_today}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${muted}`}>Questions answered</span>
                  <span className="text-lg font-bold text-[#16a34a]">{stat.questions_answered_today}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "chat" && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className={`rounded-xl ${card} p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-base font-semibold ${cardText}`}>Group chat</h3>
              <select
                value={chatGroupId}
                onChange={(e) => setChatGroupId(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${isDark ? "bg-[#064e23] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"}`}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-white/5 bg-black/5 p-3">
              {chatMessages.length === 0 ? (
                <p className={`text-sm ${muted}`}>No messages yet. Start the conversation.</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`rounded-lg px-3 py-2 ${msg.user_id === currentUserId ? "ml-auto max-w-[80%] bg-[#16a34a] text-white" : "max-w-[80%] bg-white/10 text-slate-200"}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{msg.user_id === currentUserId ? "You" : "Member"}</p>
                    <p className="mt-1 text-sm">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send a message"
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${isDark ? "bg-[#0b1f12] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"}`}
              />
              <button onClick={sendChatMessage} className="rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#22c55e]">
                Send
              </button>
            </div>
          </div>

          <div className={`rounded-xl ${card} p-4`}>
            <h3 className={`text-base font-semibold ${cardText}`}>Online members</h3>
            <div className="mt-3 space-y-2">
              {onlineMembers.length === 0 ? (
                <p className={`text-sm ${muted}`}>No other members are online right now.</p>
              ) : (
                onlineMembers.map((member) => (
                  <div key={member.user_id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                    <span className={`text-sm ${cardText}`}>{member.user_id.slice(0, 8)}</span>
                    <span className="rounded-full bg-[#16a34a]/20 px-2 py-1 text-[10px] font-semibold text-[#16a34a]">Online</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
