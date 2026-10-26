/**
 * Stackra file contract:
 * Purpose: `PayInput`, one variable pay input for one employee in a pay period: the employee's id in the payroll
 *          provider, the kind, the provider's pay code, and the quantity (hours, sessions) or the amount (tips,
 *          commission).
 * Boundary: a type only. The employee id and the pay code come from the tenant's mapping (data), so the input names
 *           no person and no provider's code in code. A quantity kind carries `quantity`; an amount kind carries
 *           `amount`; the connector refuses the other shape.
 * Runtime: isomorphic
 * Governing contract: RV-50; RV-26; ADR 0422 (decision 5).
 */
import type { Money } from "@stackra/money";

import type { PayInputKind } from "#contracts/enums/pay-input-kind.enum";

/** One pay input. */
export interface PayInput {
  /** The employee's id in the payroll provider, from the tenant's mapping. */
  readonly employee: string;

  /** What it counts. */
  readonly kind: PayInputKind;

  /** The provider's pay code for it, from the tenant's mapping. */
  readonly payCode: string;

  /** Hours or sessions, positive; set for a quantity kind only. */
  readonly quantity?: number;

  /** Tips or commission, positive; set for an amount kind only. */
  readonly amount?: Money;
}
