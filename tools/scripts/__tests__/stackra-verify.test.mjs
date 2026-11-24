/**
 * Stackra file contract:
 * Purpose: hold `stackra-verify.mjs` to the CTO's ruling of 2026-11-24 (STA-2761): each protection has a test that
 *          fails when the protection is removed — the verify definition comes from main (a PR's `verify: "true"` never
 *          runs), replace refs in the mirror are ignored, the verdict comes from the container's exit code only, the
 *          SHA is bound (a moved head posts nothing), the time limit kills the container, nothing crosses sudo or
 *          docker as a value, PR containers get no socket, network or secret, and only our App's run counts.
 * Boundary: pure functions, `runJob` with fakes, and `buildTree` on a temporary git repository; no Docker, sudo, gh
 *           or network.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-2761.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildTree,
  checkRunBody,
  CONTAINER_ENV,
  DEFAULT_REPO,
  dockerAs,
  dockerEnvFile,
  ERROR_RETRY_MS,
  formatDuration,
  hostProblems,
  imagesToRemove,
  installArgs,
  ledgerEntry,
  logTail,
  MAX_ERROR_ATTEMPTS,
  needsRun,
  OUTPUT_TEXT_MAX,
  overlayPlan,
  parseArgs,
  pnpmVersionOf,
  runJob,
  scrub,
  settings,
  storeDockerfile,
  storeTag,
  verifyArgs,
  withMainScripts,
} from "../stackra-verify.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const BASE = "fedcba9876543210fedcba9876543210fedcba98";
const NOW = Date.parse("2026-11-24T15:00:00Z");
const PINNED = `node@sha256:${"a".repeat(64)}`;
const APP_ID = "4242";
const FAKE_INSTALLATION = `${"gh"}s_${"a".repeat(36)}`;
const KEY = (edge) => `-----${edge} RSA ${"PRIVATE"} KEY-----`;
const S = {
  ...settings({}),
  home: "/work/stackra/verify",
  runAs: "stackra-verify",
  dockerHost: "unix:///run/user/1500/docker.sock",
  baseImage: PINNED,
  appId: APP_ID,
  installationId: "77",
  keyFile: "/home/svc/stackra-verify.pem",
};

test("parseArgs: run needs a full SHA; --in-place and same-user modes are gone; bad input is a usage error", () => {
  assert.equal(parseArgs(["run", "--sha", SHA, "--pr", "12"]).sha, SHA);
  assert.deepEqual(parseArgs(["once"]).repos, [DEFAULT_REPO]);
  assert.deepEqual(parseArgs(["daemon", "-R", "a/b", "-R", "c/d", "--interval", "60"]).repos, [
    "a/b",
    "c/d",
  ]);
  for (const bad of [
    [],
    ["run"],
    ["run", "--sha", "abc"],
    ["run", "--sha", SHA, "--in-place"],
    ["run", "--sha", SHA, "-R", "a/b", "-R", "c/d"],
    ["once", "--pr", "3"],
    ["once", "--interval", "60"],
    ["once", "-R", "../.."],
    ["daemon", "--interval", "5"],
  ])
    assert.equal(parseArgs(bad), null, bad.join(" "));
});

test("hostProblems: no verify user, no rootless Docker, an unpinned base or a loose key refuses; same-user is not a mode", () => {
  assert.deepEqual(hostProblems(S, 0o400), []);
  assert.match(hostProblems({ ...S, runAs: null }, 0o400).join(), /RUN_AS is not set/);
  assert.match(hostProblems({ ...S, dockerHost: null }, 0o400).join(), /DOCKER_HOST/);
  assert.match(hostProblems({ ...S, baseImage: "node:24" }, 0o400).join(), /pinned by digest/);
  assert.match(hostProblems(S, 0o440).join(), /owner only/);
  assert.match(hostProblems(S, null).join(), /not readable/);
  assert.match(hostProblems({ ...S, keyFile: null }, 0o400).join(), /required/);
  const sameUser = settings({ STACKRA_VERIFY_SAME_USER: "1" });
  assert.equal("sameUser" in sameUser, false);
  assert.match(hostProblems(sameUser, 0o400).join(), /RUN_AS is not set/);
});

test("dockerAs: every docker call runs as the verify user, and no value crosses sudo as an argument", () => {
  const argv = dockerAs(S, ["ps", "-aq"]);
  assert.deepEqual(argv.slice(0, 5), ["sudo", "-n", "-u", "stackra-verify", "--"]);
  assert.deepEqual(argv.slice(-2), ["ps", "-aq"]);
  assert.equal(argv.includes("/work/stackra/verify/docker.env"), true);
  assert.equal(
    argv.some((a) => /^(?:PATH|DOCKER_HOST|HOME)=/.test(a)),
    false,
  );
  assert.equal(dockerEnvFile(S), `PATH=${S.path}\nDOCKER_HOST=${S.dockerHost}\n`);
});

test("containers: no socket, no host path but the read-only archive, no secret, no network for verify, hard caps", () => {
  const envFile = "/work/stackra/verify/runs/x/container.env";
  const install = installArgs(S, {
    name: "i",
    image: "store",
    tarPath: "/runs/x/src.tar",
    envFile,
  });
  const check = verifyArgs(S, { name: "v", image: "run", envFile });
  for (const argv of [install, check]) {
    const joined = argv.join(" ");
    assert.doesNotMatch(
      joined,
      /docker\.sock|--privileged|--network host|--pid[= ]|--ipc[= ]host|\.ssh|\.claude|\/home\/build/,
    );
    assert.equal(argv[argv.indexOf("--cap-drop") + 1], "ALL");
    assert.equal(argv[argv.indexOf("--security-opt") + 1], "no-new-privileges");
    assert.equal(argv[argv.indexOf("--cpus") + 1], "8");
    assert.equal(argv[argv.indexOf("--memory") + 1], argv[argv.indexOf("--memory-swap") + 1]);
    assert.ok(Number(argv[argv.indexOf("--pids-limit") + 1]) > 0);
    assert.equal(argv[argv.indexOf("--env-file") + 1], envFile);
    assert.equal(argv.filter((a) => a === "--env" || a === "-e").length, 0);
  }
  assert.equal(install.filter((a) => a === "--volume").length, 1);
  assert.equal(install[install.indexOf("--volume") + 1], "/runs/x/src.tar:/in/src.tar:ro");
  assert.equal(check.includes("--volume"), false);
  assert.equal(check[check.indexOf("--network") + 1], "none");
  assert.doesNotMatch(CONTAINER_ENV, /TOKEN|KEY|SECRET|PASSWORD|NPM_|GH_/);
});

test("store image: built on a digest-pinned base only, tagged by the lockfile, kept with the base after clean-up", () => {
  assert.throws(
    () => storeDockerfile({ baseImage: "node:24", pnpmVersion: "12.16.1" }),
    /pinned by digest/,
  );
  const dockerfile = storeDockerfile({ baseImage: PINNED, pnpmVersion: "12.16.1" });
  assert.match(dockerfile, new RegExp(`^FROM ${PINNED}$`, "m"));
  assert.match(dockerfile, /pnpm fetch --store-dir \/store/);
  assert.equal(pnpmVersionOf('{"packageManager":"pnpm@12.16.1+sha512.abc"}'), "12.16.1");
  assert.throws(() => pnpmVersionOf("{}"), /no pnpm version/);
  assert.match(storeTag(Buffer.from("lock")), /^stackra-verify-store:[0-9a-f]{16}$/);
  assert.deepEqual(imagesToRemove(["base", "store", "run", "poisoned", "run"], ["base", "store"]), [
    "run",
    "poisoned",
  ]);
});

test("needsRun: only our App's completed run stands; a forged run never stops a verify; errors retry, capped", () => {
  const ours = {
    name: "stackra/verify",
    head_sha: SHA,
    status: "completed",
    conclusion: "failure",
    app: { id: 4242 },
  };
  assert.equal(needsRun({ checkRuns: [ours], sha: SHA, appId: APP_ID }, NOW), false);
  const forged = { ...ours, conclusion: "success", app: { id: 1, slug: "stackra-bot" } };
  assert.equal(needsRun({ checkRuns: [forged], sha: SHA, appId: APP_ID }, NOW), true);
  assert.equal(
    needsRun({ checkRuns: [{ ...ours, head_sha: BASE }], sha: SHA, appId: APP_ID }, NOW),
    true,
  );
  assert.equal(
    needsRun({ checkRuns: [{ ...ours, status: "in_progress" }], sha: SHA, appId: APP_ID }, NOW),
    true,
  );
  const recent = { count: 1, at: NOW - ERROR_RETRY_MS + 60_000 };
  const old = { count: 1, at: NOW - ERROR_RETRY_MS - 60_000 };
  assert.equal(needsRun({ checkRuns: [], sha: SHA, appId: APP_ID, errors: recent }, NOW), false);
  assert.equal(needsRun({ checkRuns: [], sha: SHA, appId: APP_ID, errors: old }, NOW), true);
  const capped = { count: MAX_ERROR_ATTEMPTS, at: old.at };
  assert.equal(needsRun({ checkRuns: [], sha: SHA, appId: APP_ID, errors: capped }, NOW), false);
});

test("output: scrubbed, inert Markdown (no fence breakout, no @mention), capped, never a verdict", () => {
  const log = `ok ${FAKE_INSTALLATION}\n${KEY("BEGIN")}\nMIIE\n${KEY("END")}\n\`\`\`\n@figentra-usr see [x](https://evil.test)\n`;
  const tail = logTail(log);
  assert.doesNotMatch(tail, /ghs_|MIIE|`/);
  assert.doesNotMatch(tail, /@figentra-usr/);
  assert.match(tail, /@​figentra-usr/);
  assert.equal(logTail("x\n".repeat(OUTPUT_TEXT_MAX)).length <= OUTPUT_TEXT_MAX + 2, true);
  assert.equal(scrub(`a${String.fromCodePoint(27)}[31mb${String.fromCodePoint(7)}c`), "abc");
  const body = checkRunBody({
    sha: SHA,
    base: BASE,
    conclusion: "failure",
    phase: "verify",
    durationMs: 61_000,
    box: "box1",
    log: "Tasks: 120 successful\nPASS all green\n```\n",
    startedAt: "t0",
    completedAt: "t1",
  });
  assert.equal(body.conclusion, "failure");
  assert.equal(body.head_sha, SHA);
  assert.equal(body.external_id, `base:${BASE}`);
  assert.match(body.output.title, /^pnpm verify failed in 1m 1s$/);
  assert.equal(body.output.text.match(/```/g).length, 2);
  assert.equal(JSON.stringify(body).includes("STACKRA_VERIFY"), false);
});

/** runJob with fakes. `exits` maps container role to its exit code (null: never started); `hang` never returns. */
function fakeDeps({
  exits = { install: 0, verify: 0 },
  head = SHA,
  hang = null,
  conflict = false,
  stop = null,
}) {
  const calls = { kill: [], cleanUp: [], docker: [], runs: [] };
  let stopping = false;
  const deps = {
    settings: S,
    envFile: "/runs/x/container.env",
    archive: () => {
      if (conflict) throw Object.assign(new Error("conflict"), { conflict: true });
      return "/runs/x/src.tar";
    },
    storeImage: () => "stackra-verify-store:abc",
    docker: (args) => {
      calls.docker.push(args);
      return { code: 0, stdout: "" };
    },
    runContainer: (args, name) => {
      calls.runs.push(args);
      const role = name.endsWith("-install") ? "install" : "verify";
      if (stop === role) stopping = true;
      if (hang === role)
        return new Promise((resolve) => {
          deps.release = resolve;
        });
      return Promise.resolve({ code: 0 });
    },
    exitCodeOf: (name) => exits[name.endsWith("-install") ? "install" : "verify"],
    kill: (name) => {
      calls.kill.push(name);
      deps.release?.({ code: 137 });
    },
    cleanUp: (names, images) => calls.cleanUp.push({ names, images }),
    headOf: async () => head,
    readLog: () => "PASS everything is fine\n",
    stopping: () => stopping,
    timeoutMs: 5,
    setTimer: (fn, ms) => {
      const t = setTimeout(fn, ms);
      return () => clearTimeout(t);
    },
  };
  return { deps, calls };
}
const JOB = { repo: "figentra/stackra", sha: SHA, pr: "12", base: BASE };

