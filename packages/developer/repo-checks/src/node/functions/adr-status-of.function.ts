/**
 * Stackra file contract:
 * Purpose: `adrStatusOf(text)`, the leading status of an ADR status text ("Accepted · 2026-10-28",
 *          "Superseded by 0510, amended by 0282", "Proposed; amended 2026-10-24"), or undefined when the text does not
 *          open with a status of the template's vocabulary.
 * Boundary: pure; the rest of the text (amendments, dates) is not read.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx, status vocabulary); STA-2851.
 */
import type { AdrStatus } from "#node/types/adr-status.type";

/** A status word at the start of the text, and the number after "Superseded by". */
const LEADING_STATUS =
  /^\s*(accepted|proposed|deferred|rejected|superseded)\b(?:\s+by\s+(\d{4})\b)?/i;

/**
 * The leading status of an ADR status text.
 *
 * @param text - a page description, an index row's status cell or a register status.
 * @example
 * adrStatusOf("Superseded by 0510 · 2026-10-19"); // { status: "superseded", by: "0510" }
 */
export function adrStatusOf(text: string): AdrStatus | undefined {
  const match = LEADING_STATUS.exec(text);
  if (!match) return undefined;
  const status = (match[1] ?? "").toLowerCase();
  return match[2] === undefined ? { status } : { status, by: match[2] };
}
