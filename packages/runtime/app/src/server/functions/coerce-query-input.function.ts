/**
 * Stackra file contract:
 * Purpose: `coerceQueryInput`, types the query-string fields of a GET or DELETE call by the call's registered input
 *          schema: a field whose schema (through optional, nullable, default and the like) is a number becomes
 *          `Number(value)` when that is finite, a boolean field takes `"true"` or `"false"`, an array field takes its
 *          values element-wise (a single value is a one-element array); every other field stays as sent.
 * Boundary: pure over the fields and the registered zod schema. A value that does not coerce stays a string, so the
 *           action pipeline's validation refuses it. A class with no registered schema, or one whose schema is not an
 *           object, coerces nothing. JSON bodies are already typed and never pass through here.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: raw adapters); ADR 0095 as amended by 0294 (the input is a Schema class);
 *                     ADR 0098 (the pipeline validates the input).
 */
import type { AnyClass } from "@stackra/container";
import { schemaOf } from "@stackra/validation";

/** The parts of a zod 4 schema this function reads. */
interface Node {
  readonly def: {
    readonly type: string;
    readonly innerType?: Node;
    readonly in?: Node;
    readonly element?: Node;
  };
  readonly shape?: Readonly<Record<string, Node>>;
}

/** The wrappers that hold another schema of the same value. */
const WRAPPERS: ReadonlySet<string> = new Set([
  "optional",
  "nullable",
  "default",
  "prefault",
  "nonoptional",
  "readonly",
  "catch",
]);

/** The schema under its wrappers (and a pipe's input side). */
function unwrap(node: Node): Node {
  let current = node;
  for (;;) {
    const { type } = current.def;
    const next = WRAPPERS.has(type)
      ? current.def.innerType
      : type === "pipe"
        ? current.def.in
        : undefined;
    if (next === undefined) return current;
    current = next;
  }
}

/** `value` as the scalar type asks, or as sent when it does not fit. */
function coerce(value: unknown, type: string | undefined): unknown {
  if (typeof value !== "string") return value;
  if (type === "number") {
    const number = Number(value);
    return value.trim() !== "" && Number.isFinite(number) ? number : value;
  }
  if (type === "boolean") return value === "true" ? true : value === "false" ? false : value;
  return value;
}

/**
 * The query fields of `fields`, typed by the registered schema of `input`.
 *
 * @param fields - the query string as a record of strings (or arrays of strings).
 * @param input - the call's input schema class; none, or an unregistered one, coerces nothing.
 * @example
 * coerceQueryInput({ limit: "20", ids: "a" }, ListOrdersInput); // { limit: 20, ids: ["a"] }
 */
export function coerceQueryInput(
  fields: Readonly<Record<string, unknown>>,
  input: AnyClass | undefined,
): Record<string, unknown> {
  if (input === undefined) return { ...fields };
  let root: Node;
  try {
    root = unwrap(schemaOf(input) as unknown as Node);
  } catch {
    return { ...fields };
  }
  const shape = root.def.type === "object" ? root.shape : undefined;
  if (shape === undefined) return { ...fields };
  const typed: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(fields)) {
    const field = shape[name] === undefined ? undefined : unwrap(shape[name]);
    if (field === undefined) typed[name] = value;
    else if (field.def.type === "array") {
      const element = field.def.element === undefined ? undefined : unwrap(field.def.element);
      typed[name] = (Array.isArray(value) ? value : [value]).map((item) =>
        coerce(item, element?.def.type),
      );
    } else typed[name] = Array.isArray(value) ? value : coerce(value, field.def.type);
  }
  return typed;
}
