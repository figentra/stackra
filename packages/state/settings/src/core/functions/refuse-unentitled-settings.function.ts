/**
 * Stackra file contract:
 * Purpose: `refuseUnentitledSettings`, the write side of entitlement-gated settings: a written path the holder's plan
 *          does not unlock refuses the whole write with the core `entitlement_required` refusal, so the client shows
 *          the upgrade path.
 * Boundary: internal; pure apart from the throw. Only the written paths are checked. Each refused path's field error
 *           is `entitlement_required`; the refusal itself carries no details (ADR 0139).
 * Runtime: isomorphic
 * Governing contract: ADR 0420 (decision 1); ADR 0139 (the upgrade path).
 */
import { EntitlementRequiredError } from "@stackra/errors";

import type { SettingValue } from "#contracts/index";
import { unentitledSettingPaths } from "#core/functions/unentitled-setting-paths.function";
import type { SettingKey } from "#core/types/setting-key.type";

/**
 * Refuses `values` when one is not unlocked by `granted`.
 *
 * @throws EntitlementRequiredError naming each refused path as a field error.
 * @example
 * refuseUnentitledSettings(changes, page.fields, granted);
 */
export function refuseUnentitledSettings(
  values: Readonly<Record<string, SettingValue>>,
  keys: readonly SettingKey[],
  granted: ReadonlySet<string>,
): void {
  const refused = unentitledSettingPaths(values, keys, granted);
  if (refused.length > 0)
    throw EntitlementRequiredError.create(
      {},
      { fieldErrors: Object.fromEntries(refused.map((path) => [path, "entitlement_required"])) },
    );
}
