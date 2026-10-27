/**
 * Stackra file contract:
 * Purpose: `FiscalCheck`, a guest check for fiscal purposes: the whole check as one document and the parts paid so
 *          far.
 * Boundary: a type only; what `checkDocuments` and `FiscalService.sealCheck` take. `document` carries the seller,
 *           buyer, kind, currency and every line of the check; its `id`, `number` and `issuedAt` name the whole-check
 *           document.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8); Mezzora guest_checks spec (RES-150).
 */
import type { FiscalCheckPart } from "#contracts/types/fiscal-check-part.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";

/** A check and its paid parts. */
export type FiscalCheck = {
  /** The whole check as a document. */
  readonly document: FiscalDocument;
  /** The parts paid so far, in payment order. */
  readonly parts: readonly FiscalCheckPart[];
};
