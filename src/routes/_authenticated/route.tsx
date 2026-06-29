import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    return { session: data.session };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <div className="relative min-h-screen pb-24">
      <AnimatePresence mode="wait">
        <Outlet />
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
