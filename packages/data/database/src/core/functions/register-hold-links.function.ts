/**
 * Stackra file contract:
 * Purpose: `registerHoldLinks`, how a module declares each model's subject links: the fields whose public id ties a
 *          row to a hold subject, which every delete, purge and retention path then reports to the `HoldRegistry`, so
 *          a hold on a person or a matter reaches the rows linked to it.
 * Boundary: called once at boot by the module that owns the models (gen may write it later from a model facet). A
 *           later call for the same model replaces its fields; an empty list removes them. The fields are model
 *           field names, read from the row as stored.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: the implementer follows links); STA-1241.
 */
import type { AnyClass } from "@stackra/container";

import { HOLD_LINK_FIELDS } from "#core/constants/hold-link-fields.constant";

/**
 * Registers `[model, fields]` pairs.
 *
 * @example
 * registerHoldLinks([
 *   [Order, ["customerId"]],
 *   [CommentRevision, ["authorId", "matterId"]],
 * ]);
 */
export function registerHoldLinks(
  pairs: readonly (readonly [model: AnyClass, fields: readonly string[]])[],
): void {
  for (const [model, fields] of pairs)
    if (fields.length === 0) HOLD_LINK_FIELDS.delete(model);
    else HOLD_LINK_FIELDS.set(model, Object.freeze([...fields]));
}
