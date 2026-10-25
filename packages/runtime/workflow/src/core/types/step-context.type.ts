/**
 * Stackra file contract:
 * Purpose: `StepContext`, the second parameter of a step and of an undo: the starting call's context (caller, locale,
 *          time zone, currency, market, the frozen clock), so a step hands it to an extension slot as the owner's
 *          context, plus the run and step ids, the step's idempotency key, its attempt and progress, the event
 *          recording and the heartbeat.
 * Boundary: a type only; the engine builds it per attempt from the run's journal, so a resumed run in another process
 *           sees the same caller. `now()` is one instant per attempt. `record(event)` keeps an event for the step's
 *           commit: an integration event is written to the outbox inside the step's transaction, a domain event is
 *           dispatched in process once it commits; a failed attempt drops both. `abortSignal` aborts at the step's
 *           timeout or a missed heartbeat.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (0294 note: `ctx.heartbeat`, `ctx.progress`); ADR 0294 (decision 27: events are
 *                     recorded, then shipped at commit); ADR 0305 (rule 23: a slot takes the owner's context); ADR 0102
 *                     (decision 2: steps are idempotent on the run).
 */
import type { ExtensionContext } from "@stackra/actions";
import type { Json, PublicId } from "@stackra/contracts";
import type { Event } from "@stackra/events";

/** The context of one attempt of a step. */
export interface StepContext extends ExtensionContext {
  /** The run's id. */
  readonly runId: PublicId<"wfr">;

  /** The step's name (an undo's method name while it compensates). */
  readonly step: string;

  /** `<runId>:<step>`, the same on every attempt: the idempotency key of an external call. */
  readonly stepKey: string;

  /** The attempt, from 1. */
  readonly attempt: number;

  /** What the step last reported through `heartbeat`, so a retry resumes from it; `undefined` before any. */
  readonly progress: Json | undefined;

  /** Keeps `event` for the step's commit; a failed attempt drops it. */
  record(event: Event): void;

  /** Reports liveness, with `progress` kept durably for a retry; resolves once it is stored. */
  heartbeat(progress?: Json): Promise<void>;
}
