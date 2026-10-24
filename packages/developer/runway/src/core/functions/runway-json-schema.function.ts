/**
 * Stackra file contract:
 * Purpose: `runwayJsonSchema(kind)`, the JSON Schema (draft 2020-12, input side: defaulted keys optional) of a runway
 *          kind, derived from the same zod schema `parseRunway` uses. The committed `schema/<kind>.json` files are its
 *          output, and a test fails when they drift; the static Worker serves the same files to editors.
 * Boundary: editor-grade: cross-field rules (a dedicated resource's reason, `min` not above `max`) are `parseRunway`'s
 *           alone, since JSON Schema does not carry zod refinements.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: the version 3 schemas), ADR 0284 (the static Worker serves them).
 */
import { z } from "zod";

import { RUNWAY_SCHEMA_ORIGIN } from "#core/constants/runway-schema-origin.constant";
import { RUNWAY_SCHEMAS } from "#core/constants/runway-schemas.constant";
import type { RunwayKind } from "#core/enums/runway-kind.enum";

/**
 * The JSON Schema of `kind`, with its hosted `$id` and a title.
 *
 * @example
 * runwayJsonSchema("app").$id; // "https://static.stackra.figentra.com/schemas/runway/app.json"
 */
export function runwayJsonSchema(kind: RunwayKind): Record<string, unknown> & { $id: string } {
  return {
    ...z.toJSONSchema(RUNWAY_SCHEMAS[kind], { target: "draft-2020-12", io: "input" }),
    $id: `${RUNWAY_SCHEMA_ORIGIN}/${kind}.json`,
    title: `Stackra ${kind} runway, format version 3`,
  };
}
