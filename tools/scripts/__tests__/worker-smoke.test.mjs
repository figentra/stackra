/**
 * Stackra file contract:
 * Purpose: hold the Worker smoke suites (worker-smoke.mjs, ADR 0536 gate 2, shared by the box and CI) to their
 *          contract against fake Workers: the version proof fails the false pass (an ignored override answered by
 *          the old version) for edge and docs, and fails a Worker with no proof; the docs suite; the registry suite passes a healthy registry and fails on each broken check (integrity,
 *          signature, signing keys, abbreviated packument, the publish refusal, the 404 path, a package that vanished
 *          since production's baseline); the turbo-cache suite needs the 401s and a byte-equal round trip; static and
 *          edge their own answers; every request of a version smoke carries the version override; the turbo token
 *          is never part of a result.
 * Boundary: fake Workers from __fixtures__/fake-workers.mjs; no network.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0536; STA-2783.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  headerProof,
  overrideFor,
  parseSmokeArgs,
  redirectsOf,
  registryBaseline,
  registrySample,
  runwayChecks,
  smokeWorker,
} from "../worker-smoke.mjs";
import { fakeWorkers } from "./__fixtures__/fake-workers.mjs";

const {
  docs: fakeDocs,
  edge: fakeEdge,
  registry: fakeRegistry,
  static: fakeStatic,
  turboCache: fakeTurboCache,
  routed: routedFetch,
} = fakeWorkers;
const ROOT = parse(
  readFileSync(fileURLToPath(new URL("../../../runway.yaml", import.meta.url)), "utf8"),
);
const VERSION = "11111111-2222-3333-4444-555555555555";
const PACKAGES = {
  "@stackra/cli": "0.21.0",
  "@stackra/contracts": "0.21.0",
  "@stackra/runway": "0.21.0",
};
const SAMPLE = Object.keys(PACKAGES);
const TURBO = "turbo-token-for-the-smoke-test-0123456789";

const registryRun = async (breaks = [], extra = {}) => {
  const registry = fakeRegistry({ packages: PACKAGES, breaks: new Set(breaks) });
  const io = { fetch: registry.fetch };
  const result = await smokeWorker(io, {
    root: ROOT,
    member: "registry",
    workerName: "stackra-registry",
    version: VERSION,
    // The registry's own version proof comes with STA-2786; these tests check its suite.
    expect: false,
    sample: SAMPLE,
    ...extra,
  });
  return { result, registry };
};

const hosts = (breaks, options = {}) =>
  routedFetch({ "edge.example.test": fakeEdge({ breaks: new Set(breaks), ...options }) });

/** runway.yaml with an edge and a docs member on test hosts, as the Stackra account would declare them. */
const stackraRoot = () => {
  const root = structuredClone(ROOT);
  root.targets["cloudflare-workers"].members.edge = {
    path: "workers/edge",
    customDomains: ["edge.example.test"],
    smoke: [{ url: "https://edge.example.test/" }],
  };
  root.targets["cloudflare-workers"].members.docs = {
    ...root.targets["cloudflare-workers"].members.docs,
    customDomains: ["docs.example.test"],
    smoke: [{ url: "https://docs.example.test/" }, { url: "https://docs.example.test/llms.txt" }],
  };
  return root;
};

const failedNames = (result) => result.results.filter((r) => !r.ok).map((r) => r.name);

test("a healthy registry version passes every check, each request routed to that version", async () => {
  const { result, registry } = await registryRun();
  assert.deepEqual(failedNames(result), []);
  assert.equal(result.ok, true);
  const names = new Set(result.results.map((r) => r.name));
  for (const expected of [
    "uptime registry",
    "smoke /-/ping",
    "smoke /-/npm/v1/keys",
    "registry ping",
    "registry signing keys",
    "registry @stackra/cli packument",
    "registry @stackra/cli abbreviated packument",
    "registry @stackra/cli tarball integrity",
    "registry @stackra/cli signature",
    "registry @stackra/runway tarball integrity",
    "registry unknown package is 404",
    "registry publish without a token is refused",
    "registry unpublish is refused",
    "registry whoami without a token is 401",
  ])
    assert.ok(names.has(expected), expected);
  assert.equal(registry.requests.length, 18);
  for (const r of registry.requests)
    assert.equal(r.override, overrideFor("stackra-registry", VERSION), r.url);
  // The only writes are the two refusals.
  assert.deepEqual(
    registry.requests
      .filter((r) => r.method !== "GET")
      .map((r) => `${r.method} ${new URL(r.url).pathname}`),
    ["PUT /@stackra%2fcli", "DELETE /@stackra/cli/-rev/0"],
  );
});

