/**
 * Stackra file contract:
 * Purpose: `maskCaretOf(mask, rawCount)`, where a MaskedField's caret goes after an edit: just after the `rawCount`-th
 *          raw character, so typing, deleting or pasting in the middle keeps the caret where the user is.
 * Boundary: pure; 0 is the start of the text.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C, owner request 2026-10-29).
 */

/** The mask characters that take input; the rest are literals. */
const SLOT = /[9aA*]/u;

/** The caret index in the masked text after `rawCount` raw characters. */
export function maskCaretOf(mask: string, rawCount: number): number {
  if (rawCount <= 0) return 0;
  let seen = 0;
  for (const [index, slot] of [...mask].entries()) {
    if (SLOT.test(slot)) seen += 1;
    if (seen === rawCount) return index + 1;
  }
  return mask.length;
}
