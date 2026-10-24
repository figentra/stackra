/**
 * Stackra file contract:
 * Purpose: unit tests of `TransportError`: an unavailable, retryable refusal with code `transport` and its reason and
 *          status as details, built the way the template's tests build it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (kinds).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import { TransportError } from "#core/errors/transport.error";

describe("TransportError", () => {
  it("is an unavailable, retryable refusal coded transport", () => {
    const error = TransportError.create({ reason: "network" });
    expect(isRefusal(error, TransportError)).toBe(true);
    expect(error.code).toBe("transport");
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.retryable).toBe(true);
  });

  it("carries the reason and the status as details", () => {
    const error = TransportError.create({ reason: TransportFailure.Response, status: 502 });
    expect(error.details).toEqual({ reason: "response", status: 502 });
    expect(error.toEnvelope()).toMatchObject({ code: "transport", category: "unavailable" });
  });
});
