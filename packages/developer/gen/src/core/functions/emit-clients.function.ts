/**
 * Stackra file contract:
 * Purpose: `emitClients`, the clients target: one `.stackra/gen/clients/<service>.ts` per service the member injects a
 *          client of (a constructor parameter typed with a class from `#stackra/clients/<service>`) or listens to (a
 *          listener whose `handle` parameter is an event class from there), written from that
 *          service's committed `stackra.manifest.json`: its enums, its shapes as `remoteShape` classes, its refusals,
 *          its integration events, one `remoteAction` / `remoteQuery` descriptor per action and query (named after the
 *          producer's class), and the `<Service>Client` class over `ServiceClient` with one member per call
 *          (`client.product.get.call(input)`).
 * Boundary: pure. The client is a class, so it is its own DI token (`emitWiring` binds it with the `ClientTransport`
 *           the topology picks); a consumer never imports the producer's source. A consumed service without a manifest,
 *           a client imported under another name, or an event the producer does not publish as an integration event
 *           (`client_event_unknown`), is a refusal, so nothing is written. An event is subscribed to by importing its
 *           class; there is no wire-name subscription.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 2 to 6 and 10); ADR 0141 (`<module>.<name>.v<n>` wire names); ADR 0158 (the manifest is the contract); ADR 0261
 *                     (`#stackra/clients`); ADR 0263 (a class is its own token).
 */
import type { StackraManifest } from "@stackra/contracts";
import { Enum } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { camelCase } from "#core/functions/camel-case.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import { pascalCase } from "#core/functions/pascal-case.function";
import { serviceManifest } from "#core/functions/service-manifest.function";
import { zodOfJsonSchema } from "#core/functions/zod-of-json-schema.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A JSON Schema node. */
type Schema = Readonly<Record<string, unknown>>;

/** The local `$ref` prefix of a manifest schema. */
const LOCAL_REF = "#/schemas/";

/** The `ErrorKind` codes a refusal descriptor can name. */
const ERROR_KINDS = new Set<string>(Enum.values(ErrorKind));

/** Whether `value` is a JSON object. */
function isSchema(value: unknown): value is Schema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The schema key a `{ $ref }` points at, when it is local. */
function refKey(value: unknown): string | undefined {
  const target = isSchema(value) ? value["$ref"] : undefined;
  return typeof target === "string" && target.startsWith(LOCAL_REF)
    ? target.slice(LOCAL_REF.length)
    : undefined;
}

/** The entries the producer declares itself. */
function own<T extends { readonly [field: string]: unknown }>(
  items: readonly T[] | undefined,
): T[] {
  // shortcut: entries a hosted package brought in (`from`) are left out; add them when a consumer needs one.
  return (items ?? []).filter((item) => item["from"] === undefined);
}

/** The client class name of `service`: `catalogue` → `CatalogueClient`. */
function clientName(service: string): string {
  return `${pascalCase(service)}Client`;
}