test("each broken registry behaviour fails its own check", async () => {
  const cases = {
    integrity: "tarball integrity",
    signature: "signature",
    keys: "registry signing keys",
    abbreviated: "abbreviated packument",
    publish: "registry publish without a token is refused",
    notFound: "registry unknown package is 404",
    missing: "packument",
  };
  for (const [broken, check] of Object.entries(cases)) {
    const { result } = await registryRun([broken]);
    assert.equal(result.ok, false, broken);
    assert.ok(
      failedNames(result).some((name) => name.endsWith(check)),
      `${broken}: ${failedNames(result).join(", ")}`,
    );
  }
});

test("a version must serve the integrity production served for the same version", async () => {
  const { result } = await registryRun([], {
    baseline: { "@stackra/cli": { version: "0.21.0", integrity: "sha512-other" } },
  });
  assert.deepEqual(failedNames(result), ["registry @stackra/cli matches production"]);
});

test("a read-only registry must refuse both writes with registry_read_only", async () => {
  const { result } = await registryRun([], { readOnly: true });
  assert.deepEqual(failedNames(result), [
    "registry publish without a token is refused",
    "registry unpublish is refused",
  ]);
});

test("an empty sample never passes", async () => {
  const { result } = await registryRun([], { sample: [] });
  assert.ok(failedNames(result).includes("registry sample"));
});

test("the sample is one package per release group plus @stackra/cli", () => {
  const sample = registrySample([
    { name: "@stackra/zeta", dir: "packages/foundation/zeta" },
    { name: "@stackra/alpha", dir: "packages/foundation/alpha" },
    { name: "@stackra/runway", dir: "packages/developer/runway" },
    { name: "@stackra/cli", dir: "packages/developer/cli" },
    { name: "@stackra/hidden", dir: "packages/state/hidden", private: true },
    { name: "@figentra/worker-registry", dir: "workers/registry" },
    { name: "@stackra/ui", dir: "packages/design-system/ui" },
  ]);
  assert.deepEqual(sample, ["@stackra/alpha", "@stackra/cli", "@stackra/ui"]);
});

test("production's baseline drops a package it does not serve and refuses a broken answer", async () => {
  const registry = fakeRegistry({ packages: { "@stackra/cli": "1.0.0" } });
  const { baseline, absent } = await registryBaseline(
    { fetch: registry.fetch },
    { base: "https://npm.stackra.figentra.com", sample: ["@stackra/cli", "@stackra/never"] },
  );
  assert.deepEqual(Object.keys(baseline), ["@stackra/cli"]);
  assert.deepEqual(absent, ["@stackra/never"]);
  assert.equal(registry.requests[0].override, undefined);
  await assert.rejects(
    registryBaseline(
      { fetch: async () => new Response("", { status: 500 }) },
      { base: "https://npm.stackra.figentra.com", sample: ["@stackra/cli"] },
    ),
    /500/,
  );
});

test("turbo-cache: the 401s, the authenticated status and a byte-equal round trip", async () => {
  const run = async (breaks = []) => {
    const cache = fakeTurboCache({ token: TURBO, breaks: new Set(breaks) });
    const result = await smokeWorker(
      { fetch: cache.fetch },
      {
        root: ROOT,
        member: "turbo-cache",
        workerName: "stackra-turbo-cache",
        version: VERSION,
        expect: false,
        turboToken: TURBO,
      },
    );
    return { result, cache };
  };
  const healthy = await run();
  assert.deepEqual(failedNames(healthy.result), []);
  assert.ok(healthy.cache.store.size === 1);
  assert.ok([...healthy.cache.store.keys()][0].startsWith("stackra-deploy-smoke/deploysmoke"));
  assert.ok(!JSON.stringify(healthy.result).includes(TURBO));
  assert.deepEqual(failedNames((await run(["open"])).result).toSorted(), [
    "turbo-cache unauthenticated is 401",
    "turbo-cache wrong token is 401",
    "uptime turbo-cache",
  ]);
  assert.deepEqual(failedNames((await run(["lose"])).result), ["turbo-cache download"]);
  const missing = await smokeWorker(
    { fetch: fakeTurboCache({ token: TURBO }).fetch },
    { root: ROOT, member: "turbo-cache", workerName: "stackra-turbo-cache", version: VERSION },
  );
  assert.equal(missing.ok, false);
});

test("static: the root and the schema index", async () => {
  const healthy = await smokeWorker(
    { fetch: fakeStatic().fetch },
    { root: ROOT, member: "static", workerName: "stackra-static", version: VERSION, expect: false },
  );
  assert.deepEqual(failedNames(healthy), []);
  const broken = await smokeWorker(
    { fetch: fakeStatic({ breaks: new Set(["index"]) }).fetch },
    { root: ROOT, member: "static", workerName: "stackra-static", version: VERSION, expect: false },
  );
  assert.deepEqual(failedNames(broken).toSorted(), [
    "smoke /schemas/index.json",
    "static schema index",
  ]);
});

