"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import QuestionsManager from "./QuestionsManager";

type Subject = {
  id: number;
  name: string;
};

type Question = {
  id: number;
  subject_id: number;
  topic: string;
  question: string;
  type: string;
  answer: string;
  explanation: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: string | null;
  year: number | null;
  subject_name: string;
};

export default function AdminQuestionsPage() {
  const [initialSubjects, setInitialSubjects] = useState<Subject[]>([]);
  const [initialQuestions, setInitialQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const [subjectRes, questionRes] = await Promise.all([
          supabase.from<Subject>("subjects").select("id, name"),
          supabase
            .from<Question>("questions")
            .select("id, subject_id, topic, question, type, answer, explanation, option_a, option_b, option_c, option_d, correct_option, year")
            .order("id", { ascending: false }),
        ]);

        if (subjectRes.error) {
          throw new Error(subjectRes.error.message);
        }
        if (questionRes.error) {
          throw new Error(questionRes.error.message);
        }

        const subjectMap = new Map(subjectRes.data?.map((subject) => [subject.id, subject.name]));

        const questions: Question[] = (questionRes.data ?? []).map((question) => ({
          ...question,
          subject_name: subjectMap.get(question.subject_id) ?? "Unknown",
        }));

        setInitialSubjects(subjectRes.data ?? []);
        setInitialQuestions(questions);
      } catch (error: any) {
        setError(error.message || "Failed to load questions.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading questions...</div>;
  }

  if (error) {
    return <div className="p-8 text-rose-300">{error}</div>;
  }

  return <QuestionsManager initialSubjects={initialSubjects} initialQuestions={initialQuestions} />;
}
