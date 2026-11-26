/**
 * Stackra file contract:
 * Purpose: hold the box deploy service (stackra-deploy.mjs, ADR 0536, STA-2783, STA-2784) to its contract on a fake
 *          box: built OFF (a switch that is not exactly "on" refuses, a dry run plans), main SHAs only, a green
 *          stackra/verify from the verify App at that SHA (box-green only under its switch and from its owner), Encore
 *          staging only (any other environment refused before any API call, every call recorded with its
 *          environment) and the daily production audit, only Stackra's own Workers in the Stackra account on its own
 *          domain (the shared services and the main account refused), D1 migrations additive only, the version at 0%
 *          before any traffic, the smoke with its version proof at every step (the false pass fails) and rollback on
 *          a failure, the 10% → 50% → 100% promotion, approve mode waiting for the approver's file, an idempotent
 *          re-run, the ledger's contents, and no secret in an argv, a child's environment beyond wrangler's, an output
 *          or the ledger. The parity test parses the caller workflows and runway-cloudflare-workers.yml and compares
 *          their steps with the box's plan.
 * Boundary: fakes only (__fixtures__/fake-deploy-host.mjs); no network, git, sudo or wrangler runs.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0536; ADR 0468; STA-2783.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  assertEncoreTarget,
  auditEncore,
  callerInputs,
  clearSecrets,
  deployEncore,
  deployWorker,
  ENCORE_API,
  encoreClient,
  foreignHosts,
  GITHUB_API,
  heldAttempt,
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
  serviceUpdate,
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
  DOCS_HOST,
  ENCORE_SECRET,
  ENCORE_TOKEN,
  INFISICAL_SECRET,
  INFISICAL_TOKEN,
  PIN,
  host: fakeHost,
  MAIN_ACCOUNT,
  NEW,
  OLD,
  OLD_SHA,
  REPO_ROOT,
  SHA,
  verifyRun,
} = fakeDeployHost;

const SECRETS = [CF_TOKEN, ENCORE_SECRET, ENCORE_TOKEN, INFISICAL_SECRET, INFISICAL_TOKEN];
const repoFile = (path) => readFileSync(join(REPO_ROOT, path), "utf8");

beforeEach(() => clearSecrets());

/** A fake box as the Encore path's own user (stackra-deploy-encore). */
const encoreHost = (options = {}) => fakeHost({ as: "encore", ...options });

const deployDocs = async (host, extra = {}) =>
  deployWorker(settings(host.env), host.io, {
    worker: "docs",
    sha: SHA,
    trigger: "manual",
    ...extra,
  });

/** Writes a box-green record for SHA as its owner would. */
const place = (host, doc) =>
  writeFileSync(join(host.boxGreen, `${SHA}.json`), JSON.stringify(doc), { mode: 0o644 });

const lastLedger = (host) => readLedger(settings(host.env), host.io).at(-1);

/** The environment of the first wrangler call. */
const call0Env = (host) => host.calls.find((c) => String(c.args[0]).endsWith("wrangler.js")).env;

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
  assert.deepEqual(parseArgs(["workers", "run", "--worker", "docs", "--sha", SHA]), {
    verb: "run",
    target: "workers",
    worker: "docs",
    sha: SHA,
    dryRun: false,
    trigger: "manual",
  });
  assert.equal(parseArgs(["encore", "run", "--sha", SHA, "--dry-run"]).dryRun, true);
  // The shared services are CI's: the box takes no registry, turbo-cache or static.
  for (const shared of ["registry", "turbo-cache", "static", "landing"])
    assert.equal(parseArgs(["workers", "run", "--worker", shared, "--sha", SHA]), null, shared);
  assert.equal(parseArgs(["workers", "run", "--worker", "docs", "--sha", "abc"]), null);
  assert.deepEqual(parseArgs(["encore", "audit"]), {
    verb: "audit",
    target: "encore",
    dryRun: false,
    trigger: "manual",
  });
  assert.equal(parseArgs(["encore", "audit", "--sha", SHA]), null);
  assert.equal(parseArgs(["encore", "run", "--sha", SHA, "--worker", "registry"]), null);
  assert.equal(parseArgs(["approve", "--worker", "docs", "--sha", SHA, "--version", "x"]), null);
  assert.equal(
    parseArgs(["approve", "--worker", "docs", "--sha", SHA, "--version", NEW]).verb,
    "approve",
  );
  assert.equal(parseArgs(["deploy"]), null);
  assert.equal(parseArgs(["once", "--sha", SHA]), null);
  // Each path user runs its own timer pass, and the service unit pins its code first.
  assert.equal(parseArgs(["once", "encore"]).target, "encore");
  assert.equal(parseArgs(["once", "workers", "--dry-run"]).dryRun, true);
  assert.equal(parseArgs(["service", "update"]).verb, "service-update");
  assert.equal(parseArgs(["service", "update", "--sha", SHA]), null);
  assert.equal(parseArgs(["service", "pull"]), null);
});

