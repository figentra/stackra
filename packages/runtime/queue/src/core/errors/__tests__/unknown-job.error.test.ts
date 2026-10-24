/**
 * Stackra file contract:
 * Purpose: unit tests of `UnknownJobError`: an `Internal` refusal that is not retryable, with code `unknown_job` and the
 *          stored key as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0148 (decision 1).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UnknownJobError } from "#core/errors/unknown-job.error";

describe("UnknownJobError", () => {
  it("is an Internal refusal that is not retried, with code unknown_job and the key", () => {
    const refused = UnknownJobError.create({ key: "messages.message.deliver@1" });
    expect(isRefusal(refused, UnknownJobError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Internal);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("unknown_job");
    expect(refused.details).toEqual({ key: "messages.message.deliver@1" });
  });
});
