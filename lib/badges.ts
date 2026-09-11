import { supabase } from "@/lib/supabase";

export type BadgeStats = {
  questionsAnswered: number;
  cbtTestsTaken: number;
  bestScore: number;
  streakDays: number;
};

export async function checkAndAwardBadges(userId: string, stats: BadgeStats) {
  if (!userId) return [];

  try {
    const { data: existingBadges, error: existingError } = await supabase
      .from("user_badges")
      .select("badge_name")
      .eq("user_id", userId);

    if (existingError) {
      return [];
    }

    const earned = new Set((existingBadges || []).map((item: any) => item.badge_name));
    const awards: Array<{ badge_name: string; badge_description: string; badge_icon: string }> = [
      { badge_name: "Study Starter", badge_description: "Answer 10 questions", badge_icon: "✨" },
      { badge_name: "Streak Igniter", badge_description: "Maintain a 3-day study streak", badge_icon: "🔥" },
      { badge_name: "Exam Ready", badge_description: "Complete 3 CBT exams", badge_icon: "🧠" },
      { badge_name: "Top Scorer", badge_description: "Reach a 80% best score", badge_icon: "🏆" },
      { badge_name: "Daily Scholar", badge_description: "Answer 50 questions", badge_icon: "📚" },
      { badge_name: "Perfect Run", badge_description: "Score 100% on a CBT exam", badge_icon: "⭐" },
    ];

    const conditions: Record<string, boolean> = {
      "Study Starter": stats.questionsAnswered >= 10,
      "Streak Igniter": stats.streakDays >= 3,
      "Exam Ready": stats.cbtTestsTaken >= 3,
      "Top Scorer": stats.bestScore >= 80,
      "Daily Scholar": stats.questionsAnswered >= 50,
      "Perfect Run": stats.bestScore >= 100,
    };

    const newAwards: string[] = [];

    for (const award of awards) {
      if (earned.has(award.badge_name) || !conditions[award.badge_name]) continue;

      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_name: award.badge_name,
        badge_description: award.badge_description,
        badge_icon: award.badge_icon,
        earned_at: new Date().toISOString(),
      });

      if (!error) {
        newAwards.push(award.badge_name);
      }
    }

    return newAwards;
  } catch {
    return [];
  }
}
