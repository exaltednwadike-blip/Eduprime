"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "../layout";
import { useToast } from "@/components/ToastContext";
import { useMySubjects } from "@/lib/useMySubjects";
import { User, Sun, Moon, GraduationCap, Mail, LogOut, Loader2, BookOpen, Check } from "lucide-react";

const card = "rounded-2xl border border-line bg-surface p-4";
const cardTitle = "flex items-center gap-2 text-sm font-semibold text-fg";
const input =
  "rounded-[10px] border border-line bg-canvas px-3.5 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";
const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { showToast } = useToast();

  const { allSubjects, chosenIds, hasChosen, loading: subjectsLoading, saveChoice } = useMySubjects();

  const [level, setLevel] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [savingSubjects, setSavingSubjects] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("eduprimeLevel");
    if (stored) setLevel(stored);

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email || null);
      setNameInput(data.user?.user_metadata?.full_name || "");
    })();
  }, []);

  useEffect(() => {
    setSelected(chosenIds);
  }, [chosenIds]);

  const dirty = selected.length !== chosenIds.length || selected.some((id) => !chosenIds.includes(id));

  const toggleSubject = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const handleSaveSubjects = async () => {
    setSavingSubjects(true);
    const { error } = await saveChoice(selected);
    setSavingSubjects(false);

    if (error) {
      showToast({ type: "error", title: "Couldn't save", message: error });
      return;
    }

    showToast({
      type: "success",
      title: "Subjects updated",
      message: selected.length
        ? "The app will now show the subjects you picked."
        : "You'll see every subject until you pick some.",
    });
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLevel(e.target.value);
    localStorage.setItem("eduprimeLevel", e.target.value);
    showToast({ type: "success", title: "Level updated", message: "Your study level has been saved." });
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast({ type: "warning", title: "Name required", message: "Please enter a name before saving." });
      return;
    }

    setSavingName(true);
    const { data: updatedUser, error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    setSavingName(false);

    if (error) {
      showToast({ type: "error", title: "Couldn't save", message: "Something went wrong updating your name." });
      return;
    }

    if (updatedUser?.user) {
      setNameInput(updatedUser.user.user_metadata?.full_name || trimmed);
    }

    showToast({ type: "success", title: "Name updated", message: "This is now how the app addresses you." });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    showToast({ type: "info", title: "Signed out", message: "You have been signed out successfully." });
    router.push("/signin");
  };

  const handleToggle = () => {
    toggle();
    showToast({ type: "info", title: "Theme changed", message: "Display mode updated." });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-semibold text-fg sm:text-xl">Settings</h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">Manage your name, subjects, level, theme, and account.</p>
      </div>

      {/* My subjects */}
      <div className={card}>
        <h2 className={cardTitle}>
          <BookOpen size={15} className="text-primary" /> My subjects
        </h2>
        <p className="mt-1 text-xs text-muted">
          {hasChosen
            ? "Pick the subjects you are offering. The app shows only these."
            : "You haven't picked any yet, so every subject is showing. Tick the ones you are offering."}
        </p>

        {subjectsLoading ? (
          <div className="mt-3 animate-pulse space-y-2">
            <div className="h-11 rounded-xl bg-raised" />
            <div className="h-11 rounded-xl bg-raised" />
            <div className="h-11 rounded-xl bg-raised" />
          </div>
        ) : allSubjects.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No subjects have been added yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {allSubjects.map((subject) => {
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

        {allSubjects.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={handleSaveSubjects} disabled={savingSubjects || !dirty} className={primaryButton}>
              {savingSubjects ? <Loader2 size={14} className="animate-spin" /> : null}
              {savingSubjects ? "Saving..." : "Save subjects"}
            </button>
            {selected.length === 0 && <span className="text-xs text-muted">None ticked: you will see every subject.</span>}
          </div>
        )}
      </div>

      {/* Display name */}
      <div className={card}>
        <h2 className={cardTitle}>
          <User size={15} className="text-primary" /> Display name
        </h2>
        <p className="mt-1 text-xs text-muted">
          This is the name shown across the app: sidebar, dashboard greeting, and profile.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className={`flex-1 ${input}`}
          />
          <button onClick={handleSaveName} disabled={savingName} className={primaryButton}>
            {savingName ? <Loader2 size={14} className="animate-spin" /> : null}
            {savingName ? "Saving..." : "Save name"}
          </button>
        </div>
      </div>

      {/* Level */}
      <div className={card}>
        <h2 className={cardTitle}>
          <GraduationCap size={15} className="text-primary" /> Study level
        </h2>
        <div className="mt-3">
          <select value={level} onChange={handleLevelChange} className={`w-full sm:w-auto ${input}`}>
            <option value="">Select level</option>
            <option value="100 Level">100 Level</option>
            <option value="200 Level">200 Level</option>
            <option value="300 Level">300 Level</option>
            <option value="400 Level">400 Level</option>
            <option value="500 Level">500 Level</option>
            <option value="600 Level">600 Level</option>
          </select>
        </div>
      </div>

      {/* Theme */}
      <div className={card}>
        <h2 className={cardTitle}>
          {isDark ? <Moon size={15} className="text-primary" /> : <Sun size={15} className="text-primary" />} Theme
        </h2>
        <div className="mt-3">
          <button
            onClick={handleToggle}
            className="inline-flex items-center gap-2.5 rounded-full bg-raised px-4 py-2 text-sm font-medium text-fg transition hover:bg-line"
          >
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
            {isDark ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </div>

      {/* Account */}
      <div className={card}>
        <h2 className={cardTitle}>
          <Mail size={15} className="text-primary" /> Account
        </h2>
        <div className="mt-3 rounded-xl bg-raised p-3.5">
          <p className="text-xs text-muted">Email</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-fg">{userEmail}</p>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="inline-flex items-center gap-2 rounded-full border border-danger bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-danger hover:text-on-danger"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );
}