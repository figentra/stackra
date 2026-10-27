/**
 * Stackra file contract:
 * Purpose: `ConsentProof`, the server's record that a person agreed to (or refused) one version of a document or a
 *          purpose: whose consent it is, who gave it (the person, or a guardian on their behalf with the relationship),
 *          the document key and version, the hash of the text shown, the answer and when, and, for a consent given on
 *          another's behalf, the verification method the market required and the verifier's reference.
 * Boundary: a type only, the row a `ConsentProofStore` appends and never edits; a later answer is a new row. Ids only:
 *           no name, address or the text itself. It is evidence, unlike the visitor's cookie decision (`ConsentRecord`),
 *           which proves nothing on the server.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 3: decisions carry a policy version); owner round 3 #29 (versioned terms
 *                     acceptance, server proof store); OS-284 (consent on behalf of another); STA-1323 (the verification method).
 */
import type { PublicId } from "@stackra/contracts";

import type { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";

/** One consent proof. */
export interface ConsentProof {
  /** The person the consent is about. */
  readonly subject: PublicId;

  /** Who gave it: the subject, or the person acting for them. */
  readonly givenBy: PublicId;

  /** How `givenBy` stands to `subject` (`guardian`), when it is someone else; the authority's answer, never input. */
  readonly relationship?: string;

  /** The document or purpose key (`terms`, `privacy`, `photos`). */
  readonly document: string;

  /** The version answered. */
  readonly version: string;

  /** The hash of the exact text shown, when the document has one. */
  readonly contentHash?: string;

  /** Agreed or refused. */
  readonly granted: boolean;

  /** When, as an ISO 8601 instant. */
  readonly at: string;

  /** Where it was given (`signup`, `settings`, `kiosk`), for the evidence trail. */
  readonly channel?: string;

  /** The verification method the consent passed, when the market pack required one; the verifier's, never input. */
  readonly verificationMethod?: ConsentVerificationMethod;

  /** The verifier's id of that check, when it gave one. */
  readonly verificationReference?: string;
}
