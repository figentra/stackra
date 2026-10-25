/**
 * Stackra file contract:
 * Purpose: `DEFAULT_BLOCK_KINDS`, the document kinds a block fits when it names none: a page and a screen, the page
 *          builder's palette.
 * Boundary: internal; `Block` records it when `kinds` is absent, so an email template or a print document only ever
 *           offers blocks that say they fit it.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 6 and 7: email-safe blocks only in email templates).
 */
import { ExperienceKind } from "#contracts/enums/experience-kind.enum";

/** A page and a screen. */
export const DEFAULT_BLOCK_KINDS: readonly ExperienceKind[] = Object.freeze([
  ExperienceKind.Page,
  ExperienceKind.Screen,
]);
