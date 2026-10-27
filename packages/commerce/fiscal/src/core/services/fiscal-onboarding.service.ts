/**
 * Stackra file contract:
 * Purpose: `FiscalOnboardingService`, the one place a till mandate's driver key picks its `FiscalOnboarding`: device
 *          pairing asks whether a mandate needs registration, which inputs to ask for, and gets the onboarding to run.
 * Boundary: a `Service` over the onboardings the host registers (ZATCA, ETA, the device mandates, its own): its
 *           subclass's `onboardings`, or `FiscalOnboardingService.with`; the constructor takes no data (ADR 0294
 *           rule 17). Which
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
 * const onboardings = FiscalOnboardingService.with([
 *   new ZatcaOnboardingDriver(transport, credentials),
 *   new EtaOnboardingDriver(transport, credentials),
 *   DeviceOnboardingDriver.for("tse", device, credentials),
 * ]);
 * const step = await onboardings.for(mandate.driver).register(unitId, answers, mandate.options);
 */
export abstract class FiscalOnboardingService extends Service {
  /** Every onboarding the host offers, declared by its subclass; a later one with the same key replaces an earlier one. */
  protected abstract readonly onboardings: readonly FiscalOnboarding[];

  /** Registered onboardings by key, built on first use. */
  private byKey: ReadonlyMap<string, FiscalOnboarding> | undefined;

  /**
   * A service over `onboardings`, for a host that builds it by hand.
   * @param onboardings - every onboarding the host offers; a later one with the same key replaces an earlier one.
   */
  static with(onboardings: readonly FiscalOnboarding[]): FiscalOnboardingService {
    return new (class extends FiscalOnboardingService {
      protected override readonly onboardings = onboardings;
    })();
  }

  /** Registered onboardings by key. */
  private get registered(): ReadonlyMap<string, FiscalOnboarding> {
    this.byKey ??= new Map(this.onboardings.map((onboarding) => [onboarding.key, onboarding]));
    return this.byKey;
  }

  /** Whether a mandate with this driver key can be registered here. */
  supports(driver: string): boolean {
    return this.registered.has(driver);
  }

  /**
   * The onboarding for a driver key.
   *
   * @throws FiscalOnboardingUnsupportedError when none is registered for it.
   */
  for(driver: string): FiscalOnboarding {
    const onboarding = this.registered.get(driver);
    if (!onboarding) throw FiscalOnboardingUnsupportedError.create({ driver });
    return onboarding;
  }
}
