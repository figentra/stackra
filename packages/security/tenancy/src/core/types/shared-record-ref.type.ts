/**
 * Stackra file contract:
 * Purpose: `SharedRecordRef`, one record a share names: its kind (a model key or an item kind) and its public id.
 * Boundary: a type only; ids only, never the record's data.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decisions 1 and 2).
 */
import type { PublicId } from "@stackra/contracts";

/** A record named by a share. */
export interface SharedRecordRef {
  /** The record's kind (`matters.matter`, `document`, `invoice`). */
  readonly kind: string;

  /** The record's public id in its own tenant. */
  readonly id: PublicId;
}
