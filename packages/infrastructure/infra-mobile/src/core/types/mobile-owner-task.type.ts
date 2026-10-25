/**
 * Stackra file contract:
 * Purpose: `MobileOwnerTask`, one manual step of a mobile release plan: the step, the app it is for, and the Pulumi
 *          stack config key the owner records its result under.
 * Boundary: type only; `mobileInfraPlan` builds the list.
 * Runtime: isomorphic
 * Governing contract: ADR 0344 (decision 11), ADR 0171 (`ref:` values resolve from the stack config).
 */
import type { MobileOwnerStep } from "#core/enums/mobile-owner-step.enum";

/** One manual step. */
export type MobileOwnerTask = {
  /** What to do. */
  readonly step: MobileOwnerStep;
  /** The bundle id or Android package the step is for, when it is per app. */
  readonly appId?: string;
  /** The stack config key (`expo:projectId`) that holds the result, when the runway names it as a `ref:`. */
  readonly configKey?: string;
};
