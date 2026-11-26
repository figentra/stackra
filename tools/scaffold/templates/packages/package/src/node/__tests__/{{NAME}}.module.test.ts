/**
 * Stackra file contract:
 * Purpose: proves the root module of @stackra/{{NAME}} sits where gen looks for it, `src/node/<name>.module.ts`
 *          named after the member folder, is a `Module` kind and imports nothing yet.
 * Boundary: imports the module file; builds no container.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R12); ADR 0022 (test placement).
 */
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

import { kindOf } from "@stackra/container";

import { {{PASCAL}}Module } from "#node/{{NAME}}.module";

/** The member folder's name: the package name differs in a product (`@figentra/<product>-<name>`). */
const folder = basename(fileURLToPath(new URL("../../../", import.meta.url)));

describe("{{PASCAL}}Module", () => {
  it("is a module that imports no module yet", () => {
    expect(kindOf({{PASCAL}}Module)?.kind).toBe("module");
    expect(kindOf({{PASCAL}}Module)?.options["imports"]).toEqual([]);
  });

  it("is the root module named after the member folder", async () => {
    const found: Record<string, unknown> = await import(
      new URL(`../${folder}.module.ts`, import.meta.url).href
    );
    expect(found["{{PASCAL}}Module"]).toBe({{PASCAL}}Module);
  });
});
