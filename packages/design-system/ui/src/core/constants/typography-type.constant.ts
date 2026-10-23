/**
 * Stackra file contract:
 * Purpose: the HeroUI Typography `type` each Stackra text style renders as. HeroUI v3 and HeroUI Native use the same
 *          type names, so one map serves both runtimes.
 * Boundary: data only; heading styles need no entry (`h1`..`h6` are HeroUI's names too).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract).
 */
import type { TextType } from "#contracts/enums/text-type.enum";

/** HeroUI's name for each text style: `small` is `body-sm`, `caption` is `body-xs`. */
export const TYPOGRAPHY_TYPE = Object.freeze({
  body: "body",
  small: "body-sm",
  caption: "body-xs",
} as const satisfies Record<TextType, "body" | "body-sm" | "body-xs">);
