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

const field =
  "w-full rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-raised";

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
          const firstCategory = categoriesRes.data?.find((c: Category) => c.subject_id === firstSubject.id);
          if (firstCategory) {
            setSelectedCategoryId(firstCategory.id);
            const firstTopic = topicsRes.data?.find((t: Topic) => t.category_id === firstCategory.id);
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
    const firstCategory = categories.find((c: Category) => c.subject_id === subjectId);
    if (firstCategory) {
      setSelectedCategoryId(firstCategory.id);
      const firstTopic = topics.find((t: Topic) => t.category_id === firstCategory.id);
      if (firstTopic) setSelectedTopicId(firstTopic.id);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedTopicId("");
    const firstTopic = topics.find((t: Topic) => t.category_id === categoryId);
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
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-fg sm:text-2xl">Bulk upload questions</h1>
        <p className="mt-1 text-sm text-muted">Choose a topic first, then upload a CSV of questions.</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        {lookupLoading ? (
          <div className="grid animate-pulse gap-4 sm:grid-cols-3">
            <div className="h-10 rounded-[10px] bg-raised" />
            <div className="h-10 rounded-[10px] bg-raised" />
            <div className="h-10 rounded-[10px] bg-raised" />
          </div>
        ) : lookupError ? (
          <p className="text-sm text-danger">{lookupError}</p>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-muted">Please add subjects, categories and topics first.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Subject</label>
              <select value={selectedSubjectId} onChange={(e) => handleSubjectChange(e.target.value)} className={field}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
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
                  <option key={c.id} value={c.id}>{c.name}</option>
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
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {selectedTopicId && (
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
          <div className="rounded-xl bg-raised p-4">
            <p className="mb-2 text-xs font-medium text-muted">Expected CSV columns</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_HEADERS.map((h) => (
                <span key={h} className="rounded-md border border-line bg-surface px-2 py-0.5 text-xs text-fg">{h}</span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              correct_option: A/B/C/D or 0/1/2/3. type: MCQ or Theory. Put quotes around any cell that contains a comma.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleDownloadTemplate} className={secondaryButton}>
              <Download size={14} /> Download template
            </button>
            <button
              onClick={() => setCsvText(TEMPLATE_HEADERS.join(",") + "\nWhat is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025")}
              className={secondaryButton}
            >
              Fill example
            </button>
            <button onClick={handleParse} className={secondaryButton}>
              Preview rows
            </button>
          </div>

          <div>
            <label className={labelClass}>Upload CSV file</label>
            <input
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
              placeholder="Paste CSV rows here..."
              className={`${field} min-h-[200px]`}
            />
          </div>

          {message && (
            <p className="rounded-xl border border-primary bg-primary-soft px-4 py-3 text-sm text-fg">{message}</p>
          )}
          {error && (
            <p className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">{error}</p>
          )}

          {previewRecords.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h3 className="text-sm font-semibold text-fg">Preview: {previewRecords.length} row(s)</h3>
                <button onClick={() => setPreviewRecords([])} className="text-xs text-muted hover:text-fg">Clear</button>
              </div>
              <div className="max-h-64 divide-y divide-line overflow-y-auto">
                {previewRecords.map((record, index) => (
                  <div key={index} className="px-4 py-3 text-sm">
                    <p className="truncate font-medium text-fg">{record.question}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {record.type?.toUpperCase()} | Answer: {record.answer} | Year: {record.year ?? "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleUpload} disabled={loading || !csvText.trim()} className={primaryButton}>
            <UploadCloud size={16} />
            {loading ? "Uploading..." : "Upload questions"}
          </button>
        </div>
      )}
    </div>
  );
}