/**
 * Stackra file contract:
 * Purpose: `SettingsRule`, one cross-field rule of a settings group: a comparison of the number at one path with the
 *          number at another.
 * Boundary: a type only, the shape of what `rules(r)` returns and of each entry gen writes to the generated settings
 *           (`{ kind: "at_most", a, b }`). The kinds are the closed set of ADR 0307 rule 22.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22: `rules(r)` is a closed set).
 */

/**
 * `a` compared with `b` by `kind`.
 *
 * @example
 * const rule: SettingsRule = { kind: "at_most", a: "cancellation.autoCancelAfterMinutes", b: "cancellation.maxAutoCancelAfterMinutes" };
 */
export interface SettingsRule {
  /** The comparison: `a < b`, `a <= b`, `a > b` or `a >= b`. */
  readonly kind: "less_than" | "at_most" | "greater_than" | "at_least";

  /** The path compared, relative to the group. */
  readonly a: string;

  /** The path it is compared with. */
  readonly b: string;
}
