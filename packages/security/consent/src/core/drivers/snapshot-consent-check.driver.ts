/**
 * Stackra file contract:
 * Purpose: `SnapshotConsentCheckDriver`, the `snapshot` driver of the actions `ConsentCheck` port: the pipeline's
 *          `ctx.consent()` verifies the call's `Stackra-Consent` snapshot through `ConsentSnapshotVerifier`.
 * Boundary: delegates to the verifier and adds nothing; it decides nothing about the call (ADR 0472 decision 3). A host
 *           binds it where `@stackra/consent` and `@stackra/actions` are both installed; without it, every call's
 *           consent reads as refused (`unchecked`).
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 3 and 4); ADR 0263 (a driver is named by its class: `snapshot`).
 */
import { ConsentCheck } from "@stackra/actions/contracts";
import type { CallConsent } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";

import type { ConsentSnapshotVerifier } from "#core/services/consent-snapshot-verifier.service";

/**
 * Checks a call's consent snapshot.
 *
 * @example
 * const consent = await new SnapshotConsentCheckDriver(verifier).check(token, call);
 */
export class SnapshotConsentCheckDriver extends Driver(ConsentCheck) {
  private readonly verifier: ConsentSnapshotVerifier;

  /**
   * @param verifier - checks the token's key, signature, lifetime, policy and Global Privacy Control.
   */
  constructor(verifier: ConsentSnapshotVerifier) {
    super();
    this.verifier = verifier;
  }

  /** The verifier's answer for `snapshot`; the call does not change it. */
  check(snapshot: string): Promise<CallConsent> {
    return this.verifier.verify(snapshot);
  }
}
