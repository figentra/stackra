/**
 * Stackra file contract:
 * Purpose: `findConsentProofChainBreak`, the verification of a run of one subject's consent proof links: the first
 *          link whose hash does not match its content, or that does not follow the link before it.
 * Boundary: a pure function over Web Crypto. The first link given is the anchor: its `previousHash` is trusted, so a
 *           chain whose oldest proofs a retention rule removed still verifies from its oldest kept link. The links are
 *           read in the order given, which is sequence order from a store.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a broken chain fails verification); ADR 0454 (decision 5); STA-2818.
 */
import { hashConsentProofLink } from "#core/functions/hash-consent-proof-link.function";
import type { ConsentProofLink } from "#core/types/consent-proof-link.type";

/**
 * Checks `links`, oldest first.
 *
 * @param links - consecutive links of one subject's chain.
 * @returns the sequence of the first broken link, or `undefined` when the run holds.
 * @example
 * const broken = await findConsentProofChainBreak(await entries.find({ subject }, { orderBy: { sequence: "asc" } }));
 */
export async function findConsentProofChainBreak(
  links: readonly ConsentProofLink[],
): Promise<number | undefined> {
  const hashes = await Promise.all(
    links.map((link) => hashConsentProofLink(link, link.sequence, link.previousHash)),
  );
  const broken = links.find((link, index) => {
    const before = links[index - 1];
    return (
      link.hash !== hashes[index] ||
      (before !== undefined &&
        (link.subject !== before.subject ||
          link.sequence !== before.sequence + 1 ||
          link.previousHash !== before.hash))
    );
  });
  return broken?.sequence;
}
