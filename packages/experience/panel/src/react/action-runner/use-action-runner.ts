/**
 * Stackra file contract:
 * Purpose: `useActionRunner()`, the panel's one way to run an action a button, a palette intent or a row placed: it asks the
 *          action's declared confirmation (a spec's own `confirm` words in its place, or a generic one for an L2 to L4
 *          risk), sends it, refreshes the cached
 *          queries and toasts the success text or the refusal's message (`useActionRunnerWith`, shared with native).
 * Boundary: needs a `PanelShell` (or another `ConfirmationProvider`) and a container binding `ClientTransport`; the run
 *           still decides on the server. A refusal resolves as `refused` after its toast; any other error rejects.
 * Runtime: browser
 * Governing contract: ADR 0139 (an action runs with its declared confirmation); ADR 0307 (rule 4); ADR 0140 (refusals); ADR 0260.
 */
import { toast, useConfirmation } from "@stackra/ui/react";

import type { ActionRunner } from "#react/action-runner/action-runner.type";
import { useActionRunnerWith } from "#react/action-runner/use-action-runner-with";

/**
 * The action runner of the panel above.
 *
 * @throws Error outside a `ConfirmationProvider` or a `ContainerProvider`.
 * @example
 * const run = useActionRunner();
 * await run(intent.action, intent.input); // the action's declared confirmation still applies
 */
export function useActionRunner(): ActionRunner {
  return useActionRunnerWith(useConfirmation(), toast);
}
