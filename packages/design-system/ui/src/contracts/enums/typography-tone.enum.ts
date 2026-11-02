/**
 * Stackra file contract:
 * Purpose: the tones of Text and Heading: every text tone, plus `core`, the brand's engine colour (Stackra's
 *          champagne core, brand rules §39; STA-2016). Heading draws `core` at levels 1 to 4 (large text) and
 *          `core-strong` below; Text always draws `core-strong`, so small core text stays at 4.5:1.
 * Boundary: the values only; the shared `TextTone` of the other components is unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7).
 */
import { TextTone } from "#contracts/enums/text-tone.enum";

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the tones carry no labels.
export const TypographyTone = Object.freeze([...TextTone, "core"] as const);

export type TypographyTone = (typeof TypographyTone)[number];
