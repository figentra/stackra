/**
 * Stackra file contract:
 * Purpose: `MODEL_SCOPE_EXEMPTIONS`, the tables an ADR names as neither tenant-owned nor global, each with the ADR
 *          decision that names it; `checkModelScope` skips their models.
 * Boundary: data only, keyed by the schema-qualified table (`tableName`). A row is added only with the ADR decision
 *           that names the table, never as a member's choice (ADR 0210 amendment: gen refuses a model that declares
 *           neither).
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (2026-10-24 amendment); ADR 0239 (decision 1); `.agents/rules/tenancy.md` (point 5).
 */

/** Exempt table to the ADR decision that names it. */
export const MODEL_SCOPE_EXEMPTIONS: ReadonlyMap<string, string> = new Map([
  ["achievements.award_verifications", "ADR 0368 decision 5"],
]);
