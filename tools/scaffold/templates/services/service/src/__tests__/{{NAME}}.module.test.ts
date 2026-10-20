/**
 * Stackra file contract:
 * Purpose: boots the root module of @figentra/service-{{NAME}} and proves `package.json` `stackra.module` names it
 *          (ADR 0090), so `stackra gen` finds the graph.
 * Owner: the service owner · Secrets: forbidden
 */
import { readFileSync } from "node:fs";

import { {{PASCAL}}Module } from "../{{NAME}}.module";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  stackra: { module: string };
};

describe("{{PASCAL}}Module", () => {
  it("boots with an empty imports list", () => {
    expect({{PASCAL}}Module.imports).toEqual([]);
  });

  it("is the module package.json declares", async () => {
    const declared: Record<string, unknown> = await import(
      new URL(`../../${pkg.stackra.module}`, import.meta.url).href
    );
    expect(declared["{{PASCAL}}Module"]).toBe({{PASCAL}}Module);
  });
});
