/**
 * Stackra file contract:
 * Purpose: `isEntitled`, the yes-or-no check of one entitlement in one scope outside the action pipeline, by class or
 *          by key: the marketplace registry asks it whether a scope's plan covers a paid module before an install.
 * Boundary: asks the bound `EntitlementSource` once and composes nothing. In the plan means granted: `true`, a count
 *           or a soft limit, or a value. `false` and "not in the plan" (`undefined`) are not. It does not count usage
 *           against a limit; the pipeline's step and `LimitReservationService` do that.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 1 and 3); ADR 0131 (module keys); STA-1225.
 */
import type { PublicId } from "@stackra/contracts";

import type { EntitlementSource } from "#contracts/ports/entitlement-source.port";
import type { EntitlementKey } from "#contracts/types/entitlement-key.type";
import type { EntitlementRef } from "#contracts/types/entitlement-ref.type";

/**
 * Whether `scope`'s plan grants `entitlement`.
 *
 * @param scope - the id of the scope; `undefined` for the platform-wide plan.
 * @throws TypeError when the class is unregistered or the key malformed (the source's `entitlementKey`).
 * @throws Error when the source cannot be reached; never read as granted.
 * @example
 * if (!(await isEntitled(source, manifest.key, scope.id))) throw EntitlementRequiredError.create();
 */
export async function isEntitled(
  source: EntitlementSource,
  entitlement: EntitlementRef | EntitlementKey,
  scope: PublicId | undefined,
): Promise<boolean> {
  const grant = await source.grant(entitlement, scope);
  return grant !== undefined && grant !== false;
}
