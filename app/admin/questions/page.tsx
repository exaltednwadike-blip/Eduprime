"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

type Question = {
  id: number;
  topic_id: number;
  question: string;
  type: string;
  answer: string;
  explanation: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: string | null;
  year: number | null;
};

export default function AdminQuestionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("MCQ");
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState("0");
  const [year, setYear] = useState<string>("");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLookupData();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      const nextCategory = categories.find((category) => category.subject_id === selectedSubjectId);
      if (!nextCategory) {
        setSelectedCategoryId(null);
        setSelectedTopicId(null);
        setQuestions([]);
      } else if (!selectedCategoryId || categories.find((cat) => cat.id === selectedCategoryId)?.subject_id !== selectedSubjectId) {
        setSelectedCategoryId(nextCategory.id);
      }
    }
  }, [selectedSubjectId, categories]);

  useEffect(() => {
    if (selectedCategoryId) {
      const nextTopic = topics.find((topic) => topic.category_id === selectedCategoryId);
      if (!nextTopic) {
        setSelectedTopicId(null);
        setQuestions([]);
      } else if (!selectedTopicId || topics.find((topic) => topic.id === selectedTopicId)?.category_id !== selectedCategoryId) {
        setSelectedTopicId(nextTopic.id);
      }
    }
  }, [selectedCategoryId, topics]);

  useEffect(() => {
    if (selectedTopicId) {
      fetchQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedTopicId]);

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

      const subjectsData = subjectRes.data ?? [];
      const categoriesData = categoryRes.data ?? [];
      const topicsData = topicRes.data ?? [];

      setSubjects(subjectsData);
      setCategories(categoriesData);
      setTopics(topicsData);
      setSelectedSubjectId(subjectsData[0]?.id ?? null);
      setSelectedCategoryId(categoriesData.find((category) => category.subject_id === subjectsData[0]?.id)?.id ?? null);
      setSelectedTopicId(topicsData.find((topic) => topic.category_id === categoriesData.find((category) => category.subject_id === subjectsData[0]?.id)?.id ?? -1)?.id ?? null);
    } catch (err: any) {
      setError(err.message || "Failed to load lookup data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedTopicId) {
      setQuestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from<Question>("questions")
      .select(
        "id, topic_id, question, type, answer, explanation, option_a, option_b, option_c, option_d, correct_option, year"
      )
      .eq("topic_id", selectedTopicId)
      .order("id", { ascending: false });

    if (error) {
      setError(error.message);
      setQuestions([]);
      setLoading(false);
      return;
    }

    setQuestions(data ?? []);
    setLoading(false);
  };

  const selectedCategories = categories.filter((category) => category.subject_id === selectedSubjectId);
  const selectedTopics = topics.filter((topic) => topic.category_id === selectedCategoryId);

  const startEditing = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.question);
    setQuestionType(question.type);
    setAnswer(question.answer);
    setExplanation(question.explanation || "");
    setOptionA(question.option_a || "");
    setOptionB(question.option_b || "");
    setOptionC(question.option_c || "");
    setOptionD(question.option_d || "");
    setCorrectOption(question.correct_option ?? "0");
    setYear(question.year?.toString() ?? "");
    setSelectedTopicId(question.topic_id);
    const topic = topics.find((topic) => topic.id === question.topic_id);
    if (topic) {
      setSelectedCategoryId(topic.category_id);
      const category = categories.find((category) => category.id === topic.category_id);
      if (category) {
        setSelectedSubjectId(category.subject_id);
      }
    }
  };

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
      question: questionText,
      type: questionType,
      answer,
      explanation: explanation || null,
      option_a: questionType === "MCQ" ? optionA || null : null,
      option_b: questionType === "MCQ" ? optionB || null : null,
      option_c: questionType === "MCQ" ? optionC || null : null,
      option_d: questionType === "MCQ" ? optionD || null : null,
      correct_option: questionType === "MCQ" ? correctOption : null,
      year: year ? Number(year) : null,
    };

    setLoading(true);
    setError(null);

    if (editingQuestion) {
      const { error } = await supabase.from("questions").update(payload).eq("id", editingQuestion.id);
      if (error) {
        setError(error.message);
      } else {
        resetForm();
        await fetchQuestions();
      }
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) {
        setError(error.message);
      } else {
        resetForm();
        await fetchQuestions();
      }
    }

    setLoading(false);
  };

  const handleDelete = async (question: Question) => {
    if (!window.confirm("Delete this question?")) {
      return;
    }
    const { error } = await supabase.from("questions").delete().eq("id", question.id);
    if (error) {
      setError(error.message);
    } else {
      await fetchQuestions();
    }
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
          <button onClick={resetForm} className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 font-semibold text-[#052e16]">
            <Plus size={16} /> New Question
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-[#064e23] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-200">
            Subject
            <select value={selectedSubjectId ?? ""} onChange={(event) => setSelectedSubjectId(Number(event.target.value) || null)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            Category
            <select value={selectedCategoryId ?? ""} onChange={(event) => setSelectedCategoryId(Number(event.target.value) || null)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
              <option value="">Select category</option>
              {selectedCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            Topic
            <select value={selectedTopicId ?? ""} onChange={(event) => setSelectedTopicId(Number(event.target.value) || null)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
              <option value="">Select topic</option>
              {selectedTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="space-y-2 text-sm text-slate-200">
            Question
            <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} className="w-full min-h-[120px] rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
          </label>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              Type
              <select value={questionType} onChange={(event) => setQuestionType(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
                <option value="MCQ">MCQ</option>
                <option value="Theory">Theory</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Year
              <input value={year} onChange={(event) => setYear(event.target.value)} type="number" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-200">
            Answer
            <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} className="w-full min-h-[100px] rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            Explanation
            <textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} className="w-full min-h-[100px] rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
          </label>

          {questionType === "MCQ" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                Option A
                <input value={optionA} onChange={(event) => setOptionA(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Option B
                <input value={optionB} onChange={(event) => setOptionB(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Option C
                <input value={optionC} onChange={(event) => setOptionC(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Option D
                <input value={optionD} onChange={(event) => setOptionD(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white" />
              </label>
            </div>
          )}

          {questionType === "MCQ" && (
            <label className="space-y-2 text-sm text-slate-200">
              Correct Option
              <select value={correctOption} onChange={(event) => setCorrectOption(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-5 py-3 font-semibold text-[#052e16]">
              {editingQuestion ? "Update Question" : "Add Question"}
            </button>
            {editingQuestion && (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-3 text-slate-200">
                Cancel Edit
              </button>
            )}
            {error && <span className="text-rose-300">{error}</span>}
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {questions.map((question) => {
          const topic = topics.find((topic) => topic.id === question.topic_id);
          const category = categories.find((category) => category.id === topic?.category_id);
          const subject = subjects.find((subject) => subject.id === category?.subject_id);

          return (
            <div key={question.id} className="rounded-3xl bg-[#065f2c] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">{subject?.name ?? "Unknown subject"} / {category?.name ?? "Unknown category"} / {topic?.name ?? "Unknown topic"}</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{question.question}</h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
                    <span>{question.type}</span>
                    {question.year && <span>Year: {question.year}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => startEditing(question)} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                    <Pencil size={16} /> Edit
                  </button>
                  <button onClick={() => handleDelete(question)} className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



