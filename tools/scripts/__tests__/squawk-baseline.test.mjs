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
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  baselineAt,
  judge,
  main,
  normalizePath,
  parseArgs,
  parseBaseline,
  parseJsonc,
  parseReports,
  resolveBase,
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
    baseRef: undefined,
    root: ".",
    reports: ["t.json", "o.json"],
  });
  assert.throws(() => parseArgs(["t.json"]), /usage/);
  assert.throws(() => parseArgs(["--baseline"]), /usage/);
  assert.throws(() => parseArgs(["--baseline", "b.json", "--base-ref"]), /usage/);
  assert.throws(() => parseArgs(["--baseline", "b.json", "--base", "x.json"]), /usage/);
  assert.throws(() => parseArgs(["--baseline", "b.json", "--strict"]), /usage/);
});

/**
 * A temporary git repository on `main` holding one listed file, its report and, unless `list` is false, a baseline that
 * waives `ban-drop-table` there; with `run` (the gate over the repository) and `git`, `write`, `commit` helpers.
 */
function gitRepo({ list = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "squawk-baseline-"));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const write = (name, content) => {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), content);
  };
  const commit = (message) => {
    git("add", "--all");
    git("-c", "user.name=t", "-c", "user.email=t@t.invalid", "commit", "--quiet", "-m", message);
    return git("rev-parse", "HEAD");
  };
  const entry = (path, rules) => ({ ...ENTRY, path, sha256: sha256(BYTES), rules });
  const writeList = (entries) =>
    write(LIST, `// the baseline\n${JSON.stringify({ entries }, undefined, 2)}\n`);
  const report = (findings) =>
    write(
      "report.json",
      JSON.stringify(
        findings.map(([file, rule]) => ({ file, line: 0, message: "m", rule_name: rule })),
      ),
    );
  git("init", "--quiet", "--initial-branch=main");
  write("a_0001_drop.up.sql", BYTES);
  write("b_0001_drop.up.sql", BYTES);
  if (list) writeList([entry("a_0001_drop.up.sql", ["ban-drop-table"])]);
  report([["a_0001_drop.up.sql", "ban-drop-table"]]);
  commit("main");
  const run = (extra = []) => {
    const out = sink();
    const err = sink();
    const code = main(
      ["--baseline", join(dir, LIST), "--root", dir, ...extra, join(dir, "report.json")],
      { out, err },
    );
    return { code, out: out.text(), err: err.text() };
  };
  return { dir, git, write, commit, entry, writeList, report, run };
}

/** Where the test repositories keep their baseline. */
const LIST = "tools/scripts/squawk-baseline.jsonc";

