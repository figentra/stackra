/**
 * Stackra file contract:
 * Purpose: proves the root module of @stackra/navigation sits where gen looks for it, `src/node/<name>.module.ts`
 *          named after the package, and imports nothing yet.
 * Boundary: reads package.json and imports the module file; builds no container.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0022 (test placement).
 */
import { readFileSync } from "node:fs";

import { NavigationModule } from "#node/navigation.module";

const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8")) as {
  name: string;
};

// shortcut: a unit test until @stackra/container ships createTestingModule; then `.int.test.ts` that compiles it.
describe("NavigationModule", () => {
  it("imports no module yet", () => {
    expect(NavigationModule.imports).toEqual([]);
  });

  it("is the root module named after the package", async () => {
    const name = pkg.name.split("/").at(-1) ?? "";
    const found: Record<string, unknown> = await import(
      new URL(`../${name}.module.ts`, import.meta.url).href
    );
    expect(found["NavigationModule"]).toBe(NavigationModule);
  });
});
