/**
 * Stackra file contract:
 * Purpose: `fakeEntitlements(grants)`, the helper a test sets a plan with: an `EntitlementSource` that answers each
 *          listed entitlement with its grant, ready for `.override(EntitlementSource, fakeEntitlements([...]))`. An
 *          entry names a class or a locked key (`billing`); a registered class and its key answer the same grant.
 * Boundary: test code only. Every scope gets the same grants; an entitlement not listed is not in the plan
 *           (`undefined`), so its calls refuse `entitlement_required`. Counts come from the real `EntitlementUsage`
 *           (the records the test created), never from here. A class gen has not registered matches only itself.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain fakes in the owning package's `./testing`); the template's test
 *                     (`fakeEntitlements([[ProductLimitEntitlement, 2]])`); STA-1225 (grant by key).
 */
import { EntitlementSource, entitlementKey } from "#core/index";
import type { EntitlementClass, EntitlementGrant, EntitlementKey } from "#core/index";

/** The key of a registered class or a well-formed key; `undefined` for anything `entitlementKey` refuses. */
function keyOf(entitlement: EntitlementClass | EntitlementKey): string | undefined {
  try {
    return entitlementKey(entitlement);
  } catch {
    return undefined;
  }
}

/**
 * A source whose plan grants exactly `grants`.
 *
 * @example
 * createTestingModule(CommerceModule)
 *   .override(EntitlementSource, fakeEntitlements([[ProductLimitEntitlement, 2], ["billing", true]]))
 *   .compile();
 */
export function fakeEntitlements(
  grants: readonly (readonly [EntitlementClass | EntitlementKey, EntitlementGrant])[] = [],
): EntitlementSource {
  const plan = new Map<EntitlementClass | EntitlementKey, EntitlementGrant>(grants);
  const grant = (entitlement: EntitlementClass | EntitlementKey): EntitlementGrant | undefined => {
    if (plan.has(entitlement)) return plan.get(entitlement);
    const key = keyOf(entitlement);
    if (key === undefined) return undefined;
    for (const [listed, value] of plan) if (keyOf(listed) === key) return value;
    return undefined;
  };
  return Object.assign(Object.create(EntitlementSource.prototype) as EntitlementSource, {
    grant: (entitlement: EntitlementClass | EntitlementKey) => Promise.resolve(grant(entitlement)),
  });
}
