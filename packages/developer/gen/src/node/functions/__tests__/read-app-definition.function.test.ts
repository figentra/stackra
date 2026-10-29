/**
 * Stackra file contract:
 * Purpose: unit tests of `readAppDefinition`: an app's `defineApp` data and its PascalCase icon sets read, nothing for
 *          a package, and a non-static argument refused as `app_definition_not_static`.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decisions 1 and 2).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { readAppDefinition } from "#node/functions/read-app-definition.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readAppDefinition", () => {
  it("reads the defineApp data and the icon sets", () => {
    const root = writeFixtureMember("mobile", {
      "stackra.config.ts": [
        'import { ApiArea, defineApp, Target } from "@stackra/contracts";',
        "export default defineApp({",
        "  targets: [Target.Ios],",
        "  area: ApiArea.App,",
        '  scheme: "acme",',
        '  ios: { bundleId: "com.acme.app" },',
        "});",
        "",
      ].join("\n"),
    });
    for (const folder of ["Ramadan", "Winter", "lowercase"])
      mkdirSync(join(root, "assets", "app-icons", folder), { recursive: true });
    expect(readAppDefinition(root)).toEqual({
      app: {
        definition: {
          targets: ["Target.Ios"],
          area: "ApiArea.App",
          scheme: "acme",
          ios: { bundleId: "com.acme.app" },
        },
        icons: ["Ramadan", "Winter"],
      },
      errors: [],
    });
  });

  it("reads nothing for a member that calls no defineApp", () => {
    const root = writeFixtureMember("loyalty-kit", {
      "stackra.config.ts": "export default definePackage({});\n",
    });
    expect(readAppDefinition(root)).toEqual({ errors: [] });
  });

  it("refuses an argument that is not static data", () => {
    const root = writeFixtureMember("web", {
      "stackra.config.ts": "export default defineApp({ ...base, targets: [] });\n",
    });
    expect(readAppDefinition(root).errors.map((error) => error.code)).toEqual([
      "app_definition_not_static",
    ]);
  });
});
