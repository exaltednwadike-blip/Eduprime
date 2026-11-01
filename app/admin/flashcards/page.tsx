"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Download, Plus, Trash2, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type Flashcard = { id: string; front: string; back: string; explanation: string | null };
type ParsedCard = { front: string; back: string; explanation: string | null };

const TEMPLATE_HEADERS = ["front", "back", "explanation"];

const parseRow = (row: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const parseCsv = (text: string): ParsedCard[] => {
  const rows = text.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rows.length === 0) throw new Error("CSV is empty.");

  const [headerRow, ...dataRows] = rows;
  const headers = parseRow(headerRow).map((h) => h.toLowerCase());
  const headerOk =
    headers[0] === "front" &&
    headers[1] === "back" &&
    (headers.length === 2 || (headers.length === 3 && headers[2] === "explanation"));
  if (!headerOk) {
    throw new Error(`The first row must be: ${TEMPLATE_HEADERS.join(",")} (the explanation column is optional).`);
  }
  if (dataRows.length === 0) throw new Error("Add at least one card below the header row.");

  return dataRows.map((row, i) => {
    const values = parseRow(row);
    if (!values[0]) throw new Error(`Row ${i + 2}: front is required.`);
    if (!values[1]) throw new Error(`Row ${i + 2}: back is required.`);
    return { front: values[0], back: values[1], explanation: values[2] ? values[2] : null };
  });
};

const field =
  "w-full rounded-[10px] border border-line bg-canvas px-3.5 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-raised";
const smallDanger =
  "inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-danger px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-soft";

