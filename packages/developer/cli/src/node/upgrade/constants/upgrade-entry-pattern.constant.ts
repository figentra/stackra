/**
 * Stackra file contract:
 * Purpose: `UPGRADE_ENTRY_PATTERN`, the line a breaking changeset writes to name its `UPGRADE_CODEMODS` entry:
 *          `Upgrade entry: <id>` (the id may be in backticks). The line travels into the changelog with the note, so
 *          the version pull request is checked by the same rule.
 * Boundary: data only; global, so `matchAll` reads every id a note names.
 * Runtime: node
 * Governing contract: ADR 0199 (Enforcement); STA-145.
 */

/** Captures each named entry id. */
export const UPGRADE_ENTRY_PATTERN = /\bUpgrade entry: `?([a-z0-9]+(?:-[a-z0-9]+)*)`?/g;
