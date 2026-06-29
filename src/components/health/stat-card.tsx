import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  accent = false,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  value?: string | number;
  unit?: string;
  hint?: string;
  accent?: boolean;
  children?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`glass soft-shadow rounded-3xl p-4 ${accent ? "emerald-glow" : ""}`}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4" strokeWidth={1.8} />}
          <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
      </div>
      {value !== undefined && (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      )}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      {children}
    </motion.div>
  );
}
