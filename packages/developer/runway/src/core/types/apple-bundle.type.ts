/**
 * Stackra file contract:
 * Purpose: `AppleBundle`, one registered bundle id as the `AppleDeveloper` port answers it: its App Store Connect
 *          resource id and the capabilities it has.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 4).
 */
import type { AppleCapability } from "#core/enums/apple-capability.enum";

/** One registered bundle id. */
export type AppleBundle = {
  /** The App Store Connect resource id. */
  readonly id: string;
  /** The capabilities enabled on it. */
  readonly capabilities: readonly AppleCapability[];
};
