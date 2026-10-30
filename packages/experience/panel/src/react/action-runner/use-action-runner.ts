/**
 * Stackra file contract:
 * Purpose: `useActionRunner()`, the panel's one way to run an action a button, a palette intent or a row placed: it asks the
 *          action's declared confirmation (or a generic one for an L2 to L4 risk), sends it, refreshes the cached
 *          queries and toasts the success text or the refusal's message.
 * Boundary: needs a `PanelShell` (or another `ConfirmationProvider`) and a container binding `ClientTransport`; the run
 *           still decides on the server. A refusal resolves as `refused` after its toast; any other error rejects.
 * Runtime: browser
 * Governing contract: ADR 0139 (an action runs with its declared confirmation); ADR 0307 (rule 4); ADR 0140 (refusals); ADR 0260.
 */
import { ClientTransport } from "@stackra/clients/contracts";
import type { ActionRef, ClientError, RefInput, RefOutput } from "@stackra/clients";
import { useContainer } from "@stackra/container/react";
import { Tone } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { useTranslation } from "@stackra/i18n/react";
import { Risk } from "@stackra/iam";
import { ServerStateCache } from "@stackra/query";
import { toast, useConfirmation } from "@stackra/ui/react";
import { useCallback } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import type { ActionRun } from "#react/action-runner/action-run.type";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
import { ActionRunnerClient } from "#react/action-runner/action-runner.client";
import type { ActionRunner } from "#react/action-runner/action-runner.type";

/** The risks that confirm before they run (ADR 0139). */
const CONFIRMED: ReadonlySet<string> = new Set([Risk.L2, Risk.L3, Risk.L4]);

/**
 * The action runner of the panel above.
 *
 * @throws Error outside a `ConfirmationProvider` or a `ContainerProvider`.
 * @example
 * const run = useActionRunner();
 * await run(intent.action, intent.input); // the action's declared confirmation still applies
 */
export function useActionRunner(): ActionRunner {
  const container = useContainer();
  const confirm = useConfirmation();
  const { t } = useTranslation();
  return useCallback(
    async <A extends ActionRef>(
      action: A,
      input: RefInput<A>,
      options?: { readonly confirmed?: boolean },
    ): Promise<ActionRun<RefOutput<A>>> => {
      const ask = action.texts.confirm;
      // A caller's modal that showed the declared copy was the yes already (ADR 0307 rule 3).
      const asks = ask !== undefined || (action.risk !== undefined && CONFIRMED.has(action.risk));
      if (asks && options?.confirmed !== true) {
        const yes = await confirm({
          title: t(PANEL_KEYS.panel.actions.confirm_title),
          ...(ask === undefined
            ? {}
            : { description: t(typeof ask === "object" ? ask.text : ask) }),
          confirmLabel: t(PANEL_KEYS.panel.actions.confirm),
          cancelLabel: t(PANEL_KEYS.panel.actions.cancel),
          tone: typeof ask === "object" ? ask.tone : Tone.Warning,
        });
        if (!yes) return { status: ActionRunStatus.Cancelled };
      }
      try {
        const data = await new ActionRunnerClient(container.get(ClientTransport)).send(
          action,
          input,
        );
        if (container.has(ServerStateCache))
          await container.get(ServerStateCache).client.invalidateQueries();
        toast(t(action.texts.success ?? PANEL_KEYS.panel.actions.done), { tone: Tone.Success });
        return { status: ActionRunStatus.Done, data };
      } catch (error) {
        if (!isRefusal(error)) throw error;
        const refusal = error as ClientError;
        toast(t(refusal.refusalKey ?? PANEL_KEYS.panel.actions.refused), { tone: Tone.Danger });
        return { status: ActionRunStatus.Refused, error: refusal };
      }
    },
    [container, confirm, t],
  );
}
