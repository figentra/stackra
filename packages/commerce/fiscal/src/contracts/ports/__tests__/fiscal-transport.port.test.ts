/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalTransport`: an abstract port a host implements; `send` returns any status.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import type { TransportResponse } from "#contracts/types/transport-response.type";

/** A host binding that echoes the body. */
class Echo extends FiscalTransport {
  async send(request: TransportRequest): Promise<TransportResponse> {
    return { status: 418, headers: {}, body: request.body ?? "" };
  }
}

describe("FiscalTransport", () => {
  it("is a port that returns every status", async () => {
    const transport = new Echo();
    expect(transport).toBeInstanceOf(Port);
    const response = await transport.send({
      method: "POST",
      url: "https://x.test",
      credential: null,
      headers: {},
      body: "b",
    });
    expect(response).toEqual({ status: 418, headers: {}, body: "b" });
  });
});
