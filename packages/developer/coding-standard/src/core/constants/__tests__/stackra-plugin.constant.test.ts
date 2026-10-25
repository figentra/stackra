/**
 * Stackra file contract:
 * Purpose: unit tests of `STACKRA_PLUGIN`: the plugin is named `stackra`, is the module's default export, registers
 *          every house rule under its kebab-case name, and each rule carries messages, an empty options schema and
 *          a `create` function; fixable rules say so.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
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
