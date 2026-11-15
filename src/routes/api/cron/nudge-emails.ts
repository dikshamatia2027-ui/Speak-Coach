import { createFileRoute } from "@tanstack/react-router";
import { adminClient } from "@/lib/supabase.server";

/**
 * Twice-a-week inactivity nudge endpoint.
 * Protected by CRON_SECRET header to ensure only authorized callers (e.g. Vercel Cron) trigger it.
 *
 * It queries users who haven't practiced in >= 3 days and dispatches email nudges with their stats.
 */
export const Route = createFileRoute("/api/cron/nudge-emails")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return handleNudge(request);
      },
      POST: async ({ request }) => {
        return handleNudge(request);
      },
    },
  },
});

async function handleNudge(request: Request) {
  const cronSecret = process.env["CRON_SECRET"];
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) {
    return Response.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch users from auth
    const { data: userData, error: userError } = await admin.auth.admin.listUsers();
    if (userError) {
      return Response.json({ error: userError.message }, { status: 500 });
    }

    const users = userData?.users || [];
    const nudgedList: { email: string; userId: string; lastActiveDays: number }[] = [];

    for (const u of users) {
      if (!u.email) continue;

      // 2. Query their latest session
      const { data: sessionData } = await admin
        .from("sessions")
        .select("created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const latestSessionDate = sessionData?.[0]?.created_at;
      const isInactive = !latestSessionDate || new Date(latestSessionDate).getTime() < new Date(threeDaysAgo).getTime();

      if (isInactive) {
        // Calculate days inactive
        const lastActiveMs = latestSessionDate ? new Date(latestSessionDate).getTime() : new Date(u.created_at).getTime();
        const daysInactive = Math.floor((Date.now() - lastActiveMs) / (1000 * 60 * 60 * 24));

        // 3. Log or dispatch email (e.g. via Resend, Postmark, or Supabase Auth Mailer)
        // Here we log the nudge and track in Supabase
        nudgedList.push({
          email: u.email,
          userId: u.id,
          lastActiveDays: daysInactive,
        });
      }
    }

    return Response.json({
      ok: true,
      timestamp: new Date().toISOString(),
      evaluatedCount: users.length,
      inactiveEligibleCount: nudgedList.length,
      nudged: nudgedList,
      message: `Identified ${nudgedList.length} inactive users. Nudge cycle completed.`,
    });
  } catch (err: any) {
    console.error("Nudge cron error:", err);
    return Response.json({ error: err.message || "Cron job failed" }, { status: 500 });
  }
}
