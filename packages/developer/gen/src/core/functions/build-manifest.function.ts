/**
 * Stackra file contract:
 * Purpose: `buildManifest`, the derivation of a member's `stackra.manifest.json` from what discovery read: every
 *          identity (action and query keys, event wire names, permission keys, refusal codes, model keys and tables,
 *          port keys), the endpoint, area (written, else a service's own, else `app`, STA-340), tool and refusal list of each action (and a query's `reads`, STA-1504), the module
 *          graph, the facets, and the JSON Schema of every wire shape (and `<module>.ReplicaPage` for a replica query's
 *          output, ADR 0338, and the package input and output of a generated search or report query, STA-1459); a
 *          service or app also lists what its hosted packages contribute, marked `from`; each Integration's key,
 *          connection, webhook path and egress entry (a `{field}` host kept as data); each sequence's key; an app's
 *          block and route keys; each tool's derived MCP hints and each action's effect tags; each Integration's roles
 *          and listing; the `@Replaces` replacements; a model a hosting member re-declares with a package's prefix
 *          records the package model key it hosts (`hosts`); a package's drivers carry each candidate's class, entry
 *          and constructor tokens (`classes`; the entry is the folder's own for `src/desktop` and the like, and an
 *          abstract or internal driver is no candidate) and the config class that selects one (`config`), which a
 *          host's wiring reads (STA-1297); a package lists its config classes (`config`: key, class, entry), so a
 *          host's wiring knows its configs without guessing from a name (STA-1308). It reports the identity checks it
 *          can see: `identity_collision`, `override_duplicate`, `permission_unknown`, `identity_missing`,
 *          `action_risk_below_write` (an action whose permission is L0 or L1, STA-2096), the public id prefix checks
 *          `prefix_invalid`, `prefix_taken` and `prefix_duplicate`, `tool_reason_missing`, `data_class_unknown` (an
 *          action's or query's `dataClass`, recorded on its entry, STA-2594), the call-shape refusals
 *          of `checkCallShape` (`query_above_l1`, `query_precondition`, `action_cache`, `step_up_missing`,
 *          `idempotency_missing`), `effect_unknown`,
 *          `endpoint_param_unbound` (a route path parameter that is no input field, STA-2063),
 *          `integration_role_unknown`, `egress_invalid`, `webhook_event_id_undeclared` (an Integration receiving
 *          webhooks of a scheme other than Standard Webhooks that names neither `eventId` nor `signature.idHeader`,
 *          so the inbox would dedupe its events as one), `sequence_misplaced`, `document_number_unsequenced`,
 *          `cron_job_collision` and `event_name_prefixed` (an event `name` that repeats the module or member key: the
 *          wire name is always `<module>.<name>.v<n>`, never member-level or service-key prefixed, STA-1255). It lists
 *          each declared rule outcome kind (`RuleOutcome({...})`) in `outcomes`; each agent (key, task, tools as action
 *          keys) in `agents` and each wallet pass kind in `passes`; and each entitlement in `entitlements` with its
 *          derived key, kind, counted model, `where` filter and the action and query keys it gates (STA-903). It lists
 *          each shell slot the member declares in `slots` (key, const, entry, surface, cardinality, props) and each
 *          fill whose slot resolves in `fills` (slot key, const, entry, surface, props), for the OS registry (ADR 0438,
 *          stackra-03). It lists in `surfaces` each surface a shell dependency's slots sit on, with the shell line the
 *          member targets there (`targets: "console@3"`, from that shell's major) and the shell package, for the
 *          extension-bundle build and the registry's compatibility check (ADR 0436, stackra-04). It lists each model
 *          addition in `additions` (`additionsOf`: base key, side table, wire key, fields) with `addition_base_source`,
 *          `addition_target_missing` and `addition_key_collision` (ADR 0336, stackra-64). It lists each `Report` in
 *          `reports` (`reportsOf`: key, source, dimensions, measures, permission, generated query key) with its
 *          refusals (ADR 0470, stackra-389). It lists each console `Command` in `commands` (`commandsOf`, own then
 *          hosted, `from`) with `kind_path`, `command_collision` and `identity_missing` (ADR 0506, STA-1731). It lists
 *          each panel resource in `ui.resources` (`resourcesOf`: its recorded tree by `<module>.<model>`, with
 *          `module`, `class` and a package's `from`), own then hosted, with `resource_operation_unknown` and
 *          `resource_duplicate`, and a package's UI-entry routes and menus in `ui.routes` and `ui.menus` (`uiRoutesOf`,
 *          `uiMenusOf`) (STA-1947).
 *          A service with a runway `events` block gets the `relay` section: per environment, its public keys (current
 *          first) and its subscribers with the events each takes, never an inbox origin (ADR 0511 d16 and d17).
 *          It lists each environment variable its configuration classes declare in `env` (`envOf`: name, kind, type,
 *          rules, the config that declares it; a host adds its packages' rows), STA-2104.
 *          It lists each record `Policy<Model>` in `policies` (class, model, module, file and the model's `modelFile`),
 *          own then hosted (`from`), only when there is one, so `#stackra/registrations` pairs them (STA-2045).
 *          It lists each own settings class in `settings` (`settingsOf`: group key, class, module,
 *          file and keys with path, type, options and earlier paths) with `settings_unsupported_type`,
 *          `settings_too_deep`, `settings_scope_widened`, `settings_group_key_empty` and `settings_group_conflict`
 *          (ADR 0496, STA-2056).
 * Boundary: pure. A config's schema never reaches the manifest (ADR 0305 rule 34). Sections owned by later targets
 *           (migrations, infra, ...) are written by those targets when they land.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20, 21 and 22); ADR 0305 (rules 1, 28 and 36); ADR 0140 (refusal
 *                     categories); ADR 0141 (event names); ADR 0135 (rule 2: prefixes); ADR 0308 (rule 19); ADR 0342
 *                     (decision 1: sequence keys); ADR 0270 (decision 3: block keys); ADR 0360 (decisions 4 and 10:
 *                     user actions are tools by default, `tool: false` needs a reason, the `bulk` tag); ADR 0099
 *                     (decisions 2 and 3: effect tags, derived hints); ADR 0355 (decision 1: Integration roles); ADR
 *                     0308 (rule 21: `listing.entitlement`); ADR 0394 (decision 2: a sequence's one home); owner
 *                     decisions 2026-10-26 round 3 (query verbs, hosted prefixes; STA-1283); STA-1296 (each permission
 *                     names its Permissions class).
 */
import { Enum } from "@stackra/contracts";
import type { Json, StackraManifest } from "@stackra/contracts";
import { ErrorKind, refusalCode } from "@stackra/errors";
import { camelCase, snakeCase } from "@stackra/support";

