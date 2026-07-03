"use client";

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  subject_id: number;
  name: string;
};

export default function AdminCategoriesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const fetchLookupData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [subjectRes, categoryRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name", { ascending: true }),
        supabase.from("categories").select("id, subject_id, name").order("name", { ascending: true }),
      ]);

      if (subjectRes.error) throw new Error(subjectRes.error.message);
      if (categoryRes.error) throw new Error(categoryRes.error.message);

      const subjectsData = subjectRes.data ?? [];
      const categoriesData = categoryRes.data ?? [];

      setSubjects(subjectsData);
      setCategories(categoriesData);
      setSelectedSubjectId((prev) => prev ?? subjectsData[0]?.id ?? null);
    } catch (err: any) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from("categories").select("id, subject_id, name").order("name", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setCategories(data ?? []);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSubjectId) {
      setError("Please select a subject before saving a category.");
      return;
    }
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    if (editing) {
      const { error } = await supabase.from("categories").update({ name, subject_id: selectedSubjectId }).eq("id", editing.id);
      if (error) {
        setError(error.message);
      }
    } else {
      const { error } = await supabase.from("categories").insert({ name, subject_id: selectedSubjectId });
      if (error) {
        setError(error.message);
      }
    }

    setName("");
    setEditing(null);
    await fetchCategories();
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setSelectedSubjectId(category.subject_id);
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete category ${category.name}?`)) return;
    setLoading(true);
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) {
      setError(error.message);
    } else {
      await fetchCategories();
    }
    setLoading(false);
  };

  const filteredCategories = categories.filter((category) => category.subject_id === selectedSubjectId);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#064e23] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Categories</h1>
            <p className="mt-2 text-slate-400">Organize categories under subjects for your course hierarchy.</p>
          </div>
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 font-semibold text-[#052e16]">
            <Plus size={16} /> New Category
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-200">
            Subject
            <select value={selectedSubjectId ?? ""} onChange={(event) => setSelectedSubjectId(Number(event.target.value) || null)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-200 lg:col-span-2">
            Category Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
          </label>

          <div className="lg:col-span-3 flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-3 font-semibold text-[#052e16]">
              {editing ? "Save Category" : "Add Category"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setName(""); }} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-3 text-slate-200">
                Cancel
              </button>
            )}
            {error && <div className="text-rose-300">{error}</div>}
            {loading && <div className="text-slate-300">Saving...</div>}
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="rounded-3xl bg-[#065f2c] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{category.name}</h2>
                <p className="mt-2 text-slate-400">Subject: {subjects.find((subject) => subject.id === category.subject_id)?.name ?? "Unknown"}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleEdit(category)} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  <Pencil size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(category)} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="rounded-3xl bg-[#065f2c] p-6 text-slate-400">No categories available for the selected subject.</div>
        )}
      </div>
    </div>
  );
}



