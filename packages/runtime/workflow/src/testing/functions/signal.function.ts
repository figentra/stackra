/**
 * Stackra file contract:
 * Purpose: `signal`, the in-process test driver's send: it holds a signal on the current testing app's engine, as
 *          `ctx.signal` does, and ticks once, so a run waiting on it resumes before the call resolves.
 * Boundary: test only; it sends as the engine sends, outside any scope session. Time does not move: a wait that has
 *           passed is timed out by `app.workflows.advanceClock`, not here.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0152 (0294 note: signals, early signals held).
 */
import type { AnyClass } from "@stackra/container";

import type { Signal } from "#core/index";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import { advanceWorkflows } from "#testing/functions/advance-workflows.function";

/**
 * Sends `payload` as `type` with `correlation`, then resumes the run waiting on it.
 *
 * @throws Error before any testing app compiled; TypeError when `type` is not a signal.
 * @example
 * await signal(RedemptionConfirmed, { memberId, reference: "ord_2" }, { memberId, reference: "ord_2" });
 */
export async function signal(
  type: AnyClass<Signal>,
  payload: object,
  correlation?: string | object,
): Promise<void> {
  const harness = CURRENT_WORKFLOWS.value;
  if (harness === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before signal()",
    );
  await harness.runner.hold(type, payload, correlation);
  await advanceWorkflows(0);
}
