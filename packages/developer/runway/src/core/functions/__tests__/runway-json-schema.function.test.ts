/**
 * Stackra file contract:
 * Purpose: unit tests of `runwayJsonSchema`: each kind's schema carries its hosted `$id`, a title and draft 2020-12;
 *          member schemas require `version` 3 and close their top level; and the committed `schema/<kind>.json`
 *          files equal the derivation, so a schema change without regenerating them fails here.
 * Boundary: test only; reads the committed files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement); ADR 0284 (the static Worker serves them).
 */
import { readFileSync } from "node:fs";

import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunwayKind } from "#core/enums/runway-kind.enum";
import { runwayJsonSchema } from "#core/functions/runway-json-schema.function";

describe("runwayJsonSchema", () => {
  it("gives each kind its hosted $id, a title and draft 2020-12", () => {
    for (const kind of Enum.values(RunwayKind)) {
      const schema = runwayJsonSchema(kind);

      expect(schema.$id).toBe(`https://static.stackra.figentra.com/schemas/runway/${kind}.json`);
      expect(schema["title"]).toBe(`Stackra ${kind} runway, format version 3`);
      expect(schema["$schema"]).toBe("https://json-schema.org/draft/2020-12/schema");
    }
  });

  it("requires version 3 and closes the top level of a member runway", () => {
    for (const kind of [RunwayKind.App, RunwayKind.Service]) {
      const schema = runwayJsonSchema(kind);

      expect(schema).toMatchObject({
        properties: { version: { const: 3 } },
        additionalProperties: false,
      });
      expect(schema["required"]).toEqual(expect.arrayContaining(["version", "environments"]));
      expect(schema["required"]).not.toContain("secrets");
    }
  });

  it("matches the committed schema files", () => {
    for (const kind of Enum.values(RunwayKind)) {
      const committed: unknown = JSON.parse(
        readFileSync(new URL(`../../../../schema/${kind}.json`, import.meta.url), "utf8"),
      );

      expect(committed).toEqual(runwayJsonSchema(kind));
    }
  });
});
