/**
 * Stackra file contract:
 * Purpose: `DURABLE_ACTION_STORES`, the action store drivers a deployed environment may select: `postgres` and
 *          `valkey`, which survive a restart and are shared by every instance.
 * Boundary: internal. The names restate @stackra/actions' `STORE_DRIVERS` (runway does not import it): `memory` is
 *           the only other driver, and the actions config refuses it outside `dev` and `test` at boot (STA-2798).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement); ADR 0266 (decision 2); STA-2798.
 */

/** The store drivers that survive a restart and are shared by every instance. */
export const DURABLE_ACTION_STORES: readonly string[] = Object.freeze(["postgres", "valkey"]);
