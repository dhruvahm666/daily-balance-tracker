import { useCallback, useEffect, useState } from "react";
import type { Activity } from "./types";

const STORAGE_KEY = "daily-activities-v1";

function readAll(): Activity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Activity[];
  } catch {
    return [];
  }
}

function writeAll(items: Activity[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("activities:changed"));
}

export function useActivities() {
  const [items, setItems] = useState<Activity[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readAll());
    setReady(true);
    const onChange = () => setItems(readAll());
    window.addEventListener("activities:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("activities:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((a: Omit<Activity, "id" | "createdAt">) => {
    const all = readAll();
    const newItem: Activity = {
      ...a,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    writeAll([newItem, ...all]);
  }, []);

  const update = useCallback((id: string, patch: Partial<Activity>) => {
    const all = readAll();
    writeAll(all.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const remove = useCallback((id: string) => {
    writeAll(readAll().filter((x) => x.id !== id));
  }, []);

  return { items, ready, add, update, remove };
}
