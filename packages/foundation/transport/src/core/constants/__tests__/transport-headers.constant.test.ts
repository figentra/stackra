/**
 * Stackra file contract:
 * Purpose: unit tests of `TRANSPORT_HEADERS`: the four header names as the HTTP contract spells them, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0118; ADR 0138.
 */
import { describe, expect, it } from "@stackra/testing";

import { TRANSPORT_HEADERS } from "#core/constants/transport-headers.constant";

describe("TRANSPORT_HEADERS", () => {
  it("spells the header names of the API contract", () => {
    expect(TRANSPORT_HEADERS).toEqual({
      authorization: "Authorization",
      idempotencyKey: "Idempotency-Key",
      stackraVersion: "Stackra-Version",
      retryAfter: "Retry-After",
    });
  });

  it("is frozen", () => {
    expect(Object.isFrozen(TRANSPORT_HEADERS)).toBe(true);
  });
});