test("runJob: exit 0 of the verify container is the only pass; the install runs with network, verify without", async () => {
  const { deps, calls } = fakeDeps({});
  const r = await runJob(JOB, deps);
  assert.equal(r.post, true);
  assert.equal(r.conclusion, "success");
  assert.equal(calls.runs[0][calls.runs[0].indexOf("--network") + 1], "bridge");
  assert.equal(calls.runs[1][calls.runs[1].indexOf("--network") + 1], "none");
  assert.equal(calls.cleanUp.length, 1);
  assert.equal(calls.cleanUp[0].names.length, 2);
});

test("runJob: output that says PASS with exit 1 is a failure (the log is never read for a verdict)", async () => {
  const { deps } = fakeDeps({ exits: { install: 0, verify: 1 } });
  const r = await runJob(JOB, deps);
  assert.equal(r.conclusion, "failure");
  assert.equal(r.phase, "verify");
});

test("runJob: a failed install is the PR's failure; a container that never started is an error, never a pass", async () => {
  assert.equal(
    (await runJob(JOB, fakeDeps({ exits: { install: 2, verify: 0 } }).deps)).phase,
    "install",
  );
  const unstarted = await runJob(JOB, fakeDeps({ exits: { install: 0, verify: null } }).deps);
  assert.equal(unstarted.post, false);
  assert.match(unstarted.error, /did not start/);
});

