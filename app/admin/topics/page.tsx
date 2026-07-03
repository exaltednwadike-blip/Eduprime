"use client";

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

type Topic = {
  id: number;
  category_id: number;
  name: string;
};

export default function AdminTopicsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Topic | null>(null);
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

  useEffect(() => {
    if (selectedSubjectId && !selectedCategoryId) {
      const firstCategory = categories.find((category) => category.subject_id === selectedSubjectId);
      if (firstCategory) {
        setSelectedCategoryId(firstCategory.id);
      }
    }
  }, [selectedSubjectId, categories, selectedCategoryId]);

  const fetchLookupData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [subjectRes, categoryRes, topicRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name", { ascending: true }),
        supabase.from("categories").select("id, subject_id, name").order("name", { ascending: true }),
        supabase.from("topics").select("id, category_id, name").order("name", { ascending: true }),
      ]);

      if (subjectRes.error) throw new Error(subjectRes.error.message);
      if (categoryRes.error) throw new Error(categoryRes.error.message);
      if (topicRes.error) throw new Error(topicRes.error.message);

      const subjectsData = subjectRes.data ?? [];
      const categoriesData = categoryRes.data ?? [];
      const topicsData = topicRes.data ?? [];

      setSubjects(subjectsData);
      setCategories(categoriesData);
      setTopics(topicsData);
      setSelectedSubjectId((prev) => prev ?? subjectsData[0]?.id ?? null);
      setSelectedCategoryId((prev) => prev ?? categoriesData.find((category) => category.subject_id === subjectsData[0]?.id)?.id ?? null);
    } catch (err: any) {
      setError(err.message || "Failed to load topics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from("topics").select("id, category_id, name").order("name", { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setTopics(data ?? []);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCategoryId) {
      setError("Please select a category before saving a topic.");
      return;
    }
    if (!name.trim()) {
      setError("Topic name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    if (editing) {
      const { error } = await supabase.from("topics").update({ name, category_id: selectedCategoryId }).eq("id", editing.id);
      if (error) {
        setError(error.message);
      }
    } else {
      const { error } = await supabase.from("topics").insert({ name, category_id: selectedCategoryId });
      if (error) {
        setError(error.message);
      }
    }

    setName("");
    setEditing(null);
    await fetchTopics();
  };

  const handleEdit = (topic: Topic) => {
    setEditing(topic);
    setName(topic.name);
    setSelectedCategoryId(topic.category_id);
    const category = categories.find((category) => category.id === topic.category_id);
    if (category) {
      setSelectedSubjectId(category.subject_id);
    }
  };

  const handleDelete = async (topic: Topic) => {
    if (!window.confirm(`Delete topic ${topic.name}?`)) return;
    setLoading(true);
    const { error } = await supabase.from("topics").delete().eq("id", topic.id);
    if (error) {
      setError(error.message);
    } else {
      await fetchTopics();
    }
    setLoading(false);
  };

  const filteredCategories = categories.filter((category) => category.subject_id === selectedSubjectId);
  const filteredTopics = topics.filter((topic) => topic.category_id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#064e23] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Topics</h1>
            <p className="mt-2 text-slate-400">Create and manage topics under categories.</p>
          </div>
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 font-semibold text-[#052e16]">
            <Plus size={16} /> New Topic
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

          <label className="space-y-2 text-sm text-slate-200">
            Category
            <select value={selectedCategoryId ?? ""} onChange={(event) => setSelectedCategoryId(Number(event.target.value) || null)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
              <option value="">Select category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-200 lg:col-span-3">
            Topic Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
          </label>

          <div className="lg:col-span-3 flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-3 font-semibold text-[#052e16]">
              {editing ? "Save Topic" : "Add Topic"}
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
        {filteredTopics.map((topic) => (
          <div key={topic.id} className="rounded-3xl bg-[#065f2c] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{topic.name}</h2>
                <p className="mt-2 text-slate-400">
                  Subject: {subjects.find((subject) => subject.id === selectedSubjectId)?.name ?? "Unknown"} / Category: {categories.find((category) => category.id === topic.category_id)?.name ?? "Unknown"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleEdit(topic)} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  <Pencil size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(topic)} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredTopics.length === 0 && (
          <div className="rounded-3xl bg-[#065f2c] p-6 text-slate-400">No topics found for the selected subject and category.</div>
        )}
      </div>
    </div>
  );
}



