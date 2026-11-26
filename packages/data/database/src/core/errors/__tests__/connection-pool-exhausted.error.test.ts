/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionPoolExhaustedError`: a retryable `unavailable` refusal with the code
 *          `connection_pool_exhausted` and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0140; ADR 0473 (the 2026-11-26 note); STA-1716; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionPoolExhaustedError } from "#core/errors/connection-pool-exhausted.error";

describe("ConnectionPoolExhaustedError", () => {
  it("is a retryable unavailable refusal with no details", () => {
    const error = ConnectionPoolExhaustedError.create();
    expect(isRefusal(error, ConnectionPoolExhaustedError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.retryable).toBe(true);
    expect(error.toEnvelope()).toMatchObject({ code: "connection_pool_exhausted" });
  });
});
