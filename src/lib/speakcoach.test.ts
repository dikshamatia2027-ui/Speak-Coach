import { describe, expect, it } from "vitest";
import { analyzeResponse } from "./speakcoach";

describe("analyzeResponse", () => {
  it("counts words and pace", () => {
    const text = Array(120).fill("word").join(" ");
    const a = analyzeResponse(text, 60);
    expect(a.wordCount).toBe(120);
    expect(a.wordsPerMinute).toBe(120);
  });
  it("finds filler words", () => {
    const a = analyzeResponse("So um I think, like, um this is good", 10);
    expect(a.fillerCount).toBeGreaterThanOrEqual(3);
    expect(a.fillerWords.some((f) => f.word === "um" && f.count === 2)).toBe(true);
  });
  it("reports no fillers for clean speech", () => {
    const a = analyzeResponse("We launched the product in March and doubled revenue.", 8);
    expect(a.fillerCount).toBe(0);
  });
  it("does not crash on an empty transcript", () => {
    const a = analyzeResponse("   ", 10);
    expect(a.wordCount).toBe(0);
    expect(a.wordsPerMinute).toBe(0);
  });
});
