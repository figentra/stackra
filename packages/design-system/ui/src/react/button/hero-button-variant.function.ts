/**
 * Stackra file contract:
 * Purpose: the HeroUI variant a Stackra button variant draws on, on the web: `glass` on HeroUI's ghost and `core` on
 *          its primary (each finished by its theme class, `button--glass` or `button--core`); the rest unchanged.
 * Boundary: the mapping only; Button, ButtonGroup, MorphButton and `glassButtonClasses` use it.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 7); .agents/specs/sta-2016-button-core/spec.md (FR-001)
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";

/** The HeroUI v3 variant for `variant`. */
export function heroButtonVariant(
  variant: ButtonVariant,
): Exclude<ButtonVariant, "glass" | "core"> {
  if (variant === "glass") return "ghost";
  return variant === "core" ? "primary" : variant;
}
