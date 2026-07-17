"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Download, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };

type ParsedRecord = {
  question: string;
  type: string;
  answer: string;
  explanation: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: string | number | null;
  year: number | null;
};

const TEMPLATE_HEADERS = [
  "question", "type", "answer", "explanation",
  "option_a", "option_b", "option_c", "option_d",
  "correct_option", "year",
];

const parseCsv = (text: string) => {
  const parseRow = (row: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rows = text.split(/\r?\n/).filter((row) => row.trim().length > 0);
  if (rows.length === 0) throw new Error("CSV data is empty.");

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.split(",").map((v) => v.trim());
  if (headers.join(",") !== TEMPLATE_HEADERS.join(",")) {
    throw new Error(`CSV header row must match exactly: ${TEMPLATE_HEADERS.join(",")}`);
  }

  return dataRows.map((row, rowIndex) => {
    const values = parseRow(row);
    if (values.length < headers.length) throw new Error(`Row ${rowIndex + 2} has too few columns.`);
    const record: Record<string, string | null> = {};
    headers.forEach((header, index) => { record[header] = values[index] ?? null; });
    return {
      question: record.question ?? null,
      type: record.type ?? null,
      answer: record.answer ?? null,
      explanation: record.explanation ?? null,
      option_a: record.option_a ?? null,
      option_b: record.option_b ?? null,
      option_c: record.option_c ?? null,
      option_d: record.option_d ?? null,
      correct_option: record.correct_option ?? null,
      year: record.year ?? null,
    };
  });
};

const parsePayload = (records: Array<Record<string, string | null>>, topicId: string) => {
  return records.map((record, index) => {
    const type = (record.type || "").trim().toLowerCase();
    if (type !== "mcq" && type !== "theory") throw new Error(`Row ${index + 2}: type must be MCQ or Theory.`);
    if (!record.question?.trim()) throw new Error(`Row ${index + 2}: question is required.`);
    if (!record.answer?.trim()) throw new Error(`Row ${index + 2}: answer is required.`);

    let normalizedCorrect: number | null = null;
    if (type === "mcq") {
      ["option_a", "option_b", "option_c", "option_d"].forEach((opt) => {
        if (!record[opt]?.trim()) throw new Error(`Row ${index + 2}: ${opt} is required for MCQ.`);
      });
      const rawCorrect = record.correct_option?.trim();
      if (!rawCorrect) throw new Error(`Row ${index + 2}: correct_option is required for MCQ.`);
      if (/^[A-D]$/i.test(rawCorrect)) {
        normalizedCorrect = ["A", "B", "C", "D"].indexOf(rawCorrect.toUpperCase());
      } else if (/^[0-3]$/.test(rawCorrect)) {
        normalizedCorrect = Number(rawCorrect);
      } else {
        throw new Error(`Row ${index + 2}: correct_option must be A/B/C/D or 0/1/2/3.`);
      }
    }

    return {
      topic_id: topicId,
      question: record.question || "",
      type,
      answer: record.answer || "",
      explanation: record.explanation || null,
      option_a: record.option_a || null,
      option_b: record.option_b || null,
      option_c: record.option_c || null,
      option_d: record.option_d || null,
      correct_option: normalizedCorrect,
      year: record.year ? Number(record.year) : null,
    };
  });
};

export default function AdminBulkUploadPage() {
  const [csvText, setCsvText] = useState("");
  const [previewRecords, setPreviewRecords] = useState<ParsedRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchLookups = async () => {
      setLookupLoading(true);
      setLookupError(null);
      try {
        const [subjectsRes, categoriesRes, topicsRes] = await Promise.all([
          supabase.from("subjects").select("id, name").order("name"),
          supabase.from("categories").select("id, subject_id, name").order("name"),
          supabase.from("topics").select("id, category_id, name").order("name"),
        ]);
        if (subjectsRes.error) throw new Error(subjectsRes.error.message);
        if (categoriesRes.error) throw new Error(categoriesRes.error.message);
        if (topicsRes.error) throw new Error(topicsRes.error.message);

        setSubjects(subjectsRes.data ?? []);
        setCategories(categoriesRes.data ?? []);
        setTopics(topicsRes.data ?? []);

        const firstSubject = subjectsRes.data?.[0];
        if (firstSubject) {
          setSelectedSubjectId(firstSubject.id);
          const firstCategory = categoriesRes.data?.find(c => c.subject_id === firstSubject.id);
          if (firstCategory) {
            setSelectedCategoryId(firstCategory.id);
            const firstTopic = topicsRes.data?.find(t => t.category_id === firstCategory.id);
            if (firstTopic) setSelectedTopicId(firstTopic.id);
          }
        }
      } catch (err: any) {
        setLookupError(err.message || "Failed to load data.");
      } finally {
        setLookupLoading(false);
      }
    };
    fetchLookups();
  }, []);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedCategoryId("");
    setSelectedTopicId("");
    const firstCategory = categories.find(c => c.subject_id === subjectId);
    if (firstCategory) {
      setSelectedCategoryId(firstCategory.id);
      const firstTopic = topics.find(t => t.category_id === firstCategory.id);
      if (firstTopic) setSelectedTopicId(firstTopic.id);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedTopicId("");
    const firstTopic = topics.find(t => t.category_id === categoryId);
    if (firstTopic) setSelectedTopicId(firstTopic.id);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setMessage(null);
    try {
      const text = await file.text();
      setCsvText(text);
      setPreviewRecords([]);
      setMessage(`${file.name} loaded. Click Preview to validate.`);
    } catch {
      setError("Unable to read the selected CSV file.");
      setFileName(null);
    }
  };

  const handleParse = () => {
    if (!selectedTopicId) { setError("Please select a topic first."); return; }
    try {
      setError(null);
      setMessage(null);
      const records = parseCsv(csvText);
      const payload = parsePayload(records, selectedTopicId);
      setPreviewRecords(payload);
      setMessage(`Parsed ${payload.length} row(s). Review below and upload.`);
    } catch (err: any) {
      setPreviewRecords([]);
      setError(err.message || "Failed to parse CSV.");
    }
  };

  const handleUpload = async () => {
    if (!selectedTopicId) { setError("Please select a topic first."); return; }
    try {
      setError(null);
      setMessage(null);
      setLoading(true);
      const records = parseCsv(csvText);
      const payload = parsePayload(records, selectedTopicId);
      const { error: uploadError } = await supabase.from("questions").insert(payload);
      if (uploadError) throw new Error(uploadError.message);
      setMessage(`Successfully uploaded ${payload.length} questions.`);
      setCsvText("");
      setPreviewRecords([]);
      setFileName(null);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [TEMPLATE_HEADERS.join(","), "What is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025"].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "eduprime-question-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredCategories = categories.filter(c => c.subject_id === selectedSubjectId);
  const filteredTopics = topics.filter(t => t.category_id === selectedCategoryId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-xl border border-white/10 bg-[#064e23] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Bulk Upload Questions</h1>
            <p className="mt-1 text-sm text-slate-400">Select a topic first, then upload questions.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white">
            <UploadCloud size={16} /> CSV Upload
          </div>
        </div>
      </div>

      {/* Selection */}
      <div className="rounded-xl bg-[#064e23] p-4 sm:p-6">
        {lookupLoading ? (
          <p className="text-sm text-slate-300">Loading...</p>
        ) : lookupError ? (
          <p className="text-sm text-red-400">{lookupError}</p>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-slate-300">Please add subjects, categories and topics first.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#16a34a] focus:outline-none"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={!selectedSubjectId}
                className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#16a34a] focus:outline-none disabled:opacity-50"
              >
                <option value="">Select category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Topic</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={!selectedCategoryId}
                className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-[#16a34a] focus:outline-none disabled:opacity-50"
              >
                <option value="">Select topic</option>
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Upload section - only show when topic selected */}
      {selectedTopicId && (
        <div className="rounded-xl bg-[#064e23] p-4 sm:p-6 space-y-4">
          {/* Template info */}
          <div className="rounded-lg bg-slate-900/50 p-4">
            <p className="text-xs font-medium text-slate-400 mb-2">Expected CSV format:</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {TEMPLATE_HEADERS.map((h) => (
                <span key={h} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">{h}</span>
              ))}
            </div>
            <p className="text-xs text-slate-400">correct_option: A/B/C/D or 0/1/2/3 — type: MCQ or Theory</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
            >
              <Download size={14} /> Download Template
            </button>
            <button
              onClick={() => setCsvText(TEMPLATE_HEADERS.join(",") + "\nWhat is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 transition"
            >
              Fill Example
            </button>
            <button
              onClick={handleParse}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 transition"
            >
              Preview Rows
            </button>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Upload CSV File</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white file:rounded-lg file:border-0 file:bg-[#16a34a] file:px-3 file:py-1 file:text-xs file:text-white file:font-semibold file:mr-3"
            />
            {fileName && <p className="mt-1 text-xs text-slate-400">Loaded: {fileName}</p>}
          </div>

          {/* Paste area */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Or paste CSV here</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste CSV rows here..."
              className="min-h-[200px] w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#16a34a] focus:outline-none"
            />
          </div>

          {/* Messages */}
          {message && <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
          {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

          {/* Preview */}
          {previewRecords.length > 0 && (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Preview — {previewRecords.length} row(s)</h3>
                <button onClick={() => setPreviewRecords([])} className="text-xs text-slate-400 hover:text-white">Clear</button>
              </div>
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                {previewRecords.map((record, index) => (
                  <div key={index} className="px-4 py-3 text-sm">
                    <p className="font-medium text-white truncate">{record.question}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {record.type?.toUpperCase()} — Answer: {record.answer} — Year: {record.year ?? "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={loading || !csvText.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#22c55e] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <UploadCloud size={16} />
            {loading ? "Uploading..." : "Upload Questions"}
          </button>
        </div>
      )}
    </div>
  );
}