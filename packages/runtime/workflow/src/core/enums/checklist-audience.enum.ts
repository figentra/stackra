/**
 * Stackra file contract:
 * Purpose: `ChecklistAudience`, whose progress a checklist step counts: the scope's (one completion for the whole
 *          tenant or node: connect a payment provider) or each user's (every user completes it: set up two-factor).
 * Boundary: an `Enum.of` value plus the type of the same name; a checklist template names it per step, so it is seed
 *           data, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 2); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** Whose progress a step counts. */
export const ChecklistAudience = Enum.of({
  /** Done once for the scope, by anyone in it. */
  Scope: "scope",
  /** Done by each user for themselves. */
  User: "user",
});

/** One of the codes above. */
export type ChecklistAudience = Enum.Value<typeof ChecklistAudience>;
