import type { SupabaseClient } from "@supabase/supabase-js";
import { allowRequest } from "@/lib/rate-limit.server";

/** Per-user caps on AI calls. Each window is one hour. */
export const AI_LIMITS = {
  analyze: 15,
  scenario: 10,
  vocab: 40,
} as const;
export type AiKind = keyof typeof AI_LIMITS;

const WINDOW_SECONDS = 60 * 60;

/**
 * True if this user may make one more AI call of this kind, and counts it.
 * The count lives in Supabase (take_ai_quota), so it holds across server instances.
 * If the database call fails (for example the SQL has not been run yet), it falls back
 * to a per-instance in-memory count for the same user, so the app keeps working.
 */
export async function takeAiQuota(admin: SupabaseClient, userId: string, kind: AiKind): Promise<boolean> {
  const limit = AI_LIMITS[kind];
  const { data, error } = await admin.rpc("take_ai_quota", {
    p_user_id: userId,
    p_kind: kind,
    p_limit: limit,
    p_window_seconds: WINDOW_SECONDS,
  });
  if (error || typeof data !== "boolean") {
    console.error(`[ai-quota] Falling back to in-memory limit for ${kind}:`, error?.message ?? "unexpected reply");
    return allowRequest(`${kind}:user:${userId}`, limit, WINDOW_SECONDS * 1000);
  }
  return data;
}
