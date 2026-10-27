/**
 * Stackra file contract:
 * Purpose: `assertFieldsReadable`, the aggregate side of field-level access: refuses a count, sum or other aggregate
 *          that reads or filters on a field the principal may not read, so a filtered total never measures a hidden
 *          field the row reads would have dropped.
 * Boundary: pure; a field path matches a hidden field or anything under it (`total.minor` under `total`). Rows stay the
 *           visibility filter's: the aggregate runs through `CrudService` (`count`, `sum`, `countDistinct`, `metrics`),
 *           which ANDs the same row policy as reads. The refusal is `ForbiddenError` with no reason, like every
 *           permission refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3); ADR 0333 (amendment: counts and aggregates); STA-595 (field-level
 *                     enforcement); STA-933 (filtered aggregates).
 */
import { ForbiddenError } from "@stackra/errors";

import type { FieldPermissions } from "#core/types/field-permissions.type";

/**
 * Throws when one of `fields` (the aggregated field and the filter's fields) is hidden from the principal.
 *
 * @throws ForbiddenError when a field is hidden or sits under a hidden field.
 * @example
 * assertFieldsReadable(["fee.minor", ...Object.keys(where)], await pdp.fieldAccess(actor, "practice.matter"));
 * const total = await matters.sum("fee.minor", where);
 */
export function assertFieldsReadable(fields: Iterable<string>, access: FieldPermissions): void {
  for (const field of fields)
    if (access.hidden.some((hidden) => field === hidden || field.startsWith(`${hidden}.`)))
      throw ForbiddenError.create();
}
