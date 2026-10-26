/**
 * Stackra file contract:
 * Purpose: `ChecklistCompleted`, recorded when a completion leaves every visible step of a checklist done: the
 *          checklist, its key and, when it has user steps, the user it is now complete for.
 * Boundary: a domain event, dispatched in process after the completion commits. A checklist of scope steps only
 *           completes once for the scope (`userId` null); one with user steps completes once per user.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 3: completion events); ADR 0305 (rules 19 and 21).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { CHECKLIST_COMPLETED_SCHEMA } from "#core/constants/checklist-completed-schema.constant";

/**
 * One completed checklist.
 *
 * @example
 * export class OnboardedListener extends Listener {
 *   async handle(event: ChecklistCompleted): Promise<void> { ... }
 * }
 */
export class ChecklistCompleted extends DomainEvent {
  /** The scope's checklist. */
  checklistId!: PublicId<"wfc">;

  /** Its template key. */
  key!: string;

  /** The user it is complete for, when it has user steps; null otherwise. */
  userId!: string | null;
}

registerSchemas([[ChecklistCompleted, CHECKLIST_COMPLETED_SCHEMA]]);
