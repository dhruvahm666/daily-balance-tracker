import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const today = () => new Date().toISOString().slice(0, 10);

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      display_name: z.string().optional(),
      units: z.enum(["metric", "imperial"]).optional(),
      theme: z.enum(["dark", "light"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const getTodayEntry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", context.userId)
      .eq("entry_date", today())
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const listEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ days: z.number().int().min(1).max(400).default(90) }))
  .handler(async ({ context, data }) => {
    const since = new Date(Date.now() - data.days * 86400000).toISOString().slice(0, 10);
    const { data: rows, error } = await context.supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", context.userId)
      .gte("entry_date", since)
      .order("entry_date", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const upsertEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      entry_date: z.string().optional(),
      patch: z.record(z.string(), z.any()),
    }),
  )
  .handler(async ({ context, data }) => {
    const date = data.entry_date ?? today();
    const { data: existing } = await context.supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", context.userId)
      .eq("entry_date", date)
      .maybeSingle();
    const merged = { ...(existing ?? {}), ...data.patch, user_id: context.userId, entry_date: date };
    delete (merged as Record<string, unknown>).id;
    delete (merged as Record<string, unknown>).created_at;
    delete (merged as Record<string, unknown>).updated_at;
    const { data: row, error } = await context.supabase
      .from("daily_entries")
      .upsert(merged, { onConflict: "user_id,entry_date" })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("check_in_threads")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const getOrCreateTodayThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const date = today();
    const { data: existing } = await context.supabase
      .from("check_in_threads")
      .select("*")
      .eq("user_id", context.userId)
      .eq("entry_date", date)
      .maybeSingle();
    if (existing) return existing;
    const { data, error } = await context.supabase
      .from("check_in_threads")
      .insert({ user_id: context.userId, entry_date: date, title: "Daily check-in" })
      .select()
      .single();
    if (error) throw error;
    return data;
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("check_in_messages")
      .select("*")
      .eq("thread_id", data.threadId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const listInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("insights")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  });

export const generateInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ scope: z.enum(["daily", "weekly", "monthly"]) }))
  .handler(async ({ context, data }) => {
    const days = data.scope === "daily" ? 1 : data.scope === "weekly" ? 7 : 30;
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const { data: entries } = await context.supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", context.userId)
      .gte("entry_date", since)
      .order("entry_date", { ascending: true });

    const { generateInsightFromEntries } = await import("@/lib/ai-gateway.server");
    const insight = await generateInsightFromEntries(entries ?? [], data.scope);

    const periodEnd = new Date().toISOString().slice(0, 10);
    const { data: row, error } = await context.supabase
      .from("insights")
      .insert({
        user_id: context.userId,
        scope: data.scope,
        period_start: since,
        period_end: periodEnd,
        ...insight,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("daily_entries").delete().eq("user_id", context.userId);
    await context.supabase.from("check_in_messages").delete().eq("user_id", context.userId);
    await context.supabase.from("check_in_threads").delete().eq("user_id", context.userId);
    await context.supabase.from("insights").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const exportData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [entries, threads, messages, insights] = await Promise.all([
      context.supabase.from("daily_entries").select("*").eq("user_id", context.userId),
      context.supabase.from("check_in_threads").select("*").eq("user_id", context.userId),
      context.supabase.from("check_in_messages").select("*").eq("user_id", context.userId),
      context.supabase.from("insights").select("*").eq("user_id", context.userId),
    ]);
    return {
      entries: entries.data ?? [],
      threads: threads.data ?? [],
      messages: messages.data ?? [],
      insights: insights.data ?? [],
      exported_at: new Date().toISOString(),
    };
  });
