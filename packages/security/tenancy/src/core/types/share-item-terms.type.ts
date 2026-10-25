/**
 * Stackra file contract:
 * Purpose: `ShareItemTerms`, how one item kind travels on a share: what revocation does to copies already received,
 *          and whether the receiving side may edit its copy.
 * Boundary: a type only; data on the share, seeded from the product's defaults (invoices and messages kept, documents
 *           deleted, per ADR 0343 decision 5), never decided in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decisions 3 and 5).
 */
import type { RevokedCopy } from "#core/enums/revoked-copy.enum";

/** The terms of one item kind. */
export interface ShareItemTerms {
  /** What revocation does to a received copy. */
  readonly onRevoke: RevokedCopy;

  /** The receiving tenant may edit its copy; read-only when false. */
  readonly receiverWritable: boolean;
}
