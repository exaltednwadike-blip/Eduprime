"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  subject_id: string;
  name: string;
};

type Topic = {
  id: string;
  category_id: string;
  name: string;
};

type Question = {
  id: string;
  topic_id: string;
  question: string;
  type: string;
  answer: string;
  explanation: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: number | string | null;
  year: number | string | null;
};

const normalizeType = (value?: string | null) => {
  const normalized = (value ?? "").toUpperCase();
  return normalized === "MCQ" ? "MCQ" : "Theory";
};

const optionLetterFromIndex = (value?: number | string | null) => {
  const index = typeof value === "string" ? Number(value) : value;
  if (typeof index !== "number" || Number.isNaN(index) || index < 0 || index > 3) return "A";
  return ["A", "B", "C", "D"][index] ?? "A";
};

const truncateText = (value: string, maxLength = 60) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
};

export default function AdminQuestionsPage() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"MCQ" | "Theory">("MCQ");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState("0");
  const [year, setYear] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedCategories = categories.filter((category) => category.subject_id === selectedSubjectId);
  const selectedTopics = topics.filter((topic) => topic.category_id === selectedCategoryId);

  const resetForm = () => {
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionType("MCQ");
    setAnswer("");
    setExplanation("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("0");
    setYear("");
  };

  const fetchQuestions = async (topicId: string) => {
    if (!topicId) {
      setQuestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("questions")
      .select("id, topic_id, question, type, answer, explanation, option_a, option_b, option_c, option_d, correct_option, year")
      .eq("topic_id", topicId)
      .order("id", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setQuestions([]);
      setLoading(false);
      return;
    }

    setQuestions((data ?? []) as Question[]);
    setLoading(false);
  };

  const loadLookupData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [subjectRes, categoryRes, topicRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name", { ascending: true }),
        supabase.from("categories").select("id, subject_id, name").order("name", { ascending: true }),
        supabase.from("topics").select("id, category_id, name").order("name", { ascending: true }),
      ]);

      if (subjectRes.error) throw new Error(subjectRes.error.message);
      if (categoryRes.error) throw new Error(categoryRes.error.message);
      if (topicRes.error) throw new Error(topicRes.error.message);

      const subjectsData = (subjectRes.data ?? []) as Subject[];
      const categoriesData = (categoryRes.data ?? []) as Category[];
      const topicsData = (topicRes.data ?? []) as Topic[];

      setSubjects(subjectsData);
      setCategories(categoriesData);
      setTopics(topicsData);

      if (subjectsData.length > 0) {
        const firstSubjectId = subjectsData[0].id;
        setSelectedSubjectId(firstSubjectId);

        const firstCategory = categoriesData.find((category) => category.subject_id === firstSubjectId);
        if (firstCategory) {
          setSelectedCategoryId(firstCategory.id);
          const firstTopic = topicsData.find((topic) => topic.category_id === firstCategory.id);
          if (firstTopic) {
            setSelectedTopicId(firstTopic.id);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load lookup data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLookupData();
  }, []);

  useEffect(() => {
    if (!selectedTopicId) {
      setQuestions([]);
      return;
    }

    void fetchQuestions(selectedTopicId);
  }, [selectedTopicId]);

  const handleSubjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSubjectId = event.target.value;
    setSelectedSubjectId(nextSubjectId);
    setSelectedCategoryId("");
    setSelectedTopicId("");
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCategoryId = event.target.value;
    setSelectedCategoryId(nextCategoryId);
    setSelectedTopicId("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedTopicId) {
      setError("Please select a topic before saving a question.");
      return;
    }

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }

    const payload = {
      topic_id: selectedTopicId,
      question: questionText.trim(),
      type: questionType,
      answer: answer.trim(),
      explanation: explanation.trim() || null,
      option_a: questionType === "MCQ" ? optionA.trim() || null : null,
      option_b: questionType === "MCQ" ? optionB.trim() || null : null,
      option_c: questionType === "MCQ" ? optionC.trim() || null : null,
      option_d: questionType === "MCQ" ? optionD.trim() || null : null,
      correct_option: questionType === "MCQ" ? Number(correctOption) : null,
      year: year ? Number(year) : null,
    };

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (editingQuestion) {
        const { error: updateError } = await supabase.from("questions").update(payload).eq("id", editingQuestion.id);
        if (updateError) {
          setError(updateError.message);
          return;
        }

        setQuestions((prev) =>
          prev.map((question) =>
            question.id === editingQuestion.id
              ? { ...question, ...payload, id: question.id, topic_id: selectedTopicId }
              : question
          )
        );
        setSuccessMessage("Question updated successfully.");
      } else {
        const { error: createError } = await supabase.from("questions").insert(payload);
        if (createError) {
          setError(createError.message);
          return;
        }

        setSuccessMessage("Question added successfully.");
      }

      await fetchQuestions(selectedTopicId);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Unable to save question.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (question: Question) => {
    const topic = topics.find((entry) => entry.id === question.topic_id);
    const category = categories.find((entry) => entry.id === topic?.category_id);
    const subject = subjects.find((entry) => entry.id === category?.subject_id);

    if (subject) setSelectedSubjectId(subject.id);
    if (category) setSelectedCategoryId(category.id);
    if (topic) setSelectedTopicId(topic.id);

    setEditingQuestion(question);
    setQuestionText(question.question ?? "");
    setQuestionType(normalizeType(question.type) as "MCQ" | "Theory");
    setAnswer(question.answer ?? "");
    setExplanation(question.explanation ?? "");
    setOptionA(question.option_a ?? "");
    setOptionB(question.option_b ?? "");
    setOptionC(question.option_c ?? "");
    setOptionD(question.option_d ?? "");
    setCorrectOption(optionLetterFromIndex(question.correct_option) === "A" ? "0" : optionLetterFromIndex(question.correct_option) === "B" ? "1" : optionLetterFromIndex(question.correct_option) === "C" ? "2" : "3");
    setYear(question.year != null ? String(question.year) : "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (question: Question) => {
    if (!window.confirm("Delete this question?")) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    const { error: deleteError } = await supabase.from("questions").delete().eq("id", question.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setQuestions((prev) => prev.filter((item) => item.id !== question.id));
    setSuccessMessage("Question deleted successfully.");
  };

  if (loading && subjects.length === 0) {
    return <div className="p-8 text-white">Loading question data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#064e23] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Questions</h1>
            <p className="mt-2 text-slate-400">Manage questions across subjects, categories, and topics.</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 font-semibold text-[#052e16]"
          >
            <Plus size={16} /> New Question
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      <div ref={formRef} className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-200">
            Subject
            <select
              value={selectedSubjectId}
              onChange={handleSubjectChange}
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

          <label className="space-y-2 text-sm text-slate-200">
            Category
            <select
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
            >
              <option value="">Select category</option>
              {selectedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-200">
            Topic
            <select
              value={selectedTopicId}
              onChange={(event) => setSelectedTopicId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
            >
              <option value="">Select topic</option>
              {selectedTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="space-y-2 text-sm text-slate-200">
            Question
            <textarea
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              className="w-full min-h-[120px] rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              Type
              <select
                value={questionType}
                onChange={(event) => setQuestionType(event.target.value as "MCQ" | "Theory")}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
              >
                <option value="MCQ">MCQ</option>
                <option value="Theory">Theory</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-200">
              Year
              <input
                value={year}
                onChange={(event) => setYear(event.target.value)}
                type="number"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-200">
            Answer
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              className="w-full min-h-[100px] rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-200">
            Explanation
            <textarea
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              className="w-full min-h-[100px] rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
            />
          </label>

          {questionType === "MCQ" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                Option A
                <input
                  value={optionA}
                  onChange={(event) => setOptionA(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Option B
                <input
                  value={optionB}
                  onChange={(event) => setOptionB(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Option C
                <input
                  value={optionC}
                  onChange={(event) => setOptionC(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Option D
                <input
                  value={optionD}
                  onChange={(event) => setOptionD(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
                />
              </label>
            </div>
          )}

          {questionType === "MCQ" && (
            <label className="space-y-2 text-sm text-slate-200">
              Correct Option
              <select
                value={correctOption}
                onChange={(event) => setCorrectOption(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
              >
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
              </select>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-3 font-semibold text-[#052e16]"
            >
              {editingQuestion ? "Save Changes" : "Add Question"}
            </button>

            {editingQuestion && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-3 text-slate-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl bg-[#064e23] shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-white">
          <thead className="bg-[#0d4d2a] text-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium text-center">Edit</th>
              <th className="px-4 py-3 font-medium text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-300">
                  No questions available for this topic.
                </td>
              </tr>
            ) : (
              questions.map((question) => (
                <tr key={question.id} className="border-t border-white/10 align-top">
                  <td className="max-w-[480px] px-4 py-4 text-slate-100">{truncateText(question.question ?? "")}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-[#16a34a]/15 px-2 py-1 text-xs font-semibold text-[#d7ffe6]">
                      {normalizeType(question.type)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-200">{question.year ?? "-"}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => startEditing(question)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(question)}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


