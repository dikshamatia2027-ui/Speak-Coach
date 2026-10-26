import * as React from "react";
import { nameFromEmail } from "@/lib/name";
import type { Session as SbSession, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { store, type Session } from "@/lib/speakcoach";

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  /** Re-read the plan from the server (used after a payment). Returns the plan. */
  refreshPlan: () => Promise<"free" | "pro">;
};

const AuthContext = React.createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Save the display name on the account so it follows the person to any device. */
export async function saveAccountName(name: string) {
  const sb = getSupabase();
  const clean = name.trim();
  if (!sb || !clean) return;
  await sb.auth.updateUser({ data: { full_name: clean } });
}

async function loadPlan(userId: string): Promise<"free" | "pro"> {
  const sb = getSupabase();
  if (!sb) return "free";
  const { data } = await sb.from("profiles").select("plan").eq("id", userId).maybeSingle();
  const plan = data?.plan === "pro" ? "pro" : "free";
  store.setProfile({ plan });
  return plan;
}

/** Pull history from the database and upload any history that only exists in this browser (first login). */
async function syncSessions(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { data, error } = await sb.from("sessions").select("id, data").eq("user_id", userId);
  if (error) return;
  const remote = (data ?? []).map((r) => r.data as Session);
  const remoteIds = new Set((data ?? []).map((r) => r.id as string));
  const local = store.get().sessions;
  const toUpload = local.filter((s) => !remoteIds.has(s.id));
  if (toUpload.length > 0) {
    await sb
      .from("sessions")
      .upsert(toUpload.map((s) => ({ user_id: userId, id: s.id, data: s })), { onConflict: "user_id,id" });
  }
  const merged = new Map<string, Session>();
  for (const s of [...remote, ...local]) merged.set(s.id, s);
  store.setSessions([...merged.values()].sort((a, b) => a.createdAt - b.createdAt));
}

export async function saveSessionRemote(session: Session) {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  if (!data.user) return;
  await sb.from("sessions").upsert({ user_id: data.user.id, id: session.id, data: session }, { onConflict: "user_id,id" });
}

export async function clearSessionsRemote() {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  if (!data.user) return;
  await sb.from("sessions").delete().eq("user_id", data.user.id);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const configured = typeof window === "undefined" ? true : getSupabase() !== null;

  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    let lastUserId: string | null = null;
    const apply = (session: SbSession | null) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && u.id !== lastUserId) {
        lastUserId = u.id;
        const saved = typeof u.user_metadata?.["full_name"] === "string" ? (u.user_metadata["full_name"] as string).trim() : "";
        if (saved) {
          store.setProfile({ name: saved });
        } else {
          const guess = nameFromEmail(u.email);
          if (guess) {
            store.setProfile({ name: guess });
            void saveAccountName(guess);
          }
        }
        void loadPlan(u.id);
        void syncSessions(u.id);
      }
      if (!u) {
        lastUserId = null;
        store.setProfile({ plan: "free" });
      }
      setLoading(false);
    };
    void sb.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => apply(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured,
      async signInWithEmail(email) {
        const sb = getSupabase();
        if (!sb) return { error: "Sign-in is not set up yet." };
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        return error ? { error: error.message } : {};
      },
      async signInWithGoogle() {
        const sb = getSupabase();
        if (!sb) return { error: "Sign-in is not set up yet." };
        const { error } = await sb.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/dashboard` },
        });
        return error ? { error: error.message } : {};
      },
      async signOut() {
        const sb = getSupabase();
        await sb?.auth.signOut();
        // Do not leave one person's history on a shared device.
        store.clearHistory();
        store.setProfile({ plan: "free" });
      },
      async refreshPlan() {
        return user ? loadPlan(user.id) : "free";
      },
    }),
    [user, loading, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
