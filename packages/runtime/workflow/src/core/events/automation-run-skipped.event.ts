/**
 * Stackra file contract:
 * Purpose: `AutomationRunSkipped`, recorded when a trigger or a schedule would have started a published automation's
 *          run and its tenant's quota stopped it: over the quota (`quota_exceeded`), or a quota that could not be read
 *          (`quota_unavailable`, fail closed). The run history lists it and a notification can tell the tenant.
 * Boundary: a domain event, dispatched in process after the delivery's transaction commits. It is not a failure: no
 *           retry, no alert, no failure count. It carries no input and no quota figure. Telling the tenant once per
 *           automation per period (a skip flood) is the host's notification listener's job, never this event's.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 2); ADR 0305 (rules 19 and 21).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { AUTOMATION_RUN_SKIPPED_SCHEMA } from "#core/constants/automation-run-skipped-schema.constant";
import type { AutomationStart } from "#core/enums/automation-start.enum";

/**
 * One run the quota kept from starting.
 * @example
 * automation.record(
 *   AutomationRunSkipped.create({ automationId, key, reason: "quota_exceeded", startedBy: "event" }),
 * );
 */
export class AutomationRunSkipped extends DomainEvent {
  /** The id of the automation whose run did not start. */
  automationId!: PublicId<"wfa">;

  /** Its document key (`commerce.cod_confirmation`). */
  key!: string;

  /** Why: `quota_exceeded`, or `quota_unavailable` (the shipped schema allows only these two). */
  reason!: string;

  /** What would have started it. */
  startedBy!: AutomationStart;
}

registerSchemas([[AutomationRunSkipped, AUTOMATION_RUN_SKIPPED_SCHEMA]]);
