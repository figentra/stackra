/**
 * Stackra file contract:
 * Purpose: `linkConsentProof`, the next link of a subject's consent proof chain: the proof with the sequence after
 *          `previous`, the hash of `previous` and its own hash. A durable `ConsentProofStore` driver (the package's
 *          Postgres driver, or a host's own) chains each appended proof with it.
 * Boundary: a pure function over Web Crypto; it reads no store, so the driver that calls it owns the head it passes and
 *           the order of its writes. The first link of a chain follows 64 zeros. The instant is kept as the ISO 8601
 *           text a `Date` gives back, so a store that keeps it as a timestamp reads back the very proof it hashed; an
 *           instant that is not a date is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain checked by verification); ADR 0454 (decision 5: consent
 *                     evidence records); STA-2818.
 */
import type { ConsentProof } from "#contracts/types/consent-proof.type";
import { hashConsentProofLink } from "#core/functions/hash-consent-proof-link.function";
import type { ConsentProofLink } from "#core/types/consent-proof-link.type";

/** The `previousHash` of a chain's first link. */
const GENESIS_HASH = "0".repeat(64);

/**
 * Chains `proof` after `previous`, or starts its subject's chain.
 *
 * @param proof - the proof to append; only its proof fields are kept.
 * @param previous - the subject's newest link; absent for a new chain.
 * @returns the link to store.
 * @throws RangeError when `proof.at` is not an instant.
 * @example
 * const link = await linkConsentProof(proof, head ?? undefined);
 */
export async function linkConsentProof(
  proof: ConsentProof,
  previous?: Pick<ConsentProofLink, "sequence" | "hash">,
): Promise<ConsentProofLink> {
  const instant = new Date(proof.at);
  if (Number.isNaN(instant.getTime()))
    throw new RangeError("a consent proof's `at` must be an ISO 8601 instant");
  const stored: ConsentProof = {
    subject: proof.subject,
    givenBy: proof.givenBy,
    ...(proof.relationship === undefined ? {} : { relationship: proof.relationship }),
    document: proof.document,
    version: proof.version,
    ...(proof.contentHash === undefined ? {} : { contentHash: proof.contentHash }),
    granted: proof.granted,
    at: instant.toISOString(),
    ...(proof.channel === undefined ? {} : { channel: proof.channel }),
    ...(proof.verificationMethod === undefined
      ? {}
      : { verificationMethod: proof.verificationMethod }),
    ...(proof.verificationReference === undefined
      ? {}
      : { verificationReference: proof.verificationReference }),
  };
  const sequence = (previous?.sequence ?? 0) + 1;
  const previousHash = previous?.hash ?? GENESIS_HASH;
  return {
    ...stored,
    sequence,
    previousHash,
    hash: await hashConsentProofLink(stored, sequence, previousHash),
  };
}
