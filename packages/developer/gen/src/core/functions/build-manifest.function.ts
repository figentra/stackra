/**
 * Stackra file contract:
 * Purpose: `buildManifest`, the derivation of a member's `stackra.manifest.json` from what discovery read: every
 *          identity (action and query keys, event wire names, permission keys, refusal codes, model keys and tables,
 *          port keys), the endpoint, tool and refusal list of each action, the module graph, the facets, and the JSON
 *          Schema of every wire shape; a service or app also lists what its hosted packages contribute, marked
 *          `from`; each Integration's key, connection and webhook path. It reports the identity checks it can see:
 *          `identity_collision`, `override_duplicate`, `permission_unknown` and the public id prefix checks
 *          `prefix_invalid`, `prefix_taken` and `prefix_duplicate`.
 * Boundary: pure. A config's schema never reaches the manifest (ADR 0305 rule 34). Sections owned by later targets
 *           (ui, settings, migrations, infra, ...) are written by those targets when they land.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20, 21 and 22); ADR 0305 (rules 1, 28 and 36); ADR 0140 (refusal
 *                     categories); ADR 0141 (event names); ADR 0135 (rule 2: prefixes); ADR 0308 (rule 19).
 */
import { Enum } from "@stackra/contracts";
import type { Json, StackraManifest } from "@stackra/contracts";
import { ErrorKind, refusalCode } from "@stackra/errors";

import { MANIFEST_NOTICE } from "#core/constants/manifest-notice.constant";
import { PUBLIC_ID_PREFIXES } from "#core/constants/public-id-prefixes.constant";
import { actionKey } from "#core/functions/action-key.function";
import { camelCase } from "#core/functions/camel-case.function";
import { configKeyOf } from "#core/functions/config-key-of.function";
import { deriveEndpoint } from "#core/functions/derive-endpoint.function";
import { driverName } from "#core/functions/driver-name.function";
import { eventName } from "#core/functions/event-name.function";
import { integrationKey } from "#core/functions/integration-key.function";
import { jsonSchemaOf } from "#core/functions/json-schema-of.function";
import { modelKey } from "#core/functions/model-key.function";
import { permissionKey } from "#core/functions/permission-key.function";
import { portKey } from "#core/functions/port-key.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import { snakeCase } from "#core/functions/snake-case.function";
import { tableName } from "#core/functions/table-name.function";
import { toolName } from "#core/functions/tool-name.function";
import { webhookPath } from "#core/functions/webhook-path.function";
import type { ClassValue } from "#core/types/class-value.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RegexValue } from "#core/types/regex-value.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

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
] as const;

