/**
 * Stackra file contract:
 * Purpose: type tests of the `DevicePairing` port: keyed `devices.DevicePairing`, `check` answering a status that
 *          carries no credential.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0361 (decision 7); ADR 0294 (decision 16).
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { DevicePairing } from "#contracts/ports/device-pairing.port";
import type { PairingStatus } from "#contracts/types/pairing-status.type";

describe("DevicePairing", () => {
  it("is keyed devices.DevicePairing and never answers the token", () => {
    expectTypeOf<DevicePairing["~key"]>().toEqualTypeOf<"devices.DevicePairing">();
    expectTypeOf<DevicePairing["check"]>().returns.toEqualTypeOf<Promise<PairingStatus>>();
    expectTypeOf<PairingStatus>().not.toHaveProperty("token");
  });
});