test("main exits 0 on a clean tree, 1 on a problem, 2 on a broken input", () => {
  const repo = gitRepo();
  try {
    const clean = repo.run();
    assert.equal(clean.code, 0, clean.err);
    assert.match(clean.out, /1 finding\(s\), 1 waived by 1 pinned file\(s\), 0 problem\(s\)/);
    repo.report([
      ["a_0001_drop.up.sql", "ban-drop-table"],
      ["c_0001_new.up.sql", "require-concurrent-index-creation"],
    ]);
    const added = repo.run();
    assert.equal(added.code, 1);
    assert.match(
      added.out,
      /::error file=c_0001_new\.up\.sql,line=1,title=Squawk require-concurrent-index-creation::m/,
    );
    repo.report([["a_0001_drop.up.sql", "ban-drop-table"]]);
    repo.write("a_0001_drop.up.sql", Buffer.concat([BYTES, Buffer.from("-- edited\n")]));
    const edited = repo.run();
    assert.equal(edited.code, 1);
    assert.match(edited.err, /SHA-256 is/);
    repo.write("report.json", "Failed to find files");
    assert.equal(repo.run().code, 2);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("a list grown in a branch's first commit still fails after a second commit touches something else", () => {
  const repo = gitRepo();
  try {
    repo.git("switch", "--quiet", "-c", "feature");
    repo.writeList([
      repo.entry("a_0001_drop.up.sql", ["ban-drop-table"]),
      repo.entry("b_0001_drop.up.sql", ["ban-drop-table"]),
    ]);
    repo.report([
      ["a_0001_drop.up.sql", "ban-drop-table"],
      ["b_0001_drop.up.sql", "ban-drop-table"],
    ]);
    repo.commit("grow the list");
    repo.write("notes.txt", "something else\n");
    repo.commit("touch something else");
    // HEAD~1 holds the grown list; the merge base with main does not.
    const result = repo.run();
    assert.equal(result.code, 1, result.err);
    assert.match(
      result.err,
      /b_0001_drop\.up\.sql: not in the base revision's baseline; the baseline only shrinks/,
    );
    // The pull request's base SHA, as CI passes it, finds the same merge base.
    const mainTip = repo.git("rev-parse", "main");
    assert.equal(repo.run(["--base-ref", mainTip]).code, 1);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("a merge commit whose first parent is not main compares with the merge base", () => {
  const repo = gitRepo();
  try {
    repo.git("switch", "--quiet", "-c", "side");
    repo.writeList([
      repo.entry("a_0001_drop.up.sql", ["ban-drop-table"]),
      repo.entry("b_0001_drop.up.sql", ["ban-drop-table"]),
    ]);
    repo.report([
      ["a_0001_drop.up.sql", "ban-drop-table"],
      ["b_0001_drop.up.sql", "ban-drop-table"],
    ]);
    repo.commit("grow the list on side");
    repo.git("switch", "--quiet", "main");
    repo.write("main.txt", "main moves on\n");
    const tip = repo.commit("main moves on");
    repo.git("switch", "--quiet", "side");
    repo.git(
      "-c",
      "user.name=t",
      "-c",
      "user.email=t@t.invalid",
      "merge",
      "--quiet",
      "--no-edit",
      "main",
    );
    assert.notEqual(repo.git("rev-parse", "HEAD~1"), tip);
    assert.deepEqual(resolveBase(repo.dir, undefined), { commit: tip, target: "main" });
    const result = repo.run();
    assert.equal(result.code, 1);
    assert.match(result.err, /b_0001_drop\.up\.sql: not in the base revision's baseline/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("a shrink passes: an entry dropped with its finding fixed", () => {
  const repo = gitRepo();
  try {
    repo.git("switch", "--quiet", "-c", "fix");
    repo.writeList([]);
    repo.report([]);
    repo.commit("a forward migration fixes the finding");
    const result = repo.run();
    assert.equal(result.code, 0, result.err);
    assert.equal(baselineAt(repo.dir, repo.git("rev-parse", "main"), LIST)?.length, 1);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("an unresolvable base fails the step, never skips it", () => {
  const repo = gitRepo();
  try {
    const bogus = repo.run(["--base-ref", "0000000000000000000000000000000000000000"]);
    assert.equal(bogus.code, 2);
    assert.match(bogus.out, /::error title=Squawk baseline::no merge base of HEAD and 0{40}/);
    repo.git("branch", "--quiet", "-m", "main", "trunk");
    const none = repo.run();
    assert.equal(none.code, 2);
    assert.match(
      none.out,
      /::error title=Squawk baseline::no merge base of HEAD and origin\/main or main/,
    );
    assert.equal(resolveBase(repo.dir, undefined), undefined);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("bootstrap: a base without the list skips only the shrink comparison, with a notice", () => {
  const repo = gitRepo({ list: false });
  try {
    repo.git("switch", "--quiet", "-c", "add-list");
    repo.writeList([repo.entry("a_0001_drop.up.sql", ["ban-drop-table"])]);
    repo.commit("add the list");
    assert.equal(baselineAt(repo.dir, repo.git("rev-parse", "main"), LIST), undefined);
    const clean = repo.run();
    assert.equal(clean.code, 0, clean.err);
    assert.match(
      clean.out,
      /::notice title=Squawk baseline::the base revision [0-9a-f]{12} \(merge base with main\) has no tools\/scripts\/squawk-baseline\.jsonc: the shrink comparison is skipped/,
    );
    // Every other check still runs: an unlisted finding fails.
    repo.report([
      ["a_0001_drop.up.sql", "ban-drop-table"],
      ["b_0001_drop.up.sql", "ban-drop-table"],
    ]);
    const unlisted = repo.run();
    assert.equal(unlisted.code, 1);
    assert.match(unlisted.out, /::notice title=Squawk baseline::/);
    assert.match(unlisted.err, /b_0001_drop\.up\.sql:1: ban-drop-table: m/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("a list the base has and HEAD deleted fails the step, never a bootstrap", () => {
  const repo = gitRepo();
  try {
    repo.git("switch", "--quiet", "-c", "drop-list");
    repo.git("rm", "--quiet", LIST);
    repo.commit("delete the list");
    const result = repo.run();
    assert.equal(result.code, 1);
    assert.match(
      result.out,
      /::error title=Squawk baseline::tools\/scripts\/squawk-baseline\.jsonc is missing at HEAD but the base revision [0-9a-f]{12} \(merge base with main\) has it: the list was deleted, renamed or moved/,
    );
    assert.doesNotMatch(result.out, /::notice/);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("a list the base has and HEAD renamed fails, whichever path the step names", () => {
  const repo = gitRepo();
  try {
    repo.git("switch", "--quiet", "-c", "rename-list");
    repo.git("mv", LIST, "tools/scripts/squawk-waivers.jsonc");
    repo.commit("rename the list");
    const result = repo.run();
    assert.equal(result.code, 1);
    assert.match(result.out, /the list was deleted, renamed or moved/);
    // Pointing the step at the new name does not make it a fresh list.
    const out = sink();
    const code = main(
      [
        "--baseline",
        join(repo.dir, "tools/scripts/squawk-waivers.jsonc"),
        "--root",
        repo.dir,
        join(repo.dir, "report.json"),
      ],
      { out, err: sink() },
    );
    assert.equal(code, 2);
    assert.match(
      out.text(),
      /::error title=Squawk baseline::the list is tools\/scripts\/squawk-baseline\.jsonc, not tools\/scripts\/squawk-waivers\.jsonc/,
    );
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("neither the base nor HEAD has the list: the bootstrap notice, and nothing is waived", () => {
  const repo = gitRepo({ list: false });
  try {
    const result = repo.run();
    assert.equal(result.code, 1);
    assert.match(
      result.out,
      /::notice title=Squawk baseline::neither HEAD nor the base revision [0-9a-f]{12} \(merge base with main\) has tools\/scripts\/squawk-baseline\.jsonc: no finding is waived/,
    );
    assert.match(result.err, /a_0001_drop\.up\.sql:1: ban-drop-table: m/);
    repo.report([]);
    assert.equal(repo.run().code, 0);
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});
