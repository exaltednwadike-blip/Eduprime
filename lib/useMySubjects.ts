"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Subject = { id: string; name: string; description: string | null };

/**
 * Returns the subjects a student has chosen to offer.
 * Until they choose any, it falls back to every subject so nothing breaks.
 */
export function useMySubjects() {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [chosenIds, setChosenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id, name, description")
      .order("name");

    let ids: string[] = [];
    if (authData.user) {
      const { data: chosen } = await supabase
        .from("user_subjects")
        .select("subject_id")
        .eq("user_id", authData.user.id);
      ids = (chosen || []).map((row: { subject_id: string | number }) => String(row.subject_id));
    }

    setAllSubjects(((subjectData as Subject[]) || []).map((s) => ({ ...s, id: String(s.id) })));
    setChosenIds(ids);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasChosen = chosenIds.length > 0;
  const subjects = hasChosen ? allSubjects.filter((s) => chosenIds.includes(s.id)) : allSubjects;

  const saveChoice = useCallback(
    async (ids: string[]): Promise<{ error: string | null }> => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return { error: "You are not signed in." };

      const toRemove = chosenIds.filter((id) => !ids.includes(id));
      const toAdd = ids.filter((id) => !chosenIds.includes(id));

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("user_subjects")
          .delete()
          .eq("user_id", user.id)
          .in("subject_id", toRemove);
        if (error) return { error: error.message };
      }

      if (toAdd.length > 0) {
        const { error } = await supabase
          .from("user_subjects")
          .insert(toAdd.map((subject_id) => ({ user_id: user.id, subject_id })));
        if (error) return { error: error.message };
      }

      await load();
      return { error: null };
    },
    [chosenIds, load]
  );

  return { subjects, allSubjects, chosenIds, hasChosen, loading, refresh: load, saveChoice };
}