/**
 * Stackra file contract:
 * Purpose: `PromptSuggestion`, one suggested prompt a PromptSuggestions set offers: a title, an optional line under it
 *          and an icon, and the prompt it sends.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One suggested prompt. */
export interface PromptSuggestion {
  /** The key of the suggestion; unique within the set. */
  readonly id: string;
  /** What the suggestion says, for example "Track my order"; also its accessible name. */
  readonly title: string;
  /** A muted second line, for example "See where order 2048 is now". */
  readonly description?: string | undefined;
  /** An icon drawn before the title: an icon name or any icon element. */
  readonly icon?: IconSlot | undefined;
  /** The prompt to send when it differs from the title. */
  readonly prompt?: string | undefined;
}
