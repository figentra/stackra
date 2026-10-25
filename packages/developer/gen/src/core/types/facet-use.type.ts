/**
 * Stackra file contract:
 * Purpose: `FacetUse`, one application of a decorator made by `createDecorator` that gen found on a class or one of its
 *          members, with its constant argument: what the manifest's facet list and the Explorer conformance test read.
 * Boundary: a type only. A class-target facet applies to every public method of the class, so its targets are
 *           `Class.method` names, which is what the facet's Explorer wraps.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: decorators are facets made by createDecorator); ADR 0144 as amended by
 *                     0263 (Explorers and conformance).
 */

/** One decorator application. */
export interface FacetUse {
  /** The decorator's exported name (`AccessLogged`). */
  readonly name: string;

  /** Its kind code, the snake_case of the name (`access_logged`). */
  readonly kind: string;

  /** What it decorates. */
  readonly target: "class" | "field" | "method";

  /** The decorated member, for a field or method facet. */
  readonly member?: string;

  /** The constant argument it was called with; `undefined` for a bare decorator. */
  readonly options: unknown;

  /** The module specifier it was imported from. */
  readonly from: string;
}
