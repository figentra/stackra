/**
 * Stackra file contract:
 * Purpose: `markToneOf`, a mark's colour in its tone: as given when emphasised, or the soft context tone (the colour
 *          mixed into the card's surface, edged by `MARK_PAINT.contextEdge`) when it stands back, as the home hero's revenue bars do.
 * Boundary: pure; a CSS colour for a presentation attribute or an inline colour.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import { MARK_PAINT } from "#react/chart/mark-paint.constant";

/** `color` emphasised, or in the soft context tone. */
export function markToneOf(color: string, isEmphasised: boolean): string {
  return isEmphasised
    ? color
    : `color-mix(in oklab, ${color} ${MARK_PAINT.contextShare}%, var(--surface))`;
}
