/**
 * Stackra file contract:
 * Purpose: `GuardianLoginAttestationIssuer`, the server half of the `guardian_login` verification method: inside the
 *          guardian's own call, right after they signed in to their account, it signs a short-lived attestation that
 *          they did, for one person in their care and one document, which the flow then passes to
 *          `ConsentProofService.answerFor` as the verification evidence.
 * Boundary: a singleton service over `ConsentConfig`, the `Signer` port and the `Clock`. It signs only from the call's
 *           verified assurance (`ctx.assurance`, filled by the transport from the verified token, never from input):
 *           no assurance, no `auth_time`, or a sign-in older than `guardianLoginMaxAgeMinutes` (or in the future past
 *           the clock skew) is refused with `ConsentNotVerifiedError`, so a long-lived session cannot stand in for a
 *           fresh sign-in. `givenBy` is the caller's own principal id, never input. Whether `givenBy` may consent for
 *           `subject` is `ConsentAuthority`'s answer, checked by `answerFor`, not here. The attestation lives
 *           `guardianLoginAttestationMinutes`; it stores nothing. Signed by the same key as consent snapshots, kept
 *           apart by its `kind`.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences: the verification method port); ADR 0207 (decision 1: `auth_time` and the
 *                     step-up window); ADR 0416 (signer keys); STA-1323; STA-2818.
 */
import type { CallAssurance } from "@stackra/actions/contracts";
import { Service } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";
import type { Clock, PublicId, Signer } from "@stackra/contracts";

import type { ConsentConfig } from "#config/consent.config";
import { ConsentNotVerifiedError } from "#core/errors/consent-not-verified.error";
import { encodeGuardianLoginAttestation } from "#core/functions/encode-guardian-login-attestation.function";
import type { GuardianLoginAttestation } from "#core/types/guardian-login-attestation.type";
import type { IssuedGuardianLoginAttestation } from "#core/types/issued-guardian-login-attestation.type";

/** Milliseconds in a minute and a second. */
const MINUTE_MS = 60_000;
const SECOND_MS = 1000;

/**
 * Signs guardian sign-in attestations.
 *
 * @example
 * const { token } = await attestations.issue(ctx.actor.id, input.child, "photos", ctx.assurance);
 * await proofs.answerFor(input.child, ctx.actor.id, photos, true, "guardian_app", {
 *   method: ConsentVerificationMethod.GuardianLogin,
 *   evidence: token,
 * });
 */
export class GuardianLoginAttestationIssuer extends Service {
  /** The sign-in window, the attestation lifetime and the clock skew. */
  private readonly config: ConsentConfig;

  /** The key attestations are signed with. */
  private readonly signer: Signer;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param config - the sign-in window, the attestation lifetime and the clock skew.
   * @param signer - the key attestations are signed with (the consent snapshot key).
   * @param clock - the current time.
   */
  constructor(config: ConsentConfig, signer: Signer, clock: Clock) {
    super();
    this.config = config;
    this.signer = signer;
    this.clock = clock;
  }

  /**
   * A signed attestation that `givenBy` has just signed in to confirm a consent for `subject` to `document`.
   *
   * @param givenBy - the caller's own principal id (`ctx.actor.id`), never input.
   * @param subject - the person in their care.
   * @param document - the document or purpose key.
   * @param assurance - the call's verified assurance (`ctx.assurance`).
   * @throws ConsentNotVerifiedError when the call has no recent sign-in.
   * @throws RangeError when `givenBy` is `subject` (a person answers for themself without a verification).
   */
  async issue(
    givenBy: PublicId,
    subject: PublicId,
    document: string,
    assurance: CallAssurance | undefined,
  ): Promise<IssuedGuardianLoginAttestation> {
    if (givenBy === subject) throw new RangeError("a guardian attests a sign-in for someone else");
    const now = this.clock.now().getTime();
    const authTime = assurance?.authTime?.getTime();
    if (
      authTime === undefined ||
      Number.isNaN(authTime) ||
      authTime > now + this.config.snapshotClockSkewSeconds * SECOND_MS ||
      now - authTime > this.config.guardianLoginMaxAgeMinutes * MINUTE_MS
    )
      throw ConsentNotVerifiedError.create();
    const attestation: GuardianLoginAttestation = Object.freeze({
      kind: "consent_guardian_login",
      id: mintPublicId("cgl", now),
      givenBy,
      subject,
      document,
      authTime: new Date(authTime).toISOString(),
      amr: Object.freeze([...(assurance?.amr ?? [])]),
      level: assurance?.level ?? null,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(
        now + this.config.guardianLoginAttestationMinutes * MINUTE_MS,
      ).toISOString(),
    });
    return Object.freeze({
      token: await encodeGuardianLoginAttestation(attestation, this.signer),
      attestation,
    });
  }
}
