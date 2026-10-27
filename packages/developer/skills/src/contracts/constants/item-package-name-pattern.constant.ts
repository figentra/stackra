/**
 * Stackra file contract:
 * Purpose: `ITEM_PACKAGE_NAME_PATTERN`, the name every non-package item must have: `@<scope>/<kind>-<name>`, with
 *          groups `scope`, `kind` and `name`, so items and packages never collide.
 * Boundary: a pattern only; it does not decide which scopes exist (those are the registry's `scopes` rows).
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 7 and 11).
 */

/** `@stackra/skill-archify` → scope `stackra`, kind `skill`, name `archify`. */
export const ITEM_PACKAGE_NAME_PATTERN =
  /^@(?<scope>[a-z0-9][a-z0-9-]*)\/(?<kind>skill|agent|mcp|plugin)-(?<name>[a-z0-9][a-z0-9-]*)$/;
