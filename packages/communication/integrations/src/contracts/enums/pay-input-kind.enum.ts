/**
 * Stackra file contract:
 * Purpose: `PayInputKind`, what one pay input counts: hours worked, sessions delivered, tips received or commission
 *          earned, the variable inputs a payroll provider pays from.
 * Boundary: an `Enum.of` value plus the type of the same name. Hours and sessions are quantities; tips and commission
 *           are amounts. The provider's pay code for each kind is the tenant's mapping data, never code. Salary,
 *           deductions and statutory items stay with the provider (RV-50: no own payroll).
 * Runtime: isomorphic
 * Governing contract: RV-50; RV-26; R3-SO-05; ADR 0422 (decision 5).
 */
import { Enum } from "@stackra/contracts";

/**
 * The pay input kinds.
 *
 * @example
 * const input: PayInput = { employee: "emp_123", kind: PayInputKind.Hours, payCode: "OT1", quantity: 7.5 };
 */
export const PayInputKind = Enum.of({
  /** Hours worked, a quantity. */
  Hours: "hours",
  /** Sessions or appointments delivered, a quantity. */
  Sessions: "sessions",
  /** Tips received, an amount. */
  Tips: "tips",
  /** Commission earned, an amount. */
  Commission: "commission",
});

/** One of the codes above. */
export type PayInputKind = Enum.Value<typeof PayInputKind>;
