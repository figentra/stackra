/**
 * Stackra file contract:
 * Purpose: `MaterialLevelToken`, part of the token schema of the Stackra Design System (see `Theme`): one thickness
 *          of the glass material, in the `glass` mode; the other modes scale it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { ModeShare } from "#contracts/types/mode-share.type";

/** One thickness of the glass material, in the `glass` mode; the other modes scale it. */
export interface MaterialLevelToken {
  /** How much of the `surface` role the fill is, 0 (clear) to 1 (opaque). */
  readonly fill: ModeShare;
  /** The backdrop blur radius, a px length. */
  readonly blur: string;
  /** The backdrop `saturate()` factor; 1 leaves the colour as it is. */
  readonly saturation: number;
}
