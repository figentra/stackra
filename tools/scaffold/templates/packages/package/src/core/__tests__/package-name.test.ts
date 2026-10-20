/**
 * Stackra file contract:
 * Purpose: proves the core entry exports the name package.json declares, so a rename cannot drift.
 * Owner: the package owner · Secrets: forbidden
 */
import { readFileSync } from "node:fs";

import { packageName } from "..";

const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8")) as {
  name: string;
};

describe("@stackra/{{NAME}} core", () => {
  it("exports its package name", () => {
    expect(packageName).toBe(pkg.name);
  });
});
