/**
 * Stackra file contract:
 * Purpose: hold the box deploy service (stackra-deploy.mjs, ADR 0536, STA-2783) to its contract on a fake box: built
 *          OFF (a switch that is not exactly "on" refuses, a dry run plans), main SHAs only, a green stackra/verify from
 *          the verify App at that SHA (box-green only under its switch and from its owner), Encore staging only (any
 *          other environment refused), D1 migrations additive only, the version at 0% before any traffic, the
 *          smoke at every step with rollback on a failure, the gradual 10% → 100% promotion, approve mode waiting for
 *          the approver's file, an idempotent re-run, the ledger's contents, and no secret in an argv, a child's
 *          environment beyond wrangler's, an output or the ledger. The parity test parses the caller workflow and
 *          runway-cloudflare-workers.yml and compares their steps with the box's plan.
 * Boundary: fakes only (__fixtures__/fake-deploy-host.mjs); no network, git, sudo or wrangler runs.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0536; ADR 0468; STA-2783.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  assertEncoreTarget,
  callerInputs,
  clearSecrets,
  deployEncore,
  deployWorker,
  lockImporters,
  lockedArgv,
  newestVerifyRun,
  parseArgs,
  parsePromotion,
  parseSteps,
  placeConfig,
  plannedRuns,
  preflightProblems,
  PROVIDER_WORKFLOW,
  readLedger,
  RUNWAY_DRIVER,
  settings,
  stripJsonc,
  swapIds,
  switchOf,
  workerPlan,
  workerTouched,
  workspaceClosure,
  writeApproval,
} from "../stackra-deploy.mjs";
import { fakeDeployHost } from "./__fixtures__/fake-deploy-host.mjs";

const {
  ACCOUNT,
  CF_TOKEN,
  D1_ID,
  ENCORE_SECRET,
  ENCORE_TOKEN,
  host: fakeHost,
  KV_ID,
  NEW,
  OLD,
  OLD_SHA,
  REPO_ROOT,
  SHA,
  TURBO_TOKEN,
  verifyRun,
} = fakeDeployHost;

const SECRETS = [CF_TOKEN, TURBO_TOKEN, ENCORE_SECRET, ENCORE_TOKEN];
const repoFile = (path) => readFileSync(join(REPO_ROOT, path), "utf8");

beforeEach(() => clearSecrets());

const deployRegistry = async (host, extra = {}) =>
  deployWorker(settings(host.env), host.io, {
    worker: "registry",
    sha: SHA,
    trigger: "manual",
    ...extra,
  });

/** Writes a box-green record for SHA as its owner would. */
const place = (host, doc) =>
  writeFileSync(join(host.boxGreen, `${SHA}.json`), JSON.stringify(doc), { mode: 0o644 });

const lastLedger = (host) => readLedger(settings(host.env), host.io).at(-1);

/** Every place a secret could leak to: argv, non-wrangler child environments, logs, the ledger. */
function assertNoLeak(host) {
  const s = settings(host.env);
  const ledger = (() => {
    try {
      return readFileSync(join(s.home, "ledger", "deploys.jsonl"), "utf8");
    } catch {
      return "";
    }
  })();
  for (const secret of SECRETS) {
    for (const call of host.calls)
      assert.ok(!call.args.join(" ").includes(secret), `argv of ${call.command}`);
    for (const call of host.calls.filter((c) => !String(c.args[0]).endsWith("wrangler.js")))
      assert.ok(
        !JSON.stringify(call.env).includes(secret),
        `env of ${call.command} ${call.args[0]}`,
      );
    assert.ok(!host.logs.join("\n").includes(secret), "logs");
    assert.ok(!ledger.includes(secret), "ledger");
  }
}

// ---- arguments and settings ----

test("arguments: the verbs, a full SHA, a known Worker", () => {
  assert.deepEqual(parseArgs(["workers", "run", "--worker", "registry", "--sha", SHA]), {
    verb: "run",
    target: "workers",
    worker: "registry",
    sha: SHA,
    dryRun: false,
    trigger: "manual",
  });
  assert.equal(parseArgs(["encore", "run", "--sha", SHA, "--dry-run"]).dryRun, true);
  assert.equal(parseArgs(["workers", "run", "--worker", "docs", "--sha", SHA]), null);
  assert.equal(parseArgs(["workers", "run", "--worker", "registry", "--sha", "abc"]), null);
  assert.equal(parseArgs(["encore", "run", "--sha", SHA, "--worker", "registry"]), null);
  assert.equal(
    parseArgs(["approve", "--worker", "registry", "--sha", SHA, "--version", "x"]),
    null,
  );
  assert.equal(
    parseArgs(["approve", "--worker", "registry", "--sha", SHA, "--version", NEW]).verb,
    "approve",
  );
  assert.equal(parseArgs(["deploy"]), null);
  assert.equal(parseArgs(["once", "--sha", SHA]), null);
});

