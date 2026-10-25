/**
 * Stackra file contract:
 * Purpose: `findChainBreak`, the verification of a run of chain links: the first link whose hash does not match its
 *          content, or that does not follow the link before it.
 * Boundary: a pure function over Web Crypto. The first link given is the anchor: its `previousHash` is trusted, so a
 *           chain whose oldest links the retention job purged still verifies from its oldest kept link. The links are
 *           read in the order given, which is sequence order from a store.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a broken chain fails verification; consequences: an audit gap is
 *                     detectable).
 */
import type { AccessLink } from "#contracts/types/access-link.type";
import { hashAccessLink } from "#core/functions/hash-access-link.function";

/**
 * Checks `links`, oldest first.
 *
 * @param links - consecutive links of one chain.
 * @returns the sequence of the first broken link, or undefined when the run holds.
 * @example
 * const broken = await findChainBreak(await entries.find({}, { orderBy: { sequence: "asc" } }));
 */
export async function findChainBreak(links: readonly AccessLink[]): Promise<number | undefined> {
  const hashes = await Promise.all(
    links.map((link) => hashAccessLink(link, link.sequence, link.previousHash)),
  );
  const broken = links.find((link, index) => {
    const before = links[index - 1];
    return (
      link.hash !== hashes[index] ||
      (before !== undefined &&
        (link.sequence !== before.sequence + 1 || link.previousHash !== before.hash))
    );
  });
  return broken?.sequence;
}
