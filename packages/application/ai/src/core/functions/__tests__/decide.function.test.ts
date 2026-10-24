/**
 * Stackra file contract:
 * Purpose: unit and type tests of `decide`: a choice, a score and a yes-or-no answer come back typed from a mocked AI
 *          SDK model, the model is asked for the matching JSON schema with the prompt and instructions, an answer
 *          outside the choices or the range rejects, and bad arguments or a model id string are refused before any call.
 * Boundary: test only; the model is AI SDK's own `MockLanguageModelV4`, so no network and no key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); owner decision R-67; ADR 0155.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { MockLanguageModelV4 } from "ai/test";

import { decide } from "#core/functions/decide.function";
import type { DecideOptions } from "#core/types/decide-options.type";

/** A mock model whose every answer is `text`. */
function answering(text: string): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 5, text: 5, reasoning: undefined },
      },
      warnings: [],
    },
  });
}

describe("decide", () => {
  it("returns one of the choices, typed as their union", async () => {
    const model = answering(JSON.stringify({ result: "orders" }));
    const route = await decide({
      model,
      instructions: "You route support messages.",
      prompt: "Where is my parcel?",
      choices: ["billing", "orders", "other"],
    });
    expect(route).toBe("orders");
    expectTypeOf(route).toEqualTypeOf<"billing" | "orders" | "other">();
    const [call] = model.doGenerateCalls;
    expect(call?.responseFormat).toMatchObject({
      type: "json",
      schema: { properties: { result: { enum: ["billing", "orders", "other"] } } },
    });
    expect(JSON.stringify(call?.prompt)).toContain("Where is my parcel?");
    expect(JSON.stringify(call?.prompt)).toContain("You route support messages.");
  });

  it("returns a score inside the range", async () => {
    const model = answering(JSON.stringify({ score: 4 }));
    const urgency = await decide({ model, prompt: "How urgent?", score: { min: 1, max: 5 } });
    expect(urgency).toBe(4);
    expectTypeOf(urgency).toEqualTypeOf<number>();
    expect(model.doGenerateCalls[0]?.responseFormat).toMatchObject({
      type: "json",
      schema: { properties: { score: { minimum: 1, maximum: 5 } } },
    });
  });

  it("answers yes or no as a boolean", async () => {
    const yes = await decide({
      model: answering(JSON.stringify({ result: "yes" })),
      prompt: "Is this a complaint?",
      yesNo: true,
    });
    const no = await decide({
      model: answering(JSON.stringify({ result: "no" })),
      prompt: "Is this a complaint?",
      yesNo: true,
    });
    expect([yes, no]).toEqual([true, false]);
    expectTypeOf(yes).toEqualTypeOf<boolean>();
  });

  it("rejects an answer outside the choices or the range", async () => {
    await expect(
      decide({
        model: answering(JSON.stringify({ result: "refund" })),
        prompt: "Route it",
        choices: ["billing", "orders"],
      }),
    ).rejects.toThrow();
    await expect(
      decide({
        model: answering(JSON.stringify({ score: 9 })),
        prompt: "How urgent?",
        score: { min: 1, max: 5 },
      }),
    ).rejects.toThrow();
  });

  it("refuses bad arguments before calling the model", async () => {
    const model = answering(JSON.stringify({ result: "a" }));
    await expect(decide({ model, prompt: "?", choices: ["a"] })).rejects.toThrow(RangeError);
    await expect(decide({ model, prompt: "?", choices: ["a", "a"] })).rejects.toThrow(RangeError);
    await expect(decide({ model, prompt: "?", choices: ["a", ""] })).rejects.toThrow(RangeError);
    await expect(decide({ model, prompt: "?", score: { min: 5, max: 1 } })).rejects.toThrow(
      RangeError,
    );
    await expect(
      decide({ model, prompt: "?", score: { min: 0, max: Number.POSITIVE_INFINITY } }),
    ).rejects.toThrow(RangeError);
    expect(model.doGenerateCalls).toHaveLength(0);
  });

  it("refuses a model id string, which would reach the hosted gateway", async () => {
    // @ts-expect-error -- a model id string is not a provider model instance
    const options: DecideOptions = { model: "openai/gpt-5", prompt: "?" };
    await expect(decide({ ...options, yesNo: true })).rejects.toThrow(TypeError);
  });
});
