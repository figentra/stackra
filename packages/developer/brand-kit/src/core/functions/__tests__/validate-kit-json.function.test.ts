/**
 * Stackra file contract:
 * Purpose: unit tests of `validateKitJson`: a usable kit passes, and each broken rule gives its own problem line.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { describe, expect, it } from "@stackra/testing";

import { validateKitJson } from "#core/functions/validate-kit-json.function";

const KIT = {
  id: "organza",
  group: "family",
  status: "proposed",
  parent: { kit: "figentra", version: "2.0.0", endorsement: "by" },
  name: { en: "Organza", ar: "أورجانزا" },
  line: { en: "Retail for fashion." },
};

describe("validateKitJson", () => {
  it("accepts a usable kit", () => {
    expect(validateKitJson(KIT)).toEqual([]);
  });

  it("refuses a value that is not an object", () => {
    expect(validateKitJson([])).toEqual(["kit.json: not a JSON object"]);
  });

  it("names each broken rule", () => {
    const problems = validateKitJson({
      ...KIT,
      id: "Organza",
      status: "draft",
      name: { ar: "x" },
      parent: { kit: "figentra", version: "2", endorsement: "with" },
    });
    expect(problems).toHaveLength(5);
    expect(problems.join("\n")).toContain('"id" must be kebab-case');
    expect(problems.join("\n")).toContain('"status" must be one of approved');
    expect(problems.join("\n")).toContain('"name.en" is required');
    expect(problems.join("\n")).toContain('"parent.version" must be a semver version');
    expect(problems.join("\n")).toContain('"parent.endorsement" must be one of by, powered-by');
  });
});
