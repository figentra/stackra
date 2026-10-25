/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionAmbiguousError`: a `conflict` refusal (HTTP 409), never retryable, naming the
 *          integration and the level that holds several connections.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 10); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionAmbiguousError } from "#core/errors/connection-ambiguous.error";

describe("ConnectionAmbiguousError", () => {
  it("names the integration and the level", () => {
    const error = ConnectionAmbiguousError.create({
      integration: "messages.resend",
      level: "scope",
    });
    expect(isRefusal(error, ConnectionAmbiguousError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(409);
    expect(error.code).toBe("connection_ambiguous");
    expect(error.details).toEqual({ integration: "messages.resend", level: "scope" });
  });
});
