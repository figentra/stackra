/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `AcknowledgementReader` port: a keyed port whose driver answers a device's last
 *          acknowledged sequence, or `null` when the server has none.
 * Boundary: test only; the reader is a small class of the port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 4).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AcknowledgementReader } from "#contracts/ports/acknowledgement-reader.port";

describe("AcknowledgementReader", () => {
  it("is a keyed port whose driver answers the last acknowledged sequence", async () => {
    class FixedReader extends AcknowledgementReader {
      lastAcknowledged(deviceId: string): Promise<number | null> {
        return Promise.resolve(deviceId === "device-1" ? 41 : null);
      }
    }
    const reader = new FixedReader();
    expect(reader).toBeInstanceOf(Port);
    expect(await reader.lastAcknowledged("device-1")).toBe(41);
    expect(await reader.lastAcknowledged("device-2")).toBeNull();
    expectTypeOf<AcknowledgementReader["~key"]>().toEqualTypeOf<"query.AcknowledgementReader">();
  });
});
