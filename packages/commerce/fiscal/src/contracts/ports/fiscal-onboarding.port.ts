/**
 * Stackra file contract:
 * Purpose: `FiscalOnboarding`, the port a mandate's unit registration implements: the inputs it needs, a `register`
 *          step that gets and stores the unit's first credential, and a `complete` step that makes it the production
 *          credential.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalOnboarding`. Many are registered at once and
 *           the till mandate's `driver` value picks one, matched on `key` (`FiscalOnboardingService`). Issued values
 *           go straight to `TillCredentials`; a step returns only `OnboardingStep`. Endpoints and versions are the
 *           mandate's pack options. Device pairing calls it (`@stackra/devices`, OS-118). A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 4 and 5).
 */
import { Port } from "@stackra/contracts";

import type { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import type { OnboardingStep } from "#contracts/types/onboarding-step.type";

/**
 * Registers one unit with its mandate's authority in two steps.
 *
 * @example
 * export class MyOnboarding extends Driver(FiscalOnboarding) {
 *   readonly key = "my-mandate";
 *   readonly inputs = [OnboardingInput.Otp];
 *   async register(unitId, answers, options) { … }
 *   async complete(unitId, options) { … }
 * }
 */
export abstract class FiscalOnboarding extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalOnboarding";

  /** The driver key a till mandate names. */
  abstract readonly key: string;

  /** What `register` reads from its answers, in the order a screen asks for them. */
  abstract readonly inputs: readonly OnboardingInput[];

  /**
   * Gets the unit's first credential and stores it at stage `compliance`.
   * Throws `FiscalOnboardingRefusedError` when the authority refuses, storing nothing.
   */
  abstract register(
    unitId: string,
    answers: Readonly<Partial<Record<OnboardingInput, string>>>,
    options: unknown,
  ): Promise<OnboardingStep>;

  /** Turns the stored `compliance` credential into the `production` one the unit issues with. */
  abstract complete(unitId: string, options: unknown): Promise<OnboardingStep>;
}