test(
  "runJob: the time limit kills the container (every process in it) and records a failure",
  { timeout: 2000 },
  async () => {
    const { deps, calls } = fakeDeps({ hang: "verify" });
    const r = await runJob(JOB, deps);
    assert.deepEqual(r, {
      post: true,
      conclusion: "failure",
      phase: "verify",
      reason: "time limit",
      log: "PASS everything is fine\n",
    });
    assert.equal(calls.kill.length, 1);
    assert.match(calls.kill[0], /^sv-0123456789ab-.*-verify$/);
    assert.equal(calls.cleanUp.length, 1);
  },
);

test("runJob: a stale SHA posts nothing — the PR's head moved while it ran", async () => {
  const r = await runJob(JOB, fakeDeps({ head: "f".repeat(40) }).deps);
  assert.deepEqual(r, { post: false, moved: true });
});

test("runJob: a merge conflict with main is the PR's failure; a stop posts nothing", async () => {
  const conflict = await runJob(JOB, fakeDeps({ conflict: true }).deps);
  assert.equal(conflict.conclusion, "failure");
  assert.equal(conflict.phase, "merge");
  const stopped = await runJob(JOB, fakeDeps({ stop: "verify" }).deps);
  assert.deepEqual(stopped, { post: false, stopped: true });
});