/** The content of one service's client file. */
function clientFile(service: string, manifest: StackraManifest): string {
  const imports = new Map<string, Map<string, boolean>>();
  const use = (from: string, name: string): void => {
    imports.set(from, (imports.get(from) ?? new Map<string, boolean>()).set(name, false));
  };
  use("@stackra/clients", "ServiceClient");
  const schemas = isSchema(manifest.schemas) ? manifest.schemas : {};
  const events = own(manifest.events).filter((event) => event.kind === "integration");
  const payloads = new Set(events.map((event) => refKey(event["fields"])));

  // One local name per schema key; a name two modules share gets the module as a prefix.
  const counts = new Map<string, number>();
  for (const key of Object.keys(schemas)) {
    const name = key.split(".").pop() ?? key;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const nameOf = (key: string): string => {
    const [module = "", name = key] = key.split(".");
    return (counts.get(name) ?? 0) > 1 ? `${pascalCase(module)}${name}` : name;
  };

  // Schema constants in dependency order; a cycle reads through `z.lazy`.
  const declarations: string[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (key: string): void => {
    if (state.has(key)) return;
    state.set(key, "visiting");
    const schema = schemas[key];
    const name = nameOf(key);
    if (isSchema(schema) && Array.isArray(schema["enum"]) && schema["type"] === "string") {
      use("@stackra/contracts", "Enum");
      const members = schema["enum"].map(
        (value) => `  ${pascalCase(String(value))}: ${JSON.stringify(value)},`,
      );
      declarations.push(
        `export const ${name} = Enum.of({\n${members.join("\n")}\n});`,
        `export type ${name} = Enum.Value<typeof ${name}>;`,
        `const ${name}$ = z.enum(${JSON.stringify(schema["enum"])});`,
        "",
      );
    } else {
      const printed = zodOfJsonSchema(isSchema(schema) ? schema : {}, {
        use,
        ref: (target) => {
          if (!target.startsWith(LOCAL_REF)) return undefined;
          const next = target.slice(LOCAL_REF.length);
          if (!(next in schemas)) return undefined;
          visit(next);
          return state.get(next) === "visiting"
            ? `z.lazy(() => ${nameOf(next)}$)`
            : `${nameOf(next)}$`;
        },
      });
      declarations.push(`const ${name}$ = ${printed};`);
      if (!payloads.has(key)) {
        use("@stackra/clients", "remoteShape");
        declarations.push(
          `export class ${name} extends remoteShape(${JSON.stringify(key)}, ${name}$) {}`,
        );
      }
      declarations.push("");
    }
    state.set(key, "done");
  };
  for (const key of Object.keys(schemas).sort()) visit(key);
  if (declarations.length > 0) use("zod", "z");

  // Refusals the producer declares.
  const refusals: string[] = [];
  for (const entry of own(manifest.errors)) {
    const module = typeof entry["module"] === "string" ? entry["module"] : manifest.member;
    if (typeof entry["class"] !== "string") continue;
    use("@stackra/clients", "remoteRefusal");
    const kind = ERROR_KINDS.has(entry.kind) ? `ErrorKind.${pascalCase(entry.kind)}` : undefined;
    if (kind !== undefined) use("@stackra/errors", "ErrorKind");
    refusals.push(
      `export class ${entry["class"]} extends remoteRefusal(${JSON.stringify(module)}, ${JSON.stringify(entry.code)}, {` +
        `${kind !== undefined ? ` kind: ${kind} ` : ""}}) {}`,
    );
  }

  // Integration events, typed by their payload shape.
  const eventLines: string[] = [];
  for (const event of events) {
    use("@stackra/clients", "remoteEvent");
    const payload = refKey(event["fields"]);
    if (payload === undefined || !(payload in schemas)) use("zod", "z");
    eventLines.push(
      `export class ${event.class} extends remoteEvent(${JSON.stringify(event.name)}, ` +
        `${payload !== undefined && payload in schemas ? `${nameOf(payload)}$` : "z.object({})"}) {}`,
    );
  }

  // One descriptor per call, and the client's members grouped by model.
  const calls: string[] = [];
  const groups = new Map<string, Map<string, string>>();
  const schemaOf = (value: unknown, fallback: string): string => {
    const key = refKey(value);
    if (key === undefined || !(key in schemas)) {
      use("zod", "z");
      return fallback;
    }
    return payloads.has(key) ? `${nameOf(key)}$` : nameOf(key);
  };
  for (const entry of [...own(manifest.actions)].sort((a, b) => (a.key < b.key ? -1 : 1))) {
    const factory = entry.kind === "query" ? "remoteQuery" : "remoteAction";
    use("@stackra/clients", factory);
    const endpoint = entry["endpoint"];
    let route = "";
    if (isSchema(endpoint) && typeof endpoint["method"] === "string") {
      use("@stackra/contracts", "HttpMethod");
      route = `, endpoint: { method: HttpMethod.${pascalCase(endpoint["method"].toLowerCase())}, path: ${JSON.stringify(endpoint["path"])} }`;
    }
    calls.push(
      `export const ${entry.class} = ${factory}(${JSON.stringify(entry.key)}, { input: ${schemaOf(entry["input"], "z.object({})")}, ` +
        `output: ${schemaOf(entry["output"], "z.unknown()")}${route} });`,
    );
    const written = entry.key.slice(entry.module.length + 1).replace(/@\d+$/, "");
    const segments = written.split(".");
    const verb = camelCase(segments.pop() ?? "");
    const group = camelCase(segments.join("_"));
    const members = groups.get(group) ?? new Map<string, string>();
    if (!members.has(verb)) members.set(verb, entry.class);
    groups.set(group, members);
  }
  const body = [...groups].map(
    ([group, members]) =>
      `  readonly ${group} = {\n${[...members].map(([verb, name]) => `    ${verb}: this.member(${name}),`).join("\n")}\n  };`,
  );
  const header = generatedHeader({
    from: `the committed stackra.manifest.json of the ${service} service (${manifest.package})`,
    purpose:
      `the generated client of the ${service} service: its enums, shapes, refusals, integration events, one ` +
      `descriptor per action and query, and ${clientName(service)}, injected through a constructor ` +
      `(\`constructor(private readonly ${camelCase(service)}: ${clientName(service)})\`).`,
    boundary:
      "the client is a class, so it is its own token; the topology picks the ClientTransport driver, so a call is " +
      "the same in process and over the network. A test replaces it with fakeClient().",
    runtime: "isomorphic",
  });
  return [
    header,
    ...importLines(imports),
    "",
    ...declarations,
    ...(refusals.length > 0 ? [...refusals, ""] : []),
    ...(eventLines.length > 0 ? [...eventLines, ""] : []),
    ...(calls.length > 0 ? [...calls, ""] : []),
    `/** The ${service} service, injected. */`,
    body.length > 0
      ? `export class ${clientName(service)} extends ServiceClient {\n${body.join("\n")}\n}`
      : `export class ${clientName(service)} extends ServiceClient {}`,
    "",
  ].join("\n");
}

/**
 * The client files of `ir`, one per consumed service, sorted by path.
 *
 * @param ir - the member read by discovery, with the consumed services' manifests in `services`.
 * @example
 * emitClients(ir).files.map((file) => file.path); // [".stackra/gen/clients/catalogue.ts"]
 */
export function emitClients(ir: MemberIR): {
  readonly files: readonly GeneratedFile[];
  readonly errors: readonly GenError[];
} {
  const consumers = new Map<string, { readonly file: string; readonly subject: string }>();
  const errors: GenError[] = [];
  for (const declared of ir.classes)
    for (const dep of declared.deps) {
      if (!dep.class.from.startsWith(CLIENTS_SPECIFIER)) continue;
      const service = dep.class.from.slice(CLIENTS_SPECIFIER.length);
      if (!consumers.has(service))
        consumers.set(service, { file: declared.file, subject: `${declared.name}.constructor` });
      if (dep.class.name !== clientName(service))
        errors.push({
          code: "client_name_mismatch",
          file: declared.file,
          line: 0,
          column: 0,
          subject: `${declared.name}.constructor`,
          message: `\`${dep.class.name}\` is not the client of ${CLIENTS_SPECIFIER}${service}`,
          fix: `type the parameter with \`${clientName(service)}\``,
        });
    }
  // Listeners of a consumed service's events, by service.
  const subscribed = new Map<
    string,
    { readonly name: string; readonly file: string; readonly subject: string }[]
  >();
  for (const declared of ir.classes) {
    const event = declared.kind === "listener" ? declared.handle?.event : undefined;
    if (event === undefined || !event.from.startsWith(CLIENTS_SPECIFIER)) continue;
    const service = event.from.slice(CLIENTS_SPECIFIER.length);
    const at = { name: event.name, file: declared.file, subject: `${declared.name}.handle` };
    if (!consumers.has(service)) consumers.set(service, at);
    subscribed.set(service, [...(subscribed.get(service) ?? []), at]);
  }
  const files: GeneratedFile[] = [];
  for (const [service, at] of [...consumers].sort(([left], [right]) => (left < right ? -1 : 1))) {
    const manifest = serviceManifest(ir, service);
    const published = new Set(
      own(manifest?.events)
        .filter((event) => event.kind === "integration")
        .map((event) => event.class),
    );
    for (const listener of manifest === undefined ? [] : (subscribed.get(service) ?? []))
      if (!published.has(listener.name))
        errors.push({
          code: "client_event_unknown",
          file: listener.file,
          line: 0,
          column: 0,
          subject: listener.subject,
          message: `the ${service} service publishes no integration event \`${listener.name}\``,
          fix: `import an integration event the ${service} service declares, or run \`stackra gen\` in it first`,
        });
    if (manifest === undefined) {
      errors.push({
        code: "client_service_unknown",
        file: at.file,
        line: 0,
        column: 0,
        subject: at.subject,
        message: `no committed stackra.manifest.json of a service \`${service}\` was found`,
        fix: `run \`stackra gen\` in the ${service} service first, or fix the ${CLIENTS_SPECIFIER}${service} import`,
      });
      continue;
    }
    files.push({
      path: `.stackra/gen/clients/${service}.ts`,
      content: clientFile(service, manifest),
    });
  }
  return errors.length > 0 ? { files: [], errors } : { files, errors };
}
