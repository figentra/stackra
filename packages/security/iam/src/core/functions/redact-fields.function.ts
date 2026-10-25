/**
 * Stackra file contract:
 * Purpose: `redactFields`, a record's attributes without the fields a principal may not read: what a read returns
 *          after `PolicyDecisionPointService.fieldAccess`.
 * Boundary: pure; returns a new object and never changes the record. Only own keys are kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3); STA-595 (field-level enforcement).
 */
import type { FieldPermissions } from "#core/types/field-permissions.type";

/**
 * `record` without its hidden fields.
 *
 * @example
 * return redactFields(athlete, await pdp.fieldAccess(actor, "academy.athlete", { record }));
 */
export function redactFields<T extends object>(
  record: T,
  access: Pick<FieldPermissions, "hidden">,
): Partial<T> {
  const hidden = new Set(access.hidden);
  return Object.fromEntries(
    Object.entries(record).filter(([field]) => !hidden.has(field)),
  ) as Partial<T>;
}
