/**
 * Stackra file contract:
 * Purpose: `E2E_CONTROL`, the test-only routes the end-to-end stack serves on the app's origin while it runs under
 *          `e2ePreset` (`STACKRA_E2E=1`): `seed` runs one seeder of a consumed service, `session` signs a test actor
 *          in and answers with the session cookie.
 * Boundary: paths only, spelled once for `seed` and `loginAs`. Both take a JSON `POST`; any answer other than 2xx is a
 *           failed setup. Never served outside the e2e stack.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6); ADR 0182 (the ephemeral end-to-end stack).
 */

/**
 * The control routes of the e2e stack.
 *
 * @example
 * await fetch(new URL(E2E_CONTROL.seed, baseURL), { method: "POST", body: JSON.stringify({ key: "orders.demo" }) });
 */
export const E2E_CONTROL = Object.freeze({
  /** `POST { key }`: runs the seeder keyed `<module>.<profile>` in the service that owns it. */
  seed: "/__stackra/e2e/seed",
  /** `POST { role, tenant, memberships? }`: signs a test actor in; the answer sets the session cookie. */
  session: "/__stackra/e2e/session",
});
