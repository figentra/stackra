/**
 * Stackra file contract:
 * Purpose: `checkEndpoints`, the endpoint and surface refusals of a member's actions and queries:
 *          `endpoint_collision` (two calls on one route shape: one method, one path once parameter names are erased),
 *          `endpoint_versioned` (a `v<digits>` path segment), `endpoint_area_mismatch` (a path that is neither
 *          `/<area>` nor under `/<area>/`, except a public call under RFC 8615's `/.well-known/`), `endpoint_method_mismatch` (a query not on `GET`, an action on `GET`, or a
 *          transition overridden away from `PUT`), `job_without_system_actor` (a `job` without the `system` or `job`
 *          actor), `cron_input_invalid` (a `job.cron.input` property the input schema does not have, a required one it
 *          omits, or a value of another JSON type) and `intent_phrases_missing` (`intent: true` without a non-empty
 *          `actions.<written key>.intents` list in a base-language catalogue).
 * Boundary: pure; reads the built manifest (routes, areas, actors, jobs and the input JSON Schemas it records) and, for
 *           intents, the IR's classes and lang catalogues. A hosted package's entries (marked `from`) take part in the
 *           collision check only, since they share one router with the member's own; the package's own run checks
 *           the rest. Raw controllers, the member's own and those of each hosted package whose root module it imports
 *           (its manifest's `services` rows with a `path`), take part too: a controller answers every method, so it
 *           collides with any call or controller on its path (or under it, for a trailing `/*`). A call without a route takes no part in the route checks. A cron input is checked against the
 *           JSON Schema, not the full Zod rules; a schema without `properties` has only its `required` list checked,
 *           and a run without `input` gets `{}`. Intents are checked in every base locale (no region) that ships the
 *           module's namespace, or once against `assets/lang/en/<module>.json` when none does. Runs in the full pass
 *           beside the other whole-member checks, never in the manifest pass.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 21: the endpoint convention; decision 22: a refusal carries its fix); ADR 0305
 *                     (rules 28 and 30); ADR 0082 (decision 3: areas); ADR 0237 (decision 1: the edge routes by area);
 *                     ADR 0118 (paths stay unversioned); STA-340.
 */
import type { StackraManifest } from "@stackra/contracts";

import { DEFAULT_AREA } from "#core/constants/default-area.constant";
import { deriveEndpoint } from "#core/functions/derive-endpoint.function";
import { isBaseLocale } from "#core/functions/is-base-locale.function";
import type { Endpoint } from "#core/types/endpoint.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** One action or query entry of the manifest. */
type Entry = NonNullable<StackraManifest["actions"]>[number];

/** A JSON Schema as the manifest records it, read loosely. */
interface JsonSchema {
  readonly properties?: Readonly<Record<string, { readonly type?: unknown }>>;
  readonly required?: readonly string[];
}

/** A version path segment: `v1`, `v10`. */
const VERSION_SEGMENT = /^v\d+$/;

/** RFC 8615's well-known prefix: a cross-host convention, not an area route, so a public call may sit under it. */
const WELL_KNOWN_PREFIX = "/.well-known/";

/** The actors a job runs as. */
const JOB_ACTORS = new Set(["system", "job"]);

/** One refusal about an entry's class. */
function refusal(
  code: string,
  file: string,
  subject: string,
  message: string,
  fix: string,
): GenError {
  return { code, file, line: 0, column: 0, subject, message, fix };
}

/** The route an entry records, or undefined when it has none. */
function routeOf(entry: Entry): Endpoint | undefined {
  const endpoint = entry["endpoint"];
  return typeof endpoint === "object" && endpoint !== null ? (endpoint as Endpoint) : undefined;
}

/** The route shape: the method and the path with parameter names erased (`PUT /app/orders/:/cancel`). */
function shapeOf(route: Endpoint): string {
  return `${route.method} ${route.path.replaceAll(/:[^/]+/g, ":")}`;
}

/** The entry's area, written or the default. */
function areaOf(entry: Entry): string {
  return typeof entry["area"] === "string" ? entry["area"] : DEFAULT_AREA;
}

/** The written key (`order.cancel`) of an entry keyed `<module>.order.cancel@1`. */
function writtenKey(entry: Entry): string {
  return entry.key.slice(entry.module.length + 1).replace(/@\d+$/, "");
}

