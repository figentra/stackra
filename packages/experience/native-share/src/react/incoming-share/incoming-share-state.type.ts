/**
 * Stackra file contract:
 * Purpose: `IncomingShareState`, what `useIncomingShare` returns: the waiting items, the port and `clear`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0305 (one declaration per file).
 */
import type { IncomingShare } from "#contracts/ports/incoming-share.port";
import type { SharedItem } from "#contracts/types/shared-item.type";

/** What `useIncomingShare` returns. */
export interface IncomingShareState {
  /** The accepted items waiting to be handled. */
  readonly items: readonly SharedItem[];

  /** The share port, to read a file's bytes. */
  readonly share: IncomingShare;

  /** Forgets the items once the app has handled them. */
  readonly clear: () => Promise<void>;
}
