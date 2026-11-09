/**
 * Stackra file contract:
 * Purpose: `fieldKindOf(schema, path)`, which control a form field draws from a JSON Schema input (a manifest's, or
 *          zod's `toJSONSchema`): the kinds `inputKind` gives from zod, plus long text, several choices, money, record
 *          references and uploads. The chat's forms use it on an action's manifest input, so a field looks the same
 *          there as in a screen.
 * Boundary: a pure function over plain JSON Schema (draft 2020-12 as zod and gen write it). Optional and nullable
 *           wrappers (`anyOf` with `null`) are looked through; a `$ref` is followed through `resolve` when given. A path
 *           the schema does not have is `missing`. Never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters); Tamo spec generative-ui-tools-artifacts (G3)
 */
import type { FieldKind } from "#core/types/field-kind.type";

/** A JSON Schema node. */
type Node = Readonly<Record<string, unknown>>;

/** Whether `value` is a schema node. */
const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A public id's pattern, as `publicId(prefix)` writes it. */
const PUBLIC_ID = /^\^([a-z]{2,6})_\[0-9a-hjkmnp-tv-z\]\{26\}\$$/;

/** Text longer than this is a text area. */
const LONG_TEXT = 500;

/** `node` without `$ref` and the optional or nullable `anyOf`/`oneOf` wrapper. */
function bare(node: unknown, resolve?: (ref: string) => unknown): Node | undefined {
  let current = node;
  for (let step = 0; step < 16 && isNode(current); step += 1) {
    if (typeof current["$ref"] === "string" && resolve !== undefined) {
      current = resolve(current["$ref"]);
      continue;
    }
    const options = (current["anyOf"] ?? current["oneOf"]) as unknown;
    if (Array.isArray(options)) {
      const real = options.filter((option) => !(isNode(option) && option["type"] === "null"));
      if (real.length === 1) {
        current = real[0];
        continue;
      }
    }
    return current;
  }
  return isNode(current) ? current : undefined;
}

/** The type of `node`, ignoring `"null"` in a type list. */
function typeOf(node: Node): string | undefined {
  const type = node["type"];
  if (typeof type === "string") return type;
  if (Array.isArray(type)) {
    const real = type.filter((each) => each !== "null");
    return real.length === 1 ? String(real[0]) : undefined;
  }
  return undefined;
}

/** The string codes of an enum `node`, or undefined. */
function codesOf(node: Node | undefined): string[] | undefined {
  if (node === undefined) return undefined;
  if (Array.isArray(node["enum"]) && node["enum"].every((each) => typeof each === "string"))
    return node["enum"] as string[];
  const options = node["anyOf"] ?? node["oneOf"];
  if (
    Array.isArray(options) &&
    options.length > 0 &&
    options.every((each) => isNode(each) && typeof each["const"] === "string")
  )
    return (options as Node[]).map((each) => String(each["const"]));
  return undefined;
}

/** The public-id prefix a string `node`'s pattern names, or undefined. */
const prefixOf = (node: Node): string | undefined =>
  typeof node["pattern"] === "string" ? PUBLIC_ID.exec(node["pattern"])?.[1] : undefined;

/**
 * The control kind of the field at `path` of `schema`.
 *
 * @param resolve - follows a `$ref` (`#/schemas/orders.OrderInput`) to its schema; refs stay opaque without it.
 * @example
 * fieldKindOf(manifestInput, "tier"); // { kind: "enum", options: ["bronze", "gold"] }
 */
export function fieldKindOf(
  schema: unknown,
  path: string,
  resolve?: (ref: string) => unknown,
): FieldKind {
  let current = bare(schema, resolve);
  let name = "";
  for (const segment of path.split(".")) {
    if (current === undefined) break;
    name = segment;
    const items = current["items"];
    const properties = current["properties"];
    current = bare(
      typeOf(current) === "array" ? items : isNode(properties) ? properties[segment] : undefined,
      resolve,
    );
  }
  if (current === undefined) return { kind: "missing" };
  const type = typeOf(current);
  const codes = codesOf(current);
  if (codes !== undefined) return { kind: "enum", options: codes };
  if (type === "boolean") return { kind: "boolean" };
  if (type === "string") {
    if (current["format"] === "date-time") return { kind: "datetime" };
    if (current["format"] === "date") return { kind: "date" };
    const prefix = prefixOf(current);
    if (prefix !== undefined) return { kind: "reference", prefix };
    if (typeof current["maxLength"] === "number" && current["maxLength"] > LONG_TEXT)
      return { kind: "longtext" };
    return { kind: "text" };
  }
  if (type === "integer" && name.endsWith("Minor")) return { kind: "money" };
  if (type === "number" || type === "integer")
    return {
      kind: "number",
      ...(typeof current["minimum"] === "number" ? { min: current["minimum"] } : {}),
      ...(typeof current["maximum"] === "number" ? { max: current["maximum"] } : {}),
    };
  if (type === "array") {
    const item = bare(current["items"], resolve);
    const options = codesOf(item);
    if (options !== undefined) return { kind: "multi_enum", options };
    return {
      kind: "list",
      item: item !== undefined && typeOf(item) === "object" ? "object" : "value",
    };
  }
  if (type === "object") {
    const properties = current["properties"];
    if (isNode(properties) && Object.keys(properties).length > 0) {
      const keys = Object.keys(properties);
      const id = bare(properties["id"], resolve);
      if (keys.length === 1 && id !== undefined && prefixOf(id) === "upl") return { kind: "file" };
      return { kind: "object", keys };
    }
    const values = bare(current["additionalProperties"], resolve);
    if (values !== undefined) {
      const valueType = typeOf(values);
      return {
        kind: "record",
        value: valueType === "number" || valueType === "integer" ? "number" : "text",
      };
    }
  }
  return { kind: "json" };
}
