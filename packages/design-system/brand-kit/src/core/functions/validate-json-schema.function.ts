/**
 * Stackra file contract:
 * Purpose: `validateJsonSchema(schema, value)`, a small JSON Schema checker: `type` (with "null" and "integer"),
 *          `enum`, `pattern`, `minLength`, `minimum`, `maximum`, `required`, `properties`, `additionalProperties`,
 *          `propertyNames`, `items`, `minItems` and local `#/$defs/<name>` refs. It answers one line per problem, each
 *          naming its JSON path (`$.icon.scale`), and an empty list when the value conforms.
 * Boundary: pure. Enough for the kit schema and for a kit owner's own record schemas; `allOf`, `oneOf`, `if` and remote
 *           refs are not read (they are ignored, so a schema using them checks less than it says).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5); ported from figentra/os `tools/brand-kit/lib/schema.mjs` (ORIGIN.md).
 */

/** The schema keywords read here. */
type Schema = {
  readonly $ref?: string;
  readonly $defs?: Readonly<Record<string, Schema>>;
  readonly type?: string | readonly string[];
  readonly enum?: readonly unknown[];
  readonly pattern?: string;
  readonly minLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minItems?: number;
  readonly items?: Schema;
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, Schema>>;
  readonly additionalProperties?: boolean | Schema;
  readonly propertyNames?: Schema;
};

/** The JSON type name of `value`, telling integers from other numbers. */
function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

/** The problems of `value` against `schema`, resolving refs in `root`. */
function check(schema: Schema, value: unknown, root: Schema, at: string): string[] {
  if (schema.$ref !== undefined) {
    const target = root.$defs?.[schema.$ref.split("/").at(-1) ?? ""];
    return target === undefined
      ? [`${at}: unknown ref ${schema.$ref}`]
      : check(target, value, root, at);
  }
  const out: string[] = [];
  const type = typeOf(value);
  if (schema.type !== undefined) {
    const types = typeof schema.type === "string" ? [schema.type] : schema.type;
    if (!types.includes(type) && !(type === "integer" && types.includes("number")))
      return [`${at}: expected ${types.join(" or ")}, got ${type}`];
  }
  if (schema.enum !== undefined && !schema.enum.includes(value))
    out.push(`${at}: must be one of ${schema.enum.join(", ")}`);
  if (typeof value === "string") {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value))
      out.push(`${at}: "${value}" does not match ${schema.pattern}`);
    if (schema.minLength !== undefined && value.length < schema.minLength)
      out.push(`${at}: shorter than ${schema.minLength}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum)
      out.push(`${at}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum)
      out.push(`${at}: above ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      out.push(`${at}: fewer than ${schema.minItems} items`);
    const items = schema.items;
    if (items !== undefined)
      value.forEach((item, i) => out.push(...check(items, item, root, `${at}[${i}]`)));
  }
  if (type === "object") {
    const record = value as Readonly<Record<string, unknown>>;
    for (const key of schema.required ?? [])
      if (!(key in record)) out.push(`${at}: "${key}" is required`);
    for (const [key, item] of Object.entries(record)) {
      if (schema.propertyNames !== undefined)
        out.push(...check(schema.propertyNames, key, root, `${at} key "${key}"`));
      const sub = schema.properties?.[key];
      if (sub !== undefined) out.push(...check(sub, item, root, `${at}.${key}`));
      else if (schema.additionalProperties === false) out.push(`${at}: unknown field "${key}"`);
      else if (typeof schema.additionalProperties === "object")
        out.push(...check(schema.additionalProperties, item, root, `${at}.${key}`));
    }
  }
  return out;
}

/**
 * The problems of `value` against `schema`.
 *
 * @param schema - a JSON Schema in the subset above; its `$defs` resolve `#/$defs/<name>` refs.
 * @param value - parsed JSON.
 * @returns one line per problem; empty when `value` conforms.
 * @example
 * validateJsonSchema({ type: "object", required: ["id"] }, {}); // ['$: "id" is required']
 */
export function validateJsonSchema(schema: object, value: unknown): string[] {
  return check(schema as Schema, value, schema as Schema, "$");
}
