/**
 * Stackra file contract:
 * Purpose: unit tests of `bumpStackraPins`: a package.json's and a pnpm-workspace.yaml's exact `@stackra/*` pins move
 *          with their prefix and quoting kept and every other byte untouched; `workspace:`, `catalog:`, `npm:` and range
 *          specifiers, `@stackra-pro/*` and list entries stay; without a target it only lists the pins.
 * Boundary: test only; pure text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2); STA-145.
 */
import { describe, expect, it } from "@stackra/testing";

import { bumpStackraPins } from "#node/upgrade/functions/bump-stackra-pins.function";

const PACKAGE_JSON = `{
  "name": "@acme/orders",
  "dependencies": {
    "@stackra/actions": "^0.30.1",
    "@stackra/config": "0.30.1",
    "@stackra/ui": "~0.29.0",
    "@stackra/model": "catalog:stackra",
    "@stackra/gen": "workspace:*",
    "@stackra-pro/ui": "0.30.1",
    "@stackra/old": "npm:@stackra/other@0.30.1",
    "@stackra/range": ">=0.30.0 <1",
    "zod": "4.6.7"
  }
}
`;

const WORKSPACE = `catalogs:
  stackra:
    "@stackra/actions": 0.30.1 # the framework line
    '@stackra/cli': '0.30.1'
    "@stackra/config": "^0.30.1"
    "@stackra-pro/ui": 0.30.1
  default:
    zod: 4.6.7
minimumReleaseAgeExclude:
  - "@stackra/*"
`;

describe("bumpStackraPins", () => {
  it("moves a package.json's exact pins and keeps their prefixes and every other byte", () => {
    const { text, pins } = bumpStackraPins(PACKAGE_JSON, "json", "0.33.1");
    expect(text).toBe(
      PACKAGE_JSON.replace('"^0.30.1"', '"^0.33.1"')
        .replace('"@stackra/config": "0.30.1"', '"@stackra/config": "0.33.1"')
        .replace('"~0.29.0"', '"~0.33.1"'),
    );
    expect(pins).toEqual([
      { name: "@stackra/actions", from: "^0.30.1", to: "^0.33.1" },
      { name: "@stackra/config", from: "0.30.1", to: "0.33.1" },
      { name: "@stackra/ui", from: "~0.29.0", to: "~0.33.1" },
    ]);
  });

  it("moves a pnpm-workspace.yaml's catalog pins with their quoting and comments", () => {
    const { text, pins } = bumpStackraPins(WORKSPACE, "yaml", "0.33.1");
    expect(text).toBe(`catalogs:
  stackra:
    "@stackra/actions": 0.33.1 # the framework line
    '@stackra/cli': '0.33.1'
    "@stackra/config": "^0.33.1"
    "@stackra-pro/ui": 0.30.1
  default:
    zod: 4.6.7
minimumReleaseAgeExclude:
  - "@stackra/*"
`);
    expect(pins.map((pin) => pin.name)).toEqual([
      "@stackra/actions",
      "@stackra/cli",
      "@stackra/config",
    ]);
  });

  it("lists the pins without a target and leaves the text alone", () => {
    const listed = bumpStackraPins(WORKSPACE, "yaml", undefined);
    expect(listed.text).toBe(WORKSPACE);
    expect(listed.pins).toEqual([
      { name: "@stackra/actions", from: "0.30.1", to: "0.30.1" },
      { name: "@stackra/cli", from: "0.30.1", to: "0.30.1" },
      { name: "@stackra/config", from: "^0.30.1", to: "^0.30.1" },
    ]);
  });
});
