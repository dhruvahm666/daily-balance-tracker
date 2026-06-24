import type { Activity, Category } from "./types";
import { CATEGORIES, RECOMMENDED } from "./types";

export function totalsByCategory(items: Activity[]): Record<Category, number> {
  const totals = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0]),
  ) as Record<Category, number>;
  for (const it of items) totals[it.category] += it.duration;
  return totals;
}

export function generateSuggestions(items: Activity[]): string[] {
  const totals = totalsByCategory(items);
  const out: string[] = [];

  if (items.length === 0) {
    out.push("No activities logged yet — start by adding what you've done today.");
    return out;
  }

  if (totals.Work >= 360) {
    out.push(
      `You've spent ${Math.round(totals.Work / 60)}h on work — consider a short break or some exercise.`,
    );
  }
  if (totals.Sleep === 0) {
    out.push("No sleep logged yet — make sure to get 7–8 hours tonight.");
  } else if (totals.Sleep < RECOMMENDED.Sleep - 60) {
    out.push(
      `Only ${Math.round(totals.Sleep / 60)}h of sleep logged — aim for 7–8 hours for full recovery.`,
    );
  }
  if (totals.Meals === 0) {
    out.push("You haven't logged any meals today — don't forget to eat.");
  }
  if (totals.Exercise === 0 && totals.Work > 120) {
    out.push("No exercise yet — even a 20-minute walk helps offset desk time.");
  }
  if (totals.Learning === 0 && totals.Leisure > 120) {
    out.push("Plenty of leisure time — a quick learning session could balance the day.");
  }
  if (totals.Leisure === 0 && totals.Work > 240) {
    out.push("All work and no play — schedule some leisure to unwind.");
  }

  const totalMin = Object.values(totals).reduce((a, b) => a + b, 0);
  if (totalMin > 0 && out.length === 0) {
    out.push("Nice balance so far — keep it up!");
  }
  return out;
}
