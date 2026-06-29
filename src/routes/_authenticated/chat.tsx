import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, Loader2 } from "lucide-react";
import { PageShell } from "@/components/health/page-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getOrCreateTodayThread,
  getThreadMessages,
} from "@/lib/health.functions";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

type DbMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: string; text?: string }>;
  created_at: string;
};

function ChatPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const threadQ = useQuery({
    queryKey: ["today-thread"],
    queryFn: () => getOrCreateTodayThread(),
  });
  const threadId = threadQ.data?.id;

  const historyQ = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => getThreadMessages({ data: { threadId: threadId! } }),
    enabled: !!threadId,
  });

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const initialMessages =
    historyQ.data?.map((m: any) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      parts: (m.parts ?? []) as any,
    })) ?? [];

  return (
    <PageShell subtitle="Daily check-in" title="Pulse">
      {!threadId || !token || historyQ.isLoading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ChatInner
          threadId={threadId}
          token={token}
          initialMessages={initialMessages}
          onAfterMessage={() => {
            qc.invalidateQueries({ queryKey: ["today-entry"] });
            qc.invalidateQueries({ queryKey: ["recent-entries"] });
          }}
          onClose={() => nav({ to: "/home" })}
        />
      )}
    </PageShell>
  );
}

function ChatInner({
  threadId,
  token,
  initialMessages,
  onAfterMessage,
}: {
  threadId: string;
  token: string;
  initialMessages: any[];
  onAfterMessage: () => void;
  onClose: () => void;
}) {
  const { messages, sendMessage, status } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: { Authorization: `Bearer ${token}` },
      body: { threadId },
    }),
    messages: initialMessages as any,
    onFinish: onAfterMessage,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Send opening message if no history
  useEffect(() => {
    if (messages.length === 0 && status === "ready") {
      sendMessage({ role: "user", parts: [{ type: "text", text: "Hi" }] } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ role: "user", parts: [{ type: "text", text }] } as any);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
      <div ref={scrollRef} className="hide-scrollbar flex-1 space-y-3 overflow-y-auto pb-4 pr-1">
        <AnimatePresence initial={false}>
          {messages
            .filter((m) => m.role !== "system")
            .map((m) => (
              <Bubble key={m.id} role={m.role} text={extractText(m)} />
            ))}
        </AnimatePresence>
        {(status === "submitted" || status === "streaming") &&
          messages[messages.length - 1]?.role === "user" && <Typing />}
      </div>

      <form onSubmit={submit} className="glass-strong mt-2 flex items-end gap-2 rounded-3xl p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Tell me about your day…"
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!input.trim() || status === "streaming"}
          aria-label="Send"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--emerald)] text-[color:var(--primary-foreground)] transition-opacity disabled:opacity-40"
        >
          {status === "streaming" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-5" strokeWidth={2.4} />
          )}
        </button>
      </form>
    </div>
  );
}

function extractText(m: any): string {
  const parts = m.parts ?? [];
  return parts
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join("");
}

function Bubble({ role, text }: { role: string; text: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mr-2 mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-soft text-[color:var(--emerald)]">
          <Sparkles className="size-3.5" />
        </div>
      )}
      <div
        className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          isUser
            ? "rounded-br-md bg-[color:var(--emerald)] text-[color:var(--primary-foreground)]"
            : "rounded-bl-md glass"
        }`}
      >
        {text || "…"}
      </div>
    </motion.div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2 pl-9">
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
    </div>
  );
}
