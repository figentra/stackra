/**
 * Stackra file contract:
 * Purpose: `registerWiring`, how a test process learns the generated wirings `createTestingModule` boots: gen's vitest
 *          setup registers each dependency's wiring, then the member's own.
 * Boundary: test-process state only; registering a member again replaces its wiring and moves it last, so the most
 *           recent registration wins where wirings overlap.
 * Runtime: node
 * Governing contract: ADR 0263 (decisions 11 and 12); ADR 0269 (decision 3).
 */
import type { Wiring } from "#core/index";
import { REGISTERED_WIRINGS } from "#testing/constants/registered-wirings.constant";

/**
 * Makes `wiring` available to every testing module of this process.
 *
 * @example
 * import { wiring } from "#stackra/wiring";
 * registerWiring(wiring);
 */
export function registerWiring(wiring: Wiring): void {
  REGISTERED_WIRINGS.delete(wiring.member);
  REGISTERED_WIRINGS.set(wiring.member, wiring);
}
