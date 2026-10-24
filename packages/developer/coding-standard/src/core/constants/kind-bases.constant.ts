/**
 * Stackra file contract:
 * Purpose: `KIND_BASES`, the class-kind file suffixes of the v3.1 kind table and the base classes each one may
 *          extend, so `base-matches-suffix` reads the kind from the path and `no-kind-decorator` knows every kind name.
 * Boundary: data only. Function kinds (`.function.ts`, `.constant.ts`, `.type.ts`, `.enum.ts`, components, hooks)
 *           are not listed: they declare no class. A new kind joins this table with its ADR.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R3 and decision 16, the kind table, with the 2026-10-23 amendment); ADR 0305
 *                     (rules 2, 3, 5 and 19); ADR 0308 (Integration and Connection).
 */

/**
 * Kind suffix to the base classes a class in a `<name>.<kind>.ts` file extends. The base is `PascalCase(kind)`,
 * with the aliases of ADR 0294 R3: `.event.ts` takes a concrete event base, `.error.ts` takes `Refusal`,
 * `.service.ts` takes `Service` or `CrudService`, and `.schema.ts` takes any shape base of `@stackra/validation`.
 */
export const KIND_BASES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  action: ["Action"],
  "analytics-event": ["AnalyticsEvent"],
  block: ["Block"],
  bridge: ["Bridge"],
  bucket: ["Bucket"],
  change: ["Change"],
  config: ["Config"],
  connection: ["Connection"],
  controller: ["Controller"],
  document: ["Document"],
  driver: ["Driver"],
  entitlement: ["Entitlement"],
  error: ["Refusal"],
  event: ["DomainEvent", "IntegrationEvent", "WebhookEvent"],
  extension: ["Extension"],
  "extension-point": ["ExtensionPoint"],
  factory: ["Factory"],
  facts: ["Facts"],
  flag: ["Flag"],
  integration: ["Integration"],
  interceptor: ["Interceptor"],
  layout: ["Layout"],
  listener: ["Listener"],
  menu: ["Menu"],
  migration: ["Migration"],
  model: ["Model"],
  module: ["Module"],
  notification: ["Notification"],
  panel: ["Panel"],
  permissions: ["Permissions"],
  policy: ["Policy"],
  port: ["Port"],
  precondition: ["Precondition"],
  projection: ["Projection"],
  prompt: ["Prompt"],
  query: ["Query"],
  resource: ["Resource"],
  role: ["Role"],
  route: ["Route"],
  schema: ["Schema", "CursorInput", "Page", "PickType", "OmitType", "PartialType"],
  seeder: ["Seeder"],
  service: ["Service", "CrudService"],
  settings: ["Settings"],
  shortcut: ["Shortcut"],
  signal: ["Signal"],
  skill: ["Skill"],
  "state-machine": ["StateMachine"],
  store: ["Store"],
  widget: ["Widget"],
  workflow: ["Workflow"],
});
