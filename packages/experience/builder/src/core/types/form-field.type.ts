/**
 * Stackra file contract:
 * Purpose: `FormField`, one field of a form document: its key, type, label, help, `required`, options, bounds and
 *          optional showing condition.
 * Boundary: a type only, derived from `FormStep`.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 1).
 */
import type { FormStep } from "#core/types/form-step.type";

/** One field. */
export type FormField = FormStep["fields"][number];
