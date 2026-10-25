/**
 * Stackra file contract:
 * Purpose: `sameOwner`, whether two connection records sit at the same level with the same owner: the same user, or
 *          the same scope node by its id.
 * Boundary: internal and pure; the store drivers use it to find the connection a new one replaces when the
 *           Integration does not allow `multiple`. A scope node is compared by id, never by path or level.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 10); ADR 0327 (decision 5).
 */
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import type { ConnectionRecord } from "#core/types/connection-record.type";

/**
 * Whether `a` and `b` have one owner.
 *
 * @example
 * records.filter((record) => sameOwner(record, added));
 */
export function sameOwner(
  a: Pick<ConnectionRecord, "level" | "scope" | "userId">,
  b: Pick<ConnectionRecord, "level" | "scope" | "userId">,
): boolean {
  if (a.level !== b.level) return false;
  return a.level === ConnectionLevel.User
    ? a.userId !== undefined && a.userId === b.userId
    : a.scope !== undefined && a.scope.id === b.scope?.id;
}