test("switches: only exactly on is on; promotion defaults to auto for all four; steps end at 100", () => {
  assert.equal(switchOf(undefined), "off");
  assert.equal(switchOf("on"), "on");
  assert.equal(switchOf("ON"), "invalid");
  assert.equal(switchOf("true"), "invalid");
  assert.deepEqual(parsePromotion(undefined), {
    registry: "auto",
    static: "auto",
    "turbo-cache": "auto",
    edge: "auto",
  });
  assert.equal(parsePromotion("registry=approve").registry, "approve");
  assert.equal(parsePromotion("docs=auto"), null);
  assert.equal(parsePromotion("registry=manual"), null);
  assert.deepEqual(parseSteps(undefined), [10, 100]);
  assert.deepEqual(parseSteps("5,25,100"), [5, 25, 100]);
  assert.equal(parseSteps("10,50"), null);
  assert.equal(parseSteps("50,10,100"), null);
  assert.equal(parseSteps("0,100"), null);
});

test("the lock re-runs the script under flock -n, exit 75 when held", () => {
  assert.deepEqual(
    lockedArgv("/l/worker-registry.lock", "/s.mjs", ["workers", "run"]).slice(0, 5),
    ["flock", "-n", "-E", "75", "/l/worker-registry.lock"],
  );
});

// ---- built OFF ----

test("built OFF: a switch that is not on refuses, and a typo is a problem of its own", async () => {
  const off = fakeHost({ env: { STACKRA_DEPLOY_WORKERS: "" } });
  const result = await deployRegistry(off);
  assert.equal(result.code, 1);
  assert.equal(lastLedger(off).result, "refused");
  assert.match(lastLedger(off).reason, /STACKRA_DEPLOY_WORKERS is not on/);
  assert.equal(off.calls.length, 0, "nothing ran");
  const typo = fakeHost({ env: { STACKRA_DEPLOY_WORKERS: "yes" } });
  assert.match(
    preflightProblems(settings(typo.env), typo.io, "workers").join(";"),
    /exactly "on" or "off"/,
  );
  const encoreOff = fakeHost({ env: { STACKRA_DEPLOY_ENCORE: "off" } });
  assert.equal(
    (await deployEncore(settings(encoreOff.env), encoreOff.io, { sha: SHA, trigger: "manual" }))
      .code,
    1,
  );
  assert.equal(encoreOff.encore.rollouts.length, 0);
});

test("a dry run plans with the switch off and changes nothing", async () => {
  const host = fakeHost({ env: { STACKRA_DEPLOY_WORKERS: "off" } });
  const result = await deployRegistry(host, { dryRun: true });
  assert.equal(result.code, 0);
  assert.equal(lastLedger(host).result, "dry-run");
  assert.ok(
    host.calls.every((c) => c.command === "git"),
    "only the mirror is read",
  );
  assert.ok(host.logs.some((l) => l.includes("wrangler versions upload --message")));
  assert.equal(host.wrangler.uploads, 0);
});

test("preflight: the deploy user, the secret files' modes, the build user", () => {
  const host = fakeHost();
  const s = settings(host.env);
  assert.deepEqual(preflightProblems(s, host.io, "workers"), []);
  assert.deepEqual(preflightProblems(s, host.io, "encore"), []);
  const asBuild = { ...host.io, user: "build" };
  assert.match(preflightProblems(s, asBuild, "workers").join(";"), /never build/);
  const loose = { ...host.io, lstat: (p) => ({ ...host.io.lstat(p), mode: 0o440 }) };
  assert.match(
    preflightProblems(s, loose, "workers").join(";"),
    /CLOUDFLARE_TOKEN_FILE .* must be mode 0400/,
  );
  const foreign = { ...host.io, lstat: (p) => ({ ...host.io.lstat(p), uid: 1 }) };
  assert.match(preflightProblems(s, foreign, "encore").join(";"), /not owned by the deploy user/);
  assert.match(
    preflightProblems(
      settings({ ...host.env, STACKRA_DEPLOY_MIRROR: join(host.home, "m.git") }),
      host.io,
      "workers",
    ).join(";"),
    /outside STACKRA_DEPLOY_HOME/,
  );
  assert.match(
    preflightProblems(
      settings({ ...host.env, STACKRA_DEPLOY_BUILD_AS: "stackra-deploy" }),
      host.io,
      "workers",
    ).join(";"),
    /its own user/,
  );
  assert.match(
    preflightProblems(
      settings({
        ...host.env,
        STACKRA_DEPLOY_PROMOTION: "registry=approve",
        STACKRA_DEPLOY_APPROVER: "",
      }),
      host.io,
      "workers",
    ).join(";"),
    /needs STACKRA_DEPLOY_APPROVER/,
  );
});

// ---- the gates ----

