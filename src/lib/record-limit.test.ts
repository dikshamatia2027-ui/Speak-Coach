import { describe, expect, it } from "vitest";
import { MAX_AUDIO_BYTES } from "./ai/transcribe.server";
import { encodeWav, MAX_RECORDING_SECONDS } from "./record-wav";

const VERCEL_BODY_LIMIT = 4_500_000;

describe("recording limit", () => {
  it("fits the longest recording within the upload limits", () => {
    const samples = new Float32Array(MAX_RECORDING_SECONDS * 16000);
    const size = encodeWav([samples], 16000).size;
    expect(size).toBeLessThan(MAX_AUDIO_BYTES);
    expect(MAX_AUDIO_BYTES + 64 * 1024).toBeLessThan(VERCEL_BODY_LIMIT);
  });
});