test("edge: an unsigned JWT is refused by the edge itself, every answer from the version under test", async () => {
  const root = stackraRoot();
  // The member smoke URL itself answers 401 to the probe, and 200 to the plain runway smoke.
  const healthy = await smokeWorker(
    { fetch: hosts([]) },
    { root, member: "edge", workerName: "stackra-edge", version: VERSION },
  );
  assert.deepEqual(failedNames(healthy), []);
  const forwarded = await smokeWorker(
    { fetch: hosts(["forward"]) },
    { root, member: "edge", workerName: "stackra-edge", version: VERSION },
  );
  assert.deepEqual(failedNames(forwarded), ["edge refuses an unsigned token /"]);
  const absent = await smokeWorker(
    { fetch: hosts([]) },
    { root: ROOT, member: "edge", workerName: "stackra-edge", version: VERSION },
  );
  assert.equal(absent.ok, false);
});

test("the false pass: an ignored override serves the old version with 200s, and the smoke now fails", async () => {
  const root = stackraRoot();
  // edge: every check of its suite passes on the old version, only the version proof sees it.
  const edge = await smokeWorker(
    { fetch: hosts([], { ignoreOverride: true }) },
    { root, member: "edge", workerName: "stackra-edge", version: VERSION },
  );
  assert.deepEqual(failedNames(edge), ["version proof"]);
  assert.match(edge.results.find((r) => r.name === "version proof").detail, /old-version/);
  // docs: the same, read through /-/version before and after the suite.
  const docs = await smokeWorker(
    { fetch: routedFetch({ "docs.example.test": fakeDocs({ ignoreOverride: true }) }) },
    { root, member: "docs", workerName: "stackra-docs", version: VERSION },
  );
  assert.deepEqual(failedNames(docs), ["version proof", "version proof"]);
  // A live smoke (no override) at 100% expects the new version too.
  const live = await smokeWorker(
    { fetch: hosts([], { serving: VERSION }) },
    { root, member: "edge", workerName: "stackra-edge", expect: VERSION },
  );
  assert.deepEqual(failedNames(live), []);
});

test("docs: the root, a page, an asset, the 404 and the redirects, with the version proof", async () => {
  const root = stackraRoot();
  const run = async (breaks = [], redirects = [{ from: "/old", to: "/new" }]) =>
    smokeWorker(
      { fetch: routedFetch({ "docs.example.test": fakeDocs({ breaks: new Set(breaks) }) }) },
      { root, member: "docs", workerName: "stackra-docs", version: VERSION, redirects },
    );
  const healthy = await run();
  assert.deepEqual(failedNames(healthy), []);
  const names = new Set(healthy.results.map((r) => r.name));
  for (const name of [
    "docs root",
    "docs page /adr",
    "docs asset",
    "docs unknown path is 404",
    "docs redirect /old",
    "version proof",
  ])
    assert.ok(names.has(name), name);
  assert.deepEqual(failedNames(await run(["asset"])), ["docs asset"]);
  assert.deepEqual(failedNames(await run(["redirect"])), ["docs redirect /old"]);
  assert.deepEqual(redirectsOf("/licensing /customers/install 301\n/x/* /y 301\n# note\n/a /b"), [
    { from: "/licensing", to: "/customers/install" },
    { from: "/a", to: "/b" },
  ]);
});

test("a Worker without a version proof fails a smoke that expects a version", async () => {
  const result = await smokeWorker(
    { fetch: fakeStatic().fetch },
    { root: ROOT, member: "static", workerName: "stackra-static", version: VERSION },
  );
  assert.deepEqual(failedNames(result), ["version proof"]);
  assert.equal(headerProof([], VERSION).ok, false);
});

test("the CI CLI's arguments", () => {
  assert.deepEqual(parseSmokeArgs(["--member", "registry"]), { member: "registry" });
  assert.deepEqual(
    parseSmokeArgs(["--member", "docs", "--version", VERSION, "--worker-name", "stackra-docs"]),
    {
      member: "docs",
      version: VERSION,
      workerName: "stackra-docs",
    },
  );
  assert.equal(parseSmokeArgs(["--member", "docs", "--version", VERSION]), null);
  assert.equal(parseSmokeArgs(["--bogus"]), null);
});

test("runway's checks come from the uptime list and the member smoke URLs", () => {
  const checks = runwayChecks(ROOT, "turbo-cache");
  assert.deepEqual(checks, [
    {
      name: "uptime turbo-cache",
      url: "https://turbo.stackra.figentra.com/v8/artifacts/status",
      expected: [401],
    },
    {
      name: "smoke /v8/artifacts/status",
      url: "https://turbo.stackra.figentra.com/v8/artifacts/status",
      bearer: "TURBO_TOKEN",
    },
  ]);
});

test("a smoke without a version sends no override (production as it serves)", async () => {
  const registry = fakeRegistry({ packages: PACKAGES });
  const result = await smokeWorker(
    { fetch: registry.fetch },
    { root: ROOT, member: "registry", workerName: "stackra-registry", sample: SAMPLE },
  );
  assert.equal(result.ok, true);
  assert.ok(registry.requests.every((r) => r.override === undefined));
});
