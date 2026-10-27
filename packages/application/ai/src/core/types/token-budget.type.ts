/**
 * Stackra file contract:
 * Purpose: `TokenBudget`, a metered token budget: its limit and the share at which a warning is raised.
 * Boundary: a type only. Both values are data: the plan catalogue's rate card and the tenant's cap, never constants.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4: token budgets enforced with meters).
 */

/** One metered token budget: its limit and the share at which a warning is raised. */
export interface TokenBudget {
  /** The most tokens the period allows. */
  readonly limit: number;

  /** The share of the limit, from 0 to 1, from which a warning is raised. */
  readonly warnAt: number;
}
