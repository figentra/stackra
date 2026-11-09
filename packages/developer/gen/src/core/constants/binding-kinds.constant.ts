/**
 * Stackra file contract:
 * Purpose: `BINDING_KINDS`, the kind codes whose classes the container builds, so gen writes a wiring binding for
 *          each class of these kinds. Drivers have their own driver table and configs their config table. An
 *          Integration is built with the `IntegrationRuntime` (ADR 0308). An Agent (`@stackra/ai`) and a wallet Pass
 *          (`@stackra/integrations`) take constructor dependencies, so both are bindings (STA-903). A console Command
 *          takes its collaborators the same way (ADR 0506 decision 2, STA-1731). A Menu, Shortcut, Store (singleton) and
 *          Bridge (request-scoped, ADR 0251) take constructor dependencies, and an ExtensionPoint is injected by its
 *          owner (ADR 0305 rule 25), so each is a binding (STA-2055).
 * Boundary: a frozen list of codes, read from the Binding column of the kind table.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: the kind table's Binding column); ADR 0263; ADR 0399 (Agent); ADR 0348
 *                     (decision 5: Pass).
 */

/** The kind codes that are container bindings. */
export const BINDING_KINDS: readonly string[] = Object.freeze([
  "action",
  "approval_condition",
  "agent",
  "bridge",
  "command",
  "controller",
  "explorer",
  "extension",
  "extension_point",
  "facts",
  "integration",
  "interceptor",
  "layout",
  "listener",
  "menu",
  "notification",
  "pass",
  "policy",
  "precondition",
  "projection",
  "prompt",
  "query",
  "resource",
  "route",
  "service",
  "shortcut",
  "skill",
  "state_machine",
  "store",
  "workflow",
]);
