import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { chatModel, extractMetrics } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are Pulse, a warm, intelligent AI lifestyle coach.

Your job: have a short, natural daily check-in conversation with the user about their health and routine. Ask ONE question at a time. Keep replies under 2-3 short sentences. Sound caring, never clinical.

Topics to gently explore over the conversation (skip what's already known):
wake/sleep time, sleep hours, water, meals (breakfast/lunch/dinner/snacks), workout & cardio, steps, mood, energy, productivity, study/work hours, screen time, weight (optional), notes.

Rules:
- Match the user's tone and energy.
- Acknowledge what they shared before asking the next question.
- If they say "I don't know" or skip, move on.
- After ~5–8 exchanges OR when the user signals "done", give a brief warm wrap-up summarizing what you logged today.
- Never give medical advice; for concerns recommend professionals.
- Use minimal emoji (0–1 per message), no headings.`;

async function authUser(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (token.split(".").length !== 3) return null;
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub as string };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await authUser(request);
        if (!session) return new Response("Unauthorized", { status: 401 });
        const { supabase, userId } = session;

        const body = (await request.json()) as {
          threadId: string;
          messages: UIMessage[];
        };
        if (!body.threadId) return new Response("Missing threadId", { status: 400 });

        // verify thread ownership
        const { data: thread } = await supabase
          .from("check_in_threads")
          .select("id, entry_date")
          .eq("id", body.threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const lastUser = [...body.messages].reverse().find((m) => m.role === "user");

        // Persist user message
        if (lastUser) {
          await supabase.from("check_in_messages").insert({
            thread_id: body.threadId,
            user_id: userId,
            role: "user",
            parts: (lastUser.parts ?? [{ type: "text", text: (lastUser as any).content ?? "" }]) as any,
          });

          // Fire-and-forget structured extraction → upsert daily_entries
          const userText =
            (lastUser.parts ?? [])
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join(" ") || ((lastUser as any).content ?? "");

          if (userText.trim()) {
            (async () => {
              try {
                const { data: existing } = await supabase
                  .from("daily_entries")
                  .select("*")
                  .eq("user_id", userId)
                  .eq("entry_date", thread.entry_date)
                  .maybeSingle();
                const patch = await extractMetrics(userText, existing);
                if (Object.keys(patch).length > 0) {
                  const merged = {
                    ...(existing ?? {}),
                    ...patch,
                    user_id: userId,
                    entry_date: thread.entry_date,
                  };
                  delete (merged as any).id;
                  delete (merged as any).created_at;
                  delete (merged as any).updated_at;
                  await supabase
                    .from("daily_entries")
                    .upsert(merged, { onConflict: "user_id,entry_date" });
                }
              } catch (e) {
                console.error("[metrics extract]", e);
              }
            })();
          }
        }

        const result = streamText({
          model: chatModel(),
          system: SYSTEM_PROMPT,
          messages: convertToModelMessages(body.messages),
          onFinish: async ({ text }) => {
            await supabase.from("check_in_messages").insert({
              thread_id: body.threadId,
              user_id: userId,
              role: "assistant",
              parts: [{ type: "text", text }] as any,
            });
            await supabase
              .from("check_in_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", body.threadId);
          },
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
