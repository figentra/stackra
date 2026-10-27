/**
 * Stackra file contract:
 * Purpose: `KIND_FILES`, for each kind code gen reads, the file suffix of its one home (`<stem>.<file>.ts`) and the
 *          class-name suffix ADR 0294 R2 derives from it (empty for a noun kind): the table behind
 *          `kind_suffix_mismatch`, `kind_unregistered_base` and `kind_class_name` (STA-1306).
 * Boundary: a frozen map, in step with `KIND_BASES` (node) and the `base-matches-suffix` lint table of
 *           `@stackra/coding-standard`. A kind without a row (`explorer`, `rule_outcome`) has no checked file suffix,
 *           and a file whose suffix is in no row is never checked. Ports name what they are (`PaymentGateway`), so
 *           `port` is a noun kind here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (R1 to R3, decision 16: the kind table); ADR 0305 (rules 1 to 3).
 */

/** Kind code to its file suffix and class-name suffix. */
export const KIND_FILES: Readonly<
  Record<string, { readonly file: string; readonly suffix: string }>
> = Object.freeze({
  action: { file: "action", suffix: "Action" },
  analytics_event: { file: "analytics-event", suffix: "" },
  block: { file: "block", suffix: "Block" },
  bridge: { file: "bridge", suffix: "Bridge" },
  bucket: { file: "bucket", suffix: "Bucket" },
  change: { file: "change", suffix: "Change" },
  config: { file: "config", suffix: "Config" },
  connection: { file: "connection", suffix: "Connection" },
  controller: { file: "controller", suffix: "Controller" },
  document: { file: "document", suffix: "Document" },
  domain_event: { file: "event", suffix: "" },
  driver: { file: "driver", suffix: "Driver" },
  entitlement: { file: "entitlement", suffix: "Entitlement" },
  event: { file: "event", suffix: "" },
  extension: { file: "extension", suffix: "Extension" },
  extension_point: { file: "extension-point", suffix: "ExtensionPoint" },
  factory: { file: "factory", suffix: "Factory" },
  facts: { file: "facts", suffix: "Facts" },
  flag: { file: "flag", suffix: "Flag" },
  integration: { file: "integration", suffix: "Integration" },
  integration_event: { file: "event", suffix: "" },
  interceptor: { file: "interceptor", suffix: "Interceptor" },
  layout: { file: "layout", suffix: "Layout" },
  listener: { file: "listener", suffix: "Listener" },
  menu: { file: "menu", suffix: "Menu" },
  migration: { file: "migration", suffix: "Migration" },
  model: { file: "model", suffix: "" },
  module: { file: "module", suffix: "Module" },
  notification: { file: "notification", suffix: "Notification" },
  panel: { file: "panel", suffix: "Panel" },
  permissions: { file: "permissions", suffix: "Permissions" },
  policy: { file: "policy", suffix: "Policy" },
  port: { file: "port", suffix: "" },
  precondition: { file: "precondition", suffix: "Precondition" },
  projection: { file: "projection", suffix: "Projection" },
  prompt: { file: "prompt", suffix: "Prompt" },
  query: { file: "query", suffix: "Query" },
  refusal: { file: "error", suffix: "Error" },
  resource: { file: "resource", suffix: "Resource" },
  role: { file: "role", suffix: "Role" },
  route: { file: "route", suffix: "Route" },
  schema: { file: "schema", suffix: "" },
  seeder: { file: "seeder", suffix: "Seeder" },
  sequence: { file: "sequence", suffix: "Sequence" },
  service: { file: "service", suffix: "Service" },
  settings: { file: "settings", suffix: "Settings" },
  shortcut: { file: "shortcut", suffix: "Shortcut" },
  signal: { file: "signal", suffix: "" },
  skill: { file: "skill", suffix: "Skill" },
  state_machine: { file: "state-machine", suffix: "StateMachine" },
  store: { file: "store", suffix: "Store" },
  webhook_event: { file: "event", suffix: "" },
  widget: { file: "widget", suffix: "Widget" },
  workflow: { file: "workflow", suffix: "Workflow" },
});
