/**
 * Stackra file contract:
 * Purpose: `DevInfraState`, the content of `.stackra/dev/infra.json`: the lane the dev compose started for and the
 *          opt-in containers started with it, which a member's `stackra dev` reads to get the same variables.
 * Boundary: type only; names and a number, never a value.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 3); STA-2664 (item 6).
 */

/** What the last `stackra dev` started. */
export type DevInfraState = {
  /** The dev lane. */
  readonly lane: number;
  /** The `when: opt-in` blocks started too. */
  readonly optIn: readonly string[];
};
