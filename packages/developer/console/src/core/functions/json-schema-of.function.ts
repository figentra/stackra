/**
 * Stackra file contract:
 * Purpose: `jsonSchemaOf(structure)`, the JSON Schema of a command's arguments and options as one object, keyed by
 *          field (camelCase): `@Str` a string with its length and pattern, `@Int` an integer and `@Num` a number with
 *          their bounds, a flag a boolean, `@List` an array of them, `choices` an enum; required arguments are
 *          required, and nothing else is allowed.
 * Boundary: pure; derived from the definition, so a local MCP tool and its command never drift.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-020 and P-008.
 */
import type { CommandField } from "#contracts/types/command-field.type";
import type { CommandStructure } from "#contracts/types/command-structure.type";

/** The schema of one value of `field`. */
function valueSchema(field: CommandField): Record<string, unknown> {
  const bounded = (low: string, high: string) => ({
    ...(field.min === undefined ? {} : { [low]: field.min }),
    ...(field.max === undefined ? {} : { [high]: field.max }),
  });
  if (field.choices !== undefined) return { type: "string", enum: [...field.choices] };
  if (field.kind === "boolean") return { type: "boolean" };
  if (field.kind === "integer") return { type: "integer", ...bounded("minimum", "maximum") };
  if (field.kind === "number") return { type: "number", ...bounded("minimum", "maximum") };
  return {
    type: "string",
    ...(field.list ? {} : bounded("minLength", "maxLength")),
    ...(field.pattern === undefined ? {} : { pattern: field.pattern }),
  };
}

/** The JSON Schema of the input of `structure`. */
export function jsonSchemaOf(structure: CommandStructure): Record<string, unknown> {
  const fields = [...structure.arguments, ...structure.options];
  return {
    type: "object",
    properties: Object.fromEntries(
      fields.map((field) => [
        field.property,
        {
          ...(field.list ? { type: "array", items: valueSchema(field) } : valueSchema(field)),
          ...(field.description === undefined ? {} : { description: field.description }),
          ...(field.default === undefined ? {} : { default: field.default }),
        },
      ]),
    ),
    required: structure.arguments.filter((field) => field.required).map((field) => field.property),
    additionalProperties: false,
  };
}
