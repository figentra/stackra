/**
 * Stackra file contract:
 * Purpose: `isRawSqlSource(path)`, the files the `raw-sql` check reads: member TS source outside tests and fixtures.
 * Boundary: pure; a test builds its SQL freely, so only shipped source is held to ADR 0160.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1); gap mo23 (stackra-288).
 */
import { isMemberSource } from "#node/functions/is-member-source.function";

/**
 * True for source the `raw-sql` check reads.
 *
 * @param path - repository-relative.
 * @example
 * isRawSqlSource("packages/runtime/queue/src/node/drivers/postgres-queue.driver.ts"); // true
 * isRawSqlSource("packages/runtime/queue/src/node/drivers/__tests__/postgres-queue.driver.test.ts"); // false
 */
export function isRawSqlSource(path: string): boolean {
  return isMemberSource(path) && !/\/(?:__tests__|__fixtures__)\/|\.test\.tsx?$/.test(path);
}
