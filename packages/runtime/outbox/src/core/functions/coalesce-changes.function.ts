/**
 * Stackra file contract:
 * Purpose: `coalesceChanges`, which folds a run of row changes into one change per row before a `consumeMany`
 *          consumer gets them: a later change supersedes an earlier one of the same `(model, id)`, so a row written
 *          ten times in a tick is indexed once.
 * Boundary: pure. Rows keep the order they first appeared in. A row created then updated stays created (its fields
 *           joined); anything followed by a delete is deleted with no fields and no `after`; otherwise the last kind
 *           wins and the fields are joined. `before` keeps the earliest value of each field, `after` the latest.
 * Runtime: isomorphic
 * Governing contract: data-layer gap se3 (batch-aware consumers and change coalescing); ADR 0078 (decision 4).
 */
import { RowChangeKind } from "#contracts/index";
import type { RowChange } from "#contracts/index";

/** `earlier` superseded by `later`, both of one row. */
function merge(earlier: RowChange, later: RowChange): RowChange {
  const deleted = later.kind === RowChangeKind.Deleted;
  const kind =
    earlier.kind === RowChangeKind.Created && later.kind === RowChangeKind.Updated
      ? RowChangeKind.Created
      : later.kind;
  const before =
    earlier.before === undefined && later.before === undefined
      ? undefined
      : { ...later.before, ...earlier.before };
  const after =
    deleted || (earlier.after === undefined && later.after === undefined)
      ? undefined
      : { ...earlier.after, ...later.after };
  return Object.freeze({
    model: later.model,
    id: later.id,
    kind,
    fields: deleted ? [] : [...new Set([...earlier.fields, ...later.fields])],
    ...(before === undefined ? {} : { before }),
    ...(after === undefined ? {} : { after }),
  });
}

/**
 * One change per row of `changes`.
 *
 * @example
 * coalesceChanges([created, updated, updated]); // [created, with every written field]
 */
export function coalesceChanges(changes: readonly RowChange[]): readonly RowChange[] {
  const rows = new Map<string, RowChange>();
  for (const change of changes) {
    const key = `${change.model}\u0000${change.id}`;
    const earlier = rows.get(key);
    rows.set(key, earlier === undefined ? change : merge(earlier, change));
  }
  return [...rows.values()];
}
