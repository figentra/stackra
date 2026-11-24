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
  asUser,
  childEnv,
  commentBody,
  COMMAND,
  DEFAULT_REPO,
  ERROR_RETRY_MS,
  failingNames,
  formatDuration,
  gitArgs,
  hostProblem,
  ledgerEntry,
  LOCK_ORPHAN_MS,
  lockIsStale,
  MAX_ERROR_ATTEMPTS,
  needsRun,
  parseArgs,
  redact,
  RUN_TIMEOUT_S,
  settings,
  STALE_PENDING_MS,
  statusDescription,
  verifiable,
  verifyArgv,
} from "../stackra-verify.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const NOW = Date.parse("2026-11-24T15:00:00Z");
// Token-shaped fakes are built at run time, so the source holds no token-shaped literal for the secret scan.
const FAKE_INSTALLATION = `${"gh"}s_${"a".repeat(36)}`;
const KEY = (edge) => `-----${edge} RSA ${"PRIVATE"} KEY-----`;
const FAKE_PAT = `${"github"}_pat_${"B".repeat(40)}`;
const status = (
  state,
  created_at,
  id = 1,
  context = "stackra/verify",
  login = "stackra-bot[bot]",
) => ({
  state,
  created_at,
  id,
  context,
  creator: { login },
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
    ["once", "--interval", "60"],
    ["run", "--sha", SHA, "--interval", "60"],
    ["once", "--pr", "3"],
    ["once", "-R", "../.."],
    ["once", "-R", "a/b/c"],
    ["once", "-R", "not a repo"],
    ["once", "--unknown"],
  ])
    assert.equal(parseArgs(bad), null, bad.join(" "));
});

test("needsRun: no verify yet, or a pending one past the stale limit, needs a run; a recorded result stands", () => {
  assert.equal(needsRun([], NOW), true);
  assert.equal(needsRun([status("success", "2026-11-24T14:00:00Z", 1, "ci/other")], NOW), true);
  for (const state of ["success", "failure"])
    assert.equal(needsRun([status(state, "2026-11-01T00:00:00Z")], NOW), false, state);
  const fresh = new Date(NOW - 60_000).toISOString();
  const stale = new Date(NOW - STALE_PENDING_MS - 60_000).toISOString();
  assert.equal(needsRun([status("pending", fresh)], NOW), false);
  assert.equal(needsRun([status("pending", stale)], NOW), true);
  // the newest status counts: a pending run started after an old failure is in progress
  assert.equal(needsRun([status("failure", stale, 1), status("pending", fresh, 2)], NOW), false);
});

test("needsRun: an error is retried after ERROR_RETRY_MS, at most MAX_ERROR_ATTEMPTS times per SHA", () => {
  const recent = new Date(NOW - ERROR_RETRY_MS + 60_000).toISOString();
  const old = new Date(NOW - ERROR_RETRY_MS - 60_000).toISOString();
  assert.equal(needsRun([status("error", recent)], NOW), false);
  assert.equal(needsRun([status("error", old)], NOW), true);
  const errors = Array.from({ length: MAX_ERROR_ATTEMPTS }, (_, i) => status("error", old, i + 1));
  assert.equal(needsRun(errors, NOW), false);
  assert.equal(needsRun(errors.slice(1), NOW), true);
});

