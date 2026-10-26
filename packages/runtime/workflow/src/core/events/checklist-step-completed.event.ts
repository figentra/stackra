/**
 * Stackra file contract:
 * Purpose: `ChecklistStepCompleted`, recorded when a checklist step is first completed: the checklist, its key, the
 *          step and, for a user step, the user who completed it for themselves.
 * Boundary: a domain event, dispatched in process after the completion commits; a product relays it as its own
 *           integration event when another service needs it. A second completion of the same step records nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 3: completion events); ADR 0305 (rules 19 and 21).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { CHECKLIST_STEP_COMPLETED_SCHEMA } from "#core/constants/checklist-step-completed-schema.constant";

/**
 * One completed step.
 *
 * @example
 * export class CelebrateListener extends Listener {
 *   async handle(event: ChecklistStepCompleted): Promise<void> { ... }
 * }
 */
export class ChecklistStepCompleted extends DomainEvent {
  /** The scope's checklist. */
  checklistId!: PublicId<"wfc">;

  /** Its template key (`workflow-template:commerce:onboarding`). */
  key!: string;

  /** The step. */
  step!: string;

  /** The user, for a user step; null for a scope step. */
  userId!: string | null;
}

registerSchemas([[ChecklistStepCompleted, CHECKLIST_STEP_COMPLETED_SCHEMA]]);
