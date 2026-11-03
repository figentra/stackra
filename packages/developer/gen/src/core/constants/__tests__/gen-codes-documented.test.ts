/**
 * Stackra file contract:
 * Purpose: guard that the docs name gen's check codes as gen emits them: every backticked snake_case code on an
 *          `automated —` row of the checked ADRs and rules is a quoted literal of gen's non-test source, and no
 *          checked document names the retired one-declaration code (STA-2068, G-210 and G-211).
 * Boundary: test only; reads the checked documents and gen's own source from disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (snake_case machine codes); ADR 0263, 0294, 0305 and 0307
 *                     (their Enforcement sections).
 */
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";

const ROOT = new URL("../../../../../../../", import.meta.url);
const GEN_SRC = new URL("../../../", import.meta.url);
const ADR_DIR = new URL("apps/docs/src/docs/adr/", ROOT);

/** The ADRs (by number) and rules whose `automated —` rows must name real gen codes. */
const CHECKED_ADRS = ["0263", "0294", "0305", "0307"];
const CHECKED_RULES = [".agents/rules/ai-tools.md", ".agents/rules/naming-and-casing.md"];

const CODE = /`([a-z][a-z0-9]*(?:_[a-z0-9]+)+)`/g;
const LITERAL = /["'`]([a-z][a-z0-9]*(?:_[a-z0-9]+)+)["'`]/g;
// Built from parts so this file does not itself hold the retired name it guards against.
const RETIRED = ["two", "kinds", "in", "file"].join("_");

/** Splits Markdown into rows: a row ends at the next list item, blank line or heading (spec EC-02). */
const rowsOf = (text: string): string[] => {
  const rows: string[] = [];
  let row: string[] = [];
  const close = (): void => {
    if (row.length > 0) rows.push(row.join(" "));
    row = [];
  };
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      close();
      continue;
    }
    if (/^[-*] /.test(trimmed)) close();
    row.push(trimmed);
  }
  close();
  return rows;
};

/** The codes named on built rows (`automated —`, optionally after "Enforcement…:"); other tokens are skipped (EC-01). */
const builtCodesOf = (text: string): string[] =>
  rowsOf(text)
    .map((row) => row.replace(/^[-*] /, "").replace(/^Enforcement[^:]*:\s*/, ""))
    .filter((row) => row.startsWith("automated —"))
    .flatMap((row) => [...row.matchAll(CODE)].map((match) => match[1] as string));

const documents = (): { path: string; text: string }[] => {
  const adrs = readdirSync(ADR_DIR);
  return [
    ...CHECKED_ADRS.map((number) => {
      const name = adrs.find((file) => file.startsWith(`${number}-`) && file.endsWith(".mdx"));
      if (name === undefined)
        throw new Error(`ADR ${number} is missing from apps/docs/src/docs/adr`);
      return `apps/docs/src/docs/adr/${name}`;
    }),
    ...CHECKED_RULES,
  ].map((path) => ({ path, text: readFileSync(new URL(path, ROOT), "utf8") }));
};

const genLiterals = (): Set<string> => {
  const literals = new Set<string>();
  for (const file of readdirSync(GEN_SRC, { recursive: true, encoding: "utf8" })) {
    if (!file.endsWith(".ts") || file.split(/[/\\]/).includes("__tests__")) continue;
    for (const match of readFileSync(new URL(file, GEN_SRC), "utf8").matchAll(LITERAL))
      literals.add(match[1] as string);
  }
  return literals;
};

describe("gen codes documented", () => {
  it("reads codes from automated rows only, across wrapped lines, and skips kebab and dotted names", () => {
    const text = [
      "## Enforcement",
      "",
      "- automated — `stackra gen` (`check-conventions.function.ts`): `kind_class_name` and the",
      "  `one-declaration-per-file` lint rule, and `no_such_code`.",
      "- planned — STA-340: `secret_on_wire`.",
      "",
      "Enforcement: automated — `identity_changed`.",
      "",
      "Planned — `refresh_on_domain_event`.",
    ].join("\n");

    expect(builtCodesOf(text)).toEqual(["kind_class_name", "no_such_code", "identity_changed"]);
    expect(builtCodesOf("## Enforcement\n\n- planned — STA-340: `secret_on_wire`.")).toEqual([]);
  });

  it("finds every code a checked document names as built in gen's source", () => {
    const literals = genLiterals();
    expect(literals.has("two_declarations_in_file")).toBe(true);

    const unknown = documents().flatMap(({ path, text }) =>
      builtCodesOf(text)
        .filter((code) => !literals.has(code))
        .map((code) => `${path}: \`${code}\` is on an automated row but gen has no such code`),
    );

    expect(unknown, "fix the name, or move the row back to `planned —`").toEqual([]);
  });

  it("names the one-declaration check as gen does", () => {
    const stale = documents()
      .filter(({ text }) => text.includes(RETIRED))
      .map(({ path }) => path);

    expect(stale).toEqual([]);
  });
});
