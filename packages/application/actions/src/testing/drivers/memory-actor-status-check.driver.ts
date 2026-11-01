/**
 * Stackra file contract:
 * Purpose: `MemoryActorStatusCheckDriver`, the "memory" `ActorStatusCheck`: every actor is active and unchanged, except
 *          the ones a test deactivated or marked changed, and an outage a test switched on.
 * Boundary: test only; identity ships the real driver (STA-1741). Refuses `forbidden` for an inactive actor or any
 *           chain member, `step_up_required` for a chain member changed after the given instant, and rejects with a
 *           plain error during an outage (which the pipeline turns into a retryable refusal).
 * Runtime: node
 * Governing contract: ADR 0509 (verify, FR-016 (e)); STA-1724 FR-008, FR-016.
 */
import { Driver } from "@stackra/container";
import type { Actor } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";

import { ActorStatusCheck } from "#contracts/ports/actor-status-check.port";
import { StepUpRequiredError } from "#testing/errors/step-up-required.error";

/**
 * Answers active and unchanged unless told otherwise.
 *
 * @example
 * const actors = new MemoryActorStatusCheckDriver();
 * actors.deactivate(requester.id); // the next verify refuses forbidden
 */
export class MemoryActorStatusCheckDriver extends Driver(ActorStatusCheck) {
  private readonly inactive = new Set<string>();

  private readonly changed = new Map<string, Date>();

  private down = false;

  /** Marks `id` inactive (or its delegation revoked). */
  deactivate(id: string): void {
    this.inactive.add(id);
  }

  /** Marks `id`'s sessions revoked or factors reset at `at`. */
  markChanged(id: string, at: Date): void {
    this.changed.set(id, at);
  }

  /** Makes every read reject, as an identity outage does. */
  setOutage(down: boolean): void {
    this.down = down;
  }

  /** Resolves unless the actor or a link of its chain is inactive. */
  async requireActive(actor: Actor): Promise<void> {
    this.alive();
    for (let link: Actor | undefined = actor; link !== undefined; link = link.onBehalfOf)
      if (this.inactive.has(link.id)) throw ForbiddenError.create();
  }

  /** Resolves unless a link of the chain changed after `since`. */
  async requireUnchangedSince(actor: Actor, since: Date): Promise<void> {
    this.alive();
    for (let link: Actor | undefined = actor; link !== undefined; link = link.onBehalfOf) {
      const at = this.changed.get(link.id);
      if (at !== undefined && at.getTime() > since.getTime()) throw StepUpRequiredError.create();
    }
  }

  private alive(): void {
    if (this.down) throw new Error("identity is unavailable");
  }
}
