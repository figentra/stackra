/**
 * Stackra file contract:
 * Purpose: `APPROVAL_FLOOR_KEY`, the market-pack key of the AI approval floor (`ai.approval_floor`), the key
 *          `packApprovalFloorOf` reads among a tenant's resolved pack values.
 * Boundary: a constant only; the value at the key is pack data (ADR 0370), parsed by `packApprovalFloorOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0398 (decision 3: the pack floor and its action list); ADR 0370 (decisions 5 and 6: floors
 *                     are pack data); STA-1250.
 */

/** The pack key of the AI approval floor. */
export const APPROVAL_FLOOR_KEY = "ai.approval_floor";
