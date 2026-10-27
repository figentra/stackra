/**
 * Stackra file contract:
 * Purpose: `useAction`, a consumed action in a component: `run(input)` sends it through the client transport, then
 *          invalidates the queries it changes; offline, an action the offline map lets the queue hold is queued and
 *          `run` resolves `{ queued: true }`.
 * Boundary: no confirmation here: an L2 action's declared confirmation is the action runner's (`@stackra/panel`). The
 *           refusal of a run is both rejected and kept in `error`, so a form can show it and a caller can branch.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4); ADR 0059 (offline queue); ADR 0227 (no sync engine).
 */
import { isRefusal } from "@stackra/errors";
import { useCallback, useState } from "react";

import { runAction } from "#core/functions/run-action.function";
import type { ActionRef } from "#core/types/action-ref.type";
import type { ClientError } from "#core/types/client-error.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { UseActionOptions } from "#react/action/use-action-options.type";
import type { UseActionResult } from "#react/action/use-action-result.type";
import { useClientRuntime } from "#react/runtime/use-client-runtime";

/**
 * The action `action` in a component.
 *
 * @throws Error outside a `ContainerProvider` whose container binds `ClientTransport` and `ServerStateCache`.
 * @example
 * const cancel = useAction(CancelOrderAction, { invalidates: [GetOrderQuery, ListOrdersQuery] });
 * <Button isDisabled={!cancel.isAllowed || cancel.isPending} onPress={() => cancel.run({ orderId })} />
 */
export function useAction<A extends ActionRef>(
  action: A,
  options: UseActionOptions = {},
): UseActionResult<A> {
  const { transport, cache, queue, session } = useClientRuntime();
  const [running, setRunning] = useState(0);
  const [error, setError] = useState<ClientError | null>(null);
  const invalidates = options.invalidates;
  const run = useCallback(
    async (input: RefInput<A>) => {
      setRunning((count) => count + 1);
      setError(null);
      try {
        return await runAction(
          {
            transport,
            client: cache.client,
            ...(queue === undefined ? {} : { queue }),
            ...(invalidates === undefined ? {} : { invalidates }),
          },
          action,
          input,
        );
      } catch (failure) {
        if (isRefusal(failure)) setError(failure);
        throw failure;
      } finally {
        setRunning((count) => count - 1);
      }
    },
    [action, transport, cache, queue, invalidates],
  );
  return {
    run,
    isPending: running > 0,
    isAllowed: session?.can(action.permission) ?? true,
    error,
  };
}
