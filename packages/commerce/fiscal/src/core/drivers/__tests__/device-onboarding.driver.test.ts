/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceOnboardingDriver`: the key it is built with, the register and activate commands, the
 *          serial and certificate stored per stage, and the refusals.
 * Boundary: test only; the device and credential store are fakes and the answers are samples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decisions 4 and 5).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DeviceOnboardingDriver } from "#core/drivers/device-onboarding.driver";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOnboardingRefusedError } from "#core/errors/fiscal-onboarding-refused.error";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";

const REGISTERED = { registered: true, serial: "TSE-1", certificate: "CERT" };

describe("DeviceOnboardingDriver", () => {
  it("registers then activates through the device and stores its serial", async () => {
    const device = FiscalDeviceFake.with({
      "tse.register": REGISTERED,
      "tse.activate": REGISTERED,
    });
    const credentials = new TillCredentialsFake();
    const onboarding = new DeviceOnboardingDriver("tse", device, credentials);
    expect([onboarding.key, onboarding.inputs]).toEqual(["tse", []]);
    expect(await onboarding.register("till_1")).toEqual({
      unitId: "till_1",
      stage: "compliance",
      requestId: null,
    });
    expect((await onboarding.complete("till_1")).stage).toBe("production");
    expect(device.calls("call")).toEqual([
      { unitId: "till_1", command: "tse.register", payload: { unitId: "till_1" } },
      { unitId: "till_1", command: "tse.activate", payload: { unitId: "till_1" } },
    ]);
    expect(await credentials.get("till_1")).toMatchObject({
      stage: "production",
      certificate: "CERT",
      certificateSerial: "TSE-1",
    });
  });

  it("refuses a registration the device declines and stores nothing", async () => {
    const credentials = new TillCredentialsFake();
    await expect(
      new DeviceOnboardingDriver(
        "rt",
        FiscalDeviceFake.with({ "rt.register": { registered: false, serial: "RT-1" } }),
        credentials,
      ).register("till_1"),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOnboardingRefusedError));
    expect(credentials.calls("save")).toEqual([]);
  });

  it("treats an answer of another shape as unavailable", async () => {
    await expect(
      new DeviceOnboardingDriver(
        "fdm",
        FiscalDeviceFake.with({ "fdm.register": { ok: true } }),
        new TillCredentialsFake(),
      ).register("till_1"),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalAuthorityUnavailableError));
  });

  it("refuses complete before register", async () => {
    await expect(
      new DeviceOnboardingDriver(
        "tse",
        FiscalDeviceFake.with({}),
        new TillCredentialsFake(),
      ).complete("till_1"),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalCredentialMissingError));
  });
});
