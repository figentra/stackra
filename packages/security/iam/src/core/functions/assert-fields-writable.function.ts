/**
 * Stackra file contract:
 * Purpose: `assertFieldsWritable`, the write side of field-level access: refuses a change that sets a field the
 *          principal may not write (read-only or hidden).
 * Boundary: pure; reads only the change's own keys. The refusal is `ForbiddenError` with no reason, like every
 *           permission refusal (the field names are for the audit, not the caller).
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3); STA-595 (field-level enforcement).
 */
import { ForbiddenError } from "@stackra/errors";

import type { FieldPermissions } from "#core/types/field-permissions.type";

/**
 * Throws when `change` touches a field the principal may not write.
 *
 * @throws ForbiddenError when a key of `change` is read-only or hidden.
 * @example
 * assertFieldsWritable(input, await pdp.fieldAccess(actor, "academy.athlete", { record }));
 */
export function assertFieldsWritable(change: object, access: FieldPermissions): void {
  const refused = new Set([...access.readOnly, ...access.hidden]);
  if (Object.keys(change).some((field) => refused.has(field))) throw ForbiddenError.create();
}
