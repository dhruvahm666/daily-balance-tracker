import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageShell({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-md px-5 pb-32 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      {(title || action) && (
        <header className="mb-6 flex items-end justify-between gap-3 pt-2">
          <div>
            {subtitle && (
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {subtitle}
              </div>
            )}
            {title && <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{title}</h1>}
          </div>
          {action}
        </header>
      )}
      {children}
    </motion.div>
  );
}
