/**
 * Stackra file contract:
 * Purpose: `BINDING_KINDS`, the kind codes of the classes the container builds (the `yes` and `per kind` rows of the
 *          ADR 0294 kind table that a wiring binds), which are the kinds `@Lifetime` may mark.
 * Boundary: codes only; each kind package registers its own code with its base. A kind added to the kind table as a
 *           binding is added here in the same change.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17); ADR 0231 (snake_case machine codes).
 */

/** The kind codes of bindings. */
export const BINDING_KINDS: readonly string[] = Object.freeze([
  "action",
  "bridge",
  "controller",
  "driver",
  "explorer",
  "extension",
  "facts",
  "interceptor",
  "layout",
  "listener",
  "menu",
  "notification",
  "policy",
  "precondition",
  "projection",
  "prompt",
  "query",
  "resource",
  "route",
  "service",
  "skill",
  "state_machine",
  "store",
  "workflow",
]);
