import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wordById } from "./vocab-words";

export const checkSentence = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ wordId: z.string().max(40), sentence: z.string().min(1).max(400) }).parse(d))
  .handler(async ({ data }) => {
    const { evaluateSentence, VocabAiError } = await import("./ai/vocab.server");
    const word = wordById(data.wordId);
    if (!word) return { ok: false as const, error: "Unknown word." };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "AI is not configured." };
    try {
      const feedback = await evaluateSentence({ word: word.word, pos: word.pos, definition: word.definition, sentence: data.sentence, apiKey });
      return { ok: true as const, feedback };
    } catch (e) {
      if (e instanceof VocabAiError) return { ok: false as const, error: e.message };
      console.error(e);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
  });
