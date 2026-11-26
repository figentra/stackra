/**
 * Stackra file contract:
 * Purpose: `RELEASE_BREAK_PATTERN`, the marks that make an `@stackra/*` changeset or changelog entry a break a consumer
 *          must act on (ADR 0013 decision 5): the word "breaking" (`**Breaking route change.**`, `Breaking, privacy:`,
 *          `Breaking for a custom store`) but not "non-breaking", `**Upgrading`, a line that opens with `Upgrade:` or
 *          `Upgrade, <part>:` (never `Upgrade entry:`), `Bump step`, `After upgrading`, `Before taking this version` and
 *          `on its bump`.
 * Boundary: data only; `breakingReleases` reads it. A note that uses none of these is not a break.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); ADR 0025 (decision 5); STA-2835.
 */

/** Matches a break mark anywhere in a note. */
export const RELEASE_BREAK_PATTERN =
  /(?<!non-)\bbreaking\b|\*\*upgrading|^\s*upgrad(?:e|ing)\b(?! entry:)[^\n]{0,30}:|\bbump step\b|\bafter upgrading\b|\bbefore taking this version\b|\bon (?:its|their|the) bump\b/im;
