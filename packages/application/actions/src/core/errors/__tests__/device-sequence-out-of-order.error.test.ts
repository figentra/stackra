/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceSequenceOutOfOrderError`: code `device_sequence_out_of_order`, the conflict kind,
 *          not retryable, and the device's last acknowledged sequence in its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0338 (decision 1); ADR 0140.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DeviceSequenceOutOfOrderError } from "#core/errors/device-sequence-out-of-order.error";

describe("DeviceSequenceOutOfOrderError", () => {
  it("is a conflict naming the last acknowledged sequence", () => {
    const refusal = DeviceSequenceOutOfOrderError.create({ acknowledged: 42 });
    expect(refusal.code).toBe("device_sequence_out_of_order");
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.acknowledged).toBe(42);
    expect(refusal.toEnvelope()).toEqual({
      code: "device_sequence_out_of_order",
      category: "conflict",
      retryable: false,
      details: { acknowledged: 42 },
    });
  });
});