import { DEFAULT_AREA } from "#core/constants/default-area.constant";
import { EFFECT_TAGS } from "#core/constants/effect-tags.constant";
import { GENERATED_QUERY_SCHEMAS } from "#core/constants/generated-query-schemas.constant";
import { INTEGRATION_ROLES } from "#core/constants/integration-roles.constant";
import { PERMISSION_LEVEL } from "#core/constants/permission-level.constant";
import { MANIFEST_NOTICE } from "#core/constants/manifest-notice.constant";
import { PUBLIC_ID_PREFIXES } from "#core/constants/public-id-prefixes.constant";
import { REPLICA_PAGE_SCHEMA } from "#core/constants/replica-page-schema.constant";
import { actionKey } from "#core/functions/action-key.function";
import { additionsOf } from "#core/functions/additions-of.function";
import { blockKey } from "#core/functions/block-key.function";
import { checkCallShape } from "#core/functions/check-call-shape.function";
import { configKeyOf } from "#core/functions/config-key-of.function";
import { connectionOf } from "#core/functions/connection-of.function";
import { cronJobId } from "#core/functions/cron-job-id.function";
import { deriveEndpoint } from "#core/functions/derive-endpoint.function";
import { driverName } from "#core/functions/driver-name.function";
import { egressOf } from "#core/functions/egress-of.function";
import { factoryPairsOf } from "#core/functions/factory-pairs-of.function";
import { entitlementKey } from "#core/functions/entitlement-key.function";
import { envOf } from "#core/functions/env-of.function";
import { eventName } from "#core/functions/event-name.function";
import { integrationKey } from "#core/functions/integration-key.function";
import { jsonSchemaOf } from "#core/functions/json-schema-of.function";
import { modelEntityFacts } from "#core/functions/model-entity-facts.function";
import { modelKey } from "#core/functions/model-key.function";
import { permissionKey } from "#core/functions/permission-key.function";
import { roleKey } from "#core/functions/role-key.function";
import { exportingSpecifier } from "#core/functions/exporting-specifier.function";
import { packageSpecifier } from "#core/functions/package-specifier.function";
import { portKey } from "#core/functions/port-key.function";
import { publicSpecifier } from "#core/functions/public-specifier.function";
import { commandsOf } from "#core/functions/commands-of.function";
import { reportsOf } from "#core/functions/reports-of.function";
import { resourcesOf } from "#core/functions/resources-of.function";
import { moduleDependsOn } from "#core/functions/module-depends-on.function";
import { seedersOf } from "#core/functions/seeders-of.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import { routeKey } from "#core/functions/route-key.function";
import { sequenceKey } from "#core/functions/sequence-key.function";
import { settingsOf } from "#core/functions/settings-of.function";
import { slotOf } from "#core/functions/slot-of.function";
import { surfacesOf } from "#core/functions/surfaces-of.function";
import { tableName } from "#core/functions/table-name.function";
import { toolHints } from "#core/functions/tool-hints.function";
import { toolName } from "#core/functions/tool-name.function";
import { uiMenusOf } from "#core/functions/ui-menus-of.function";
import { uiRoutesOf } from "#core/functions/ui-routes-of.function";
import { webhookPath } from "#core/functions/webhook-path.function";
import type { ClassValue } from "#core/types/class-value.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RegexValue } from "#core/types/regex-value.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** A written Integration key: two snake_case parts joined by a dot (STA-1739). */
const INTEGRATION_KEY = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/** A data class key, built in (`financial`) or a product's (`clinical_note`): snake_case, as `DataClass` checks. */
const DATA_CLASS_KEY = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/** A manifest entry under construction. */
type Entry = { [key: string]: Json };

/** The sections a hosted package contributes to its host's manifest. */
const MERGED_SECTIONS = [
  "actions",
  "events",
  "permissions",
  "errors",
  "models",
  "drivers",
  "integrations",
  "sequences",
  "outcomes",
  "agents",
  "passes",
  "entitlements",
  "roles",
] as const;

/** Whether `value` is a class written as a value. */
function isClassValue(value: unknown): value is ClassValue {
  return typeof value === "object" && value !== null && "$class" in value;
}

/** Rewrites every local `$ref` (`#/schemas/X`) of a dependency's entry to point into that dependency. */
function rehome(value: unknown, from: string): unknown {
  if (Array.isArray(value)) return value.map((item) => rehome(item, from));
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "$ref" && typeof item === "string" && item.startsWith("#/")
        ? `${from}${item}`
        : rehome(item, from),
    ]),
  );
}

/**
 * The manifest of a member, and the identity errors found while deriving it.
 *
 * @param ir - the member read by discovery.
 * @example
 * const { manifest, errors } = buildManifest(ir);
 * manifest.actions?.[0]?.key; // "orders.order.cancel@1"
 */
