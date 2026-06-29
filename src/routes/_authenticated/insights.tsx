import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Sparkles, TrendingUp, AlertCircle, Heart, Flame } from "lucide-react";
import { PageShell } from "@/components/health/page-shell";
import { generateInsight, listInsights } from "@/lib/health.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/insights")({
  component: InsightsPage,
});

const SCOPES = [
  { id: "daily", label: "Today" },
  { id: "weekly", label: "This week" },
  { id: "monthly", label: "This month" },
] as const;

function InsightsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["insights"], queryFn: () => listInsights() });

  const gen = useMutation({
    mutationFn: (scope: "daily" | "weekly" | "monthly") => generateInsight({ data: { scope } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insights"] });
      toast.success("New insight generated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not generate insight"),
  });

  return (
    <PageShell subtitle="AI Insights" title="Reflections">
      <div className="glass mb-5 grid grid-cols-3 gap-2 rounded-3xl p-2">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            disabled={gen.isPending}
            onClick={() => gen.mutate(s.id)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--surface-2)] px-3 py-3 text-xs font-medium transition-colors hover:bg-[color:var(--emerald)] hover:text-[color:var(--primary-foreground)] disabled:opacity-50"
          >
            {gen.isPending && gen.variables === s.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {s.label}
          </button>
        ))}
      </div>

      {q.isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {q.data?.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
          Tap a button above to generate your first AI insight.
        </div>
      )}

      <div className="space-y-4">
        {q.data?.map((i: any, idx: number) => (
          <motion.div
            key={i.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.4) }}
            className="glass-strong soft-shadow rounded-3xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[color:var(--emerald)]">
                {i.scope}
              </div>
              {typeof i.score === "number" && (
                <div className="text-2xl font-semibold tracking-tight">{i.score}<span className="text-sm text-muted-foreground">/100</span></div>
              )}
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">{i.summary}</p>
            <Section icon={TrendingUp} title="Strengths" body={i.strengths} tone="emerald" />
            <Section icon={AlertCircle} title="Areas to improve" body={i.weaknesses} tone="amber" />
            <Section icon={Heart} title="Suggestions" body={i.suggestions} tone="emerald" />
            <Section icon={Flame} title="Motivation" body={i.motivation} tone="rose" />
            <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              {new Date(i.created_at).toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}

function Section({ icon: Icon, title, body, tone }: { icon: any; title: string; body: string; tone: string }) {
  if (!body) return null;
  const c =
    tone === "emerald" ? "text-[color:var(--emerald)]" : tone === "amber" ? "text-amber-400" : "text-rose-400";
  return (
    <div className="mt-4">
      <div className={`mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${c}`}>
        <Icon className="size-3.5" /> {title}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
