/**
 * Stackra file contract:
 * Purpose: `seed(key)`, runs one seeder (`orders.demo`) in the e2e stack before a journey, so each test starts from
 *          known data whatever ran before it.
 * Boundary: posts to the stack's `seed` control route on the project's `baseURL`; the stack finds the consumed service
 *           that owns the seeder. Only inside a test or a hook.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 6); ADR 0190 as amended by ADR 0294 (seeder keys `<module>.<profile>`).
 */
import { controlUrl } from "#e2e/control/control-url.function";
import { E2E_CONTROL } from "#e2e/control/e2e-control.constant";

/**
 * Asks the e2e stack to run the seeder `key`.
 *
 * @throws Error when the stack does not answer 2xx.
 * @example
 * test.beforeEach(async () => {
 *   await seed("orders.demo");
 * });
 */
export async function seed(key: string): Promise<void> {
  const response = await fetch(controlUrl(E2E_CONTROL.seed), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!response.ok)
    throw new Error(`seed("${key}") failed: the e2e stack answered ${response.status}`);
}
