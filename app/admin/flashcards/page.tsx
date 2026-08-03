"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, UploadCloud, Plus, Trash2 } from "lucide-react";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };
type Flashcard = { id: string; front: string; back: string; explanation: string | null };

const TEMPLATE_HEADERS = ["front", "back", "explanation"];

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
  const [preview, setPreview] = useState<{front: string; back: string; explanation: string | null}[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(true);

  // Single card form
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [explanation, setExplanation] = useState("");
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLookupLoading(true);
      const [sRes, cRes, tRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("categories").select("id, subject_id, name").order("name"),
        supabase.from("topics").select("id, category_id, name").order("name"),
      ]);
      setSubjects(sRes.data || []);
      setCategories(cRes.data || []);
      setTopics(tRes.data || []);
      setLookupLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedTopicId) { setFlashcards([]); return; }
    const fetchCards = async () => {
      const { data } = await supabase
        .from("flashcards")
        .select("id, front, back, explanation")
        .eq("topic_id", selectedTopicId)
        .order("created_at");
      setFlashcards(data || []);
    };
    fetchCards();
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

  const filteredCategories = categories.filter(c => c.subject_id === selectedSubjectId);
  const filteredTopics = topics.filter(t => t.category_id === selectedCategoryId);

  const parseCsv = (text: string) => {
    const rows = text.split(/\r?\n/).filter(r => r.trim());
    if (rows.length === 0) throw new Error("CSV is empty.");
    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.split(",").map(h => h.trim());
    if (headers.join(",") !== TEMPLATE_HEADERS.join(",")) {
      throw new Error(`Headers must be: ${TEMPLATE_HEADERS.join(",")}`);
    }
    return dataRows.map((row, i) => {
      const values = row.split(",").map(v => v.trim());
      if (!values[0]) throw new Error(`Row ${i + 2}: front is required.`);
      if (!values[1]) throw new Error(`Row ${i + 2}: back is required.`);
      return {
        front: values[0],
        back: values[1],
        explanation: values[2] || null,
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setCsvText(text);
    setMessage(`${file.name} loaded.`);
    setError(null);
  };

  const handlePreview = () => {
    if (!selectedTopicId) { setError("Please select a topic first."); return; }
    try {
      const parsed = parseCsv(csvText);
      setPreview(parsed);
      setMessage(`Parsed ${parsed.length} flashcard(s). Review and upload.`);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setPreview([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedTopicId) { setError("Please select a topic."); return; }
    try {
      setLoading(true);
      setError(null);
      const parsed = parseCsv(csvText);
      const payload = parsed.map(p => ({ ...p, topic_id: selectedTopicId }));
      const { error: uploadError } = await supabase.from("flashcards").insert(payload);
      if (uploadError) throw new Error(uploadError.message);
      setMessage(`Successfully uploaded ${payload.length} flashcards.`);
      setCsvText("");
      setPreview([]);
      setFileName(null);
      // Refresh list
      const { data } = await supabase.from("flashcards").select("id, front, back, explanation").eq("topic_id", selectedTopicId).order("created_at");
      setFlashcards(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!selectedTopicId) { setError("Please select a topic first."); return; }
    if (!front.trim() || !back.trim()) { setError("Front and back are required."); return; }
    setAddingCard(true);
    const { error } = await supabase.from("flashcards").insert({
      topic_id: selectedTopicId,
      front,
      back,
      explanation: explanation || null,
    });
    if (error) { setError(error.message); setAddingCard(false); return; }
    setFront(""); setBack(""); setExplanation("");
    setMessage("Flashcard added successfully.");
    const { data } = await supabase.from("flashcards").select("id, front, back, explanation").eq("topic_id", selectedTopicId).order("created_at");
    setFlashcards(data || []);
    setAddingCard(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this flashcard?")) return;
    await supabase.from("flashcards").delete().eq("id", id);
    setFlashcards(prev => prev.filter(f => f.id !== id));
  };

  const handleDownloadTemplate = () => {
    const content = [TEMPLATE_HEADERS.join(","), "What is the resting membrane potential?,−70mV,This is the voltage difference across the membrane at rest"].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eduprime-flashcard-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="rounded-xl border border-white/10 bg-[#064e23] p-4 sm:p-6">
        <h1 className="text-xl font-bold text-white sm:text-2xl">Flashcards</h1>
        <p className="mt-1 text-sm text-slate-400">Add and manage flashcards by topic.</p>
      </div>

      {/* Topic Selection */}
      <div className="rounded-xl bg-[#064e23] border border-white/10 p-4 sm:p-6">
        {lookupLoading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Subject</label>
              <select value={selectedSubjectId} onChange={e => handleSubjectChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select value={selectedCategoryId} onChange={e => handleCategoryChange(e.target.value)}
                disabled={!selectedSubjectId}
                className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-50">
                <option value="">Select category</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Topic</label>
              <select value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}
                disabled={!selectedCategoryId}
                className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-sm text-white focus:outline-none disabled:opacity-50">
                <option value="">Select topic</option>
                {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {selectedTopicId && (
        <>
          {/* Add single card */}
          <div className="rounded-xl bg-[#064e23] border border-white/10 p-4 sm:p-6">
            <h2 className="text-base font-semibold text-white mb-4">Add Single Flashcard</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Front (Question)</label>
                <textarea value={front} onChange={e => setFront(e.target.value)} rows={2}
                  placeholder="Enter the question or term..."
                  className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Back (Answer)</label>
                <textarea value={back} onChange={e => setBack(e.target.value)} rows={2}
                  placeholder="Enter the answer..."
                  className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Explanation (optional)</label>
                <textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={2}
                  placeholder="Add an explanation..."
                  className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none" />
              </div>
              <button onClick={handleAddCard} disabled={addingCard}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#22c55e] transition disabled:opacity-60">
                <Plus size={16} /> {addingCard ? "Adding..." : "Add Flashcard"}
              </button>
            </div>
          </div>

          {/* Bulk CSV upload */}
          <div className="rounded-xl bg-[#064e23] border border-white/10 p-4 sm:p-6">
            <h2 className="text-base font-semibold text-white mb-4">Bulk Upload via CSV</h2>

            <div className="rounded-lg bg-slate-900/50 p-4 mb-4">
              <p className="text-xs text-slate-400 mb-2">Expected CSV format:</p>
              <div className="flex gap-2 mb-2">
                {TEMPLATE_HEADERS.map(h => (
                  <span key={h} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">{h}</span>
                ))}
              </div>
              <p className="text-xs text-slate-400">explanation column is optional</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <button onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
                <Download size={14} /> Download Template
              </button>
              <button onClick={handlePreview}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 transition">
                Preview Rows
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1">Upload CSV</label>
              <input type="file" accept=".csv" onChange={handleFileChange}
                className="w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-2 text-sm text-white file:rounded-lg file:border-0 file:bg-[#16a34a] file:px-3 file:py-1 file:text-xs file:text-white file:font-semibold file:mr-3" />
              {fileName && <p className="mt-1 text-xs text-slate-400">Loaded: {fileName}</p>}
            </div>

            <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
              placeholder="Or paste CSV here..."
              className="min-h-[150px] w-full rounded-lg border border-white/10 bg-[#0a1f0f] px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none mb-4" />

            {message && <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 mb-3">{message}</p>}
            {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-3">{error}</p>}

            {preview.length > 0 && (
              <div className="rounded-lg border border-white/10 overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Preview — {preview.length} card(s)</p>
                  <button onClick={() => setPreview([])} className="text-xs text-slate-400 hover:text-white">Clear</button>
                </div>
                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                  {preview.map((p, i) => (
                    <div key={i} className="px-4 py-3">
                      <p className="text-sm font-medium text-white truncate">{p.front}</p>
                      <p className="text-xs text-slate-400 truncate">{p.back}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleUpload} disabled={loading || !csvText.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#22c55e] transition disabled:opacity-60">
              <UploadCloud size={16} /> {loading ? "Uploading..." : "Upload Flashcards"}
            </button>
          </div>

          {/* Existing flashcards */}
          {flashcards.length > 0 && (
            <div className="rounded-xl bg-[#064e23] border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white">{flashcards.length} Flashcard(s) in this topic</p>
              </div>
              <div className="divide-y divide-white/5">
                {flashcards.map(f => (
                  <div key={f.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{f.front}</p>
                      <p className="text-xs text-slate-400 truncate">{f.back}</p>
                    </div>
                    <button onClick={() => handleDelete(f.id)}
                      className="flex-shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}