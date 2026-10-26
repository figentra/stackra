/**
 * Stackra file contract:
 * Purpose: `ToolScope`, where one caller lists tools: the roles they hold in the current scope node and the record
 *          they are working in (a matter, a class), so the filter answers per role and per record.
 * Boundary: a type only. The roles come from the IAM decision point and the record from the caller's context (the
 *           record the conversation is about), never from the model's output.
 * Runtime: isomorphic
 * Governing contract: R3-SO-02 (`@stackra/mcp` filters tools by role and record scope); J2-6 (scope keys: action,
 *                     data class, role, record); ADR 0155 (decision 3).
 */

/** One caller's listing context. */
export type ToolScope = {
  /** The role keys the caller holds where they act. */
  readonly roles: readonly string[];

  /** The record they are working in: its kind (`matter`) and its public id; none outside a record. */
  readonly record?: { readonly kind: string; readonly id: string };
};
