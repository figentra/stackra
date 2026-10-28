/**
 * Stackra file contract:
 * Purpose: `PayrollConnector`, what a payroll provider's Connection implements (ZenHR, Kombo, Gusto): push one pay
 *          period's variable inputs (hours, sessions, tips, commission) once per idempotency key, and find the batch a
 *          key already pushed.
 * Boundary: an interface a provider Connection implements under `IntegrationCategory.Payroll`, not a container port:
 *           the tenant's Connection chooses the provider (ADR 0356 decision 2), resolved with `ProviderResolver` from
 *           the pack's `providers.payroll` list. Payroll itself (salary, deductions, WPS, Mudad, GOSI) stays with the
 *           tenant's provider (RV-50). The provider connectors live with the capability's owner; this package ships
 *           the contract and a memory implementation in `./testing`.
 * Runtime: isomorphic
 * Governing contract: RV-50; RV-26; R3-SO-05; ADR 0356 (decision 2); ADR 0355 (decision 1); ADR 0422 (decision 5).
 */
import type { PayInputBatch } from "#contracts/types/pay-input-batch.type";
import type { PayInputReceipt } from "#contracts/types/pay-input-receipt.type";

/**
 * A payroll provider account.
 *
 * @example
 * export class ZenHrConnection extends Connection<ZenHrIntegration> implements PayrollConnector { … }
 */
export interface PayrollConnector {
  /**
   * Pushes `batch` under `idempotencyKey`; a repeated key returns the first receipt and pushes nothing.
   *
   * @throws ProviderRefusedError when the provider refuses an input (an unknown employee or pay code).
   */
  pushPayInputs: (batch: PayInputBatch, idempotencyKey: string) => Promise<PayInputReceipt>;

  /**
   * The receipt of the batch pushed under `idempotencyKey`, for a call whose answer was lost.
   *
   * @returns null when none was pushed.
   */
  findPayInputs: (idempotencyKey: string) => Promise<PayInputReceipt | null>;
}
