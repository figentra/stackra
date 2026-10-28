/**
 * Stackra file contract:
 * Purpose: the `ConsentCheck` port: verifies the signed consent snapshot a call carried (the `Stackra-Consent` header,
 *          ADR 0472) and answers the call's `CallConsent`, which the pipeline exposes as `ctx.consent()`.
 * Boundary: an abstract class that is its own token, implemented by `@stackra/consent` (`SnapshotConsentCheckDriver`,
 *           which checks the signature, the key, the lifetime, the policy version and Global Privacy Control). It
 *           decides nothing about the call: it is not a pipeline step and never refuses a call (ADR 0472 decision 3).
 *           It never throws on a bad snapshot; a bad snapshot is a refused `CallConsent`. With none bound, every call's
 *           consent reads as refused (`unchecked`).
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 3 and 4); ADR 0138 (as amended: no new step); ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { CallConsent } from "#contracts/types/call-consent.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Verifies a call's consent snapshot.
 *
 * @example
 * export class SnapshotConsentCheckDriver extends Driver(ConsentCheck) {
 *   check(snapshot: string): Promise<CallConsent> { return this.verifier.verify(snapshot); }
 * }
 */
export abstract class ConsentCheck extends Port {
  /** The consent `snapshot` (the header value as sent) grants `call`; a refused value when it does not count. */
  abstract check(snapshot: string, call: CallDescriptor): Promise<CallConsent>;
}
