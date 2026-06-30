"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
};

const questionTypes = ["MCQ", "Theory"];

export default function QuestionsManager({ initialSubjects, initialQuestions }: { initialSubjects: Subject[]; initialQuestions: Question[] }) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    subject_id: "",
    topic: "",
    question: "",
    type: "MCQ",
    answer: "",
    explanation: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    year: "",
  });

  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const filteredQuestions = useMemo(() => {
    return filterSubject ? questions.filter((q) => String(q.subject_id) === filterSubject) : questions;
  }, [questions, filterSubject]);

  const handleInput = (field: string, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setFormData({
      subject_id: "",
      topic: "",
      question: "",
      type: "MCQ",
      answer: "",
      explanation: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
      year: "",
    });
  };

  const handleEdit = (question: Question) => {
    setEditing(question);
    setShowForm(true);
    setFormData({
      subject_id: String(question.subject_id),
      topic: question.topic,
      question: question.question,
      type: question.type,
      answer: question.answer,
      explanation: question.explanation || "",
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
      correct_option: question.correct_option || "A",
      year: question.year ? String(question.year) : "",
    });
  };

  const handleDelete = async (question: Question) => {
    if (!window.confirm("Delete this question?")) return;
    await supabase.from("questions").delete().eq("id", question.id);
    fetchQuestions();
  };

  const fetchQuestions = async () => {
    const [questionRes, subjectRes] = await Promise.all([
      supabase
        .from<Question>("questions")
        .select("id, subject_id, topic, question, type, answer, explanation, option_a, option_b, option_c, option_d, correct_option, year")
        .order("id", { ascending: false }),
      supabase.from<Subject>("subjects").select("id, name"),
    ]);

    const subjectMap = new Map(subjectRes.data?.map((subject) => [subject.id, subject.name]));
    if (questionRes.data) {
      setQuestions(
        questionRes.data.map((question) => ({
          ...question,
          subject_name: subjectMap.get(question.subject_id) ?? "Unknown",
        }))
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      subject_id: Number(formData.subject_id),
      topic: formData.topic,
      question: formData.question,
      type: formData.type,
      answer: formData.answer,
      explanation: formData.explanation,
      option_a: formData.type === "MCQ" ? formData.option_a : null,
      option_b: formData.type === "MCQ" ? formData.option_b : null,
      option_c: formData.type === "MCQ" ? formData.option_c : null,
      option_d: formData.type === "MCQ" ? formData.option_d : null,
      correct_option: formData.type === "MCQ" ? formData.correct_option : null,
      year: formData.year ? Number(formData.year) : null,
    };

    if (editing) {
      await supabase.from("questions").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("questions").insert(payload);
    }

    resetForm();
    fetchQuestions();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Manage Questions</h1>
          <p className="mt-2 text-slate-400">Create, edit, and remove questions across subjects.</p>
        </div>
        <button onClick={() => setShowForm((open) => !open)} className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 font-semibold text-[#052e16]">
          <Plus size={16} />
          {showForm ? "Close" : "Add Question"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              Subject
              <select value={formData.subject_id} onChange={(e) => handleInput("subject_id", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Topic
              <input value={formData.topic} onChange={(e) => handleInput("topic", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
            </label>
            <label className="space-y-2 text-sm text-slate-200 lg:col-span-2">
              Question
              <textarea value={formData.question} onChange={(e) => handleInput("question", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white min-h-[120px]" />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Type
              <select value={formData.type} onChange={(e) => handleInput("type", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
                {questionTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Answer
              <textarea value={formData.answer} onChange={(e) => handleInput("answer", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white min-h-[120px]" />
            </label>
            <label className="space-y-2 text-sm text-slate-200 lg:col-span-2">
              Explanation
              <textarea value={formData.explanation} onChange={(e) => handleInput("explanation", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white min-h-[100px]" />
            </label>

            {formData.type === "MCQ" && (
              <>
                <label className="space-y-2 text-sm text-slate-200">
                  Option A
                  <input value={formData.option_a} onChange={(e) => handleInput("option_a", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
                </label>
                <label className="space-y-2 text-sm text-slate-200">
                  Option B
                  <input value={formData.option_b} onChange={(e) => handleInput("option_b", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
                </label>
                <label className="space-y-2 text-sm text-slate-200">
                  Option C
                  <input value={formData.option_c} onChange={(e) => handleInput("option_c", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
                </label>
                <label className="space-y-2 text-sm text-slate-200">
                  Option D
                  <input value={formData.option_d} onChange={(e) => handleInput("option_d", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
                </label>
                <label className="space-y-2 text-sm text-slate-200">
                  Correct Option
                  <select value={formData.correct_option} onChange={(e) => handleInput("correct_option", e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <label className="space-y-2 text-sm text-slate-200">
              Year
              <input value={formData.year} onChange={(e) => handleInput("year", e.target.value)} type="number" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="rounded-full bg-[#16a34a] px-5 py-2 font-semibold text-[#052e16]">{editing ? "Save Question" : "Add Question"}</button>
            <button type="button" onClick={resetForm} className="rounded-full bg-white/5 px-5 py-2 text-slate-200">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl bg-[#111827] shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0b1220] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Questions</h2>
            <p className="mt-1 text-sm text-slate-400">Filter and manage all questions.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-200">
            <thead className="bg-[#111827]">
              <tr>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Topic</th>
                <th className="px-6 py-4 font-semibold">Question</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#052e16]">
              {filteredQuestions.map((question) => {
                const subjectName = subjects.find((subject) => subject.id === question.subject_id)?.name ?? "Unknown";
                return (
                  <tr key={question.id}>
                    <td className="px-6 py-4">{subjectName}</td>
                    <td className="px-6 py-4">{question.topic}</td>
                    <td className="px-6 py-4">{question.question.slice(0, 80)}{question.question.length > 80 ? "..." : ""}</td>
                    <td className="px-6 py-4">{question.type}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleEdit(question)} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">
                          <Pencil size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(question)} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
