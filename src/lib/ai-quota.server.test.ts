import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { AI_LIMITS, takeAiQuota } from "./ai-quota.server";

function fakeAdmin(reply: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(reply);
  return { admin: { rpc } as unknown as SupabaseClient, rpc };
}

describe("takeAiQuota", () => {
  it("asks the database with the user, kind, limit and one-hour window", async () => {
    const { admin, rpc } = fakeAdmin({ data: true, error: null });
    expect(await takeAiQuota(admin, "user-1", "vocab")).toBe(true);
    expect(rpc).toHaveBeenCalledWith("take_ai_quota", {
      p_user_id: "user-1",
      p_kind: "vocab",
      p_limit: AI_LIMITS.vocab,
      p_window_seconds: 3600,
    });
  });

  it("blocks when the database says the user is over the limit", async () => {
    const { admin } = fakeAdmin({ data: false, error: null });
    expect(await takeAiQuota(admin, "user-2", "analyze")).toBe(false);
  });

  it("falls back to a per-user memory limit when the database call fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin } = fakeAdmin({ data: null, error: { message: "function does not exist" } });
    const user = `user-${Math.random()}`;
    for (let i = 0; i < AI_LIMITS.scenario; i++) expect(await takeAiQuota(admin, user, "scenario")).toBe(true);
    expect(await takeAiQuota(admin, user, "scenario")).toBe(false);
    // A different user on the same server is not affected.
    expect(await takeAiQuota(admin, `other-${Math.random()}`, "scenario")).toBe(true);
  });
});
