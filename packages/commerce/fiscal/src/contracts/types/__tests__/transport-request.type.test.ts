/**
 * Stackra file contract:
 * Purpose: type tests of `TransportRequest`: a POST with a unit credential, and only GET or POST.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { TransportRequest } from "#contracts/types/transport-request.type";

describe("TransportRequest", () => {
  it("takes an authenticated POST and refuses another method", () => {
    const request: TransportRequest = {
      method: "POST",
      url: "https://x.test",
      credential: "till_1",
      headers: {},
      body: "{}",
    };
    // @ts-expect-error -- only GET or POST
    const put: TransportRequest = { ...request, method: "PUT" };
    expect([request.credential, put.method]).toEqual(["till_1", "PUT"]);
  });
});
