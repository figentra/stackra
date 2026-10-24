/**
 * Stackra file contract:
 * Purpose: `fakeEntitlements(grants)`, the helper a test sets a plan with: an `EntitlementSource` that answers each
 *          listed entitlement with its grant, ready for `.override(EntitlementSource, fakeEntitlements([...]))`.
 * Boundary: test code only. Every scope gets the same grants; an entitlement not listed is not in the plan
 *           (`undefined`), so its calls refuse `entitlement_required`. Counts come from the real `EntitlementUsage`
 *           (the records the test created), never from here.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain fakes in the owning package's `./testing`); the template's test
 *                     (`fakeEntitlements([[ProductLimitEntitlement, 2]])`).
 */
import { EntitlementSource } from "#core/index";
import type { EntitlementClass, EntitlementGrant } from "#core/index";

/**
 * A source whose plan grants exactly `grants`.
 *
 * @example
 * createTestingModule(CommerceModule)
 *   .override(EntitlementSource, fakeEntitlements([[ProductLimitEntitlement, 2], [ReportsEntitlement, true]]))
 *   .compile();
 */
export function fakeEntitlements(
  grants: readonly (readonly [EntitlementClass, EntitlementGrant])[] = [],
): EntitlementSource {
  const plan = new Map<EntitlementClass, EntitlementGrant>(grants);
  return Object.assign(Object.create(EntitlementSource.prototype) as EntitlementSource, {
    grant: (entitlement: EntitlementClass) => Promise.resolve(plan.get(entitlement)),
  });
}
