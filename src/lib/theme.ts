export type Theme = "dark" | "light";

const KEY = "pulse.theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const t = localStorage.getItem(KEY);
  return t === "light" ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
}
