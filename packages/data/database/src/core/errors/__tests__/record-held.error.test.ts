/**
 * Stackra file contract:
 * Purpose: unit tests of `RecordHeldError`: a `failed_precondition` refusal with the code `record_held` that names the
 *          model and the record.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RecordHeldError } from "#core/errors/record-held.error";

describe("RecordHeldError", () => {
  it("is a failed-precondition refusal naming the record", () => {
    const error = RecordHeldError.create({ model: "Matter", id: "mat_1" });
    expect(isRefusal(error, RecordHeldError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.toEnvelope()).toMatchObject({
      code: "record_held",
      details: { model: "Matter", id: "mat_1" },
    });
  });
});
