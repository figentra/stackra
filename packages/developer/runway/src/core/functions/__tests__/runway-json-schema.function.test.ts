/**
 * Stackra file contract:
 * Purpose: unit tests of `runwayJsonSchema`: each kind's schema carries the canonical `$id`, title and draft 2020-12;
 *          member schemas require only `version` 3 and `environments` and close their top level; and the derivation
 *          equals the shipped `schema/<kind>.json` (a byte copy of `tools/schemas/runway-<kind>.schema.json`, checked
 *          by `pnpm validate`) once both are normalised, so a zod change the canonical file does not make fails here.
 * Boundary: test only; reads the shipped files. Byte equality is out of reach: `z.toJSONSchema` cannot write the
 *           keywords `NOT_FROM_ZOD` lists, and it spells a few equal schemas differently (`normalise`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement); ADR 0284 (the static Worker serves them).
 */
import { readFileSync } from "node:fs";

import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunwayKind } from "#core/enums/runway-kind.enum";
import { runwayJsonSchema } from "#core/functions/runway-json-schema.function";

/** The canonical keywords `z.toJSONSchema` cannot write, each with the reason; dropped before the comparison. */
const NOT_FROM_ZOD = new Map([
  [
    "description",
    "annotation: the canonical file is the one home of the editor text, a .meta() copy would drift",
  ],
  ["examples", "annotation, as description"],
  ["$comment", "annotation, as description"],
  [
    "if",
    "conditional (dedicated: true needs reason): zod has none, parseRunway refines it, refinements emit nothing",
  ],
  ["then", "the other half of if"],
  ["allOf", "holds only the topology conditional (mode: grouped needs groups), refined like if"],
  [
    "uniqueItems",
    "zod has no unique array; parseRunway refines secrets, isolate and group members",
  ],
  [
    "minProperties",
    "zod has no object size check; the var reference refinement (one origin) covers it",
  ],
  ["$defs", "zod writes every subschema in place, so each $ref is inlined and $defs dropped"],
]);

/** The JSON value `pointer` (`#/$defs/resources/properties/cpu`) names inside `root`. */
function resolve(root: unknown, pointer: string): Record<string, unknown> {
  return pointer
    .slice(2)
    .split("/")
    .reduce((at, part) => (at as Record<string, unknown>)[part], root) as Record<string, unknown>;
}

/**
 * `node` with each `$ref` inlined (keys beside it win), the `NOT_FROM_ZOD` keywords dropped, and the spellings zod
 * and the canonical file differ on made equal: an always-true `additionalProperties: {}` or `properties: {}` goes;
 * `type` beside `const` or `enum` goes (zod states a literal's type); a property name's `type: "string"` goes (keys
 * are strings); `z.int()`'s safe-integer bounds go; `required` is sorted; a pattern's `\/` reads `/` (RegExp source
 * escapes the slash).
 */
function normalise(node: unknown, root: unknown): unknown {
  if (Array.isArray(node)) return node.map((item) => normalise(item, root));
  if (typeof node !== "object" || node === null) return node;
  let schema = node as Record<string, unknown>;
  while (typeof schema["$ref"] === "string") {
    const { $ref, ...beside } = schema;
    schema = { ...resolve(root, $ref as string), ...beside };
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (NOT_FROM_ZOD.has(key)) continue;
    out[key] =
      key === "properties"
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([name, sub]) => [
              name,
              normalise(sub, root),
            ]),
          )
        : normalise(value, root);
  }
  for (const key of ["additionalProperties", "properties"]) {
    const value = out[key];
    if (typeof value === "object" && value !== null && Object.keys(value).length === 0)
      Reflect.deleteProperty(out, key);
  }
  if ("const" in out || "enum" in out) delete out["type"];
  const names = out["propertyNames"] as Record<string, unknown> | undefined;
  if (names?.["type"] === "string") delete names["type"];
  if (names !== undefined && Object.keys(names).length === 0) delete out["propertyNames"];
  if (out["minimum"] === -Number.MAX_SAFE_INTEGER) delete out["minimum"];
  if (out["maximum"] === Number.MAX_SAFE_INTEGER) delete out["maximum"];
  if (Array.isArray(out["required"])) out["required"] = [...(out["required"] as string[])].sort();
  const pattern = out["pattern"];
  if (typeof pattern === "string") out["pattern"] = pattern.replaceAll("\\/", "/");
  return out;
}

/** The shipped schema file of `kind`. */
function shipped(kind: RunwayKind): Record<string, unknown> {
  return JSON.parse(
    readFileSync(new URL(`../../../../schema/${kind}.json`, import.meta.url), "utf8"),
  ) as Record<string, unknown>;
}

describe("runwayJsonSchema", () => {
  it("carries the canonical $id, title and draft 2020-12", () => {
    for (const kind of Enum.values(RunwayKind)) {
      const schema = runwayJsonSchema(kind);
      const canonical = shipped(kind);

      expect(schema.$id).toBe(canonical["$id"]);
      expect(schema.title).toBe(canonical["title"]);
      expect(schema["$schema"]).toBe("https://json-schema.org/draft/2020-12/schema");
    }
  });

  it("requires only version 3 and environments, and closes the top level of a member runway", () => {
    for (const kind of [RunwayKind.App, RunwayKind.Service]) {
      const schema = runwayJsonSchema(kind);

      expect(schema).toMatchObject({
        properties: { version: { const: 3 } },
        additionalProperties: false,
      });
      expect(schema["required"]).toEqual(["version", "environments"]);
    }
  });

  it("derives what the shipped canonical file holds, once both are normalised", () => {
    for (const kind of Enum.values(RunwayKind)) {
      const derived = runwayJsonSchema(kind);
      const canonical = shipped(kind);

      expect(normalise(derived, derived)).toEqual(normalise(canonical, canonical));
    }
  });

  it("drops only keywords the canonical files use", () => {
    const text = Enum.values(RunwayKind)
      .map((kind) => JSON.stringify(shipped(kind)))
      .join("");

    for (const keyword of NOT_FROM_ZOD.keys()) expect(text).toContain(`"${keyword}":`);
  });
});
