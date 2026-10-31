/**
 * Stackra file contract:
 * Purpose: the button variants: the three shared emphasis levels plus the four HeroUI adds for buttons (outline,
 *          ghost, danger, danger-soft), and Stackra's `glass` for a button on media or glass chrome (ADR 0320 as
 *          amended 2026-10-31): the glass level's fill and rim, lifting and brightening under the press. HeroUI's
 *          variants reach both renderers unchanged; `glass` draws on HeroUI's ghost (web) or tertiary (native).
 * Boundary: the values only; each Button renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7); ADR 0165 (UI contract).
 */
import { Variant } from "#contracts/enums/variant.enum";

/**
 * The button variants. Verified against `@heroui/styles` 3.2.6 (`buttonVariants.variant`) and `heroui-native`
 * 1.0.10 (`ButtonVariant`): the same seven on both.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const ButtonVariant = Object.freeze([
  ...Variant,
  "outline",
  "ghost",
  "danger",
  "danger-soft",
  "glass",
] as const);

/** One button variant. */
export type ButtonVariant = (typeof ButtonVariant)[number];
