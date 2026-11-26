/**
 * Stackra file contract:
 * Purpose: `startTriggered(runner, automations, occurrence, options)`, the start of every published automation one
 *          trigger occurrence starts: each in turn as its principal, keyed by the automation and the occurrence so a
 *          redelivery or a retried job starts nothing twice, placed in its event chain (a chain past the depth, or a
 *          loop, starts nothing); one automation's failure does not stop the others. The trigger listener runs it in
 *          the delivery, and `StartTriggeredAutomationsAction` runs it as a queued job, retried while a quota cannot be
 *          read.
 * Boundary: runs in the caller's transaction and scope session, which `AutomationService.triggered` reads. The
 *           automations' quota answers decide which start (`triggered`); `last` false lets an unreadable quota throw
 *           so the job is retried, `last` true records the skip instead.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decisions 1 and 2); OS-232 (chain depth).
 */
import { WORKFLOW_DEFAULTS } from "#core/constants/workflow-defaults.constant";
import type { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { AutomationStart } from "#core/enums/automation-start.enum";
import type { AutomationService } from "#node/services/automation.service";
import type { TriggerOccurrence } from "#node/types/trigger-occurrence.type";

/**
 * Starts each automation `occurrence` triggers.
 *
 * @throws AutomationQuotaUnavailableError when a quota cannot be read and `last` is false (the job retries).
 * @throws AggregateError when one or more automations failed to start; the others started.
 * @example
 * await startTriggered(runner, automations, { block: "orders.order_paid", eventId, input: event }, { last: true });
 */
export async function startTriggered(
  runner: NativeWorkflowRunnerDriver,
  automations: AutomationService,
  occurrence: TriggerOccurrence,
  options: { readonly last: boolean },
): Promise<void> {
  const failures: unknown[] = [];
  const triggered = await automations.triggered(occurrence.block, AutomationStart.Event, options);
  for (const automation of triggered)
    try {
      // oxlint-disable-next-line no-await-in-loop -- automations start one after another in the occurrence
      const chain = await runner.chained(occurrence.correlationId, automation.automationId);
      if (chain === undefined) continue;
      // oxlint-disable-next-line no-await-in-loop -- see above
      await runner.startDocument(
        automation.document,
        occurrence.input,
        Object.freeze({
          callId: occurrence.correlationId ?? occurrence.eventId,
          key: automation.document.key,
          actor: automation.principal,
          ...WORKFLOW_DEFAULTS.origin,
        }),
        {
          key: `${automation.automationId}:${occurrence.eventId}`,
          chain,
          automation: automation.automationId,
        },
      );
    } catch (error) {
      failures.push(error);
    }
  if (failures.length > 0)
    throw new AggregateError(
      failures,
      `${occurrence.block}: ${failures.length} automation(s) failed`,
    );
}
