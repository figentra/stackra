/**
 * Stackra file contract:
 * Purpose: `AutomationPaused`, recorded when a published automation stops starting runs: because its publisher lost
 *          access to an action block it calls (`publisher_access_lost`, with those blocks), or because a host paused
 *          it (`AutomationService.pause`, its own reason such as `failure_threshold`, no blocks).
 * Boundary: a domain event, dispatched in process after the pause commits; the console's automation list and a
 *           notification to the scope's admins listen. It carries no document and no grant. It registers this
 *           package's own schema when the module loads, so `AutomationPaused.create` works with no generated file.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 2: an automation pauses when its publisher loses access); ADR 0423 (decision
 *                     2); ADR 0305 (rules 19 and 21).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { AUTOMATION_PAUSED_SCHEMA } from "#core/constants/automation-paused-schema.constant";

/**
 * One paused automation.
 *
 * @example
 * automation.record(AutomationPaused.create({ automationId, key, reason: "publisher_access_lost", blocks }));
 */
export class AutomationPaused extends DomainEvent {
  /** The automation. */
  automationId!: PublicId<"wfa">;

  /** Its document key (`commerce.cod_confirmation`). */
  key!: string;

  /** Why it paused (`publisher_access_lost`). */
  reason!: string;

  /** The action blocks its publisher may no longer call; empty for a host's pause. */
  blocks!: string[];
}

registerSchemas([[AutomationPaused, AUTOMATION_PAUSED_SCHEMA]]);