/** The JSON Schema of the entry's own input, `null` when it takes none, undefined when it is not readable. */
function inputSchemaOf(manifest: StackraManifest, entry: Entry): JsonSchema | null | undefined {
  const input = entry["input"] as { readonly $ref?: unknown } | undefined;
  if (input === undefined) return null;
  if (typeof input.$ref !== "string" || !input.$ref.startsWith("#/schemas/")) return undefined;
  const schemas = manifest.schemas as Readonly<Record<string, unknown>> | undefined;
  const schema = schemas?.[input.$ref.slice("#/schemas/".length)];
  return typeof schema === "object" && schema !== null ? (schema as JsonSchema) : undefined;
}

/** The JSON type of a value, `integer` for a whole number. */
function jsonTypeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

/** Whether a value of JSON type `actual` satisfies a schema `type` (a name or a list); no `type` accepts anything. */
function typeAccepts(type: unknown, actual: string): boolean {
  if (type === undefined) return true;
  const types = new Set((Array.isArray(type) ? type : [type]).map(String));
  return types.has(actual) || (actual === "integer" && types.has("number"));
}

/** The collision refusals: every entry whose route shape another entry also has, naming the others. */
function collisions(entries: readonly Entry[]): GenError[] {
  const byShape = new Map<string, Entry[]>();
  for (const entry of entries) {
    const route = routeOf(entry);
    if (route === undefined) continue;
    const shape = shapeOf(route);
    byShape.set(shape, [...(byShape.get(shape) ?? []), entry]);
  }
  return [...byShape.values()]
    .filter((group) => group.length > 1)
    .flatMap((group) =>
      group.map((entry) => {
        const route = routeOf(entry) as Endpoint;
        const others = group
          .filter((other) => other !== entry)
          .map((other) => `${other.class} (${routeOf(other)?.path ?? ""})`)
          .join(", ");
        return refusal(
          "endpoint_collision",
          String(entry["file"]),
          entry.class,
          `${entry.class} is on ${route.method} ${route.path}, the route ${others} is also on`,
          "give one of them a route of its own: another key, or `endpoint: { method, path }` with a new path",
        );
      }),
    );
}

/** A raw controller as the router sees it: its class, its file (or hosting package) and its path, on every method. */
interface RawRoute {
  readonly class: string;
  readonly file: string;
  readonly path: string;
}

/** The raw controllers the member serves: its own, and those of each hosted package whose root module it imports. */
function rawRoutesOf(ir: MemberIR): RawRoute[] {
  const own = ir.classes
    .filter((declared) => declared.kind === "controller" && declared.abstract !== true)
    .flatMap((declared) => {
      const path = declared.options["path"];
      return typeof path === "string" ? [{ class: declared.name, file: declared.file, path }] : [];
    });
  const hosted = ir.dependencies.flatMap(({ package: name, manifest }) => {
    const root = manifest.modules?.find((candidate) => candidate.key === manifest.member);
    const rows = manifest["services"];
    if (typeof root?.["file"] !== "string" || manifest.kind === "app" || !Array.isArray(rows))
      return [];
    return (rows as readonly Readonly<Record<string, unknown>>[]).flatMap((row) =>
      typeof row["path"] === "string"
        ? [{ class: String(row["class"]), file: name, path: row["path"] }]
        : [],
    );
  });
  return [...own, ...hosted];
}

/** A path with its parameter names erased (`/app/orders/:/cancel`). */
function erased(path: string): string {
  return path.replaceAll(/:[^/]+/g, ":");
}

/** Whether a raw controller on `raw` (any method; a trailing `/*` covers what is under it) also answers `path`. */
function rawCovers(raw: string, path: string): boolean {
  if (raw.endsWith("/*")) return erased(path).startsWith(erased(raw.slice(0, -1)));
  return erased(raw) === erased(path);
}

