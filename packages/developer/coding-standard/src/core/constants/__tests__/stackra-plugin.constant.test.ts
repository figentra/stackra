/**
 * Stackra file contract:
 * Purpose: unit tests of `STACKRA_PLUGIN`: the plugin is named `stackra`, is the module's default export, registers
 *          every house rule under its kebab-case name, and each rule carries messages, an empty options schema and
 *          a `create` function; fixable rules say so; and every non-test source file stays loadable from source by
 *          Node (no `#` value import, ADR 0421).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";

import STACKRA_PLUGIN_DEFAULT, { STACKRA_PLUGIN } from "#core/constants/stackra-plugin.constant";

describe("STACKRA_PLUGIN", () => {
  it("is named stackra and is the default export", () => {
    expect(STACKRA_PLUGIN.meta.name).toBe("stackra");
    expect(STACKRA_PLUGIN_DEFAULT).toBe(STACKRA_PLUGIN);
  });

  it("registers every house rule", () => {
    expect(Object.keys(STACKRA_PLUGIN.rules).sort()).toEqual([
      "base-matches-suffix",
      "disable-needs-reason",
      "docblock-shape",
      "file-contract",
      "hook-file-name",
      "lines-between-class-members",
      "member-order",
      "multiline-decorator-options",
      "no-empty-decorator",
      "no-empty-module",
      "no-enum",
      "no-hash-private",
      "no-kind-decorator",
      "no-parameter-decorator",
      "no-raw-key-literal",
      "no-tenant-vocabulary",
      "one-declaration-per-file",
    ]);
  });

  it.each(Object.entries(STACKRA_PLUGIN.rules))("%s is a complete rule", (_name, rule) => {
    expect(typeof rule.create).toBe("function");
    expect(rule.meta.schema).toEqual([]);
    expect(rule.meta.docs.description).toMatch(/\(.*(ADR|R-11|R-56|R-59|owner H).*\)\.$/);
    expect(Object.keys(rule.meta.messages).length).toBeGreaterThan(0);
  });

  it("marks the autofixing rules fixable", () => {
    const fixable = Object.entries(STACKRA_PLUGIN.rules)
      .filter(([, rule]) => rule.meta.fixable !== undefined)
      .map(([name]) => name)
      .sort();
    expect(fixable).toEqual([
      "docblock-shape",
      "lines-between-class-members",
      "multiline-decorator-options",
    ]);
  });
});

describe("the source-loaded plugin files", () => {
  it("import values only by relative .ts paths, so oxlint loads them without a dist", () => {
    for (const group of ["constants", "functions"]) {
      const dir = new URL(`../../${group}/`, import.meta.url);
      for (const file of readdirSync(dir).filter((name) => name.endsWith(".ts"))) {
        const text = readFileSync(new URL(file, dir), "utf8");
        const valueImports = [...text.matchAll(/^import (?!type )[^;]*from "([^"]+)";/gm)].map(
          (match) => match[1] ?? "",
        );
        for (const specifier of valueImports) expect(specifier).toMatch(/^\.\.?\/.*\.ts$/);
      }
    }
  });
});
