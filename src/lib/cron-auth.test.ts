import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "./cron-auth.server";

describe("isAuthorizedCron", () => {
  it("refuses everyone when no secret is configured", () => {
    expect(isAuthorizedCron(null, undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
  });

  it("accepts only the exact Bearer secret", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
    expect(isAuthorizedCron("s3cret", "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer s3cre", "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer s3cretX", "s3cret")).toBe(false);
  });
});