export function buildManifest(ir: MemberIR): {
  readonly manifest: StackraManifest;
  readonly errors: readonly GenError[];
} {
  const errors: GenError[] = [];
  const fail = (owner: DeclaredClass, code: string, message: string, fix: string): void => {
    errors.push({ code, file: owner.file, line: 0, column: 0, subject: owner.name, message, fix });
  };
  const byName = new Map(ir.classes.map((declared) => [declared.name, declared]));
  // A class named in an option resolves to this member's own declaration, else to the entry a hosted dependency's
  // manifest lists for it, matched by class name and by the specifier the class is imported from (STA-2059).
  const hostedKey = (section: "entitlements" | "models", value: ClassValue): string | undefined => {
    for (const { package: name, manifest } of ir.dependencies) {
      if (manifest["kind"] === "app") continue;
      for (const item of (manifest[section] ?? []) as unknown as readonly Entry[])
        if (
          item["class"] === value.$class &&
          [name, item["from"]].some(
            (origin) =>
              typeof origin === "string" &&
              (value.from === origin || value.from.startsWith(`${origin}/`)),
          )
        )
          return String(item["key"]);
    }
    return undefined;
  };
  // Only a class imported from this member (`#…` or a relative path) is its own; a package specifier is hosted.
  const ownOf = (value: ClassValue) =>
    value.from.startsWith("#") || value.from.startsWith(".") ? byName.get(value.$class) : undefined;
  const entitlementOf = (value: ClassValue): string | undefined => {
    const own = ownOf(value);
    return own?.kind === "entitlement"
      ? entitlementKey(own.module, own.name)
      : hostedKey("entitlements", value);
  };
  const modelOf = (value: ClassValue): string | undefined => {
    const own = ownOf(value);
    return own?.kind === "model" ? modelKey(own.module, own.name) : hostedKey("models", value);
  };
  const shapeNamed = (name: string | undefined): ShapeIR | undefined =>
    name === undefined ? undefined : ir.shapes.find((shape) => shape.name === name);
  const ref = (name: string | undefined): Entry | undefined => {
    const shape = shapeNamed(name);
    return shape === undefined ? undefined : { $ref: `#/schemas/${shape.module}.${shape.name}` };
  };

  // Identities claimed so far, for identity_collision.
  const claimed = new Map<string, DeclaredClass>();
  const claim = (identity: string, owner: DeclaredClass): void => {
    const other = claimed.get(identity);
    if (other !== undefined && other !== owner)
      fail(
        owner,
        "identity_collision",
        `\`${identity}\` is also derived by ${other.name} (${other.file})`,
        "rename one class, or give one a different written key or name",
      );
    else claimed.set(identity, owner);
  };

  // Permissions: own classes first, then the hosted packages', so an action may name either.
  const risks = new Map<string, string>();
  const permissions: Entry[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "permissions")) {
    for (const [verb, source] of Object.entries(declared.statics)) {
      const level = PERMISSION_LEVEL.exec(source.replaceAll(/\s+/g, ""));
      if (level === null) continue;
      const key = permissionKey(declared.module, declared.name, verb);
      claim(key, declared);
      risks.set(key, level[1] ?? "L0");
      // `class` lets a consumer's generated client name the set as the producer does (`ReviewPermissions`, STA-1296).
      // `module`, `member` and `file` let a host import the set and register the key at boot (STA-1710).
      permissions.push({
        key,
        risk: level[1] ?? "L0",
        class: declared.name,
        module: declared.module,
        member: verb,
        file: declared.file,
        ...(level[2] === ".system()" ? { system: true } : {}),
      });
    }
  }
  // Module roles by their derived key, so a host registers its hosted packages' roles too (STA-1710).
  const moduleRoles: Entry[] = ir.classes
    .filter((declared) => declared.kind === "role")
    .map((declared) => ({
      key: roleKey(declared.module, declared.name),
      class: declared.name,
      module: declared.module,
      file: declared.file,
    }));
  for (const dependency of ir.dependencies)
    for (const permission of dependency.manifest.permissions ?? [])
      risks.set(permission.key, permission.risk);

  // Event wire names by class, for `invalidateOn: [OrderPaid]` and listeners.
  const wireNames = new Map<string, string>();
  const eventEntries: Entry[] = [];
  for (const declared of ir.classes) {
    if (declared.kind !== "integration_event" && declared.kind !== "domain_event") continue;
    const integration = declared.kind === "integration_event";
    const written =
      typeof declared.options["name"] === "string" ? declared.options["name"] : undefined;
    const version =
      typeof declared.options["version"] === "number" ? declared.options["version"] : 1;
    const name = eventName(
      declared.module,
      written ?? snakeCase(declared.name),
      integration ? version : undefined,
    );
    // The wire name is always `<module>.<name>.v<n>`: no member-level or service-key-prefixed name (STA-1255).
    const prefix = written?.includes(".") === true ? written.split(".")[0] : undefined;
    if (
      written !== undefined &&
      prefix !== undefined &&
      [declared.module, ir.member].includes(prefix)
    )
      fail(
        declared,
        "event_name_prefixed",
        `the event name "${written}" starts with the ${prefix === declared.module ? "module" : "member"} key "${prefix}", but gen adds the module key itself, so the wire name would be ${name}`,
        `write \`name: "${written.slice(prefix.length + 1)}"\`: the wire name is always <module>.<name>.v<n> (${declared.module}.${written.slice(prefix.length + 1)}${integration ? `.v${version}` : ""}); a consumer switches to it`,
      );
    claim(name, declared);
    wireNames.set(declared.name, name);
    eventEntries.push({
      name,
      module: declared.module,
      class: declared.name,
      file: declared.file,
      kind: integration ? "integration" : "domain",
    });
  }

  /** A constant as manifest JSON: classes become their identity or name, patterns their source. */
  const jsonOf = (value: unknown): Json => {
    if (isClassValue(value)) {
      const target = byName.get(value.$class);
      if (
        value.member !== undefined &&
        (value.kind === "permissions" || target?.kind === "permissions")
      )
        return permissionKey(target?.module ?? ir.member, value.$class, value.member);
      return wireNames.get(value.$class) ?? value.$class;
    }
    if (typeof value === "object" && value !== null && "$regex" in value)
      return (value as RegexValue).$regex;
    if (Array.isArray(value)) return value.map(jsonOf);
    if (typeof value === "object" && value !== null)
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonOf(item)]));
    return (value ?? null) as Json;
  };

  // Finish the event entries now that permissions resolve.
  for (const entry of eventEntries) {
    const declared = byName.get(String(entry["class"]));
    if (declared === undefined) continue;
    if (entry["kind"] === "integration")
      entry["version"] =
        typeof declared.options["version"] === "number" ? declared.options["version"] : 1;
    for (const option of ["broadcast", "webhook"])
      if (declared.options[option] !== undefined) entry[option] = jsonOf(declared.options[option]);
    const fields = ref(declared.name);
    if (fields !== undefined) entry["fields"] = fields;
  }

  // Refusals.
  const errorEntries: Entry[] = [];
  const kinds = new Set<string>(Enum.values(ErrorKind));
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "refusal")) {
    let code: string;
    try {
      code = refusalCode(declared.name);
    } catch (error) {
      fail(
        declared,
        "identity_invalid",
        (error as Error).message,
        "name the class PascalCase ending in Error",
      );
      continue;
    }
    claim(code, declared);
    const kind = String(declared.options["kind"] ?? "internal");
    const category = kinds.has(kind) ? Enum.meta(ErrorKind, kind as ErrorKind).category : kind;
    errorEntries.push({ code, kind, category, module: declared.module, class: declared.name });
  }

  // Actions and queries.
  const fieldsOf = (shape: ShapeIR | undefined): FieldIR[] => {
    const all: FieldIR[] = [];
    for (let current = shape; current !== undefined;) {
      all.push(...current.fields);
      const base: ShapeIR["base"] = current.base;
      current = base?.kind === "member" ? shapeNamed(base.name) : undefined;
    }
    return all;
  };
  const actions: Entry[] = [];
  for (const declared of ir.classes) {
    if (declared.kind !== "action" && declared.kind !== "query") continue;
    const kind = declared.kind;
    const written = declared.options["key"];
    if (typeof written !== "string") {
      fail(
        declared,
        "identity_missing",
        `${kind} has no written \`key\``,
        `write \`${kind === "action" ? "Action" : "Query"}({ key: "model.verb" })\``,
      );
      continue;
    }
    const version =
      typeof declared.options["version"] === "number" ? declared.options["version"] : 1;
    const key = actionKey(declared.module, written, version);
    claim(key, declared);
    const segments = written.split(".");
    const verb = segments.pop() ?? "";
    const model = segments.join(".");
    // A query reads `<module>.<model>.read` unless its Permissions class declares its own verb (`search`, `feed`):
    // owner decisions 2026-10-26, round 3.
    const ownVerb = `${declared.module}.${model}.${verb}`;
    const permission =
      declared.options["permission"] !== undefined
        ? String(jsonOf(declared.options["permission"]))
        : kind === "query" && !risks.has(ownVerb)
          ? `${declared.module}.${model}.read`
          : ownVerb;
    const risk = risks.get(permission);
    if (risk === undefined)
      fail(
        declared,
        "permission_unknown",
        `permission \`${permission}\` is declared by no Permissions class`,
        `add \`static readonly ${permission.split(".").pop() ?? verb} = Permission.${kind === "action" ? "L2" : "L0"};\` to the module's Permissions class`,
      );
    // Owner decision 2026-11-04 (STA-2096): every write is at least L2, so no agent runs one unapproved (ADR 0360 d3).
    if (kind === "action" && (risk === "L0" || risk === "L1"))
      fail(
        declared,
        "action_risk_below_write",
        `action uses \`${permission}\` at ${risk}, but an action writes, so its permission is at least L2`,
        "raise the static to `Permission.L2` (L3 for money, L4 for access, deletion or customer sends); a query that shares it and must stay a read takes its own read permission",
      );
    const actors = Array.isArray(declared.options["actors"])
      ? declared.options["actors"].map(String)
      : undefined;
    const input = shapeNamed(declared.handle?.input);
    // The written area, else `public` for an anonymous-only call (served with `auth: false`, so it sits where no gate
    // asks for a principal; STA-2650), else a service's own (`defineService({ area })`), else `app` (ADR 0082
    // decision 3).
    const anonymousOnly = actors?.length === 1 && actors[0] === "anonymous";
    const area =
      typeof declared.options["area"] === "string"
        ? declared.options["area"]
        : anonymousOnly
          ? "public"
          : ((ir.layout === "service" ? ir.area : undefined) ?? DEFAULT_AREA);
    const endpoint = deriveEndpoint({
      key: written,
      kind,
      inputFields: fieldsOf(input).map((field) => field.name),
      ...(actors !== undefined ? { actors } : {}),
      area,
      ...(declared.options["endpoint"] !== undefined
        ? { endpoint: declared.options["endpoint"] }
        : {}),
    });
    // Encore binds each path parameter from the input field of that name, so one with no such field cannot build
    // (STA-2063). A shape built on a package's or another service's shape is not read whole here, so it is not checked.
    let root = input;
    for (let base = root?.base; base?.kind === "member"; base = root?.base)
      root = shapeNamed(base.name);
    if (declared.handle?.input === undefined || (root !== undefined && root.base === undefined)) {
      const fields = new Set(fieldsOf(input).map((field) => field.name));
      for (const [, name = ""] of endpoint?.path.matchAll(/:(\w+)/g) ?? [])
        if (!fields.has(name))
          fail(
            declared,
            "endpoint_param_unbound",
            `${kind} route \`${endpoint?.method} ${endpoint?.path}\` binds \`${name}\`, which its input does not declare`,
            `add \`${name}\` to the input, use a verb whose route takes no id, or write \`endpoint: { method, path }\``,
          );
    }
    // ADR 0360 d4: a query, or an action a user can perform, is a tool unless it says `tool: false` with a reason. An
    // action of risk L3 or L4 (money, deletion, access) is not a tool by default: an agent reaches it only through an
    // explicit `tool: true` with a reason, recorded in the manifest (owner security decision 2026-11-08).
    const tool = declared.options["tool"];
    const userFacing = actors?.includes("user") ?? false;
    const highRisk = kind === "action" && (risk === "L3" || risk === "L4");
    const toolEnabled =
      tool === true || (tool !== false && !highRisk && (kind === "query" || userFacing));
    const toolReason =
      typeof declared.options["toolReason"] === "string"
        ? declared.options["toolReason"]
        : undefined;
    if (tool === false && userFacing && toolReason === undefined)
      fail(
        declared,
        "tool_reason_missing",
        `${kind} a user can perform says \`tool: false\` without a reason`,
        "add a `// reason: <why an agent may not call it>` line above `tool: false`",
      );
    if (tool === true && highRisk && toolReason === undefined)
      fail(
        declared,
        "tool_reason_missing",
        `${kind} of risk ${risk} says \`tool: true\` without a reason`,
        "add a `// reason: <why an agent may call it>` line above `tool: true`, or remove `tool: true`",
      );
    errors.push(
      ...checkCallShape(declared, { risk, routed: endpoint !== undefined, tool: toolEnabled }),
    );
    const writtenEffects = Array.isArray(declared.options["effects"])
      ? declared.options["effects"].map(String)
      : [];
    for (const effect of writtenEffects.filter((candidate) => !EFFECT_TAGS.includes(candidate)))
      fail(
        declared,
        "effect_unknown",
        `\`${effect}\` is not an effect tag`,
        `use one of ${EFFECT_TAGS.join(", ")}; a new tag needs an amendment of ADR 0099`,
      );
    const effects = [...new Set(writtenEffects.filter((effect) => EFFECT_TAGS.includes(effect)))];
    const preconditions = Array.isArray(declared.options["preconditions"])
      ? declared.options["preconditions"].filter(isClassValue)
      : [];
    const refusals = [
      ...declared.refusals,
      ...preconditions.flatMap((precondition) => byName.get(precondition.$class)?.refusals ?? []),
      ...(declared.options["rateLimit"] !== undefined ? ["rate_limited"] : []),
    ];
    const entry: Entry = {
      key,
      kind,
      module: declared.module,
      class: declared.name,
      file: declared.file,
      permission,
      risk: risk ?? (kind === "query" ? "L0" : "L2"),
    };
    if (actors !== undefined) entry["actors"] = actors;
    if (kind === "query" && typeof declared.options["riskReason"] === "string")
      entry["riskReason"] = declared.options["riskReason"];
    if (effects.length > 0) entry["effects"] = effects;
    // The data class it handles, so the AI gateway routes a run in region by it (STA-2594).
    const dataClass = declared.options["dataClass"];
    if (typeof dataClass === "string" && DATA_CLASS_KEY.test(dataClass))
      entry["dataClass"] = dataClass;
    else if (dataClass !== undefined)
      fail(
        declared,
        "data_class_unknown",
        `\`dataClass\` names no data class gen can read`,
        "use a `DataClassification` value or a `DataClass({ key })` class from an `access/` group",
      );
    if (preconditions.length > 0) entry["preconditions"] = preconditions.map((item) => item.$class);
    // Every entry records its area, written or the default, so the gateway and review read it (STA-340).
    for (const option of ["idempotency", "rateLimit", "cache"])
      if (declared.options[option] !== undefined) entry[option] = jsonOf(declared.options[option]);
    entry["area"] = area;
    for (const option of ["job", "reads"])
      if (declared.options[option] !== undefined) entry[option] = jsonOf(declared.options[option]);
    // The meter it feeds and the entitlements it names, so a quota or an entitlement gates it (STA-2059).
    const meter = declared.options["meter"];
    if (typeof meter === "object" && meter !== null && "name" in meter)
      entry["meter"] = String(meter.name);
    const named = declared.options["entitlement"];
    const entitlementKeys = new Set<string>();
    for (const item of Array.isArray(named) ? named : [named]) {
      if (item === undefined) continue;
      const resolved = isClassValue(item) ? entitlementOf(item) : undefined;
      if (resolved === undefined)
        fail(
          declared,
          "entitlement_unknown",
          `\`entitlement\` names ${isClassValue(item) ? item.$class : "a value"}, which is no entitlement of this member or of a hosted package`,
          "import an `Entitlement` class this member declares or a hosted package ships",
        );
      else entitlementKeys.add(resolved);
    }
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here; toSorted is ES2023 and the base lib is ES2022
    if (entitlementKeys.size > 0) entry["entitlements"] = [...entitlementKeys].sort();
    // An anonymous caller may call it, past the permission and record-policy steps only (STA-2025): listed, so review sees it.
    if (actors?.includes("anonymous") === true) entry["anonymous"] = true;
    // G1b: a stream action answers server-sent events, and its `handle` says so in its type.
    const streams = declared.options["stream"] === true;
    if (streams !== (declared.handle?.stream === true))
      fail(
        declared,
        "stream_output_mismatch",
        streams
          ? "the action declares `stream: true`, but `handle` does not answer a ReadableStream"
          : "`handle` answers a ReadableStream, but the action does not declare `stream: true`",
        "declare `stream: true` and answer `Promise<ReadableStream<Chunk>>`, or neither",
      );
    if (streams) entry["stream"] = true;
    // OS ADR 0039 d2: only an entry marked public forms the published REST and MCP API and its SDKs.
    if (declared.options["public"] === true) {
      entry["public"] = true;
      if (endpoint === undefined)
        fail(
          declared,
          "public_without_endpoint",
          `${kind} is marked \`public\` but has no endpoint to publish`,
          "remove `endpoint: false` (or give it actors with a route), or drop `public: true`",
        );
    }
    if (endpoint !== undefined) entry["endpoint"] = { ...endpoint };
    else if (declared.options["endpoint"] === false) entry["endpoint"] = false;
    if (toolEnabled)
      entry["tool"] = {
        name: toolName(key),
        default: tool === undefined,
        ...(tool === true && highRisk && toolReason !== undefined ? { reason: toolReason } : {}),
        hints: toolHints({
          kind,
          risk: String(entry["risk"]),
          effects,
          idempotency: declared.options["idempotency"],
        }),
      };
    else if (toolReason !== undefined) entry["toolOff"] = toolReason;
    else if (highRisk && userFacing)
      entry["toolOff"] =
        `risk ${risk}: not a tool unless the action says \`tool: true\` with a reason`;
    // A query gen writes itself answers a package shape, described under the module (STA-1459).
    const packageRef = (name: string | undefined): Entry | undefined =>
      name !== undefined && declared.file.startsWith(".stackra/") && name in GENERATED_QUERY_SCHEMAS
        ? { $ref: `#/schemas/${declared.module}.${name}` }
        : undefined;
    const inputRef = packageRef(declared.handle?.input) ?? ref(declared.handle?.input);
    const outputRef =
      declared.handle?.replica === true
        ? { $ref: `#/schemas/${declared.module}.ReplicaPage` }
        : (packageRef(declared.handle?.output) ?? ref(declared.handle?.output));
    if (inputRef !== undefined) entry["input"] = inputRef;
    if (outputRef !== undefined) entry["output"] = outputRef;
    if (refusals.length > 0) entry["refusals"] = [...new Set(refusals)];
    for (const facet of declared.facets.filter((candidate) => candidate.target === "class"))
      entry[camelCase(facet.kind)] = facet.options === undefined ? true : jsonOf(facet.options);
    actions.push(entry);
  }

  // Models, and their public id prefixes: 2 to 6 letters, one owner each in the member and its hosted packages, and
  // never a prefix the shared registry gives to another owner (ADR 0135 rule 2).
  const models: Entry[] = [];
  const prefixes = new Map<string, string>();
  // A member named after a package's module hosts that package's models: it may re-declare one under its own module
  // key with the package's prefix, and the model records the key it hosts (owner decisions 2026-10-26, round 3).
  const hostedKeys = new Map<string, string>();
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "model")) {
    const key = modelKey(declared.module, declared.name);
    const shape = ir.shapes.find(
      (candidate) =>
        candidate.kind === "model" &&
        candidate.name === declared.name &&
        candidate.module === declared.module,
    );
    claim(key, declared);
    const publicId = declared.traits.find((trait) => trait.name === "HasPublicId")?.args[0];
    let hosts: string | undefined;
    if (typeof publicId === "string") {
      const registered = PUBLIC_ID_PREFIXES[publicId];
      const holder = prefixes.get(publicId);
      if (!/^[a-z]{2,6}$/.test(publicId))
        fail(
          declared,
          "prefix_invalid",
          `the public id prefix \`${publicId}\` is not 2 to 6 lowercase letters`,
          'write a prefix of 2 to 6 lowercase letters, such as `HasPublicId("ord")`',
        );
      else if (
        registered !== undefined &&
        registered !== key &&
        registered.split(".")[0] !== ir.member
      )
        fail(
          declared,
          "prefix_taken",
          `the public id prefix \`${publicId}\` is registered to ${registered}`,
          `pick a prefix the registry in @stackra/gen does not list, host the model from the \`${registered.split(".")[0]}\` member, or move the entry in a reviewed change`,
        );
      else if (holder !== undefined)
        fail(
          declared,
          "prefix_duplicate",
          `the public id prefix \`${publicId}\` is also the prefix of ${holder}`,
          "give one of the two models another prefix",
        );
      else {
        prefixes.set(publicId, key);
        if (registered !== undefined && registered !== key) {
          hosts = registered;
          hostedKeys.set(publicId, registered);
        }
      }
    }
    models.push({
      key,
      class: declared.name,
      file: declared.file,
      table: tableName(declared.module, declared.name),
      ...(typeof publicId === "string" ? { publicId } : {}),
      ...(hosts !== undefined ? { hosts } : {}),
      traits: declared.traits.map((trait) => trait.name),
      ...(declared.global === true ? { global: true } : {}),
      ...(declared.facets.some((facet) => facet.name === "Searchable" && facet.target === "class")
        ? { searchable: true }
        : {}),
      // What a hosting service writes this model's EntitySchema from (STA-1667).
      ...(shape === undefined ? {} : { entity: jsonOf(modelEntityFacts(shape)) }),
    });
  }
  if (ir.layout !== "package")
    for (const { package: name, manifest } of ir.dependencies) {
      if (manifest.kind === "app") continue;
      for (const model of manifest.models ?? []) {
        if (typeof model.publicId !== "string") continue;
        const holder = prefixes.get(model.publicId);
        if (
          holder !== undefined &&
          holder !== model.key &&
          hostedKeys.get(model.publicId) !== model.key
        )
          errors.push({
            code: "prefix_duplicate",
            file: "package.json",
            line: 0,
            column: 0,
            subject: name,
            message: `the public id prefix \`${model.publicId}\` of ${model.key} is also the prefix of ${holder}`,
            fix: "host only one of the two models, or give one of them another prefix",
          });
        else prefixes.set(model.publicId, model.key);
      }
    }

  // Cron actions: each locked key is its own Encore CronJob id (ADR 0148 decision 6).
  const cronIds = new Map<string, string>([["scheduler-schedules", "the stored schedules' tick"]]);
  for (const entry of actions) {
    const job = entry["job"] as { readonly cron?: unknown } | undefined;
    if (job?.cron === undefined || typeof entry["key"] !== "string") continue;
    const id = cronJobId(entry["key"]);
    const holder = cronIds.get(id);
    const owner = byName.get(String(entry["class"]));
    if (holder !== undefined && owner !== undefined)
      fail(
        owner,
        "cron_job_collision",
        `the cron action ${entry["key"]} and ${holder} both run as the Encore CronJob ${id}`,
        "give one of the two actions another written key",
      );
    else cronIds.set(id, entry["key"]);
  }

  // Integrations: the key, the connection typed against each, and the webhook path (ADR 0308 rules 16 and 19).
  const integrations: Entry[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "integration")) {
    // A written key (`connectors.stripe`) wins: stored connection rows name it (STA-1739).
    const written = declared.options["key"];
    if (written !== undefined && (typeof written !== "string" || !INTEGRATION_KEY.test(written)))
      fail(
        declared,
        "integration_key_invalid",
        `the written key ${JSON.stringify(written)} is not two snake_case parts joined by a dot`,
        "write it as `<group>.<name>` in snake_case, such as `connectors.stripe`, or leave it out to derive it",
      );
    const key =
      typeof written === "string" ? written : integrationKey(declared.module, declared.name);
    claim(`integration:${key}`, declared);
    const connection = connectionOf(ir.classes, declared.name);
    // The listing's roles (ADR 0355 d1): the declared ones, plus `webhooks` when the provider sends us events.
    const declaredRoles = Array.isArray(declared.options["roles"])
      ? declared.options["roles"].map(String)
      : [];
    for (const role of declaredRoles.filter((candidate) => !INTEGRATION_ROLES.includes(candidate)))
      fail(
        declared,
        "integration_role_unknown",
        `\`${role}\` is not an Integration role`,
        `use one of ${INTEGRATION_ROLES.join(", ")}`,
      );
    const roleSet = new Set(declaredRoles);
    if (declared.options["webhooks"] !== undefined) roleSet.add("webhooks");
    const roles = INTEGRATION_ROLES.filter((role) => roleSet.has(role));
    const baseUrl = declared.options["baseUrl"];
    const egress = typeof baseUrl === "string" ? egressOf(baseUrl) : undefined;
    if (baseUrl !== undefined && egress === undefined)
      fail(
        declared,
        "egress_invalid",
        `\`baseUrl\` ${JSON.stringify(baseUrl)} is not an https origin the managed client can call`,
        'write an https URL; a per-region host is a camelCase `{field}` of the credential set ("https://{region}.api.example.com"), or the whole URL is one `{field}` ("{baseUrl}")',
      );
    // why: the inbox dedupes by event id; only Standard Webhooks carries one in a header, so another scheme that names
    // neither `eventId` nor `signature.idHeader` keys every event "" and keeps one of them (`WebhookReceiver`).
    const webhooks = declared.options["webhooks"] as
      | { readonly scheme?: unknown; readonly eventId?: unknown; readonly signature?: unknown }
      | undefined;
    const idHeader = (webhooks?.signature as { readonly idHeader?: unknown } | undefined)?.idHeader;
    if (
      webhooks !== undefined &&
      webhooks.scheme !== "standard_webhooks" &&
      webhooks.eventId === undefined &&
      (typeof idHeader !== "string" || idHeader === "")
    )
      fail(
        declared,
        "webhook_event_id_undeclared",
        `${declared.name} receives \`${String(webhooks.scheme)}\` webhooks but names no event id, so the inbox would keep every event as one`,
        "name `webhooks.eventId` (the payload `path` of the provider's event id, or `parts` of paths and headers) or a `webhooks.signature.idHeader`, or use `SignatureScheme.StandardWebhooks`",
      );
    integrations.push({
      key,
      class: declared.name,
      module: declared.module,
      file: declared.file,
      ...(connection !== undefined
        ? { connection: connection.name, connectionFile: connection.file }
        : {}),
      ...(declared.options["webhooks"] !== undefined
        ? { webhookPath: webhookPath(declared.module, declared.name) }
        : {}),
      ...(roles.length > 0 ? { roles: [...roles] } : {}),
      ...(egress !== undefined
        ? {
            egress: {
              origin: egress.origin,
              ...(egress.fields.length > 0 ? { fields: [...egress.fields] } : {}),
            },
          }
        : {}),
      ...(declared.options["listing"] !== undefined
        ? { listing: jsonOf(declared.options["listing"]) }
        : {}),
    });
  }

  // Sequences: `<module>.` + the written key (ADR 0342 decision 1).
  const sequences: Entry[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "sequence")) {
    const written = declared.options["key"];
    if (typeof written !== "string") {
      fail(
        declared,
        "identity_missing",
        "sequence has no written `key`",
        'write `Sequence({ key: "invoice" })`',
      );
      continue;
    }
    if (!/(^|\/)database\/sequences\/[a-z0-9]+(?:-[a-z0-9]+)*\.sequence\.ts$/.test(declared.file))
      fail(
        declared,
        "sequence_misplaced",
        `a sequence lives in its module's \`database/sequences/\` group, not ${declared.file}`,
        "move it to `src/modules/<module>/database/sequences/<name>.sequence.ts` (a package: `src/node/database/sequences/`)",
      );
    const key = sequenceKey(declared.module, written);
    claim(`sequence:${key}`, declared);
    sequences.push({ key, class: declared.name, module: declared.module, file: declared.file });
  }

  // Rule outcome kinds: `<module>.` + the written camelCase key, with the label and parameters the studio edits
  // (ADR 0425 decision 1), so a host lists what a rule may yield without running the consumer.
  const outcomes: Entry[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "rule_outcome")) {
    const written = declared.options["key"];
    if (typeof written !== "string") {
      fail(
        declared,
        "identity_missing",
        "outcome kind has no written `key`",
        'write `RuleOutcome({ key: "refundWindow", label, params })`',
      );
      continue;
    }
    const key = `${declared.module}.${written}`;
    claim(`outcome:${key}`, declared);
    outcomes.push({
      key,
      class: declared.name,
      module: declared.module,
      file: declared.file,
      label: jsonOf(declared.options["label"]),
      params: jsonOf(declared.options["params"] ?? {}),
    });
  }

  // Agents (`Agent({ key, task, tools })`, ADR 0399) and wallet pass kinds (`Pass({ key })`, ADR 0348 decision 5): the
  // written key is the identity, one per member and its hosted packages (STA-903).
  const actionKeyOf = (value: unknown): Json =>
    isClassValue(value)
      ? (actions.find((entry) => entry["class"] === value.$class)?.["key"] ?? value.$class)
      : jsonOf(value);
  const agents: Entry[] = [];
  const passes: Entry[] = [];
  for (const declared of ir.classes) {
    if (declared.kind !== "agent" && declared.kind !== "pass") continue;
    const written = declared.options["key"];
    if (typeof written !== "string") {
      fail(
        declared,
        "identity_missing",
        `${declared.kind} has no written \`key\``,
        declared.kind === "agent"
          ? 'write `Agent({ key: "shopper_assistant", task: "chat" })`'
          : 'write `Pass({ key: "loyalty_card" })`',
      );
      continue;
    }
    claim(`${declared.kind}:${written}`, declared);
    const entry: Entry = {
      key: written,
      class: declared.name,
      module: declared.module,
      file: declared.file,
    };
    if (declared.kind === "pass") {
      passes.push(entry);
      continue;
    }
    if (typeof declared.options["task"] === "string") entry["task"] = declared.options["task"];
    const tools = declared.options["tools"];
    if (Array.isArray(tools)) entry["tools"] = tools.map(actionKeyOf);
    if (typeof declared.options["maxSteps"] === "number")
      entry["maxSteps"] = declared.options["maxSteps"];
    agents.push(entry);
  }

  // Entitlements: the derived key and the calls each gates, so the generated entry calls `registerEntitlements` and
  // every source resolves the class (STA-903). A limit gates its counted model's create action (`<model>.create` in
  // the model's module); an action or query naming it in an `entitlement` option is gated by it too.
  const entitlements: Entry[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "entitlement")) {
    const key = entitlementKey(declared.module, declared.name);
    claim(`entitlement:${key}`, declared);
    const entry: Entry = {
      key,
      class: declared.name,
      module: declared.module,
      file: declared.file,
      kind: jsonOf(declared.options["kind"]),
    };
    const counted = declared.options["counts"];
    if (isClassValue(counted)) {
      const model = modelOf(counted);
      if (model === undefined)
        fail(
          declared,
          "entitlement_counts_unknown",
          `\`counts\` names ${counted.$class}, which is no model of this member or of a hosted package`,
          "count a model this member declares or a hosted package ships",
        );
      entry["counts"] = model ?? counted.$class;
    }
    if (declared.options["where"] !== undefined) entry["where"] = jsonOf(declared.options["where"]);
    if (typeof declared.options["meter"] === "string") entry["meter"] = declared.options["meter"];
    if (declared.options["per"] !== undefined) entry["per"] = jsonOf(declared.options["per"]);
    // The gates are computed once the hosted sections merge in, over every entitlement and every action.
    entry["gates"] = [];
    entitlements.push(entry);
  }

  // Document numbers: a `@DocumentNumber` field names a sequence of this member or a dependency (ADR 0342
  // enforcement), so no document is numbered by a counter column or a Postgres SEQUENCE.
  const sequenceKeys = new Set([
    ...sequences.map((entry) => entry["key"]),
    ...ir.dependencies.flatMap(({ manifest }) =>
      ((manifest["sequences"] ?? []) as unknown as readonly Entry[]).map((entry) => entry["key"]),
    ),
  ]);
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "model"))
    for (const facet of declared.facets.filter(
      (candidate) => candidate.name === "DocumentNumber" && candidate.target === "field",
    )) {
      const written = (facet.options as { readonly sequence?: unknown } | undefined)?.sequence;
      const key =
        typeof written !== "string"
          ? undefined
          : written.includes(".")
            ? written
            : sequenceKey(declared.module, written);
      if (key === undefined || !sequenceKeys.has(key))
        fail(
          declared,
          "document_number_unsequenced",
          `the document number ${declared.name}.${facet.member ?? "?"} names no declared sequence (${key ?? "none"})`,
          "declare it with `Sequence({ key })` in `database/sequences/`, or name an existing one in `@DocumentNumber({ sequence })`",
        );
    }

  // An app's block keys (`<member>.<snake(folder)>`) and route keys (`snake(stem)`), locked once published.
  const appKeys = (kind: "block" | "route"): Entry[] =>
    ir.classes
      .filter((candidate) => candidate.kind === kind)
      .map((declared) => {
        const key = kind === "block" ? blockKey(ir.member, declared.file) : routeKey(declared.file);
        claim(`${kind}:${key}`, declared);
        return {
          key,
          class: declared.name,
          ...(kind === "block" ? { module: ir.member } : {}),
          file: declared.file,
        };
      });
  const blocks = ir.layout === "app" ? appKeys("block") : [];
  const routes = ir.layout === "app" ? appKeys("route") : [];

  // Configs: identities only (the key), never their schema.
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "config")) {
    if (declared.base !== undefined && !declared.base.own) continue; // an override inherits its base's key
    claim(`config:${configKeyOf(declared.name, ir.member)}`, declared);
  }

  // Overrides: one per base in a member. An override is a config over a package config, or a class that keeps the
  // plain name of the package class it extends (ADR 0305 rule 1); `ListXInput extends CursorInput` only builds on it.
  const overridden = new Map<string, DeclaredClass>();
  for (const declared of ir.classes) {
    if (declared.base === undefined || declared.base.own) continue;
    if (declared.kind !== "config" && declared.name !== declared.base.name) continue;
    const base = `${declared.base.from}#${declared.base.name}`;
    const other = overridden.get(base);
    if (other !== undefined)
      fail(
        declared,
        "override_duplicate",
        `${declared.base.name} from ${declared.base.from} is already overridden by ${other.name} (${other.file})`,
        "keep one override of a base in a member and merge the other into it",
      );
    else overridden.set(base, declared);
  }

  // Drivers, grouped by port. A package also records where each candidate is imported from and its constructor
  // tokens, and the config class that selects one, so a host's wiring lists them (STA-1297).
  const drivers = new Map<
    string,
    {
      port: string;
      key: string;
      candidates: string[];
      selectedBy?: string;
      classes?: Entry;
      config?: Entry;
    }
  >();
  const published = ir.layout === "package";
  // why: a package may export a class from another entry than its folder's (`@stackra/app`'s configs from `./server`)
  const exportedFrom = (name: string, specifier: string): string =>
    exportingSpecifier(ir.package, ir.files, name, specifier);
  const publicToken = (dep: TokenRef): Entry => ({
    class: {
      name: dep.class.name,
      from: exportedFrom(dep.class.name, publicSpecifier(ir.package, dep.class.from)),
    },
    ...(dep.named !== undefined ? { named: dep.named } : {}),
    ...(dep.of !== undefined
      ? { of: { name: dep.of.name, from: publicSpecifier(ir.package, dep.of.from) } }
      : {}),
  });
  // An abstract driver (`AreaStorageDriver`) is a base the candidates extend, never one itself; an internal one
  // (`Driver(Port, { internal: true })`) is a helper its package keeps, which no host may select.
  for (const declared of ir.classes.filter(
    (candidate) =>
      candidate.kind === "driver" &&
      candidate.abstract !== true &&
      candidate.options["internal"] !== true,
  )) {
    const port = declared.partner;
    if (port === undefined) continue;
    const own =
      byName.get(port.name)?.kind === "port" ||
      port.from.startsWith("#") ||
      port.from.startsWith(".");
    const dependency = ir.dependencies.find(
      (candidate) =>
        port.from === candidate.package || port.from.startsWith(`${candidate.package}/`),
    );
    const member = own
      ? ir.member
      : (dependency?.manifest.member ??
        snakeCase(port.from.replace(/^@[^/]+\//, "").split("/")[0] ?? port.from));
    const key = portKey(member, port.name);
    const name = driverName(declared.file, port.name);
    const entry = drivers.get(key) ?? { port: port.name, key, candidates: [] };
    entry.candidates.push(name);
    if (published)
      entry.classes = {
        ...entry.classes,
        [name]: {
          class: declared.name,
          from: exportedFrom(declared.name, packageSpecifier(ir.package, declared.file)),
          ...(declared.deps.length > 0 ? { deps: declared.deps.map(publicToken) } : {}),
        },
      };
    drivers.set(key, entry);
  }
  // A published package's services with their constructor tokens, so a host's wiring binds one it injects
  // (`AppApprovalService` of @stackra/identity) without gen keeping a hand-written table of it (STA-1686), and the
  // model a `CrudService<M>` is typed against (`partner`), so the host registers the pair (ADR 0305 rule 5). Its
  // extension points too: its services inject them, so a host binds them alongside (`LoyaltyKitExtensionPoint`).
  // Its actions and queries too: they are its module's surface, which a host that imports the module binds. And its
  // raw controllers with their `path`, which a host binds and serves as it serves its own.
  const services: Entry[] = published
    ? ir.classes
        .filter(
          (candidate) =>
            (candidate.kind === "service" ||
              candidate.kind === "extension_point" ||
              candidate.kind === "action" ||
              candidate.kind === "query" ||
              (candidate.kind === "controller" && typeof candidate.options["path"] === "string")) &&
            candidate.abstract !== true,
        )
        .map((declared) => ({
          class: declared.name,
          from: exportedFrom(declared.name, packageSpecifier(ir.package, declared.file)),
          ...(declared.kind === "controller" ? { path: String(declared.options["path"]) } : {}),
          ...(declared.deps.length > 0 ? { deps: declared.deps.map(publicToken) } : {}),
          ...(declared.partner === undefined
            ? {}
            : {
                partner: {
                  name: declared.partner.name,
                  from: exportedFrom(
                    declared.partner.name,
                    publicSpecifier(ir.package, declared.partner.from),
                  ),
                },
              }),
        }))
    : [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "config")) {
    if (declared.base !== undefined && !declared.base.own) continue; // an override's base package selects its drivers
    const schema = declared.options["schema"];
    const shape = isClassValue(schema) ? shapeNamed(schema.$class) : undefined;
    for (const field of shape?.fields ?? []) {
      if (field.type.kind !== "driver_name") continue;
      const port = field.type.port;
      for (const entry of drivers.values())
        if (entry.port === port) {
          entry.selectedBy = `config:${configKeyOf(declared.name, ir.member)}.${field.name}`;
          if (published)
            entry.config = {
              class: declared.name,
              from: exportedFrom(declared.name, packageSpecifier(ir.package, declared.file)),
            };
        }
    }
  }

  // Modules and their edges.
  const root = rootModuleOf(ir);
  const modules: Entry[] = ir.modules.map((key) => {
    const authored = ir.classes.find(
      (declared) => declared.kind === "module" && declared.module === key,
    );
    const moduleClass: Pick<DeclaredClass, "name" | "options"> | undefined =
      authored ??
      (key === ir.member && root !== undefined ? { name: root.name, options: {} } : undefined);
    const exported = moduleClass?.options["exports"];
    const exports = Array.isArray(exported)
      ? exported.filter(isClassValue).map((value) => value.$class)
      : [];
    return {
      key,
      ...(moduleClass !== undefined ? { class: moduleClass.name } : {}),
      // Only an authored module class is importable by a host; a generated one lives in this member's `.stackra/gen`.
      ...(authored !== undefined ? { file: authored.file } : {}),
      exports,
      dependsOn: moduleDependsOn(ir, key),
    };
  });

  // The seeders in module order and the factory pairs, which a host's seed entry imports from `./testing` (STA-2061).
  const seeders: Entry[] = seedersOf(ir).map((row) => ({
    key: row.key,
    module: row.module,
    profile: row.profile,
    class: row.name,
    file: row.file,
  }));
  const factories: Entry[] = factoryPairsOf(ir).map((factory) => ({
    class: factory.name,
    file: factory.file,
    model: factory.partner.name,
  }));

  // Replacements: `@Replaces(Base)` on a class of the member, so a host and a reviewer see what it swaps out.
  const replaces: Entry[] = [];
  for (const declared of ir.classes)
    for (const facet of declared.facets.filter((candidate) => candidate.name === "Replaces"))
      if (isClassValue(facet.options))
        replaces.push({
          class: declared.name,
          file: declared.file,
          replaces: facet.options.$class,
          from: facet.options.from,
        });

  // Facets: each decorator once, with every target it marks.
  const facets = new Map<string, Entry & { targets: string[] }>();
  for (const declared of ir.classes)
    for (const facet of declared.facets) {
      const entry = facets.get(facet.name) ?? {
        name: facet.name,
        kind: facet.kind,
        target: facet.target,
        from: facet.from,
        targets: [],
      };
      if (facet.target === "class")
        entry.targets.push(...declared.methods.map((method) => `${declared.name}.${method}`));
      else entry.targets.push(`${declared.name}.${facet.member ?? ""}`);
      facets.set(facet.name, entry);
    }

  // Schemas: enums and every wire shape; a config's schema never reaches a wire surface (ADR 0305 rule 34).
  const bound = new Set(
    ir.classes.flatMap((declared) => {
      const schema = declared.kind === "config" ? declared.options["schema"] : undefined;
      return isClassValue(schema) ? [schema.$class] : [];
    }),
  );
  const schemas: Entry = {};
  for (const declaration of ir.enums)
    schemas[`${declaration.module}.${declaration.name}`] = {
      type: "string",
      enum: [...declaration.values],
    };
  for (const shape of ir.shapes.filter(
    (candidate) => candidate.kind !== "config" && !bound.has(candidate.name),
  ))
    schemas[`${shape.module}.${shape.name}`] = jsonSchemaOf(shape, ir.shapes);
  // A replica query answers `ReplicaPage` (ADR 0338), described once per module that has one.
  for (const declared of ir.classes) {
    if (declared.handle?.replica === true)
      schemas[`${declared.module}.ReplicaPage`] = REPLICA_PAGE_SCHEMA;
    // The package shapes a generated search or report query answers, described once per module that has one.
    if (declared.file.startsWith(".stackra/"))
      for (const name of [declared.handle?.input, declared.handle?.output]) {
        const schema = name === undefined ? undefined : GENERATED_QUERY_SCHEMAS[name];
        if (schema !== undefined) schemas[`${declared.module}.${name}`] = schema;
      }
  }

  const sections: Record<(typeof MERGED_SECTIONS)[number], Entry[]> = {
    actions,
    events: eventEntries,
    permissions,
    errors: errorEntries,
    models,
    drivers: [...drivers.values()].map((entry) => ({ ...entry })),
    integrations,
    sequences,
    outcomes,
    agents,
    passes,
    entitlements,
    roles: moduleRoles,
  };
  // An Integration reached twice (a connector package declared directly and by a hosted member) is kept once; one key
  // from two packages is refused, since registerConnections and egress would serve only one of them (STA-1712).
  const integrationFrom = new Map<unknown, unknown>(
    integrations.map((entry) => [entry["key"], undefined]),
  );
  if (ir.layout !== "package")
    for (const dependency of ir.dependencies) {
      if (dependency.manifest["kind"] === "app") continue;
      for (const section of MERGED_SECTIONS)
        for (const item of (dependency.manifest[section] ?? []) as unknown as readonly Entry[]) {
          const from = item["from"] ?? dependency.package;
          if (section === "integrations") {
            if (integrationFrom.has(item["key"])) {
              const other = integrationFrom.get(item["key"]);
              if (other !== from)
                errors.push({
                  code: "identity_collision",
                  file: "package.json",
                  line: 0,
                  column: 0,
                  subject: String(from),
                  message: `the integration key \`${String(item["key"])}\` of ${String(from)} is also derived by ${other === undefined ? "this member" : String(other)}`,
                  fix: "declare only one of the two connector packages, or rename one Integration",
                });
              continue;
            }
            integrationFrom.set(item["key"], from);
          }
          sections[section].push({ ...(rehome(item, dependency.package) as Entry), from });
        }
    }

  // Gates (STA-2059): over the member's and its hosted packages' entries, an entitlement gates the calls that name
  // it, a quota the actions feeding its meter, and a limit its counted model's create actions. A merged entry keeps
  // the gates its own package computed.
  for (const entitlement of sections.entitlements) {
    const gates = new Set(((entitlement["gates"] ?? []) as readonly Json[]).map(String));
    const create =
      typeof entitlement["counts"] === "string" ? `${entitlement["counts"]}.create@` : "";
    for (const call of sections.actions) {
      const key = String(call["key"]);
      const names = (call["entitlements"] ?? []) as readonly Json[];
      if (
        names.includes(entitlement["key"] ?? null) ||
        (typeof entitlement["meter"] === "string" && call["meter"] === entitlement["meter"]) ||
        (create !== "" && call["kind"] === "action" && key.startsWith(create))
      )
        gates.add(key);
    }
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here; toSorted is ES2023 and the base lib is ES2022
    entitlement["gates"] = [...gates].sort();
  }
  // A hosted action may name an entitlement of a package the host does not depend on directly: refused, since no
  // entry would gate it and the call would run ungated (STA-2059 EC-02).
  if (ir.layout !== "package") {
    const known = new Set(sections.entitlements.map((entitlement) => entitlement["key"]));
    for (const call of sections.actions)
      for (const name of (call["entitlements"] ?? []) as readonly Json[])
        if (!known.has(name))
          errors.push({
            code: "entitlement_unknown",
            file: "package.json",
            line: 0,
            column: 0,
            subject: String(call["from"] ?? call["key"]),
            message: `\`${String(call["key"])}\` names the entitlement \`${String(name)}\`, which no member or hosted package of this member declares`,
            fix: "add the package that declares the entitlement to this member's dependencies",
          });
  }
  // A contracts-only dependency adds just its contracts events, from its `./contracts` entry (STA-2567).
  if (ir.layout !== "package")
    for (const dependency of ir.contractsDependencies ?? [])
      for (const item of (dependency.manifest.events ?? []) as unknown as readonly Entry[])
        eventEntries.push({
          ...(rehome(item, dependency.package) as Entry),
          from: dependency.package,
        });

  // Each record policy with the model it judges, own then hosted (`from`), so a host registers its packages' policies
  // too; the base's type argument is gone at runtime, so this is where the pair is kept (ADR 0132 as amended,
  // STA-2045). Written only when there is one, so a member without policies keeps its manifest.
  const policies: Entry[] = ir.classes
    .filter((declared) => declared.kind === "policy" && declared.abstract !== true)
    .flatMap((declared) => {
      const partner = declared.partner;
      if (partner === undefined) return [];
      const model = ir.shapes.find(
        (shape) => shape.name === partner.name && shape.kind === "model",
      );
      return [
        {
          class: declared.name,
          model: partner.name,
          module: declared.module,
          file: declared.file,
          ...(model === undefined ? {} : { modelFile: model.file }),
        },
      ];
    });
  if (ir.layout !== "package")
    for (const dependency of ir.dependencies) {
      if (dependency.manifest["kind"] === "app") continue;
      for (const item of (dependency.manifest["policies"] ?? []) as readonly Entry[])
        policies.push({ ...item, from: item["from"] ?? dependency.package });
    }

  // A package's config classes, so a host's wiring writes a config row for exactly these (STA-1308).
  const configs: Entry[] = published
    ? ir.classes
        .filter(
          (declared) =>
            declared.kind === "config" && (declared.base === undefined || declared.base.own),
        )
        .map((declared) => ({
          key: configKeyOf(declared.name, ir.member),
          class: declared.name,
          from: exportedFrom(declared.name, packageSpecifier(ir.package, declared.file)),
        }))
    : [];

  // The environment variables its configuration classes declare, own then hosted (ADR 0173 amendment 2026-11-04).
  const env = envOf(ir);

  // The shell slots it declares and the fills it binds, for the OS registry and a filler's check (ADR 0438).
  const slots: Entry[] = [...(ir.slots ?? [])]
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0))
    .map((slot) => ({
      key: slot.key,
      name: slot.name,
      from: packageSpecifier(ir.package, slot.file),
      surface: slot.surface,
      cardinality: slot.cardinality,
      props: slot.props,
    }));
  const fills: Entry[] = (ir.fills ?? [])
    .flatMap((fill) => {
      const slot = slotOf(ir, fill.slot);
      return slot === undefined
        ? []
        : [
            {
              slot: slot.key,
              name: fill.name,
              from: packageSpecifier(ir.package, fill.file),
              surface: fill.surface,
              props: fill.props,
            },
          ];
    })
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((left, right) =>
      `${String(left["slot"])} ${String(left["name"])}` <
      `${String(right["slot"])} ${String(right["name"])}`
        ? -1
        : 1,
    );

  // The shell line it targets on each surface (ADR 0436, stackra-04).
  const surfaces: Entry[] = surfacesOf(ir).map((target) => ({ ...target }));

  // The model additions with their side tables and wire keys, and their refusals (ADR 0336, stackra-64).
  const additions = additionsOf(ir);
  errors.push(...additions.errors);

  // The reports with their dimensions, measures and generated query keys, and their refusals (ADR 0470, stackra-389).
  const reports = reportsOf(ir);
  errors.push(...reports.errors);

  // The console commands, own then hosted, with their refusals (ADR 0506, STA-1731).
  const commands = commandsOf(ir);
  errors.push(...commands.errors);

  // The panel resources with their recorded trees and owning modules, own then hosted (ADR 0307, STA-1947).
  const ui = resourcesOf(ir, sections.actions);
  errors.push(...ui.errors);
  // A package's UI-entry routes and menus, for a host's route tables (STA-1947); each section only when non-empty.
  const uiRoutes = uiRoutesOf(ir);
  const uiMenus = uiMenusOf(ir);
  const uiSection: Entry = {
    ...(Object.keys(ui.resources).length > 0 ? { resources: ui.resources } : {}),
    ...(uiRoutes.length > 0 ? { routes: uiRoutes as unknown as Json } : {}),
    ...(uiMenus.length > 0 ? { menus: uiMenus as unknown as Json } : {}),
  };

  // A producer's cross-app relay facts from its runway `events` blocks: keys and subscribers, never origins (ADR 0511
  // decisions 16 and 17).
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const relayEnvironments = Object.keys(ir.eventsRelay ?? {}).sort();
  const relay: Entry | undefined =
    relayEnvironments.length === 0
      ? undefined
      : {
          keys: Object.fromEntries(
            relayEnvironments.map((environment) => [
              environment,
              (ir.eventsRelay?.[environment]?.keys ?? []).map(({ id, publicKey }) => ({
                id,
                publicKey,
              })),
            ]),
          ),
          subscribers: Object.fromEntries(
            relayEnvironments.map((environment) => [
              environment,
              (ir.eventsRelay?.[environment]?.subscribers ?? []).map(({ member, events }) => ({
                member,
                events: [...events],
              })),
            ]),
          ),
        };
  // The settings groups with their keys, and their refusals (ADR 0496, STA-2056); none for a member with no class.
  const settings = settingsOf(ir);
  errors.push(...settings.errors);

  const manifest: Entry = {
    $comment: MANIFEST_NOTICE,
    member: ir.member,
    package: ir.package,
    version: ir.version,
    ...(ir.kind !== undefined ? { kind: ir.kind } : {}),
    ...(ir.area !== undefined ? { area: ir.area } : {}),
    ...(ir.targets !== undefined ? { targets: [...ir.targets] } : {}),
    modules,
    ...(facets.size > 0 ? { facets: [...facets.values()] } : {}),
    ...(replaces.length > 0 ? { replaces } : {}),
    ...sections,
    ...(configs.length > 0 ? { config: configs } : {}),
    ...(env.length > 0 ? { env } : {}),
    ...(services.length > 0 ? { services } : {}),
    ...(ir.layout === "app" ? { blocks, routes } : {}),
    ...(seeders.length > 0 ? { seeders } : {}),
    ...(factories.length > 0 ? { factories } : {}),
    ...(slots.length > 0 ? { slots } : {}),
    ...(fills.length > 0 ? { fills } : {}),
    ...(surfaces.length > 0 ? { surfaces } : {}),
    ...(additions.additions.length > 0
      ? { additions: additions.additions as unknown as Json }
      : {}),
    ...(reports.reports.length > 0 ? { reports: [...reports.reports] } : {}),
    ...(commands.commands.length > 0 ? { commands: [...commands.commands] } : {}),
    ...(policies.length > 0 ? { policies } : {}),
    ...(Object.keys(uiSection).length > 0 ? { ui: uiSection } : {}),
    ...(relay !== undefined ? { relay } : {}),
    ...(settings.entries.length > 0 ? { settings: [...settings.entries] } : {}),
    schemas,
  };
  return { manifest: manifest as unknown as StackraManifest, errors };
}
