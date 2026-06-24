import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  RECOMMENDED,
  formatDuration,
  todayKey,
  type Category,
} from "@/lib/activities/types";
import { useActivities } from "@/lib/activities/store";
import { totalsByCategory } from "@/lib/activities/suggestions";

export const Route = createFileRoute("/weekly")({
  head: () => ({
    meta: [
      { title: "Weekly — Rhythm" },
      { name: "description", content: "Your last 7 days at a glance." },
    ],
  }),
  component: WeeklyPage,
});

function WeeklyPage() {
  const { items, ready } = useActivities();

  const days = useMemo(() => {
    const arr: { date: string; label: string; dow: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      arr.push({
        date: todayKey(d),
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        dow: d.toLocaleDateString(undefined, { weekday: "short" }),
      });
    }
    return arr;
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const d of days) m.set(d.date, []);
    for (const it of items) {
      if (m.has(it.date)) m.get(it.date)!.push(it);
    }
    return m;
  }, [items, days]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Weekly overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Patterns across the last 7 days
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category mix</CardTitle>
          <CardDescription>
            Each bar shows how the day was split across categories.
            Green dot = balanced day, amber = off-track.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-3">
              {days.map((d) => {
                const dayItems = byDay.get(d.date) ?? [];
                const totals = totalsByCategory(dayItems);
                const total = Object.values(totals).reduce((a, b) => a + b, 0);
                const score = balanceScore(totals);
                return (
                  <div
                    key={d.date}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                  >
                    <div className="w-16 shrink-0">
                      <div className="text-xs font-medium">{d.dow}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.label}
                      </div>
                    </div>
                    <div className="h-6 overflow-hidden rounded-md bg-muted">
                      {total === 0 ? (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                          No data
                        </div>
                      ) : (
                        <div className="flex h-full w-full">
                          {CATEGORIES.map((c) =>
                            totals[c] > 0 ? (
                              <div
                                key={c}
                                title={`${c}: ${formatDuration(totals[c])}`}
                                style={{
                                  width: `${(totals[c] / total) * 100}%`,
                                  background: CATEGORY_COLORS[c],
                                }}
                              />
                            ) : null,
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex w-28 items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">
                        {total > 0 ? formatDuration(total) : "—"}
                      </span>
                      <BalanceBadge score={score} hasData={total > 0} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 border-t pt-4">
            {CATEGORIES.map((c) => (
              <div key={c} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: CATEGORY_COLORS[c] }}
                />
                {c}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function balanceScore(totals: Record<Category, number>): number {
  // 0..1 — how close totals are to recommended (capped per category)
  let s = 0;
  for (const c of CATEGORIES) {
    const ratio = Math.min(1, totals[c] / RECOMMENDED[c]);
    s += ratio;
  }
  return s / CATEGORIES.length;
}

function BalanceBadge({ score, hasData }: { score: number; hasData: boolean }) {
  if (!hasData)
    return (
      <Badge variant="outline" className="font-normal">
        —
      </Badge>
    );
  if (score >= 0.55)
    return (
      <Badge className="bg-cat-exercise text-white hover:bg-cat-exercise">
        Good
      </Badge>
    );
  return (
    <Badge className="bg-cat-meals text-white hover:bg-cat-meals">Off-track</Badge>
  );
}
