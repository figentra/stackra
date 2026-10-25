/**
 * Stackra file contract:
 * Purpose: type tests of `SubmissionOutcome`: an answer with a status code and nullable facts.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";

describe("SubmissionOutcome", () => {
  it("takes a rejection with a message and refuses a missing payload field", () => {
    const outcome: SubmissionOutcome = {
      status: FiscalRecordStatus.Rejected,
      authorityReference: null,
      message: "bad",
      payload: null,
    };
    // @ts-expect-error -- `payload` is stated, `null` to keep the sealed one
    const partial: SubmissionOutcome = {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
    };
    expect([outcome.message, partial.status]).toEqual(["bad", "accepted"]);
  });
});
