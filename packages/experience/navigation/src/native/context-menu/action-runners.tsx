/**
 * Stackra file contract:
 * Purpose: `ActionRunners`, the runners of a context menu's actions: one `useAction` per action, each in its own nested
 *          component, so the hook order never depends on how many actions the menu has; the children receive every
 *          runner in order.
 * Boundary: internal to `ContextMenu`. A change in the list of actions remounts from the first difference, which is
 *           legal for hooks; `isAllowed` hides an action the session may not run.
 * Runtime: react-native
 * Governing contract: ADR 0260 (decision 4: typed clients); ADR 0059 (offline queue).
 */
import type { ActionRef } from "@stackra/clients";
import { useAction, type UseActionResult } from "@stackra/clients/react";
import type { ReactElement } from "react";

/** One empty list for every render, so a default never changes identity. */
const NO_RUNNERS: readonly UseActionResult<ActionRef>[] = [];

/**
 * Renders `children` with a runner for each of `actions`.
 *
 * @example
 * <ActionRunners actions={[CancelOrderAction]}>{(runners) => <Menu ... />}</ActionRunners>
 */
export function ActionRunners({
  actions,
  runners = NO_RUNNERS,
  children,
}: {
  readonly actions: readonly ActionRef[];
  readonly runners?: readonly UseActionResult<ActionRef>[];
  readonly children: (runners: readonly UseActionResult<ActionRef>[]) => ReactElement;
}): ReactElement {
  const [first, ...rest] = actions;
  if (first === undefined) return children(runners);
  return (
    <ActionRunner key={first.key} action={first}>
      {(runner) => (
        <ActionRunners actions={rest} runners={[...runners, runner]}>
          {children}
        </ActionRunners>
      )}
    </ActionRunner>
  );
}

/** One action's runner, handed to `children`. */
function ActionRunner({
  action,
  children,
}: {
  readonly action: ActionRef;
  readonly children: (runner: UseActionResult<ActionRef>) => ReactElement;
}): ReactElement {
  return children(useAction(action));
}
