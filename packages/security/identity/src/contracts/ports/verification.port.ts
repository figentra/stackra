/**
 * Stackra file contract:
 * Purpose: the `Verification` port: one KYC or KYB provider. A driver per provider (a company registry, a tax
 *          authority lookup, a national ID service, an identity-document vendor, a sanctions screen) answers the
 *          checks it supports; `VerificationService` picks the driver for a market from the market pack.
 * Boundary: an abstract class that is its own token, keyed `identity.Verification`. A driver never chooses a market or
 *           a provider: the pack does. Its credentials are connection references (OS integrations), never config
 *           values. A driver that cannot answer now throws `VerificationUnavailableError`, so the service tries the
 *           next provider the pack lists.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); OS-54 (own verification service, drivers per market); ADR 0363;
 *                     ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { VerificationKind } from "#contracts/enums/verification-kind.enum";
import type { VerificationRequest } from "#contracts/types/verification-request.type";
import type { VerificationResult } from "#contracts/types/verification-result.type";

/**
 * One verification provider.
 *
 * @example
 * export class RegistryVerificationDriver extends Driver(Verification) {
 *   supports(kind: VerificationKind) { return kind === VerificationKind.Company; }
 *   async verify(request: VerificationRequest) { return this.client.lookup(request); }
 * }
 */
export abstract class Verification extends Port {
  /** Type-only port key, so `DriverName<Verification>` narrows to this port's drivers. */
  declare readonly "~key": "identity.Verification";

  /** Whether this provider answers checks of `kind`. */
  abstract supports(kind: VerificationKind): boolean;

  /**
   * Runs `request` at the provider.
   *
   * @throws VerificationUnavailableError when the provider cannot answer now.
   */
  abstract verify(request: VerificationRequest): Promise<Omit<VerificationResult, "provider">>;
}
