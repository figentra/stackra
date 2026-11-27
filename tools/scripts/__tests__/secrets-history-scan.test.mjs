/**
 * Stackra file contract:
 * Purpose: hold `secrets-history-scan.mjs` to its contract (STA-2878): the scan covers every ref (branches, tags and
 *          pull request refs, not only HEAD), splits policy findings from allowlisted ones, tells a placeholder from a
 *          credential, and never prints a matched value, refusing instead when one would reach the report; `branches`
 *          classifies merged, squash-merged, snapshot and open branches and never offers a protected one; `archive`
 *          writes verified bundles and deletion commands and changes no ref.
 * Boundary: throwaway git repositories under the OS temp folder; a fake `gitleaks` on PATH for the field and guard
 *           tests, and the real pinned gitleaks for the every-ref test when it is installed (skipped otherwise).
 *           Every planted value is random and made at run time, so this file holds none.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0009; ADR 0267; STA-2878.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PROTECTED_BRANCHES,
  Refusal,
  USAGE,
  archivable,
  assertValueFree,
  candidateOf,
  classifyMatch,
  main,
  parseArgs,
  slugOf,
} from "../secrets-history-scan.mjs";

const script = new URL("../secrets-history-scan.mjs", import.meta.url).pathname;
const hex = (n) => randomBytes(n).toString("hex");
/**
 * A credential-shaped value: random, mixed case and digits, made at run time. Letters and digits alternate, so no two
 * letters touch and no word can form: a gitleaks stopword would silence its generic rule, and a placeholder word
 * ("test", "fake") would turn `classifyMatch` to "placeholder", either of which made the tests flaky.
 */
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const credential = () =>
  [...randomBytes(42)]
    .map((b, i) => (i % 2 === 0 ? LETTERS[b % LETTERS.length] : String(b % 10)))
    .join("");

/** PEM armor, built at run time so this file carries no key-shaped text for the repository's own scan. */
const armor = (edge) => `-----${edge} PRIVATE ${"KEY"}-----`;

const tmp = (prefix) => mkdtempSync(join(tmpdir(), `history-scan-${prefix}-`));

function sh(cwd, ...args) {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "test",
      GIT_COMMITTER_EMAIL: "test@example.com",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
    },
  });
  assert.equal(r.status, 0, `git ${args[0]} failed: ${r.stderr}`);
  return r.stdout.trim();
}

function commitFile(dir, path, content, message) {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), content);
  sh(dir, "add", "--", path);
  sh(dir, "commit", "-q", "--no-verify", "-m", message);
  return sh(dir, "rev-parse", "HEAD");
}

/**
 * A repository with a clean main, a branch that adds a credential, a fixture canary only a PR ref carries, and a tag.
 * Returns the paths, commits and planted values.
 */
function leakyRepo() {
  const dir = tmp("repo");
  sh(dir, "init", "-q", "-b", "main");
  commitFile(dir, "README.md", "# demo\n", "chore: start");
  const secret = credential();
  const canary = `turbo-token-value-that-must-never-leak-${Date.now()}`;
  sh(dir, "checkout", "-q", "-b", "feature/leak");
  const leakCommit = commitFile(
    dir,
    "src/config.ts",
    `export const apiKey = "${secret}";\n`,
    "feat: config",
  );
  sh(dir, "tag", "v-leak");
  sh(dir, "checkout", "-q", "main");
  sh(dir, "checkout", "-q", "-b", "tmp-pr");
  const canaryCommit = commitFile(
    dir,
    "tools/__fixtures__/fake-host.mjs",
    `const TURBO_TOKEN = "${canary}";\n`,
    "test: fixture",
  );
  sh(dir, "update-ref", "refs/pull/7/head", canaryCommit);
  sh(dir, "checkout", "-q", "main");
  sh(dir, "branch", "-q", "-D", "tmp-pr");
  return { dir, secret, canary, leakCommit, canaryCommit };
}

/**
 * A fake gitleaks on PATH. `findings(mode)` returns gitleaks JSON for the "policy" or "raw" pass; each scan runs the
 * policy pass and then the raw pass, so odd calls are "policy" and even calls "raw". The raw pass must use the
 * script's generated default-rules file and `--ignore-gitleaks-allow`, and the policy pass must not ignore inline
 * allow comments; anything else exits 9. It puts the planted values into Secret and Match, unredacted, so a test
 * proves the script's own field list keeps them out.
 */
