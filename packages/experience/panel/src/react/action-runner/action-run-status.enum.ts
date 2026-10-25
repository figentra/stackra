/**
 * Stackra file contract:
 * Purpose: `ActionRunStatus`, how one run of the action runner ended: done, cancelled at the confirmation, or refused.
 * Boundary: an enum (`Enum.of`) carried by `ActionRun`.
 * Runtime: isomorphic
 * Governing contract: ADR 0139 (declared confirmation); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * The end of one run.
 *
 * @example
 * if ((await run(CancelOrderAction, { orderId })).status === ActionRunStatus.Done) close();
 */
export const ActionRunStatus = Enum.of({
  /** The action ran and answered. */
  Done: "done",
  /** The user declined the confirmation; nothing was sent. */
  Cancelled: "cancelled",
  /** The producer refused the call; the refusal was shown. */
  Refused: "refused",
});

/** One of the codes above. */
export type ActionRunStatus = Enum.Value<typeof ActionRunStatus>;
