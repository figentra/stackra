/**
 * Stackra file contract:
 * Purpose: `RELEASE_NOTE_SECTIONS`, the `##` headings every upgrade note has, in ADR 0013 decision 5's words: what
 *          changes for a consumer, the pins, the human steps, the verification and the rollback.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); STA-2835.
 */

/** The sections of an upgrade note, each a `## <name>` line. */
export const RELEASE_NOTE_SECTIONS = [
  "What changes",
  "Pins",
  "Steps",
  "Verify",
  "Roll back",
] as const;
