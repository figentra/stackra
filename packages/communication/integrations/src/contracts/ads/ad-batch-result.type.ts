/**
 * Stackra file contract:
 * Purpose: `AdBatchResult`, what an ad platform says of a batch of conversions or audience members: how many it took
 *          and which it refused, each with its reason.
 * Boundary: a type only. `refused` names conversions by `eventId` and audience members by their index in the batch,
 *           so no person's key is echoed back.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); STA-793.
 */

/**
 * A batch answer.
 *
 * @example
 * const result: AdBatchResult = { received: 2, refused: [{ ref: "order_43", reason: "event_time too old" }] };
 */
export interface AdBatchResult {
  /** How many the platform took. */
  readonly received: number;

  /** Each one refused: its `eventId`, or its index in the batch for an audience member. */
  readonly refused: readonly { readonly ref: string; readonly reason: string }[];
}
