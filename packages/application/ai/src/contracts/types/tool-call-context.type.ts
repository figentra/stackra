/**
 * Stackra file contract:
 * Purpose: `ToolCallContext`, what a run hands the `ToolDispatcher` with one tool call: the acting agent principal,
 *          where it acts, the run and tool call ids, the Idempotency-Key `runId:toolCallId`, the granted approval
 *          when the call resumes after one, and whether the calling session is switched to bypass.
 * Boundary: a type only. The dispatcher passes these to the action pipeline unchanged; the approval id is checked by
 *           the pipeline's approval gate, never trusted here. `bypass` is the session's wish only: the gate's
 *           `resolveApproval` honours it where the organisation's policy allows and never past the never-bypass floor.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 3: the agent actor and the idempotency key); ADR 0098 (decision 3);
 *                     STA-1256 (OS ai SPEC Stackra gap 4: the session's bypass switch).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { RecordScope } from "#contracts/types/record-scope.type";

/** One tool call's context. */
export interface ToolCallContext {
  /** The acting agent principal, with the human in `onBehalfOf`. */
  readonly actor: Actor;

  /** The scope node the run acts in. */
  readonly scope?: ScopeRef;

  /** The record the run works in. */
  readonly record?: RecordScope;

  /** The run. */
  readonly runId: string;

  /** The model's tool call id. */
  readonly toolCallId: string;

  /** `runId:toolCallId`. */
  readonly idempotencyKey: string;

  /** The granted approval of a resumed call. */
  readonly approvalId?: string;

  /** Whether the calling session is switched to bypass; off when absent (a queued run has no session). */
  readonly bypass?: boolean;
}
