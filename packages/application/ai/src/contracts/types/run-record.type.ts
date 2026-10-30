/**
 * Stackra file contract:
 * Purpose: `RunRecord`, one agent run: its conversation and agent, the acting principal and where it acts, its
 *          status, the tool call it is parked on (an approval, or a client tool), how many steps it took, and when it started and ended.
 * Boundary: a type only; the `RunStore` answers it. No prompt or response text (ADR 0100 decision 9): that lives in
 *           the conversation's messages. The actor is the agent principal whose `onBehalfOf` names the human.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 3, 9 and 10: `ai_runs`); STA-781; ADR 0490 (decision 4).
 */
import type { Actor, ScopeRef } from "@stackra/contracts";

import type { RunStatus } from "#contracts/enums/run-status.enum";
import type { ClientToolPending } from "#contracts/types/client-tool-pending.type";
import type { RecordScope } from "#contracts/types/record-scope.type";

/** A stored run. */
export interface RunRecord {
  /** The run's public id. */
  readonly id: string;

  /** The conversation it answers in. */
  readonly conversationId: string;

  /** The agent's key. */
  readonly agent: string;

  /** The acting agent principal, with the human in `onBehalfOf`. */
  readonly actor: Actor;

  /** The scope node it acts in; absent for a platform run. */
  readonly scope?: ScopeRef;

  /** The record it works in; absent when none. */
  readonly record?: RecordScope;

  /** Where it stands. */
  readonly status: RunStatus;

  /** The parked tool call while `waiting_approval`. */
  readonly pending?: { readonly approvalId: string; readonly toolCallId: string };

  /** The client tool call it is parked on while `waiting_client_tool`. */
  readonly clientPending?: ClientToolPending;

  /** The steps taken so far. */
  readonly steps: number;

  /** The error or refusal code of a failed run. */
  readonly errorCode?: string;

  /** When it was created. */
  readonly startedAt: Date;

  /** When it completed or failed. */
  readonly finishedAt?: Date;
}
