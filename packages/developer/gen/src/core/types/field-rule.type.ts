/**
 * Stackra file contract:
 * Purpose: `FieldRule`, one constraint decorator on a shape field as gen read it: `@Str`, `@Int`, `@Num`, `@List` or
 *          `@Trim`, with its constant options.
 * Boundary: a type only. Options are evaluated constants; a non-constant argument is a `shape_rule_not_constant`
 *           error before a rule is ever built.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 6 and 26); ADR 0095 as amended by 0294.
 */

/** One field rule. */
export interface FieldRule {
  /** The decorator name. */
  readonly name: "Str" | "Int" | "Num" | "List" | "Trim" | "Lowercase";

  /** Its options (`{ min: 1, max: 120 }`); `{}` when it takes none. */
  readonly options: Readonly<Record<string, unknown>>;
}
