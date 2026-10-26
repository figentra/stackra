/**
 * Stackra file contract:
 * Purpose: `PayInputBatch`, the pay inputs of one pay period pushed to the tenant's payroll provider at once: the
 *          period, our reference and the inputs.
 * Boundary: a type only. The period is whole days (`YYYY-MM-DD`, both inclusive) in the tenant's time zone, as the
 *           provider's pay calendar reads them. Our reference names the export run, so the provider shows where the
 *           batch came from.
 * Runtime: isomorphic
 * Governing contract: RV-50; ADR 0422 (decision 5).
 */
import type { PayInput } from "#contracts/types/pay-input.type";

/** One period's pay inputs. */
export interface PayInputBatch {
  /** The first day of the pay period (`2026-10-01`). */
  readonly from: string;

  /** The last day of the pay period, inclusive. */
  readonly to: string;

  /** Our export run's reference, kept on the provider's batch. */
  readonly reference: string;

  /** At least one input. */
  readonly inputs: readonly PayInput[];
}
