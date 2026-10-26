/**
 * Stackra file contract:
 * Purpose: `MemoryPayrollConnector`, the memory driver of the `PayrollConnector` contract: batches held in this
 *          process, with the contract's rules (checked by `assertPayInputs`, one push per idempotency key, `find` by
 *          key), so a pay-input export runs end to end in a test or a local host with no payroll provider.
 * Boundary: a plain class implementing the contract, not a Connection: no credential and no provider call. An employee
 *           it is told it does not know (`unknownEmployees`) is refused as a provider refuses one, so a caller's
 *           refusal path is testable. Receipts are `pib_<n>`; `pushed` lists what arrived, oldest first.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver per capability); ADR 0269 (decision 3); ADR 0422
 *                     (decision 5).
 */
import type { PayInputBatch, PayInputReceipt, PayrollConnector } from "#contracts/index";
import { assertPayInputs, ProviderRefusedError } from "#core/index";

/**
 * Pay inputs in memory.
 *
 * @example
 * const payroll = new MemoryPayrollConnector();
 * const receipt = await payroll.pushPayInputs(batch, "run_1");
 */
export class MemoryPayrollConnector implements PayrollConnector {
  /** Every batch pushed, oldest first. */
  readonly pushed: PayInputBatch[] = [];

  /** Idempotency key to receipt. */
  private readonly receipts = new Map<string, PayInputReceipt>();

  /** Employee ids the provider refuses. */
  private readonly unknown: ReadonlySet<string>;

  /**
   * @param options - `unknownEmployees`, the employee ids this provider refuses.
   */
  constructor(options: { readonly unknownEmployees?: readonly string[] } = {}) {
    this.unknown = new Set(options.unknownEmployees ?? []);
  }

  /** Accepts `batch` once per `idempotencyKey`, refusing an unknown employee. */
  async pushPayInputs(batch: PayInputBatch, idempotencyKey: string): Promise<PayInputReceipt> {
    const existing = this.receipts.get(idempotencyKey);
    if (existing !== undefined) return existing;
    assertPayInputs(batch);
    if (batch.inputs.some((input) => this.unknown.has(input.employee)))
      throw ProviderRefusedError.create({
        provider: "memory",
        status: 422,
        code: "unknown_employee",
      });
    const receipt = Object.freeze({
      id: `pib_${this.receipts.size + 1}`,
      accepted: batch.inputs.length,
    });
    this.pushed.push(batch);
    this.receipts.set(idempotencyKey, receipt);
    return receipt;
  }

  /** The receipt stored for `idempotencyKey`, or `null`. */
  async findPayInputs(idempotencyKey: string): Promise<PayInputReceipt | null> {
    return this.receipts.get(idempotencyKey) ?? null;
  }
}
