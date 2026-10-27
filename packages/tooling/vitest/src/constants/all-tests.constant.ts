/**
 * Stackra file contract:
 * Purpose: `ALL_TESTS`, the glob of every `.test.ts` and `.test.tsx` in `__tests__/`, for the app and mobile presets.
 * Boundary: a string; the role presets read it.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
/** Every test file, TypeScript and TSX. */
export const ALL_TESTS = "src/**/__tests__/**/*.test.{ts,tsx}";
