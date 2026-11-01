"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };

const field =
  "w-full rounded-[10px] border border-line bg-canvas px-3.5 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";
const labelClass = "block text-sm font-medium text-fg";
const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-raised disabled:cursor-not-allowed disabled:opacity-50";
const smallSecondary =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-raised";
const smallDanger =
  "inline-flex items-center gap-1.5 rounded-lg border border-danger px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-soft";

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

      const subjectsData = (subjectRes.data ?? []) as Subject[];
      const categoriesData = (categoryRes.data ?? []) as Category[];

      setSubjects(subjectsData);
      setCategories(categoriesData);
      setTopics((topicRes.data ?? []) as Topic[]);

      if (subjectsData[0]) {
        setSelectedSubjectId(subjectsData[0].id);
        const firstCategory = categoriesData.find((c) => c.subject_id === subjectsData[0].id);
        if (firstCategory) setSelectedCategoryId(firstCategory.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    const { data, error: queryError } = await supabase.from("topics").select("id, category_id, name").order("name");
    if (queryError) {
      setError(queryError.message);
      return;
    }
    setTopics((data ?? []) as Topic[]);
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const firstCategory = categories.find((c) => c.subject_id === subjectId);
    setSelectedCategoryId(firstCategory ? firstCategory.id : "");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCategoryId) {
      setError("Please select a category.");
      return;
    }
    if (!name.trim()) {
      setError("Topic name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = { name: name.trim(), category_id: selectedCategoryId };
    const result = editing
      ? await supabase.from("topics").update(payload).eq("id", editing.id)
      : await supabase.from("topics").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    resetForm();
    await fetchTopics();
  };

  const handleEdit = (topic: Topic) => {
    setEditing(topic);
    setName(topic.name);
    setSelectedCategoryId(topic.category_id);
    const category = categories.find((c) => c.id === topic.category_id);
    if (category) setSelectedSubjectId(category.subject_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (topic: Topic) => {
    if (!window.confirm(`Delete topic "${topic.name}"? Questions under it may be deleted too. This cannot be undone.`)) return;
    setError(null);
    const { error: deleteError } = await supabase.from("topics").delete().eq("id", topic.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (editing?.id === topic.id) resetForm();
    await fetchTopics();
  };

  const filteredCategories = categories.filter((c) => c.subject_id === selectedSubjectId);
  const filteredTopics = topics.filter((t) => t.category_id === selectedCategoryId);
  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-fg sm:text-2xl">Topics</h1>
        <p className="mt-1 text-sm text-muted">Create and manage topics under categories.</p>
      </div>

      {error && <div className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">{error}</div>}

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Subject
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className={`mt-1.5 ${field}`}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Category
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className={`mt-1.5 ${field}`}
            >
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-line pt-5">
          <p className="text-sm font-semibold text-fg">{editing ? "Edit topic" : "Add a topic"}</p>
          <label className={labelClass}>
            Topic name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Trigeminal nerve"
              className={`mt-1.5 ${field}`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? "Saving..." : editing ? "Save changes" : "Add topic"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className={secondaryButton}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-fg">
            {selectedCategoryName ? `Topics in ${selectedCategoryName}` : "Topics"}{" "}
            <span className="font-normal text-muted">({filteredTopics.length})</span>
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-px">
            <div className="h-14 bg-raised" />
            <div className="h-14 bg-raised" />
            <div className="h-14 bg-raised" />
          </div>
        ) : filteredTopics.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No topics found for this category. Add one above.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filteredTopics.map((topic) => (
              <li key={topic.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 flex-1 text-sm font-medium text-fg">{topic.name}</p>
                <div className="flex flex-shrink-0 gap-2">
                  <button type="button" onClick={() => handleEdit(topic)} className={smallSecondary}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(topic)} className={smallDanger}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}