/**
 * Stackra file contract:
 * Purpose: `ChangeRecord`, one entry of the retained change log as the `ChangeFeed` lists it: its position, the row
 *          change, who caused it, when, and the scope of the transaction that wrote it.
 * Boundary: a type only. The position is opaque and ordered by the driver: a cursor stores it and reads after it, and
 *           a reader never parses it. The log keeps entries after delivery until retention drops them.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: the retained change feed); ADR 0327 (a scope is
 *                     a `ScopeRef`).
 */
import type { ScopeRef } from "@stackra/contracts";

import type { OutboxMessage } from "#contracts/types/outbox-message.type";
import type { RowChange } from "#contracts/types/row-change.type";

/** A retained row change. */
export interface ChangeRecord {
  /** Where the entry sits in the log; opaque, ordered by the driver. */
  readonly position: string;

  /** The row change itself. */
  readonly change: RowChange;

  /** Who caused it and the ids that chain it to its call. */
  readonly meta: OutboxMessage["meta"];

  /** When the write happened. */
  readonly occurredAt: Date;

  /** The scope of the transaction that wrote it; absent for a platform write. */
  readonly scope?: ScopeRef;
}
