/**
 * Stackra file contract:
 * Purpose: `ConsentProofService`, versioned terms acceptance and consent on the server: which required documents a
 *          person has not accepted in their current version, recording an acceptance or a refusal with the text's
 *          hash, and recording a consent one person gives for another after the `ConsentAuthority` confirms the
 *          relationship and, when the market pack names a verification method, after `ConsentVerifier` confirms it; and
 *          reading a person's evidence trail (who answered, which version, when, on whose behalf, how verified).
 * Boundary: over `ConsentProofStore`, `ConsentAuthority`, `ConsentVerifier` and `Clock`; the only writer of proofs. A newer version of a
 *           document needs a new acceptance; an older or refused answer never counts. The relationship stored is the
 *           authority's answer, never the caller's. Who must be asked (an age floor) is market-pack data the caller
 *           applies (`needsGuardianConsent`); so is the verification method, which the caller reads from the pack and
 *           passes with the evidence its flow produced. The method and reference stored are the verifier's answer,
 *           checked before anything is written; a failed check records nothing. The evidence trail is the store's rows as written, never summarised, so
 *           it can be shown to a regulator or the person as it is.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29 (versioned terms acceptance, server proof store); OS-284 (on behalf of
 *                     another); ADR 0298 (decision 3); ADR 0454 (decision 5: consent evidence records, and the verification method port of its
 *                     Consequences); STA-1323.
 */
import { Service } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";

import type { ConsentAuthority } from "#contracts/ports/consent-authority.port";
import type { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import type { ConsentVerifier } from "#contracts/ports/consent-verifier.port";
import type { ConsentProof } from "#contracts/types/consent-proof.type";
import type { ConsentVerificationRequest } from "#contracts/types/consent-verification-request.type";
import { ConsentAuthorityMissingError } from "#core/errors/consent-authority-missing.error";
import { ConsentNotVerifiedError } from "#core/errors/consent-not-verified.error";
import type { TermsDocument } from "#core/types/terms-document.type";

/**
 * Records and reads consent proofs.
 *
 * @example
 * const pending = await proofs.pending(user.id, documents);
 * if (pending.some((document) => document.required)) return showTermsPrompt(pending);
 */
export class ConsentProofService extends Service {
  /** The proofs. */
  private readonly store: ConsentProofStore;

  /** Who may consent for whom. */
  private readonly authority: ConsentAuthority;

  /** The current time. */
  private readonly clock: Clock;

  /** Checks the verification method a market pack names. */
  private readonly verifier: ConsentVerifier;

  /**
   * @param store - the append-only proofs.
   * @param authority - the relationship records.
   * @param clock - the current time.
   * @param verifier - runs the verification methods; the shipped `none` driver fails every one closed.
   */
  constructor(
    store: ConsentProofStore,
    authority: ConsentAuthority,
    clock: Clock,
    verifier: ConsentVerifier,
  ) {
    super();
    this.store = store;
    this.authority = authority;
    this.clock = clock;
    this.verifier = verifier;
  }

  /** The documents of `documents` `subject` has not accepted in their current version, in the order given. */
  async pending(
    subject: PublicId,
    documents: readonly TermsDocument[],
  ): Promise<readonly TermsDocument[]> {
    const answers = await Promise.all(
      documents.map((document) => this.store.latest(subject, document.key)),
    );
    return documents.filter((document, index) => {
      const latest = answers[index];
      return latest?.granted !== true || latest.version !== document.version;
    });
  }

  /** Records `subject`'s own answer to the current version of `document`. */
  async answer(
    subject: PublicId,
    document: TermsDocument,
    granted: boolean,
    channel?: string,
  ): Promise<ConsentProof> {
    return this.record({
      subject,
      givenBy: subject,
      document: document.key,
      version: document.version,
      granted,
      ...(document.contentHash === undefined ? {} : { contentHash: document.contentHash }),
      ...(channel === undefined ? {} : { channel }),
    });
  }

  /**
   * Records `givenBy`'s answer for `subject` to the current version of `document`. When the market pack names a
   * verification method, pass it with the evidence its flow produced: the answer is recorded only once the verifier
   * confirms it, with the method and the verifier's reference.
   *
   * @param verification - the pack's method and the flow's evidence; omit when the pack names none.
   * @throws ConsentAuthorityMissingError when `givenBy` may not consent for `subject` to it.
   * @throws ConsentNotVerifiedError when the verification did not pass.
   * @throws RangeError when `givenBy` is `subject` (use `answer`).
   */
  async answerFor(
    subject: PublicId,
    givenBy: PublicId,
    document: TermsDocument,
    granted: boolean,
    channel?: string,
    verification?: Pick<ConsentVerificationRequest, "method" | "evidence">,
  ): Promise<ConsentProof> {
    if (givenBy === subject) throw new RangeError("a person answers for themself with answer()");
    const relationship = await this.authority.relationshipOf(givenBy, subject, document.key);
    if (relationship === undefined || relationship === "")
      throw ConsentAuthorityMissingError.create();
    let verified: Pick<ConsentProof, "verificationMethod" | "verificationReference"> = {};
    if (verification !== undefined) {
      const answer = await this.verifier.verify({
        ...verification,
        subject,
        givenBy,
        document: document.key,
      });
      if (!answer.verified) throw ConsentNotVerifiedError.create();
      verified = {
        verificationMethod: verification.method,
        ...(answer.reference === undefined ? {} : { verificationReference: answer.reference }),
      };
    }
    return this.record({
      subject,
      givenBy,
      relationship,
      document: document.key,
      version: document.version,
      granted,
      ...(document.contentHash === undefined ? {} : { contentHash: document.contentHash }),
      ...(channel === undefined ? {} : { channel }),
      ...verified,
    });
  }

  /** The latest answer of `subject` for `document`, any version. */
  current(subject: PublicId, document: string): Promise<ConsentProof | undefined> {
    return this.store.latest(subject, document);
  }

  /**
   * The evidence trail of `subject`, oldest first: every answer given by them or for them, each with who gave it, the
   * relationship when on their behalf, the document version, the text's hash and when. Narrowed to one document when
   * `document` is given.
   */
  async evidence(subject: PublicId, document?: string): Promise<readonly ConsentProof[]> {
    const proofs = await this.store.list(subject);
    return document === undefined ? proofs : proofs.filter((proof) => proof.document === document);
  }

  /** Stamps and appends one proof. */
  private async record(proof: Omit<ConsentProof, "at">): Promise<ConsentProof> {
    const stamped: ConsentProof = { ...proof, at: this.clock.now().toISOString() };
    await this.store.append(stamped);
    return stamped;
  }
}