test("needsRun: a stackra/verify posted by anyone but the bot is ignored, so it can neither pass nor block a head", () => {
  const foreign = (state) => status(state, "2026-11-24T14:59:00Z", 9, "stackra/verify", "someone");
  assert.equal(needsRun([foreign("success")], NOW), true);
  assert.equal(needsRun([foreign("pending")], NOW), true);
  assert.equal(
    needsRun([status("success", "2026-11-24T10:00:00Z"), foreign("failure")], NOW),
    false,
  );
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
    recorded: true,
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

test("verifiable: drafts and fork PRs are never run; this repository's own branches are", () => {
  assert.equal(verifiable({ isDraft: false, isCrossRepository: false }), true);
  assert.equal(verifiable({ isDraft: true, isCrossRepository: false }), false);
  assert.equal(verifiable({ isDraft: false, isCrossRepository: true }), false);
  assert.equal(verifiable({ isDraft: false }), false);
});

test("childEnv: the bot identity and every secret-named variable stay out of the verify", () => {
  const env = childEnv({
    PATH: "/usr/bin",
    HOME: "/home/x",
    PNPM_HOME: "/p",
    STACKRA_BOT_APP_ID: "1",
    STACKRA_BOT_PRIVATE_KEY: "k",
    GH_TOKEN: "t",
    GITHUB_TOKEN: "t",
    SOPS_AGE_KEY_FILE: "/k",
    AWS_SECRET_ACCESS_KEY: "s",
    TURBO_TOKEN: "t",
    CLOUDFLARE_API_TOKEN: "t",
    DB_PASSWORD: "p",
    SSH_AUTH_SOCK: "/tmp/agent",
    DOCKER_HOST: "unix:///var/run/docker.sock",
    NPM_CONFIG__AUTH: "x",
  });
  assert.deepEqual(Object.keys(env).sort(), [
    "CI",
    "FORCE_COLOR",
    "HOME",
    "PATH",
    "PNPM_HOME",
    "TURBO_TELEMETRY_DISABLED",
  ]);
});

test("childEnv: the verify user gets its own HOME, pnpm store, PATH and Docker, never the box's socket", () => {
  const env = childEnv(
    { PATH: "/usr/bin", HOME: "/home/key-holder", DOCKER_HOST: "unix:///var/run/docker.sock" },
    {
      home: "/w/home",
      store: "/w/pnpm-store",
      dockerHost: "unix:///run/user/1500/docker.sock",
      path: "/opt/bin",
    },
  );
  assert.equal(env.HOME, "/w/home");
  assert.equal(env.npm_config_store_dir, "/w/pnpm-store");
  assert.equal(env.DOCKER_HOST, "unix:///run/user/1500/docker.sock");
  assert.equal(env.PATH, "/opt/bin");
  assert.equal(childEnv({ DOCKER_HOST: "unix:///var/run/docker.sock" }).DOCKER_HOST, undefined);
});

test("asUser: sudo to the verify user with exactly the given environment; same-user only without a user", () => {
  assert.deepEqual(asUser("stackra-verify", { HOME: "/w/home", CI: "1" }, "git", ["status"]), [
    "sudo",
    "-n",
    "-u",
    "stackra-verify",
    "--",
    "env",
    "-i",
    "HOME=/w/home",
    "CI=1",
    "git",
    "status",
  ]);
  assert.deepEqual(asUser(null, { CI: "1" }, "true", []), ["env", "-i", "CI=1", "true"]);
});

test("gitArgs: hooks and fsmonitor are off for every git call, whatever the mirror's config says", () => {
  assert.deepEqual(gitArgs("/w/mirror", ["fetch"]), [
    "-c",
    "core.hooksPath=/dev/null",
    "-c",
    "core.fsmonitor=false",
    "-C",
    "/w/mirror",
    "fetch",
  ]);
});

test("verifyArgv: a hard time limit over the process group, low priority and the configured cores", () => {
  assert.deepEqual(verifyArgv({ cpus: "8-15" }), [
    "timeout",
    "-s",
    "TERM",
    "-k",
    "30",
    String(RUN_TIMEOUT_S),
    "nice",
    "-n",
    "10",
    "taskset",
    "-c",
    "8-15",
    "sh",
    "-c",
    COMMAND,
  ]);
  assert.deepEqual(verifyArgv({ cpus: "0-7", linux: false }), [
    "nice",
    "-n",
    "10",
    "sh",
    "-c",
    COMMAND,
  ]);
});

test("lockIsStale: a dead owner, a reused pid or an ownerless old lock is stale; a live owner never is", () => {
  const live = { alive: () => true, startOf: () => 500, ageMs: 0 };
  assert.equal(lockIsStale({ pid: 42, start: 500 }, live), false);
  assert.equal(lockIsStale({ pid: 42, start: 500 }, { ...live, alive: () => false }), true);
  assert.equal(lockIsStale({ pid: 42, start: 400 }, live), true);
  assert.equal(lockIsStale({ pid: 42 }, live), false);
  assert.equal(lockIsStale({ pid: 42, start: 500 }, { ...live, startOf: () => null }), false);
  for (const owner of [null, { pid: 0 }, { pid: "x" }]) {
    assert.equal(lockIsStale(owner, { ...live, ageMs: LOCK_ORPHAN_MS - 1 }), false);
    assert.equal(lockIsStale(owner, { ...live, ageMs: LOCK_ORPHAN_MS + 1 }), true);
  }
});

test("settings and hostProblem: refuse to run PR code as the key holder unless the host is disposable", () => {
  const base = settings({ PATH: "/usr/bin" });
  assert.equal(base.home, "/work/stackra/verify");
  assert.equal(base.work, "/work/stackra/verify-work");
  assert.equal(base.cpus, "0-7");
  assert.equal(base.minFreeBytes, 20 * 1024 ** 3);
  assert.match(hostProblem(base), /STACKRA_VERIFY_RUN_AS is not set/);
  assert.equal(hostProblem(settings({ STACKRA_VERIFY_RUN_AS: "stackra-verify" })), null);
  assert.equal(hostProblem(settings({ STACKRA_VERIFY_SAME_USER: "1" })), null);
  const custom = settings({ STACKRA_VERIFY_CPUS: "8-15", STACKRA_VERIFY_MIN_FREE_GB: "5" });
  assert.equal(custom.cpus, "8-15");
  assert.equal(custom.minFreeBytes, 5 * 1024 ** 3);
});

test("redact: cloud keys, API keys, npm tokens, JWTs and age keys are scrubbed too", () => {
  const shapes = [
    `${"AK"}IA${"A".repeat(16)}`,
    `${"sk"}-${"c".repeat(30)}`,
    `${"npm"}_${"d".repeat(36)}`,
    `${"ey"}J${"e".repeat(12)}.${"ey"}J${"f".repeat(12)}.${"g".repeat(12)}`,
    `${"AGE-SECRET"}-KEY-1${"H".repeat(58)}`,
  ];
  const out = redact(shapes.join(" "));
  assert.equal(out, Array(shapes.length).fill("[redacted]").join(" "));
});

test("statusDescription: an error names its reason", () => {
  assert.equal(
    statusDescription({
      state: "error",
      durationMs: 2000,
      failing: [],
      box: "box1",
      reason: "disk",
    }),
    "pnpm verify could not run in 2s on box1 (disk)",
  );
});

test("ledgerEntry: a result whose status could not be posted says so", () => {
  const { json, md } = ledgerEntry({
    repo: "r/r",
    sha: SHA,
    state: "success",
    durationMs: 1,
    failing: [],
    box: "b",
    command: "c",
    at: "t",
    recorded: false,
  });
  assert.equal(json.recorded, false);
  assert.match(md, /\| success \(status not posted\) \|/);
});
