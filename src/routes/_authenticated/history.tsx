import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Droplet, Moon, Footprints, Activity, Smile } from "lucide-react";
import { PageShell } from "@/components/health/page-shell";
import { listEntries } from "@/lib/health.functions";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const q = useQuery({
    queryKey: ["entries", 90],
    queryFn: () => listEntries({ data: { days: 90 } }),
  });
  const entries = [...(q.data ?? [])].reverse();

  return (
    <PageShell subtitle="History" title="Your days">
      {entries.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
          No entries yet. Start a check-in to see your days here.
        </div>
      )}
      <div className="space-y-3">
        {entries.map((e: any, i: number) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.35 }}
            className="glass soft-shadow rounded-3xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[15px] font-semibold">{formatDate(e.entry_date)}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.entry_date).toLocaleDateString(undefined, { weekday: "long" })}
                </div>
              </div>
              <ScoreBadge entry={e} />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
              <Mini icon={Droplet} value={fmt(e.water_liters)} unit="L" />
              <Mini icon={Moon} value={fmt(e.sleep_hours)} unit="h" />
              <Mini icon={Footprints} value={e.steps ?? 0} />
              <Mini icon={Activity} value={e.workout_minutes ?? 0} unit="m" />
              <Mini icon={Smile} value={e.mood ?? "—"} />
            </div>
            {e.notes && (
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{e.notes}</p>
            )}
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}

function Mini({ icon: Icon, value, unit }: { icon: any; value: any; unit?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-[color:var(--surface-2)] py-2">
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
      <div className="text-[11px] font-semibold">
        {value}
        {unit && <span className="text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function ScoreBadge({ entry }: { entry: any }) {
  const score = computeScore(entry);
  const tone =
    score >= 75 ? "text-[color:var(--emerald)] bg-emerald-soft" : score >= 50 ? "text-amber-400 bg-amber-400/10" : "text-rose-400 bg-rose-400/10";
  return <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{score}</div>;
}

function fmt(n: any) {
  if (n === null || n === undefined) return "0";
  const num = Number(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function computeScore(e: any) {
  if (!e) return 0;
  const num = (x: any) => Number(x ?? 0);
  return Math.round(
    Math.min(1, num(e.sleep_hours) / 8) * 25 +
      Math.min(1, num(e.water_liters) / 2.5) * 20 +
      Math.min(1, num(e.steps) / 8000) * 15 +
      Math.min(1, num(e.workout_minutes) / 30) * 15 +
      (num(e.mood) / 10) * 10 +
      (num(e.energy) / 10) * 10 +
      (num(e.productivity) / 10) * 5,
  );
}
