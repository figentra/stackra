/**
 * Stackra file contract:
 * Purpose: `findAuditChainBreak`, the verification of a run of audit chain links: the first link whose hash does not
 *          match its content, or that does not follow the link before it.
 * Boundary: a pure function over Web Crypto, the audit twin of `findChainBreak`. The first link given is the anchor:
 *           its `previousHash` is trusted, so a run read from the middle of a chain still verifies. Links are read in
 *           the order given, which is sequence order from a store.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a broken chain fails verification); ADR 0465 (decision 4).
 */
import type { AuditLink } from "#contracts/types/audit-link.type";
import { hashAuditLink } from "#core/functions/hash-audit-link.function";

/**
 * Checks `links`, oldest first.
 *
 * @param links - consecutive links of one chain.
 * @returns the sequence of the first broken link, or undefined when the run holds.
 * @example
 * const broken = await findAuditChainBreak(await entries.find({}, { orderBy: { sequence: "asc" } }));
 */
export async function findAuditChainBreak(
  links: readonly AuditLink[],
): Promise<number | undefined> {
  const hashes = await Promise.all(
    links.map((link) => hashAuditLink(link, link.sequence, link.previousHash)),
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
