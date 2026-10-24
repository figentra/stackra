/**
 * Stackra file contract:
 * Purpose: `compareManifests`, the backward-compatibility check between the manifest of the last release and a new
 *          one: every removed action, event, permission, extension point or refusal code, every moved endpoint,
 *          every narrowed input (a newly required field, a removed enum code, a tighter rule, a dropped `null`),
 *          every widened output or event payload (a removed or newly optional field, a new enum code, a new `null`),
 *          and every event version change dropped before its sunset.
 * Boundary: pure; `today` is a parameter so the sunset rule is testable. Shapes are compared through the manifests'
 *           own `schemas`; a `$ref` into another package compares by reference only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 22); ADR 0158; ADR 0131 (deprecation and sunset); ADR 0260.
 */
import type { StackraManifest } from "@stackra/contracts";

import type { ManifestBreak } from "#core/types/manifest-break.type";

/** A JSON Schema node as the manifest records it. */
type Node = { readonly [keyword: string]: unknown };

/** Which side of the wire a shape is on: callers send inputs, callers read outputs and event payloads. */
type Direction = "input" | "output";

/** Upper bounds: an input breaks when one appears or decreases. */
const UPPER = ["maxLength", "maximum", "maxItems"] as const;

/** Lower bounds: an input breaks when one appears or increases. */
const LOWER = ["minLength", "minimum", "minItems", "exclusiveMinimum"] as const;

/** Whether `value` is a schema node. */
function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Follows a local `$ref` into the manifest's schemas; leaves a foreign one as it is. */
function resolve(manifest: StackraManifest, node: unknown): Node | undefined {
  if (!isNode(node)) return undefined;
  const target = node["$ref"];
  if (typeof target !== "string" || !target.startsWith("#/schemas/")) return node;
  const schemas = manifest.schemas;
  const found = isNode(schemas) ? schemas[target.slice("#/schemas/".length)] : undefined;
  return isNode(found) ? found : undefined;
}

/** The non-null types a node allows, and whether it allows `null`. */
function typesOf(node: Node): { readonly types: string[]; readonly nullable: boolean } {
  const declared = node["type"];
  const list = Array.isArray(declared)
    ? declared.map(String)
    : typeof declared === "string"
      ? [declared]
      : [];
  const anyOf = Array.isArray(node["anyOf"]) ? node["anyOf"].filter(isNode) : [];
  const nullable = list.includes("null") || anyOf.some((member) => member["type"] === "null");
  const fromAnyOf = anyOf.flatMap((member) =>
    typeof member["type"] === "string" ? [member["type"]] : [],
  );
  return { types: [...list, ...fromAnyOf].filter((type) => type !== "null"), nullable };
}

/** The `required` list of an object node. */
function requiredOf(node: Node): string[] {
  return Array.isArray(node["required"]) ? node["required"].map(String) : [];
}

/** The `properties` of an object node. */
function propertiesOf(node: Node): Record<string, unknown> {
  return isNode(node["properties"]) ? { ...node["properties"] } : {};
}

/** The comparison of one pair of shapes, collecting breaks. */
function compareShape(
  context: {
    readonly previous: StackraManifest;
    readonly next: StackraManifest;
    readonly section: string;
    readonly identity: string;
    readonly breaks: ManifestBreak[];
    readonly seen: Set<string>;
  },
  path: string,
  before: unknown,
  after: unknown,
  direction: Direction,
): void {
  const report = (message: string): void => {
    context.breaks.push({
      section: context.section,
      identity: context.identity,
      message: `${path}: ${message}`,
    });
  };
  const pair = `${JSON.stringify(before)}→${JSON.stringify(after)}:${direction}`;
  if (context.seen.has(pair)) return;
  context.seen.add(pair);
  const old = resolve(context.previous, before);
  const now = resolve(context.next, after);
  if (old === undefined || now === undefined) {
    if (JSON.stringify(before) !== JSON.stringify(after))
      report("changed to a shape that cannot be compared");
    return;
  }
  const oldRef = old["$ref"];
  const nowRef = now["$ref"];
  if (typeof oldRef === "string" || typeof nowRef === "string") {
    if (oldRef !== nowRef)
      report(
        `changed from ${String(oldRef ?? "an inline shape")} to ${String(nowRef ?? "an inline shape")}`,
      );
    return;
  }
  const oldTypes = typesOf(old);
  const nowTypes = typesOf(now);
  if (direction === "input" && oldTypes.nullable && !nowTypes.nullable)
    report("no longer accepts null");
  if (direction === "output" && !oldTypes.nullable && nowTypes.nullable) report("may now be null");
  const [oldType] = oldTypes.types;
  const [nowType] = nowTypes.types;
  if (
    oldType !== undefined &&
    nowType !== undefined &&
    oldType !== nowType &&
    !(oldType === "integer" && nowType === "number" && direction === "input")
  )
    report(`changed type from ${oldType} to ${nowType}`);
  const oldEnum = Array.isArray(old["enum"]) ? old["enum"].map(String) : undefined;
  const nowEnum = Array.isArray(now["enum"]) ? now["enum"].map(String) : undefined;
  if (direction === "input" && nowEnum !== undefined) {
    const lost =
      oldEnum === undefined ? ["any value"] : oldEnum.filter((value) => !nowEnum.includes(value));
    if (lost.length > 0) report(`no longer accepts ${lost.join(", ")}`);
  }
  if (direction === "output" && oldEnum !== undefined) {
    const added =
      nowEnum === undefined ? ["any value"] : nowEnum.filter((value) => !oldEnum.includes(value));
    if (added.length > 0) report(`may now return ${added.join(", ")}`);
  }
  if (direction === "input") {
    for (const keyword of UPPER) {
      const was = old[keyword];
      const is = now[keyword];
      if (typeof is === "number" && (typeof was !== "number" || is < was))
        report(`${keyword} tightened to ${is}`);
    }
    for (const keyword of LOWER) {
      const was = old[keyword];
      const is = now[keyword];
      if (typeof is === "number" && (typeof was !== "number" || is > was))
        report(`${keyword} tightened to ${is}`);
    }
    if (now["pattern"] !== undefined && now["pattern"] !== old["pattern"])
      report(`pattern changed to ${String(now["pattern"])}`);
  }
  const oldProperties = propertiesOf(old);
  const nowProperties = propertiesOf(now);
  const oldRequired = requiredOf(old);
  const nowRequired = requiredOf(now);
  if (direction === "input")
    for (const name of nowRequired)
      if (!oldRequired.includes(name)) report(`field \`${name}\` is now required`);
  if (direction === "output") {
    for (const name of Object.keys(oldProperties))
      if (!(name in nowProperties)) report(`field \`${name}\` was removed`);
    for (const name of oldRequired)
      if (name in nowProperties && !nowRequired.includes(name))
        report(`field \`${name}\` is no longer always present`);
  }
  for (const [name, schema] of Object.entries(oldProperties))
    if (name in nowProperties)
      compareShape(context, `${path}.${name}`, schema, nowProperties[name], direction);
  if (old["items"] !== undefined && now["items"] !== undefined)
    compareShape(context, `${path}[]`, old["items"], now["items"], direction);
  if (isNode(old["additionalProperties"]) && isNode(now["additionalProperties"]))
    compareShape(
      context,
      `${path}{}`,
      old["additionalProperties"],
      now["additionalProperties"],
      direction,
    );
}

