import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Bell, Ruler, Download, ShieldAlert, Trash2, Loader2 } from "lucide-react";
import { PageShell } from "@/components/health/page-shell";
import { deleteAccount, exportData, getProfile, updateProfile } from "@/lib/health.functions";
import { getTheme, setTheme as applyTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [notif, setNotif] = useState(false);

  useEffect(() => {
    setThemeState(getTheme());
    if (typeof Notification !== "undefined") setNotif(Notification.permission === "granted");
  }, []);

  const updP = useMutation({
    mutationFn: (data: any) => updateProfile({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  const onTheme = (t: "dark" | "light") => {
    setThemeState(t);
    applyTheme(t);
    updP.mutate({ theme: t });
  };

  const onUnits = (u: "metric" | "imperial") => updP.mutate({ units: u });

  const onExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const del = useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: async () => {
      await supabase.auth.signOut();
      toast.success("Data deleted");
      nav({ to: "/auth", replace: true });
    },
  });

  const requestNotif = async () => {
    if (typeof Notification === "undefined") return;
    const r = await Notification.requestPermission();
    setNotif(r === "granted");
    if (r === "granted") toast.success("Notifications enabled");
  };

  const units = profileQ.data?.units ?? "metric";

  return (
    <PageShell subtitle="Settings" title="Preferences">
      <Group title="Appearance">
        <Segmented
          value={theme}
          onChange={(v) => onTheme(v as any)}
          options={[
            { id: "dark", label: "Dark", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
          ]}
        />
      </Group>

      <Group title="Units">
        <Segmented
          value={units}
          onChange={(v) => onUnits(v as any)}
          options={[
            { id: "metric", label: "kg / L / km", icon: Ruler },
            { id: "imperial", label: "lb / oz / mi", icon: Ruler },
          ]}
        />
      </Group>

      <Group title="Notifications">
        <button
          onClick={requestNotif}
          className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left"
        >
          <span className="flex items-center gap-3">
            <Bell className="size-4 text-[color:var(--emerald)]" />
            <span className="text-[15px] font-medium">Daily reminders</span>
          </span>
          <span className={`text-xs font-medium ${notif ? "text-[color:var(--emerald)]" : "text-muted-foreground"}`}>
            {notif ? "Enabled" : "Enable"}
          </span>
        </button>
      </Group>

      <Group title="Data">
        <button onClick={onExport} className="glass flex w-full items-center justify-between rounded-2xl p-4 text-left">
          <span className="flex items-center gap-3">
            <Download className="size-4 text-[color:var(--emerald)]" />
            <span className="text-[15px] font-medium">Export data</span>
          </span>
        </button>
      </Group>

      <Group title="Danger zone">
        <button
          disabled={del.isPending}
          onClick={() => {
            if (confirm("This permanently deletes all your data. Continue?")) del.mutate();
          }}
          className="glass flex w-full items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-left"
        >
          <span className="flex items-center gap-3">
            {del.isPending ? <Loader2 className="size-4 animate-spin text-rose-400" /> : <Trash2 className="size-4 text-rose-400" />}
            <span className="text-[15px] font-medium text-rose-300">Delete all my data</span>
          </span>
          <ShieldAlert className="size-4 text-rose-400/60" />
        </button>
      </Group>
    </PageShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6"
    >
      <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </motion.div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string; icon: any }>;
}) {
  return (
    <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-1">
      {options.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "text-[color:var(--primary-foreground)]" : "text-muted-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((o) => o.id).join("")}`}
                className="absolute inset-0 -z-0 rounded-xl bg-[color:var(--emerald)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative z-10 size-3.5" />
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