test("withMainScripts and overlayPlan: the PR keeps its dependencies, main keeps the commands and configs", () => {
  const head = '{"name":"x","dependencies":{"zod":"4"},"scripts":{"verify":"true","test":"true"}}';
  const main =
    '{"name":"x","dependencies":{"zod":"3"},"scripts":{"verify":"pnpm format:check && turbo run test"}}';
  const out = JSON.parse(withMainScripts(head, main));
  assert.deepEqual(out.scripts, { verify: "pnpm format:check && turbo run test" });
  assert.deepEqual(out.dependencies, { zod: "4" });
  assert.equal("scripts" in JSON.parse(withMainScripts(head, '{"name":"x"}')), false);
  const plan = overlayPlan(
    [
      "package.json",
      "packages/a/package.json",
      "packages/new/package.json",
      "src/a.ts",
      "turbo.jsonc",
    ],
    [
      { path: "package.json" },
      { path: "packages/a/package.json" },
      { path: "turbo.jsonc" },
      { path: "packages/a/vitest.config.ts" },
      { path: "src/a.ts" },
    ],
  );
  assert.deepEqual(plan.whole.map((e) => e.path).sort(), [
    "packages/a/vitest.config.ts",
    "turbo.jsonc",
  ]);
  assert.deepEqual(plan.scripts, ["package.json", "packages/a/package.json"]);
});

