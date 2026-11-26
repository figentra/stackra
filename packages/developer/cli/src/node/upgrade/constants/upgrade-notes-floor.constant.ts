/**
 * Stackra file contract:
 * Purpose: `UPGRADE_NOTES_FLOOR`, the first `@stackra/*` release whose breaking changelog entries must each have an
 *          `UPGRADE_CODEMODS` entry: `stackra upgrade` covers moves from 0.4.0 on, the first release consumers pinned.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2 and Enforcement); ADR 0013 (decision 5); STA-145.
 */

/** Changelog entries of releases before this one are history `stackra upgrade` does not cover. */
export const UPGRADE_NOTES_FLOOR = "0.4.0";
