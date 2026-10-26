/**
 * Stackra file contract:
 * Purpose: unit tests of `checkKit`: a complete kit passes; missing required files, no logo, a required mark the kit
 *          lacks, live text in a logo, a bad symbol and each `versions.json` rule are reported.
 * Boundary: test only; the files are an in-memory map.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decisions 4 to 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkKit } from "#core/functions/check-kit.function";
import { parseKit } from "#core/functions/parse-kit.function";
import { KIT, SYMBOL_SVG } from "#core/functions/__tests__/fixtures/kit.fixture";

/** Checks a kit made of `files`. */
function run(files: Record<string, string>, kit = KIT): string[] {
  return checkKit(kit, Object.keys(files), (path) => files[path] ?? "");
}

const COMPLETE = {
  "kit.json": "{}",
  "README.md": "# Acme",
  "theme.json": "{}",
  "marks/symbol.svg": SYMBOL_SVG,
};

describe("checkKit", () => {
  it("passes a complete kit", () => {
    expect(run(COMPLETE)).toEqual([]);
  });

  it("reports missing files and no logo", () => {
    expect(run({ "kit.json": "{}" })).toEqual([
      "missing README.md",
      "missing theme.json",
      "missing marks/symbol.svg",
      "no logo SVG under logos/ or marks/",
    ]);
  });

  it("reports a required mark the kit lacks", () => {
    const kit = parseKit(
      JSON.stringify({
        id: "acme",
        name: { en: "Acme" },
        theme: "theme.json",
        symbol: "marks/symbol.svg",
        check: { requiredMarks: ["by-parent"] },
      }),
      "kit.json",
    );
    expect(run(COMPLETE, kit)).toEqual(["no by-parent*.svg mark under logos/ or marks/"]);
    expect(run({ ...COMPLETE, "marks/en/by-parent.light.svg": SYMBOL_SVG }, kit)).toEqual([]);
  });

  it("reports live text in any logo file", () => {
    expect(
      run({ ...COMPLETE, "versions/a/logos/word.svg": "<svg><text>Acme</text></svg>" }),
    ).toEqual(["versions/a/logos/word.svg: live <text> in a logo file (outline it)"]);
  });

  it("reports an unusable symbol", () => {
    expect(run({ ...COMPLETE, "marks/symbol.svg": '<svg viewBox="0 0 2 1"></svg>' })).toEqual([
      "marks/symbol.svg: the viewBox is not square",
    ]);
  });

  it("checks versions.json", () => {
    const versions = JSON.stringify({
      default: "b",
      versions: [
        { id: "a", status: "rejected", dir: "versions/directions/a" },
        { id: "b", status: "approved", dir: "versions/directions/b" },
        { id: "b", status: "maybe" },
        { id: "old", status: "retired" },
      ],
    });
    expect(run({ ...COMPLETE, "versions.json": versions })).toEqual([
      "versions.json: a: versions/directions/a/ missing",
      "versions.json: b: versions/directions/b/ missing",
      'versions.json: missing or duplicate id "b"',
      "versions.json: b: status must be one of approved, proposed, rejected, superseded, retired",
      "versions.json: old: a retired name needs name.en",
      'versions.json: the default version lives at the kit root, so it takes no "dir"',
    ]);
  });
});