/** A temporary repository with main, a PR and an attacker's commit, for `buildTree`. */
function fixtureRepo() {
  const dir = mkdtempSync(join(tmpdir(), "stackra-verify-"));
  const git = (...args) => {
    const r = spawnSync(
      "git",
      [
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@t",
        "-c",
        "init.defaultBranch=main",
        "-c",
        "commit.gpgsign=false",
        ...args,
      ],
      { cwd: dir, encoding: "utf8", env: { PATH: process.env.PATH, HOME: dir } },
    );
    if (r.status !== 0) throw new Error(r.stderr);
    return r.stdout.trim();
  };
  const write = (path, text) => {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git("init", "-q");
  write(
    "package.json",
    '{"name":"r","scripts":{"verify":"turbo run test"},"devDependencies":{"vitest":"5"}}\n',
  );
  write("turbo.jsonc", '{"tasks":{"test":{}}}\n');
  write("packages/a/vitest.config.ts", "export default { test: { include: ['src/**'] } };\n");
  write("packages/a/src/a.ts", "export const a = 1;\n");
  git("add", "-A");
  git("commit", "-qm", "main");
  const base = git("rev-parse", "HEAD");
  git("checkout", "-qb", "pr");
  write(
    "package.json",
    '{"name":"r","scripts":{"verify":"true"},"devDependencies":{"vitest":"5","zod":"4"}}\n',
  );
  write("turbo.jsonc", '{"tasks":{}}\n');
  write("packages/a/vitest.config.ts", "export default { test: { include: [] } };\n");
  write("packages/a/src/a.ts", "export const a = 2;\n");
  git("add", "-A");
  git("commit", "-qm", "pr");
  const sha = git("rev-parse", "HEAD");
  write("packages/a/src/a.ts", "export const a = 'evil';\n");
  git("commit", "-qam", "evil");
  const evil = git("rev-parse", "HEAD");
  return { dir, git, base, sha, evil };
}

test("buildTree: the PR merged onto main, with main's verify definition — a PR's `verify: \"true\"` never runs", () => {
  const { dir, git, base, sha } = fixtureRepo();
  try {
    const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
    const show = (path) => git("cat-file", "blob", `${tree}:${path}`);
    const pkg = JSON.parse(show("package.json"));
    assert.deepEqual(pkg.scripts, { verify: "turbo run test" });
    assert.equal(pkg.devDependencies.zod, "4");
    assert.equal(show("turbo.jsonc"), '{"tasks":{"test":{}}}');
    assert.match(show("packages/a/vitest.config.ts"), /include: \['src\/\*\*'\]/);
    assert.equal(show("packages/a/src/a.ts"), "export const a = 2;");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildTree: a replace ref in the mirror never swaps the tested tree", () => {
  const { dir, git, base, sha, evil } = fixtureRepo();
  try {
    git("replace", sha, evil);
    assert.match(git("cat-file", "-p", `${sha}:packages/a/src/a.ts`), /evil/);
    const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
    assert.equal(git("cat-file", "blob", `${tree}:packages/a/src/a.ts`), "export const a = 2;");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildTree: a PR that conflicts with main is refused as a conflict", () => {
  const { dir, git, base, sha } = fixtureRepo();
  try {
    git("checkout", "-q", "main");
    writeFileSync(join(dir, "packages/a/src/a.ts"), "export const a = 3;\n");
    git("commit", "-qam", "main moves");
    const newBase = git("rev-parse", "HEAD");
    assert.notEqual(newBase, base);
    assert.throws(
      () => buildTree(dir, newBase, sha, join(dir, "scratch-index")),
      (error) => error.conflict === true,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ledgerEntry and formatDuration: the result, the posted flag and the link", () => {
  assert.equal(formatDuration(754_000), "12m 34s");
  const { json, md } = ledgerEntry({
    repo: "figentra/stackra",
    sha: SHA,
    pr: "7",
    conclusion: "failure",
    phase: "verify",
    durationMs: 61_000,
    box: "box1",
    at: "2026-11-24T15:00:00.000Z",
    link: "https://github.com/figentra/stackra/runs/1",
    posted: false,
  });
  assert.equal(json.posted, false);
  assert.equal(json.pr, 7);
  assert.match(md, /\| failure, not posted \| 1m 1s \|/);
});
