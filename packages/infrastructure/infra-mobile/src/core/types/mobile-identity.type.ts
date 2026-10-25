/**
 * Stackra file contract:
 * Purpose: `MobileIdentity`, what the mobile member is in the stores: the iOS bundle id with the derived bundle ids of
 *          its native surfaces, and the Android package. The caller reads them from the member's `stackra.config.ts`
 *          (`ios.bundleId`, `android.package`) and its `stackra.manifest.json` (the surfaces).
 * Boundary: type only; a platform the member does not target is left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0344 (decision 3: surface identities are derived and locked in the manifest), ADR 0295
 *                     (decision 1: identity lives in `stackra.config.ts`).
 */

/** The member's store identities. */
export type MobileIdentity = {
  /** The iOS app, when the member targets `ios`. */
  readonly ios?: {
    /** The app's bundle id, frozen at the first store upload. */
    readonly bundleId: string;
    /** The bundle ids of its native surfaces (`<bundleId>.widget`, `.share`, …), as the manifest locks them. */
    readonly surfaces?: readonly string[];
  };
  /** The Android app, when the member targets `android`. */
  readonly android?: {
    /** The application id, frozen at the first store upload. */
    readonly package: string;
  };
};
