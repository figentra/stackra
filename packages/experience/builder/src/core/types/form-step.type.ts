/**
 * Stackra file contract:
 * Purpose: `FormStep`, one step of a form document: its key, label, optional showing condition and fields.
 * Boundary: a type only, derived from `FormDocument`.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 1).
 */
import type { FormDocument } from "#core/types/form-document.type";

/** One step. */
export type FormStep = FormDocument["steps"][number];
