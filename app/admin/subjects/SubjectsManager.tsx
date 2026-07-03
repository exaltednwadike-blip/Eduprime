"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: number;
  name: string;
  description: string;
  question_count: number;
};

export default function SubjectsManager({ initialSubjects }: { initialSubjects: Subject[] }) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Subject | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, name, description");
    if (data) {
      const questionCounts: Record<number, number> = {};
      const questionData = await supabase.from("questions").select("subject_id");
      questionData.data?.forEach((question: any) => {
        questionCounts[question.subject_id] = (questionCounts[question.subject_id] || 0) + 1;
      });
      setSubjects(data.map((subject) => ({ ...subject, question_count: questionCounts[subject.id] ?? 0 })));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    if (editing) {
      await supabase.from("subjects").update({ name, description }).eq("id", editing.id);
    } else {
      await supabase.from("subjects").insert({ name, description });
    }

    setName("");
    setDescription("");
    setEditing(null);
    setShowForm(false);
    fetchSubjects();
  };

  const handleEdit = (subject: Subject) => {
    setEditing(subject);
    setName(subject.name);
    setDescription(subject.description);
    setShowForm(true);
  };

  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(`Delete subject ${subject.name}?`)) return;
    await supabase.from("subjects").delete().eq("id", subject.id);
    fetchSubjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Manage Subjects</h1>
          <p className="mt-2 text-slate-400">Add, edit, and remove subjects in EduPrime.</p>
        </div>
        <button onClick={() => setShowForm((open) => !open)} className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 font-semibold text-[#052e16]">
          <Plus size={16} />
          {showForm ? "Close" : "Add Subject"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              Subject name
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Description
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" className="rounded-full bg-[#16a34a] px-5 py-2 font-semibold text-[#052e16]">{editing ? "Save Changes" : "Create Subject"}</button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setName(""); setDescription(""); }} className="rounded-full bg-white/5 px-5 py-2 text-slate-200">Cancel</button>
            )}
          </div>
        </form>
      )}

      <div className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <div className="grid gap-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0b1220] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{subject.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{subject.description}</p>
                <p className="mt-2 text-sm text-[#16a34a]">{subject.question_count || 0} questions</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleEdit(subject)} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
                  <Pencil size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(subject)} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
