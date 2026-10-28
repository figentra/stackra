/**
 * Stackra file contract:
 * Purpose: `FormDocumentStep`, one step of a form document: its key, label, optional showing condition and fields.
 * Boundary: a type only, derived from `FormDocument`.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 1); STA-1383 (renamed so panel's FormField and FormStep keep their names).
 */
import type { FormDocument } from "#core/types/form-document.type";

/** One step of a form document. */
export type FormDocumentStep = FormDocument["steps"][number];
