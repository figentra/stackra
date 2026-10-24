/**
 * Stackra file contract:
 * Purpose: `DiscoveredTarget`, one target gen discovered for a decorator: `Class.method` (or `Class.field`), the class
 *          and member, and the constant value the decorator was given, which an Explorer's `targets()` must equal.
 * Boundary: a type only; a class decorator yields one target per public method of the class.
 * Runtime: node
 * Governing contract: ADR 0144 as amended by 0263 (Explorers and the conformance test); ADR 0294 (decision 6).
 */

/** One decorated target. */
export interface DiscoveredTarget<V = unknown> {
  /** `Class.member`, the form an Explorer reports. */
  readonly target: string;

  /** The class name. */
  readonly class: string;

  /** The method or field name. */
  readonly member: string;

  /** The decorator's constant value; undefined when bare or not a constant. */
  readonly options: V | undefined;
}
