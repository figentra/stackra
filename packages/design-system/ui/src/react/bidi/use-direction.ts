/**
 * Stackra file contract:
 * Purpose: `useDirection()`, the text direction where a web component renders: the app's, or a `Bidi` block's
 *          above it. Directional motion reads it, so a panel slides in from the inline end and a chevron turns the
 *          right way in Arabic, never from a hard-coded left or right.
 * Boundary: reads React Aria's locale context, which the `DesignSystemProvider` and a `Bidi` block set.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060.
 */
import { useLocale } from "react-aria-components";

import type { Direction } from "#contracts/enums/direction.enum";

/**
 * The nearest direction.
 *
 * @example
 * const sign = useDirection() === "rtl" ? -1 : 1;
 * <motion.div initial={{ x: 24 * sign }} animate={{ x: 0 }} />
 */
export function useDirection(): Direction {
  return useLocale().direction;
}
