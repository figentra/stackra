/**
 * Stackra file contract:
 * Purpose: hold `squawk-baseline.mjs` to the CTO's conditions (STA-2788): the committed baseline passes today's tree
 *          (every listed file present at its pinned SHA-256, every entry's rules matched by the findings it pins); and
 *          the gate fails on a changed or missing listed file, an entry or rule that no longer matches a finding, a
 *          finding in an unlisted file or under a rule its entry does not waive, and an entry or rule the base
 *          revision's list lacks; a glob, folder, `..`, `./` or absolute path and a waived `syntax-error` are refused;
 *          a report that is not Squawk's JSON fails the step.
 * Boundary: pure functions, the committed baseline and listed files, and temporary files for `main`; Squawk itself
 *           is not run here (the Quality Gate runs it).
 * Runtime: node
 * Governing contract: STA-2788; ADR 0159 (decision 3); ADR 0022 (tests live in tests folders).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  judge,
  main,
  normalizePath,
  parseArgs,
  parseBaseline,
  parseJsonc,
  parseReports,
  sha256,
} from "../squawk-baseline.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const BASELINE = "tools/scripts/squawk-baseline.jsonc";

/** A listed file, its bytes and an entry pinning two rules. */
const FILE = "packages/x/y/src/node/database/compiled-migrations/y_0001_drop.up.sql";
const BYTES = Buffer.from("drop table a;\nalter table b drop constraint c;\n");
const ENTRY = {
  path: FILE,
  sha256: sha256(BYTES),
  rules: ["ban-drop-constraint", "ban-drop-table"],
  reason: "frozen by ADR 0159, applied on main",
};
const FINDINGS = [
  { file: FILE, line: 1, rule: "ban-drop-table", message: "dropping a table" },
  { file: FILE, line: 2, rule: "ban-drop-constraint", message: "dropping a constraint" },
];
const read = (path) => (path === FILE ? BYTES : undefined);

test("the committed baseline passes today's tree: each file at its hash, each rule matched", () => {
  const entries = parseBaseline(parseJsonc(readFileSync(join(ROOT, BASELINE), "utf8")), BASELINE);
  assert.ok(entries.length > 0);
  const findings = entries.flatMap((entry) =>
    entry.rules.map((rule) => ({ file: entry.path, line: 1, rule, message: "" })),
  );
  const verdict = judge({
    entries,
    findings,
    base: entries,
    read: (path) => readFileSync(join(ROOT, path)),
  });
  assert.deepEqual(verdict.problems, []);
  assert.equal(verdict.waived, findings.length);
  for (const entry of entries) assert.equal(entry.reason, "frozen by ADR 0159, applied on main");
});

test("a clean pass: every finding waived by an entry with its file's hash", () => {
  assert.deepEqual(judge({ entries: [ENTRY], findings: FINDINGS, read }), {
    problems: [],
    unwaived: [],
    waived: 2,
  });
});

