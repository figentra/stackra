/**
 * Stackra file contract:
 * Purpose: unit tests of `InvalidCronError`: a Validation refusal that is not retried, with code `invalid_cron`, the
 *          expression and the failed field.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InvalidCronError } from "#core/errors/invalid-cron.error";

describe("InvalidCronError", () => {
  it("is a Validation refusal that is not retried, with code invalid_cron and its details", () => {
    const refused = InvalidCronError.create({ expression: "61 * * * *", field: "minute" });
    expect(isRefusal(refused, InvalidCronError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("invalid_cron");
    expect(refused.details).toEqual({ expression: "61 * * * *", field: "minute" });
  });
});
