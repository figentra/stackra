/**
 * Stackra file contract:
 * Purpose: the native `useActionRunner()`, the resource pages' one way to run an action on a phone, as on the web: it
 *          asks the action's declared confirmation (a spec's own `confirm` words in its place, or a generic one for an
 *          L2 to L4 risk), sends it, refreshes the cached queries and toasts the success text or the refusal's message.
 * Boundary: internal to the `./native` entry. Needs a native `ConfirmationProvider`, a `ToastProvider` and a container
 *           binding `ClientTransport`; the run still decides on the server. A refusal resolves as `refused` after its
 *           toast; any other error rejects. The run itself is the web runner's platform-free
 *           `useActionRunnerWith` over the native kit's confirmation and toast, so both runners answer alike.
 * Runtime: react-native
 * Governing contract: ADR 0139 (an action runs with its declared confirmation); ADR 0307 (rule 4); ADR 0140 (refusals);
 *          ADR 0164 (native parity).
 */
import { toast, useConfirmation } from "@stackra/ui/native";

import type { ActionRunner } from "#react/action-runner/action-runner.type";
import { useActionRunnerWith } from "#react/action-runner/use-action-runner-with";

/**
 * The action runner of the screen above.
 *
 * @throws Error outside a `ConfirmationProvider` or a `ContainerProvider`.
 * @example
 * const run = useActionRunner();
 * await run(ArchiveProductAction, { productId }); // the action's declared confirmation still applies
 */
export function useActionRunner(): ActionRunner {
  return useActionRunnerWith(useConfirmation(), toast);
}
