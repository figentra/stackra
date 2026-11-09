/**
 * Stackra file contract:
 * Purpose: `seederOf`, how a seeder is built wherever seeders run (the seed entry's `runSeeders`, the testing module's
 *          `.seed()`): the container's binding when it has one, else the class built with its constructor's tokens
 *          resolved in the container (gen lists them, since a seeder is not a binding), else with no arguments.
 * Boundary: pure over the container it is given; resolves nothing it is not asked for.
 * Runtime: node
 * Governing contract: ADR 0190 (seed profiles); ADR 0263 (constructor injection by type); STA-1698, STA-1709.
 */
import type { AnyClass, Container, Token } from "@stackra/container";

import type { Seeder } from "#core/bases/seeder.base";

/**
 * The seeder `type`, its dependencies injected.
 *
 * @example
 * const seeder = seederOf(container, OrdersMinimalSeeder, [repositoryOf(Order)]);
 */
export function seederOf(
  container: Pick<Container, "has" | "get">,
  type: AnyClass<Seeder>,
  deps: readonly Token<object>[] = [],
): Seeder {
  if (container.has(type)) return container.get(type);
  return Reflect.construct(
    type,
    // The two `get` overloads (a class, a named token) each take one half of the `Token` union.
    deps.map((token) => container.get(token as AnyClass<object>)),
  ) as Seeder;
}
