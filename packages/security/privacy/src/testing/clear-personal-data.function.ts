/**
 * Stackra file contract:
 * Purpose: `clearPersonalData`, which empties the registered personal-data declarations, so each test registers only
 *          its own.
 * Boundary: test only; exported from `./testing`. Clears the process-wide set `registerPersonalData` writes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269; STA-1375.
 */
import { PERSONAL_DATA_CLASSES } from "#core/constants/personal-data-classes.constant";

/**
 * Forgets every registered declaration.
 *
 * @example
 * afterEach(() => clearPersonalData());
 */
export function clearPersonalData(): void {
  PERSONAL_DATA_CLASSES.clear();
}
