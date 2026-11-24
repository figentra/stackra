/**
 * Stackra file contract:
 * Purpose: hold `stackra-verify.mjs` to its contract (STA-2761): argument parsing, which heads need a verify, the
 *          failing names read from a log, token scrubbing before a log leaves the box, and the status, comment and
 *          ledger shapes it records.
 * Boundary: pure functions only; no git, docker, gh or network.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-2761.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  commentBody,
  COMMAND,
  DEFAULT_REPO,
  failingNames,
  formatDuration,
  ledgerEntry,
  needsRun,
  parseArgs,
  redact,
  STALE_PENDING_MS,
  statusDescription,
} from "../stackra-verify.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const NOW = Date.parse("2026-11-24T15:00:00Z");
// Token-shaped fakes are built at run time, so the source holds no token-shaped literal for the secret scan.
const FAKE_INSTALLATION = `${"gh"}s_${"a".repeat(36)}`;
const KEY = (edge) => `-----${edge} RSA ${"PRIVATE"} KEY-----`;
const FAKE_PAT = `${"github"}_pat_${"B".repeat(40)}`;
const status = (state, created_at, id = 1, context = "stackra/verify") => ({
  state,
  created_at,
  id,
  context,
});

test("parseArgs: run needs a full SHA; once and daemon take several repos; bad input is a usage error", () => {
  assert.deepEqual(parseArgs(["run", "--sha", SHA, "--pr", "12"]), {
    verb: "run",
    repos: [DEFAULT_REPO],
    repo: DEFAULT_REPO,
    inPlace: false,
    interval: 300,
    sha: SHA,
    pr: "12",
  });
  assert.equal(parseArgs(["run", "--sha", SHA, "--in-place"]).inPlace, true);
  const daemon = parseArgs([
    "daemon",
    "-R",
    "figentra/stackra",
    "-R",
    "figentra/stackra-template",
    "--interval",
    "120",
  ]);
  assert.deepEqual(daemon.repos, ["figentra/stackra", "figentra/stackra-template"]);
  assert.equal(daemon.interval, 120);
  for (const bad of [
    [],
    ["deploy"],
    ["run"],
    ["run", "--sha", "abc123"],
    ["run", "--sha", SHA, "--pr", "x"],
    ["run", "--sha", SHA, "-R", "a/b", "-R", "c/d"],
    ["once", "--sha", SHA],
    ["once", "--in-place"],
    ["daemon", "--interval", "5"],
    ["once", "-R", "not a repo"],
    ["once", "--unknown"],
  ])
    assert.equal(parseArgs(bad), null, bad.join(" "));
});

test("needsRun: no verify yet, or a pending one past the stale limit, needs a run; a recorded result stands", () => {
  assert.equal(needsRun([], NOW), true);
  assert.equal(needsRun([status("success", "2026-11-24T14:00:00Z", 1, "ci/other")], NOW), true);
  for (const state of ["success", "failure", "error"])
    assert.equal(needsRun([status(state, "2026-11-01T00:00:00Z")], NOW), false, state);
  const fresh = new Date(NOW - 60_000).toISOString();
  const stale = new Date(NOW - STALE_PENDING_MS - 60_000).toISOString();
  assert.equal(needsRun([status("pending", fresh)], NOW), false);
  assert.equal(needsRun([status("pending", stale)], NOW), true);
  // the newest status counts: a pending run started after an old failure is in progress
  assert.equal(needsRun([status("failure", stale, 1), status("pending", fresh, 2)], NOW), false);
});

test("failingNames: turbo tasks, vitest files and node:test cases; else the last pnpm step", () => {
  const log = [
    "\u001b[31m Tasks:    40 successful, 42 total",
    " Failed:    @stackra/gen#test, ",
    " Failed:    @stackra/ai#typecheck",
    " FAIL  src/core/__tests__/registry.test.ts > registry > resolves",
    "✖ condition 5: refuses (1.2ms)",
  ].join("\n");
  assert.deepEqual(failingNames(log), [
    "@stackra/gen#test",
    "@stackra/ai#typecheck",
    "src/core/__tests__/registry.test.ts",
    "condition 5: refuses",
  ]);
  const formatOnly =
    "> stackra@0.0.0 verify\n> pnpm format:check && turbo run lint\n\n> oxfmt --check .\nx.ts is not formatted";
  assert.deepEqual(failingNames(formatOnly), ["oxfmt --check ."]);
  assert.deepEqual(failingNames("nothing useful"), []);
});

test("redact: token shapes, private keys and colour codes never leave the box", () => {
  const out = redact(
    `\u001b[32mok\u001b[0m token ${FAKE_INSTALLATION} and ${FAKE_PAT}\n` +
      `${KEY("BEGIN")}\nMIIEow\n${KEY("END")}`,
  );
  assert.doesNotMatch(out, /ghs_|github_pat_|MIIEow/);
  assert.ok(!out.includes(String.fromCodePoint(27)), "no ESC code point left");
  assert.match(out, /ok token \[redacted\] and \[redacted\]/);
  assert.ok(out.includes(`${KEY("BEGIN")} [redacted] ${KEY("END")}`));
});

test("statusDescription and formatDuration: verdict, time, box and names, at most 140 characters", () => {
  assert.equal(formatDuration(42_000), "42s");
  assert.equal(formatDuration(754_000), "12m 34s");
  assert.equal(
    statusDescription({ state: "success", durationMs: 754_000, failing: [], box: "box1" }),
    "pnpm verify passed in 12m 34s on box1",
  );
  assert.equal(
    statusDescription({ state: "error", durationMs: 5000, failing: ["x"], box: "box1" }),
    "pnpm verify could not run in 5s on box1",
  );
  const long = statusDescription({
    state: "failure",
    durationMs: 1000,
    failing: Array.from({ length: 20 }, (_, i) => `@stackra/package-${i}#test`),
    box: "box1",
  });
  assert.equal(long.length, 140);
  assert.match(long, /^pnpm verify failed in 1s on box1: @stackra\/package-0#test/);
});

test("commentBody: verdict, command, failing names and a scrubbed, bounded log tail", () => {
  const log = `${Array.from({ length: 200 }, (_, i) => `line ${i}`).join("\n")}\n${FAKE_INSTALLATION}\n\`\`\`break`;
  const body = commentBody({
    sha: SHA,
    pr: "7",
    state: "failure",
    durationMs: 61_000,
    failing: ["@stackra/gen#test"],
    box: "box1",
    log,
    command: COMMAND,
  });
  assert.match(body, /\*\*stackra\/verify: failure\*\* on `0123456789abcdef/);
  assert.match(body, /\(#7\)/);
  assert.match(body, /Failing: `@stackra\/gen#test`/);
  assert.doesNotMatch(body, /line 10\n/);
  assert.match(body, /line 199/);
  assert.doesNotMatch(body, /ghs_/);
  assert.equal(body.match(/```/g).length, 2);
});

test("ledgerEntry: the JSON line and the markdown row carry SHA, command, result, duration and failing names", () => {
  const { json, md } = ledgerEntry({
    repo: "figentra/stackra",
    sha: SHA,
    pr: "7",
    state: "failure",
    durationMs: 61_000,
    failing: ["@stackra/gen#test"],
    box: "box1",
    command: COMMAND,
    at: "2026-11-24T15:00:00.000Z",
    link: "https://github.com/figentra/stackra/commit/x#commitcomment-1",
  });
  assert.deepEqual(json, {
    at: "2026-11-24T15:00:00.000Z",
    repo: "figentra/stackra",
    sha: SHA,
    pr: 7,
    command: COMMAND,
    state: "failure",
    durationMs: 61_000,
    failing: ["@stackra/gen#test"],
    box: "box1",
    link: "https://github.com/figentra/stackra/commit/x#commitcomment-1",
  });
  assert.equal(
    md,
    "| 2026-11-24T15:00:00.000Z | figentra/stackra | #7 | `0123456789ab` | `pnpm install --frozen-lockfile && pnpm verify` | failure | 1m 1s | @stackra/gen#test | https://github.com/figentra/stackra/commit/x#commitcomment-1 |",
  );
  assert.match(
    ledgerEntry({
      repo: "r/r",
      sha: SHA,
      state: "success",
      durationMs: 1,
      failing: [],
      box: "b",
      command: "c",
      at: "t",
    }).md,
    /\| main \|.*\| - \| - \|$/,
  );
});
