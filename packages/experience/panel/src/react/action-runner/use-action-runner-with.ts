/**
 * Stackra file contract:
 * Purpose: `useActionRunnerWith(confirm, toast)`, the one action runner both entries return: it asks the action's
 *          declared confirmation (a spec's own `confirm` words in its place, or a generic one for an L2 to L4 risk),
 *          sends it, refreshes the cached queries and toasts the success text or the refusal's message.
 * Boundary: platform-free: imports `react` and no UI kit. Each entry's `useActionRunner` hands in its own kit's
 *           confirmation and toast (`@stackra/ui/react` or `@stackra/ui/native`). Needs a container binding
 *           `ClientTransport`; the run still decides on the server. A refusal resolves as `refused` after its toast;
 *           any other error rejects.
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0139 (an action runs with its declared confirmation); ADR 0307 (rule 4); ADR 0140 (refusals);
 *          ADR 0260; ADR 0164 (native parity).
 */
import { ClientTransport } from "@stackra/clients/contracts";
import type { ActionRef, ClientError, RefInput, RefOutput } from "@stackra/clients";
import { useContainer } from "@stackra/container/react";
import { Tone } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { useTranslation } from "@stackra/i18n/react";
import { Risk } from "@stackra/iam";
import { ServerStateCache } from "@stackra/query";
import type { ConfirmFunction, ToastContractProps } from "@stackra/ui/contracts";
import { useCallback } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { specText } from "#core/functions/spec-text.function";
import type { ActionRun } from "#react/action-runner/action-run.type";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";
import { ActionRunnerClient } from "#react/action-runner/action-runner.client";
import type { ActionRunner } from "#react/action-runner/action-runner.type";

/** The risks that confirm before they run (ADR 0139). */
const CONFIRMED: ReadonlySet<string> = new Set([Risk.L2, Risk.L3, Risk.L4]);

/**
 * The action runner over a kit's `confirm` dialog and `toast`.
 *
 * @throws Error outside a `ContainerProvider`.
 * @example
 * const run = useActionRunnerWith(useConfirmation(), toast);
 * await run(intent.action, intent.input); // the action's declared confirmation still applies
 */
export function useActionRunnerWith(
  confirm: ConfirmFunction,
  toast: (message: string, options: ToastContractProps) => unknown,
): ActionRunner {
  const container = useContainer();
  const { t } = useTranslation();
  return useCallback(
    async <A extends ActionRef>(
      action: A,
      input: RefInput<A>,
      options?: Parameters<ActionRunner>[2],
    ): Promise<ActionRun<RefOutput<A>>> => {
      const ask = action.texts.confirm;
      const own = options?.confirm;
      // A caller's modal that showed the declared copy was the yes already (ADR 0307 rule 3).
      const asks =
        own !== undefined ||
        ask !== undefined ||
        (action.risk !== undefined && CONFIRMED.has(action.risk));
      if (asks && options?.confirmed !== true) {
        const yes = await confirm({
          // A spec's own words win over the declared ones (ADR 0139: the action still confirms).
          title:
            own === undefined ? t(PANEL_KEYS.panel.actions.confirm_title) : specText(own.title, t),
          ...(own?.description !== undefined
            ? { description: specText(own.description, t) }
            : own !== undefined || ask === undefined
              ? {}
              : { description: t(typeof ask === "object" ? ask.text : ask) }),
          confirmLabel: t(PANEL_KEYS.panel.actions.confirm),
          cancelLabel: t(PANEL_KEYS.panel.actions.cancel),
          tone:
            own !== undefined
              ? (own.tone ?? Tone.Warning)
              : typeof ask === "object"
                ? ask.tone
                : Tone.Warning,
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
    [container, confirm, toast, t],
  );
}
