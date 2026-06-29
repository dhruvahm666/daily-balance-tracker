import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/home", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) nav({ to: "/home", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const signIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google");
      if (result.error) {
        toast.error(result.error.message ?? "Sign-in failed");
        setLoading(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden px-6 pb-10 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -top-32 left-1/2 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-emerald-soft blur-3xl"
      />
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass flex size-16 items-center justify-center rounded-3xl emerald-glow"
        >
          <Sparkles className="size-7 text-[color:var(--emerald)]" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-8 text-4xl font-semibold tracking-tight"
        >
          Pulse
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-3 max-w-xs text-balance text-[15px] text-muted-foreground"
        >
          Your private AI coach for a calmer, healthier, more intentional life.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={signIn}
          disabled={loading}
          className="group flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-6 py-4 text-[15px] font-medium text-background transition-all hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <GoogleLogo />
          )}
          Continue with Google
        </button>
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to our Terms and acknowledge our Privacy Policy.
        </p>
      </motion.div>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.65 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.3H12z"/>
    </svg>
  );
}