/** The collision refusals of the raw controllers: one shares a path with a call or another controller. */
function rawCollisions(entries: readonly Entry[], raws: readonly RawRoute[]): GenError[] {
  const fix = "give the controller a path of its own, or move the call off it";
  return raws.flatMap((raw, index) => {
    const others = [
      ...entries.flatMap((entry) => {
        const route = routeOf(entry);
        return route !== undefined && rawCovers(raw.path, route.path)
          ? [`${entry.class} (${route.method} ${route.path})`]
          : [];
      }),
      ...raws
        .filter(
          (other, at) =>
            at !== index && (rawCovers(raw.path, other.path) || rawCovers(other.path, raw.path)),
        )
        .map((other) => `${other.class} (${other.path})`),
    ];
    return others.length === 0
      ? []
      : [
          refusal(
            "endpoint_collision",
            raw.file,
            raw.class,
            `${raw.class} serves ${raw.path} on every method, the route ${others.join(", ")} is also on`,
            fix,
          ),
        ];
  });
}

/** The route refusals of one own entry: version segment, area and method. */
function routeRefusals(manifest: StackraManifest, entry: Entry): GenError[] {
  const route = routeOf(entry);
  if (route === undefined) return [];
  const file = String(entry["file"]);
  const errors: GenError[] = [];
  const at = `${route.method} ${route.path}`;
  const version = route.path.split("/").find((segment) => VERSION_SEGMENT.test(segment));
  if (version !== undefined)
    errors.push(
      refusal(
        "endpoint_versioned",
        file,
        entry.class,
        `${entry.class} is on ${at}, a versioned path (\`${version}\`)`,
        `drop the \`/${version}\` segment: paths stay unversioned and API versions are dates in the \`Stackra-Version\` header (ADR 0118)`,
      ),
    );
  const area = areaOf(entry);
  const isWellKnown = area === "public" && route.path.startsWith(WELL_KNOWN_PREFIX);
  if (route.path !== `/${area}` && !route.path.startsWith(`/${area}/`) && !isWellKnown)
    errors.push(
      refusal(
        "endpoint_area_mismatch",
        file,
        entry.class,
        `${entry.class} is in the ${area} area but on ${at}, outside \`/${area}\``,
        `start the path with \`/${area}/\`, or set the \`area\` the route belongs to`,
      ),
    );
  if (entry.kind === "query" && route.method !== "GET")
    errors.push(
      refusal(
        "endpoint_method_mismatch",
        file,
        entry.class,
        `${entry.class} is a query on ${at}; a query reads with GET`,
        "write `method: HttpMethod.Get`, or make it an Action if it changes state",
      ),
    );
  if (entry.kind === "action" && route.method === "GET")
    errors.push(
      refusal(
        "endpoint_method_mismatch",
        file,
        entry.class,
        `${entry.class} is an action on ${at}; an action never uses GET`,
        "write POST, PUT, PATCH or DELETE, or make it a Query if it only reads",
      ),
    );
  if (entry.kind === "action" && !route.derived && route.method !== "GET") {
    const schema = inputSchemaOf(manifest, entry);
    const derived = deriveEndpoint({
      key: writtenKey(entry),
      kind: "action",
      inputFields: Object.keys(schema?.properties ?? {}),
      area,
    });
    if (derived?.method === "PUT" && route.method !== "PUT")
      errors.push(
        refusal(
          "endpoint_method_mismatch",
          file,
          entry.class,
          `${entry.class} is a transition (its input carries the id) overridden to ${at}; a transition is idempotent`,
          "write `method: HttpMethod.Put`",
        ),
      );
  }
  return errors;
}