test("fails when a listed file's hash changes", () => {
  const { problems } = judge({
    entries: [ENTRY],
    findings: FINDINGS,
    read: () => Buffer.concat([BYTES, Buffer.from(" ")]),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /SHA-256 is [0-9a-f]{64}, not the baseline's/);
});

test("fails when a listed file is missing", () => {
  const { problems } = judge({ entries: [ENTRY], findings: FINDINGS, read: () => undefined });
  assert.deepEqual(problems, [`${FILE}: listed in the baseline but missing`]);
});

test("fails when an entry's rule, or the whole entry, no longer matches a finding", () => {
  const rule = judge({ entries: [ENTRY], findings: FINDINGS.slice(0, 1), read }).problems;
  assert.deepEqual(rule, [
    `${FILE}: the baseline waives ban-drop-constraint, which Squawk no longer reports there; remove it from the baseline`,
  ]);
  const entry = judge({ entries: [ENTRY], findings: [], read }).problems;
  assert.equal(entry.length, 2);
});

test("fails on a finding in an unlisted file, and on a rule its entry does not waive", () => {
  const unlisted = {
    file: "packages/x/z/new.up.sql",
    line: 3,
    rule: "ban-drop-table",
    message: "m",
  };
  const other = { file: FILE, line: 2, rule: "renaming-table", message: "renaming" };
  const verdict = judge({ entries: [ENTRY], findings: [...FINDINGS, unlisted, other], read });
  assert.deepEqual(verdict.unwaived, [unlisted, other]);
  assert.deepEqual(verdict.problems, [
    "packages/x/z/new.up.sql:3: ban-drop-table: m",
    `${FILE}:2: renaming-table: renaming`,
  ]);
});

test("the list only shrinks: an entry or rule the base lacks fails, a removed one passes", () => {
  const base = [{ ...ENTRY, rules: ["ban-drop-table"] }];
  assert.deepEqual(judge({ entries: [ENTRY], findings: FINDINGS, read, base }).problems, [
    `${FILE}: ban-drop-constraint is not waived in the base revision's baseline; the baseline only shrinks`,
  ]);
  assert.deepEqual(judge({ entries: [ENTRY], findings: FINDINGS, read, base: [] }).problems, [
    `${FILE}: not in the base revision's baseline; the baseline only shrinks`,
  ]);
  const shrunk = judge({ entries: [], findings: [], read, base: [ENTRY] });
  assert.deepEqual(shrunk.problems, []);
});

test("refuses a glob, a folder, `..`, `./` and an absolute path: exact paths only", () => {
  for (const path of [
    "packages/*/y/src/node/database/compiled-migrations/y_0001_drop.up.sql",
    "packages/x/y/src/node/database/compiled-migrations/*.up.sql",
    "packages/x/y/src/node/database/compiled-migrations/y_000?_drop.up.sql",
    "packages/x/{y,z}/a.up.sql",
    "packages/x/[yz]/a.up.sql",
    "packages/**/a.up.sql",
    "packages/x/y/src/node/database/compiled-migrations",
    "packages/x/y/src/node/database/compiled-migrations/",
    "packages/x/../y/a.up.sql",
    "./packages/x/y/a.up.sql",
    "/packages/x/y/a.up.sql",
  ])
    assert.throws(
      () => parseBaseline({ entries: [{ ...ENTRY, path }] }),
      /is not one exact repository-relative \.sql file/,
      path,
    );
});

/** Asserts that a baseline with the one `entry` is refused with `pattern`. */
const refused = (entry, pattern) =>
  assert.throws(() => parseBaseline({ entries: [entry] }), pattern);

/** A writable that keeps what is written. */
const sink = () => {
  let text = "";
  return { write: (chunk) => (text += chunk), text: () => text };
};

test("refuses a waived syntax-error, a bad hash, a missing reason, duplicates and unknown keys", () => {
  refused({ ...ENTRY, rules: ["syntax-error"] }, /syntax-error is never waived/);
  refused({ ...ENTRY, rules: [] }, /rules must be a non-empty array/);
  refused({ ...ENTRY, rules: ["ban-drop-table", "ban-drop-table"] }, /a rule is listed twice/);
  refused({ ...ENTRY, rules: ["Ban Drop"] }, /is not a Squawk rule id/);
  refused({ ...ENTRY, sha256: "ABC" }, /sha256 must be 64 lowercase hex digits/);
  refused({ ...ENTRY, reason: "" }, /reason must be one non-empty line/);
  refused({ ...ENTRY, lines: [1] }, /unknown key\(s\) lines/);
  assert.throws(() => parseBaseline({ entries: [ENTRY, ENTRY] }), /is listed twice/);
  assert.throws(() => parseBaseline({}), /"entries" array/);
});

test("reads Squawk's JSON reports, 1-based lines and `./` dropped; anything else fails", () => {
  const text = JSON.stringify([
    {
      file: `./${FILE}`,
      line: 0,
      column: 0,
      level: "Warning",
      message: "m",
      rule_name: "ban-drop-table",
    },
  ]);
  assert.deepEqual(parseReports([{ name: "t.json", text }]), [
    { file: FILE, line: 1, rule: "ban-drop-table", message: "m" },
  ]);
  assert.deepEqual(parseReports([{ name: "o.json", text: "[]" }]), []);
  assert.throws(
    () =>
      parseReports([{ name: "t.json", text: 'Failed to find files for provided patterns: ["x"]' }]),
    /not Squawk's JSON report/,
  );
  assert.throws(() => parseReports([{ name: "t.json", text: "{}" }]), /expected an array/);
  assert.throws(
    () => parseReports([{ name: "t.json", text: "[{}]" }]),
    /no file, line or rule_name/,
  );
  assert.equal(normalizePath("././a/b.sql"), "a/b.sql");
});

test("reads the baseline as JSONC: comments outside strings, a `//` inside one kept, a trailing comma dropped", () => {
  assert.deepEqual(
    parseJsonc('// head\n{ /* a */ "entries": [], "note": "a // b /* c */" } // tail\n'),
    { entries: [], note: "a // b /* c */" },
  );
  assert.deepEqual(parseJsonc('{ "q": "say \\"hi\\" // x" }'), { q: 'say "hi" // x' });
  assert.deepEqual(parseJsonc('{ "entries": [1, 2, /* x */ ], // y\n }'), { entries: [1, 2] });
  assert.deepEqual(parseJsonc('["a,]", "b"]'), ["a,]", "b"]);
  assert.throws(() => parseJsonc('{ "a": 1 "b": 2 }'), SyntaxError);
  assert.throws(() => parseJsonc("/* open"), /unterminated block comment/);
});

test("parseArgs needs --baseline and refuses a flag without its value", () => {
  assert.deepEqual(parseArgs(["--baseline", "b.json", "t.json", "o.json"]), {
    baseline: "b.json",
    base: undefined,
    root: ".",
    reports: ["t.json", "o.json"],
  });
  assert.throws(() => parseArgs(["t.json"]), /usage/);
  assert.throws(() => parseArgs(["--baseline"]), /usage/);
  assert.throws(() => parseArgs(["--baseline", "b.json", "--base"]), /usage/);
  assert.throws(() => parseArgs(["--baseline", "b.json", "--strict"]), /usage/);
});

test("main exits 0 on a clean tree, 1 on a problem, 2 on a broken input", () => {
  const dir = mkdtempSync(join(tmpdir(), "squawk-baseline-"));
  try {
    const write = (name, content) => {
      const path = join(dir, name);
      writeFileSync(path, content);
      return path;
    };
    const listed = "a_0001_drop.up.sql";
    write(listed, BYTES);
    const baseline = write(
      "baseline.json",
      JSON.stringify({ entries: [{ ...ENTRY, path: listed, rules: ["ban-drop-table"] }] }),
    );
    const report = (findings) =>
      write(
        "report.json",
        JSON.stringify(
          findings.map(([file, rule]) => ({ file, line: 0, message: "m", rule_name: rule })),
        ),
      );
    const run = (args) => {
      const out = sink();
      const err = sink();
      return { code: main(args, { out, err }), out: out.text(), err: err.text() };
    };
    const clean = run([
      "--baseline",
      baseline,
      "--root",
      dir,
      report([[listed, "ban-drop-table"]]),
    ]);
    assert.equal(clean.code, 0, clean.err);
    assert.match(clean.out, /1 finding\(s\), 1 waived by 1 pinned file\(s\), 0 problem\(s\)/);
    const added = run([
      "--baseline",
      baseline,
      "--root",
      dir,
      report([
        [listed, "ban-drop-table"],
        ["b_0001_new.up.sql", "require-concurrent-index-creation"],
      ]),
    ]);
    assert.equal(added.code, 1);
    assert.match(
      added.out,
      /::error file=b_0001_new\.up\.sql,line=1,title=Squawk require-concurrent-index-creation::m/,
    );
    write(listed, Buffer.concat([BYTES, Buffer.from("-- edited\n")]));
    const edited = run([
      "--baseline",
      baseline,
      "--root",
      dir,
      report([[listed, "ban-drop-table"]]),
    ]);
    assert.equal(edited.code, 1);
    assert.match(edited.err, /SHA-256 is/);
    const broken = run([
      "--baseline",
      baseline,
      "--root",
      dir,
      write("bad.json", "Failed to find files"),
    ]);
    assert.equal(broken.code, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
