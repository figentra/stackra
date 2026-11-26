/**
 * Stackra file contract:
 * Purpose: `registerSeederDeps`, what a member's generated test setup calls with each seeder and the tokens its
 *          constructor takes, so the testing module's `.seed()` builds the seeder with them injected.
 * Boundary: records only; a later call for the same class replaces its tokens.
 * Runtime: node
 * Governing contract: ADR 0190; ADR 0263 (constructor injection by type); STA-1698.
 */
import type { AnyClass, Token } from "@stackra/container";

import type { Seeder } from "#core/bases/seeder.base";
import { SEEDER_DEPS } from "#testing/constants/seeder-deps.constant";

/**
 * Records each seeder's constructor tokens.
 *
 * @example
 * registerSeederDeps([[OrdersMinimalSeeder, [repositoryOf(Order)]]]);
 */
export function registerSeederDeps(
  rows: readonly (readonly [AnyClass<Seeder>, readonly Token<object>[]])[],
): void {
  for (const [type, deps] of rows) SEEDER_DEPS.set(type, deps);
}
