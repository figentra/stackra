/**
 * Stackra file contract:
 * Purpose: `UNIT_TESTS`, the glob of the unit tier: `<subject>.test.ts` in `__tests__/`.
 * Boundary: a string; the role presets read it.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
/** The unit tier, `.int.test.ts` included until a preset excludes it. */
export const UNIT_TESTS = "src/**/__tests__/**/*.test.ts";
