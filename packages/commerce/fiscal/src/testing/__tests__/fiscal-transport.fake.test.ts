/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalTransportFake`: answers its queue in order, records requests, and throws when the queue
 *          is empty.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";

const request = {
  method: "POST",
  url: "https://x.test",
  credential: null,
  headers: {},
  body: null,
} as const;

describe("FiscalTransportFake", () => {
  it("answers in order, records, and throws when empty", async () => {
    const transport = FiscalTransportFake.answering({ status: 200, headers: {}, body: "a" });
    expect(transport).toBeInstanceOf(FiscalTransport);
    expect((await transport.send(request)).body).toBe("a");
    await expect(transport.send(request)).rejects.toThrow(/no response queued/);
    expect(transport.calls("send")).toEqual([request, request]);
  });
});
