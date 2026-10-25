/**
 * Stackra file contract:
 * Purpose: unit tests of `NoProviderError` and `UnbalancedJournalError`: their kinds, codes and details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0356.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { NoProviderError } from "#core/errors/no-provider.error";
import { UnbalancedJournalError } from "#core/errors/unbalanced-journal.error";

describe("integration refusals", () => {
  it("NoProviderError is a failed precondition naming the capability and Market", () => {
    const error = NoProviderError.create({ capability: "sms", market: "sa" });
    expect(error.code).toBe("no_provider");
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(412);
    expect(error.details).toEqual({ capability: "sms", market: "sa" });
  });

  it("UnbalancedJournalError is a validation refusal naming the reference", () => {
    const error = UnbalancedJournalError.create({ reference: "inv_1" });
    expect(error.code).toBe("unbalanced_journal");
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(400);
  });
});
