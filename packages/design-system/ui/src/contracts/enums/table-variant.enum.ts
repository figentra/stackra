/**
 * Stackra file contract:
 * Purpose: the two looks of a Table, spelt as HeroUI v3 spells them: `primary` sits the table on a tinted tray, and
 *          `secondary` draws it flat on the page with only the header as a card.
 * Boundary: the values only. The native adapted table is a list of cards and reads neither.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313; owner decision 6 of STA-350 (thin wrappers).
 */

/** The table variants. Verified against `@heroui/styles` 3.2.6 (`tableVariants`). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const TableVariant = Object.freeze(["primary", "secondary"] as const);

/** One table variant. */
export type TableVariant = (typeof TableVariant)[number];
