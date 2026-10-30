/**
 * Stackra file contract:
 * Purpose: `RunChange`, what `RunStore.update` changes on a run: its status, the parked approval or client tool call
 *          (`null` clears it), the step count, an error code and when it finished.
 * Boundary: a type only, shared by the port and both drivers. No text (ADR 0100 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2, 3 and 10); ADR 0490 (decision 4); STA-1631.
 */
import type { RunStatus } from "#contracts/enums/run-status.enum";
import type { ClientToolPending } from "#contracts/types/client-tool-pending.type";

/** One change to a stored run. */
export interface RunChange {
  /** Where the run stands now. */
  readonly status: RunStatus;

  /** The approval it parks on; `null` clears the park. */
  readonly pending?: { readonly approvalId: string; readonly toolCallId: string } | null;

  /** The client tool call it parks on; `null` clears the park. */
  readonly clientPending?: ClientToolPending | null;

  /** The steps taken so far. */
  readonly steps?: number;

  /** The error or refusal code of a failed run. */
  readonly errorCode?: string;

  /** When it completed or failed. */
  readonly finishedAt?: Date;
}