test("switches: only exactly on is on; promotion defaults to auto; steps are CI's 10, 50, 100", () => {
  assert.equal(switchOf(undefined), "off");
  assert.equal(switchOf("on"), "on");
  assert.equal(switchOf("ON"), "invalid");
  assert.equal(switchOf("true"), "invalid");
  assert.deepEqual(parsePromotion(undefined), { docs: "auto", edge: "auto" });
  assert.equal(parsePromotion("edge=approve").edge, "approve");
  assert.equal(parsePromotion("registry=auto"), null);
  assert.equal(parsePromotion("docs=manual"), null);
  assert.deepEqual(parseSteps(undefined), [10, 50, 100]);
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
  const result = await deployDocs(off);
  assert.equal(result.code, 1);
  assert.equal(lastLedger(off).result, "refused");
  assert.match(lastLedger(off).reason, /STACKRA_DEPLOY_WORKERS is not on/);
  assert.equal(off.calls.length, 0, "nothing ran");
  const typo = fakeHost({ env: { STACKRA_DEPLOY_WORKERS: "yes" } });
  assert.match(
    preflightProblems(settings(typo.env), typo.io, "workers").join(";"),
    /exactly "on" or "off"/,
  );
  const encoreOff = encoreHost({ env: { STACKRA_DEPLOY_ENCORE: "off" } });
  assert.equal(
    (await deployEncore(settings(encoreOff.env), encoreOff.io, { sha: SHA, trigger: "manual" }))
      .code,
    1,
  );
  assert.equal(encoreOff.encore.rollouts.length, 0);
});

