/**
 * Stackra file contract:
 * Purpose: the error-code reference guard (STA-2853): `customers/error-codes` lists exactly the codes the tools can
 *          print, each with a cause and a fix: gen's refusal and warning codes, the rules of `stackra check` (the
 *          repository checks and the CLI's phases), and Runway's issue codes and error classes; and every code the
 *          troubleshooting page names is one of them. Unit tests pin how `emittedCodes` follows a code (helpers in
 *          the file and across files, conditionals, `for … of` lists) and how `documentedCodes` reads the tables.
 * Boundary: test only; reads the tools' source under packages/developer and the two pages from disk, and writes
 *           fixtures only to a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; ADR 0294 (decision 22); ADR 0282 (decision 3); ADR 0296;
 *                     STA-2853.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { declaredCodes } from "../declared-codes";
import { documentedCodes } from "../documented-codes";
import { emittedCodes } from "../emitted-codes";
import { errorClasses } from "../error-classes";
import { tableCells } from "../table-cells";

const ROOT = fileURLToPath(new URL("../../../../../", import.meta.url));
const DEVELOPER = join(ROOT, "packages/developer");
const PAGES = join(ROOT, "apps/docs/src/docs/customers");

/** gen's findings: every refusal and warning carries a `fix`. */
const GEN_SHAPE = { property: "code", siblings: ["fix"] } as const;

/** The check findings: a repository check's `{ rule, dir, text }`, or a phase's `{ rule, message }`. */
const CHECK_SHAPE = { property: "rule", siblings: ["text", "message"] } as const;

/**
 * The rule expressions that pass another tool's rule name through instead of naming one: the page explains them in
 * prose (oxlint rules, gitleaks rules, TypeScript codes, gen codes). A new entry here needs a line on the page.
 */
const PASSED_THROUGH_RULES = {
  "repo-checks": ["node/functions/to-finding.function.ts: raw.rule"],
  cli: [
    "node/constants/gen-phase.constant.ts: rule",
    'node/constants/lint-phase.constant.ts: diagnostic.code ?? "oxlint"',
    'node/constants/secrets-phase.constant.ts: leak.RuleID ?? "leak"',
    "node/constants/typecheck-phase.constant.ts: rule",
    "node/functions/tool-finding.function.ts: fields.rule",
  ],
};

/** Snake_case words in backticks the troubleshooting page names that are not codes (a folder name). */
const NOT_CODES = new Set(["node_modules"]);

/** Writes `files` under a new temporary folder and returns it. */
function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "error-codes-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

/** The page's rows of one `## ` section, by code. */
function section(name: string): Map<string, { cause: string; fix: string }> {
  const rows = documentedCodes(readFileSync(join(PAGES, "error-codes.mdx"), "utf8"));
  return new Map(rows.filter((row) => row.section === name).map((row) => [row.code, row] as const));
}

/** What is in one set and not the other, both ways, for a readable failure. */
function difference(emitted: Iterable<string>, documented: Iterable<string>) {
  const a = new Set(emitted);
  const b = new Set(documented);
  return {
    undocumented: [...a].filter((code) => !b.has(code)).sort(),
    notEmitted: [...b].filter((code) => !a.has(code)).sort(),
  };
}

describe("emittedCodes", () => {
  it("follows a code through literals, local and imported helpers, conditionals and for-of lists", () => {
    const dir = fixture({
      "a.ts": [
        'import { refuseShared } from "./shared";',
        "export function check(flag: boolean) {",
        '  const refuse = (code: string, message: string) => ({ code, message, fix: "f" });',
        '  const direct = { code: "direct_code", message: "m", fix: "f" };',
        '  const picked = { code: flag ? "when_true" : "when_false", fix: "f" };',
        '  for (const [code, text] of [["listed_one", 1], ["listed_two", 2]] as const) refuse(code, String(text));',
        '  return [direct, picked, refuse("local_helper", "m"), refuseShared("cross_file")];',
        "}",
      ].join("\n"),
      "shared.ts": [
        "export function refuseShared(code: string) {",
        '  return { code, message: "m", fix: "f" };',
        "}",
      ].join("\n"),
      // A same-named local helper elsewhere is another function: its first argument is no code.
      "other.ts": [
        "const refuse = (message: string) => message;",
        'export const unrelated = refuse("not_a_code");',
        'export const plain = { code: "no_fix_sibling", message: "m" };',
      ].join("\n"),
      "__tests__/a.test.ts": 'export const x = { code: "test_only", fix: "f" };',
    });

    const { codes, unresolved } = emittedCodes(dir, GEN_SHAPE);

    expect([...codes.keys()]).toEqual([
      "cross_file",
      "direct_code",
      "listed_one",
      "listed_two",
      "local_helper",
      "when_false",
      "when_true",
    ]);
    expect(codes.get("cross_file")).toEqual(["shared.ts"]);
    expect(unresolved).toEqual([]);
  });

  it("reports a code it cannot follow to a literal instead of dropping it", () => {
    const dir = fixture({
      "a.ts": 'export const f = (x: { name: string }) => ({ code: x.name, fix: "f" });',
    });

    expect(emittedCodes(dir, GEN_SHAPE).unresolved).toEqual(["a.ts: x.name"]);
  });

  it("reads literal-union code members and error class names", () => {
    const dir = fixture({
      "issue.type.ts":
        'export interface Issue { readonly code: "one_code" | "two_code"; readonly path: string }',
      "single.type.ts": 'export interface Single { readonly code: "three_code" }',
      "plain.type.ts": "export interface Plain { readonly code: string }",
      "x-failed.error.ts": "export class XFailedError extends Error {}",
    });

    expect([...declaredCodes(dir, "code").keys()].sort()).toEqual([
      "one_code",
      "three_code",
      "two_code",
    ]);
    expect(errorClasses(dir)).toEqual(["XFailedError"]);
  });
});

