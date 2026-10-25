/**
 * Stackra file contract:
 * Purpose: `ModelRoute`, one row of a model route table: for a task type, a provider and model, the data regions the
 *          model is served in, and whether the provider keeps nothing (zero retention).
 * Boundary: a type only. The table is data: the product's route table per task (Bedrock first is a default row
 *           order, not code), with the tenant's own rows (bring-your-own keys) tried before it. A provider key is the
 *           driver's secret name, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 2: a routing table per task type, tenant overrides, own keys); ADR 0360
 *                     (decisions 13 to 15).
 */

/** One route. */
export interface ModelRoute {
  /** The task type it serves (`chat`, `embed`, `classify`). */
  readonly task: string;

  /** The provider driver key (`bedrock`, `anthropic`, `vllm`). */
  readonly provider: string;

  /** The provider's model id, handed to its driver; never resolved through a hosted gateway. */
  readonly model: string;

  /** The data regions the model is served in (`eu`, `me`, `us`). */
  readonly regions: readonly string[];

  /** Whether the provider retains no prompt or response. */
  readonly zeroRetention: boolean;
}
