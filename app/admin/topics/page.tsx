"use client";

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };

export default function AdminTopicsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthChecked(true); return; }

      const { data: adminData } = await supabase
        .from("admins")
        .select("email")
        .eq("email", user.email)
        .single();

      setIsAdmin(!!adminData);
      setAuthChecked(true);

      if (adminData) {
        await fetchAll();
      }
    };
    checkAdminAndLoad();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectRes, categoryRes, topicRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("categories").select("id, subject_id, name").order("name"),
        supabase.from("topics").select("id, category_id, name").order("name"),
      ]);

      if (subjectRes.error) throw new Error(subjectRes.error.message);
      if (categoryRes.error) throw new Error(categoryRes.error.message);
      if (topicRes.error) throw new Error(topicRes.error.message);

      setSubjects(subjectRes.data ?? []);
      setCategories(categoryRes.data ?? []);
      setTopics(topicRes.data ?? []);

      if (subjectRes.data?.[0]) {
        setSelectedSubjectId(subjectRes.data[0].id);
        const firstCategory = categoryRes.data?.find(c => c.subject_id === subjectRes.data![0].id);
        if (firstCategory) setSelectedCategoryId(firstCategory.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase.from("topics").select("id, category_id, name").order("name");
    if (error) { setError(error.message); return; }
    setTopics(data ?? []);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedCategoryId("");
    const firstCategory = categories.find(c => c.subject_id === subjectId);
    if (firstCategory) setSelectedCategoryId(firstCategory.id);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCategoryId) { setError("Please select a category."); return; }
    if (!name.trim()) { setError("Topic name is required."); return; }

    setSaving(true);
    setError(null);

    if (editing) {
      const { error } = await supabase.from("topics").update({ name, category_id: selectedCategoryId }).eq("id", editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("topics").insert({ name, category_id: selectedCategoryId });
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setName("");
    setEditing(null);
    setSaving(false);
    await fetchTopics();
  };

  const handleEdit = (topic: Topic) => {
    setEditing(topic);
    setName(topic.name);
    setSelectedCategoryId(topic.category_id);
    const category = categories.find(c => c.id === topic.category_id);
    if (category) setSelectedSubjectId(category.subject_id);
  };

  const handleDelete = async (topic: Topic) => {
    if (!window.confirm(`Delete topic "${topic.name}"? This will also delete all questions under it.`)) return;
    setLoading(true);
    const { error } = await supabase.from("topics").delete().eq("id", topic.id);
    if (error) setError(error.message);
    else await fetchTopics();
    setLoading(false);
  };

  const filteredCategories = categories.filter(c => c.subject_id === selectedSubjectId);
  const filteredTopics = topics.filter(t => t.category_id === selectedCategoryId);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2db54a] border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1f0f]">
        <div className="text-center">
          <p className="text-xl font-semibold text-white">Access Denied</p>
          <p className="mt-2 text-gray-400">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Topics</h1>
          <p className="mt-1 text-sm text-gray-400">Create and manage topics under categories.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setName(""); }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2db54a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a5c2a] transition"
        >
          <Plus size={16} /> New Topic
        </button>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-[#0f2914] border border-white/10 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          {editing ? "Edit Topic" : "Add New Topic"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-white focus:border-[#2db54a] focus:outline-none"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-white focus:border-[#2db54a] focus:outline-none"
              >
                <option value="">Select category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Topic Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Trigeminal Nerve"
              className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-white placeholder:text-gray-500 focus:border-[#2db54a] focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#2db54a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1a5c2a] transition disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Topic"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(null); setName(""); }}
                className="rounded-lg border border-white/20 px-5 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Topics List */}
      <div className="rounded-xl bg-[#0f2914] border border-white/10 overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="">All Categories</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading topics...</div>
        ) : filteredTopics.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No topics found. Add one above.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">Topic Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTopics.map((topic) => {
                const category = categories.find(c => c.id === topic.category_id);
                const subject = subjects.find(s => s.id === category?.subject_id);
                return (
                  <tr key={topic.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm font-medium text-white">{topic.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{category?.name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{subject?.name || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(topic)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(topic)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}