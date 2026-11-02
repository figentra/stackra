/**
 * Stackra file contract:
 * Purpose: `statusCell(status, painter, unicode)`, a status as a symbol and a word in its colour (`✓ ok`, `⚠ warn`,
 *          `✗ fail`, `– skip`, `● info`; ASCII `+ ok`, `! warn`, `x fail`, `- skip`, `* info`), so a status never
 *          depends on colour alone.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-008 and FR-009.
 */
import type { CheckStatus } from "#contracts/types/check-status.type";
import { SYMBOLS } from "#core/constants/symbols.constant";
import type { Painter } from "#core/types/painter.type";

/** The cell of `status`. */
export function statusCell(status: CheckStatus, painter: Painter, unicode: boolean): string {
  const symbols = SYMBOLS[unicode ? "unicode" : "ascii"];
  const cells: Record<CheckStatus, string> = {
    ok: painter.success(`${symbols.success} ok`),
    warn: painter.warning(`${symbols.warning} warn`),
    fail: painter.error(`${symbols.error} fail`),
    skip: painter.dim(`${symbols.skip} skip`),
    info: painter.accent(`${symbols.info} info`),
  };
  return cells[status];
}
