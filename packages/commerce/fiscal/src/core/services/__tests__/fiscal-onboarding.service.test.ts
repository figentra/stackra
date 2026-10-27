/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalOnboardingService`: picking by driver key, the later of two equal keys winning, and the
 *          refusal for a key nothing serves.
 * Boundary: test only; the transport, device and credential store are fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 4).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DeviceOnboardingDriver } from "#core/drivers/device-onboarding.driver";
import { EtaOnboardingDriver } from "#core/drivers/eta-onboarding.driver";
import { FiscalOnboardingUnsupportedError } from "#core/errors/fiscal-onboarding-unsupported.error";
import { FiscalOnboardingService } from "#core/services/fiscal-onboarding.service";
import { ZatcaOnboardingDriver } from "#core/drivers/zatca-onboarding.driver";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";

const transport = FiscalTransportFake.answering();
const credentials = new TillCredentialsFake();
const device = FiscalDeviceFake.with({});

describe("FiscalOnboardingService", () => {
  it("picks the onboarding a mandate's driver key names", () => {
    const zatca = new ZatcaOnboardingDriver(transport, credentials);
    const eta = new EtaOnboardingDriver(transport, credentials);
    const tse = DeviceOnboardingDriver.for("tse", device, credentials);
    const onboardings = FiscalOnboardingService.with([zatca, eta, tse]);
    expect([
      onboardings.for("zatca"),
      onboardings.for("eta-receipt"),
      onboardings.for("tse"),
    ]).toEqual([zatca, eta, tse]);
    expect([onboardings.supports("tse"), onboardings.supports("nf525")]).toEqual([true, false]);
  });

  it("lets a later onboarding with the same key replace an earlier one", () => {
    const own = DeviceOnboardingDriver.for("zatca", device, credentials);
    expect(
      FiscalOnboardingService.with([new ZatcaOnboardingDriver(transport, credentials), own]).for(
        "zatca",
      ),
    ).toBe(own);
  });

  it("refuses a driver key nothing serves", () => {
    let caught: unknown;
    try {
      FiscalOnboardingService.with([]).for("nf525");
    } catch (error) {
      caught = error;
    }
    expect(isRefusal(caught, FiscalOnboardingUnsupportedError) && caught.details.driver).toBe(
      "nf525",
    );
  });
});
