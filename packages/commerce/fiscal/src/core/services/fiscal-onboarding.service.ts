/**
 * Stackra file contract:
 * Purpose: `FiscalOnboardingService`, the one place a till mandate's driver key picks its `FiscalOnboarding`: device
 *          pairing asks whether a mandate needs registration, which inputs to ask for, and gets the onboarding to run.
 * Boundary: a `Service` over the onboardings the host registers (ZATCA, ETA, the device mandates, its own). Which
 *           key a market uses is pack data; this never branches on a market.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 4 and 5).
 */
import { Service } from "@stackra/container";

import type { FiscalOnboarding } from "#contracts/ports/fiscal-onboarding.port";
import { FiscalOnboardingUnsupportedError } from "#core/errors/fiscal-onboarding-unsupported.error";

/**
 * Picks an onboarding by driver key.
 *
 * @example
 * const onboardings = new FiscalOnboardingService([
 *   new ZatcaOnboarding(transport, credentials),
 *   new EtaOnboardingDriver(transport, credentials),
 *   new DeviceOnboardingDriver("tse", device, credentials),
 * ]);
 * const step = await onboardings.for(mandate.driver).register(unitId, answers, mandate.options);
 */
export class FiscalOnboardingService extends Service {
  /** Registered onboardings by key. */
  private readonly onboardings: ReadonlyMap<string, FiscalOnboarding>;

  /**
   * @param onboardings - every onboarding the host offers; a later one with the same key replaces an earlier one.
   */
  constructor(onboardings: readonly FiscalOnboarding[]) {
    super();
    this.onboardings = new Map(onboardings.map((onboarding) => [onboarding.key, onboarding]));
  }

  /** Whether a mandate with this driver key can be registered here. */
  supports(driver: string): boolean {
    return this.onboardings.has(driver);
  }

  /**
   * The onboarding for a driver key.
   *
   * @throws FiscalOnboardingUnsupportedError when none is registered for it.
   */
  for(driver: string): FiscalOnboarding {
    const onboarding = this.onboardings.get(driver);
    if (!onboarding) throw FiscalOnboardingUnsupportedError.create({ driver });
    return onboarding;
  }
}