function fakeGitleaks(findings) {
  const bin = tmp("bin");
  const data = join(bin, "findings.json");
  writeFileSync(data, JSON.stringify(findings));
  const exe = join(bin, "gitleaks");
  writeFileSync(
    exe,
    `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "version") { console.log("v8.30.1"); process.exit(0); }
const at = (flag) => args[args.indexOf(flag) + 1];
if (!args.includes("--log-opts=--all")) { console.error("fake: scan without --all"); process.exit(9); }
if (!args.includes("--redact=100")) { console.error("fake: scan without --redact"); process.exit(9); }
const calls = ${JSON.stringify(join(bin, "calls"))};
const call = (fs.existsSync(calls) ? Number(fs.readFileSync(calls, "utf8")) : 0) + 1;
fs.writeFileSync(calls, String(call));
const mode = call % 2 === 1 ? "policy" : "raw";
if (mode === "raw" && !at("--config").endsWith("default-rules.toml")) { console.error("fake: raw pass under a policy config"); process.exit(9); }
if ((mode === "raw") !== args.includes("--ignore-gitleaks-allow")) { console.error("fake: " + mode + " pass with the wrong inline-allow flag"); process.exit(9); }
fs.writeFileSync(at("--report-path"), JSON.stringify(JSON.parse(fs.readFileSync(${JSON.stringify(data)}, "utf8"))[mode]));
`,
  );
  chmodSync(exe, 0o755);
  return exe;
}

const finding = (commit, file, line, rule, secret, match, cols) => ({
  Commit: commit,
  File: file,
  StartLine: line,
  EndLine: line,
  StartColumn: cols[0],
  EndColumn: cols[1],
  RuleID: rule,
  Entropy: 4.4,
  Secret: secret,
  Match: match,
  Author: "test",
  Email: "test@example.com",
  Link: "https://example.invalid/leak",
});

function capture(argv) {
  const out = [];
  const err = [];
  const code = main(argv, { out: (s) => out.push(s), err: (s) => err.push(s) });
  return { code, out: out.join(""), err: err.join("") };
}

test("parseArgs refuses a bad command line without echoing what it was given", () => {
  const value = `v-${hex(8)}`;
  assert.throws(
    () => parseArgs(["delete", "--repo", "x"]),
    (e) => e instanceof Refusal && e.message === USAGE,
  );
  assert.throws(() => parseArgs(["scan"]), /--repo is required/);
  assert.throws(() => parseArgs(["scan", "--repo"]), /--repo needs a value/);
  assert.throws(() => parseArgs(["archive", "--repo", "r"]), /archive needs --branches and --dir/);
  assert.throws(
    () => parseArgs(["scan", "--repo", "r", value]),
    (e) => e instanceof Refusal && !e.message.includes(value),
  );
  assert.deepEqual(parseArgs(["scan", "--repo", "/x/core.git", "--fail-on-findings"]).opts, {
    base: "main",
    remote: "origin",
    repo: "/x/core.git",
    failOnFindings: true,
    name: "core",
  });
});

test("classifyMatch tells a placeholder from a credential by the value, not the key name", () => {
  assert.equal(
    classifyMatch(`TURBO_TOKEN = "turbo-token-value-that-must-never-leak-${Date.now()}"`),
    "placeholder",
  );
  assert.equal(classifyMatch(`key = "${"a".repeat(32)}"`), "placeholder");
  assert.equal(classifyMatch(`test_api_key = "${credential()}"`), "review");
  assert.equal(classifyMatch(`api_key = "${credential()}"`), "review");
  const pem = [armor("BEGIN"), credential() + credential(), armor("END")].join("\n");
  assert.equal(classifyMatch(pem), "review", "PEM armor is not the value");
  // a short fake key body under armor longer than it: the armor must not be taken for the value
  const fakePem = [armor("BEGIN"), "fakekey1", armor("END")].join("\n");
  assert.equal(candidateOf(fakePem), "fakekey1");
  assert.equal(
    classifyMatch(fakePem),
    "placeholder",
    "a fake key under PEM armor is a placeholder",
  );
});

test("assertValueFree refuses output that carries a matched value", () => {
  const value = credential();
  assert.equal(assertValueFree("clean report", [value]), "clean report");
  assert.throws(
    () => assertValueFree(`row ${value} row`, [value]),
    (e) => e instanceof Refusal && !e.message.includes(value),
  );
});

