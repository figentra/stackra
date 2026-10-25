/**
 * Stackra file contract:
 * Purpose: `ActionResult<O>`, how one run of an action from a client came out: sent, with the decoded answer, or queued
 *          offline, to be sent by the mutation queue when the network returns.
 * Boundary: a type only. A refusal is never a result: the run rejects with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (offline queue); ADR 0227 (no sync engine).
 */

/** The outcome of running an action. */
export type ActionResult<O> =
  | {
      /** The call was sent and answered. */
      readonly queued: false;
      /** The decoded answer. */
      readonly data: O;
    }
  | {
      /** The network was down and the action may be queued, so the queue holds it now. */
      readonly queued: true;
    };
