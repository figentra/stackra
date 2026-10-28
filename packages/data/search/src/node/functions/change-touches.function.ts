/**
 * Stackra file contract:
 * Purpose: `changeTouches`, whether a row change can alter a search document: a create or a delete always can, an
 *          update only when it wrote one of the fields the document reads or a field that decides the row's presence.
 * Boundary: pure over the change. An update that names no fields (a write that could not say) counts as touching, so
 *           a skip never leaves a document stale.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: under five seconds of lag); data-layer gap se3 (skip a change that touches
 *                     no indexed path).
 */
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { RowChange } from "@stackra/outbox/contracts";

import { SEARCH_PRESENCE_FIELDS } from "#node/constants/search-presence-fields.constant";

/**
 * Whether `change` may change a document that reads `fields`.
 *
 * @example
 * changeTouches({ model: "Product", id: "prd_1", kind: RowChangeKind.Updated, fields: ["price"] }, new Set(["title"])); // false
 */
export function changeTouches(change: RowChange, fields: ReadonlySet<string>): boolean {
  if (change.kind !== RowChangeKind.Updated || change.fields.length === 0) return true;
  return change.fields.some((field) => fields.has(field) || SEARCH_PRESENCE_FIELDS.has(field));
}
