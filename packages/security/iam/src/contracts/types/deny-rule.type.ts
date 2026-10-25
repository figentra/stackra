/**
 * Stackra file contract:
 * Purpose: `DenyRule`, an explicit deny: a permission (or a wildcard) refused to an audience, optionally only for
 *          records a `@stackra/rules` condition matches. A deny always beats a grant.
 * Boundary: a type only, and data that references registered code: the condition names registered record fields and
 *           the operators of their types, never an expression (ADR 0331 decision 10, ADR 0154). A rule with a
 *           condition is tested only where there is a record (`ctx.authorize(record)`), and denies there when the
 *           record's model registered no fact source.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3: structured conditions and explicit deny, deny overrides allow); ADR 0331
 *                     (decision 11: IAM reuses the operator set).
 */
import type { Condition } from "@stackra/rules";

import type { Audience } from "#contracts/types/audience.type";

/**
 * An explicit deny.
 *
 * @example
 * const noRefundsInEu: DenyRule = { permission: "billing.invoice.refund", audience: euScope };
 */
export interface DenyRule {
  /** The permission key refused (`billing.invoice.refund`), or a wildcard (`billing.*`, `*`). */
  readonly permission: string;

  /** Who it refuses; absent for every principal. */
  readonly audience?: Audience;

  /** Refuses only records this condition matches (fields under the `record` fact source); absent for every record. */
  readonly condition?: Condition;

  /** An open break-glass grant passes this deny (an ethical wall a reviewed emergency may cross); absent: never. */
  readonly breakable?: boolean;
}
