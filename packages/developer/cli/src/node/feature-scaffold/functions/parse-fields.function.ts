/**
 * Stackra file contract:
 * Purpose: `parseFields(spec)`, the fields of `--fields title:string,notes:text?,dueAt:timestamp?`: each
 *          `<name>:<type>`, `?` after the type for a nullable column. The name may be camelCase or snake_case; the
 *          property is camelCase and the column snake_case.
 * Boundary: pure. Refuses an empty entry, a bad name, an unknown type, a name given twice and a name the scaffold
 *           writes itself (`id`, `createdAt`, `updatedAt`, `tenantId`).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20: snake_case columns); ADR 0159 (explicit nullability).
 */
import { camelCase, snakeCase } from "@stackra/support";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { FIELD_TYPES } from "#node/feature-scaffold/constants/field-types.constant";
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";

/** A field name: camelCase or snake_case, starting with a letter. */
const NAME = /^[a-z][a-zA-Z0-9]*(_[a-z0-9]+)*$/;

/** The columns every scaffolded model has already. */
const RESERVED = new Set(["id", "created_at", "updated_at", "tenant_id"]);

/**
 * The fields of a `--fields` list; none when it is empty or absent.
 *
 * @param spec - the comma-separated `<name>:<type>[?]` list.
 * @throws CliUsageError on a bad entry, an unknown type, a repeated or reserved name.
 * @example
 * parseFields("title:string,dueAt:timestamp?").map((field) => field.column); // ["title", "due_at"]
 */
export function parseFields(spec: string | undefined): readonly FeatureField[] {
  if (spec === undefined || spec.trim() === "") return [];
  const seen = new Set<string>();
  return spec.split(",").map((entry) => {
    const [rawName = "", rawType = "", ...rest] = entry.trim().split(":");
    const nullable = rawType.endsWith("?");
    const typeName = nullable ? rawType.slice(0, -1) : rawType;
    const type = FIELD_TYPES[typeName];
    if (!NAME.test(rawName) || rawType === "" || rest.length > 0)
      throw new CliUsageError(
        `--fields: "${entry.trim()}" is not <name>:<type>, such as title:string or due_at:timestamp?`,
      );
    if (type === undefined)
      throw new CliUsageError(
        `--fields: "${typeName}" is not a type; one of ${Object.keys(FIELD_TYPES).join(", ")}`,
      );
    const column = snakeCase(rawName);
    if (RESERVED.has(column))
      throw new CliUsageError(`--fields: ${rawName} is written by the scaffold itself`);
    if (seen.has(column)) throw new CliUsageError(`--fields: ${rawName} is named twice`);
    seen.add(column);
    const name = camelCase(column);
    return {
      name,
      column,
      type: type.ts,
      nullable,
      decorators: type.decorator === undefined ? [] : [type.decorator],
      doc:
        type.ts === "boolean"
          ? `True when ${column.replaceAll("_", " ")}.`
          : `The ${column.replaceAll("_", " ")}.`,
      blueprint: type.blueprint(column),
    };
  });
}
