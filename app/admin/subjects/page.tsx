"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string; description: string | null };

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

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("subjects")
      .select("id, name, description")
      .order("name", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setSubjects((data ?? []) as Subject[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchSubjects();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setDescription("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Subject name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = { name: name.trim(), description: description.trim() || null };
    const result = editing
      ? await supabase.from("subjects").update(payload).eq("id", editing.id)
      : await supabase.from("subjects").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    resetForm();
    await fetchSubjects();
  };

  const handleEdit = (subject: Subject) => {
    setEditing(subject);
    setName(subject.name);
    setDescription(subject.description ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(`Delete subject "${subject.name}"? This cannot be undone.`)) return;
    setError(null);
    const { error: deleteError } = await supabase.from("subjects").delete().eq("id", subject.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (editing?.id === subject.id) resetForm();
    await fetchSubjects();
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-fg sm:text-2xl">Subjects</h1>
        <p className="mt-1 text-sm text-muted">Create, edit, and delete the subjects in your course hierarchy.</p>
      </div>

      {error && <div className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">{error}</div>}

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <p className="text-sm font-semibold text-fg sm:col-span-2">{editing ? "Edit subject" : "Add a subject"}</p>
          <label className={labelClass}>
            Subject name
            <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${field}`} />
          </label>
          <label className={labelClass}>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={`mt-1.5 ${field}`} />
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? "Saving..." : editing ? "Save subject" : "Add subject"}
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
            All subjects <span className="font-normal text-muted">({subjects.length})</span>
          </p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-px">
            <div className="h-16 bg-raised" />
            <div className="h-16 bg-raised" />
            <div className="h-16 bg-raised" />
          </div>
        ) : subjects.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No subjects yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-line">
            {subjects.map((subject) => (
              <li key={subject.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{subject.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{subject.description || "No description provided."}</p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button type="button" onClick={() => handleEdit(subject)} className={smallSecondary}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(subject)} className={smallDanger}>
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