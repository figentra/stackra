/**
 * Stackra file contract:
 * Purpose: `emitWiring`, the member's `#stackra/wiring` (`.stackra/gen/wiring.ts`): the module graph in topological
 *          order (with each dependency's module marked `from`), the platform classes the member injects, every
 *          binding with its kind, module, lifetime and constructor tokens, the config classes with their overrides,
 *          the driver table per port with lazy candidates and the `DriverRegistry` augmentation keyed by port key,
 *          the `@Replaces` replacements and the partners read from type arguments, typed `satisfies Wiring`. Gen adds
 *          the bindings no class declares: one per per-model token (`repositoryOf(M)`, `journalOf(M)` with `[Locks]`),
 *          an Integration's `IntegrationRuntime`, each generated service client (`#stackra/clients/<service>`, with the
 *          `ClientTransport` the topology picks), the generated inbound webhook route, and the platform services of
 *          `PLATFORM_BINDINGS` where they are injected (`RequestContext` where `CustomFieldService` resolves; `RuleSetService`
 *          with its `repositoryOf(Revision)`).
 * Boundary: pure. Derived from file paths, base classes and constructor parameter types at build time; no reflection
 *           and no string token. A driver is a lazy import, so a node-only driver never reaches a browser bundle. The
 *           sections other packages own (extension points, seeders, ...) are added by those targets.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 17 and 26); ADR 0263 (gen writes the wiring); ADR 0227 2026-10-24 note
 *                     (build-time wiring from constructor types); registry v3.1 section 5 item 4; ADR 0308; ADR 0224;
 *                     ADR 0260 (decisions 3 and 6: an injected client over the transport the topology picks).
 */
import { BINDING_KINDS } from "#core/constants/binding-kinds.constant";
import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { MODEL_TOKENS } from "#core/constants/model-tokens.constant";
import { PLATFORM_BINDINGS } from "#core/constants/platform-bindings.constant";
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

/** The constructor tokens of a class: its own, or the `IntegrationRuntime` of an Integration. */
function depsOf(declared: DeclaredClass): readonly TokenRef[] {
  return declared.kind === "integration" && declared.deps.length === 0
    ? [INTEGRATION_RUNTIME]
    : declared.deps;
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

  // Drivers per port, and the config fields that select them.
  const ports = new Map<string, { port: ClassRef; key: string; drivers: DeclaredClass[] }>();
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
    const entry = ports.get(key) ?? { port, key, drivers: [] };
    entry.drivers.push(declared);
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
  const driverLines: string[] = [];
  const registry: string[] = [];
  for (const { port, key, drivers } of ports.values()) {
    const selected = selectors.get(port.name);
    const candidates = drivers.map(
      (declared) =>
        `      ${JSON.stringify(driverName(declared.file, port.name))}: () => import(${JSON.stringify(declared.importPath)}).then((m) => m.${declared.name}),`,
    );
    const deps = drivers
      .filter((declared) => declared.deps.length > 0)
      .map(
        (declared) =>
          `${JSON.stringify(driverName(declared.file, port.name))}: ${list(declared.deps.map(token))}`,
      );
    driverLines.push(
      "    {",
      `      port: ${ref(port)},`,
      `      key: ${JSON.stringify(key)},`,
      ...(selected?.selectedBy !== undefined
        ? [`      selectedBy: ${JSON.stringify(selected.selectedBy)},`]
        : []),
      ...(selected?.named !== undefined ? [`      named: ${JSON.stringify(selected.named)},`] : []),
      "      candidates: {",
      ...candidates.map((line) => `  ${line}`),
      "      },",
      ...(deps.length > 0 ? [`      deps: { ${deps.join(", ")} },`] : []),
      "    },",
    );
    const driverNames = [
      ...new Set(drivers.map((declared) => driverName(declared.file, port.name))),
    ].sort();
    registry.push(
      `    ${JSON.stringify(key)}: ${driverNames.map((name) => JSON.stringify(name)).join(" | ")};`,
    );
  }

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
  const added = new Set<string>();
  for (let index = 0; index < used.length; index += 1) {
    const entry = used[index];
    if (entry === undefined) continue;
    const { module, dep } = entry;
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