test("scan reports every ref that carries a finding, splits policy from allowlisted, and prints no value", () => {
  const repo = leakyRepo();
  const leak = finding(
    repo.leakCommit,
    "src/config.ts",
    1,
    "generic-api-key",
    repo.secret,
    `apiKey = "${repo.secret}"`,
    [14, 23 + repo.secret.length],
  );
  const fixture = finding(
    repo.canaryCommit,
    "tools/__fixtures__/fake-host.mjs",
    1,
    "generic-api-key",
    repo.canary,
    `TURBO_TOKEN = "${repo.canary}"`,
    [7, 22 + repo.canary.length],
  );
  const gitleaks = fakeGitleaks({ policy: [leak], raw: [leak, fixture] });
  const json = join(tmp("out"), "scan.json");
  const r = capture([
    "scan",
    "--repo",
    repo.dir,
    "--name",
    "demo",
    "--gitleaks",
    gitleaks,
    "--config",
    join(repo.dir, "README.md"),
    "--json",
    json,
  ]);
  assert.equal(r.code, 0, r.err);
  for (const text of [r.out, readFileSync(json, "utf8")]) {
    assert.ok(!text.includes(repo.secret), "the credential never reaches the report");
    assert.ok(!text.includes(repo.canary), "the fixture canary never reaches the report");
    assert.ok(
      !text.includes("example.invalid") && !text.includes("test@example.com"),
      "link and author are dropped",
    );
  }
  assert.match(r.out, /### demo/);
  assert.match(r.out, /Findings under the repository's policy .*: \*\*1\*\*/);
  assert.match(
    r.out,
    /Findings with gitleaks' default rules, no allowlist and no inline `gitleaks:allow`: \*\*2\*\*/,
  );
  assert.match(r.out, /Findings that look like a credential and need a person to look: \*\*1\*\*/);
  const leakRow = r.out.split("\n").find((l) => l.startsWith("| `src/config.ts`"));
  assert.match(
    leakRow,
    new RegExp(
      `\`${repo.leakCommit.slice(0, 12)}\` \\| generic-api-key \\| reported \\| review \\| no \\| \`feature/leak\` \\| \`v-leak\` \\| — \\|`,
    ),
  );
  const fixtureRow = r.out
    .split("\n")
    .find((l) => l.startsWith("| `tools/__fixtures__/fake-host.mjs`"));
  assert.match(fixtureRow, /\| allowlisted \| placeholder \| no \| — \| — \| #7 \|/);
  const data = JSON.parse(readFileSync(json, "utf8"));
  assert.deepEqual(Object.keys(data.findings[0]).sort(), [
    "commit",
    "entropy",
    "file",
    "fingerprint",
    "kind",
    "line",
    "onBase",
    "policy",
    "refs",
    "rule",
  ]);
  assert.deepEqual(data.inventory, { heads: 2, tags: 1, pulls: 1, other: 0, commits: 3 });

  const strict = capture([
    "scan",
    "--repo",
    repo.dir,
    "--gitleaks",
    gitleaks,
    "--config",
    join(repo.dir, "README.md"),
    "--fail-on-findings",
  ]);
  assert.equal(strict.code, 2, "a policy finding fails the scan under --fail-on-findings");
});

test("scan refuses, printing nothing, when a matched value would reach the report", () => {
  const dir = tmp("named");
  sh(dir, "init", "-q", "-b", "main");
  const secret = credential();
  // a value that is also part of a file name: the file column would carry it
  const file = `keys/${secret}.env`;
  const commit = commitFile(dir, file, `API_KEY="${secret}"\n`, "chore: oops");
  const gitleaks = fakeGitleaks({
    policy: [],
    raw: [
      finding(commit, file, 1, "generic-api-key", "REDACTED", "REDACTED", [1, 10 + secret.length]),
    ],
  });
  const r = capture(["scan", "--repo", dir, "--gitleaks", gitleaks]);
  assert.equal(r.code, 1);
  assert.equal(r.out, "");
  assert.match(r.err, /refusing to print: a matched value reached the report/);
  assert.ok(!r.err.includes(secret));
});

const realGitleaks = spawnSync("gitleaks", ["version"]).status === 0;

test(
  "scan with the real gitleaks finds a credential that only a pull request ref carries",
  { skip: !realGitleaks && "gitleaks is not installed" },
  () => {
    const dir = tmp("real");
    sh(dir, "init", "-q", "-b", "main");
    commitFile(dir, "README.md", "# demo\n", "chore: start");
    sh(dir, "checkout", "-q", "-b", "side/gone");
    const secret = credential();
    const commit = commitFile(dir, "src/settings.py", `api_key = "${secret}"\n`, "feat: settings");
    // the branch is deleted, as on GitHub after a merge; only the pull request's ref keeps the commit public
    sh(dir, "update-ref", "refs/pull/41/head", commit);
    sh(dir, "checkout", "-q", "main");
    sh(dir, "branch", "-q", "-D", "side/gone");
    const r = capture(["scan", "--repo", dir, "--name", "real"]);
    assert.equal(r.code, 0, r.err);
    assert.ok(!r.out.includes(secret));
    const row = r.out.split("\n").find((l) => l.startsWith("| `src/settings.py`"));
    assert.ok(row, "a commit only a pull request ref carries is scanned");
    assert.match(
      row,
      new RegExp(
        `\`${commit.slice(0, 12)}\` \\| generic-api-key \\| reported \\| review \\| no \\| — \\| — \\| #41 \\|`,
      ),
    );
  },
);

test(
  "scan with the real gitleaks lists a credential marked gitleaks:allow on a pull request ref as allowlisted",
  { skip: !realGitleaks && "gitleaks is not installed" },
  () => {
    const dir = tmp("inline");
    sh(dir, "init", "-q", "-b", "main");
    commitFile(dir, "README.md", "# demo\n", "chore: start");
    sh(dir, "checkout", "-q", "-b", "side/allowed");
    const secret = credential();
    // the marker is built at run time so this file holds no inline-allow line of its own
    const marker = ["gitleaks", "allow"].join(":");
    const commit = commitFile(
      dir,
      "src/client.ts",
      `export const apiKey = "${secret}"; // ${marker}\n`,
      "feat: client",
    );
    sh(dir, "update-ref", "refs/pull/52/head", commit);
    sh(dir, "checkout", "-q", "main");
    sh(dir, "branch", "-q", "-D", "side/allowed");
    const r = capture(["scan", "--repo", dir, "--name", "inline"]);
    assert.equal(r.code, 0, r.err);
    assert.ok(!r.out.includes(secret));
    assert.match(r.out, /Findings under the repository's policy .*: \*\*0\*\*/);
    const row = r.out.split("\n").find((l) => l.startsWith("| `src/client.ts`"));
    assert.ok(row, "an inline-allowed credential is still listed by the raw pass");
    assert.match(
      row,
      new RegExp(
        `\`${commit.slice(0, 12)}\` \\| generic-api-key \\| allowlisted \\| review \\| no \\| — \\| — \\| #52 \\|`,
      ),
    );
  },
);

/** main, a fast-forward-merged branch, a squash-merged branch, a snapshot, open work and a protected branch. */
function branchyRepo() {
  const dir = tmp("branches");
  sh(dir, "init", "-q", "-b", "main");
  commitFile(dir, "a.txt", "a\n", "chore: a");
  sh(dir, "checkout", "-q", "-b", "feat/merged");
  commitFile(dir, "b.txt", "b\n", "feat: b");
  sh(dir, "checkout", "-q", "main");
  sh(dir, "merge", "-q", "--ff-only", "feat/merged");
  sh(dir, "checkout", "-q", "-b", "feat/squashed");
  commitFile(dir, "c.txt", "c1\n", "feat: c1");
  commitFile(dir, "c.txt", "c2\n", "feat: c2");
  sh(dir, "checkout", "-q", "main");
  commitFile(dir, "c.txt", "c2\n", "feat: c (#12)");
  sh(dir, "checkout", "-q", "-b", "save/wt-demo-2026-11-25");
  commitFile(dir, "d.txt", "d\n", "wip: d");
  sh(dir, "checkout", "-q", "main");
  sh(dir, "checkout", "-q", "-b", "feat/open");
  commitFile(dir, "e.txt", "e\n", "feat: e");
  sh(dir, "checkout", "-q", "main");
  // squash-merged by a pull request, after which main changed the same file: it no longer merges cleanly
  sh(dir, "checkout", "-q", "-b", "feat/pr-merged");
  const prMergedTip = commitFile(dir, "f.txt", "f1\n", "feat: f");
  sh(dir, "checkout", "-q", "main");
  commitFile(dir, "f.txt", "f1\n", "feat: f (#20)");
  commitFile(dir, "f.txt", "f2\n", "fix: f");
  sh(dir, "checkout", "-q", "-b", "feat/abandoned");
  const abandonedTip = commitFile(dir, "g.txt", "g\n", "feat: g");
  sh(dir, "checkout", "-q", "main");
  sh(dir, "branch", "-q", "staging");
  return { dir, prMergedTip, abandonedTip };
}

test("branches classifies merged, squash-merged, snapshot and open branches and never lists a protected one", () => {
  const { dir, prMergedTip, abandonedTip } = branchyRepo();
  const prs = join(tmp("prs"), "prs.json");
  writeFileSync(
    prs,
    JSON.stringify([
      { number: 12, state: "MERGED", headRefName: "feat/squashed", headRefOid: "0".repeat(40) },
      { number: 3, state: "CLOSED", headRefName: "feat/squashed", headRefOid: "1".repeat(40) },
      { number: 20, state: "MERGED", headRefName: "feat/pr-merged", headRefOid: prMergedTip },
      { number: 21, state: "CLOSED", headRefName: "feat/abandoned", headRefOid: abandonedTip },
      { number: 22, state: "MERGED", headRefName: "feat/open", headRefOid: "2".repeat(40) },
    ]),
  );
  const json = join(tmp("out"), "branches.json");
  const archiveList = join(tmp("out"), "archive.txt");
  const r = capture([
    "branches",
    "--repo",
    dir,
    "--name",
    "demo",
    "--prs",
    prs,
    "--json",
    json,
    "--archive-list",
    archiveList,
  ]);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(readFileSync(archiveList, "utf8").trim().split("\n").sort(), [
    "feat/merged",
    "feat/pr-merged",
    "feat/squashed",
    "save/wt-demo-2026-11-25",
  ]);
  const rows = Object.fromEntries(
    JSON.parse(readFileSync(json, "utf8")).branches.map((b) => [b.branch, b]),
  );
  assert.equal(rows["feat/merged"].class, "merged");
  assert.equal(rows["feat/squashed"].class, "content in base");
  assert.deepEqual(rows["feat/squashed"].pr, { number: 12, state: "MERGED", atTip: false });
  assert.equal(
    rows["feat/pr-merged"].class,
    "PR merged",
    "the merged pull request's head is the tip",
  );
  assert.equal(rows["feat/abandoned"].class, "PR closed");
  assert.equal(
    archivable(rows["feat/abandoned"]),
    false,
    "closed unmerged work is the owner's call, never listed",
  );
  assert.equal(
    rows["feat/open"].class,
    "open",
    "a merged PR at an earlier head does not make new commits merged",
  );
  assert.equal(rows["save/wt-demo-2026-11-25"].class, "snapshot");
  assert.equal(rows["feat/open"].class, "open");
  assert.equal(rows.staging.class, "merged");
  assert.equal(rows.staging.protected, true);
  assert.equal(archivable(rows.staging), false);
  assert.equal(archivable(rows["feat/open"]), false);
  assert.match(
    r.out,
    /^7 branches besides `main` \(merged: 2, content in base: 1, PR merged: 1, snapshot: 1, PR closed: 1, open: 1\)\. \*\*4\*\* go on the archive list\.$/m,
  );
  const [listedPart, keptList] = r.out.split("Kept, unmerged work");
  assert.match(
    listedPart,
    /\| `feat\/squashed` \| `[0-9a-f]{12}` \| \d{4}-\d\d-\d\d \| content in base \| #12 merged, earlier head \|/,
  );
  assert.match(
    listedPart,
    /\| `feat\/pr-merged` \| `[0-9a-f]{12}` \| [-\d]+ \| PR merged \| #20 merged \|/,
  );
  assert.ok(!listedPart.includes("`feat/abandoned`") && !listedPart.includes("`feat/open`"));
  assert.match(keptList, /^ \(2\);/);
  assert.match(
    keptList,
    /\| `feat\/abandoned` \| `[0-9a-f]{12}` \| [-\d]+ \| PR closed \| #21 closed \|/,
  );
  assert.ok(!r.out.includes("| `staging`"), "a protected branch is never on a list");
  assert.match(r.out, /Never listed \(protected or kept on purpose\): `staging`\./);

  const kept = capture(["branches", "--repo", dir, "--prs", prs, "--keep", "^save/"]);
  assert.equal(kept.code, 0, kept.err);
  assert.match(kept.out, /\*\*3\*\* go on the archive list/);
  assert.match(
    kept.out,
    /Never listed \(protected or kept on purpose\): `save\/wt-demo-2026-11-25`, `staging`\./,
  );
  assert.equal(
    capture(["branches", "--repo", dir, "--keep", "("]).code,
    1,
    "a bad --keep pattern is refused",
  );
});

test("archive writes one verified bundle per branch and the deletion commands, and changes no ref", () => {
  const { dir } = branchyRepo();
  const before = sh(dir, "for-each-ref", "--format=%(refname) %(objectname)");
  const out = join(tmp("archive"), "bundles");
  const list = join(tmp("list"), "branches.txt");
  writeFileSync(list, "# merged\nfeat/merged\nsave/wt-demo-2026-11-25  # snapshot\n\n");
  const r = capture(["archive", "--repo", dir, "--branches", list, "--dir", out]);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /archived 2 branch\(es\) as verified bundles .*; nothing was deleted/);
  assert.equal(
    sh(dir, "for-each-ref", "--format=%(refname) %(objectname)"),
    before,
    "no ref changed",
  );
  const manifest = readFileSync(join(out, "manifest.tsv"), "utf8").trim().split("\n");
  assert.equal(manifest[0], "branch\ttip\tbundle\tsha256");
  for (const [branch, line] of [
    ["feat/merged", manifest[1]],
    ["save/wt-demo-2026-11-25", manifest[2]],
  ]) {
    const [name, tip, bundle, sha] = line.split("\t");
    assert.equal(name, branch);
    assert.equal(bundle, `${slugOf(branch)}.bundle`);
    assert.match(sha, /^[0-9a-f]{64}$/);
    const clone = join(tmp("restore"), "r");
    sh(tmpdir(), "clone", "-q", "--bare", join(out, bundle), clone);
    assert.equal(
      sh(clone, "rev-parse", `refs/heads/${branch}`),
      tip,
      "the bundle restores the branch tip",
    );
  }
  const deletes = readFileSync(join(out, "delete-after-review.sh"), "utf8");
  assert.match(
    deletes,
    /^git push origin --force-with-lease=refs\/heads\/feat\/merged:[0-9a-f]{40} --delete refs\/heads\/feat\/merged$/m,
  );
  assert.equal(deletes.match(/^git push /gm).length, 2);
});

test("the deletion commands delete only a branch still at its archived tip", () => {
  const { dir } = branchyRepo();
  const remote = join(tmp("remote"), "origin.git");
  sh(tmpdir(), "clone", "-q", "--bare", dir, remote);
  sh(dir, "remote", "add", "origin", remote);
  const out = join(tmp("archive"), "bundles");
  const list = join(tmp("list"), "branches.txt");
  writeFileSync(list, "feat/merged\nsave/wt-demo-2026-11-25\n");
  assert.equal(capture(["archive", "--repo", dir, "--branches", list, "--dir", out]).code, 0);
  // the snapshot moves on the remote after the archive: its lease no longer holds
  const work = join(tmp("work"), "w");
  sh(tmpdir(), "clone", "-q", "-b", "save/wt-demo-2026-11-25", remote, work);
  commitFile(work, "late.txt", "late\n", "wip: late");
  sh(work, "push", "-q", "origin", "save/wt-demo-2026-11-25");
  const run = spawnSync("bash", [join(out, "delete-after-review.sh")], {
    cwd: dir,
    encoding: "utf8",
  });
  assert.notEqual(run.status, 0, "the script stops at the branch that moved");
  const left = sh(remote, "for-each-ref", "--format=%(refname:lstrip=2)", "refs/heads").split("\n");
  assert.ok(!left.includes("feat/merged"), "the unchanged branch is deleted");
  assert.ok(left.includes("save/wt-demo-2026-11-25"), "the moved branch is kept");
  assert.ok(left.includes("main") && left.includes("staging"));
});

test("archive refuses a protected branch or a name that is not a plain ref", () => {
  const { dir } = branchyRepo();
  const out = join(tmp("archive"), "bundles");
  for (const bad of ["staging", "main", "../etc", "feat/$(x)"]) {
    const list = join(tmp("list"), "branches.txt");
    writeFileSync(list, `${bad}\n`);
    const r = capture(["archive", "--repo", dir, "--branches", list, "--dir", out]);
    assert.equal(r.code, 1, bad);
    assert.match(r.err, /protected branch|not a plain ref name/);
  }
  assert.ok(!existsSync(join(out, "manifest.tsv")), "nothing is written after a refusal");
  assert.ok(PROTECTED_BRANCHES.has("encore"));
});

test("the script runs as a command and prints usage on a bad command", () => {
  const r = spawnSync(process.execPath, [script, "nope"], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /usage: secrets-history-scan\.mjs scan/);
});
