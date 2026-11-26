/**
 * Stackra file contract:
 * Purpose: `keyCovers(call)`, whether an `api_client` call's API key holds every scope its `public` operation requires:
 *          each required permission key is on the key exactly, or, unless the operation is `exactOnly` (L3 or above, or
 *          approval or step-up), under a selector the key holds (`payments.@read`).
 * Boundary: pure. False when the operation is not `public`, the call carries no key, or it requires nothing; a wildcard
 *           (`*`, `orders.*`) on a key never counts. A selector covers only public operations, because only those
 *           answer an `api_client` at all.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (amendment of 2026-11-09, CHECKOUT's R1 and R2); ADR 0407 (selectors); STA-2646.
 */
import type { CallDescriptor } from "@stackra/actions/contracts";

import { selectsPermission } from "#core/functions/selects-permission.function";

/**
 * Whether the call's key covers its operation.
 * @example
 * keyCovers(call); // true for a key holding "payments.@read" on an L1 public read
 */
export function keyCovers(call: Pick<CallDescriptor, "public" | "credential">): boolean {
  const needed = call.public?.scopes ?? [];
  const held = call.credential?.scopes ?? [];
  if (needed.length === 0 || held.length === 0) return false;
  const exactOnly = call.public?.exactOnly ?? true;
  return needed.every((scope) =>
    held.some(
      (entry) =>
        entry === scope || (!exactOnly && entry.includes("@") && selectsPermission(entry, scope)),
    ),
  );
}
