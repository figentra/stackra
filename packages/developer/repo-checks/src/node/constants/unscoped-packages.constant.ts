/**
 * Stackra file contract:
 * Purpose: `UNSCOPED_PACKAGES`, the members whose npm name has no scope, by folder: only an npm initializer, because
 *          `npm create <x>` runs the npmjs package `create-<x>` and a scoped name cannot be reached that way.
 * Boundary: data only; `expectedName` reads it. A row here is a decision, never a convenience: each names its ADR.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27: `create-stackra`); ADR 0453 (decision 10).
 */

/** Folder to its unscoped npm name. */
export const UNSCOPED_PACKAGES: Readonly<Record<string, string>> = {
  // ADR 0199, amendment of 2026-11-27: `npm create stackra` (STA-2897).
  "packages/developer/create-stackra": "create-stackra",
};
