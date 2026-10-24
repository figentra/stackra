/**
 * Stackra file contract:
 * Purpose: `memberFacts(member)`, one member's entry in the runway facts together with the facts it came from.
 * Boundary: internal; the readers share it so every one fails the same way for a member the facts do not hold.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { runwayFacts } from "#core/functions/runway-facts.function";
import type { RunwayFacts } from "#core/types/runway-facts.type";

/**
 * The facts and the member's entry.
 *
 * @throws RunwayUnresolvedError when the facts hold no entry for `member`.
 * @example
 * memberFacts("console").member.port; // 5173
 */
export function memberFacts(member: string): {
  facts: RunwayFacts;
  member: RunwayFacts["members"][string];
} {
  const facts = runwayFacts();
  const entry = Object.hasOwn(facts.members, member) ? facts.members[member] : undefined;
  if (entry === undefined) {
    throw new RunwayUnresolvedError(
      `The runway facts (${facts.environment}) hold no member "${member}": is it a member whose runway.yaml ` +
        "names a dev port, and has `stackra dev` run since it was added?",
    );
  }
  return { facts, member: entry };
}
