"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SubjectsManager from "./SubjectsManager";

type Subject = {
  id: number;
  name: string;
  description: string;
  question_count: number;
};

type QuestionSummary = {
  subject_id: number;
};

export default function AdminSubjectsPage() {
  const [initialSubjects, setInitialSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const [subjectRes, questionRes] = await Promise.all([
          supabase.from<Omit<Subject, "question_count">>("subjects").select("id, name, description"),
          supabase.from<QuestionSummary>("questions").select("subject_id"),
        ]);

        if (subjectRes.error) {
          throw new Error(subjectRes.error.message);
        }
        if (questionRes.error) {
          throw new Error(questionRes.error.message);
        }

        const counts = new Map<number, number>();
        questionRes.data?.forEach((question) => {
          counts.set(question.subject_id, (counts.get(question.subject_id) || 0) + 1);
        });

        const subjects: Subject[] = (subjectRes.data ?? []).map((subject) => ({
          ...subject,
          question_count: counts.get(subject.id) ?? 0,
        }));

        setInitialSubjects(subjects);
      } catch (error: any) {
        setError(error.message || "Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading subjects...</div>;
  }

  if (error) {
    return <div className="p-8 text-rose-300">{error}</div>;
  }

  return <SubjectsManager initialSubjects={initialSubjects} />;
}
