/**
 * Stackra file contract:
 * Purpose: unit tests of `SequenceNotReservableError`: a `failed_precondition` refusal with the code
 *          `sequence_not_reservable` that carries the sequence's locked key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decision 4); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SequenceNotReservableError } from "#core/errors/sequence-not-reservable.error";

describe("SequenceNotReservableError", () => {
  it("is a failed-precondition refusal naming the sequence", () => {
    const error = SequenceNotReservableError.create({ sequence: "billing.invoice" });
    expect(isRefusal(error, SequenceNotReservableError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.toEnvelope()).toMatchObject({
      code: "sequence_not_reservable",
      details: { sequence: "billing.invoice" },
    });
  });
});
