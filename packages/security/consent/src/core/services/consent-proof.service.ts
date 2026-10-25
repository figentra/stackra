/**
 * Stackra file contract:
 * Purpose: `ConsentProofService`, versioned terms acceptance and consent on the server: which required documents a
 *          person has not accepted in their current version, recording an acceptance or a refusal with the text's
 *          hash, and recording a consent one person gives for another after the `ConsentAuthority` confirms the
 *          relationship.
 * Boundary: over `ConsentProofStore`, `ConsentAuthority` and `Clock`; the only writer of proofs. A newer version of a
 *           document needs a new acceptance; an older or refused answer never counts. The relationship stored is the
 *           authority's answer, never the caller's. Who must be asked (an age floor) is market-pack data the caller
 *           applies (`needsGuardianConsent`).
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29 (versioned terms acceptance, server proof store); OS-284 (on behalf of
 *                     another); ADR 0298 (decision 3).
 */
import { Service } from "@stackra/container";
import { Clock, type PublicId } from "@stackra/contracts";

import { ConsentAuthority } from "#contracts/ports/consent-authority.port";
import { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import type { ConsentProof } from "#contracts/types/consent-proof.type";
import { ConsentAuthorityMissingError } from "#core/errors/consent-authority-missing.error";
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

  /**
   * @param store - the append-only proofs.
   * @param authority - the relationship records.
   * @param clock - the current time.
   */
  constructor(store: ConsentProofStore, authority: ConsentAuthority, clock: Clock) {
    super();
    this.store = store;
    this.authority = authority;
    this.clock = clock;
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
   * Records `givenBy`'s answer for `subject` to the current version of `document`.
   *
   * @throws ConsentAuthorityMissingError when `givenBy` may not consent for `subject` to it.
   * @throws RangeError when `givenBy` is `subject` (use `answer`).
   */
  async answerFor(
    subject: PublicId,
    givenBy: PublicId,
    document: TermsDocument,
    granted: boolean,
    channel?: string,
  ): Promise<ConsentProof> {
    if (givenBy === subject) throw new RangeError("a person answers for themself with answer()");
    const relationship = await this.authority.relationshipOf(givenBy, subject, document.key);
    if (relationship === undefined || relationship === "")
      throw ConsentAuthorityMissingError.create();
    return this.record({
      subject,
      givenBy,
      relationship,
      document: document.key,
      version: document.version,
      granted,
      ...(document.contentHash === undefined ? {} : { contentHash: document.contentHash }),
      ...(channel === undefined ? {} : { channel }),
    });
  }

  /** The latest answer of `subject` for `document`, any version. */
  current(subject: PublicId, document: string): Promise<ConsentProof | undefined> {
    return this.store.latest(subject, document);
  }

  /** Stamps and appends one proof. */
  private async record(proof: Omit<ConsentProof, "at">): Promise<ConsentProof> {
    const stamped: ConsentProof = { ...proof, at: this.clock.now().toISOString() };
    await this.store.append(stamped);
    return stamped;
  }
}
