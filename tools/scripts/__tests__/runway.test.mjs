import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { dispatches, plan, preflight, readRunways } from "../runway.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const ROOT_RUNWAY = {
  version: 3,
  project: "acme",
  providers: {
    github: { org: "acme", repo: "platform" },
    infisical: {
      environments: { production: "prod" },
      paths: { runtime: "/runtime", ci: "/ci" },
    },
  },
  environments: {
    production: { destinations: { web: "cloudflare-workers", docs: "mintlify" } },
  },
  targets: {
    "cloudflare-workers": { workflows: { web: "deploy-web.yml", static: "deploy-static.yml" } },
    mintlify: { workflows: { docs: "deploy-docs.yml" } },
    npm: { workflows: { packages: "release.yml" } },
  },
  secrets: { sync: "on-deploy", defaultPath: "runtime", ci: ["CLOUDFLARE_API_TOKEN"] },
  release: { buildOrder: ["npm", "cloudflare-workers", "encore-cloud", "mintlify"] },
};

const MEMBERS = [
  {
    member: "web",
    runway: {
      version: 3,
      secrets: ["SENTRY_AUTH"],
      environments: {
        production: {
          vars: { VITE_API_ORIGIN: "https://api.acme.example" },
          secrets: ["SENTRY_AUTH"],
        },
      },
    },
  },
  { member: "docs", runway: { version: 3, environments: { dev: { port: 3333 } } } },
];

test("plan: build-order targets with their workflows, the CI names and the names to sync, never a value", () => {
  const p = plan("production", { root: ROOT_RUNWAY, members: MEMBERS });
  assert.equal(p.infisicalEnvironment, "prod");
  assert.deepEqual(
    p.steps.map(({ target, destination }) => [target, destination]),
    [
      ["npm", false],
      ["cloudflare-workers", true],
      ["mintlify", true],
    ],
  );
  assert.deepEqual(p.ci, ["CLOUDFLARE_API_TOKEN"]);
  assert.deepEqual(p.sync, [
    { member: "web", kind: "secret", name: "SENTRY_AUTH", path: "/runtime" },
    { member: "web", kind: "var", name: "VITE_API_ORIGIN" },
  ]);
  assert.equal(JSON.stringify(p).includes("api.acme.example"), false);
  assert.throws(
    () => plan("staging", { root: ROOT_RUNWAY, members: [] }),
    /no environment "staging"/,
  );
});

/** A git stand-in: `answers[args.join(" ")]` is stdout, an Error is thrown, anything missing throws. */
const fakeGit = (answers) => (args) => {
  const answer = answers[args.join(" ")];
  if (answer === undefined || answer instanceof Error) throw answer ?? new Error(args.join(" "));
  return answer;
};
const MAIN = "a".repeat(40);
const OLD = "b".repeat(40);

test("preflight deploy: a clean tree at the head of origin/main, else the reason", () => {
  const base = {
    "fetch --quiet origin main": "",
    "rev-parse origin/main": MAIN,
    "status --porcelain": "",
    "rev-parse HEAD": MAIN,
  };
  assert.equal(preflight({ command: "deploy", git: fakeGit(base) }), MAIN);
  assert.throws(
    () => preflight({ command: "deploy", git: fakeGit({ ...base, "status --porcelain": " M x" }) }),
    /uncommitted changes/,
  );
  assert.throws(
    () => preflight({ command: "deploy", git: fakeGit({ ...base, "rev-parse HEAD": OLD }) }),
    /is not the head of origin\/main/,
  );
});

test("preflight promote: a commit on origin/main, else the reason", () => {
  const base = {
    "fetch --quiet origin main": "",
    "rev-parse origin/main": MAIN,
    [`rev-parse --verify --quiet bbbb^{commit}`]: OLD,
    [`merge-base --is-ancestor ${OLD} ${MAIN}`]: "",
  };
  assert.equal(preflight({ command: "promote", sha: "bbbb", git: fakeGit(base) }), OLD);
  assert.throws(
    () => preflight({ command: "promote", sha: "nope", git: fakeGit(base) }),
    /names no commit/,
  );
  assert.throws(
    () =>
      preflight({
        command: "promote",
        sha: "bbbb",
        git: fakeGit({ ...base, [`merge-base --is-ancestor ${OLD} ${MAIN}`]: new Error("1") }),
      }),
    /is not on origin\/main/,
  );
});

test("dispatches: main, the SHA only where the caller takes one, and a promote skips the others", () => {
  const takesSha = new Set(["deploy-web.yml", "deploy-static.yml"]);
  const readWorkflow = (file) =>
    takesSha.has(file)
      ? { on: { workflow_dispatch: { inputs: { sha: {} } } } }
      : { on: { push: {} } };
  const deploy = dispatches({
    root: ROOT_RUNWAY,
    targets: ["mintlify"],
    sha: MAIN,
    readWorkflow,
  });
  assert.deepEqual(deploy, {
    runs: [["workflow", "run", "deploy-docs.yml", "--repo", "acme/platform", "--ref", "main"]],
    skipped: [],
  });
  const promote = dispatches({
    root: ROOT_RUNWAY,
    targets: ["cloudflare-workers", "mintlify"],
    sha: OLD,
    promote: true,
    readWorkflow,
  });
  assert.deepEqual(
    promote.runs.map((args) => [args[2], args.at(-1)]),
    [
      ["deploy-web.yml", `sha=${OLD}`],
      ["deploy-static.yml", `sha=${OLD}`],
    ],
  );
  assert.deepEqual(promote.skipped, [{ target: "mintlify", file: "deploy-docs.yml" }]);
});

test("the repository's own runway: every caller workflow exists, and production deploys the static Worker and the docs", () => {
  const runways = readRunways(REPO);
  const p = plan("production", runways);
  for (const { workflows } of p.steps)
    for (const file of Object.values(workflows))
      assert.equal(existsSync(join(REPO, ".github/workflows", file)), true, file);
  assert.deepEqual(
    p.steps.filter((s) => s.destination).map((s) => s.target),
    ["cloudflare-workers", "mintlify"],
  );
  assert.deepEqual(
    runways.members.map((m) => m.member),
    ["docs"],
  );
});
