/**
 * Stackra file contract:
 * Purpose: unit tests of `parseCheckOptions`: every phase but `test` by default, `--only`/`--skip`, alias presets that
 *          flags override, `--with-tests`, and the usage errors for an unknown phase or format.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { parseCheckOptions } from "#node/functions/parse-check-options.function";

describe("parseCheckOptions", () => {
  it("runs every phase except the opt-in test phase, as text, without fixing", () => {
    const options = parseCheckOptions({}, {});
    expect(options.phases).toEqual([
      "config",
      "format",
      "spelling",
      "secrets",
      "structure",
      "docs",
      "lint",
      "gen",
      "typecheck",
      "catalogues",
      "spec",
    ]);
    expect(options).toMatchObject({
      fix: false,
      affected: false,
      keepGoing: false,
      format: "text",
      base: undefined,
    });
    expect(parseCheckOptions({ "keep-going": true }, {}).keepGoing).toBe(true);
  });

  it("keeps phase order for --only, drops --skip, and adds test on request", () => {
    expect(parseCheckOptions({ only: "lint,format" }, {}).phases).toEqual(["format", "lint"]);
    expect(parseCheckOptions({ skip: "secrets,spelling", "with-tests": true }, {}).phases).toEqual([
      "config",
      "format",
      "structure",
      "docs",
      "lint",
      "gen",
      "typecheck",
      "catalogues",
      "spec",
      "test",
    ]);
    expect(parseCheckOptions({ only: "test" }, {}).phases).toEqual(["test"]);
  });

  it("applies an alias's presets, which flags override", () => {
    expect(parseCheckOptions({}, { only: ["format", "lint"], fix: true })).toMatchObject({
      phases: ["format", "lint"],
      fix: true,
    });
    expect(parseCheckOptions({ only: "docs" }, { only: ["format", "lint"] }).phases).toEqual([
      "docs",
    ]);
    expect(
      parseCheckOptions({ affected: true, base: "origin/dev", format: "json" }, {}),
    ).toMatchObject({
      affected: true,
      base: "origin/dev",
      format: "json",
    });
  });

  it("refuses an unknown phase or format", () => {
    expect(() => parseCheckOptions({ only: "lint,typo" }, {})).toThrow(CliUsageError);
    expect(() => parseCheckOptions({ skip: "nope" }, {})).toThrow(/unknown phase nope/);
    expect(() => parseCheckOptions({ format: "xml" }, {})).toThrow(/unknown format xml/);
  });
});
