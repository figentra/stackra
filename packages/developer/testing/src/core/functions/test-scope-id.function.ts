/**
 * Stackra file contract:
 * Purpose: `testScopeId(label?, { under })`, a test tenant id: the `scp_` id of the tenant's scope node, as
 *          `testScopeRef` hands it out, so a test that needs only the id stops writing fixed `ten_` or `scp_` ids.
 * Boundary: test code only; generic (no workspace import, ADR 0269 decision 2). A tenant id is its scope node's id
 *           (ADR 0327 d8), so `testScopeId("acme") === testScopeRef("acme").id`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decisions 2 and 3); ADR 0327 (decision 8); ADR 0135 (id format).
 */
import { testScopeRef } from "#core/functions/test-scope-ref.function";

/**
 * The tenant id of `label` under `options.under`; a new tenant's when `label` is left out.
 *
 * @throws RangeError when `label` is not one path label or `under` is not a path of them.
 * @example
 * const acme = testScopeId("acme"); // "scp_…", the same on every run
 * const other = testScopeId(); // a tenant no other call in the file has
 */
export function testScopeId(
  label?: string,
  options: { readonly under?: string } = {},
): `scp_${string}` {
  return testScopeRef(label, options).id;
}
