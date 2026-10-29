/**
 * Stackra file contract:
 * Purpose: `firstBrokenLink`, the check `findChainBreak` and `findAuditChainBreak` share: the first link of a run whose
 *          hash does not match its content, or that does not follow the link before it.
 * Boundary: internal to the package; the caller passes how one link's content hashes, so the access chain and the audit
 *           chain verify the same way over their own fields. The first link given is the anchor: its `previousHash` is
 *           trusted. Links are read in the order given, which is sequence order from a store.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a broken chain fails verification); ADR 0465 (decision 4).
 */
import type { AccessLink } from "#contracts/types/access-link.type";

/**
 * Checks `links`, oldest first.
 *
 * @param links - consecutive links of one chain.
 * @param hashOf - the hash `link` should carry, from its content, sequence and previous hash.
 * @returns the sequence of the first broken link, or undefined when the run holds.
 * @example
 * return firstBrokenLink(links, (link) => hashAuditLink(link, link.sequence, link.previousHash));
 */
export async function firstBrokenLink<
  L extends Pick<AccessLink, "sequence" | "previousHash" | "hash">,
>(links: readonly L[], hashOf: (link: L) => Promise<string>): Promise<number | undefined> {
  const hashes = await Promise.all(links.map(hashOf));
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