test("a dry run plans with the switch off and changes nothing", async () => {
  const host = fakeHost({ env: { STACKRA_DEPLOY_WORKERS: "off" } });
  const result = await deployDocs(host, { dryRun: true });
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
  const encore = encoreHost();
  assert.deepEqual(preflightProblems(settings(encore.env), encore.io, "encore"), []);
  const asBuild = { ...host.io, user: "build" };
  assert.match(preflightProblems(s, asBuild, "workers").join(";"), /never build/);
  const loose = { ...host.io, lstat: (p) => ({ ...host.io.lstat(p), mode: 0o440 }) };
  assert.match(
    preflightProblems(s, loose, "workers").join(";"),
    /CLOUDFLARE_TOKEN_FILE .* must be mode 0400/,
  );
  const foreign = { ...encore.io, lstat: (p) => ({ ...encore.io.lstat(p), uid: 1 }) };
  assert.match(
    preflightProblems(settings(encore.env), foreign, "encore").join(";"),
    /not owned by the deploy user/,
  );
  assert.match(
    preflightProblems(
      settings({ ...host.env, STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID: MAIN_ACCOUNT }),
      host.io,
      "workers",
    ).join(";"),
    /names the main account: the box never deploys there/,
  );
  assert.match(
    preflightProblems(
      settings({ ...host.env, STACKRA_DEPLOY_STACKRA_DOMAIN: "" }),
      host.io,
      "workers",
    ).join(";"),
    /STACKRA_DEPLOY_STACKRA_DOMAIN/,
  );
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
        STACKRA_DEPLOY_PROMOTION: "docs=approve",
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
  const result = await deployDocs(host);
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
    const result = await deployDocs(host);
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
  assert.equal((await deployDocs(offSwitch)).code, 1);

  const accepted = fakeHost({ checkRuns: [], env: { STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on" } });
  place(accepted, record);
  assert.equal((await deployDocs(accepted)).code, 0);
  assert.equal(lastLedger(accepted).verify.via, "box-green");

  const wrongSha = fakeHost({ checkRuns: [], env: { STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on" } });
  place(wrongSha, { ...record, sha: "c".repeat(40) });
  assert.equal((await deployDocs(wrongSha)).code, 1);
  assert.match(lastLedger(wrongSha).reason, /another commit/);

  const red = fakeHost({ checkRuns: [], env: { STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on" } });
  place(red, { ...record, result: "red" });
  assert.equal((await deployDocs(red)).code, 1);

  const selfWritten = fakeHost({
    checkRuns: [],
    env: {
      STACKRA_DEPLOY_ACCEPT_BOX_GREEN: "on",
      STACKRA_DEPLOY_BOX_GREEN_OWNER: "stackra-deploy",
    },
  });
  place(selfWritten, record);
  assert.equal((await deployDocs(selfWritten)).code, 1);
  assert.match(lastLedger(selfWritten).reason, /deploy user/);
});

// ---- Encore: staging only ----

test("Encore production (or any app or environment but stackra-nzk2 staging) is refused in code", async () => {
  assert.throws(() => assertEncoreTarget("stackra-nzk2", "production"), /never "production"/);
  assert.throws(() => assertEncoreTarget("other-app", "staging"), /never "other-app"/);
  assert.doesNotThrow(() => assertEncoreTarget("stackra-nzk2", "staging"));
  const host = encoreHost();
  await assert.rejects(
    deployEncore(settings(host.env), host.io, {
      sha: SHA,
      environment: "production",
      trigger: "manual",
    }),
    /never "production"/,
  );
  const configured = encoreHost({ env: { STACKRA_DEPLOY_ENCORE_ENV: "production" } });
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
  const host = encoreHost();
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
  const host = encoreHost({ encore: { readyFor: (sha) => (sha === SHA ? 503 : 200) } });
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
  const host = encoreHost({ encore: { endFor: () => "proposed" } });
  const result = await deployEncore(settings(host.env), host.io, { sha: SHA, trigger: "manual" });
  assert.equal(result.code, 1);
  assert.equal(lastLedger(host).result, "needs-owner");
});

// ---- the Worker path ----

test("docs: the whole path, in CI's order, 10% → 50% → 100%, both versions and the proof recorded", async () => {
  const host = fakeHost({
    d1: true,
    pending: ["0017_new.sql"],
    migrations: { "0017_new.sql": "CREATE TABLE t (a TEXT);" },
  });
  const result = await deployDocs(host);
  assert.equal(result.code, 0, JSON.stringify(lastLedger(host)));
  assert.deepEqual(host.wrangler.deploys, [
    `${OLD}@100 ${NEW}@0`,
    `${NEW}@10 ${OLD}@90`,
    `${NEW}@50 ${OLD}@50`,
    `${NEW}@100`,
  ]);
  assert.deepEqual(host.wrangler.applied, ["0017_new.sql"]);
  const line = lastLedger(host);
  assert.equal(line.schema, "stackra.deploy/1");
  assert.equal(line.result, "success");
  assert.equal(line.target, "worker:docs");
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
  const smokes = line.steps.filter((s) => s.id.startsWith("smoke:"));
  assert.deepEqual(
    smokes.map((s) => [s.id, s.ok]),
    [
      ["smoke:0", true],
      ["smoke:10", true],
      ["smoke:50", true],
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
    ["build-member", "d1-apply:stackra-docs-db"],
    ["d1-apply:stackra-docs-db", "upload"],
    ["upload", "preview"],
    ["preview", "smoke:0"],
    ["smoke:0", "promote:10"],
    ["promote:10", "promote:50"],
  ])
    assert.ok(order.indexOf(before) < order.indexOf(after), `${before} before ${after}`);
  // Every docs request of a version smoke reached /-/version of the version under test.
  assertNoLeak(host);
});

test("the false pass: an override that does not reach the new version fails at 0% and rolls back", async () => {
  // Cloudflare ignores an override for a version that is not in the deployment; the old one answers every check.
  const host = fakeHost({ ignoreOverride: () => true });
  const result = await deployDocs(host);
  assert.equal(result.code, 1);
  const line = lastLedger(host);
  assert.match(line.reason, /0% smoke failed: version proof/);
  assert.deepEqual(host.wrangler.deploys, [`${OLD}@100 ${NEW}@0`, `${OLD}@100`]);
  const zero = line.steps.find((s) => s.id === "smoke:0");
  assert.deepEqual(
    zero.failed.map((f) => f.name),
    ["version proof", "version proof"],
  );
  assert.equal(line.rolledBack, true);
});

test("only Stackra's own Workers, in the Stackra account, on Stackra's domain", async () => {
  const mainAccount = fakeHost({ account: MAIN_ACCOUNT });
  assert.equal((await deployDocs(mainAccount)).code, 1);
  assert.match(lastLedger(mainAccount).reason, /names account d861.*not the Stackra account/);
  assert.ok(!mainAccount.calls.some((c) => String(c.args[0]).endsWith("wrangler.js")));
  const noAccount = fakeHost({ account: null });
  assert.equal((await deployDocs(noAccount)).code, 1);
  assert.match(lastLedger(noAccount).reason, /names account none/);
  const foreign = fakeHost({ foreignHost: true });
  assert.equal((await deployDocs(foreign)).code, 1);
  assert.match(
    lastLedger(foreign).reason,
    /must answer on stackra.test only, not docs.stackra.figentra.com/,
  );
  assert.ok(!foreign.calls.some((c) => c.command === "sudo"), "refused before the build");
  for (const shared of ["registry", "turbo-cache", "static"]) {
    const host = fakeHost();
    const r = await deployWorker(settings(host.env), host.io, {
      worker: shared,
      sha: SHA,
      trigger: "manual",
    });
    assert.equal(r.code, 1, shared);
    assert.match(lastLedger(host).reason, /not a box Worker/);
  }
  assert.deepEqual(
    foreignHosts({ customDomains: [DOCS_HOST, "stackra.test", "x.figentra.com"] }, "stackra.test"),
    ["x.figentra.com"],
  );
});

test("wrangler alone gets the token, in its environment; the build user gets PATH, HOME and CI", async () => {
  const host = fakeHost({ d1: true });
  await deployDocs(host);
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
  assert.equal(placed.account_id, ACCOUNT);
  assert.equal(call0Env(host).CLOUDFLARE_ACCOUNT_ID, ACCOUNT);
  assert.ok(placed.main.startsWith(settings(host.env).work));
  assertNoLeak(host);
});

test("a destructive D1 migration stops for the owner: nothing applied, nothing uploaded", async () => {
  const host = fakeHost({
    d1: true,
    pending: ["0017_ok.sql", "0018_drop.sql"],
    migrations: {
      "0017_ok.sql": "CREATE TABLE a (x TEXT);",
      "0018_drop.sql": "DROP TABLE licences;",
    },
  });
  const result = await deployDocs(host);
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
    docsBreaks: (version) => new Set(version === NEW ? ["asset"] : []),
  });
  const result = await deployDocs(host);
  assert.equal(result.code, 1);
  assert.deepEqual(host.wrangler.deploys, [`${OLD}@100 ${NEW}@0`, `${OLD}@100`]);
  const line = lastLedger(host);
  assert.equal(line.result, "failure");
  assert.match(line.reason, /0% smoke failed: .*docs asset/);
  assert.equal(line.rolledBack, true);
  assert.equal(line.rollbackHealthy, true);
  assert.equal(line.newVersion, NEW);
  assert.equal(line.oldVersion, OLD);
});

test("a smoke failure at 10% puts the old version back at 100%", async () => {
  // Healthy at 0%, broken once it takes traffic.
  const host = fakeHost({
    docsBreaks: (version, w) =>
      new Set(
        version === NEW && w.deployment.some((v) => v.version === NEW && v.percent > 0)
          ? ["redirect"]
          : [],
      ),
  });
  const result = await deployDocs(host);
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
  const result = await deployDocs(host);
  assert.equal(result.code, 1);
  assert.equal(host.wrangler.deploys.at(-1), `${OLD}@100`);
  assert.match(lastLedger(host).reason, /promote to 100% failed/);
});

test("approve mode waits after the 0% smoke, then promotes on the approver's file", async () => {
  const host = fakeHost({ env: { STACKRA_DEPLOY_PROMOTION: "docs=approve" } });
  const s = settings(host.env);
  const first = await deployDocs(host);
  assert.deepEqual(first, { code: 0, result: "awaiting-approval" });
  assert.deepEqual(host.wrangler.deploys, [`${OLD}@100 ${NEW}@0`]);
  assert.equal(lastLedger(host).result, "awaiting-approval");
  const lines = readLedger(s, host.io).length;

  // Still no approval: no traffic moves and no new ledger line.
  assert.deepEqual(await deployDocs(host), { code: 0, result: "awaiting-approval" });
  assert.equal(readLedger(s, host.io).length, lines);
  assert.equal(host.wrangler.uploads, 1);

  // The deploy user cannot approve itself.
  assert.throws(
    () => writeApproval(s, host.io, { worker: "docs", sha: SHA, version: NEW }),
    /approver user/,
  );
  // An approval of another version does not count.
  writeApproval(s, { ...host.io, user: "approver" }, { worker: "docs", sha: SHA, version: OLD });
  assert.deepEqual(await deployDocs(host), { code: 0, result: "awaiting-approval" });
  writeApproval(s, { ...host.io, user: "approver" }, { worker: "docs", sha: SHA, version: NEW });
  const approved = await deployDocs(host);
  assert.equal(approved.code, 0);
  assert.equal(
    host.wrangler.uploads,
    1,
    "the approved version is the one smoke-tested, not a new upload",
  );
  assert.deepEqual(host.wrangler.deploys.slice(-3), [
    `${NEW}@10 ${OLD}@90`,
    `${NEW}@50 ${OLD}@50`,
    `${NEW}@100`,
  ]);
  const line = lastLedger(host);
  assert.equal(line.result, "success");
  assert.equal(line.approval.by, "approver");
});

test("a re-run is idempotent: a Worker that serves the SHA is left alone", async () => {
  const host = fakeHost({ oldMessage: SHA });
  assert.deepEqual(await deployDocs(host), { code: 0, result: "skipped" });
  assert.equal(host.wrangler.uploads, 0);
  assert.deepEqual(host.wrangler.deploys, []);
});

test("a deployment that is already split is the owner's", async () => {
  const host = fakeHost();
  host.wrangler.deployment = [
    { version: OLD, percent: 50 },
    { version: "00000000-0000-4000-8000-000000000009", percent: 50 },
  ];
  assert.equal((await deployDocs(host)).code, 1);
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
    buildFails: "pnpm turbo run gen --filter=@figentra/docs --only",
  });
  assert.equal((await deployDocs(host)).code, 1);
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

  // Mandatory for every Worker the box deploys (BOX_WORKERS with a caller workflow: docs today); the same plan
  // generator is held to the shared services' workflows too, so CI can reuse it.
  for (const worker of ["docs", "registry", "static", "turbo-cache"]) {
    const workflow = root.targets["cloudflare-workers"].workflows[worker];
    const caller = callerInputs(parse(repoFile(`.github/workflows/${workflow}`)));
    assert.equal(caller.member, worker);
    const member = root.targets["cloudflare-workers"].members[worker];
    const plan = workerPlan({ worker, sha: SHA, root, caller, steps: [10, 50, 100], mode: "auto" });
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
      "promote:50",
      "smoke:50",
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
      account_id: ACCOUNT,
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
  assert.throws(
    () => placeConfig({ account_id: MAIN_ACCOUNT }, "/t", ACCOUNT),
    /names account d861.*not the Stackra account/,
  );
  assert.throws(() => placeConfig({}, "/t", ACCOUNT), /names account none/);
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
  const host = fakeHost({ head: SHA, changed: ["apps/docs/src/docs/index.mdx"] });
  const s = settings({ ...host.env, STACKRA_DEPLOY_ENCORE: "off" });
  // No recorded deploy yet: nothing runs by timer.
  assert.deepEqual(await plannedRuns(s, host.io), []);
  mkdirSync(join(s.home, "ledger"), { recursive: true });
  writeFileSync(
    join(s.home, "ledger", "deploys.jsonl"),
    `${JSON.stringify({ schema: "stackra.deploy/1", target: "worker:docs", sha: OLD_SHA, result: "success" })}\n`,
    { flag: "a" },
  );
  assert.deepEqual(await plannedRuns(s, host.io), [
    {
      target: "worker-docs",
      args: ["workers", "run", "--worker", "docs", "--sha", SHA, "--trigger", "timer"],
    },
  ]);
  const red = fakeHost({
    head: SHA,
    changed: ["apps/docs/src/docs/index.mdx"],
    checkRuns: [verifyRun(SHA, "failure")],
  });
  const sRed = settings({ ...red.env, STACKRA_DEPLOY_ENCORE: "off" });
  mkdirSync(join(sRed.home, "ledger"), { recursive: true });
  writeFileSync(
    join(sRed.home, "ledger", "deploys.jsonl"),
    `${JSON.stringify({ target: "worker:docs", sha: OLD_SHA, result: "success" })}\n`,
  );
  assert.deepEqual(await plannedRuns(sRed, red.io), []);
  const untouched = fakeHost({ head: SHA, changed: ["workers/registry/src/index.ts"] });
  const sUntouched = settings({ ...untouched.env, STACKRA_DEPLOY_ENCORE: "off" });
  mkdirSync(join(sUntouched.home, "ledger"), { recursive: true });
  writeFileSync(
    join(sUntouched.home, "ledger", "deploys.jsonl"),
    `${JSON.stringify({ target: "worker:docs", sha: OLD_SHA, result: "success" })}\n`,
  );
  assert.deepEqual(await plannedRuns(sUntouched, untouched.io), []);
});

test("a version waiting for approval is looked at again each pass, even after main moved on", async () => {
  const host = fakeHost({ head: "c".repeat(40), changed: [] });
  const s = settings({ ...host.env, STACKRA_DEPLOY_ENCORE: "off" });
  mkdirSync(join(s.home, "state"), { recursive: true });
  writeFileSync(
    join(s.home, "state", "worker-docs.json"),
    JSON.stringify({ sha: SHA, oldVersion: OLD, newVersion: NEW, phase: "awaiting-approval" }),
  );
  assert.deepEqual(await plannedRuns(s, host.io), [
    {
      target: "worker-docs",
      args: ["workers", "run", "--worker", "docs", "--sha", SHA, "--trigger", "timer"],
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

// ---- Encore: the environment allowlist and the daily audit ----

test("Encore: a deploy to any environment but staging is refused before any API call, the token mint included", async () => {
  const host = encoreHost();
  const s = settings(host.env);
  const calls = [];
  const client = encoreClient(s, host.io, calls);
  await assert.rejects(client.trigger("production", SHA), /never "production"/);
  await assert.rejects(client.trigger("preview", SHA), /never "preview"/);
  assert.equal(host.fetches.length, 0, "no request at all");
  assert.equal(host.encore.tokens, 0);
  assert.deepEqual(calls, []);
});

test("Encore: the ledger records every API call with its environment", async () => {
  const host = encoreHost();
  await deployEncore(settings(host.env), host.io, { sha: SHA, trigger: "manual" });
  const calls = lastLedger(host).apiCalls;
  assert.deepEqual(
    calls.map((c) => [c.method, c.kind, c.env]),
    [
      ["POST", "token", "staging"],
      ["POST", "rollout", "staging"],
      ["GET", "rollout-read", "staging"],
    ],
  );
  assert.ok(calls.every((c) => typeof c.at === "string"));
});

/** A production rollout as the audit reads it, from CI unless `over` says otherwise. */
const rollout = (over) => ({
  id: "roll_p1",
  queued_at: "2026-11-25T07:00:00Z",
  commit: { hash: SHA },
  trigger: { actor: "ci-client" },
  ...over,
});

test("the daily audit: production rollouts must be from CI, else an alert and exit 1", async () => {
  const env = { STACKRA_DEPLOY_ENCORE_CI_ACTORS: "ci-client" };
  const audit = async (production, deployments = [SHA]) => {
    const host = encoreHost({ env, deployments, encore: { production } });
    const result = await auditEncore(settings(host.env), host.io);
    return { result, line: lastLedger(host), host };
  };
  const clean = await audit([rollout()]);
  assert.deepEqual(clean.result, { code: 0, result: "clean" });
  assert.equal(clean.line.target, "encore:production-audit");
  assert.deepEqual(
    clean.line.apiCalls.map((c) => [c.method, c.kind, c.env]),
    [
      ["POST", "token", "production"],
      ["GET", "rollouts-list", "production"],
    ],
  );
  assert.equal(clean.host.encore.rollouts.length, 0, "the audit never triggers a rollout");
  for (const [over, deployments, reason] of [
    [{ trigger: undefined }, [SHA], /names no actor/],
    [{ trigger: { actor: "client-1" } }, [SHA], /the box's own OAuth client/],
    [{ trigger: { actor: "someone" } }, [SHA], /someone is not a CI client/],
    [{}, [], /no successful production deployment/],
    [{ commit: undefined }, [SHA], /names no commit/],
  ]) {
    const { result, line } = await audit([rollout(over)], deployments);
    assert.deepEqual(result, { code: 1, result: "alert" }, String(reason));
    assert.match(line.reason, reason);
  }
  // Older than the window: not this audit's.
  assert.equal(
    (await audit([rollout({ queued_at: "2026-11-20T00:00:00Z", trigger: undefined })])).result.code,
    0,
  );
  // A list that cannot be read is never clean.
  const broken = encoreHost({ env, encore: { production: "not a list" } });
  assert.deepEqual(await auditEncore(settings(broken.env), broken.io), {
    code: 1,
    result: "error",
  });
});

// ---- the D1 gate's trust tables ----

test("an insert into a table that grants rights stops for the owner: nothing applied, nothing uploaded", async () => {
  const host = fakeHost({
    d1: true,
    pending: ["0019_publisher.sql"],
    migrations: { "0019_publisher.sql": "INSERT INTO publishers (id, name) VALUES ('p1', 'x');" },
  });
  const result = await deployDocs(host);
  assert.equal(result.code, 1);
  const line = lastLedger(host);
  assert.equal(line.result, "needs-owner");
  assert.match(line.reason, /0019_publisher.sql INSERT INTO publishers/);
  assert.deepEqual(host.wrangler.applied, []);
  assert.equal(host.wrangler.uploads, 0);
  assert.deepEqual(host.wrangler.deploys, []);
});

// ---- the timer holds a failed SHA ----

/** Appends ledger lines as earlier runs would have written them. */
const seedLedger = (host, ...lines) => {
  const s = settings(host.env);
  mkdirSync(join(s.home, "ledger"), { recursive: true });
  writeFileSync(
    join(s.home, "ledger", "deploys.jsonl"),
    lines.map((l) => `${JSON.stringify({ schema: "stackra.deploy/1", ...l })}\n`).join(""),
    { flag: "a" },
  );
};

test("the timer holds a Worker's head after a failed attempt: no run every pass, one held line, a new head clears it", async () => {
  const options = { head: SHA, changed: ["apps/docs/src/docs/index.mdx"] };
  const host = fakeHost(options);
  const s = settings(host.env);
  seedLedger(host, { target: "worker:docs", sha: OLD_SHA, result: "success" });
  assert.equal((await plannedRuns(s, host.io)).length, 1, "a touched head runs");
  for (const result of ["failure", "needs-owner", "refused"]) {
    const h = fakeHost(options);
    seedLedger(
      h,
      { target: "worker:docs", sha: OLD_SHA, result: "success" },
      { target: "worker:docs", sha: SHA, result, at: "2026-11-25T07:30:00Z" },
    );
    const sh = settings(h.env);
    assert.deepEqual(await plannedRuns(sh, h.io), [], result);
    assert.deepEqual(await plannedRuns(sh, h.io), [], `${result}, second pass`);
    const held = readLedger(sh, h.io).filter((e) => e.result === "held");
    assert.equal(held.length, 1, "held is written once");
    assert.equal(held[0].heldFor, result);
    assert.equal(held[0].sha, SHA);
    assert.equal(h.logs.filter((l) => l.includes("holds")).length, 1, "and logged once");
  }
  // A dry-run attempt never holds, and a dry-run pass writes nothing.
  const dry = fakeHost(options);
  seedLedger(
    dry,
    { target: "worker:docs", sha: OLD_SHA, result: "success" },
    { target: "worker:docs", sha: SHA, result: "failure" },
  );
  const sDry = settings(dry.env);
  assert.deepEqual(await plannedRuns(sDry, dry.io, { dryRun: true }), []);
  assert.equal(readLedger(sDry, dry.io).filter((e) => e.result === "held").length, 0);
  assert.equal(
    heldAttempt(
      [{ target: "worker:docs", sha: SHA, result: "failure", dryRun: true }],
      "worker:docs",
      SHA,
    ),
    undefined,
  );
  // A newer head is tried again.
  const next = "e".repeat(40);
  options.head = next;
  options.checkRuns = [verifyRun(next, "success")];
  const moved = fakeHost(options);
  seedLedger(
    moved,
    { target: "worker:docs", sha: OLD_SHA, result: "success" },
    { target: "worker:docs", sha: SHA, result: "failure" },
  );
  assert.deepEqual(await plannedRuns(settings(moved.env), moved.io), [
    {
      target: "worker-docs",
      args: ["workers", "run", "--worker", "docs", "--sha", next, "--trigger", "timer"],
    },
  ]);
  // A run by hand is never held, and its newer line is what the timer reads next.
  assert.equal(
    heldAttempt(
      [
        { target: "worker:docs", sha: SHA, result: "failure" },
        { target: "worker:docs", sha: SHA, result: "held" },
        { target: "worker:docs", sha: SHA, result: "success" },
      ],
      "worker:docs",
      SHA,
    ),
    undefined,
  );
});

test("the timer holds Encore staging's head after a failed rollout, and plans only its own path", async () => {
  const host = encoreHost({ head: SHA });
  const s = settings(host.env);
  seedLedger(host, { target: "encore:staging", sha: OLD_SHA, result: "success" });
  assert.deepEqual(await plannedRuns(s, host.io, { target: "encore" }), [
    {
      target: "encore-staging",
      args: ["encore", "run", "--sha", SHA, "--trigger", "timer"],
    },
  ]);
  assert.deepEqual(await plannedRuns(s, host.io, { target: "workers" }), []);
  seedLedger(host, { target: "encore:staging", sha: SHA, result: "failure" });
  assert.deepEqual(await plannedRuns(s, host.io, { target: "encore" }), []);
  assert.deepEqual(await plannedRuns(s, host.io, { target: "encore" }), []);
  assert.equal(readLedger(s, host.io).filter((e) => e.result === "held").length, 1);
  assert.equal(host.encore.rollouts.length, 0);
});

// ---- the service's own code: pinned to a verified SHA ----

test("service update pins main's head only after its verify gate, as a fast-forward, and preflight needs the pin", async () => {
  // A green head: the clone moves to it, detached, and the pin is recorded.
  const green = fakeHost({ serviceOrigin: SHA });
  const s = settings(green.env);
  assert.deepEqual(await serviceUpdate(s, green.io), { code: 0, result: "pinned" });
  assert.deepEqual(green.serviceGit.checkouts, [SHA]);
  assert.equal(lastLedger(green).target, "service");
  assert.equal(lastLedger(green).result, "pinned");
  assert.equal(lastLedger(green).from, PIN);
  assert.deepEqual(preflightProblems(s, green.io, "workers"), []);
  assert.deepEqual(await serviceUpdate(s, green.io), { code: 0, result: "current" });

  // A red head: the clone stays at its pin (exit 0, the deploy runs the verified code), held once.
  const red = fakeHost({ serviceOrigin: "c".repeat(40) });
  const sRed = settings(red.env);
  assert.deepEqual(await serviceUpdate(sRed, red.io), { code: 0, result: "kept" });
  assert.deepEqual(await serviceUpdate(sRed, red.io), { code: 0, result: "kept" });
  assert.deepEqual(red.serviceGit.checkouts, []);
  assert.equal(readLedger(sRed, red.io).filter((e) => e.result === "held").length, 1);
  assert.deepEqual(preflightProblems(sRed, red.io, "workers"), []);

  // Not a fast-forward of the pin: kept.
  const rewritten = fakeHost({ serviceOrigin: SHA, serviceFastForward: false });
  assert.deepEqual(await serviceUpdate(settings(rewritten.env), rewritten.io), {
    code: 0,
    result: "kept",
  });
  assert.deepEqual(rewritten.serviceGit.checkouts, []);

  // Local changes in the clone: refused, exit 1.
  const dirty = fakeHost({ serviceOrigin: SHA, serviceDirty: true });
  assert.deepEqual(await serviceUpdate(settings(dirty.env), dirty.io), {
    code: 1,
    result: "refused",
  });

  // Never pinned: preflight refuses, and an unverified head is not pinned (exit 1, the unit stops).
  const fresh = fakeHost({ servicePinned: false });
  const sFresh = settings(fresh.env);
  assert.match(
    preflightProblems(sFresh, fresh.io, "workers").join(";"),
    /which no `service update` pinned/,
  );
  assert.deepEqual(await serviceUpdate(sFresh, fresh.io), { code: 1, result: "held" });
  const result = await deployDocs(fresh);
  assert.equal(result.code, 1);
  assert.match(lastLedger(fresh).reason, /no `service update` pinned/);
  assert.equal(fresh.wrangler.uploads, 0);
});

test("preflight refuses service code another user could change", () => {
  const host = fakeHost();
  const s = settings(host.env);
  chmodSync(join(host.service, "tools", "scripts"), 0o777);
  assert.match(
    preflightProblems(s, host.io, "workers").join(";"),
    /tools\/scripts is writable by its group or others/,
  );
  chmodSync(join(host.service, "tools", "scripts"), 0o755);
  const built = {
    ...host.io,
    lstat: (p) => ({
      ...host.io.lstat(p),
      uid: p.endsWith("stackra-deploy.mjs") ? 4444 : host.io.lstat(p).uid,
    }),
  };
  assert.match(
    preflightProblems(s, built, "workers").join(";"),
    /stackra-deploy.mjs is not the deploy user's/,
  );
  writeFileSync(join(host.service, ".git", "HEAD"), "ref: refs/heads/main\n");
  assert.match(preflightProblems(s, host.io, "workers").join(";"), /not pinned to a commit/);
});

// ---- the credential split ----

test("the split: the Workers user cannot reach or name the Encore credential; the Encore user runs no tree code", () => {
  const workers = fakeHost();
  const sw = settings(workers.env);
  assert.deepEqual(preflightProblems(sw, workers.io, "workers"), []);
  assert.match(
    preflightProblems(
      settings({ ...workers.env, STACKRA_DEPLOY_ENCORE_CLIENT_FILE: workers.files.encore }),
      workers.io,
      "workers",
    ).join(";"),
    /holds no Encore setting/,
  );
  assert.match(
    preflightProblems(
      settings({ ...workers.env, STACKRA_DEPLOY_ENCORE: "on" }),
      workers.io,
      "workers",
    ).join(";"),
    /holds no Encore setting/,
  );
  assert.match(
    preflightProblems(sw, { ...workers.io, canAccess: () => true }, "workers").join(";"),
    /can reach .*etc-encore: the Encore credential must be out of its reach/,
  );

  const encore = encoreHost();
  const se = settings(encore.env);
  assert.deepEqual(preflightProblems(se, encore.io, "encore"), []);
  assert.match(
    preflightProblems(
      settings({ ...encore.env, STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE: encore.files.cloudflare }),
      encore.io,
      "encore",
    ).join(";"),
    /no Workers setting/,
  );
  assert.match(
    preflightProblems(
      settings({ ...encore.env, STACKRA_DEPLOY_BUILD_AS: "stackra-deploy-build" }),
      encore.io,
      "encore",
    ).join(";"),
    /no Workers setting/,
  );
  assert.match(
    preflightProblems(se, { ...encore.io, canSudo: () => true }, "encore").join(";"),
    /can act as stackra-deploy-build: it must run no tree code/,
  );
  assert.match(
    preflightProblems(
      settings({ ...encore.env, STACKRA_DEPLOY_ENCORE_CLIENT_FILE: encore.files.cloudflare }),
      encore.io,
      "encore",
    ).join(";"),
    /STACKRA_DEPLOY_ENCORE_CLIENT_FILE must be a file in .*etc-encore/,
  );
});

test("the API origins are fixed in code: no setting points a credential at another host", () => {
  const s = settings({
    STACKRA_DEPLOY_ENCORE_API: "https://collector.example",
    STACKRA_DEPLOY_GITHUB_API: "https://collector.example",
  });
  assert.equal(s.encoreApi, ENCORE_API);
  assert.equal(s.githubApi, GITHUB_API);
});

// ---- secrets from Infisical at run time ----

test("Infisical: the Workers path fetches the Cloudflare token into memory with its own identity, nothing leaks", async () => {
  const host = fakeHost({ secrets: "infisical" });
  const s = settings(host.env);
  assert.deepEqual(preflightProblems(s, host.io, "workers"), []);
  const result = await deployDocs(host);
  assert.equal(result.code, 0);
  assert.equal(lastLedger(host).result, "success");
  assert.equal(call0Env(host).CLOUDFLARE_API_TOKEN, CF_TOKEN);
  assert.deepEqual(host.vault.reads, [
    { name: "STACKRA_DEPLOY_CLOUDFLARE_TOKEN", path: "/ci/deploy/box1-stackra/workers" },
  ]);
  assert.equal(host.vault.logins, 1);
  const login = host.fetches.find((f) => f.url.endsWith("/universal-auth/login"));
  assert.ok(!login.url.includes(INFISICAL_SECRET));
  assert.ok(
    String(login.body).includes(INFISICAL_SECRET),
    "the identity's secret goes in the body only",
  );
  const read = host.fetches.find((f) => f.url.includes("/api/v4/secrets/"));
  assert.equal(read.headers.authorization, `Bearer ${INFISICAL_TOKEN}`);
  assertNoLeak(host);
});

test("Infisical: the Encore path reads its client from its own folder only, and a wrong folder fails before any rollout", async () => {
  const host = encoreHost({ secrets: "infisical" });
  assert.deepEqual(preflightProblems(settings(host.env), host.io, "encore"), []);
  const result = await deployEncore(settings(host.env), host.io, { sha: SHA, trigger: "manual" });
  assert.equal(result.code, 0);
  assert.deepEqual(host.vault.reads, [
    { name: "STACKRA_DEPLOY_ENCORE_CLIENT", path: "/ci/deploy/box1-stackra/encore" },
  ]);
  assertNoLeak(host);

  const wrong = encoreHost({
    secrets: "infisical",
    env: { STACKRA_DEPLOY_INFISICAL_PATH: "/ci/deploy/box1-stackra/workers" },
  });
  const failed = await deployEncore(settings(wrong.env), wrong.io, { sha: SHA, trigger: "manual" });
  assert.equal(failed.code, 1);
  assert.match(lastLedger(wrong).reason, /Infisical answered 404 for STACKRA_DEPLOY_ENCORE_CLIENT/);
  assert.equal(wrong.encore.rollouts.length, 0);
});

test("Infisical: preflight refuses an unknown origin, a secret file beside it, and an unknown mode", () => {
  const host = fakeHost({ secrets: "infisical" });
  const problems = (env) =>
    preflightProblems(settings({ ...host.env, ...env }), host.io, "workers").join(";");
  assert.match(
    problems({ STACKRA_DEPLOY_INFISICAL_URL: "https://vault.example" }),
    /STACKRA_DEPLOY_INFISICAL_URL must be one of/,
  );
  assert.match(
    problems({ STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE: host.files.cloudflare }),
    /CLOUDFLARE_TOKEN_FILE is set: with STACKRA_DEPLOY_SECRETS=infisical no value is a file/,
  );
  assert.match(problems({ STACKRA_DEPLOY_INFISICAL_PATH: "ci" }), /STACKRA_DEPLOY_INFISICAL_PATH/);
  assert.match(problems({ STACKRA_DEPLOY_SECRETS: "vault" }), /must be "files" or "infisical"/);
  const encore = encoreHost({ secrets: "infisical" });
  assert.match(
    preflightProblems(
      settings({ ...encore.env, STACKRA_DEPLOY_INFISICAL_IDENTITY_FILE: host.files.infisical }),
      encore.io,
      "encore",
    ).join(";"),
    /STACKRA_DEPLOY_INFISICAL_IDENTITY_FILE must be a file in/,
  );
});
