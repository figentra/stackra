/**
 * Stackra file contract:
 * Purpose: `emitRegistrations`, the member's `#stackra/registrations` (`.stackra/gen/registrations.ts`): it loads the
 *          generated entity and schemas files, then makes every registration call the platform packages wait for,
 *          from the identities the manifest locked: the hosted packages' entity lists, the model partners of each
 *          `CrudService<M>` (and of a platform one it injects, from `PLATFORM_PARTNERS`), the integration events' wire names (its own, and those of the consumed services' events its
 *          listeners import from `#stackra/clients/<service>`, so its inbox rebuilds them), each listener with the event
 *          class it reacts to, the relay listeners, the outbound webhooks, the job actions for the queue
 *          and the scheduler, the connections, the webhook events, the sequences, the entitlements with the calls they gate (`registerEntitlements`, STA-903)
 *          and the `@Searchable` models.
 * Boundary: pure. Node only: the server entry and the generated test setup import it before the container boots. A
 *           service registers its own classes and those its hosted packages list in their manifests (imported from
 *           the entry that exports each file); a package registers its own. A call with no row is not written, and a
 *           member with nothing to register gets no file. Factory partners are the test setup's, never this file's.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22: identities from the manifest); ADR 0097 (decision 5.4);
 *                     ADR 0305 (rule 5: partners); ADR 0141; ADR 0308 (rules 2 and 15); ADR 0224; ADR 0221
 *                     (decision 5); ADR 0342 (decision 5: registered sequences); ADR 0260 (decision 4: typed
 *                     subscriptions by import; a relay is the one all-events listener); ADR 0215 and STA-903 (entitlement rows); ADR 0336 (a model addition module loads its side-table entities); STA-1387
 *                     (`registerEventNames` from @stackra/events, below @stackra/actions: no package cycle).
 */
import type { StackraManifest } from "@stackra/contracts";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { PLATFORM_PARTNERS } from "#core/constants/platform-partners.constant";
import { entitiesName } from "#core/functions/entities-name.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { packageSpecifier } from "#core/functions/package-specifier.function";
import { schemaModules } from "#core/functions/schema-modules.function";
import { serviceManifest } from "#core/functions/service-manifest.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest entry, read loosely: each section's entries are open records. */
type Entry = Readonly<Record<string, unknown>>;

/**
 * The registrations file of `ir`, or undefined when it has nothing to register.
 *
 * @param ir - the member read by discovery.
 * @param manifest - the manifest built from `ir`, whose identities the calls name.
 * @example
 * emitRegistrations(ir, manifest); // "...registerEventNames([\n  { type: OrderPaid, name: \"orders.order.paid.v1\" },\n]);"
 */
