"use client";

import { useEffect, useState } from "react";
import { Download, UploadCloud } from "lucide-react";
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
  "question",
  "type",
  "answer",
  "explanation",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "year",
];

const parseCsv = (text: string) => {
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
  if (rows.length === 0) {
    throw new Error("CSV data is empty.");
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.split(",").map((value) => value.trim());
  const expectedHeaderLine = TEMPLATE_HEADERS.join(",");
  const actualHeaderLine = headers.join(",");
  if (actualHeaderLine !== expectedHeaderLine) {
    throw new Error(`CSV header row must match exactly: ${expectedHeaderLine}`);
  }

  return dataRows.map((row, rowIndex) => {
    const values = parseRow(row);

    if (values.length < headers.length) {
      throw new Error(`Row ${rowIndex + 2} has too few columns.`);
    }

    const record: Record<string, string | null> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? null;
    });

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

const parsePayload = (records: Array<Record<string, string | null>>, topicId: number) => {
  return records.map((record, index) => {
    const rawType = (record.type || "").trim();
    const type = rawType.toLowerCase();

    if (type !== "mcq" && type !== "theory") {
      throw new Error(`Row ${index + 2}: type must be MCQ or Theory.`);
    }
    if (!record.question?.trim()) {
      throw new Error(`Row ${index + 2}: question is required.`);
    }
    if (!record.answer?.trim()) {
      throw new Error(`Row ${index + 2}: answer is required.`);
    }

    let normalizedCorrect: number | null = null;

    if (type === "mcq") {
      ["option_a", "option_b", "option_c", "option_d"].forEach((option) => {
        if (!record[option]?.trim()) {
          throw new Error(`Row ${index + 2}: ${option} is required for MCQ questions.`);
        }
      });

      const rawCorrect = record.correct_option?.trim();
      if (!rawCorrect) {
        throw new Error(`Row ${index + 2}: correct_option is required for MCQ questions.`);
      }

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
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
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
          supabase.from("subjects").select("id, name").order("name", { ascending: true }),
          supabase.from("categories").select("id, subject_id, name").order("name", { ascending: true }),
          supabase.from("topics").select("id, category_id, name").order("name", { ascending: true }),
        ]);

        if (subjectsRes.error) throw new Error(subjectsRes.error.message);
        if (categoriesRes.error) throw new Error(categoriesRes.error.message);
        if (topicsRes.error) throw new Error(topicsRes.error.message);

        const subjectsData = subjectsRes.data ?? [];
        const categoriesData = categoriesRes.data ?? [];
        const topicsData = topicsRes.data ?? [];

        setSubjects(subjectsData);
        setCategories(categoriesData);
        setTopics(topicsData);
        setSelectedSubjectId(subjectsData[0]?.id ?? null);
        setSelectedCategoryId(categoriesData.find((category) => category.subject_id === subjectsData[0]?.id)?.id ?? null);
        setSelectedTopicId(
          topicsData.find(
            (topic) => topic.category_id === categoriesData.find((category) => category.subject_id === subjectsData[0]?.id)?.id
          )?.id ?? null
        );
      } catch (err: any) {
        setLookupError(err.message || "Failed to load subjects, categories, and topics.");
      } finally {
        setLookupLoading(false);
      }
    };

    fetchLookups();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) {
      setSelectedCategoryId(null);
      setSelectedTopicId(null);
      return;
    }

    const nextCategory = categories.find((category) => category.subject_id === selectedSubjectId);
    setSelectedCategoryId(nextCategory?.id ?? null);
  }, [selectedSubjectId, categories]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedTopicId(null);
      return;
    }

    const nextTopic = topics.find((topic) => topic.category_id === selectedCategoryId);
    setSelectedTopicId(nextTopic?.id ?? null);
  }, [selectedCategoryId, topics]);

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
      setMessage(`${file.name} loaded. Click Preview Parsed Rows to validate.`);
    } catch (err: any) {
      setError("Unable to read the selected CSV file.");
      setFileName(null);
    }
  };

  const handleParse = () => {
    if (!selectedTopicId) {
      setError("Please select a topic before previewing questions.");
      return;
    }

    try {
      setError(null);
      setMessage(null);
      const records = parseCsv(csvText);
      const payload = parsePayload(records, selectedTopicId);
      setPreviewRecords(payload);
      setMessage(`Parsed ${payload.length} row(s). Review below and then upload.`);
    } catch (err: any) {
      setPreviewRecords([]);
      setError(err.message || "Failed to parse CSV.");
    }
  };

  const handleUpload = async () => {
    if (!selectedTopicId) {
      setError("Please select a topic before uploading questions.");
      return;
    }

    try {
      setError(null);
      setMessage(null);
      setLoading(true);
      const records = parseCsv(csvText);
      const payload = parsePayload(records, selectedTopicId);

      const { error: uploadError } = await supabase.from("questions").insert(payload);
      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setMessage(`Successfully uploaded ${payload.length} questions.`);
      setCsvText("");
      setPreviewRecords([]);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please review your CSV.");
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

  const filteredCategories = categories.filter((category) => category.subject_id === selectedSubjectId);
  const filteredTopics = topics.filter((topic) => topic.category_id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#064e23] p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Bulk Upload Questions</h1>
            <p className="mt-2 text-slate-400">Select a topic first, then upload questions for that topic.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-[#052e16]">
            <UploadCloud size={18} /> CSV Upload
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        {lookupLoading ? (
          <div className="text-slate-300">Loading subjects, categories, and topics...</div>
        ) : lookupError ? (
          <div className="rounded-3xl bg-rose-500/10 p-4 text-rose-200">{lookupError}</div>
        ) : subjects.length === 0 || categories.length === 0 || topics.length === 0 ? (
          <div className="rounded-3xl bg-emerald-500/10 p-6 text-emerald-100">
            Please add subjects, categories and topics first.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <label className="space-y-2 text-sm text-slate-200">
              Select Subject
              <select
                value={selectedSubjectId ?? ""}
                onChange={(event) => setSelectedSubjectId(Number(event.target.value) || null)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedSubjectId && (
              <label className="space-y-2 text-sm text-slate-200">
                Select Category
                <select
                  value={selectedCategoryId ?? ""}
                  onChange={(event) => setSelectedCategoryId(Number(event.target.value) || null)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {selectedCategoryId && (
              <label className="space-y-2 text-sm text-slate-200">
                Select Topic
                <select
                  value={selectedTopicId ?? ""}
                  onChange={(event) => setSelectedTopicId(Number(event.target.value) || null)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                >
                  <option value="">Select topic</option>
                  {filteredTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {selectedTopicId && (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-2 sm:items-center">
              <div>
                <p className="text-sm text-slate-400">Expected headers:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TEMPLATE_HEADERS.map((header) => (
                    <span key={header} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {header}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-400">Columns must be in this order: question, type, answer, explanation, option_a, option_b, option_c, option_d, correct_option, year.</p>
                <p className="text-sm text-slate-400">correct_option accepts A/B/C/D or 0/1/2/3 and type accepts MCQ or Theory.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/70 p-4 text-sm text-slate-300">
                Example: What is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                <Download size={16} /> Download CSV Template
              </button>
              <button
                type="button"
                onClick={() => setCsvText(TEMPLATE_HEADERS.join(",") + "\nWhat is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025")}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Fill Example Row
              </button>
              <button
                type="button"
                onClick={handleParse}
                className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
              >
                Preview Parsed Rows
              </button>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2 text-sm text-slate-200">
                Upload CSV File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white file:rounded-full file:border-0 file:bg-[#16a34a] file:px-4 file:py-2 file:text-white file:font-semibold"
                />
              </label>
              {fileName && <div className="text-sm text-slate-300">Loaded file: {fileName}</div>}
            </div>

            <textarea
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              placeholder="Paste CSV rows here"
              className="min-h-[280px] w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white"
            />

            {message && <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
            {error && <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

            {previewRecords.length > 0 && (
              <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[#053219] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white">Preview {previewRecords.length} row(s)</h2>
                  <button
                    type="button"
                    onClick={() => setPreviewRecords([])}
                    className="rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  >
                    Clear Preview
                  </button>
                </div>
                <div className="grid gap-3">
                  {previewRecords.map((record, index) => (
                    <div key={index} className="rounded-3xl bg-[#065f2c] p-4 text-sm text-slate-200">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>Type: {record.type}</div>
                        <div>Correct Option: {record.correct_option ?? "N/A"}</div>
                        <div>Year: {record.year ?? "N/A"}</div>
                      </div>
                      <div className="mt-3 text-white">
                        <div className="font-semibold">Question</div>
                        <div>{record.question}</div>
                      </div>
                      <div className="mt-3 text-slate-300">
                        <div className="font-semibold">Answer</div>
                        <div>{record.answer}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-3 font-semibold text-[#052e16] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UploadCloud size={18} /> {loading ? "Uploading..." : "Upload Questions"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}



