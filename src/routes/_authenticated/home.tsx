import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Droplet,
  Moon,
  Activity,
  Flame,
  Sparkles,
  ArrowRight,
  Smile,
  Footprints,
} from "lucide-react";
import { PageShell } from "@/components/health/page-shell";
import { StatCard } from "@/components/health/stat-card";
import { ProgressRing } from "@/components/health/progress-ring";
import { getProfile, getTodayEntry, listEntries } from "@/lib/health.functions";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

const TARGET_WATER = 2.5;
const TARGET_SLEEP = 8;
const TARGET_STEPS = 8000;

function HomePage() {
  const nav = useNavigate();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const entryQ = useQuery({ queryKey: ["today-entry"], queryFn: () => getTodayEntry() });
  const recentQ = useQuery({
    queryKey: ["recent-entries"],
    queryFn: () => listEntries({ data: { days: 14 } }),
  });

  const entry = entryQ.data;
  const name = profileQ.data?.display_name?.split(" ")[0] ?? "there";
  const score = computeScore(entry);
  const streak = computeStreak(recentQ.data ?? []);

  return (
    <PageShell
      subtitle={greeting()}
      title={`Hi, ${name}`}
      action={
        <Link to="/profile" className="glass flex size-11 items-center justify-center rounded-full">
          {profileQ.data?.avatar_url ? (
            <img src={profileQ.data.avatar_url} alt="" className="size-11 rounded-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">{(name[0] ?? "?").toUpperCase()}</span>
          )}
        </Link>
      }
    >
      {/* Hero score card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong soft-shadow emerald-glow relative overflow-hidden rounded-[28px] p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Today's Health Score
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-6xl font-semibold tracking-tight">{score}</span>
              <span className="text-lg text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-medium text-[color:var(--emerald)]">
              <Flame className="size-3" /> {streak}-day streak
            </div>
          </div>
          <ProgressRing value={score} size={110} stroke={9} label={`${score}`} sublabel="score" />
        </div>
      </motion.div>

      {/* Continue check-in */}
      <button
        onClick={() => nav({ to: "/chat" })}
        className="group mt-4 flex w-full items-center justify-between rounded-3xl bg-foreground px-5 py-4 text-background transition-all hover:opacity-90"
      >
        <span className="flex items-center gap-3">
          <Sparkles className="size-5" />
          <span className="text-[15px] font-medium">Continue today's check-in</span>
        </span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Quick stats grid */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatCard icon={Droplet} label="Water" value={fmt(entry?.water_liters)} unit="L" hint={`of ${TARGET_WATER}L`}>
          <Bar value={Number(entry?.water_liters ?? 0)} max={TARGET_WATER} />
        </StatCard>
        <StatCard icon={Moon} label="Sleep" value={fmt(entry?.sleep_hours)} unit="h" hint={`of ${TARGET_SLEEP}h`}>
          <Bar value={Number(entry?.sleep_hours ?? 0)} max={TARGET_SLEEP} />
        </StatCard>
        <StatCard icon={Footprints} label="Steps" value={(entry?.steps ?? 0).toLocaleString()} hint={`of ${TARGET_STEPS.toLocaleString()}`}>
          <Bar value={Number(entry?.steps ?? 0)} max={TARGET_STEPS} />
        </StatCard>
        <StatCard icon={Activity} label="Workout" value={entry?.workout_minutes ?? 0} unit="min" hint={entry?.workout_type ?? "—"} />
        <StatCard icon={Smile} label="Mood" value={entry?.mood ?? "—"} unit={entry?.mood ? "/10" : ""} hint="how you feel" />
        <StatCard icon={Flame} label="Energy" value={entry?.energy ?? "—"} unit={entry?.energy ? "/10" : ""} hint="today" />
      </div>

      {/* AI recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="glass mt-5 rounded-3xl p-5"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="size-4 text-[color:var(--emerald)]" />
          <span className="text-xs font-medium uppercase tracking-wider">AI recommendation</span>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">{recommend(entry)}</p>
        <Link
          to="/insights"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--emerald)]"
        >
          See all insights <ArrowRight className="size-3.5" />
        </Link>
      </motion.div>
    </PageShell>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full bg-[color:var(--emerald)]"
      />
    </div>
  );
}

function fmt(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "0";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function computeScore(e: Record<string, unknown> | null | undefined) {
  if (!e) return 0;
  const get = (k: string) => Number(e[k] ?? 0);
  const sleep = Math.min(1, get("sleep_hours") / 8) * 25;
  const water = Math.min(1, get("water_liters") / 2.5) * 20;
  const steps = Math.min(1, get("steps") / 8000) * 15;
  const workout = Math.min(1, get("workout_minutes") / 30) * 15;
  const mood = (get("mood") / 10) * 10;
  const energy = (get("energy") / 10) * 10;
  const productivity = (get("productivity") / 10) * 5;
  return Math.round(sleep + water + steps + workout + mood + energy + productivity);
}

function computeStreak(entries: Array<Record<string, unknown>>) {
  if (!entries.length) return 0;
  const dates = new Set(entries.map((e) => String(e.entry_date)));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function recommend(e: Record<string, any> | null | undefined) {
  if (!e) return "Tap below to start your daily check-in — I'll guide you through it.";
  const water = Number(e.water_liters ?? 0);
  const sleep = Number(e.sleep_hours ?? 0);
  const workout = Number(e.workout_minutes ?? 0);
  if (water < 1) return "You're a bit dehydrated. A glass of water now would help your energy and focus.";
  if (sleep && sleep < 6) return "Short sleep last night — try winding down 30 min earlier tonight.";
  if (!workout) return "No movement logged yet. Even a 15-min walk lifts your mood and energy.";
  return "Great rhythm today. Keep the small wins consistent — they compound.";
}
