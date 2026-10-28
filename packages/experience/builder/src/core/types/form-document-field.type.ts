/**
 * Stackra file contract:
 * Purpose: `FormDocumentField`, one field of a form document: its key, type, label, help, `required`, options, bounds and
 *          optional showing condition.
 * Boundary: a type only, derived from `FormDocumentStep`.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 1); STA-1383 (renamed so panel's FormField and FormStep keep their names).
 */
import type { FormDocumentStep } from "#core/types/form-document-step.type";

/** One field of a form step. */
export type FormDocumentField = FormDocumentStep["fields"][number];
