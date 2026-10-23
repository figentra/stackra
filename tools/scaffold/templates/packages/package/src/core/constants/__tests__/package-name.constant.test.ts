/**
 * Stackra file contract:
 * Purpose: proves the core constant names the package that package.json declares, so a rename cannot drift.
 * Boundary: reads package.json; no other I/O.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement).
 */
import { readFileSync } from "node:fs";

import { PACKAGE_NAME } from "#core/constants/package-name.constant";

const pkg = JSON.parse(readFileSync(new URL("../../../../package.json", import.meta.url), "utf8")) as {
  name: string;
};

describe("PACKAGE_NAME", () => {
  it("is the name package.json declares", () => {
    expect(PACKAGE_NAME).toBe(pkg.name);
  });
});
