/**
 * Stackra file contract:
 * Purpose: `emitWiring`, the member's `#stackra/wiring` (`.stackra/gen/wiring.ts`): the module graph in topological
 *          order (with each dependency's module marked `from`), the platform classes the member injects, every
 *          binding with its kind, module, lifetime and constructor tokens, the config classes with their overrides,
 *          the driver table per port with lazy candidates (the member's own, and each declared package's table of a
 *          port its bindings reach, from that package's manifest `classes`, with the config row that selects one and
 *          a row per package config class injected, read from that package's manifest `config` section and its
 *          drivers' `config`, never guessed from a name; STA-1297, STA-1308) and the `DriverRegistry` augmentation
 *          keyed by port key for the member's own drivers,
 *          the `@Replaces` replacements and the partners read from type arguments, typed `satisfies Wiring`. Gen adds
 *          the bindings no class declares: one per per-model token (`repositoryOf(M)`, `journalOf(M)` with `[Locks]`),
 *          an Integration's `IntegrationRuntime`, an Agent's `AgentRuntime` (STA-903), each generated service client (`#stackra/clients/<service>`, with the
 *          `ClientTransport` the topology picks), the generated inbound webhook route, and the platform services of
 *          `PLATFORM_BINDINGS` where they are injected (`RequestContext` where `CustomFieldService` resolves; `RuleSetService`
 *          with its `repositoryOf(Revision)`), and in a service the `SERVER_CONTRIBUTIONS` of its declared packages: the
 *          `OriginGuard` and `CsrfGuard` request guards with the `app.cors` and `app.csrf` config rows, and the six
 *          `HealthIndicator` drivers `/readyz` runs with their package config rows (STA-1385).
 * Boundary: pure. Derived from file paths, base classes and constructor parameter types at build time; no reflection
 *           and no string token. A driver is a lazy import, so a node-only driver never reaches a browser bundle. The
 *           sections other packages own (extension points, seeders, ...) are added by those targets.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 26); ADR 0263 (gen writes the wiring); ADR 0227 2026-10-24 note
 *                     (build-time wiring from constructor types); registry v3.1 section 5 item 4; ADR 0308; ADR 0224;
 *                     ADR 0260 (decisions 3 and 6: an injected client over the transport the topology picks); ADR 0266
 *                     (memory first: a test's `useDrivers("memory")` finds the packages' memory candidates).
 */
import { snakeCase } from "@stackra/support";

import { BINDING_KINDS } from "#core/constants/binding-kinds.constant";
import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { MODEL_TOKENS } from "#core/constants/model-tokens.constant";
import { PLATFORM_BINDINGS } from "#core/constants/platform-bindings.constant";
import { SERVER_CONTRIBUTIONS } from "#core/constants/server-contributions.constant";
import { configKeyOf } from "#core/functions/config-key-of.function";
import { driverName } from "#core/functions/driver-name.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { modelKey } from "#core/functions/model-key.function";
import { portKey } from "#core/functions/port-key.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import { webhookIntegrations } from "#core/functions/webhook-integrations.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { ClassValue } from "#core/types/class-value.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** The lifetime codes and the `Lifetime` member that prints each. */
const LIFETIMES: Readonly<Record<string, string>> = {
  request: "Lifetime.Request",
  singleton: "Lifetime.Singleton",
  transient: "Lifetime.Transient",
};

/** The one dependency gen gives an Integration that declares no constructor (ADR 0308). */
const INTEGRATION_RUNTIME: TokenRef = {
  class: { name: "IntegrationRuntime", from: "@stackra/integrations" },
};

/** The one dependency gen gives an Agent that declares no constructor: `Promptable`'s runtime (ADR 0100, STA-903). */
const AGENT_RUNTIME: TokenRef = { class: { name: "AgentRuntime", from: "@stackra/ai" } };

