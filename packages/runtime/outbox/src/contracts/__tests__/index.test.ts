/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the three ports and the two enums are its only values,
 *          and the stored message, envelope, row change and change consumer types travel with them.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/outbox/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "EventPublisher",
      "InboxDriver",
      "MessageKind",
      "OutboxDriver",
      "RowChangeKind",
    ]);
  });

  it("types a stored message's failure and a consumer's input", () => {
    expectTypeOf<contracts.OutboxMessage["lastError"]>().toEqualTypeOf<
      contracts.OutboxError | undefined
    >();
    expectTypeOf<
      Parameters<contracts.ChangeConsumer["consume"]>[0]
    >().toEqualTypeOf<contracts.RowChange>();
    expectTypeOf<contracts.EventEnvelope["occurredAt"]>().toEqualTypeOf<string>();
  });
});
