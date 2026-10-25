/**
 * Stackra file contract:
 * Purpose: `BINDING_KINDS`, the kind codes whose classes the container builds, so gen writes a wiring binding for
 *          each class of these kinds. Drivers have their own driver table and configs their config table. An
 *          Integration is built with the `IntegrationRuntime` (ADR 0308).
 * Boundary: a frozen list of codes, read from the Binding column of the kind table.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: the kind table's Binding column); ADR 0263.
 */

/** The kind codes that are container bindings. */
export const BINDING_KINDS: readonly string[] = Object.freeze([
  "action",
  "controller",
  "explorer",
  "extension",
  "facts",
  "integration",
  "interceptor",
  "layout",
  "listener",
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
  "workflow",
]);
