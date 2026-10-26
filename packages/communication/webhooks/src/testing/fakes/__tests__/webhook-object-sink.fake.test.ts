/**
 * Stackra file contract:
 * Purpose: unit tests of `WebhookObjectSinkFake`: it stands in for the port, keeps objects by bucket and key without
 *          the signal, replaces a rewritten key, and rejects while told to fail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ADR 0422 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { WebhookObjectSink } from "#contracts/index";
import { WebhookObjectSinkFake } from "#testing/fakes/webhook-object-sink.fake";

const OBJECT = { bucket: "b", key: "k.json", body: "{}", metadata: { "webhook-id": "evt_1" } };

describe(WebhookObjectSinkFake, () => {
  it("keeps objects by bucket and key, a rewrite replacing the first", async () => {
    const sink = new WebhookObjectSinkFake();
    expect(sink).toBeInstanceOf(WebhookObjectSink);
    await sink.put({ ...OBJECT, signal: new AbortController().signal });
    await sink.put({ ...OBJECT, body: '{"again":true}' });
    expect(sink.all()).toEqual([{ ...OBJECT, body: '{"again":true}' }]);
    expect(sink.object("b", "k.json")?.metadata).toEqual({ "webhook-id": "evt_1" });
    expect(sink.object("b", "other")).toBeUndefined();
  });

  it("rejects while told to fail", async () => {
    const sink = new WebhookObjectSinkFake().failWith(new Error("AccessDenied"));
    await expect(sink.put(OBJECT)).rejects.toThrow("AccessDenied");
    sink.failWith(undefined);
    await expect(sink.put(OBJECT)).resolves.toBeUndefined();
  });
});
