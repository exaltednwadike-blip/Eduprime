"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };
type Category = { id: string; subject_id: string; name: string };
type Topic = { id: string; category_id: string; name: string };

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

const isMcqType = (value?: string | null) => (value ?? "").trim().toLowerCase() === "mcq";

const toOptionIndex = (value?: number | string | null): number => {
  if (typeof value === "number") return value >= 0 && value <= 3 ? value : 0;
  if (typeof value === "string") {
    const v = value.trim().toUpperCase();
    const letter = ["A", "B", "C", "D"].indexOf(v);
    if (letter >= 0) return letter;
    const n = Number(v);
    if (Number.isInteger(n) && n >= 0 && n <= 3) return n;
  }
  return 0;
};

const truncateText = (value: string, maxLength = 140) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
};

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

export default function AdminQuestionsPage() {
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
      .order("created_at", { ascending: false });

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
    setSelectedSubjectId(event.target.value);
    setSelectedCategoryId("");
    setSelectedTopicId("");
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(event.target.value);
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
      type: questionType.toLowerCase(),
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
    setQuestionType(isMcqType(question.type) ? "MCQ" : "Theory");
    setAnswer(question.answer ?? "");
    setExplanation(question.explanation ?? "");
    setOptionA(question.option_a ?? "");
    setOptionB(question.option_b ?? "");
    setOptionC(question.option_c ?? "");
    setOptionD(question.option_d ?? "");
    setCorrectOption(String(toOptionIndex(question.correct_option)));
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
    return (
      <div className="mx-auto w-full max-w-4xl animate-pulse space-y-4 p-4 sm:p-6">
        <div className="h-8 w-40 rounded bg-line" />
        <div className="h-40 rounded-2xl bg-raised" />
        <div className="h-64 rounded-2xl bg-raised" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg sm:text-2xl">Questions</h1>
          <p className="mt-1 text-sm text-muted">Manage questions across subjects, categories, and topics.</p>
        </div>
        <button type="button" onClick={resetForm} className={primaryButton}>
          <Plus size={16} /> New question
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">{error}</div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-primary bg-primary-soft px-4 py-3 text-sm text-fg">{successMessage}</div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Subject
            <select value={selectedSubjectId} onChange={handleSubjectChange} className={`mt-1.5 ${field}`}>
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Category
            <select value={selectedCategoryId} onChange={handleCategoryChange} className={`mt-1.5 ${field}`}>
              <option value="">Select category</option>
              {selectedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Topic
            <select
              value={selectedTopicId}
              onChange={(event) => setSelectedTopicId(event.target.value)}
              className={`mt-1.5 ${field}`}
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

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 border-t border-line pt-5">
          <p className="text-sm font-semibold text-fg">{editingQuestion ? "Edit question" : "Add a question"}</p>

          <label className={labelClass}>
            Question
            <textarea
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              className={`mt-1.5 min-h-[110px] ${field}`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Type
              <select
                value={questionType}
                onChange={(event) => setQuestionType(event.target.value as "MCQ" | "Theory")}
                className={`mt-1.5 ${field}`}
              >
                <option value="MCQ">MCQ</option>
                <option value="Theory">Theory</option>
              </select>
            </label>

            <label className={labelClass}>
              Year
              <input value={year} onChange={(event) => setYear(event.target.value)} type="number" className={`mt-1.5 ${field}`} />
            </label>
          </div>

          <label className={labelClass}>
            Answer
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              className={`mt-1.5 min-h-[90px] ${field}`}
            />
          </label>

          <label className={labelClass}>
            Explanation
            <textarea
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              className={`mt-1.5 min-h-[90px] ${field}`}
            />
          </label>

          {questionType === "MCQ" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Option A
                  <input value={optionA} onChange={(event) => setOptionA(event.target.value)} className={`mt-1.5 ${field}`} />
                </label>
                <label className={labelClass}>
                  Option B
                  <input value={optionB} onChange={(event) => setOptionB(event.target.value)} className={`mt-1.5 ${field}`} />
                </label>
                <label className={labelClass}>
                  Option C
                  <input value={optionC} onChange={(event) => setOptionC(event.target.value)} className={`mt-1.5 ${field}`} />
                </label>
                <label className={labelClass}>
                  Option D
                  <input value={optionD} onChange={(event) => setOptionD(event.target.value)} className={`mt-1.5 ${field}`} />
                </label>
              </div>

              <label className={labelClass}>
                Correct option
                <select
                  value={correctOption}
                  onChange={(event) => setCorrectOption(event.target.value)}
                  className={`mt-1.5 sm:w-48 ${field}`}
                >
                  <option value="0">A</option>
                  <option value="1">B</option>
                  <option value="2">C</option>
                  <option value="3">D</option>
                </select>
              </label>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={loading} className={primaryButton}>
              {editingQuestion ? "Save changes" : "Add question"}
            </button>

            {editingQuestion && (
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
            Questions in this topic <span className="font-normal text-muted">({questions.length})</span>
          </p>
        </div>

        {questions.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No questions available for this topic.</p>
        ) : (
          <ul className="divide-y divide-line">
            {questions.map((question) => (
              <li key={question.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">{truncateText(question.question ?? "")}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 font-medium text-primary">
                      {isMcqType(question.type) ? "MCQ" : "Theory"}
                    </span>
                    {question.year != null && <span>{question.year}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button type="button" onClick={() => startEditing(question)} className={smallSecondary}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(question)} className={smallDanger}>
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