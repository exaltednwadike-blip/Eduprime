"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subject = { id: string; name: string };

const courses = [
  "MBBS (Medicine and Surgery)",
  "Nursing Science",
  "Pharmacy",
  "Medical Laboratory Science",
  "Radiography and Radiological Sciences",
  "Physiotherapy",
  "Dentistry",
];

const levels = [100, 200, 300, 400, 500, 600];

const universities: Record<string, string[]> = {
  "Federal universities": [
    "Ahmadu Bello University, Zaria",
    "Alex Ekwueme Federal University, Ndufu-Alike",
    "Bayero University, Kano",
    "Federal University of Agriculture, Abeokuta",
    "Federal University of Technology, Akure",
    "Federal University of Technology, Minna",
    "Federal University of Technology, Owerri",
    "Federal University, Dutse",
    "Federal University, Lafia",
    "Federal University, Lokoja",
    "Federal University, Otuoke",
    "Federal University, Oye-Ekiti",
    "Federal University, Wukari",
    "Michael Okpara University of Agriculture, Umudike",
    "Nnamdi Azikiwe University, Awka",
    "Obafemi Awolowo University, Ile-Ife",
    "University of Abuja",
    "University of Benin",
    "University of Calabar",
    "University of Ibadan",
    "University of Ilorin",
    "University of Jos",
    "University of Lagos",
    "University of Maiduguri",
    "University of Nigeria, Nsukka",
    "University of Port Harcourt",
    "University of Uyo",
    "Usmanu Danfodiyo University, Sokoto",
  ],
  "State universities": [
    "Abia State University, Uturu",
    "Adekunle Ajasin University, Akungba-Akoko",
    "Akwa Ibom State University",
    "Ambrose Alli University, Ekpoma",
    "Bayelsa Medical University",
    "Benue State University, Makurdi",
    "Chukwuemeka Odumegwu Ojukwu University, Uli",
    "Delta State University, Abraka",
    "Ebonyi State University, Abakaliki",
    "Ekiti State University, Ado-Ekiti",
    "Enugu State University of Science and Technology",
    "Gombe State University",
    "Imo State University, Owerri",
    "Kaduna State University",
    "Kwara State University, Malete",
    "Ladoke Akintola University of Technology, Ogbomoso",
    "Lagos State University, Ojo",
    "Niger Delta University, Wilberforce Island",
    "Olabisi Onabanjo University, Ago-Iwoye",
    "Osun State University, Osogbo",
    "Rivers State University, Port Harcourt",
  ],
  "Private universities": [
    "Achievers University, Owo",
    "Afe Babalola University, Ado-Ekiti",
    "Ajayi Crowther University, Oyo",
    "American University of Nigeria, Yola",
    "Babcock University, Ilishan-Remo",
    "Baze University, Abuja",
    "Bells University of Technology, Ota",
    "Benson Idahosa University, Benin City",
    "Bowen University, Iwo",
    "Caleb University, Lagos",
    "Covenant University, Ota",
    "Crescent University, Abeokuta",
    "Edwin Clark University, Kiagbodo",
    "Elizade University, Ilara-Mokin",
    "Godfrey Okoye University, Enugu",
    "Igbinedion University, Okada",
    "Landmark University, Omu-Aran",
    "Lead City University, Ibadan",
    "Madonna University, Okija",
    "Mountain Top University, Ibafo",
    "Nile University of Nigeria, Abuja",
    "PAMO University of Medical Sciences, Port Harcourt",
    "Redeemer's University, Ede",
    "Veritas University, Abuja",
  ],
};

const allUniversities = Object.values(universities).flat();

const stepTitles = ["Your course", "Your university", "Your level", "Your subjects"];

const field =
  "w-full rounded-[10px] border border-line bg-canvas px-3.5 py-3 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";
const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-primary px-5 py-3 text-sm font-medium text-on-primary transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-4 py-3 text-sm font-medium text-fg transition hover:bg-raised";

