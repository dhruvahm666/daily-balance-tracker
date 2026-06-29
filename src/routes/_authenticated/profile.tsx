import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Settings, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/health/page-shell";
import { getProfile, listEntries } from "@/lib/health.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const nav = useNavigate();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const entriesQ = useQuery({ queryKey: ["entries", 365], queryFn: () => listEntries({ data: { days: 365 } }) });

  const p = profileQ.data;
  const total = entriesQ.data?.length ?? 0;

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  return (
    <PageShell subtitle="Profile" title="You">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong emerald-glow rounded-[28px] p-6 text-center"
      >
        <div className="mx-auto flex size-20 items-center justify-center overflow-hidden rounded-full bg-emerald-soft">
          {p?.avatar_url ? (
            <img src={p.avatar_url} alt="" className="size-20 object-cover" />
          ) : (
            <span className="text-2xl font-semibold">{(p?.display_name?.[0] ?? "?").toUpperCase()}</span>
          )}
        </div>
        <div className="mt-4 text-xl font-semibold">{p?.display_name ?? "—"}</div>
        <div className="text-sm text-muted-foreground">{p?.email}</div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="Days" value={total} />
          <Stat label="Streak" value={computeStreak(entriesQ.data ?? [])} />
          <Stat label="Avg score" value={avgScore(entriesQ.data ?? [])} />
        </div>
      </motion.div>

      <div className="mt-5 space-y-2">
        <Row to="/insights" icon={Sparkles} label="AI Insights" />
        <Row to="/settings" icon={Settings} label="Settings" />
        <button
          onClick={signOut}
          className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left"
        >
          <span className="flex items-center gap-3">
            <LogOut className="size-4 text-rose-400" />
            <span className="text-[15px] font-medium">Log out</span>
          </span>
        </button>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-[color:var(--surface-2)] py-3">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ to, icon: Icon, label }: { to: any; icon: any; label: string }) {
  return (
    <Link to={to} className="glass flex items-center justify-between rounded-2xl p-4">
      <span className="flex items-center gap-3">
        <Icon className="size-4 text-[color:var(--emerald)]" />
        <span className="text-[15px] font-medium">{label}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function computeStreak(entries: any[]) {
  if (!entries.length) return 0;
  const dates = new Set(entries.map((e) => e.entry_date));
  let s = 0;
  const d = new Date();
  while (dates.has(d.toISOString().slice(0, 10))) {
    s++;
    d.setDate(d.getDate() - 1);
  }
  return s;
}

function avgScore(entries: any[]) {
  if (!entries.length) return 0;
  const scores = entries.map((e) => {
    const n = (x: any) => Number(x ?? 0);
    return Math.round(
      Math.min(1, n(e.sleep_hours) / 8) * 25 +
        Math.min(1, n(e.water_liters) / 2.5) * 20 +
        Math.min(1, n(e.steps) / 8000) * 15 +
        Math.min(1, n(e.workout_minutes) / 30) * 15 +
        (n(e.mood) / 10) * 10 +
        (n(e.energy) / 10) * 10 +
        (n(e.productivity) / 10) * 5,
    );
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