/** The job refusals of one own entry: the actor and the cron input. */
function jobRefusals(manifest: StackraManifest, entry: Entry): GenError[] {
  const job = entry["job"];
  if (typeof job !== "object" || job === null) return [];
  const file = String(entry["file"]);
  const errors: GenError[] = [];
  if (!(entry.actors ?? []).some((actor) => JOB_ACTORS.has(actor)))
    errors.push(
      refusal(
        "job_without_system_actor",
        file,
        entry.class,
        `${entry.class} declares \`job\` but its actors (${(entry.actors ?? []).join(", ")}) include neither system nor job`,
        "add `ActorKind.System` or `ActorKind.Job` to `actors`, or drop `job`",
      ),
    );
  const cron = (job as { readonly cron?: unknown }).cron;
  if (typeof cron !== "object" || cron === null) return errors;
  const written = (cron as { readonly input?: unknown }).input ?? {};
  const input =
    typeof written === "object" && written !== null && !Array.isArray(written)
      ? (written as Readonly<Record<string, unknown>>)
      : undefined;
  const invalid = (subject: string, message: string, fix: string): GenError =>
    refusal("cron_input_invalid", file, subject, `${entry.class}'s job.cron.input ${message}`, fix);
  if (input === undefined)
    return [
      ...errors,
      invalid(entry.class, "is not an object", "write `input` as an object of the input's fields"),
    ];
  const schema = inputSchemaOf(manifest, entry);
  if (schema === undefined) return errors;
  if (schema === null)
    return Object.keys(input).length === 0
      ? errors
      : [
          ...errors,
          invalid(
            entry.class,
            "gives values, but the action takes no input",
            "drop `input`, or give `handle` an input schema",
          ),
        ];
  const { properties } = schema;
  if (properties !== undefined)
    for (const [name, value] of Object.entries(input)) {
      const property = properties[name];
      if (property === undefined)
        errors.push(
          invalid(
            `${entry.class}.${name}`,
            `names \`${name}\`, which the input schema does not have`,
            `remove \`${name}\` from \`job.cron.input\``,
          ),
        );
      else if (!typeAccepts(property.type, jsonTypeOf(value)))
        errors.push(
          invalid(
            `${entry.class}.${name}`,
            `gives \`${name}\` a ${jsonTypeOf(value)}, but the schema wants ${String(property.type)}`,
            `give \`${name}\` a ${String(property.type)} value`,
          ),
        );
    }
  for (const name of schema.required ?? [])
    if (!(name in input))
      errors.push(
        invalid(
          `${entry.class}.${name}`,
          `omits \`${name}\`, which the input schema requires`,
          `add \`${name}\` to \`job.cron.input\``,
        ),
      );
  return errors;
}

/** The value at `path` in a parsed catalogue, or undefined. */
function valueAt(tree: unknown, path: readonly string[]): unknown {
  let node = tree;
  for (const segment of path) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Readonly<Record<string, unknown>>)[segment];
  }
  return node;
}

/** The intent refusals: each `intent: true` call without phrases in a base locale that ships its namespace. */
function intentRefusals(ir: MemberIR): GenError[] {
  return ir.classes
    .filter(
      (declared) =>
        (declared.kind === "action" || declared.kind === "query") &&
        declared.options["intent"] === true &&
        typeof declared.options["key"] === "string",
    )
    .flatMap((declared) => {
      const written = String(declared.options["key"]);
      const path = ["actions", ...written.split("."), "intents"];
      const shipping = Object.entries(ir.catalogues ?? {})
        .filter(([locale, namespaces]) => isBaseLocale(locale) && declared.module in namespaces)
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here; toSorted is ES2023 and the base lib is ES2022
        .sort(([left], [right]) => left.localeCompare(right));
      const missing =
        shipping.length === 0
          ? ["en"]
          : shipping
              .filter(([, namespaces]) => {
                const phrases = valueAt(namespaces[declared.module], path);
                return !Array.isArray(phrases) || phrases.length === 0;
              })
              .map(([locale]) => locale);
      return missing.map((locale) => {
        const catalogue = `assets/lang/${locale}/${declared.module}.json`;
        return refusal(
          "intent_phrases_missing",
          catalogue,
          declared.name,
          `${declared.name} says \`intent: true\`, but ${catalogue} has no \`actions.${written}.intents\` phrases`,
          `add a non-empty \`actions.${written}.intents\` list to ${catalogue}, or drop \`intent: true\``,
        );
      });
    });
}

/**
 * The endpoint and surface refusals of a member.
 *
 * @param ir - the member read by discovery (its classes and lang catalogues, for intents).
 * @param manifest - the manifest `buildManifest` derived from it.
 * @example
 * checkEndpoints(ir, manifest).map((error) => error.code); // ["endpoint_collision", "endpoint_collision"]
 */
export function checkEndpoints(ir: MemberIR, manifest: StackraManifest): GenError[] {
  const entries = manifest.actions ?? [];
  const own = entries.filter((entry) => entry["from"] === undefined);
  return [
    ...collisions(entries),
    ...rawCollisions(entries, rawRoutesOf(ir)),
    ...own.flatMap((entry) => routeRefusals(manifest, entry)),
    ...own.flatMap((entry) => jobRefusals(manifest, entry)),
    ...intentRefusals(ir),
  ];
}
