/**
 * Stackra file contract:
 * Purpose: `testScopeRef(label?, { under })`, a test tenant's scope reference: the path `<under>.<label>` and the
 *          `scp_` id hashed from it. With no label it hands out the next of `tenant_1`, `tenant_2`, … so each call is a
 *          new tenant.
 * Boundary: test code only; generic (no workspace import, ADR 0269 decision 2). A tenant is the scope node at the
 *           tenant level, so the reference's id is the tenant id (`isTenantId` in @stackra/tenancy accepts it). The
 *           default parent is `platform`, the default root; a deployment whose tenants sit lower passes `under`
 *           (`platform.acme`). The id equals `scopeRefOf(path).id` from `@stackra/scope/testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decisions 2 and 3); ADR 0327 (decisions 3 and 8); ADR 0135 (id format).
 */
import { scopeIdOf } from "#core/functions/scope-id-of.function";
import type { TestScopeRef } from "#core/types/test-scope-ref.type";

/** One path label: 1 to 63 of `a-z`, `0-9` and `_`. */
const LABEL = /^[a-z0-9_]{1,63}$/;

/** The count behind the generated labels, for the life of the test file's module. */
const issued = { count: 0 };

/**
 * The scope reference of the tenant `label` under `options.under`.
 *
 * @throws RangeError when `label` is not one path label or `under` is not a path of them.
 * @example
 * const acme = testScopeRef("acme"); // { id: "scp_…", path: "platform.acme" }
 * const shop = testScopeRef("shop", { under: "platform.acme" }); // path "platform.acme.shop"
 * const fresh = testScopeRef(); // path "platform.tenant_1", then "platform.tenant_2", …
 */
export function testScopeRef(
  label?: string,
  options: { readonly under?: string } = {},
): TestScopeRef {
  const own = label ?? `tenant_${(issued.count += 1)}`;
  const under = options.under ?? "platform";
  if (!LABEL.test(own)) throw new RangeError(`"${own}" is not a scope path label`);
  if (!under.split(".").every((part) => LABEL.test(part)))
    throw new RangeError(`"${under}" is not a scope path`);
  const path = `${under}.${own}`;
  return Object.freeze({ id: scopeIdOf(path), path });
}
