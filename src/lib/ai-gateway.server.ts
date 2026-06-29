import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, generateText } from "ai";
import { z } from "zod";

function getProvider() {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
  });
}

export const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export function chatModel() {
  return getProvider().chatModel(DEFAULT_MODEL);
}

const MetricsSchema = z.object({
  wake_time: z.string().nullish().describe("HH:MM 24h"),
  sleep_time: z.string().nullish().describe("HH:MM 24h"),
  sleep_hours: z.number().nullish(),
  water_liters: z.number().nullish(),
  steps: z.number().int().nullish(),
  workout_minutes: z.number().int().nullish(),
  workout_type: z.string().nullish(),
  cardio_minutes: z.number().int().nullish(),
  calories: z.number().int().nullish(),
  weight_kg: z.number().nullish(),
  mood: z.number().int().min(1).max(10).nullish(),
  energy: z.number().int().min(1).max(10).nullish(),
  productivity: z.number().int().min(1).max(10).nullish(),
  screen_time_minutes: z.number().int().nullish(),
  study_work_hours: z.number().nullish(),
  breakfast: z.string().nullish(),
  lunch: z.string().nullish(),
  dinner: z.string().nullish(),
  snacks: z.string().nullish(),
  notes: z.string().nullish(),
});

export async function extractMetrics(userMessage: string, existing: unknown) {
  const { object } = await generateObject({
    model: getProvider().chatModel(DEFAULT_MODEL),
    schema: MetricsSchema,
    system:
      "Extract health metrics the user mentioned in their message. Output ONLY fields they explicitly mentioned. Use null for everything else. Convert units to metric (kg, liters, minutes, HH:MM 24h).",
    prompt: `Existing today's data: ${JSON.stringify(existing ?? {})}\nUser said: """${userMessage}"""`,
  });
  // strip nulls
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(object)) {
    if (v !== null && v !== undefined && v !== "") out[k] = v;
  }
  return out;
}

export async function generateInsightFromEntries(
  entries: Array<Record<string, unknown>>,
  scope: "daily" | "weekly" | "monthly",
) {
  const InsightSchema = z.object({
    summary: z.string(),
    strengths: z.string(),
    weaknesses: z.string(),
    suggestions: z.string(),
    motivation: z.string(),
    score: z.number().int().min(0).max(100),
  });
  const { object } = await generateObject({
    model: getProvider().chatModel(DEFAULT_MODEL),
    schema: InsightSchema,
    system:
      "You are an empathetic, evidence-informed health coach. Be concise, warm, conversational. Use markdown bullets where useful. Never give medical advice; suggest professionals if concerning.",
    prompt: `Generate a ${scope} health insight based on these entries:\n${JSON.stringify(entries)}\nReturn a JSON insight: summary (2-3 sentences), strengths, weaknesses, suggestions (3-5 actionable bullets), motivation (1-2 sentences), score (0-100 lifestyle balance).`,
  });
  return object;
}

export async function quickReplyText(prompt: string, system?: string) {
  const { text } = await generateText({
    model: getProvider().chatModel(DEFAULT_MODEL),
    system,
    prompt,
  });
  return text;
}
