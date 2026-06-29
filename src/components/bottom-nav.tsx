import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageCircle, BarChart3, CalendarDays, User } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-md px-4 pb-3 pt-2">
        <div className="glass-strong soft-shadow flex items-center justify-between rounded-full px-2 py-1.5">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="relative flex flex-1 flex-col items-center justify-center rounded-full px-2 py-2 text-[11px] font-medium text-muted-foreground transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-1 -z-0 rounded-full bg-emerald-soft"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon
                  className={`z-10 size-5 transition-colors ${active ? "text-[color:var(--emerald)]" : ""}`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span className={`z-10 mt-0.5 ${active ? "text-foreground" : ""}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
