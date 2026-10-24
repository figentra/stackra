/**
 * Stackra file contract:
 * Purpose: `UseActionResult<A>`, what `useAction` returns: `run(input)`, whether a run is in flight, whether the session
 *          holds the action's permission, and the last run's refusal.
 * Boundary: a type only. `isAllowed` decides presentation (hide or disable a button); the producer's pipeline still
 *           checks every call.
 * Runtime: browser, react-native
 * Governing contract: ADR 0260 (decision 4); ADR 0059 (offline queue); ADR 0208 (permissions).
 */
import type { ActionRef } from "#core/types/action-ref.type";
import type { ActionResult } from "#core/types/action-result.type";
import type { ClientError } from "#core/types/client-error.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

/** One action in a component. */
export interface UseActionResult<A extends ActionRef> {
  /**
   * Sends the action, or queues it while offline when it may be queued.
   *
   * @throws ClientError the producer's refusal, an invalid input, or the network error of an online-only action.
   */
  readonly run: (input: RefInput<A>) => Promise<ActionResult<RefOutput<A>>>;

  /** True while a run is in flight. */
  readonly isPending: boolean;

  /** Whether the session holds the action's permission; true when the host binds no session. */
  readonly isAllowed: boolean;

  /** The refusal of the last run; `null` after a run that succeeded or was queued. */
  readonly error: ClientError | null;
}