export default function AdminFlashcardsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [preview, setPreview] = useState<ParsedCard[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(true);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [explanation, setExplanation] = useState("");
  const [addingCard, setAddingCard] = useState(false);

  const fetchCards = async (topicId: string) => {
    const { data, error: queryError } = await supabase
      .from("flashcards")
      .select("id, front, back, explanation")
      .eq("topic_id", topicId)
      .order("created_at");
    if (queryError) {
      setError(queryError.message);
      return;
    }
    setFlashcards((data ?? []) as Flashcard[]);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLookupLoading(true);
      const [sRes, cRes, tRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("categories").select("id, subject_id, name").order("name"),
        supabase.from("topics").select("id, category_id, name").order("name"),
      ]);
      if (sRes.error || cRes.error || tRes.error) {
        setError(sRes.error?.message || cRes.error?.message || tRes.error?.message || "Failed to load data.");
      }
      setSubjects((sRes.data ?? []) as Subject[]);
      setCategories((cRes.data ?? []) as Category[]);
      setTopics((tRes.data ?? []) as Topic[]);
      setLookupLoading(false);
    };
    void fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedTopicId) {
      setFlashcards([]);
      return;
    }
    void fetchCards(selectedTopicId);
  }, [selectedTopicId]);

  const handleSubjectChange = (id: string) => {
    setSelectedSubjectId(id);
    setSelectedCategoryId("");
    setSelectedTopicId("");
  };

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id);
    setSelectedTopicId("");
  };

  const filteredCategories = categories.filter((c) => c.subject_id === selectedSubjectId);
  const filteredTopics = topics.filter((t) => t.category_id === selectedCategoryId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    try {
      const text = await file.text();
      setCsvText(text);
      setPreview([]);
      setMessage(`${file.name} loaded. Click Preview to check it.`);
    } catch {
      setError("Unable to read the selected CSV file.");
      setFileName(null);
    }
  };

  const handlePreview = () => {
    if (!selectedTopicId) {
      setError("Please select a topic first.");
      return;
    }
    try {
      const parsed = parseCsv(csvText);
      setPreview(parsed);
      setMessage(`Parsed ${parsed.length} flashcard${parsed.length === 1 ? "" : "s"}. Review and upload.`);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setMessage(null);
      setPreview([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedTopicId) {
      setError("Please select a topic.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const parsed = parseCsv(csvText);
      const payload = parsed.map((p) => ({ ...p, topic_id: selectedTopicId }));
      const { error: uploadError } = await supabase.from("flashcards").insert(payload);
      if (uploadError) throw new Error(uploadError.message);
      setMessage(`Uploaded ${payload.length} flashcard${payload.length === 1 ? "" : "s"}.`);
      setCsvText("");
      setPreview([]);
      setFileName(null);
      setFileKey((k) => k + 1);
      await fetchCards(selectedTopicId);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!selectedTopicId) {
      setError("Please select a topic first.");
      return;
    }
    if (!front.trim() || !back.trim()) {
      setError("Front and back are required.");
      return;
    }
    setAddingCard(true);
    setError(null);
    setMessage(null);
    const { error: insertError } = await supabase.from("flashcards").insert({
      topic_id: selectedTopicId,
      front: front.trim(),
      back: back.trim(),
      explanation: explanation.trim() || null,
    });
    setAddingCard(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setFront("");
    setBack("");
    setExplanation("");
    setMessage("Flashcard added.");
    await fetchCards(selectedTopicId);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this flashcard?")) return;
    setError(null);
    const { error: deleteError } = await supabase.from("flashcards").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDownloadTemplate = () => {
    const content = [
      TEMPLATE_HEADERS.join(","),
      "What is the resting membrane potential?,-70 mV,The voltage difference across the membrane at rest",
    ].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eduprime-flashcard-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-fg sm:text-2xl">Flashcards</h1>
        <p className="mt-1 text-sm text-muted">Add and manage flashcards by topic.</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        {lookupLoading ? (
          <div className="grid animate-pulse gap-4 sm:grid-cols-3">
            <div className="h-10 rounded-[10px] bg-raised" />
            <div className="h-10 rounded-[10px] bg-raised" />
            <div className="h-10 rounded-[10px] bg-raised" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Subject</label>
              <select value={selectedSubjectId} onChange={(e) => handleSubjectChange(e.target.value)} className={field}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={!selectedSubjectId}
                className={field}
              >
                <option value="">Select category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Topic</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={!selectedCategoryId}
                className={field}
              >
                <option value="">Select topic</option>
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && <div className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">{error}</div>}
      {message && <div className="rounded-xl border border-primary bg-primary-soft px-4 py-3 text-sm text-fg">{message}</div>}

      {selectedTopicId && (
        <>
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-fg">Add a single flashcard</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Front (question or term)</label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  rows={2}
                  placeholder="Enter the question or term..."
                  className={field}
                />
              </div>
              <div>
                <label className={labelClass}>Back (answer)</label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  rows={2}
                  placeholder="Enter the answer..."
                  className={field}
                />
              </div>
              <div>
                <label className={labelClass}>Explanation (optional)</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  placeholder="Add an explanation..."
                  className={field}
                />
              </div>
              <button onClick={handleAddCard} disabled={addingCard} className={primaryButton}>
                <Plus size={16} /> {addingCard ? "Adding..." : "Add flashcard"}
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-fg">Bulk upload via CSV</h2>

            <div className="rounded-xl bg-raised p-4">
              <p className="mb-2 text-xs font-medium text-muted">Expected CSV columns</p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_HEADERS.map((h) => (
                  <span key={h} className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-fg">
                    {h}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                The explanation column is optional. Put quotes around any cell that contains a comma.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleDownloadTemplate} className={secondaryButton}>
                <Download size={14} /> Download template
              </button>
              <button onClick={handlePreview} className={secondaryButton}>
                Preview rows
              </button>
            </div>

            <div>
              <label className={labelClass}>Upload CSV file</label>
              <input
                key={fileKey}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className={`${field} file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-on-primary`}
              />
              {fileName && <p className="mt-1 text-xs text-muted">Loaded: {fileName}</p>}
            </div>

            <div>
              <label className={labelClass}>Or paste CSV here</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV here..."
                className={`${field} min-h-[150px]`}
              />
            </div>

            {preview.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold text-fg">Preview: {preview.length} card(s)</p>
                  <button onClick={() => setPreview([])} className="text-xs text-muted hover:text-fg">
                    Clear
                  </button>
                </div>
                <div className="max-h-48 divide-y divide-line overflow-y-auto">
                  {preview.map((p, i) => (
                    <div key={i} className="px-4 py-3">
                      <p className="truncate text-sm font-medium text-fg">{p.front}</p>
                      <p className="truncate text-xs text-muted">{p.back}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleUpload} disabled={loading || !csvText.trim()} className={primaryButton}>
              <UploadCloud size={16} /> {loading ? "Uploading..." : "Upload flashcards"}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-fg">
                Flashcards in this topic <span className="font-normal text-muted">({flashcards.length})</span>
              </p>
            </div>
            {flashcards.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">No flashcards in this topic yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {flashcards.map((f) => (
                  <li key={f.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{f.front}</p>
                      <p className="truncate text-xs text-muted">{f.back}</p>
                    </div>
                    <button onClick={() => handleDelete(f.id)} className={smallDanger} aria-label="Delete flashcard">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}