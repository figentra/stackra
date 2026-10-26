/**
 * Stackra file contract:
 * Purpose: `testFileFor(subject, tier)`, the test file name of a subject in a tier: `subject` + the tier infix + `.ts`.
 * Boundary: pure; an unknown tier throws.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0182 (decision 1).
 */
import { TEST_TIERS } from "#node/constants/test-tiers.constant";

/**
 * The test file name for `subject` in `tier`.
 *
 * @param subject - the file name without its extension, for example `create-user`.
 * @param tier - unit, int, contract, load or e2e.
 * @throws Error when `tier` is not a test tier.
 * @example
 * testFileFor("billing.module", "int"); // "billing.module.int.test.ts"
 */
export function testFileFor(subject: string, tier: string): string {
  const found = TEST_TIERS.find((t) => t.name === tier);
  if (!found)
    throw new Error(
      `unknown test tier "${tier}" — one of: ${TEST_TIERS.map((t) => t.name).join(", ")}`,
    );
  return `${subject}${found.infix}.ts`;
}
