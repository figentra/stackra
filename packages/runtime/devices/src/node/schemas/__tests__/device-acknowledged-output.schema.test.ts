/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceAcknowledgedOutput`: a whole sequence from 1 or `null`; anything else is refused by its
 *          registered schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { DeviceAcknowledgedOutput } from "#node/schemas/device-acknowledged-output.schema";

describe("DeviceAcknowledgedOutput", () => {
  it("holds a sequence or null", () => {
    expect(DeviceAcknowledgedOutput.create({ sequence: 1_729_760_400_000 }).sequence).toBe(
      1_729_760_400_000,
    );
    expect(DeviceAcknowledgedOutput.create({ sequence: null }).sequence).toBeNull();
    expect(() => DeviceAcknowledgedOutput.create({ sequence: 0 })).toThrow();
  });
});
