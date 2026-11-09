/**
 * Stackra file contract:
 * Purpose: `emitRegistrations`, the member's `#stackra/registrations` (`.stackra/gen/registrations.ts`): it loads the
 *          generated entity and schemas files, then makes every registration call the platform packages wait for,
 *          from the identities the manifest locked: the hosted packages' entities (the service's own files written from
 *          their manifests, STA-1667, or an older manifest's entity list), the model partners of each
 *          `CrudService<M>` (and of every `CrudService<M>` its packages' manifests list with its model, `services[].partner`), the integration events' wire names (its own, and those of the consumed services' events its
 *          listeners import from `#stackra/clients/<service>`, so its inbox rebuilds them), each listener with the event
 *          class it reacts to, the relay listeners, the change consumers with the models their `@ConsumesChanges` names, the outbound webhooks, the job actions for the queue
 *          and the scheduler, the cached queries with invalidating events (`registerCachedQueries`, STA-1445), the connections, the webhook events, the sequences, the entitlements with the calls they gate (`registerEntitlements`, STA-903)
 *          the `@Searchable` models, each report with its source model (`registerReportSources`, ADR 0470), and the
 *          locked key of every `Permission` static and module role, the hosted packages' included (`registerPermissions`,
 *          then `registerRoles`; without
 *          them the decision point cannot tell a system or restricted permission, and a module role holds nothing,
 *          STA-1702), each record policy with its model (`registerPolicies`; without it `ctx.authorize(record)` runs no
 *          policy, STA-2045), each extension on its point's slot with its order (`registerExtensions`; without it every
 *          slot runs none), and every action and query with its locked key, permission, risk, effects and input class
 *          (`registerActions`; without it the pipeline checks no permission and validates no input, STA-2025).
 * Boundary: pure. Node only: the server entry and the generated test setup import it before the container boots. A
 *           service registers its own classes and those its hosted packages list in their manifests (imported from
 *           the entry that exports each file); a package registers its own. A call with no row is not written, and a
 *           member with nothing to register gets no file. Factory partners are the test setup's, never this file's.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22: identities from the manifest); ADR 0097 (decision 5.4);
 *                     ADR 0305 (rule 5: partners); ADR 0141; ADR 0308 (rules 2 and 15); ADR 0224; ADR 0221
 *                     (decision 5); ADR 0342 (decision 5: registered sequences); ADR 0260 (decision 4: typed
 *                     subscriptions by import; a relay is the one all-events listener); ADR 0215 and STA-903 (entitlement rows); ADR 0336 (a model addition module loads its side-table entities); ADR 0305 (rule 31: the query
 *                     cache's evictor); STA-1387
 *                     (`registerEventNames` from @stackra/events, below @stackra/actions: no package cycle); data-layer gap
 *                     cdc2 (`@ConsumesChanges` replaces hand `registerChangeConsumers` calls).
 */
