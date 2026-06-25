"use client";

import { useState } from "react";
import { Download, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TEMPLATE_HEADERS = [
  "subject_id",
  "topic",
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
  const rows = text.split(/\r?\n/).filter((row) => row.trim().length > 0);
  if (rows.length === 0) {
    throw new Error("CSV data is empty.");
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.split(",").map((value) => value.trim());
  const missingHeaders = TEMPLATE_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
  }

  return dataRows.map((row, rowIndex) => {
    const values = row.match(/("[^"]*(?:""[^"]*)*"|[^,]*)/g)?.map((value) => {
      const trimmed = value.trim();
      if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
        return trimmed.slice(1, -1).replace(/""/g, "\"");
      }
      return trimmed;
    }) ?? [];

    if (values.length < headers.length) {
      throw new Error(`Row ${rowIndex + 2} has too few columns.`);
    }

    const record: Record<string, string | null> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? null;
    });
    return record;
  });
};

const parsePayload = (records: Array<Record<string, string | null>>) => {
  return records.map((record, index) => {
    const subject_id = Number(record.subject_id);
    if (!record.subject_id || Number.isNaN(subject_id)) {
      throw new Error(`Row ${index + 2}: subject_id must be a valid number.`);
    }

    const type = (record.type || "MCQ").trim();
    if (!["MCQ", "Theory"].includes(type)) {
      throw new Error(`Row ${index + 2}: type must be MCQ or Theory.`);
    }
    if (!record.topic?.trim()) {
      throw new Error(`Row ${index + 2}: topic is required.`);
    }
    if (!record.question?.trim()) {
      throw new Error(`Row ${index + 2}: question is required.`);
    }
    if (!record.answer?.trim()) {
      throw new Error(`Row ${index + 2}: answer is required.`);
    }
    if (type === "MCQ") {
      ["option_a", "option_b", "option_c", "option_d"].forEach((option) => {
        if (!record[option]?.trim()) {
          throw new Error(`Row ${index + 2}: ${option} is required for MCQ questions.`);
        }
      });
      if (!record.correct_option?.trim()) {
        throw new Error(`Row ${index + 2}: correct_option is required for MCQ questions.`);
      }
    }

    return {
      subject_id,
      topic: record.topic || "",
      question: record.question || "",
      type,
      answer: record.answer || "",
      explanation: record.explanation || null,
      option_a: record.option_a || null,
      option_b: record.option_b || null,
      option_c: record.option_c || null,
      option_d: record.option_d || null,
      correct_option: record.correct_option || null,
      year: record.year ? Number(record.year) : null,
    };
  });
};

export default function AdminBulkUploadPage() {
  const [csvText, setCsvText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    try {
      setError(null);
      setMessage(null);
      setLoading(true);

      const records = parseCsv(csvText);
      const payload = parsePayload(records);

      const { error: uploadError } = await supabase.from("questions").insert(payload);
      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setMessage(`Successfully uploaded ${payload.length} questions.`);
      setCsvText("");
    } catch (err: any) {
      setError(err.message || "Upload failed. Please review your CSV.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [TEMPLATE_HEADERS.join(","), "1,Basic Algebra,What is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025"].join("\n");
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Bulk Upload Questions</h1>
            <p className="mt-2 text-slate-400">Paste CSV data to add many questions at once.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f59e0b] px-4 py-2 text-[#0f172a]">
            <UploadCloud size={18} /> CSV Upload
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-[#111827] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
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
          </div>
          <div className="rounded-3xl bg-slate-900/70 p-4 text-sm text-slate-300">
            Example: 1,Basic Algebra,What is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025
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
            onClick={() => setCsvText(TEMPLATE_HEADERS.join(",") + "\n1,Basic Algebra,What is 2+2?,MCQ,4,Understanding the basics,2,3,4,5,A,2025")}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Fill Example Row
          </button>
        </div>

        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder="Paste CSV rows here"
          className="min-h-[280px] w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-white"
        />

        {message && <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f59e0b] px-5 py-3 font-semibold text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadCloud size={18} /> {loading ? "Uploading..." : "Upload Questions"}
        </button>
      </div>
    </div>
  );
}
