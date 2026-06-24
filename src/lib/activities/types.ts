export type Category =
  | "Work"
  | "Exercise"
  | "Sleep"
  | "Meals"
  | "Learning"
  | "Leisure";

export const CATEGORIES: Category[] = [
  "Work",
  "Exercise",
  "Sleep",
  "Meals",
  "Learning",
  "Leisure",
];

export type TimeOfDay = "Morning" | "Afternoon" | "Evening" | "Night";
export const TIMES_OF_DAY: TimeOfDay[] = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

export interface Activity {
  id: string;
  name: string;
  category: Category;
  duration: number; // minutes
  timeOfDay: TimeOfDay;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  Work: "var(--cat-work)",
  Exercise: "var(--cat-exercise)",
  Sleep: "var(--cat-sleep)",
  Meals: "var(--cat-meals)",
  Learning: "var(--cat-learning)",
  Leisure: "var(--cat-leisure)",
};

export const CATEGORY_BG: Record<Category, string> = {
  Work: "bg-cat-work",
  Exercise: "bg-cat-exercise",
  Sleep: "bg-cat-sleep",
  Meals: "bg-cat-meals",
  Learning: "bg-cat-learning",
  Leisure: "bg-cat-leisure",
};

// Recommended minutes per category per day (healthy balance)
export const RECOMMENDED: Record<Category, number> = {
  Work: 8 * 60,
  Exercise: 45,
  Sleep: 7.5 * 60,
  Meals: 75,
  Learning: 45,
  Leisure: 90,
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
