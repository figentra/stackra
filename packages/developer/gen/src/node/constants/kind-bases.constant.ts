/**
 * Stackra file contract:
 * Purpose: `KIND_BASES`, the kind base names of ADR 0294's kind table and the kind code each one brands its classes
 *          with: discovery reads a class's kind from the base its `extends` clause names, bare or called.
 * Boundary: a frozen map. A name counts as a kind base only when it is declared in a `@stackra/*` package, so a member
 *           class that happens to share a name is never mistaken for one. `CrudService` brands a service.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 16: the kind table); ADR 0305 (rules 2, 3 and 19); ADR 0308 (integrations
 *                     and connections); ADR 0342 (sequences); ADR 0425
 *                     (decision 1: rule outcome kinds); ADR 0399 (Agent) and ADR 0348 (decision 5: Pass), STA-903;
 *                     ADR 0336 (decision 1: `ModelAddition`, stackra-64); ADR 0260 (decision 2: `remoteShape` of
 *                     `@stackra/clients` is a schema base, so `PickType(Remote)` and `extends Remote` compile, STA-1363).
 */

/** Kind base name to kind code. */
export const KIND_BASES: Readonly<Record<string, string>> = Object.freeze({
  Action: "action",
  Agent: "agent",
  AnalyticsEvent: "analytics_event",
  Block: "block",
  Bridge: "bridge",
  Bucket: "bucket",
  Change: "change",
  Config: "config",
  Connection: "connection",
  Controller: "controller",
  CrudService: "service",
  Document: "document",
  DomainEvent: "domain_event",
  Driver: "driver",
  Entitlement: "entitlement",
  Event: "event",
  Explorer: "explorer",
  Extension: "extension",
  ExtensionPoint: "extension_point",
  Factory: "factory",
  Facts: "facts",
  Flag: "flag",
  Integration: "integration",
  IntegrationEvent: "integration_event",
  Interceptor: "interceptor",
  Layout: "layout",
  Listener: "listener",
  Menu: "menu",
  Migration: "migration",
  Model: "model",
  ModelAddition: "model_addition",
  Module: "module",
  Notification: "notification",
  Page: "schema",
  Panel: "panel",
  Pass: "pass",
  Permissions: "permissions",
  Policy: "policy",
  Port: "port",
  Precondition: "precondition",
  Projection: "projection",
  Prompt: "prompt",
  Query: "query",
  Refusal: "refusal",
  Resource: "resource",
  Role: "role",
  Route: "route",
  RuleOutcome: "rule_outcome",
  Schema: "schema",
  Seeder: "seeder",
  Sequence: "sequence",
  Service: "service",
  Settings: "settings",
  Shortcut: "shortcut",
  Signal: "signal",
  Skill: "skill",
  StateMachine: "state_machine",
  Store: "store",
  WebhookEvent: "webhook_event",
  Widget: "widget",
  Workflow: "workflow",
  // The base gen writes a consumed shape over in `#stackra/clients/<service>` (ADR 0260 decision 2, STA-1363).
  remoteShape: "schema",
});
