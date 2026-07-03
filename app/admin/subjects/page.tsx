"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: number;
  name: string;
  description: string;
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from("subjects").select("id, name, description").order("id", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubjects(data ?? []);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Subject name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    if (editing) {
      const { error } = await supabase.from("subjects").update({ name, description }).eq("id", editing.id);
      if (error) {
        setError(error.message);
      }
    } else {
      const { error } = await supabase.from("subjects").insert({ name, description });
      if (error) {
        setError(error.message);
      }
    }

    setName("");
    setDescription("");
    setEditing(null);
    await fetchSubjects();
  };

  const handleEdit = (subject: Subject) => {
    setEditing(subject);
    setName(subject.name);
    setDescription(subject.description);
  };

  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(`Delete subject ${subject.name}?`)) return;
    setLoading(true);
    const { error } = await supabase.from("subjects").delete().eq("id", subject.id);
    if (error) {
      setError(error.message);
    } else {
      await fetchSubjects();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#064e23] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Subjects</h1>
            <p className="mt-2 text-slate-400">Create, edit, and delete subjects for your course hierarchy.</p>
          </div>
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 font-semibold text-[#052e16]">
            <Plus size={16} /> New Subject
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-200">
            Subject Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-3 font-semibold text-[#052e16]">
              {editing ? "Save Subject" : "Add Subject"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setName(""); setDescription(""); }} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-3 text-slate-200">
                Cancel
              </button>
            )}
            {error && <div className="text-rose-300">{error}</div>}
            {loading && <div className="text-slate-300">Saving...</div>}
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="rounded-3xl bg-[#065f2c] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{subject.name}</h2>
                <p className="mt-2 text-slate-400">{subject.description || "No description provided."}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleEdit(subject)} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  <Pencil size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(subject)} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



