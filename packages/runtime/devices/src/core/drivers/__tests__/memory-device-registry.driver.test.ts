/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDeviceRegistryDriver`: a code opened for an install pairs it under its own id when a
 *          person enters it (case and dashes ignored), once; an expired or unknown code refuses; the pairing state
 *          follows; devices list by filter, are stamped when seen and retire once; a retired device can pair again,
 *          an active one cannot.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0361 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { DeviceStatus } from "#contracts/enums/device-status.enum";
import { PairingState } from "#contracts/enums/pairing-state.enum";
import { MemoryDeviceRegistryDriver } from "#core/drivers/memory-device-registry.driver";
import { PairingCodeInvalidError } from "#core/errors/pairing-code-invalid.error";

const at = new Date("2026-10-25T10:00:00Z");
const expiresAt = new Date("2026-10-25T10:10:00Z");
const later = new Date("2026-10-25T10:05:00Z");
const tooLate = new Date("2026-10-25T10:10:00Z");
const till = { name: "Till 2", kind: "till", nodeId: "node_store_1" };

describe("MemoryDeviceRegistryDriver", () => {
  it("pairs an install under its own id, once", async () => {
    const registry = new MemoryDeviceRegistryDriver();
    const pairing = await registry.openPairing({ deviceId: "dev_install_1", at, expiresAt });
    expect(await registry.pairingStatus(pairing.pairingId, later)).toEqual({
      state: PairingState.Pending,
      deviceId: null,
    });
    const typed = `${pairing.code.slice(0, 4).toLowerCase()}-${pairing.code.slice(4)}`;
    const device = await registry.claim(typed, till, later);
    expect(device).toMatchObject({ id: "dev_install_1", ...till, status: DeviceStatus.Active });
    expect(await registry.pairingStatus(pairing.pairingId, tooLate)).toEqual({
      state: PairingState.Paired,
      deviceId: "dev_install_1",
    });
    await expect(registry.claim(pairing.code, till, later)).rejects.toBeInstanceOf(
      PairingCodeInvalidError,
    );
  });

  it("refuses an expired or unknown code and reports expiry", async () => {
    const registry = new MemoryDeviceRegistryDriver();
    const pairing = await registry.openPairing({ deviceId: "dev_1", at, expiresAt });
    await expect(registry.claim(pairing.code, till, tooLate)).rejects.toBeInstanceOf(
      PairingCodeInvalidError,
    );
    await expect(registry.claim("ZZZZZZZZ", till, later)).rejects.toBeInstanceOf(
      PairingCodeInvalidError,
    );
    expect((await registry.pairingStatus(pairing.pairingId, tooLate)).state).toBe(
      PairingState.Expired,
    );
    expect((await registry.pairingStatus("unknown", at)).state).toBe(PairingState.Expired);
  });

  it("lists, stamps and retires devices", async () => {
    const registry = new MemoryDeviceRegistryDriver();
    for (const [deviceId, kind] of [
      ["dev_1", "till"],
      ["dev_2", "kiosk"],
    ] as const) {
      const { code } = await registry.openPairing({ deviceId, at, expiresAt });
      await registry.claim(code, { ...till, kind }, later);
    }
    expect(
      (await registry.list({ status: null, kind: "kiosk", nodeId: null })).map(({ id }) => id),
    ).toEqual(["dev_2"]);
    await registry.recordSeen("dev_1", tooLate);
    expect((await registry.find("dev_1"))?.lastSeenAt).toEqual(tooLate);
    expect(await registry.retire("dev_1", tooLate)).toBe(true);
    expect(await registry.retire("dev_1", new Date())).toBe(true);
    expect(await registry.find("dev_1")).toMatchObject({
      status: DeviceStatus.Retired,
      retiredAt: tooLate,
    });
    await registry.recordSeen("dev_1", new Date("2026-11-01"));
    expect((await registry.find("dev_1"))?.lastSeenAt).toEqual(tooLate);
    expect(await registry.retire("dev_unknown", tooLate)).toBe(false);
    expect(
      (await registry.list({ status: DeviceStatus.Active, kind: null, nodeId: null })).length,
    ).toBe(1);
  });

  it("pairs a retired device again and refuses an active one", async () => {
    const registry = new MemoryDeviceRegistryDriver();
    const first = await registry.openPairing({ deviceId: "dev_1", at, expiresAt });
    await registry.claim(first.code, till, later);
    await expect(registry.openPairing({ deviceId: "dev_1", at, expiresAt })).rejects.toBeInstanceOf(
      PairingCodeInvalidError,
    );
    await registry.retire("dev_1", later);
    const again = await registry.openPairing({ deviceId: "dev_1", at: later, expiresAt });
    await registry.claim(again.code, { ...till, name: "Till 3" }, later);
    expect(registry.devices).toHaveLength(1);
    expect(await registry.find("dev_1")).toMatchObject({ name: "Till 3", status: "active" });
  });
});
