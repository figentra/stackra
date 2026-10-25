/**
 * Stackra file contract:
 * Purpose: `Decision`, what a policy method answers for one record (allow, deny or abstain) and what a visibility
 *          check answers for one record.
 * Boundary: an `Enum.of` value plus the type of the same name. Any deny wins; abstain leaves the permission (or, for
 *           visibility, the caller) as the whole answer. A policy method returning anything else is a bug.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (decision 4, as amended by 0294); ADR 0333 (decision 7: no default); ADR 0294
 *                     (decision 16: `Enum.of`).
 */
import { Enum } from "@stackra/contracts";

/**
 * The three answers.
 *
 * @example
 * return order.customerId === subject.id ? Decision.Allow : Decision.Deny;
 */
export const Decision = Enum.of({
  /** The record rule lets the call through. */
  Allow: "allow",
  /** The record rule refuses the call; beats every allow. */
  Deny: "deny",
  /** The record rule has no opinion. */
  Abstain: "abstain",
});

/** One of the codes above. */
export type Decision = Enum.Value<typeof Decision>;
