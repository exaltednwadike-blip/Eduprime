"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };

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

export default function AdminCategoriesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const subjectsData = (subjectRes.data ?? []) as Subject[];
      const categoriesData = (categoryRes.data ?? []) as Category[];

      setSubjects(subjectsData);
      setCategories(categoriesData);
      setSelectedSubjectId((prev) => prev || subjectsData[0]?.id || "");
    } catch (err: any) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error: queryError } = await supabase
      .from("categories")
      .select("id, subject_id, name")
      .order("name", { ascending: true });
    if (queryError) {
      setError(queryError.message);
      return;
    }
    setCategories((data ?? []) as Category[]);
  };

  useEffect(() => {
    void fetchLookupData();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
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

    setSaving(true);
    setError(null);

    const payload = { name: name.trim(), subject_id: selectedSubjectId };
    const result = editing
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    resetForm();
    await fetchCategories();
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setSelectedSubjectId(category.subject_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;
    setError(null);
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", category.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (editing?.id === category.id) resetForm();
    await fetchCategories();
  };

  const filteredCategories = categories.filter((category) => category.subject_id === selectedSubjectId);
  const selectedSubjectName = subjects.find((subject) => subject.id === selectedSubjectId)?.name;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-fg sm:text-2xl">Categories</h1>
        <p className="mt-1 text-sm text-muted">Organise categories under subjects in your course hierarchy.</p>
      </div>

      {error && <div className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">{error}</div>}

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          <p className="text-sm font-semibold text-fg sm:col-span-3">{editing ? "Edit category" : "Add a category"}</p>
          <label className={labelClass}>
            Subject
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className={`mt-1.5 ${field}`}
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Category name
            <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${field}`} />
          </label>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? "Saving..." : editing ? "Save category" : "Add category"}
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
            {selectedSubjectName ? `Categories in ${selectedSubjectName}` : "Categories"}{" "}
            <span className="font-normal text-muted">({filteredCategories.length})</span>
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-px">
            <div className="h-14 bg-raised" />
            <div className="h-14 bg-raised" />
            <div className="h-14 bg-raised" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No categories available for the selected subject.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filteredCategories.map((category) => (
              <li key={category.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 flex-1 text-sm font-medium text-fg">{category.name}</p>
                <div className="flex flex-shrink-0 gap-2">
                  <button type="button" onClick={() => handleEdit(category)} className={smallSecondary}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(category)} className={smallDanger}>
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