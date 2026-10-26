import { describe, expect, it } from "vitest";
import { finalOverall, isUsable } from "./analyze.server";

const real = {
  clarity: { score: 64, detail: "Some detail here." },
  pronunciation: { score: 72, detail: "Some detail here." },
  vocabulary: { score: 58, detail: "Some detail here." },
  delivery: { score: 61, detail: "Some detail here." },
  relevance: { score: 70, detail: "Some detail here." },
  strengths: [{ title: "Clear opening", example: "“My name is D” works because it is direct." }],
  improvements: [{ title: "Long sentence", example: "“be it in your job”", fix: "Split it. Try saying: “Skills matter.”" }],
  exercises: [{ title: "Rewrite the middle", minutes: 4, how: "Write it in two sentences, then say it aloud twice." }],
  summary: "A decent start with a clear opening and one long sentence to fix.",
};

describe("isUsable (rejects empty reports the AI sometimes returns)", () => {
  it("accepts a real report", () => {
    expect(isUsable(real)).toBe(true);
  });
  it("rejects the empty answer format echoed back", () => {
    const echoed = {
      clarity: { score: 0, detail: "" },
      pronunciation: { score: 0, detail: "" },
      vocabulary: { score: 0, detail: "" },
      delivery: { score: 0, detail: "" },
      relevance: { score: 0, detail: "" },
      strengths: [{ title: "", example: "" }],
      improvements: [{ title: "", example: "", fix: "" }],
      exercises: [{ title: "", minutes: 0, how: "" }],
      summary: "You have a solid foundation.",
    };
    expect(isUsable(echoed)).toBe(false);
  });
  it("rejects a report with all-zero scores", () => {
    const zeros = { ...real, clarity: { score: 0, detail: "x" }, pronunciation: { score: 0, detail: "x" }, vocabulary: { score: 0, detail: "x" }, delivery: { score: 0, detail: "x" }, relevance: { score: 0, detail: "x" } };
    expect(isUsable(zeros)).toBe(false);
  });
  it("rejects a report with no strengths", () => {
    expect(isUsable({ ...real, strengths: [] })).toBe(false);
  });
});

describe("finalOverall (an answer cannot score higher than it deserves)", () => {
  it("caps an off-topic answer even when everything else is strong", () => {
    expect(finalOverall(88, 10, 120)).toBeLessThanOrEqual(35);
  });
  it("caps a partly relevant answer", () => {
    expect(finalOverall(90, 40, 120)).toBeLessThanOrEqual(50);
    expect(finalOverall(90, 55, 120)).toBeLessThanOrEqual(70);
  });
  it("caps very short answers", () => {
    expect(finalOverall(95, 95, 8)).toBeLessThanOrEqual(45);
    expect(finalOverall(95, 95, 30)).toBeLessThanOrEqual(65);
  });
  it("does not cap a full, on-topic answer", () => {
    expect(finalOverall(82, 85, 120)).toBe(82);
  });
});
