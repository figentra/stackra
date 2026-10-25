/**
 * Stackra file contract:
 * Purpose: unit tests of `seedPackTemplate`: the header names `seed-pack:<product>` at 0.1.0 and each profile gets a
 *          README with the document shape; no record is written.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); config-model section 6.
 */
import { describe, expect, it } from "@stackra/testing";

import { seedPackTemplate } from "#node/functions/seed-pack-template.function";

describe("seedPackTemplate", () => {
  it("writes the header and the profile READMEs only", () => {
    const files = seedPackTemplate({
      name: "commerce",
      pascal: "Commerce",
      description: "Commerce defaults.",
    });
    expect(files.map((file) => file.path)).toEqual([
      "seed-pack.yaml",
      "profiles/minimal/README.md",
      "profiles/demo/README.md",
      "profiles/test/README.md",
    ]);
    expect(files[0]?.content).toContain(
      "key: seed-pack:commerce\nproduct: commerce\nversion: 0.1.0",
    );
    expect(files[1]?.content).toContain("answer:");
  });
});
