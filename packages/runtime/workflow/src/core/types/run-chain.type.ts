/**
 * Stackra file contract:
 * Purpose: `RunChain`, where a triggered automation run sits in an event chain: how deep it is (1 for a run an
 *          outside event started, its parent's depth plus one for a run an earlier run's event started) and the
 *          automations of the chain, root first, itself last.
 * Boundary: a type only. A document run keeps it in its input (`DocumentInput.chain`), so a later trigger reads it from
 *           the run its event came from (the event's correlation is that run's step key); the engine refuses a start
 *           past `workflow.maxChainDepth` or of an automation already in the chain.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); OS-232 (chain depth 3, configured); ADR 0141 (correlation).
 */

/** A run's place in an event chain. */
export interface RunChain {
  /** 1 for a run an outside event started; its parent's depth plus one otherwise. */
  readonly depth: number;

  /** The automation ids of the chain, root first, this run's last. */
  readonly automations: readonly string[];
}
