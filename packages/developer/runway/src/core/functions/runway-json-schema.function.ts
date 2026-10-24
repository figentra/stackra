/**
 * Stackra file contract:
 * Purpose: `runwayJsonSchema(kind)`, the JSON Schema (draft 2020-12, input side) of a runway kind, derived from the
 *          zod schema `parseRunway` uses, with the canonical file's `$id` and title. The shipped `schema/<kind>.json`
 *          files are byte copies of the canonical `tools/schemas/runway-<kind>.schema.json`; a test compares this
 *          derivation with them, so the zod and the canonical files cannot drift.
 * Boundary: validation only: no descriptions or examples (the canonical file is their one home), no conditionals,
 *           `uniqueItems` or `minProperties` (zod states those as refinements, which JSON Schema does not carry), and
 *           every subschema inline instead of `$ref`.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: the version 3 schemas), ADR 0284 (the static Worker serves them).
 */
import { z } from "zod";

import { RUNWAY_SCHEMA_ORIGIN } from "#core/constants/runway-schema-origin.constant";
import { RUNWAY_SCHEMAS } from "#core/constants/runway-schemas.constant";
import { RunwayKind } from "#core/enums/runway-kind.enum";

/**
 * The JSON Schema of `kind`, with its hosted `$id` and the canonical title.
 *
 * @example
 * runwayJsonSchema("app").$id; // "https://static.stackra.figentra.com/schemas/runway/app.json"
 * runwayJsonSchema("app").title; // "runway.yaml (app member)"
 */
export function runwayJsonSchema(kind: RunwayKind): Record<string, unknown> & {
  $id: string;
  title: string;
} {
  return {
    ...z.toJSONSchema(RUNWAY_SCHEMAS[kind], { target: "draft-2020-12", io: "input" }),
    $id: `${RUNWAY_SCHEMA_ORIGIN}/${kind}.json`,
    title: kind === RunwayKind.Root ? "runway.yaml (root)" : `runway.yaml (${kind} member)`,
  };
}
