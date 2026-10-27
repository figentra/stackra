/**
 * Stackra file contract:
 * Purpose: unit tests of `readMemberFacts`: the member key from the folder, package facts, the layout from the
 *          `define*` call, an app's area and target codes, and a missing package.json refused.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (2026-10-23 item 14); ADR 0295 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { readMemberFacts } from "#node/functions/read-member-facts.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readMemberFacts", () => {
  it("reads a package", () => {
    const root = writeFixtureMember("loyalty-kit", {
      "package.json": JSON.stringify({
        name: "@acme/loyalty-kit",
        version: "0.4.0",
        dependencies: { "@stackra/contracts": "workspace:*" },
      }),
    });
    expect(readMemberFacts(root)).toEqual({
      root,
      member: "loyalty_kit",
      package: "@acme/loyalty-kit",
      version: "0.4.0",
      layout: "package",
      dependencies: ["@stackra/contracts"],
      runtimeDependencies: ["@stackra/contracts"],
    });
  });

  it("reads an app's area and targets", () => {
    const root = writeFixtureMember("web", {
      "stackra.config.ts": [
        'import { ApiArea, defineApp, Target } from "@stackra/contracts";',
        "export default defineApp({ targets: [Target.Web, Target.Ios], area: ApiArea.App });",
        "",
      ].join("\n"),
    });
    expect(readMemberFacts(root)).toMatchObject({
      member: "web",
      layout: "app",
      kind: "app",
      area: "app",
      targets: ["web", "ios"],
    });
  });

  it("reads a service and refuses a folder without package.json", () => {
    const root = writeFixtureMember("commerce", {
      "stackra.config.ts":
        'import { defineService } from "@stackra/contracts";\nexport default defineService({});\n',
    });
    expect(readMemberFacts(root).layout).toBe("service");
    expect(() => readMemberFacts(`${root}/src`)).toThrow(/no package.json/);
  });
});
