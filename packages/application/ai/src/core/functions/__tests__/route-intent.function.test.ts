/**
 * Stackra file contract:
 * Purpose: unit tests of `routeIntent`: a phrase match ignores case and white space and needs no model, the model picks
 *          among the keys when no phrase matches, its "none" answer and a missing model give no intent.
 * Boundary: test only; the model is AI SDK's mock, so no network and no key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0245 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";
import { MockLanguageModelV4 } from "ai/test";

import { routeIntent } from "#core/functions/route-intent.function";

const intents = [
  { key: "orders.order.cancel@1", phrases: ["cancel order", "إلغاء الطلب"] },
  { key: "orders.order.list@1", phrases: ["my orders"] },
];

/** A mock model whose every answer is `result`. */
const answering = (result: string) =>
  new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: "text", text: JSON.stringify({ result }) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    },
  });

describe("routeIntent", () => {
  it("matches a phrase whatever its case and spacing", async () => {
    expect(await routeIntent("  Cancel   ORDER ", intents)).toBe("orders.order.cancel@1");
    expect(await routeIntent("إلغاء الطلب", intents)).toBe("orders.order.cancel@1");
  });

  it("asks the model when no phrase matches", async () => {
    const model = answering("orders.order.list@1");
    expect(await routeIntent("where are my things", intents, { model })).toBe(
      "orders.order.list@1",
    );
    expect(JSON.stringify(model.doGenerateCalls[0]?.responseFormat)).toContain(
      "no matching intent",
    );
  });

  it("gives no intent for the model's none and without a model", async () => {
    expect(
      await routeIntent("hello", intents, { model: answering("no matching intent") }),
    ).toBeUndefined();
    expect(await routeIntent("hello", intents)).toBeUndefined();
    expect(await routeIntent("hello", [], { model: answering("x") })).toBeUndefined();
  });
});
