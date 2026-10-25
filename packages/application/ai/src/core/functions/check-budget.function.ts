/**
 * Stackra file contract:
 * Purpose: `checkBudget(used, requested, budget)`, the meter check before a run: refuse a run over its token budget,
 *          and warn once usage reaches the budget's warning share.
 * Boundary: pure; the meter reads `used` and the caller estimates `requested`.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4 and enforcement: the meter check blocks a run over its token budget).
 */
import type { BudgetCheck } from "#core/types/budget-check.type";
import type { TokenBudget } from "#core/types/token-budget.type";

/**
 * Whether a run of `requested` tokens fits.
 *
 * @throws RangeError when a count is negative or not finite, or `warnAt` is outside 0 to 1.
 * @example
 * checkBudget(7_000, 1_500, { limit: 10_000, warnAt: 0.8 }); // { allowed: true, warn: true, remaining: 3_000 }
 */
export function checkBudget(used: number, requested: number, budget: TokenBudget): BudgetCheck {
  for (const count of [used, requested, budget.limit])
    if (!Number.isFinite(count) || count < 0)
      throw new RangeError(`checkBudget: token counts are finite and not negative, got ${count}`);
  if (!(budget.warnAt >= 0 && budget.warnAt <= 1))
    throw new RangeError(`checkBudget: warnAt is a share from 0 to 1, got ${budget.warnAt}`);
  const remaining = Math.max(0, budget.limit - used);
  return {
    allowed: requested <= remaining,
    warn: used + requested >= budget.limit * budget.warnAt,
    remaining,
  };
}
