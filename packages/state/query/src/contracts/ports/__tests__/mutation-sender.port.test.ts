/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `MutationSender` port: a port a client implements, which receives the action key,
 *          the input and the queue's Idempotency-Key and reports a `ReplayOutcome`.
 * Boundary: test only; the sender is a small class of the port that records its calls.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0059 (decision 2); ADR 0138.
 */
import { Port } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MutationSender } from "#contracts/ports/mutation-sender.port";
import type { ReplayOutcome } from "#contracts/types/replay-outcome.type";

describe("MutationSender", () => {
  it("is a port that sends one call with its key", async () => {
    const sent: [string, Json, string][] = [];
    class RecordingSender extends MutationSender {
      send(action: string, input: Json, idempotencyKey: string): Promise<ReplayOutcome> {
        sent.push([action, input, idempotencyKey]);
        return Promise.resolve({ ok: true, code: null, server: null });
      }
    }
    const sender = new RecordingSender();
    await expect(sender.send("orders.order.create@1", { total: 3 }, "key_1")).resolves.toEqual({
      ok: true,
      code: null,
      server: null,
    });
    expect(sent).toEqual([["orders.order.create@1", { total: 3 }, "key_1"]]);
    expect(sender).toBeInstanceOf(Port);
  });

  it("reports a conflict with its code and the server's record", () => {
    expectTypeOf<ReplayOutcome["code"]>().toEqualTypeOf<string | null>();
    expectTypeOf<ReplayOutcome["server"]>().toEqualTypeOf<Json | null>();
  });
});
