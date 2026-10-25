/**
 * Stackra file contract:
 * Purpose: type tests of `TransportResponse`: a status, headers and a text body.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { TransportResponse } from "#contracts/types/transport-response.type";

describe("TransportResponse", () => {
  it("takes a status and refuses a body that is not text", () => {
    const response: TransportResponse = { status: 202, headers: {}, body: "" };
    // @ts-expect-error -- bodies are text
    const json: TransportResponse = { status: 200, headers: {}, body: {} };
    expect([response.status, json.status]).toEqual([202, 200]);
  });
});
