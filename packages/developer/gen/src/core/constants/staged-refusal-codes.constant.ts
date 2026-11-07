/**
 * Stackra file contract:
 * Purpose: `STAGED_REFUSAL_CODES`, the refusals 0.19 reports as warnings so products can fix them before 0.20 makes
 *          them block: `action_risk_below_write` (STA-2096), `idempotency_missing`, `query_above_l1` and
 *          `step_up_missing` (STA-340).
 * Boundary: data only. `generateMember` downgrades these codes unless it runs strict (`STACKRA_GEN_STRICT=1`); every
 *           other refusal blocks as before. 0.20 empties this set, so they block everywhere.
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (the write floor), ADR 0136, ADR 0406; STA-2096, STA-340 (owner: stage, warn in 0.19,
 *                     error in 0.20).
 */

/** The refusal codes reported as warnings unless gen runs strict. */
export const STAGED_REFUSAL_CODES: ReadonlySet<string> = new Set([
  "action_risk_below_write",
  "idempotency_missing",
  "query_above_l1",
  "step_up_missing",
]);