test("a SHA that is not on main is refused before anything is built", async () => {
  const host = fakeHost({ onMain: false });
  const result = await deployRegistry(host);
  assert.equal(result.code, 1);
  assert.match(lastLedger(host).reason, /not a commit of origin\/main/);
  assert.ok(!host.calls.some((c) => c.command === "sudo"));
});

test("a SHA without a green stackra/verify from the verify App is refused", async () => {
  for (const runs of [
    [],
    [verifyRun(SHA, "failure")],
    [
      verifyRun(SHA, "success", "2026-11-25T06:00:00Z"),
      verifyRun(SHA, "failure", "2026-11-25T07:00:00Z"),
    ],
    [verifyRun(SHA, "success", undefined, 123)],
    [verifyRun("c".repeat(40), "success")],
  ]) {
    const host = fakeHost({ checkRuns: runs });
    const result = await deployRegistry(host);
    assert.equal(result.code, 1);
    assert.equal(lastLedger(host).result, "refused");
    assert.ok(!host.calls.some((c) => c.command === "sudo"));
  }
  assert.equal(newestVerifyRun([verifyRun(SHA, "success")], SHA).conclusion, "success");
});

test("box-green stands in for verify only under its switch, from its owner, at that SHA", async () => {
  const record = {
    schema: "stackra.box-green/1",
    repo: "figentra/stackra",
    sha: SHA,
    result: "green",
    suite: "pnpm test",
    box: "box1",
    at: "2026-11-25T07:00:00Z",
  };

  const offSwitch = fakeHost({ checkRuns: [] });
  place(offSwitch, record);
  assert.equal((await deployRegistry(offSwitch)).code, 1);

  const accepted = fakeHost({ checkRuns: [], env: { STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on" } });
  place(accepted, record);
  assert.equal((await deployRegistry(accepted)).code, 0);
  assert.equal(lastLedger(accepted).verify.via, "box-green");

  const wrongSha = fakeHost({ checkRuns: [], env: { STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on" } });
  place(wrongSha, { ...record, sha: "c".repeat(40) });
  assert.equal((await deployRegistry(wrongSha)).code, 1);
  assert.match(lastLedger(wrongSha).reason, /another commit/);

  const red = fakeHost({ checkRuns: [], env: { STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on" } });
  place(red, { ...record, result: "red" });
  assert.equal((await deployRegistry(red)).code, 1);

  const selfWritten = fakeHost({
    checkRuns: [],
    env: {
      STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on",
      STACKRA_DEPLOY_BOX_GREEN_OWNER: "stackra-deploy",
    },
  });
  place(selfWritten, record);
  assert.equal((await deployRegistry(selfWritten)).code, 1);
  assert.match(lastLedger(selfWritten).reason, /deploy user/);
});

// ---- Encore: staging only ----

test("Encore production (or any app or environment but stackra-nzk2 staging) is refused in code", async () => {
  assert.throws(() => assertEncoreTarget("stackra-nzk2", "production"), /never "production"/);
  assert.throws(() => assertEncoreTarget("other-app", "staging"), /never "other-app"/);
  assert.doesNotThrow(() => assertEncoreTarget("stackra-nzk2", "staging"));
  const host = fakeHost();
  await assert.rejects(
    deployEncore(settings(host.env), host.io, {
      sha: SHA,
      environment: "production",
      trigger: "manual",
    }),
    /never "production"/,
  );
  const configured = fakeHost({ env: { STACKRA_DEPLOY_ENCORE_ENV: "production" } });
  await assert.rejects(
    deployEncore(settings(configured.env), configured.io, { sha: SHA, trigger: "manual" }),
    /never "production"/,
  );
  for (const h of [host, configured]) {
    assert.equal(h.encore.tokens, 0);
    assert.equal(h.encore.rollouts.length, 0);
    assert.equal(h.calls.length, 0);
  }
});

test("Encore staging: a rollout of the exact SHA, then /readyz 200, recorded with the rollout id", async () => {
  const host = fakeHost();
  const result = await deployEncore(settings(host.env), host.io, { sha: SHA, trigger: "manual" });
  assert.equal(result.code, 0);
  assert.deepEqual(host.encore.rollouts, [
    { id: "roll_1", app: "stackra-nzk2", env: "staging", sha: SHA },
  ]);
  const line = lastLedger(host);
  assert.equal(line.result, "success");
  assert.equal(line.env, "staging");
  assert.equal(line.rollout, "roll_1");
  assert.equal(line.sha, SHA);
  // The client secret travels only in the token request's form body.
  const tokenRequest = host.fetches.find((f) => f.url.endsWith("/api/oauth/token"));
  assert.ok(!tokenRequest.url.includes(ENCORE_SECRET));
  assert.ok(String(tokenRequest.body).includes("client_secret="));
  assertNoLeak(host);
  // Idempotent: the same SHA again does nothing.
  assert.deepEqual(
    await deployEncore(settings(host.env), host.io, { sha: SHA, trigger: "manual" }),
    { code: 0, result: "skipped" },
  );
  assert.equal(host.encore.rollouts.length, 1);
});

test("Encore staging: a /readyz that is not 200 fails and rolls back to the last good SHA", async () => {
  const host = fakeHost({ encore: { readyFor: (sha) => (sha === SHA ? 503 : 200) } });
  const s = settings(host.env);
  mkdirSync(join(s.home, "ledger"), { recursive: true });
  writeFileSync(
    join(s.home, "ledger", "deploys.jsonl"),
    `${JSON.stringify({ schema: "stackra.deploy/1", target: "encore:staging", sha: OLD_SHA, result: "success" })}\n`,
    { flag: "a" },
  );
  const result = await deployEncore(s, host.io, { sha: SHA, trigger: "timer" });
  assert.equal(result.code, 1);
  const line = lastLedger(host);
  assert.equal(line.result, "failure");
  assert.match(line.reason, /readyz answered 503/);
  assert.equal(line.rolledBack, true);
  assert.deepEqual(line.rollback, { sha: OLD_SHA, rollout: "roll_2", ready: true });
  assert.deepEqual(
    host.encore.rollouts.map((r) => r.sha),
    [SHA, OLD_SHA],
  );
});

test("Encore staging: proposed infrastructure changes stop for the owner", async () => {
  const host = fakeHost({ encore: { endFor: () => "proposed" } });
  const result = await deployEncore(settings(host.env), host.io, { sha: SHA, trigger: "manual" });
  assert.equal(result.code, 1);
  assert.equal(lastLedger(host).result, "needs-owner");
});

// ---- the Worker path ----

test("registry: the whole path, in CI's order, with gradual promotion and both versions recorded", async () => {
  const host = fakeHost({
    pending: ["0017_new.sql"],
    migrations: { "0017_new.sql": "CREATE TABLE t (a TEXT);" },
  });
  const result = await deployRegistry(host);
  assert.equal(result.code, 0, JSON.stringify(lastLedger(host)));
  assert.deepEqual(host.wrangler.deploys, [
    `${OLD}@100 ${NEW}@0`,
    `${NEW}@10 ${OLD}@90`,
    `${NEW}@100`,
  ]);
  assert.deepEqual(host.wrangler.applied, ["0017_new.sql"]);
  const line = lastLedger(host);
  assert.equal(line.schema, "stackra.deploy/1");
  assert.equal(line.result, "success");
  assert.equal(line.target, "worker:registry");
  assert.equal(line.env, "production");
  assert.equal(line.sha, SHA);
  assert.equal(line.oldVersion, OLD);
  assert.equal(line.oldSha, OLD_SHA);
  assert.equal(line.newVersion, NEW);
  assert.equal(line.mode, "auto");
  assert.equal(line.verify.via, "check-run");
  assert.deepEqual(line.trigger, { kind: "manual", by: "stackra-deploy", sudoUser: null });
  assert.equal(line.box, "box-test");
  assert.ok(line.startedAt && line.at && Number.isFinite(line.durationMs));
  assert.deepEqual(line.migrations[0].files, ["0017_new.sql"]);
  assert.deepEqual(line.sample.names, ["@stackra/cli", "@stackra/contracts", "@stackra/store"]);
  const smokes = line.steps.filter((s) => s.id.startsWith("smoke:"));
  assert.deepEqual(
    smokes.map((s) => [s.id, s.ok]),
    [
      ["smoke:0", true],
      ["smoke:10", true],
      ["smoke:100", true],
      ["smoke:live", true],
    ],
  );
  // CI's order: the build user's steps, then migrations before the upload, the upload before any traffic.
  const order = line.steps.map((s) => s.id);
  for (const [before, after] of [
    ["install", "build"],
    ["build", "gen"],
    ["gen", "build-member"],
    ["build-member", "d1-apply:stackra-registry"],
    ["d1-apply:stackra-registry", "upload"],
    ["upload", "preview"],
    ["preview", "smoke:0"],
    ["smoke:0", "promote:10"],
  ])
    assert.ok(order.indexOf(before) < order.indexOf(after), `${before} before ${after}`);
  // The ids reached wrangler's config; the binding placeholders did not.
  const upload = host.calls.find((c) => c.args.includes("upload"));
  assert.ok(upload.args.includes("REGISTRY_READ_ONLY:"));
  assertNoLeak(host);
});

test("wrangler alone gets the token, in its environment; the build user gets PATH, HOME and CI", async () => {
  const host = fakeHost();
  await deployRegistry(host);
  const wranglerCalls = host.calls.filter((c) => String(c.args[0]).endsWith("wrangler.js"));
  assert.ok(wranglerCalls.length > 5);
  for (const call of wranglerCalls) {
    assert.equal(call.env.CLOUDFLARE_API_TOKEN, CF_TOKEN);
    assert.deepEqual(Object.keys(call.env).toSorted(), [
      "CI",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN",
      "HOME",
      "NO_COLOR",
      "PATH",
      "WRANGLER_LOG_PATH",
      "WRANGLER_SEND_METRICS",
      "XDG_CONFIG_HOME",
    ]);
  }
  for (const call of host.calls.filter((c) => c.command === "sudo")) {
    const assigned = call.args.filter((a) => /^[A-Z_]+=/.test(a)).map((a) => a.split("=")[0]);
    assert.deepEqual(assigned, ["PATH", "HOME", "CI"]);
    assert.equal(call.args[2], "stackra-deploy-build");
  }
  // The render child runs with PATH only.
  const render = host.calls.find((c) => c.args[0] === "--input-type=module");
  assert.deepEqual(Object.keys(render.env), ["PATH"]);
  const placed = JSON.parse(readFileSync(join(render.cwd, "wrangler.json"), "utf8"));
  assert.equal(placed.d1_databases[0].database_id, D1_ID);
  assert.equal(placed.kv_namespaces[0].id, KV_ID);
  assert.ok(placed.main.startsWith(settings(host.env).work));
  assertNoLeak(host);
});

test("a destructive D1 migration stops for the owner: nothing applied, nothing uploaded", async () => {
  const host = fakeHost({
    pending: ["0017_ok.sql", "0018_drop.sql"],
    migrations: {
      "0017_ok.sql": "CREATE TABLE a (x TEXT);",
      "0018_drop.sql": "DROP TABLE licences;",
    },
  });
  const result = await deployRegistry(host);
  assert.equal(result.code, 1);
  const line = lastLedger(host);
  assert.equal(line.result, "needs-owner");
  assert.match(line.reason, /0018_drop.sql DROP TABLE/);
  assert.deepEqual(host.wrangler.applied, []);
  assert.equal(host.wrangler.uploads, 0);
  assert.deepEqual(host.wrangler.deploys, []);
});

test("a smoke failure at 0% rolls back before any traffic moved", async () => {
  const host = fakeHost({
    registryBreaks: (version) => new Set(version === NEW ? ["integrity"] : []),
  });
  const result = await deployRegistry(host);
  assert.equal(result.code, 1);
  assert.deepEqual(host.wrangler.deploys, [`${OLD}@100 ${NEW}@0`, `${OLD}@100`]);
  const line = lastLedger(host);
  assert.equal(line.result, "failure");
  assert.match(line.reason, /0% smoke failed: .*tarball integrity/);
  assert.equal(line.rolledBack, true);
  assert.equal(line.rollbackHealthy, true);
  assert.equal(line.newVersion, NEW);
  assert.equal(line.oldVersion, OLD);
});

test("a smoke failure at 10% puts the old version back at 100%", async () => {
  // Healthy at 0%, broken once it takes traffic.
  const host = fakeHost({
    registryBreaks: (version, w) =>
      new Set(
        version === NEW && w.deployment.some((v) => v.version === NEW && v.percent > 0)
          ? ["signature"]
          : [],
      ),
  });
  const result = await deployRegistry(host);
  assert.equal(result.code, 1);
  assert.deepEqual(host.wrangler.deploys, [
    `${OLD}@100 ${NEW}@0`,
    `${NEW}@10 ${OLD}@90`,
    `${OLD}@100`,
  ]);
  assert.match(lastLedger(host).reason, /10% smoke failed/);
  assert.equal(lastLedger(host).rolledBack, true);
});

test("a failed promotion step rolls back too", async () => {
  const host = fakeHost({ deployFails: 100 });
  const result = await deployRegistry(host);
  assert.equal(result.code, 1);
  assert.equal(host.wrangler.deploys.at(-1), `${OLD}@100`);
  assert.match(lastLedger(host).reason, /promote to 100% failed/);
});

test("approve mode waits after the 0% smoke, then promotes on the approver's file", async () => {
  const host = fakeHost({ env: { STACKRA_DEPLOY_PROMOTION: "registry=approve" } });
  const s = settings(host.env);
  const first = await deployRegistry(host);
  assert.deepEqual(first, { code: 0, result: "awaiting-approval" });
  assert.deepEqual(host.wrangler.deploys, [`${OLD}@100 ${NEW}@0`]);
  assert.equal(lastLedger(host).result, "awaiting-approval");
  const lines = readLedger(s, host.io).length;

  // Still no approval: no traffic moves and no new ledger line.
  assert.deepEqual(await deployRegistry(host), { code: 0, result: "awaiting-approval" });
  assert.equal(readLedger(s, host.io).length, lines);
  assert.equal(host.wrangler.uploads, 1);

  // The deploy user cannot approve itself.
  assert.throws(
    () => writeApproval(s, host.io, { worker: "registry", sha: SHA, version: NEW }),
    /approver user/,
  );
  // An approval of another version does not count.
  writeApproval(
    s,
    { ...host.io, user: "approver" },
    { worker: "registry", sha: SHA, version: OLD },
  );
  assert.deepEqual(await deployRegistry(host), { code: 0, result: "awaiting-approval" });
  writeApproval(
    s,
    { ...host.io, user: "approver" },
    { worker: "registry", sha: SHA, version: NEW },
  );
  const approved = await deployRegistry(host);
  assert.equal(approved.code, 0);
  assert.equal(
    host.wrangler.uploads,
    1,
    "the approved version is the one smoke-tested, not a new upload",
  );
  assert.deepEqual(host.wrangler.deploys.slice(-2), [`${NEW}@10 ${OLD}@90`, `${NEW}@100`]);
  const line = lastLedger(host);
  assert.equal(line.result, "success");
  assert.equal(line.approval.by, "approver");
});

test("a re-run is idempotent: a Worker that serves the SHA is left alone", async () => {
  const host = fakeHost({ oldMessage: SHA });
  assert.deepEqual(await deployRegistry(host), { code: 0, result: "skipped" });
  assert.equal(host.wrangler.uploads, 0);
  assert.deepEqual(host.wrangler.deploys, []);
});

test("a deployment that is already split is the owner's", async () => {
  const host = fakeHost();
  host.wrangler.deployment = [
    { version: OLD, percent: 50 },
    { version: "00000000-0000-4000-8000-000000000009", percent: 50 },
  ];
  assert.equal((await deployRegistry(host)).code, 1);
  assert.equal(lastLedger(host).result, "needs-owner");
});

test("a Worker that is not a runway member is refused (edge today)", async () => {
  const host = fakeHost();
  const result = await deployWorker(settings(host.env), host.io, {
    worker: "edge",
    sha: SHA,
    trigger: "manual",
  });
  assert.equal(result.code, 1);
  assert.match(lastLedger(host).reason, /not a runway.yaml member/);
});

test("a build failure fails the deploy before any credential is read or version uploaded", async () => {
  const host = fakeHost({
    buildFails: "pnpm turbo run gen --filter=@figentra/worker-registry --only",
  });
  assert.equal((await deployRegistry(host)).code, 1);
  assert.equal(lastLedger(host).step, "gen");
  assert.ok(!host.calls.some((c) => String(c.args[0]).endsWith("wrangler.js")));
});

// ---- parity with CI ----

test("parity: the box plan is the caller workflow's and runway-cloudflare-workers.yml's steps", () => {
  const root = parse(repoFile("runway.yaml"));
  const provider = parse(repoFile(PROVIDER_WORKFLOW));
  const steps = Object.fromEntries(
    provider.jobs.deploy.steps.map((step) => [step.name, step.run ?? ""]),
  );
  // The steps the box reproduces, as the reusable workflow runs them.
  assert.match(steps["Release commit"], /git merge-base --is-ancestor "\$sha" origin\/main/);
  assert.match(steps["Install dependencies"], /pnpm install \$INSTALL_ARGS/);
  assert.match(steps.Build, /cli=\(--filter=@stackra\/cli\.\.\.\)/);
  assert.match(steps.Build, /pnpm turbo run build --filter="\$PACKAGE\^\.\.\." "\$\{cli\[@\]\}"/);
  assert.match(steps.Build, /pnpm turbo run gen --filter="\$PACKAGE" --only/);
  assert.match(
    steps["Deploy (Runway)"],
    /deploy --env production --kind web --member "\$MEMBER" --sha "\$SHA"/,
  );
  // Runway's driver: build the member, migrate D1 remotely, then upload with the SHA as the message.
  const driver = repoFile(RUNWAY_DRIVER);
  assert.match(driver, /\["turbo", "run", "build", `--filter=\.\/\$\{member\.path\}`\]/);
  assert.match(driver, /\[\.\.\.WRANGLER, "d1", "migrations", "apply", database, "--remote"\]/);
  assert.match(driver, /"versions", "upload"\]\),\s*"--message",\s*sha/);
  assert.match(driver, /replaceAll\(`"\$\{placeholder\}"`, `"\$\{this\.env\[name\] \?\? ""\}"`\)/);

  for (const worker of ["registry", "static", "turbo-cache"]) {
    const workflow = root.targets["cloudflare-workers"].workflows[worker];
    const caller = callerInputs(parse(repoFile(`.github/workflows/${workflow}`)));
    assert.equal(caller.member, worker);
    const member = root.targets["cloudflare-workers"].members[worker];
    const plan = workerPlan({ worker, sha: SHA, root, caller, steps: [10, 100], mode: "auto" });
    const byId = Object.fromEntries(plan.map((p) => [p.id, p]));
    assert.deepEqual(byId.install.args, ["install", ...caller.installArgs]);
    assert.deepEqual(byId.build.args, [
      "turbo",
      "run",
      "build",
      `--filter=${caller.package}^...`,
      "--filter=@stackra/cli...",
    ]);
    assert.deepEqual(byId.gen.args, [
      "turbo",
      "run",
      "gen",
      `--filter=${caller.package}`,
      "--only",
    ]);
    assert.deepEqual(byId["build-member"].args, [
      "turbo",
      "run",
      "build",
      `--filter=./${member.path}`,
    ]);
    for (const database of member.d1 ?? [])
      assert.deepEqual(byId[`d1-apply:${database}`].wrangler, [
        "d1",
        "migrations",
        "apply",
        database,
        "--remote",
      ]);
    assert.deepEqual(byId.upload.wrangler.slice(0, 4), ["versions", "upload", "--message", SHA]);
    // Every variable the workflow exports is a var or id the box reads from its vars file.
    for (const name of caller.vars)
      assert.ok(
        (member.vars ?? []).includes(name) || Object.keys(member.ids ?? {}).includes(name),
        name,
      );
    const order = plan.map((p) => p.id);
    assert.deepEqual(order.slice(0, 6), [
      "main-only",
      "verify",
      "install",
      "build",
      "gen",
      "build-member",
    ]);
    for (const database of member.d1 ?? [])
      assert.ok(order.indexOf(`d1-apply:${database}`) < order.indexOf("upload"));
    assert.deepEqual(order.slice(order.indexOf("upload")), [
      "upload",
      "preview",
      "smoke:0",
      "promote:10",
      "smoke:10",
      "promote:100",
      "smoke:100",
    ]);
  }
  const registry = callerInputs(parse(repoFile(".github/workflows/deploy-registry.yml")));
  assert.deepEqual(registry.vars, [
    "REGISTRY_D1_DATABASE_ID",
    "REGISTRY_KV_NAMESPACE_ID",
    "REGISTRY_READ_ONLY",
  ]);
  assert.deepEqual(registry.installArgs, [
    "--frozen-lockfile",
    "--filter=!@figentra/mobile",
    "--filter=!@figentra/playground",
  ]);
});

test("the id swap and the placed config match runway's driver: quoted placeholders, absolute paths", () => {
  const member = { path: "workers/registry", ids: { A_ID: "0000" } };
  assert.equal(swapIds('{ "id": "0000" }', member, { A_ID: "abc-123" }), '{ "id": "abc-123" }');
  assert.throws(() => swapIds('{ "id": "0000" }', member, {}), /not set to a binding id/);
  assert.throws(() => swapIds('{ "id": "0000" }', member, { A_ID: 'x", "y' }), /binding id/);
  assert.throws(() => swapIds('{ "id": "1111" }', member, { A_ID: "abc" }), /has no "0000"/);
  assert.deepEqual(JSON.parse(stripJsonc('// c\n{ "a": "//not", /* b */ "c": [1,], }')), {
    a: "//not",
    c: [1],
  });
  const placed = placeConfig(
    {
      name: "w",
      main: "./dist/main.mjs",
      d1_databases: [{ database_name: "d" }],
      assets: { directory: "public" },
    },
    "/t/workers/w",
    ACCOUNT,
  );
  assert.equal(placed.main, "/t/workers/w/dist/main.mjs");
  assert.equal(placed.d1_databases[0].migrations_dir, "/t/workers/w/migrations");
  assert.equal(placed.assets.directory, "/t/workers/w/public");
  assert.equal(placed.account_id, ACCOUNT);
  assert.throws(() => placeConfig({ migrations: [] }, "/t", ACCOUNT), /Durable Object/);
  assert.throws(() => placeConfig({ account_id: "f".repeat(32) }, "/t", ACCOUNT), /not d861/);
});

// ---- the trigger ----

test("the trigger: the Worker's closure from the lockfile importers", () => {
  const importers = {
    ".": { devDependencies: { turbo: { version: "2.9.0" } } },
    "workers/registry": {
      dependencies: {
        "@stackra/contracts": { version: "link:../../packages/foundation/contracts" },
      },
      devDependencies: { wrangler: { version: "4.148.0" } },
    },
    "packages/foundation/contracts": {
      dependencies: { "@stackra/zod-extras": { version: "link:../zod-extras" } },
    },
    "packages/foundation/zod-extras": {},
    "packages/state/store": {},
  };
  assert.deepEqual([...workspaceClosure(importers, "workers/registry")].toSorted(), [
    "packages/foundation/contracts",
    "packages/foundation/zod-extras",
    "workers/registry",
  ]);
  const closure = workspaceClosure(importers, "workers/registry");
  const touched = (changed, after = importers) =>
    workerTouched({
      changed,
      closure,
      workflow: "deploy-registry.yml",
      beforeImporters: importers,
      afterImporters: after,
    }).touched;
  assert.equal(touched(["packages/foundation/zod-extras/src/index.ts"]), true);
  assert.equal(touched(["workers/registry/migrations/0017.sql"]), true);
  assert.equal(touched([".github/workflows/deploy-registry.yml"]), true);
  assert.equal(touched(["runway.yaml"]), true);
  assert.equal(
    touched(["packages/state/store/src/index.ts", "apps/docs/x.mdx", "workers/static/src/a.ts"]),
    false,
  );
  const bumped = structuredClone(importers);
  bumped["workers/registry"].devDependencies.wrangler.version = "4.149.0";
  assert.equal(touched(["pnpm-lock.yaml"], bumped), true);
  const elsewhere = structuredClone(importers);
  elsewhere["packages/state/store"] = { dependencies: { zod: { version: "5.0.0" } } };
  assert.equal(touched(["pnpm-lock.yaml"], elsewhere), false);
});

test("the timer deploys a touched Worker at main's head only with a recorded first deploy and a green verify", async () => {
  const host = fakeHost({ head: SHA, changed: ["workers/registry/src/index.ts"] });
  const s = settings({ ...host.env, STACKRA_DEPLOY_ENCORE: "off" });
  // No recorded deploy yet: nothing runs by timer.
  assert.deepEqual(await plannedRuns(s, host.io), []);
  mkdirSync(join(s.home, "ledger"), { recursive: true });
  writeFileSync(
    join(s.home, "ledger", "deploys.jsonl"),
    `${JSON.stringify({ schema: "stackra.deploy/1", target: "worker:registry", sha: OLD_SHA, result: "success" })}\n`,
    { flag: "a" },
  );
  assert.deepEqual(await plannedRuns(s, host.io), [
    {
      target: "worker-registry",
      args: ["workers", "run", "--worker", "registry", "--sha", SHA, "--trigger", "timer"],
    },
  ]);
  const red = fakeHost({
    head: SHA,
    changed: ["workers/registry/src/index.ts"],
    checkRuns: [verifyRun(SHA, "failure")],
  });
  const sRed = settings({ ...red.env, STACKRA_DEPLOY_ENCORE: "off" });
  mkdirSync(join(sRed.home, "ledger"), { recursive: true });
  writeFileSync(
    join(sRed.home, "ledger", "deploys.jsonl"),
    `${JSON.stringify({ target: "worker:registry", sha: OLD_SHA, result: "success" })}\n`,
  );
  assert.deepEqual(await plannedRuns(sRed, red.io), []);
  const untouched = fakeHost({ head: SHA, changed: ["apps/docs/index.mdx"] });
  const sUntouched = settings({ ...untouched.env, STACKRA_DEPLOY_ENCORE: "off" });
  mkdirSync(join(sUntouched.home, "ledger"), { recursive: true });
  writeFileSync(
    join(sUntouched.home, "ledger", "deploys.jsonl"),
    `${JSON.stringify({ target: "worker:registry", sha: OLD_SHA, result: "success" })}\n`,
  );
  assert.deepEqual(await plannedRuns(sUntouched, untouched.io), []);
});

test("a version waiting for approval is looked at again each pass, even after main moved on", async () => {
  const host = fakeHost({ head: "c".repeat(40), changed: [] });
  const s = settings({ ...host.env, STACKRA_DEPLOY_ENCORE: "off" });
  mkdirSync(join(s.home, "state"), { recursive: true });
  writeFileSync(
    join(s.home, "state", "worker-registry.json"),
    JSON.stringify({ sha: SHA, oldVersion: OLD, newVersion: NEW, phase: "awaiting-approval" }),
  );
  assert.deepEqual(await plannedRuns(s, host.io), [
    {
      target: "worker-registry",
      args: ["workers", "run", "--worker", "registry", "--sha", SHA, "--trigger", "timer"],
    },
  ]);
});

test("the lockfile's workspace importers come from pnpm 12's second document", () => {
  const importers = lockImporters(
    [
      "---",
      "lockfileVersion: '9.0'",
      "importers:",
      "  .:",
      "    packageManagerDependencies:",
      "      pnpm: { specifier: 12.16.1, version: 12.16.1 }",
      "packages:",
      "  pnpm@12.16.1: {}",
      "---",
      "lockfileVersion: '9.0'",
      "settings:",
      "  autoInstallPeers: true",
      "importers:",
      "  .: {}",
      "  workers/registry:",
      "    devDependencies:",
      "      wrangler: { specifier: 'catalog:deploy', version: 4.148.0(@types/node@26.6.4) }",
      "packages:",
      "  wrangler@4.148.0: {}",
    ].join("\n"),
  );
  assert.deepEqual(Object.keys(importers), [".", "workers/registry"]);
  // The repository's own lockfile parses, and registry's closure reaches workspace packages.
  const real = lockImporters(readFileSync(join(REPO_ROOT, "pnpm-lock.yaml"), "utf8"));
  const closure = workspaceClosure(real, "workers/registry");
  assert.ok(closure.size > 1);
  assert.ok([...closure].every((path) => real[path] !== undefined));
});