describe("documentedCodes", () => {
  it("reads code rows by section, skipping headers, bold rows and fenced blocks", () => {
    const text = [
      "## Gen",
      "",
      "```text",
      "| `in_fence` | no | no |",
      "```",
      "",
      "| Code | Cause | Fix |",
      "| --- | --- | --- |",
      "| `a_code` | Its cause. | Its fix with `a | pipe`. |",
      "| **lint** | a phase | prose |",
      "",
      "## Runway",
      "",
      "| `RunwayLockedError` | Busy. | Wait. |",
    ].join("\n");

    expect(documentedCodes(text)).toEqual([
      {
        code: "a_code",
        section: "Gen",
        cause: "Its cause.",
        fix: "Its fix with `a | pipe`.",
        line: 9,
      },
      { code: "RunwayLockedError", section: "Runway", cause: "Busy.", fix: "Wait.", line: 14 },
    ]);
    expect(tableCells("not a row")).toBeUndefined();
  });
});

describe("the error-code reference", () => {
  it("lists every code gen can print, and no other", () => {
    const { codes, unresolved } = emittedCodes(join(DEVELOPER, "gen/src"), GEN_SHAPE);

    expect(unresolved, "gen builds a code the extractor cannot follow").toEqual([]);
    expect(codes.size).toBeGreaterThan(150);
    expect(difference(codes.keys(), section("Gen").keys())).toEqual({
      undocumented: [],
      notEmitted: [],
    });
  });

  it("lists every rule stackra check can print, and no other", () => {
    const repo = emittedCodes(join(DEVELOPER, "repo-checks/src"), CHECK_SHAPE);
    const cli = emittedCodes(join(DEVELOPER, "cli/src"), CHECK_SHAPE);

    expect(repo.unresolved).toEqual(PASSED_THROUGH_RULES["repo-checks"]);
    expect(cli.unresolved).toEqual(PASSED_THROUGH_RULES.cli);
    expect(
      difference([...repo.codes.keys(), ...cli.codes.keys()], section("Check").keys()),
    ).toEqual({ undocumented: [], notEmitted: [] });
  });

  it("lists every Runway issue code and error, and no other", () => {
    const source = join(DEVELOPER, "runway/src");
    const emitted = [...declaredCodes(source, "code").keys(), ...errorClasses(source)];

    expect(emitted).toContain("member_unplaced");
    expect(emitted).toContain("RunwayLockedError");
    expect(difference(emitted, section("Runway").keys())).toEqual({
      undocumented: [],
      notEmitted: [],
    });
  });

  it("gives every code one row with a cause and a fix", () => {
    const rows = documentedCodes(readFileSync(join(PAGES, "error-codes.mdx"), "utf8"));
    const seen = new Set<string>();
    const problems = rows.flatMap(({ code, cause, fix, line }) => {
      const found: string[] = [];
      if (seen.has(code)) found.push(`line ${line}: ${code} is listed twice`);
      seen.add(code);
      if (cause.length < 10) found.push(`line ${line}: ${code} has no cause`);
      if (fix.length < 5) found.push(`line ${line}: ${code} has no fix`);
      return found;
    });

    expect(problems).toEqual([]);
  });

  it("names on the troubleshooting page only codes the reference lists", () => {
    const listed = new Set(
      documentedCodes(readFileSync(join(PAGES, "error-codes.mdx"), "utf8")).map((row) => row.code),
    );
    const troubleshooting = readFileSync(join(PAGES, "troubleshooting.mdx"), "utf8");
    // A lower snake_case word in backticks with two or more parts reads as a code (`shape_number_kind`).
    const named = [...troubleshooting.matchAll(/`([a-z][a-z0-9]*(?:_[a-z0-9]+)+)`/g)].map(
      (match) => match[1] ?? "",
    );

    expect(named.length).toBeGreaterThan(0);
    expect(named.filter((code) => !listed.has(code) && !NOT_CODES.has(code))).toEqual([]);
  });
});