export default function OnboardingPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState(0);

  const [course, setCourse] = useState("");
  const [university, setUniversity] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [level, setLevel] = useState<number | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Clear any page background left behind by the dashboard so this page follows the light tokens.
    document.documentElement.style.background = "";

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/signin");
        return;
      }
      setUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("course_of_study, university, level")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profile?.course_of_study && courses.includes(profile.course_of_study)) setCourse(profile.course_of_study);
      if (profile?.university) {
        setUniversity(profile.university);
        setIsOther(!allUniversities.includes(profile.university));
      }

      let startLevel: number | null = profile?.level ?? null;
      if (!startLevel) {
        const stored = localStorage.getItem("eduprimeLevel");
        const parsed = stored ? parseInt(stored, 10) : NaN;
        if (levels.includes(parsed)) startLevel = parsed;
      }
      if (startLevel && levels.includes(startLevel)) setLevel(startLevel);

      setReady(true);
    })();
  }, [router]);

  // Load subjects when the student reaches the last screen.
  useEffect(() => {
    if (step !== 3 || !userId || !course || !level) return;
    let active = true;

    (async () => {
      setSubjectsLoading(true);

      const [subjectRes, offeringRes, chosenRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("subject_offerings").select("subject_id").eq("course_of_study", course).eq("level", level),
        supabase.from("user_subjects").select("subject_id").eq("user_id", userId),
      ]);

      if (!active) return;

      const all = ((subjectRes.data as Subject[]) || []).map((s) => ({ ...s, id: String(s.id) }));
      const offered = (offeringRes.data || []).map((r: { subject_id: string }) => String(r.subject_id));
      const chosen = (chosenRes.data || []).map((r: { subject_id: string }) => String(r.subject_id));

      setSubjects(all);
      setSuggested(offered);
      setSelected(chosen.length > 0 ? chosen : offered);
      setSubjectsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [step, userId, course, level]);

  const orderedSubjects = useMemo(() => {
    const first = subjects.filter((s) => suggested.includes(s.id));
    const rest = subjects.filter((s) => !suggested.includes(s.id));
    return [...first, ...rest];
  }, [subjects, suggested]);

  const universityValue = university.trim();

  const canContinue =
    (step === 0 && !!course) ||
    (step === 1 && universityValue.length > 1) ||
    (step === 2 && !!level) ||
    step === 3;

  const toggleSubject = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const handleUniversitySelect = (value: string) => {
    if (value === "__other") {
      setIsOther(true);
      setUniversity("");
    } else {
      setIsOther(false);
      setUniversity(value);
    }
  };

  const finish = async () => {
    if (!userId || !course || !level || !universityValue) return;
    setSaving(true);
    setError("");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ course_of_study: course, university: universityValue, level, onboarded: true })
      .eq("id", userId);

    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }

    const { data: existing } = await supabase.from("user_subjects").select("subject_id").eq("user_id", userId);
    const current = (existing || []).map((r: { subject_id: string }) => String(r.subject_id));
    const toRemove = current.filter((id) => !selected.includes(id));
    const toAdd = selected.filter((id) => !current.includes(id));

    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("user_subjects")
        .delete()
        .eq("user_id", userId)
        .in("subject_id", toRemove);
      if (removeError) {
        setSaving(false);
        setError(removeError.message);
        return;
      }
    }

    if (toAdd.length > 0) {
      const { error: addError } = await supabase
        .from("user_subjects")
        .insert(toAdd.map((subject_id) => ({ user_id: userId, subject_id })));
      if (addError) {
        setSaving(false);
        setError(addError.message);
        return;
      }
    }

    localStorage.setItem("eduprimeLevel", `${level} Level`);
    router.replace("/welcome");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      <header className="mx-auto flex w-full max-w-xl items-center gap-2.5 px-5 py-4">
        <img src="/logo-mark-light.png" alt="" className="h-9 w-auto" />
        <span className="font-heading text-lg font-semibold text-fg">EduPrime</span>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-10">
        <div className="mb-6">
          <div className="flex gap-1.5">
            {stepTitles.map((title, index) => (
              <div
                key={title}
                className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? "bg-primary" : "bg-line"}`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Step {step + 1} of {stepTitles.length}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          {step === 0 && (
            <div>
              <h1 className="text-xl font-semibold text-fg">What do you study?</h1>
              <p className="mt-1 text-sm text-muted">We use this to show you the right subjects.</p>
              <div className="mt-5 space-y-2">
                {courses.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCourse(item)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm text-fg transition ${
                      course === item ? "border-primary bg-primary-soft" : "border-line bg-surface hover:bg-raised"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                        course === item ? "border-primary bg-primary text-on-primary" : "border-line bg-canvas text-transparent"
                      }`}
                    >
                      <Check size={12} />
                    </span>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-xl font-semibold text-fg">Which university?</h1>
              <p className="mt-1 text-sm text-muted">Pick yours from the list. If it is not there, choose Other.</p>
              <select
                value={isOther ? "__other" : university}
                onChange={(e) => handleUniversitySelect(e.target.value)}
                className={`mt-5 ${field}`}
              >
                <option value="">Select your university</option>
                {Object.entries(universities).map(([group, names]) => (
                  <optgroup key={group} label={group}>
                    {names.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="__other">Other (type it in)</option>
              </select>

              {isOther && (
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Type your university"
                  className={`mt-3 ${field}`}
                  autoFocus
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-xl font-semibold text-fg">What level are you?</h1>
              <p className="mt-1 text-sm text-muted">You can change this later in Settings.</p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {levels.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLevel(item)}
                    className={`rounded-xl border px-4 py-4 text-center text-sm font-medium text-fg transition ${
                      level === item ? "border-primary bg-primary-soft" : "border-line bg-surface hover:bg-raised"
                    }`}
                  >
                    {item} Level
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-xl font-semibold text-fg">Your subjects</h1>
              <p className="mt-1 text-sm text-muted">
                {course} · {level} Level.{" "}
                {suggested.length > 0
                  ? "We ticked the subjects your course takes at this level. Add or remove any."
                  : "Tick the subjects you are offering."}
              </p>

              {subjectsLoading ? (
                <div className="mt-5 animate-pulse space-y-2">
                  <div className="h-11 rounded-xl bg-raised" />
                  <div className="h-11 rounded-xl bg-raised" />
                  <div className="h-11 rounded-xl bg-raised" />
                </div>
              ) : orderedSubjects.length === 0 ? (
                <p className="mt-5 text-sm text-muted">No subjects have been added yet. You can continue.</p>
              ) : (
                <div className="mt-5 space-y-2">
                  {orderedSubjects.map((subject) => {
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
                        {suggested.includes(subject.id) && (
                          <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-muted">
                            For your course
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} disabled={saving} className={secondaryButton}>
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canContinue} className={primaryButton}>
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={saving || subjectsLoading} className={primaryButton}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? "Saving..." : "Finish"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}