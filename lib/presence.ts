export async function updatePresence(
  supabase: any,
  userId: string,
  topic?: string
) {
  const payload = {
    user_id: userId,
    is_online: true,
    last_seen: new Date().toISOString(),
    topic: topic || "dashboard",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_presence").upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Presence update failed:", error);
  }
}

export async function setOffline(supabase: any, userId: string) {
  const { error } = await supabase
    .from("user_presence")
    .update({ is_online: false, last_seen: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    console.error("Presence offline update failed:", error);
  }
}
