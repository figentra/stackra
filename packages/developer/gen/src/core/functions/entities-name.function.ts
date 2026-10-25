/**
 * Stackra file contract:
 * Purpose: `entitiesName`, the name of a module's entity schema list in its generated entity file and in a package's
 *          `node` entry: the module key in SCREAMING_SNAKE with `_ENTITIES` (`SCOPE_ENTITIES`).
 * Boundary: pure. The entity emitter, the package entries and a host's registrations all call it, so a host imports
 *           the name a package exports.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (module-level constants are SCREAMING_SNAKE); ADR 0097 (decision 3).
 */

/**
 * The entity list name of `module`.
 *
 * @example
 * entitiesName("loyalty_kit"); // "LOYALTY_KIT_ENTITIES"
 */
export function entitiesName(module: string): string {
  return `${module.toUpperCase()}_ENTITIES`;
}
