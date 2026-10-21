/**
 * Stackra file contract:
 * Purpose: the public surface of @stackra/brand, which names the design tokens; the logic lives in tokens/.
 * Boundary: names each re-export and declares nothing (ADR 0006).
 * Runtime: isomorphic
 * Governing contract: ADR 0007 (documentation); ADR 0006 (barrels name, never declare).
 */
export {
  colors,
  fontFamily,
  motion,
  radius,
  shadows,
  spacing,
  tokens,
  typography,
} from "./tokens/tokens";
export type {
  ColorToken,
  MotionToken,
  RadiusToken,
  ShadowToken,
  SpacingToken,
  TypographyToken,
} from "./tokens/tokens";
