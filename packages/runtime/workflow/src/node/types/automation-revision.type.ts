/**
 * Stackra file contract:
 * Purpose: `AutomationRevision`, one revision of an automation as `AutomationService.revision` reads it: its number,
 *          its document (whose version is that number) and when it was last published.
 * Boundary: a type only. The document is the stored JSON, checked when it was drafted; a run checks it again when it
 *           starts.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0152 (decision 2).
 */
import type { AutomationDocument } from "#core/index";

/** An automation revision. */
export interface AutomationRevision {
  /** The revision's number, from 1. */
  readonly number: number;

  /** The document the revision holds. */
  readonly document: AutomationDocument;

  /** When the revision was last published; null for a draft. */
  readonly publishedAt: Date | null;
}