export function emitRegistrations(ir: MemberIR, manifest: StackraManifest): string | undefined {
  if (ir.layout !== "package" && ir.layout !== "service") return undefined;
  const imports = new Map<string, Map<string, boolean>>();
  const local = new Map<string, string>();
  const use = (from: string, name: string): void => {
    const names = imports.get(from) ?? new Map<string, boolean>();
    names.set(name, false);
    imports.set(from, names);
  };
  /** The local name a class is printed by, importing it once; a clash gets a prefix. */
  const ref = (target: ClassRef): string => {
    const key = `${target.from}#${target.name}`;
    const known = local.get(key);
    if (known !== undefined) return known;
    const taken = new Set(local.values());
    let name = target.name;
    if (taken.has(name)) name = `Imported${target.name}`;
    for (let index = 2; taken.has(name); index += 1) name = `Imported${target.name}${index}`;
    local.set(key, name);
    use(target.from, name === target.name ? target.name : `${target.name} as ${name}`);
    return name;
  };
  /** A class of this member, by name and, when given, module. */
  const own = (name: string, module?: unknown): ClassRef | undefined => {
    const declared =
      ir.classes.find((candidate) => candidate.name === name && candidate.module === module) ??
      ir.classes.find((candidate) => candidate.name === name);
    return declared === undefined ? undefined : { name, from: declared.importPath };
  };
  /** The class of a manifest entry: this member's, or a hosted package's from the entry exporting its file. */
  const classOf = (entry: Entry, field = "class", file = "file"): string | undefined => {
    const name = entry[field];
    if (typeof name !== "string") return undefined;
    const from = entry["from"];
    const target =
      typeof from === "string"
        ? { name, from: packageSpecifier(from, entry[file]) }
        : own(name, entry["module"]);
    return target === undefined ? undefined : ref(target);
  };
  const calls: string[] = [];
  const call = (name: string, from: string, rows: readonly (string | undefined)[]): void => {
    const printed = rows.filter((row): row is string => row !== undefined);
    if (printed.length === 0) return;
    use(from, name);
    calls.push(`${name}([`, ...printed.map((row) => `  ${row},`), "]);", "");
  };

  const loads = [
    ...[
      ...new Set(
        ir.shapes
          .filter((shape) => shape.kind === "model" || shape.kind === "model_addition")
          .map((shape) => shape.module),
      ),
    ]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
      .map((module) => `import "#stackra/entities/${module}";`),
    ...schemaModules(ir).map((module) => `import "#stackra/schemas/${module}";`),
  ];

  // The hosted packages' entity lists; a package's own entity files register themselves.
  if (ir.layout === "service") {
    const lists = ir.dependencies
      .filter(
        ({ manifest: dependency }) =>
          dependency.kind !== "app" &&
          (dependency.models ?? []).some((model) => model["from"] === undefined),
      )
      .map(({ package: name, manifest: dependency }) =>
        ref({ name: entitiesName(dependency.member), from: `${name}/node` }),
      );
    if (lists.length > 0) {
      use("@stackra/database", "registerEntities");
      calls.push(`registerEntities([${lists.map((list) => `...${list}`).join(", ")}]);`, "");
    }
  }

  // A platform CrudService a class injects (`RuleSetService`) is typed against its package's model.
  const injected = ir.classes.flatMap((declared) =>
    declared.deps.filter((dep) => dep.of === undefined && dep.named === undefined),
  );
  const platformPartners = Object.entries(PLATFORM_PARTNERS).flatMap(([key, model]) => {
    const [pkg = "", name = ""] = key.split("#");
    const service = injected.find(
      (dep) =>
        dep.class.name === name && (dep.class.from === pkg || dep.class.from.startsWith(`${pkg}/`)),
    );
    return service === undefined ? [] : [`[${ref(service.class)}, ${ref(model)}]`];
  });
  call("registerModelPartners", "@stackra/database", [
    ...ir.classes
      .filter((declared) => declared.kind === "service" && declared.partner !== undefined)
      .map((declared) =>
        declared.partner === undefined
          ? undefined
          : `[${ref({ name: declared.name, from: declared.importPath })}, ${ref({ name: declared.partner.name, from: declared.partner.from })}]`,
      ),
    ...platformPartners,
  ]);

  const events = ((manifest.events ?? []) as readonly Entry[]).filter(
    (entry) => entry["kind"] === "integration",
  );
  const eventRow = (entry: Entry): string | undefined => {
    const type = classOf(entry);
    return type === undefined
      ? undefined
      : `{ type: ${type}, name: ${JSON.stringify(entry["name"])} }`;
  };
  // A consumed service's event a listener imports: its wire name from the producer's manifest.
  const listeners = ir.classes.filter((declared) => declared.kind === "listener");
  const remote = new Map<string, string>();
  for (const declared of listeners) {
    const event = declared.handle?.event;
    if (event === undefined || !event.from.startsWith(CLIENTS_SPECIFIER)) continue;
    const producer = serviceManifest(ir, event.from.slice(CLIENTS_SPECIFIER.length));
    const entry = ((producer?.events ?? []) as readonly Entry[]).find(
      (candidate) => candidate["kind"] === "integration" && candidate["class"] === event.name,
    );
    if (entry !== undefined && typeof entry["name"] === "string")
      remote.set(ref(event), `{ type: ${ref(event)}, name: ${JSON.stringify(entry["name"])} }`);
  }
  call("registerEventNames", "@stackra/events", [...events.map(eventRow), ...remote.values()]);
  call(
    "registerListeners",
    "@stackra/events",
    listeners.map((declared) =>
      declared.handle?.event === undefined
        ? undefined
        : `[${ref(declared.handle.event)}, ${ref({ name: declared.name, from: declared.importPath })}]`,
    ),
  );
  call(
    "registerRelays",
    "@stackra/outbox",
    listeners
      .filter((declared) => declared.handle?.relay === true)
      .map((declared) => ref({ name: declared.name, from: declared.importPath })),
  );

  const jobs = ((manifest.actions ?? []) as readonly Entry[])
    .filter((entry) => entry["kind"] === "action" && entry["job"] !== undefined)
    .map((entry) => {
      const type = classOf(entry);
      return type === undefined
        ? undefined
        : `{ type: ${type}, key: ${JSON.stringify(entry["key"])} }`;
    });
  call("registerJobs", "@stackra/queue", jobs);
  call("registerScheduledJobs", "@stackra/scheduler", jobs);

  const integrations = Array.isArray(manifest["integrations"])
    ? (manifest["integrations"] as readonly Entry[])
    : [];
  call(
    "registerConnections",
    "@stackra/integrations",
    integrations.map((entry) => {
      const connection = classOf(entry, "connection", "connectionFile");
      const integration = classOf(entry);
      return connection === undefined || integration === undefined
        ? undefined
        : `{ connection: ${connection}, integration: ${integration}, key: ${JSON.stringify(entry["key"])} }`;
    }),
  );

  call(
    "registerWebhookEvents",
    "@stackra/webhooks",
    ir.classes
      .filter((declared) => declared.kind === "webhook_event" && declared.partner !== undefined)
      .map((declared) => {
        const partner = declared.partner;
        if (partner === undefined) return undefined;
        const connection = ir.classes.find(
          (candidate) =>
            candidate.kind === "connection" && candidate.partner?.name === partner.name,
        );
        return (
          `{ event: ${ref({ name: declared.name, from: declared.importPath })}, ` +
          `integration: ${ref({ name: partner.name, from: partner.from })}` +
          `${connection !== undefined ? `, connection: ${ref({ name: connection.name, from: connection.importPath })}` : ""} }`
        );
      }),
  );

  call(
    "registerOutboundWebhooks",
    "@stackra/webhooks/node",
    events.filter((entry) => entry["webhook"] === true).map(eventRow),
  );

  call(
    "registerSequences",
    "@stackra/database",
    ((manifest["sequences"] ?? []) as readonly Entry[]).map((entry) => {
      const type = classOf(entry);
      return type === undefined
        ? undefined
        : `{ type: ${type}, key: ${JSON.stringify(entry["key"])} }`;
    }),
  );

  // Each entitlement with its locked key and the calls it gates, so `PlanSnapshotEntitlementSource` resolves every
  // class and the plan driver knows its gates (STA-903).
  const actionEntries = (manifest.actions ?? []) as readonly Entry[];
  call(
    "registerEntitlements",
    "@stackra/entitlements",
    ((manifest["entitlements"] ?? []) as readonly Entry[]).map((entry) => {
      const type = classOf(entry);
      if (type === undefined) return undefined;
      const gates = (Array.isArray(entry["gates"]) ? (entry["gates"] as unknown[]) : [])
        .map((gate) => actionEntries.find((action) => action["key"] === gate))
        .map((action) => (action === undefined ? undefined : classOf(action)))
        .filter((gate): gate is string => gate !== undefined);
      return `{ type: ${type}, key: ${JSON.stringify(entry["key"])}, gates: [${gates.join(", ")}] }`;
    }),
  );

  call(
    "registerSearchableModels",
    "@stackra/search/node",
    ((manifest.models ?? []) as readonly Entry[])
      .filter((entry) => entry["searchable"] === true)
      .map((entry) => classOf(entry)),
  );

  if (loads.length === 0 && calls.length === 0) return undefined;
  const header = generatedHeader({
    from: "stackra.manifest.json and the kind classes under src/",
    purpose:
      `the registrations of ${ir.package}: loads the generated entity and schemas files, then names each class the ` +
      "platform packages look up by its locked identity (entities, model partners, event wire names, listeners, relays, jobs, " +
      "connections, webhook events, outbound webhooks, sequences, entitlements and searchable models).",
    boundary:
      "imported by the server entry and the generated test setup before the container boots; every row comes from " +
      "the committed identities, so a hand edit is overwritten.",
    runtime: "node",
  });
  return [header, ...loads, ...importLines(imports), "", ...calls].join("\n").replace(/\n+$/, "\n");
}
