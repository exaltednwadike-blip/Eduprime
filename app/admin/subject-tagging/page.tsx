"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };

const courses = [
  "MBBS (Medicine and Surgery)",
  "Nursing Science",
  "Pharmacy",
  "Medical Laboratory Science",
  "Radiography and Radiological Sciences",
  "Physiotherapy",
  "Dentistry",
];
const levels = [100, 200, 300, 400, 500, 600];

const field =
  "rounded-[10px] border border-line bg-canvas px-3.5 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary";
const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

export default function SubjectTaggingPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [course, setCourse] = useState(courses[0]);
  const [level, setLevel] = useState(100);
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("subjects").select("id, name").order("name");
      setSubjects(((data as Subject[]) || []).map((s) => ({ ...s, id: String(s.id) })));
    })();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setMessage(null);
      const { data } = await supabase
        .from("subject_offerings")
        .select("subject_id")
        .eq("course_of_study", course)
        .eq("level", level);
      if (!active) return;
      const ids = (data || []).map((row: { subject_id: string }) => String(row.subject_id));
      setSaved(ids);
      setSelected(ids);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [course, level]);

  const dirty = selected.length !== saved.length || selected.some((id) => !saved.includes(id));

  const toggleSubject = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);

    const toRemove = saved.filter((id) => !selected.includes(id));
    const toAdd = selected.filter((id) => !saved.includes(id));

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("subject_offerings")
        .delete()
        .eq("course_of_study", course)
        .eq("level", level)
        .in("subject_id", toRemove);
      if (error) {
        setSaving(false);
        setMessage({ ok: false, text: error.message });
        return;
      }
    }

    if (toAdd.length > 0) {
      const { error } = await supabase
        .from("subject_offerings")
        .insert(toAdd.map((subject_id) => ({ subject_id, course_of_study: course, level })));
      if (error) {
        setSaving(false);
        setMessage({ ok: false, text: error.message });
        return;
      }
    }

    setSaved(selected);
    setSaving(false);
    setMessage({ ok: true, text: "Saved." });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Subject tagging</h1>
        <p className="mt-1 text-sm text-muted">
          Choose a course and level, then tick the subjects that course takes at that level.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select value={course} onChange={(e) => setCourse(e.target.value)} className={`flex-1 ${field}`}>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className={field}>
          {levels.map((l) => (
            <option key={l} value={l}>
              {l} Level
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-11 rounded-xl bg-raised" />
            <div className="h-11 rounded-xl bg-raised" />
            <div className="h-11 rounded-xl bg-raised" />
          </div>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-muted">No subjects have been added yet.</p>
        ) : (
          <div className="space-y-2">
            {subjects.map((subject) => {
              const checked = selected.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleSubject(subject.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm text-fg transition ${
                    checked ? "border-primary bg-primary-soft" : "border-line bg-surface hover:bg-raised"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                      checked ? "border-primary bg-primary text-on-primary" : "border-line bg-canvas text-transparent"
                    }`}
                  >
                    <Check size={14} />
                  </span>
                  <span className="flex-1">{subject.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving || loading || !dirty} className={primaryButton}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saving ? "Saving..." : "Save"}
        </button>
        <span className="text-xs text-muted">{selected.length} selected</span>
        {message && (
          <span className={`text-sm ${message.ok ? "text-primary" : "text-danger"}`}>{message.text}</span>
        )}
      </div>
    </div>
  );
}