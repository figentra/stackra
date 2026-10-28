/**
 * Stackra file contract:
 * Purpose: `WarehouseBatch`, one partition's worth of retained row changes a `WarehouseSink` writes as one file: the
 *          changes of one model, in one scope, on one UTC day, in change log order.
 * Boundary: a type only. The records are the change feed's own `ChangeRecord`s, so their values are what the model's
 *           `CapturesChanges` keeps (never an encrypted or `@Classified` field); a model that captures no values
 *           exports the change itself (id, kind, fields, time) and no column values.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the warehouse sink); ADR 0078 and ADR 0221
 *                     (2026-10-28 amendment: the retained change feed); ADR 0327 (a scope is a `ScopeRef`).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { ChangeRecord } from "@stackra/outbox/contracts";

/** The changes of one warehouse partition. */
export interface WarehouseBatch {
  /** The model's class name (`Product`), the `model=` partition. */
  readonly model: string;

  /** The scope of the transactions that wrote the changes, the `scope=` partition; absent for platform writes. */
  readonly scope?: ScopeRef;

  /** The UTC day the changes happened on (`2026-10-29`), the `dt=` partition. */
  readonly day: string;

  /** The changes, in change log order; never empty. */
  readonly records: readonly ChangeRecord[];
}
