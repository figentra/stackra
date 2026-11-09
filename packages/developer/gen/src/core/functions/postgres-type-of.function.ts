/**
 * Stackra file contract:
 * Purpose: `postgresTypeOf`, the field-to-Postgres type map of `stackra db diff`: the column type a model field's
 *          shape type is stored as, matching what `Blueprint` writes (`string` is `text`, `PublicId` is `varchar(33)`,
 *          a `Date` is `timestamptz`, JSON-like shapes are `jsonb`).
 * Boundary: pure. Returns undefined for a field type with no agreed mapping (`Duration`, `Upload`, shipped types,
 *           unions, the `@Field(zod)` hatch, and a number with neither `@Int` nor `@Num`), so the comparison reports
 *           `type_unmapped` and never guesses. A `Money` field is two columns and is expanded by the builder, not here.
 *           `@Str({ max })` does not narrow the type: `text` agrees with any `varchar(n)` (`postgresTypeAgrees`).
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids are `varchar(33)`); ADR 0159 (the migration owns the type); ADR 0162
 *                     (decision 2: `Translated` is `jsonb`); STA-1808.
 */
import type { FieldIR } from "#core/types/field-ir.type";

/** The PostGIS column of each geospatial shape, spelt as the catalog prints it (ADR 0314). */
const GEOGRAPHY_TYPES = {
  point: "geography(Point,4326)",
  polygon: "geography(Polygon,4326)",
  line: "geography(LineString,4326)",
} as const;

/**
 * The Postgres type of `field`, or undefined when no mapping is agreed.
 *
 * @param field - a model data field as the shape compiler read it.
 * @example
 * postgresTypeOf({ name: "dueAt", optional: false, nullable: true, type: { kind: "date" }, rules: [] }); // "timestamptz"
 */
export function postgresTypeOf(field: FieldIR): string | undefined {
  switch (field.type.kind) {
    case "string":
    case "brand":
    case "driver_name":
    case "enum": {
      return "text";
    }
    case "public_id": {
      return "varchar(33)";
    }
    case "boolean": {
      return "boolean";
    }
    case "date": {
      return "timestamptz";
    }
    case "json":
    case "record":
    case "array":
    case "schema":
    case "translated": {
      return "jsonb";
    }
    case "geo": {
      return GEOGRAPHY_TYPES[field.type.shape];
    }
    case "number": {
      if (field.rules.some((rule) => rule.name === "Int")) return "integer";
      if (field.rules.some((rule) => rule.name === "Num")) return "numeric";
      // The optimistic-lock `version` of the `Versioned` trait carries no rule and is an integer column.
      return field.name === "version" ? "integer" : undefined;
    }
    default: {
      return undefined;
    }
  }
}
