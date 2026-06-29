import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { PageShell } from "@/components/health/page-shell";
import { listEntries } from "@/lib/health.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const RANGES = [
  { id: "7", label: "Week", days: 7 },
  { id: "30", label: "Month", days: 30 },
  { id: "90", label: "3M", days: 90 },
  { id: "365", label: "Year", days: 365 },
] as const;

function AnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const q = useQuery({
    queryKey: ["entries", range.days],
    queryFn: () => listEntries({ data: { days: range.days } }),
  });

  const data = (q.data ?? []).map((e: any) => ({
    date: e.entry_date,
    short: new Date(e.entry_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    water: Number(e.water_liters ?? 0),
    sleep: Number(e.sleep_hours ?? 0),
    steps: Number(e.steps ?? 0),
    workout: Number(e.workout_minutes ?? 0),
    weight: e.weight_kg ? Number(e.weight_kg) : null,
    mood: Number(e.mood ?? 0),
    productivity: Number(e.productivity ?? 0),
    calories: Number(e.calories ?? 0),
  }));

  const emerald = "var(--emerald)";

  return (
    <PageShell subtitle="Analytics" title="Your trends">
      <div className="glass hide-scrollbar mb-5 flex items-center gap-1 overflow-x-auto rounded-full p-1">
        {RANGES.map((r) => {
          const active = r.id === range.id;
          return (
            <button
              key={r.id}
              onClick={() => setRange(r)}
              className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "text-[color:var(--primary-foreground)]" : "text-muted-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="range-pill"
                  className="absolute inset-0 -z-0 rounded-full bg-[color:var(--emerald)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{r.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <ChartCard title="Water intake" unit="L">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={emerald} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Area
                type="monotone"
                dataKey="water"
                stroke={emerald}
                strokeWidth={2}
                fill="url(#g1)"
                isAnimationActive
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sleep" unit="h">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="sleep" stroke={emerald} strokeWidth={2.4} dot={{ r: 3 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Steps" unit="">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="steps" fill={emerald} radius={[6, 6, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workout (minutes)" unit="min">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="workout" fill={emerald} radius={[6, 6, 0, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weight" unit="kg">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data.filter((d) => d.weight)} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="weight" stroke={emerald} strokeWidth={2.4} dot={{ r: 3 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mood & productivity" unit="/10">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="short" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="mood" stroke={emerald} strokeWidth={2.4} dot={{ r: 3 }} animationDuration={900} />
              <Line type="monotone" dataKey="productivity" stroke="var(--foreground)" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </PageShell>
  );
}

function ChartCard({ title, unit, children }: { title: string; unit: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass soft-shadow rounded-3xl p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
        {unit && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{unit}</div>}
      </div>
      {children}
    </motion.div>
  );
}

function TT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      <div className="font-medium">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="text-muted-foreground">
          {p.dataKey}: <span className="text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
