/**
 * Stackra file contract:
 * Purpose: `BREAKING_NOTE_PATTERN`, the marks that make a changeset or changelog entry a break a consumer must act on
 *          (ADR 0013 decision 5): the word "breaking" (`### Breaking`, `**Breaking route change.**`, `Breaking:`),
 *          `**Upgrading**`, a line that opens with `Upgrade:` or `Upgrade, <part>:`, `Bump step`, `After upgrading`,
 *          `Before taking this version` and `on its bump`.
 * Boundary: data only; `checkUpgradeNotes` reads it. A changeset note that uses none of these is not a break.
 * Runtime: node
 * Governing contract: ADR 0199 (Enforcement); ADR 0013 (decision 5); STA-145.
 */

/** Matches a break mark anywhere in a note. */
export const BREAKING_NOTE_PATTERN =
  /\bbreaking\b|\*\*upgrading|^\s*upgrad(?:e|ing)\b(?! entry:)[^\n]{0,30}:|\bbump step\b|\bafter upgrading\b|\bbefore taking this version\b|\bon (?:its|their|the) bump\b/im;
