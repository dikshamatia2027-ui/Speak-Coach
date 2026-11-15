import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { isProActive } from "@/lib/plan";

/** Server-only client using the service-role key. Never import this from browser code. */
export function adminClient(): SupabaseClient | null {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type AuthedUser = { user: User; admin: SupabaseClient };

/** Verify the Bearer token with Supabase and return the user, or null. */
export async function userFromToken(token: string | null | undefined): Promise<AuthedUser | null> {
  if (!token) return null;
  const admin = adminClient();
  if (!admin) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, admin };
}

export function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : null;
}

export async function userFromRequest(request: Request): Promise<AuthedUser | null> {
  return userFromToken(bearerToken(request));
}

export async function getPlan(admin: SupabaseClient, userId: string): Promise<"free" | "pro"> {
  const { data } = await admin.from("profiles").select("plan, plan_renews_at").eq("id", userId).maybeSingle();
  return isProActive(data) ? "pro" : "free";
}

/** Start of the current week (Monday 00:00), same rule the app shows in the browser. Uses IST, the main audience. */
export function weekStartMs(now = new Date()): number {
  const IST = 5.5 * 3600_000;
  const local = new Date(now.getTime() + IST);
  local.setUTCHours(0, 0, 0, 0);
  const day = (local.getUTCDay() + 6) % 7; // Monday = 0
  return local.getTime() - day * 86_400_000 - IST;
}

export type Reservation = { ok: true; id: string } | { ok: false; reason: "limit" | "unavailable" };

/** Atomically check the weekly limit and count one analysis, so parallel requests cannot get past it. */
export async function reserveAnalysis(admin: SupabaseClient, userId: string, limit: number | null): Promise<Reservation> {
  const { data, error } = await admin.rpc("reserve_analysis", {
    p_user_id: userId,
    p_since: new Date(weekStartMs()).toISOString(),
    p_limit: limit,
  });
  if (error) {
    console.error("[analyze] Could not reserve a session:", error.message);
    return { ok: false, reason: "unavailable" };
  }
  return typeof data === "string" ? { ok: true, id: data } : { ok: false, reason: "limit" };
}

/** Give a session back when it did not produce a report. */
export async function releaseAnalysis(admin: SupabaseClient, id: string): Promise<void> {
  const { error } = await admin.from("analysis_log").delete().eq("id", id);
  if (error) console.error("[analyze] Could not release a session:", error.message);
}
