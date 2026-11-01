/**
 * Stackra file contract:
 * Purpose: the `ActorStatusCheck` port: what the approval stage asks identity about a requester when a parked call is
 *          verified or executed: the requester is still active and every agent delegation in their chain is unrevoked
 *          and unexpired (S6), and their sessions were not revoked and their factors not reset since the request
 *          (FR-016 (e)).
 * Boundary: an abstract class that is its own token, keyed `actions.ActorStatusCheck`. Each method resolves when the
 *           check passes and rejects with a refusal when it does not (`forbidden`, `step_up_required`); any other
 *           rejection means identity could not answer, which the pipeline turns into a retryable refusal and never
 *           reads as a pass. A declared approval stage with no driver bound fails closed. `@stackra/identity` ships
 *           the real driver (STA-1741); the memory driver ships in `./testing`. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (verify, step-up at execution); ADR 0207 (decision 1); STA-1724 FR-008, FR-016.
 */
import { Port } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

/**
 * Reads whether a requester may still be acted for.
 *
 * @example
 * export class IdentityActorStatusCheckDriver extends Driver(ActorStatusCheck) {
 *   async requireActive(actor: Actor): Promise<void> {
 *     if (!(await this.identity.isActive(actor))) throw ForbiddenError.create();
 *   }
 * }
 */
export abstract class ActorStatusCheck extends Port {
  /** Type-only port key, so `DriverName<ActorStatusCheck>` narrows to this port's drivers. */
  declare readonly "~key": "actions.ActorStatusCheck";

  /**
   * Resolves when `actor` is active and every delegation in its `onBehalfOf` chain is unrevoked and unexpired;
   * rejects `forbidden` otherwise.
   */
  abstract requireActive(actor: Actor): Promise<void>;

  /**
   * Resolves when `actor`'s sessions were not revoked and its factors not reset after `since`; rejects
   * `step_up_required` otherwise.
   */
  abstract requireUnchangedSince(actor: Actor, since: Date): Promise<void>;
}
