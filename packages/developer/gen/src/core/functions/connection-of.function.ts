/**
 * Stackra file contract:
 * Purpose: `connectionOf`, the connection an Integration is served by: of the member's connections partnered with it,
 *          the one named after it (`StripeIntegration` → `StripeConnection`), else the first, so a subclass that only
 *          inherits its base's integration never displaces the base's own connection.
 * Boundary: pure. Partners come from discovery (`pairSubclassConnections` for a subclassed connection).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 5: partners); ADR 0308 (rules 15 and 16).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";

/**
 * The connection of the Integration class `integration`, or undefined when none is partnered with it.
 *
 * @example
 * connectionOf(ir.classes, "StripeIntegration")?.name; // "StripeConnection"
 */
export function connectionOf(
  classes: readonly DeclaredClass[],
  integration: string,
): DeclaredClass | undefined {
  const partnered = classes.filter(
    (candidate) => candidate.kind === "connection" && candidate.partner?.name === integration,
  );
  const named = `${integration.replace(/Integration$/, "")}Connection`;
  return partnered.find((candidate) => candidate.name === named) ?? partnered[0];
}
