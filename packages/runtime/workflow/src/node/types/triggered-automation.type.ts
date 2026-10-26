/**
 * Stackra file contract:
 * Purpose: `TriggeredAutomation`, a published automation a trigger occurrence starts: its id, the document of its
 *          published revision and the principal it runs as.
 * Boundary: a type only; `AutomationService.triggered` reads it in the occurrence's scope session.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 2).
 */
import type { Actor, PublicId } from "@stackra/contracts";

import type { AutomationDocument } from "#core/index";

/** One automation to start. */
export interface TriggeredAutomation {
  /** The id of the automation to start. */
  readonly automationId: PublicId<"wfa">;

  /** The published revision's document. */
  readonly document: AutomationDocument;

  /** The principal its run acts as. */
  readonly principal: Actor;
}
