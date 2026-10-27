/**
 * Stackra file contract:
 * Purpose: `inputKind(schema, path)`, which control a form field draws from the input schema at `path`: a switch, a
 *          number, a choice of the enum's codes, or text; the optional, nullable and default wrappers are looked
 *          through.
 * Boundary: internal; reads zod 4's `def` (type, innerType, shape, entries) only, never parses. A path the schema does
 *           not have is text. Web and native forms share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the create or update input); ADR 0055 (thin field adapters).
 */
import type { ZodType } from "zod";

import type { InputKind } from "#core/types/input-kind.type";

/** The parts of a zod 4 definition read here. */
interface Def {
  readonly type?: string;
  readonly innerType?: ZodType;
  readonly shape?: Readonly<Record<string, ZodType>>;
  readonly entries?: Readonly<Record<string, string>>;
}

/** The definition of `schema`. */
const defOf = (schema: ZodType | undefined): Def =>
  ((schema as { readonly def?: Def } | undefined)?.def ?? {}) as Def;

/** `schema` without its optional, nullable and default wrappers. */
function bare(schema: ZodType | undefined): ZodType | undefined {
  let current = schema;
  for (let def = defOf(current); def.innerType !== undefined; def = defOf(current))
    current = def.innerType;
  return current;
}

/**
 * The control kind of the field at `path` of `schema`.
 *
 * @example
 * inputKind(EnrollMemberAction.input, "tier"); // { kind: "enum", options: ["bronze", "gold"] }
 */
export function inputKind(schema: ZodType | undefined, path: string): InputKind {
  let current = bare(schema);
  for (const segment of path.split(".")) current = bare(defOf(current).shape?.[segment]);
  const def = defOf(current);
  if (def.type === "boolean") return { kind: "boolean" };
  if (def.type === "number" || def.type === "int" || def.type === "bigint")
    return { kind: "number" };
  if (def.type === "enum" && def.entries !== undefined)
    return { kind: "enum", options: Object.values(def.entries) };
  return { kind: "text" };
}
