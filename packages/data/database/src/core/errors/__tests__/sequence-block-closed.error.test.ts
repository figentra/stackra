/**
 * Stackra file contract:
 * Purpose: unit tests of `SequenceBlockClosedError`: a `conflict` refusal with the code `sequence_block_closed` that
 *          carries the block's id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decision 4); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SequenceBlockClosedError } from "#core/errors/sequence-block-closed.error";

describe("SequenceBlockClosedError", () => {
  it("is a conflict refusal naming the block", () => {
    const error = SequenceBlockClosedError.create({ block: "sqb_01ja0000000000000000000001" });
    expect(isRefusal(error, SequenceBlockClosedError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Conflict);
    expect(error.toEnvelope()).toMatchObject({
      code: "sequence_block_closed",
      details: { block: "sqb_01ja0000000000000000000001" },
    });
  });
});
