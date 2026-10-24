import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

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
  const { data } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle();
  return data?.plan === "pro" ? "pro" : "free";
}

/** Start of the current week (Monday 00:00), same rule the app shows in the browser. Uses IST, the main audience. */
export function weekStartMs(now = new Date()): number {
  const IST = 5.5 * 3600_000;
  const local = new Date(now.getTime() + IST);
  local.setUTCHours(0, 0, 0, 0);
  const day = (local.getUTCDay() + 6) % 7; // Monday = 0
  return local.getTime() - day * 86_400_000 - IST;
}

export async function weeklyAnalysisCount(admin: SupabaseClient, userId: string): Promise<number> {
  const since = new Date(weekStartMs()).toISOString();
  const { count } = await admin
    .from("analysis_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return count ?? 0;
}