/** The constructor tokens of a class: its own, or the runtime its kind base takes (Integration, Agent). */
function depsOf(declared: DeclaredClass): readonly TokenRef[] {
  if (declared.deps.length > 0) return declared.deps;
  if (declared.kind === "integration") return [INTEGRATION_RUNTIME];
  if (declared.kind === "agent") return [AGENT_RUNTIME];
  return declared.deps;
}

/** The one dependency of a generated service client: the transport driver the topology picks (ADR 0260 d6). */
const CLIENT_TRANSPORT: ClassRef = { name: "ClientTransport", from: "@stackra/clients/contracts" };

/** The constructor tokens of a platform service or a generated client gen binds, when `target` is one. */
function platformDeps(target: ClassRef): readonly (ClassRef | TokenRef)[] | undefined {
  if (target.from.startsWith(CLIENTS_SPECIFIER)) return [CLIENT_TRANSPORT];
  for (const [key, deps] of Object.entries(PLATFORM_BINDINGS)) {
    const [pkg = "", name] = key.split("#");
    if (name === target.name && (target.from === pkg || target.from.startsWith(`${pkg}/`)))
      return deps;
  }
  return undefined;
}

/** Whether `value` is a class written as a value. */
function isClassValue(value: unknown): value is ClassValue {
  return typeof value === "object" && value !== null && "$class" in value;
}

/** A member class as a reference generated files import. */
function own(declared: DeclaredClass): ClassRef {
  return { name: declared.name, from: declared.importPath };
}

/** An array literal of printed items. */
function list(items: readonly string[]): string {
  return `[${items.join(", ")}]`;
}

/** One driver candidate: its name (the file prefix), its class and its constructor tokens. */
interface Candidate {
  readonly name: string;
  readonly type: ClassRef;
  readonly deps: readonly TokenRef[];
}

/** The drivers of one port in the wiring, with the names the member itself declares. */
interface PortTable {
  readonly port: ClassRef;
  readonly key: string;
  readonly candidates: Candidate[];
  readonly own: string[];
  selectedBy?: string | undefined;
}

/** A package's driver table as its manifest records it (STA-1297). */
interface PackageTable {
  readonly candidates: Candidate[];
  selectedBy?: string | undefined;
  config?: ClassRef | undefined;
}

/** Whether `value` is a class reference as a manifest writes one. */
function isClassRef(value: unknown): value is ClassRef {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ClassRef).name === "string" &&
    typeof (value as ClassRef).from === "string"
  );
}

/** A token as a manifest writes it (`{ class: { name, from }, named?, of? }`), or undefined. */
function tokenOf(value: unknown): TokenRef | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { class: type, named: name, of } = value as Record<string, unknown>;
  if (!isClassRef(type)) return undefined;
  return {
    class: { name: type.name, from: type.from },
    ...(typeof name === "string" ? { named: name } : {}),
    ...(isClassRef(of) ? { of: { name: of.name, from: of.from } } : {}),
  };
}

/**
 * The driver tables the declared packages' manifests record, by port key: each candidate's class, entry and tokens
 * (`classes`) and the config that selects one. The manifest is the one source (gen's AGENTS.md); a package whose
 * manifest predates `classes` contributes nothing.
 */
function dependencyDriverTables(ir: MemberIR): Map<string, PackageTable> {
  const tables = new Map<string, PackageTable>();
  for (const { manifest } of ir.dependencies) {
    if (manifest.kind === "app") continue;
    for (const driver of manifest.drivers ?? []) {
      const classes = driver["classes"];
      if (typeof classes !== "object" || classes === null) continue;
      const table = tables.get(driver.key) ?? { candidates: [] };
      for (const [name, value] of Object.entries(classes as Record<string, unknown>)) {
        const { class: type, from, deps } = (value ?? {}) as Record<string, unknown>;
        if (typeof type !== "string" || typeof from !== "string") continue;
        if (table.candidates.some((known) => known.name === name)) continue;
        table.candidates.push({
          name,
          type: { name: type, from },
          deps: (Array.isArray(deps) ? deps : [])
            .map(tokenOf)
            .filter((dep): dep is TokenRef => dep !== undefined),
        });
      }
      const selectedBy = driver["selectedBy"];
      if (typeof selectedBy === "string") table.selectedBy ??= selectedBy;
      const { class: configClass, from: configFrom } = (driver["config"] ?? {}) as Record<
        string,
        unknown
      >;
      if (typeof configClass === "string" && typeof configFrom === "string")
        table.config ??= { name: configClass, from: configFrom };
      tables.set(driver.key, table);
    }
  }
  return tables;
}

