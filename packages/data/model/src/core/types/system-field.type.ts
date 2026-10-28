/**
 * Stackra file contract:
 * Purpose: `SystemField`, the name of any field `SYSTEM_FIELDS` lists (`"id" | "createdAt" | ... | "version"`), the
 *          type a create or update input type leaves out.
 * Boundary: a type only, derived from `SYSTEM_FIELDS` so the two never drift.
 * Runtime: isomorphic
 * Governing contract: data-layer gap mo21 (stackra-287); ADR 0307 (rule 1: form keys come from the input).
 */
import type { SYSTEM_FIELDS } from "#core/constants/system-fields.constant";

/** A system-written field name. */
export type SystemField = (typeof SYSTEM_FIELDS)[keyof typeof SYSTEM_FIELDS][number];