import type { StackraManifest } from "@stackra/contracts";
import { camelCase } from "@stackra/support";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { connectionOf } from "#core/functions/connection-of.function";
import { emitHostedEntities } from "#core/functions/emit-hosted-entities.function";
import { entitiesFile } from "#core/functions/entities-file.function";
import { entitiesName } from "#core/functions/entities-name.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { ownClass } from "#core/functions/own-class.function";
import { packageSpecifier } from "#core/functions/package-specifier.function";
import { schemaModules } from "#core/functions/schema-modules.function";
import { serviceManifest } from "#core/functions/service-manifest.function";
import { shapeOfRef } from "#core/functions/shape-of-ref.function";
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
    // An unresolved type reads as `unknown`: importing it would register `undefined`, and nothing typechecks
    // .stackra/gen, so the run stops here instead of shipping a broken route (SHIP, 0.29).
    if (target.name === "unknown")
      throw new TypeError(
        `gen would import \`unknown\` from ${target.from} into registrations.ts; the reader names no class there`,
      );
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
    const declared = ownClass(ir, name, module);
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
      .map((module) => `import "${entitiesFile(ir, module).specifier}";`),
    ...schemaModules(ir).map((module) => `import "#stackra/schemas/${module}";`),
  ];

  // The hosted packages' entities: the service's own files written from their manifests (STA-1667), which register
  // themselves when loaded; a package whose manifest records no entity facts keeps its `<MODULE>_ENTITIES` import.
  if (ir.layout === "service") {
    const hosted = emitHostedEntities(ir).map((file) => file.path);
    loads.push(
      ...hosted.map(
        (path) => `import "#stackra/${path.slice(".stackra/gen/".length, -".ts".length)}";`,
      ),
    );
    const covered = new Set(hosted.map((path) => path.split("/")[4]));
    const lists = ir.dependencies
      .filter(
        ({ manifest: dependency }) =>
          dependency.kind !== "app" &&
          !covered.has(dependency.member) &&
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

  // A package's `CrudService<M>` is typed against its own model; the base's type argument is gone at runtime, so its
  // manifest keeps the pair (`services[].partner`) and a service registers it for every package it hosts. A package
  // registers only its own.
  const packagePartners = (ir.layout === "service" ? ir.dependencies : [])
    .filter(({ manifest: dependency }) => dependency.kind !== "app")
    .flatMap(({ manifest: dependency }) => {
      const rows: unknown = dependency["services"];
      return (Array.isArray(rows) ? rows : []).flatMap((row: unknown) => {
        const service = classRefIn(row, "class");
        const model =
          typeof row === "object" && row !== null
            ? classRefIn(Reflect.get(row, "partner"), "name")
            : undefined;
        return service === undefined || model === undefined
          ? []
          : [`[${ref(service)}, ${ref(model)}]`];
      });
    });
  call("registerModelPartners", "@stackra/database", [
    ...ir.classes
      .filter((declared) => declared.kind === "service" && declared.partner !== undefined)
      .map((declared) =>
        declared.partner === undefined
          ? undefined
          : `[${ref({ name: declared.name, from: declared.importPath })}, ${ref({ name: declared.partner.name, from: declared.partner.from })}]`,
      ),
    ...packagePartners,
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

  // Each `@ConsumesChanges(Model)` (or `([A, B])`) service with the models it watches (data-layer gap cdc2).
  call(
    "registerChangeConsumers",
    "@stackra/outbox",
    ir.classes.flatMap((declared) =>
      declared.facets
        .filter((facet) => facet.name === "ConsumesChanges" && facet.target === "class")
        .flatMap((facet) => (Array.isArray(facet.options) ? facet.options : [facet.options]))
        .map((model: unknown) => {
          if (typeof model !== "object" || model === null || !("$class" in model)) return undefined;
          const { $class, from } = model as { readonly $class: unknown; readonly from: unknown };
          if (typeof $class !== "string" || typeof from !== "string") return undefined;
          return `[${ref({ name: $class, from })}, ${ref({ name: declared.name, from: declared.importPath })}]`;
        }),
    ),
  );

  const actionRows = (manifest.actions ?? []) as readonly Entry[];
  const jobs = actionRows
    .filter((entry) => entry["kind"] === "action" && entry["job"] !== undefined)
    .map((entry) => {
      const type = classOf(entry);
      return type === undefined
        ? undefined
        : `{ type: ${type}, key: ${JSON.stringify(entry["key"])} }`;
    });
  call("registerJobs", "@stackra/queue", jobs);

  // Each query whose `cache` names invalidating events, so the evictor forgets it after them (ADR 0305 rule 31).
  call(
    "registerCachedQueries",
    "@stackra/actions",
    actionRows
      .filter((entry) => {
        const cache = entry["cache"] as { readonly invalidateOn?: unknown } | undefined;
        return (
          entry["kind"] === "query" &&
          Array.isArray(cache?.invalidateOn) &&
          cache.invalidateOn.length > 0
        );
      })
      .map((entry) => classOf(entry)),
  );
  call("registerScheduledJobs", "@stackra/scheduler", jobs);

  const integrations = Array.isArray(manifest["integrations"])
    ? (manifest["integrations"] as readonly Entry[])
    : [];
  call(
    "registerConnections",
    "@stackra/integrations",
    integrations.map((entry) => {
      // classOf imports what it names: an integration without a connection is not registered, so not imported (STA-1803)
      if (typeof entry["connection"] !== "string") return undefined;
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
        const connection = connectionOf(ir.classes, partner.name);
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

  // Each report with its source model, the type argument run time has lost (`EngineReportRunnerDriver` reads it).
  call(
    "registerReportSources",
    "@stackra/reports/node",
    ir.classes
      .filter((declared) => declared.kind === "report" && declared.partner !== undefined)
      .map((declared) =>
        declared.partner === undefined
          ? undefined
          : `[${ref({ name: declared.name, from: declared.importPath })}, ${ref({ name: declared.partner.name, from: declared.partner.from })}]`,
      ),
  );

  // Every Permission static by its locked key, own and hosted packages' (the manifest merges both), then each module
  // role, whose grants resolve through those keys, so `registerPermissions` is written first (STA-1702, STA-1710).
  const sets = new Map<string, { readonly entry: Entry; readonly keys: string[] }>();
  for (const entry of (manifest.permissions ?? []) as readonly Entry[]) {
    const id = `${String(entry["from"] ?? "")}#${String(entry["class"])}`;
    const key = String(entry["key"]);
    // a manifest written before STA-1710 has no `member`: the static is the key's verb in camelCase
    const member =
      typeof entry["member"] === "string"
        ? entry["member"]
        : camelCase(key.split(".").at(-1) ?? "");
    const set = sets.get(id) ?? { entry, keys: [] };
    set.keys.push(`${member}: ${JSON.stringify(key)}`);
    sets.set(id, set);
  }
  call(
    "registerPermissions",
    "@stackra/container",
    [...sets.values()].map(({ entry, keys }) => {
      const type = classOf(entry);
      return type === undefined ? undefined : `{ type: ${type}, keys: { ${keys.join(", ")} } }`;
    }),
  );
  call(
    "registerRoles",
    "@stackra/iam",
    ((manifest["roles"] ?? []) as readonly Entry[]).map((entry) => {
      const type = classOf(entry);
      return type === undefined
        ? undefined
        : `{ type: ${type}, key: ${JSON.stringify(entry["key"])} }`;
    }),
  );

  // Each extension on the slot of the point its type argument names (`Extension<Point["slot"]>`), with its order, so the
  // slot runs it (ADR 0305 rules 22 to 25; gen read the point and slot, which run time has lost).
  // shortcut: a hosted package's extensions are not registered, since its manifest does not list them yet; upgrade when
  // the manifest records each extension with its point, slot and file.
  call(
    "registerExtensions",
    "@stackra/actions",
    ir.classes
      .filter((declared) => declared.kind === "extension")
      .map((declared) => {
        const partner = declared.partner;
        if (partner === undefined || partner.slot === undefined) return undefined;
        const order = declared.options["order"];
        return `{ point: ${ref({ name: partner.name, from: partner.from })}, slot: ${JSON.stringify(partner.slot)}, extension: ${ref({ name: declared.name, from: declared.importPath })}${typeof order === "number" ? `, order: ${order}` : ""} }`;
      }),
  );

  // Each record policy with the model it judges, own and hosted, so `ctx.authorize(record)` runs it (ADR 0132 as
  // amended, STA-2045); the base's type argument is gone at runtime, so this row is the only pairing.
  // shortcut: a hosted policy whose model the package does not declare (no `modelFile`) is not registered; upgrade when
  // the manifest names the model's package and file.
  call(
    "registerPolicies",
    "@stackra/iam",
    ((manifest["policies"] ?? []) as readonly Entry[]).map((entry) => {
      // The model is resolved first, so a row that cannot be written imports nothing.
      if (typeof entry["from"] === "string" && typeof entry["modelFile"] !== "string")
        return undefined;
      const partner =
        typeof entry["from"] === "string"
          ? undefined
          : ir.classes.find(
              (declared) => declared.name === entry["class"] && declared.module === entry["module"],
            )?.partner;
      const model =
        typeof entry["from"] === "string"
          ? classOf(entry, "model", "modelFile")
          : partner === undefined
            ? undefined
            : ref({ name: partner.name, from: partner.from });
      if (model === undefined) return undefined;
      const policy = classOf(entry);
      return policy === undefined ? undefined : `{ model: ${model}, policy: ${policy} }`;
    }),
  );

  // Every action and query with the identities the manifest locked, own and hosted, so the pipeline checks the
  // permission and validates the input (ADR 0098, STA-2025). Every row carries its permission: an anonymous caller of a
  // class that lists `ActorKind.Anonymous` skips the check in the access-control driver, never by a missing row.
  // shortcut: a hosted package's input class is not imported, since its manifest names the input schema but not the
  // file that declares it; its calls are permission-checked but not validated until the manifest carries that file.
  // The output class rides along so the idempotency store leaves out its `@ShownOnce` fields (STA-2568).
  const shapeOf = (entry: Entry, side: "input" | "output"): string | undefined => {
    if (typeof entry["from"] === "string") return undefined;
    const shape = shapeOfRef(ir, entry[side]);
    return shape === undefined ? undefined : ref({ name: shape.name, from: shape.importPath });
  };
  call(
    "registerActions",
    "@stackra/actions",
    ((manifest.actions ?? []) as readonly Entry[]).map((entry) => {
      const type = classOf(entry);
      if (type === undefined) return undefined;
      const input = shapeOf(entry, "input");
      const output = shapeOf(entry, "output");
      const effects = entry["effects"];
      return (
        `{ type: ${type}, key: ${JSON.stringify(entry["key"])}, permission: ${JSON.stringify(entry["permission"])}, risk: ${JSON.stringify(entry["risk"])}` +
        `${Array.isArray(effects) && effects.length > 0 ? `, effects: ${JSON.stringify(effects)}` : ""}` +
        `${input === undefined ? "" : `, input: ${input}`}` +
        `${output === undefined ? "" : `, output: ${output}`} }`
      );
    }),
  );

  if (loads.length === 0 && calls.length === 0) return undefined;
  const header = generatedHeader({
    from: "stackra.manifest.json and the kind classes under src/",
    purpose:
      `the registrations of ${ir.package}: loads the generated entity and schemas files, then names each class the ` +
      "platform packages look up by its locked identity (entities, model partners, event wire names, listeners, relays, " +
      "change consumers, jobs, cached queries, " +
      "connections, webhook events, outbound webhooks, sequences, entitlements, searchable models, report sources, " +
      "permissions, module roles, and actions and queries).",
    boundary:
      "imported by the server entry and the generated test setup before the container boots; every row comes from " +
      "the committed identities, so a hand edit is overwritten.",
    runtime: "node",
  });
  return [header, ...loads, ...importLines(imports), "", ...calls].join("\n").replace(/\n+$/, "\n");
}

/**
 * The class a manifest row names: its `nameKey` field (`class` on a service row, `name` on a partner) with its `from`,
 * or `undefined` when the row names none.
 */
function classRefIn(row: unknown, nameKey: string): ClassRef | undefined {
  if (typeof row !== "object" || row === null) return undefined;
  const name: unknown = Reflect.get(row, nameKey);
  const from: unknown = Reflect.get(row, "from");
  return typeof name === "string" && typeof from === "string" ? { name, from } : undefined;
}