/**
 * The config classes the declared packages' manifests list, as `<member>#<Class>` to config key: each package's
 * `config` section and each driver's selecting `config` (STA-1308). A name is never guessed from its `Config` suffix.
 */
function dependencyConfigs(ir: MemberIR): Map<string, string> {
  const configs = new Map<string, string>();
  for (const { manifest } of ir.dependencies) {
    if (manifest.kind === "app") continue;
    const section = Array.isArray(manifest["config"]) ? (manifest["config"] as unknown[]) : [];
    for (const item of section) {
      const { key, class: type } = (item ?? {}) as Record<string, unknown>;
      if (typeof key === "string" && typeof type === "string")
        configs.set(`${manifest.member}#${type}`, key);
    }
    for (const driver of manifest.drivers ?? []) {
      const { class: type } = (driver["config"] ?? {}) as Record<string, unknown>;
      const name = `${manifest.member}#${String(type)}`;
      if (typeof type === "string" && !configs.has(name))
        configs.set(name, configKeyOf(type, manifest.member));
    }
  }
  return configs;
}

/** Sorts module keys so each comes after the modules it depends on; a cycle keeps source order. */
function topological(
  keys: readonly string[],
  edges: ReadonlyMap<string, readonly string[]>,
): string[] {
  const out: string[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (key: string): void => {
    if (state.has(key)) return;
    state.set(key, "visiting");
    for (const dependency of edges.get(key) ?? []) if (keys.includes(dependency)) visit(dependency);
    state.set(key, "done");
    out.push(key);
  };
  for (const key of keys) visit(key);
  return out;
}

/**
 * The wiring file of `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitWiring(ir); // the content of `.stackra/gen/wiring.ts`
 */
export function emitWiring(ir: MemberIR): string {
  const imports = new Map<string, Map<string, boolean>>();
  const local = new Map<string, string>();
  const use = (from: string, name: string, typeOnly = false): void => {
    const names = imports.get(from) ?? new Map<string, boolean>();
    names.set(name, typeOnly && (names.get(name) ?? true));
    imports.set(from, names);
  };
  /** The local name a class is printed by, importing it once; a clash gets the module key as a prefix. */
  const ref = (target: ClassRef, prefix = "Imported"): string => {
    const key = `${target.from}#${target.name}`;
    const known = local.get(key);
    if (known !== undefined) return known;
    const taken = new Set(local.values());
    let name = target.name;
    if (taken.has(name)) name = `${prefix}${target.name}`;
    for (let index = 2; taken.has(name); index += 1) name = `${prefix}${target.name}${index}`;
    local.set(key, name);
    use(target.from, name === target.name ? target.name : `${target.name} as ${name}`);
    return name;
  };
  const token = (dep: TokenRef): string => {
    if (dep.of !== undefined) return `${ref(dep.of)}(${ref(dep.class)})`;
    const port = ref(dep.class);
    if (dep.named === undefined) return port;
    use("@stackra/container", "named");
    return `named(${port}, ${JSON.stringify(dep.named)})`;
  };

  use("@stackra/container", "Wiring", true);
  const lines: string[] = [];
  const root = rootModuleOf(ir);
  const rootName = root === undefined ? undefined : ref(root);

  // Modules, own then each dependency's, in dependency order.
  const moduleOf = new Map(ir.classes.map((declared) => [declared.name, declared.module]));
  const edges = new Map<string, string[]>();
  for (const key of ir.modules) {
    const dependsOn = new Set<string>();
    for (const declared of ir.classes.filter((candidate) => candidate.module === key))
      for (const dep of declared.deps) {
        const target = moduleOf.get(dep.class.name);
        if (target !== undefined && target !== key && dep.class.from.startsWith("#"))
          dependsOn.add(target);
      }
    edges.set(key, [...dependsOn].sort());
  }
  const moduleLines: string[] = [];
  for (const key of topological(ir.modules, edges)) {
    const moduleClass = ir.classes.find(
      (declared) => declared.kind === "module" && declared.module === key,
    );
    const exported = moduleClass?.options["exports"];
    const exports = Array.isArray(exported)
      ? exported.filter(isClassValue).map((value) => ref({ name: value.$class, from: value.from }))
      : [];
    const type =
      moduleClass !== undefined ? ref(own(moduleClass)) : key === ir.member ? rootName : undefined;
    moduleLines.push(
      `    ${key}: { exports: ${list(exports)}, dependsOn: ${list((edges.get(key) ?? []).map((edge) => JSON.stringify(edge)))}` +
        `${type !== undefined ? `, type: ${type}` : ""} },`,
    );
  }
  for (const { package: name, manifest } of ir.dependencies) {
    const entry = manifest.modules?.find((candidate) => candidate.key === manifest.member);
    if (entry?.class === undefined || manifest.kind === "app") continue;
    const type = ref({ name: entry.class, from: `${name}/node` });
    moduleLines.push(
      `    ${manifest.member}: { exports: [], dependsOn: ${list(entry.dependsOn.map((edge) => JSON.stringify(edge)))}, ` +
        `from: ${JSON.stringify(name)}, type: ${type} },`,
    );
  }

  // Bindings and the platform set: constructor tokens from @stackra packages.
  const platform: string[] = [];
  const bindingLines: string[] = [];
  for (const declared of ir.classes) {
    if (!BINDING_KINDS.includes(declared.kind)) continue;
    const deps = depsOf(declared);
    for (const dep of deps)
      if (
        dep.class.from.startsWith("@stackra/") &&
        dep.named === undefined &&
        dep.of === undefined &&
        !platform.includes(ref(dep.class))
      )
        platform.push(ref(dep.class));
    const lifetime = declared.lifetime === undefined ? undefined : LIFETIMES[declared.lifetime];
    if (lifetime !== undefined) use("@stackra/container", "Lifetime");
    bindingLines.push(
      `    { module: ${JSON.stringify(declared.module)}, kind: ${JSON.stringify(declared.kind)}, provide: ${ref(own(declared))}` +
        `${lifetime !== undefined ? `, lifetime: ${lifetime}` : ""}, deps: ${list(deps.map(token))} },`,
    );
  }

  // Config classes and their host overrides.
  const configLines: string[] = [];
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "config")) {
    const override = declared.base !== undefined && !declared.base.own;
    const key = configKeyOf(
      override && declared.base !== undefined ? declared.base.name : declared.name,
      ir.member,
    );
    const provide =
      override && declared.base !== undefined ? ref(declared.base, "Base") : ref(own(declared));
    const schema = declared.options["schema"];
    const env = declared.options["env"];
    configLines.push(
      `    { key: ${JSON.stringify(key)}, provide: ${provide}` +
        `${override ? `, override: ${ref(own(declared))}` : ""}` +
        `${isClassValue(schema) ? `, schema: ${ref({ name: schema.$class, from: schema.from })}` : ""}` +
        `${typeof env === "object" && env !== null ? `, env: ${JSON.stringify(env)}` : ""} },`,
    );
  }

  // Drivers per port: the member's own, then (in the worklist below) each declared package's table of a port the
  // member's bindings reach, read from that package's manifest (STA-1297). And the config fields that select them.
  const ports = new Map<string, PortTable>();
  for (const declared of ir.classes) {
    if (declared.kind !== "driver" || declared.partner === undefined) continue;
    const port: ClassRef = { name: declared.partner.name, from: declared.partner.from };
    const member = port.from.startsWith("#")
      ? ir.member
      : (ir.dependencies.find(
          (candidate) =>
            port.from === candidate.package || port.from.startsWith(`${candidate.package}/`),
        )?.manifest.member ?? ir.member);
    const key = portKey(member, port.name);
    const entry = ports.get(key) ?? { port, key, candidates: [], own: [] };
    const name = driverName(declared.file, port.name);
    entry.candidates.push({ name, type: own(declared), deps: declared.deps });
    entry.own.push(name);
    ports.set(key, entry);
  }
  const selectors = new Map<string, { selectedBy?: string; named?: string }>();
  for (const declared of ir.classes.filter((candidate) => candidate.kind === "config")) {
    const schema = declared.options["schema"];
    const shape = isClassValue(schema)
      ? ir.shapes.find((candidate) => candidate.name === schema.$class)
      : undefined;
    const key = configKeyOf(declared.name, ir.member);
    for (const field of shape?.fields ?? []) {
      const selector =
        field.type.kind === "driver_name"
          ? "selectedBy"
          : field.type.kind === "record" && field.type.value.kind === "driver_name"
            ? "named"
            : undefined;
      const port =
        field.type.kind === "driver_name"
          ? field.type.port
          : field.type.kind === "record" && field.type.value.kind === "driver_name"
            ? field.type.value.port
            : undefined;
      if (selector === undefined || port === undefined) continue;
      const current = selectors.get(port) ?? {};
      const value = `config:${key}.${field.name}`;
      selectors.set(
        port,
        selector === "selectedBy"
          ? { ...current, selectedBy: value }
          : { ...current, named: value },
      );
    }
  }

  // The declared packages' driver tables by port key, and the member of each package (STA-1297).
  const packageTables = dependencyDriverTables(ir);
  const packageConfigs = dependencyConfigs(ir);
  const memberOf = (from: string): string =>
    ir.dependencies.find(
      (candidate) => from === candidate.package || from.startsWith(`${candidate.package}/`),
    )?.manifest.member ?? snakeCase(from.replace(/^@[^/]+\//, "").split("/")[0] ?? from);
  const configKeys = new Set(configLines.map((line) => /key: "([^"]+)"/.exec(line)?.[1]));
  const linked = new Set<string>();
  /** The tokens `dep` brings: its package's driver table and a package config row (STA-1297). */
  const link = (dep: TokenRef): readonly TokenRef[] => {
    const from = dep.class.from;
    if (dep.of !== undefined || from.startsWith("#") || from.startsWith(".")) return [];
    const brought: TokenRef[] = [];
    // A package config class (its manifest lists it) a binding or a driver injects: its row, unless the member
    // overrides it.
    const configKey = packageConfigs.get(`${memberOf(from)}#${dep.class.name}`);
    if (configKey !== undefined) {
      if (!configKeys.has(configKey)) {
        configKeys.add(configKey);
        configLines.push(
          `    { key: ${JSON.stringify(configKey)}, provide: ${ref(dep.class, "Base")} },`,
        );
      }
      return brought;
    }
    const key = portKey(memberOf(from), dep.class.name);
    const table = packageTables.get(key);
    if (table === undefined || linked.has(key)) return brought;
    linked.add(key);
    const entry = ports.get(key) ?? { port: dep.class, key, candidates: [], own: [] };
    for (const candidate of table.candidates)
      if (!entry.candidates.some((known) => known.name === candidate.name)) {
        entry.candidates.push(candidate);
        brought.push(...candidate.deps);
      }
    entry.selectedBy ??= table.selectedBy;
    if (table.config !== undefined) brought.push({ class: table.config });
    ports.set(key, entry);
    return brought;
  };

  // Bindings gen adds: one per per-model token, the inbound webhook route, and each platform service it knows where
  // it is injected. A worklist, so `journalOf(M)` brings `Locks` with it.
  const used: { readonly module: string; readonly dep: TokenRef }[] = [];
  for (const declared of ir.classes)
    if (BINDING_KINDS.includes(declared.kind) || declared.kind === "driver")
      for (const dep of depsOf(declared)) used.push({ module: declared.module, dep });
  if (webhookIntegrations(ir).length > 0) {
    const receiver: TokenRef = { class: { name: "WebhookReceiver", from: "@stackra/webhooks" } };
    const route = ref({ name: "InboundWebhooksController", from: "#stackra/webhooks" });
    bindingLines.push(
      `    { module: ${JSON.stringify(ir.member)}, kind: "controller", provide: ${route}, deps: [${token(receiver)}] },`,
    );
    used.push({ module: ir.member, dep: receiver });
  }
  const contributedConfigs: { readonly key: string; readonly provide: ClassRef }[] = [];
  // A service's request guards and health indicators, from each declared package (STA-1385), with their config rows.
  if (ir.layout === "service") {
    const declares = (name: string): boolean =>
      (ir.packages ?? []).includes(name) ||
      ir.dependencies.some((dependency) => dependency.package === name);
    for (const contribution of SERVER_CONTRIBUTIONS) {
      if (!declares(contribution.package)) continue;
      const tokens = contribution.deps.map((dep): TokenRef => ({ class: dep }));
      bindingLines.push(
        `    { module: ${JSON.stringify(ir.member)}, kind: "service", provide: ${ref(contribution.provide)}, deps: ${list(tokens.map(token))} },`,
      );
      contributedConfigs.push(...contribution.configs);
      for (const dep of tokens) used.push({ module: ir.member, dep });
    }
  }
  const added = new Set<string>();
  // The array iterator reads the live length, so the links pushed below are walked too.
  for (const { module, dep } of used) {
    for (const next of link(dep)) used.push({ module, dep: next });
    const factory = dep.of;
    const deps: readonly (ClassRef | TokenRef)[] | undefined =
      factory !== undefined
        ? Object.values(MODEL_TOKENS).find(
            (candidate) =>
              candidate.factory.name === factory.name && candidate.factory.from === factory.from,
          )?.deps
        : dep.named === undefined
          ? platformDeps(dep.class)
          : undefined;
    const key = `${factory?.name ?? ""}:${dep.class.from}#${dep.class.name}`;
    if (deps === undefined || added.has(key)) continue;
    added.add(key);
    const tokens = deps.map((target): TokenRef => ("class" in target ? target : { class: target }));
    bindingLines.push(
      `    { module: ${JSON.stringify(module)}, kind: "service", provide: ${token(dep)}, deps: ${list(tokens.map(token))} },`,
    );
    for (const next of tokens) used.push({ module, dep: next });
  }
  // The contributions' config rows, after the packages' own rows (a package manifest or a host override wins).
  for (const config of contributedConfigs) {
    const provide = ref(config.provide, "Base");
    const provided = (line: string): boolean => new RegExp(`provide: ${provide}[ ,]`).test(line);
    if (configKeys.has(config.key) || configLines.some(provided)) continue;
    configKeys.add(config.key);
    configLines.push(`    { key: ${JSON.stringify(config.key)}, provide: ${provide} },`);
  }

  const driverLines: string[] = [];
  const registry: string[] = [];
  for (const { port, key, candidates, own: owned, selectedBy } of ports.values()) {
    const selected = selectors.get(port.name);
    const select = selected?.selectedBy ?? selectedBy;
    const deps = candidates
      .filter((candidate) => candidate.deps.length > 0)
      .map((candidate) => `${JSON.stringify(candidate.name)}: ${list(candidate.deps.map(token))}`);
    driverLines.push(
      "    {",
      `      port: ${ref(port)},`,
      `      key: ${JSON.stringify(key)},`,
      ...(select !== undefined ? [`      selectedBy: ${JSON.stringify(select)},`] : []),
      ...(selected?.named !== undefined ? [`      named: ${JSON.stringify(selected.named)},`] : []),
      "      candidates: {",
      ...candidates.map(
        (candidate) =>
          `        ${JSON.stringify(candidate.name)}: () => import(${JSON.stringify(candidate.type.from)}).then((m) => m.${candidate.type.name}),`,
      ),
      "      },",
      ...(deps.length > 0 ? [`      deps: { ${deps.join(", ")} },`] : []),
      "    },",
    );
    // A package's own port names are its `DriverRegistry` augmentation; the member augments only its own drivers.
    const driverNames = [...new Set(owned)].sort();
    if (driverNames.length > 0)
      registry.push(
        `    ${JSON.stringify(key)}: ${driverNames.map((name) => JSON.stringify(name)).join(" | ")};`,
      );
  }

  // Replacements and partners.
  const replaceLines: string[] = [];
  const partnerLines: string[] = [];
  for (const declared of ir.classes) {
    for (const facet of declared.facets.filter((candidate) => candidate.name === "Replaces"))
      if (isClassValue(facet.options))
        replaceLines.push(
          `    { provide: ${ref({ name: facet.options.$class, from: facet.options.from })}, override: ${ref(own(declared))} },`,
        );
    const partner = declared.partner;
    if (partner === undefined || declared.kind === "driver") continue;
    const owner = ir.classes.find(
      (candidate) => candidate.name === partner.name && candidate.kind === "model",
    );
    const named = owner !== undefined ? modelKey(owner.module, owner.name) : partner.name;
    partnerLines.push(
      `    { class: ${ref(own(declared))}, partner: ${JSON.stringify(named)}${partner.slot !== undefined ? `, slot: ${JSON.stringify(partner.slot)}` : ""} },`,
    );
  }

  lines.push(
    ...(registry.length > 0
      ? [
          "/** The driver names gen found for each port, keyed by port key; `DriverName<Port>` reads them. */",
          'declare module "@stackra/container" {',
          "  interface DriverRegistry {",
          ...registry,
          "  }",
          "}",
          "",
        ]
      : []),
    "/** The container wiring of this member. */",
    "export const wiring = {",
    `  member: ${JSON.stringify(ir.member)},`,
    `  package: ${JSON.stringify(ir.package)},`,
    ...(rootName !== undefined ? [`  root: ${rootName},`] : []),
    "  modules: {",
    ...moduleLines,
    "  },",
    `  platform: ${list(platform)},`,
    "  bindings: [",
    ...bindingLines,
    "  ],",
    "  config: [",
    ...configLines,
    "  ],",
    "  drivers: [",
    ...driverLines,
    "  ],",
    "  replaces: [",
    ...replaceLines,
    "  ],",
    "  partners: [",
    ...partnerLines,
    "  ],",
    "} satisfies Wiring;",
  );

  const header = generatedHeader({
    from: "the kind classes under src/, their constructor parameter types and src/config/*.config.ts",
    purpose:
      `the container wiring of ${ir.package}: the module graph, the platform classes it injects, every binding with ` +
      "its kind, module, lifetime and constructor tokens, the config classes, the drivers per port with lazy " +
      "candidates, the replacements and the partners.",
    boundary:
      "derived at build time from each file's path, base class and constructor parameter types; no reflect-metadata " +
      "and no string token. A class is its own token; a class without `@Lifetime` is a singleton.",
    runtime: "isomorphic",
  });
  return [header, ...importLines(imports), "", ...lines].join("\n") + "\n";
}
