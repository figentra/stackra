/**
 * Stackra file contract:
 * Purpose: `hashConsentProofLink`, the hash of one consent proof link: SHA-256, lowercase hex, over the previous link's
 *          hash, the sequence and the proof's fields as canonical JSON.
 * Boundary: internal to the package: `linkConsentProof` and `findConsentProofChainBreak` share it, so building and
 *           verifying never drift. Only the proof's own fields are hashed (a link's chain fields are not), absent
 *           optional fields are dropped by the canonical form, and the instant is hashed as stored. Web Crypto only
 *           (`@stackra/support`'s `canonicalHash`), so a regulator's offline verifier hashes the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain); ADR 0416 (one canonical form); ADR 0454 (decision 5);
 *                     STA-2818.
 */
import { canonicalHash } from "@stackra/support";

import type { ConsentProof } from "#contracts/types/consent-proof.type";

/**
 * The hash of the link that puts `proof` at `sequence` after the link whose hash is `previousHash`.
 *
 * @param proof - the proof; only its proof fields are read.
 * @param sequence - the link's position in its subject's chain.
 * @param previousHash - the hash of the link before it.
 * @returns 64 lowercase hex characters.
 * @example
 * const hash = await hashConsentProofLink(proof, 1, "0".repeat(64));
 */
export function hashConsentProofLink(
  proof: ConsentProof,
  sequence: number,
  previousHash: string,
): Promise<string> {
  return canonicalHash({
    previousHash,
    sequence,
    proof: {
      subject: proof.subject,
      givenBy: proof.givenBy,
      relationship: proof.relationship,
      document: proof.document,
      version: proof.version,
      contentHash: proof.contentHash,
      granted: proof.granted,
      at: proof.at,
      channel: proof.channel,
      verificationMethod: proof.verificationMethod,
      verificationReference: proof.verificationReference,
    },
  });
}
