/**
 * Stackra file contract:
 * Purpose: fixture tests of `checkWorkflowTriggers`: a paid runner, an EAS build or a called paid job on a push or pull
 *          request trigger fails, the same job behind a tag, dispatch or call passes; a deploy key or deploy variable
 *          in a job with no environment fails, in a deploy job it passes; an allow-listed job passes.
 * Boundary: test only; pure function, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0166, ADR 0167; STA-256.
 */
import assert from "node:assert/strict";

import { test } from "@stackra/testing";

import { checkWorkflowTriggers } from "#node/functions/check-workflow-triggers.function";

const wf = (on: string, job: string, path = ".github/workflows/x.yml"): [string, string] => [
  path,
  `on:\n${on}\njobs:\n  a:\n${job}\n`,
];

test("checkWorkflowTriggers: a macOS job on pull_request fails", () => {
  const [finding] = checkWorkflowTriggers([wf("  pull_request:", "    runs-on: macos-latest")]);
  assert.match(finding ?? "", /job `a` runs on a paid runner/);
});

test("checkWorkflowTriggers: a larger runner on push fails, a Linux one passes", () => {
  assert.equal(
    checkWorkflowTriggers([wf("  push:", "    runs-on: ubuntu-latest-8-cores")]).length,
    1,
  );
  assert.equal(checkWorkflowTriggers([wf("  push:", "    runs-on: ubuntu-latest")]).length, 0);
  assert.equal(
    checkWorkflowTriggers([["x.yml", "on: [push]\njobs:\n  a:\n    runs-on: windows-2022\n"]])
      .length,
    1,
  );
});

test("checkWorkflowTriggers: an EAS build step on push fails (field report 8.1)", () => {
  const job =
    "    runs-on: ubuntu-latest\n    steps:\n      - run: pnpm exec eas build --platform ios";
  assert.match(checkWorkflowTriggers([wf("  push:", job)])[0] ?? "", /paid command \(eas build\)/);
});

test("checkWorkflowTriggers: a paid job behind a tag push, dispatch or call passes", () => {
  const job = "    runs-on: macos-latest";
  assert.equal(checkWorkflowTriggers([wf("  push:\n    tags: ['v*']", job)]).length, 0);
  assert.equal(checkWorkflowTriggers([wf("  workflow_dispatch:", job)]).length, 0);
  assert.equal(checkWorkflowTriggers([wf("  workflow_call:", job)]).length, 0);
  assert.equal(
    checkWorkflowTriggers([wf("  push:\n    branches: [main]\n    tags: ['v*']", job)]).length,
    1,
  );
});

test("checkWorkflowTriggers: a pull request job that calls a paid local workflow fails", () => {
  const called = wf("  workflow_call:", "    runs-on: macos-latest", ".github/workflows/smoke.yml");
  const caller = wf("  pull_request:", "    uses: ./.github/workflows/smoke.yml");
  assert.match(
    checkWorkflowTriggers([called, caller])[0] ?? "",
    /calls \.github\/workflows\/smoke\.yml, whose job `a`/,
  );
});

test("checkWorkflowTriggers: a deploy identity in a job with no environment fails (field report 2.6)", () => {
  const leaked = [
    "x.yml",
    "on: push\nenv:\n  ENCORE_APP: my-app\njobs:\n  test:\n    runs-on: ubuntu-latest\n",
  ] as const;
  assert.match(
    checkWorkflowTriggers([leaked])[0] ?? "",
    /job `test` has no environment .* `ENCORE_APP`/,
  );
  const step =
    "    runs-on: ubuntu-latest\n    steps:\n      - run: x\n        env:\n          ID: ${{ vars.INFISICAL_DEPLOY_PROJECT_ID }}";
  assert.equal(checkWorkflowTriggers([wf("  pull_request:", step)]).length, 1);
});

test("checkWorkflowTriggers: a deploy job keeps its identity, a cleared key passes", () => {
  const deploy =
    "    runs-on: ubuntu-latest\n    environment: production\n    env:\n      CLOUDFLARE_API_TOKEN: t";
  assert.equal(checkWorkflowTriggers([wf("  push:", deploy)]).length, 0);
  const cleared = "    runs-on: ubuntu-latest\n    env:\n      CLOUDFLARE_API_TOKEN: ''";
  assert.equal(checkWorkflowTriggers([wf("  push:", cleared)]).length, 0);
});

test("checkWorkflowTriggers: an allow-listed job passes", () => {
  const allowed = [{ path: ".github/workflows/x.yml", job: "a" }];
  assert.equal(
    checkWorkflowTriggers([wf("  push:", "    runs-on: macos-latest")], allowed).length,
    0,
  );
});
