/**
 * Stackra file contract:
 * Purpose: the `EntitlementUsage` port: how many of a limit's counted model exist in a scope now, so the plan driver
 *          can refuse the create that would pass the limit.
 * Boundary: an abstract class that is its own token, implemented by the package that stores the counted models (the
 *           data layer); this package never reads a table. Counts live records only, the same ones a list returns.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 3 and 7: a limit names what it counts); ADR 0263 (ports resolve by type).
 */
import type { AnyClass } from "@stackra/container";
import { Port, type PublicId } from "@stackra/contracts";

/**
 * Counts the live records of one model in one scope.
 *
 * @example
 * export class ModelEntitlementUsageDriver extends Driver(EntitlementUsage) {
 *   count(model: AnyClass, scope: PublicId | undefined): Promise<number> {
 *     return this.orm.count(model, scope);
 *   }
 * }
 */
export abstract class EntitlementUsage extends Port {
  /**
   * How many live records of `model` exist in `scope`.
   *
   * @param scope - the id of the call's `ScopeRef`, the scope-tree node it acts in; `undefined` for a platform-wide
   *                call. shortcut: the id only (as `EntitlementSource.grant`); take the `ScopeRef` with it.
   */
  abstract count(model: AnyClass, scope: PublicId | undefined): Promise<number>;
}