/**
 * The backward-incompatible changes from `previous` to `next`.
 *
 * @param previous - the manifest of the last release.
 * @param next - the manifest about to be committed.
 * @param today - the ISO date the sunset rule compares with; today by default.
 * @returns every break, empty when `next` only adds to `previous`.
 * @example
 * compareManifests(released, current); // [{ section: "actions", identity: "orders.order.cancel@1", message: "removed" }]
 */
export function compareManifests(
  previous: StackraManifest,
  next: StackraManifest,
  today: string = new Date().toISOString().slice(0, 10),
): ManifestBreak[] {
  const breaks: ManifestBreak[] = [];
  const seen = new Set<string>();
  const removed = (section: string, identity: string): void => {
    breaks.push({ section, identity, message: "removed" });
  };

  const nextActions = new Map((next.actions ?? []).map((action) => [action.key, action]));
  for (const action of previous.actions ?? []) {
    const now = nextActions.get(action.key);
    if (now === undefined) {
      removed("actions", action.key);
      continue;
    }
    const context = { previous, next, section: "actions", identity: action.key, breaks, seen };
    const before = JSON.stringify(action["endpoint"] ?? null);
    const after = JSON.stringify(now["endpoint"] ?? null);
    if (isNode(action["endpoint"]) && before !== after)
      breaks.push({
        section: "actions",
        identity: action.key,
        message: `endpoint moved from ${before} to ${after}`,
      });
    if (action["input"] !== undefined)
      compareShape(context, "input", action["input"], now["input"], "input");
    if (action["output"] !== undefined)
      compareShape(context, "output", action["output"], now["output"], "output");
  }

  const nextEvents = new Map((next.events ?? []).map((event) => [event.name, event]));
  for (const event of previous.events ?? []) {
    const now = nextEvents.get(event.name);
    if (now === undefined) {
      removed("events", event.name);
      continue;
    }
    const context = { previous, next, section: "events", identity: event.name, breaks, seen };
    if (event["fields"] !== undefined)
      compareShape(context, "fields", event["fields"], now["fields"], "output");
    const kept = Array.isArray(now["changes"]) ? now["changes"].filter(isNode) : [];
    for (const change of Array.isArray(event["changes"]) ? event["changes"].filter(isNode) : []) {
      const sunset = typeof change["sunset"] === "string" ? change["sunset"] : undefined;
      const stillKept = kept.some((candidate) => candidate["from"] === change["from"]);
      if (!stillKept && (sunset === undefined || sunset > today))
        breaks.push({
          section: "events",
          identity: event.name,
          message: `the change from v${String(change["from"])} was dropped before its sunset ${sunset ?? "(none)"}`,
        });
    }
  }

  const permissions = new Set((next.permissions ?? []).map((permission) => permission.key));
  for (const permission of previous.permissions ?? [])
    if (!permissions.has(permission.key)) removed("permissions", permission.key);

  const codes = new Set((next.errors ?? []).map((error) => error.code));
  for (const error of previous.errors ?? [])
    if (!codes.has(error.code)) removed("errors", error.code);

  const points = isNode(next["extensionPoints"]) ? next["extensionPoints"] : {};
  for (const point of Object.keys(
    isNode(previous["extensionPoints"]) ? previous["extensionPoints"] : {},
  ))
    if (!(point in points)) removed("extensionPoints", point);

  return breaks;
}
