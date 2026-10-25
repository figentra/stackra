/**
 * Stackra file contract:
 * Purpose: `emitRegistrations`, the member's `#stackra/registrations` (`.stackra/gen/registrations.ts`): it loads the
 *          generated entity and schemas files, then makes every registration call the platform packages wait for,
 *          from the identities the manifest locked: the hosted packages' entity lists, the model partners of each
 *          `CrudService<M>`, the integration events' wire names and outbound webhooks, the job actions for the queue
 *          and the scheduler, the connections, the webhook events, the sequences and the `@Searchable` models.
 * Boundary: pure. Node only: the server entry and the generated test setup import it before the container boots. A
 *           service registers its own classes and those its hosted packages list in their manifests (imported from
 *           the entry that exports each file); a package registers its own. A call with no row is not written, and a
 *           member with nothing to register gets no file. Factory partners are the test setup's, never this file's.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22: identities from the manifest); ADR 0097 (decision 5.4);
 *                     ADR 0305 (rule 5: partners); ADR 0141; ADR 0308 (rules 2 and 15); ADR 0224; ADR 0221
 *                     (decision 5); ADR 0342 (decision 5: registered sequences).
 */
import type { StackraManifest } from "@stackra/contracts";

import { entitiesName } from "#core/functions/entities-name.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { packageSpecifier } from "#core/functions/package-specifier.function";
import { schemaModules } from "#core/functions/schema-modules.function";
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
      ...new Set(ir.shapes.filter((shape) => shape.kind === "model").map((shape) => shape.module)),
    ]
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

  call(
    "registerModelPartners",
    "@stackra/database",
    ir.classes
      .filter((declared) => declared.kind === "service" && declared.partner !== undefined)
      .map((declared) =>
        declared.partner === undefined
          ? undefined
          : `[${ref({ name: declared.name, from: declared.importPath })}, ${ref({ name: declared.partner.name, from: declared.partner.from })}]`,
      ),
  );

  const events = ((manifest.events ?? []) as readonly Entry[]).filter(
    (entry) => entry["kind"] === "integration",
  );
  const eventRow = (entry: Entry): string | undefined => {
    const type = classOf(entry);
    return type === undefined
      ? undefined
      : `{ type: ${type}, name: ${JSON.stringify(entry["name"])} }`;
  };
  call("registerEventNames", "@stackra/outbox", events.map(eventRow));

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
      "platform packages look up by its locked identity (entities, model partners, event wire names, jobs, " +
      "connections, webhook events, outbound webhooks, sequences and searchable models).",
    boundary:
      "imported by the server entry and the generated test setup before the container boots; every row comes from " +
      "the committed identities, so a hand edit is overwritten.",
    runtime: "node",
  });
  return [header, ...loads, ...importLines(imports), "", ...calls].join("\n").replace(/\n+$/, "\n");
}