/** `Permission.L2` or `Permission.L2.system()`: the risk level and the system-only marker. */
const PERMISSION_LEVEL = /^Permission\.(L[0-4])(\.system\(\))?$/;

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
      const level = PERMISSION_LEVEL.exec(source.replace(/\s+/g, ""));
      if (level === null) continue;
      const key = permissionKey(declared.module, declared.name, verb);
      claim(key, declared);
      risks.set(key, level[1] ?? "L0");
      permissions.push({ key, risk: level[1] ?? "L0", ...(level[2] ? { system: true } : {}) });
    }
  }
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
    const permission =
      declared.options["permission"] !== undefined
        ? String(jsonOf(declared.options["permission"]))
        : `${declared.module}.${model}.${kind === "query" ? "read" : verb}`;
    const risk = risks.get(permission);
    if (risk === undefined)
      fail(
        declared,
        "permission_unknown",
        `permission \`${permission}\` is declared by no Permissions class`,
        `add \`static readonly ${permission.split(".").pop() ?? verb} = Permission.L1;\` to the module's Permissions class`,
      );
    const actors = Array.isArray(declared.options["actors"])
      ? declared.options["actors"].map(String)
      : undefined;
    const input = shapeNamed(declared.handle?.input);
    const endpoint = deriveEndpoint({
      key: written,
      kind,
      inputFields: fieldsOf(input).map((field) => field.name),
      ...(actors !== undefined ? { actors } : {}),
      ...(typeof declared.options["area"] === "string" ? { area: declared.options["area"] } : {}),
      ...(declared.options["endpoint"] !== undefined
        ? { endpoint: declared.options["endpoint"] }
        : {}),
    });
    const toolEnabled =
      kind === "query" ? declared.options["tool"] !== false : declared.options["tool"] === true;
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
      risk: risk ?? (kind === "query" ? "L0" : "L1"),
    };
    if (actors !== undefined) entry["actors"] = actors;
    if (preconditions.length > 0) entry["preconditions"] = preconditions.map((item) => item.$class);
    for (const option of ["idempotency", "rateLimit", "cache", "area", "job"])
      if (declared.options[option] !== undefined) entry[option] = jsonOf(declared.options[option]);
    if (declared.options["auth"] === false) entry["auth"] = false;
    if (endpoint !== undefined) entry["endpoint"] = { ...endpoint };
    else if (declared.options["endpoint"] === false) entry["endpoint"] = false;
    if (toolEnabled) entry["tool"] = { name: toolName(key), default: kind === "query" };
    const inputRef = ref(declared.handle?.input);
    const outputRef = ref(declared.handle?.output);
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
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "model")) {
    const key = modelKey(declared.module, declared.name);
    claim(key, declared);
    const publicId = declared.traits.find((trait) => trait.name === "HasPublicId")?.args[0];
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
      else if (registered !== undefined && registered !== key)
        fail(
          declared,
          "prefix_taken",
          `the public id prefix \`${publicId}\` is registered to ${registered}`,
          "pick a prefix the registry in @stackra/gen does not list, or move the entry there in a reviewed change",
        );
      else if (holder !== undefined)
        fail(
          declared,
          "prefix_duplicate",
          `the public id prefix \`${publicId}\` is also the prefix of ${holder}`,
          "give one of the two models another prefix",
        );
      else prefixes.set(publicId, key);
    }
    models.push({
      key,
      class: declared.name,
      file: declared.file,
      table: tableName(declared.module, declared.name),
      ...(typeof publicId === "string" ? { publicId } : {}),
      traits: declared.traits.map((trait) => trait.name),
      ...(declared.facets.some((facet) => facet.name === "Searchable" && facet.target === "class")
        ? { searchable: true }
        : {}),
    });
  }
  if (ir.layout !== "package")
    for (const { package: name, manifest } of ir.dependencies) {
      if (manifest.kind === "app") continue;
      for (const model of manifest.models ?? []) {
        if (typeof model.publicId !== "string") continue;
        const holder = prefixes.get(model.publicId);
        if (holder !== undefined && holder !== model.key)
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

  // Integrations: the key, the connection typed against each, and the webhook path (ADR 0308 rules 16 and 19).
  const integrations: Entry[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "integration")) {
    const key = integrationKey(declared.module, declared.name);
    claim(`integration:${key}`, declared);
    const connection = ir.classes.find(
      (candidate) => candidate.kind === "connection" && candidate.partner?.name === declared.name,
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
    });
  }

  // Configs: identities only (the key), never their schema.
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "config")) {
    if (declared.base !== undefined && !declared.base.own) continue; // an override inherits its base's key
    claim(`config:${configKeyOf(declared.name, ir.member)}`, declared);
  }

  // Overrides: one per base in a member.
  const overridden = new Map<string, DeclaredClass>();
  for (const declared of ir.classes) {
    if (declared.base === undefined || declared.base.own) continue;
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

  // Drivers, grouped by port.
  const drivers = new Map<
    string,
    { port: string; key: string; candidates: string[]; selectedBy?: string }
  >();
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "driver")) {
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
    drivers.set(key, entry);
  }
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "config")) {
    const schema = declared.options["schema"];
    const shape = isClassValue(schema) ? shapeNamed(schema.$class) : undefined;
    for (const field of shape?.fields ?? []) {
      if (field.type.kind !== "driver_name") continue;
      const port = field.type.port;
      for (const entry of drivers.values())
        if (entry.port === port)
          entry.selectedBy = `config:${configKeyOf(declared.name, ir.member)}.${field.name}`;
    }
  }

  // Modules and their edges.
  const moduleOf = new Map(ir.classes.map((declared) => [declared.name, declared.module]));
  const root = rootModuleOf(ir);
  const modules: Entry[] = ir.modules.map((key) => {
    const moduleClass: Pick<DeclaredClass, "name" | "options"> | undefined =
      ir.classes.find((declared) => declared.kind === "module" && declared.module === key) ??
      (key === ir.member && root !== undefined ? { name: root.name, options: {} } : undefined);
    const exported = moduleClass?.options["exports"];
    const exports = Array.isArray(exported)
      ? exported.filter(isClassValue).map((value) => value.$class)
      : [];
    const dependsOn = new Set<string>();
    for (const declared of ir.classes.filter((candidate) => candidate.module === key))
      for (const dep of declared.deps) {
        const target = moduleOf.get(dep.class.name);
        if (target !== undefined && target !== key && dep.class.from.startsWith("#"))
          dependsOn.add(target);
      }
    return {
      key,
      ...(moduleClass !== undefined ? { class: moduleClass.name } : {}),
      exports,
      dependsOn: [...dependsOn].sort(),
    };
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

  const sections: Record<(typeof MERGED_SECTIONS)[number], Entry[]> = {
    actions,
    events: eventEntries,
    permissions,
    errors: errorEntries,
    models,
    drivers: [...drivers.values()].map((entry) => ({ ...entry })),
    integrations,
  };
  if (ir.layout !== "package")
    for (const dependency of ir.dependencies) {
      if (dependency.manifest["kind"] === "app") continue;
      for (const section of MERGED_SECTIONS)
        for (const item of (dependency.manifest[section] ?? []) as unknown as readonly Entry[])
          sections[section].push({
            ...(rehome(item, dependency.package) as Entry),
            from: item["from"] ?? dependency.package,
          });
    }

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
    ...sections,
    schemas,
  };
  return { manifest: manifest as unknown as StackraManifest, errors };
}
