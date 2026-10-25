/**
 * Stackra file contract:
 * Purpose: unit tests of `SequenceNumberOutOfOrderError`: a `conflict` refusal with the code
 *          `sequence_number_out_of_order` that carries the block, the expected number and the received one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decisions 3 and 4); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SequenceNumberOutOfOrderError } from "#core/errors/sequence-number-out-of-order.error";

describe("SequenceNumberOutOfOrderError", () => {
  it("is a conflict refusal naming the block and both numbers", () => {
    const error = SequenceNumberOutOfOrderError.create({
      block: "sqb_01ja0000000000000000000001",
      expected: 12,
      received: 9,
    });
    expect(isRefusal(error, SequenceNumberOutOfOrderError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Conflict);
    expect(error.toEnvelope()).toMatchObject({
      code: "sequence_number_out_of_order",
      details: { block: "sqb_01ja0000000000000000000001", expected: 12, received: 9 },
    });
  });
});
