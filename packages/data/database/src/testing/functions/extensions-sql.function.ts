/**
 * Stackra file contract:
 * Purpose: `extensionsSql`, the `create extension` statements for the approved extensions.
 * Boundary: builds text only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */
import { PGLITE_EXTENSION_NAMES } from "#testing/constants/pglite-extension-names.constant";

/** `create extension` for each approved extension. */
export function extensionsSql(): string {
  return PGLITE_EXTENSION_NAMES.map((name) => `create extension if not exists ${name};`).join("\n");
}
