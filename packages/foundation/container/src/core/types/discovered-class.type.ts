/**
 * Stackra file contract:
 * Purpose: `DiscoveredClass<O>`, one result of `DiscoveryService.classesWith(D)`: a built instance whose class
 *          carries the class decorator `D`, with the class name and the value the decorator was given.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0144 (Explorers) as amended by 0263; ADR 0294 (decision 6: class facets).
 */

/** A built instance whose class carries a decorator, with that decorator's value. */
export interface DiscoveredClass<O> {
  /** The instance the container built. */
  readonly instance: object;

  /** The name of the instance's class, as `<Class>.<method>` targets use it. */
  readonly className: string;

  /** The value the decorator was given on the class (or on its nearest decorated ancestor). */
  readonly options: O;
}
