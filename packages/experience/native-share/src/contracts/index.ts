/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/native-share (`IncomingShare`, `SharedItem`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; the leaf entry, it imports no other entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0117.
 */
export { IncomingShare } from "#contracts/ports/incoming-share.port";
export type { SharedItem } from "#contracts/types/shared-item.type";
