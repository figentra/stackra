/**
 * Stackra file contract:
 * Purpose: hold `pr-merge.mjs` to its contract (ADR 0523: the gate and the ruleset are the merge condition): an
 *          open, non-draft PR with a green newest Quality Gate on its head, a merge state the ruleset lets merge (or
 *          a merge queue) and no `hold` label merges with no review; each condition alone refuses; design and risk:R3
 *          still need the owner; and the merge or enqueue retries.
 * Boundary: mocked gh and GraphQL; no network, nothing merged.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). ADR 0119 (merge policy,
 *                     amended 2026-11-10); ADR 0523 (decisions 3 and 6).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as network from "../bot-token.mjs";
import {
  blockers,
  enqueueReady,
  gh,
  graphql,
  definitionFieldsChanged,
  isRecent,
  mergeBlockers,
  VERIFY_FRESH_MS,
  isVerifyDefinition,
  isVerifyOverlay,
  isRootDefinition,
  scriptsChanged,
  OWNER,
  ownerLabelled,
  parseArgs,
  VERIFY_APP,
  VERIFY_CHECK,
  VERIFY_MOBILE_CHECK,
  CODEQL_CHECK,
  DEFINITION_FIELDS,
  verifyFacts,
  verifyRun,
} from "../pr-merge.mjs";
import { fakeGh } from "./__fixtures__/fake-gh.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const T0 = "2026-10-19T10:00:00Z";
const T1 = "2026-10-19T11:00:00Z";
const T2 = "2026-10-19T12:00:00Z";
const pr = (over = {}) => ({
  number: 1,
  state: "OPEN",
  isDraft: false,
  headRefOid: SHA,
  baseRefName: "main",
  labels: [],
  mergeStateStatus: "CLEAN",
  ...over,
});
const green = [{ id: 2, status: "completed", conclusion: "success" }];
// A stand-in verify App, so each case names the App it trusts; VERIFY_APP is the registered one (id 5907714).
const APP = { slug: "stackra-verify", id: 4242 };
const appRun = (
  conclusion,
  { id = 1, sha = SHA, app = APP, status = "completed", name = VERIFY_CHECK } = {},
) => ({
  id,
  name,
  head_sha: sha,
  status,
  conclusion: status === "completed" ? conclusion : null,
  app,
  html_url: `https://github.com/figentra/stackra/runs/${id}`,
});
const verified = [appRun("success")];
// Every pre-STA-2761 case runs with a green stackra/verify; conditions 5 and 6 have their own tests below.
const check = (p, runs, options = {}) =>
  blockers(p, runs, { verifyRuns: verified, app: APP, ...options });
// Shapes as the REST pull reviews API returns them.
const review = (over = {}) => ({
  user: { login: OWNER, type: "User" },
  state: "APPROVED",
  commit_id: SHA,
  body: "",
  ...over,
});

test("merges an open PR with a green gate, a clean merge state and no hold, with no review at all", () => {
  assert.deepEqual(check(pr(), green), []);
  // UNSTABLE: only a non-required check is not green; HAS_HOOKS: mergeable with pre-receive hooks
  assert.deepEqual(check(pr({ mergeStateStatus: "UNSTABLE" }), green), []);
  assert.deepEqual(check(pr({ mergeStateStatus: "HAS_HOOKS" }), green), []);
});

test("condition 1: draft and closed PRs are refused", () => {
  assert.match(check(pr({ isDraft: true }), green).join(), /draft/);
  assert.match(check(pr({ state: "MERGED" }), green).join(), /MERGED/);
  assert.match(check(pr({ state: "CLOSED" }), green).join(), /CLOSED/);
});

test("condition 2: gate missing, failed, in progress, or only an older rerun green", () => {
  assert.match(check(pr(), []).join(), /no Quality Gate run/);
  assert.match(check(pr(), [{ id: 1, conclusion: "failure" }]).join(), /is failure/);
  assert.match(
    check(pr(), [{ id: 1, status: "in_progress", conclusion: null }]).join(),
    /is in_progress/,
  );
  const rerunRed = [
    { id: 1, conclusion: "success" },
    { id: 3, conclusion: "failure" },
  ];
  assert.match(check(pr(), rerunRed).join(), /is failure/);
});

test("condition 3: without a merge queue, the ruleset's merge state must let it merge", () => {
  for (const [state, hint] of [
    ["BEHIND", /merge the base in/],
    ["BLOCKED", /required check or rule/],
    ["DIRTY", /merge conflicts/],
    ["UNKNOWN", /run pr:merge again/],
  ])
    assert.match(
      check(pr({ mergeStateStatus: state }), green).join(),
      new RegExp(`mergeStateStatus is ${state} \\(.*${hint.source}`),
      state,
    );
  assert.match(check(pr({ mergeStateStatus: undefined }), green).join(), /is UNKNOWN/);
  // the queue applies the ruleset itself, so any state enqueues
  assert.deepEqual(check(pr({ mergeStateStatus: "BLOCKED" }), green, { queue: true }), []);
});

test("condition 4: a hold label in any case refuses, queue or not", () => {
  for (const name of ["hold", "HOLD", "Hold"]) {
    assert.match(check(pr({ labels: [{ name }] }), green).join(), /labelled hold/, name);
    assert.match(check(pr({ labels: [{ name }] }), green, { queue: true }).join(), /labelled hold/);
  }
  assert.deepEqual(check(pr({ labels: [{ name: "on-hold-later" }] }), green), []);
});

test("an AI-REVIEW verdict is never read: a FAIL comment does not refuse, and none is needed", () => {
  // blockers takes no comments; the reviewer App is retired (ADR 0523 decision 6)
  assert.equal(blockers.length, 2);
  assert.deepEqual(check(pr(), green, { reviews: [] }), []);
});

test("pr:merge arguments: a number and an optional -R owner/repo", () => {
  assert.deepEqual(parseArgs(["--", "12"]), { n: "12", repo: "{owner}/{repo}" });
  assert.deepEqual(parseArgs(["-R", "figentra/os", "3"]), { n: "3", repo: "figentra/os" });
  assert.deepEqual(parseArgs(["3", "--repo=figentra/os"]), { n: "3", repo: "figentra/os" });
  for (const bad of [[], ["x"], ["1", "2"], ["-R", "os", "1"], ["-R", "a/b;rm", "1"]])
    assert.equal(parseArgs(bad), null, bad.join(" "));
});

test("design / risk:R3 need an owner approval on the head SHA or owner-approved", () => {
  const labels = [{ name: "risk:R3" }];
  assert.match(check(pr({ labels }), green).join(), /owner approval/);
  const stale = [review({ commit_id: "abc" })];
  assert.match(check(pr({ labels }), green, { reviews: stale }).join(), /owner approval/);
  const notOwner = [review({ user: { login: "someone", type: "User" } })];
  assert.match(check(pr({ labels }), green, { reviews: notOwner }).join(), /owner approval/);
  const botOwner = [review({ user: { login: OWNER, type: "Bot" } })];
  assert.match(check(pr({ labels }), green, { reviews: botOwner }).join(), /owner approval/);
  assert.deepEqual(check(pr({ labels }), green, { reviews: [review()] }), []);
  const labelled = [{ name: "design" }, { name: "owner-approved" }];
  const byOwner = [labelEvent("labeled", OWNER, "User")];
  assert.deepEqual(check(pr({ labels: labelled }), green, { events: byOwner }), []);
});

// Shapes as the REST issue events API returns them.
const labelEvent = (event, login, type, created_at = T0, name = "owner-approved", id = 1) => ({
  id,
  event,
  label: { name },
  actor: { login, type },
  created_at,
});

test("STA-330 review: owner-approved counts only when the owner added it and it was not removed since", () => {
  const labels = [{ name: "design" }, { name: "owner-approved" }];
  const merge = (events) => check(pr({ labels }), green, { events });
  assert.deepEqual(merge([labelEvent("labeled", OWNER, "User")]), []);
  // the label on the PR alone, or added by anyone but the owner, never counts
  for (const events of [
    [],
    [labelEvent("labeled", "stackra-bot[bot]", "Bot")],
    [labelEvent("labeled", "someone", "User")],
    [labelEvent("labeled", `${OWNER}[bot]`, "Bot")],
    [labelEvent("labeled", OWNER, "Bot")],
    [labelEvent("labeled", OWNER, "User", T0, "design")],
    // the owner's label removed, then a bot put it back
    [
      labelEvent("labeled", OWNER, "User", T0),
      labelEvent("unlabeled", OWNER, "User", T1),
      labelEvent("labeled", "stackra-bot[bot]", "Bot", T2),
    ],
  ])
    assert.match(
      merge(events).join(),
      /owner-approved label added by figentra-usr/,
      JSON.stringify(events),
    );
  // the latest event decides, in time order whatever the array order
  assert.equal(
    ownerLabelled([
      labelEvent("labeled", OWNER, "User", T2, "owner-approved", 3),
      labelEvent("labeled", "stackra-bot[bot]", "Bot", T0, "owner-approved", 1),
    ]),
    true,
  );
  assert.equal(
    ownerLabelled([
      labelEvent("unlabeled", "someone", "User", T2, "owner-approved", 3),
      labelEvent("labeled", OWNER, "User", T0, "owner-approved", 1),
    ]),
    false,
  );
  // an owner review on the head still passes without the label
  assert.deepEqual(check(pr({ labels }), green, { reviews: [review()], events: [] }), []);
});

test("OP7: enqueueing waits for STA-302's connect timeout and retries", () => {
  assert.equal(enqueueReady({ mintToken() {} }), false);
  assert.equal(enqueueReady({ CONNECT_TIMEOUT_MS: 10_000, RETRY_ATTEMPTS: 4 }), false);
  assert.equal(enqueueReady({ CONNECT_TIMEOUT_MS: 30_000, RETRY_ATTEMPTS: 1 }), false);
  assert.equal(enqueueReady({ CONNECT_TIMEOUT_MS: 30_000, RETRY_ATTEMPTS: 4 }), true);
});

test("OP7: STA-302 opened the enqueue path — bot-token.mjs declares the timeout and retries", () => {
  assert.equal(enqueueReady(network), true);
});

test("STA-302: gh() and graphql() retry reads only; a write that omits the flag runs once", () => {
  const blip = { err: "HTTP 502: Bad Gateway\n", code: 1 };
  const ok = { out: '{"data":{"x":1}}' };
  const path = process.env.PATH;
  const run = (call) => {
    const fake = fakeGh([blip, ok]);
    process.env.PATH = fake.path;
    try {
      return { value: call(), runs: fake.runs() };
    } catch (error) {
      return { error: error.message, runs: fake.runs() };
    } finally {
      process.env.PATH = path;
    }
  };
  assert.deepEqual(
    run(() => gh(["pr", "merge", "1"], "t")),
    {
      error: "gh pr merge failed: HTTP 502: Bad Gateway",
      runs: 1,
    },
  );
  assert.deepEqual(
    run(() => gh(["pr", "view", "1"], "t", true)),
    { value: ok.out, runs: 2 },
  );
  assert.equal(run(() => graphql("mutation{enqueuePullRequest}", [], "t")).runs, 1);
  assert.equal(run(() => graphql("# note\nmutation{enqueuePullRequest}", [], "t")).runs, 1);
  assert.deepEqual(
    run(() => graphql("query{x}", [], "t")),
    { value: { x: 1 }, runs: 2 },
  );
});

test("condition 5: no stackra/verify check run from the verify App refuses (STA-2761, replaces merge-now)", () => {
  assert.match(
    blockers(pr(), green, { app: APP }).join(),
    /no stackra\/verify check run from stackra-verify on 0123/,
  );
});

test("condition 5: VERIFY_APP is the registered stackra-verify App; an App without an id passes nothing", () => {
  assert.deepEqual({ ...VERIFY_APP }, { slug: "stackra-verify", id: 5_907_714 });
  assert.equal(Object.isFrozen(VERIFY_APP), true);
  const registered = [appRun("success", { app: { slug: "stackra-verify", id: 5_907_714 } })];
  assert.deepEqual(blockers(pr(), green, { verifyRuns: registered }), []);
  // the slug check stays: the right id under another slug never counts
  const otherSlug = [appRun("success", { app: { slug: "stackra-bot", id: 5_907_714 } })];
  assert.match(
    blockers(pr(), green, { verifyRuns: otherSlug }).join(),
    /no stackra\/verify check run/,
  );
  const unregistered = { slug: "stackra-verify", id: null };
  const runs = [appRun("success", { app: unregistered })];
  assert.match(
    blockers(pr(), green, { verifyRuns: runs, app: unregistered }).join(),
    /App is not registered/,
  );
  assert.equal(verifyRun(runs, SHA, unregistered), undefined);
});

test("condition 5: stackra/verify-mobile and stackra/codeql never pass or block a merge, whatever they say", () => {
  assert.notEqual(VERIFY_MOBILE_CHECK, VERIFY_CHECK);
  assert.notEqual(CODEQL_CHECK, VERIFY_CHECK);
  // a red mobile or CodeQL run beside a green stackra/verify: merges
  const redOthers = [
    appRun("success", { id: 1 }),
    appRun("failure", { id: 2, name: VERIFY_MOBILE_CHECK }),
    appRun("failure", { id: 3, name: CODEQL_CHECK }),
  ];
  assert.deepEqual(check(pr(), green, { verifyRuns: redOthers }), []);
  assert.equal(verifyRun(redOthers, SHA, APP).id, 1);
  // a green mobile or CodeQL run alone never stands in for stackra/verify
  const greenOthers = [
    appRun("success", { id: 4, name: VERIFY_MOBILE_CHECK }),
    appRun("success", { id: 5, name: CODEQL_CHECK }),
  ];
  assert.match(
    check(pr(), green, { verifyRuns: greenOthers }).join(),
    /no stackra\/verify check run/,
  );
  // and a newer mobile run never shadows the newest stackra/verify run (conditions 5 and 6 read only that name)
  const mixed = [
    appRun("failure", { id: 6 }),
    appRun("success", { id: 7, name: VERIFY_MOBILE_CHECK }),
  ];
  assert.match(
    check(pr(), green, { verifyRuns: mixed }).join(),
    /stackra\/verify on .* is failure/,
  );
});

test("condition 5: a failed, neutral, cancelled or unfinished run refuses and names its link", () => {
  for (const conclusion of ["failure", "neutral", "cancelled", "timed_out", "skipped"])
    assert.match(
      blockers(pr(), green, { app: APP, verifyRuns: [appRun(conclusion)] }).join(),
      new RegExp(
        `stackra/verify on ${SHA} is ${conclusion} \\(https://github.com/figentra/stackra/runs/1\\)`,
      ),
    );
  for (const status of ["queued", "in_progress"])
    assert.match(
      blockers(pr(), green, { app: APP, verifyRuns: [appRun(null, { status })] }).join(),
      new RegExp(`is ${status}: wait`),
    );
});

test("condition 5: forgery — a run from stackra-bot, another App, a same-slug App with another id, or a commit status never counts", () => {
  const forged = [
    appRun("success", { id: 9, app: { slug: "stackra-bot", id: 1 } }),
    appRun("success", { id: 10, app: { slug: "github-actions", id: 15_368 } }),
    appRun("success", { id: 11, app: { slug: "stackra-verify", id: 1 } }),
    appRun("success", { id: 12, app: { slug: "impostor", id: APP.id } }),
  ];
  for (const forgery of forged) {
    assert.equal(verifyRun([forgery], SHA, APP), undefined, JSON.stringify(forgery.app));
    assert.match(
      blockers(pr(), green, { app: APP, verifyRuns: [forgery] }).join(),
      /no stackra\/verify check run/,
    );
  }
  // A newer forged success never hides the App's own failure.
  assert.match(
    blockers(pr(), green, {
      app: APP,
      verifyRuns: [appRun("failure", { id: 1 }), ...forged],
    }).join(),
    /is failure/,
  );
});

test("condition 5: a stale SHA — a run for another commit never stands in for the head", () => {
  const stale = appRun("success", { sha: "f".repeat(40) });
  assert.equal(verifyRun([stale], SHA, APP), undefined);
  assert.match(
    blockers(pr(), green, { app: APP, verifyRuns: [stale] }).join(),
    /no stackra\/verify check run/,
  );
});

test("condition 5: only the newest App run counts (a re-run in progress refuses)", () => {
  assert.deepEqual(
    blockers(pr(), green, {
      app: APP,
      verifyRuns: [appRun("failure", { id: 1 }), appRun("success", { id: 2 })],
    }),
    [],
  );
  assert.match(
    blockers(pr(), green, {
      app: APP,
      verifyRuns: [appRun("success", { id: 1 }), appRun("failure", { id: 2 })],
    }).join(),
    /is failure/,
  );
  assert.match(
    blockers(pr(), green, {
      app: APP,
      verifyRuns: [appRun("success", { id: 1 }), appRun(null, { id: 2, status: "in_progress" })],
    }).join(),
    /in_progress/,
  );
});

test("condition 6: a PR that changes what the verify service checks needs risk:R3", () => {
  for (const path of [
    "turbo.jsonc",
    "packages/data/database/turbo.jsonc",
    "knip.jsonc",
    "packages/ai/vitest.config.ts",
    "packages/data/database/vitest.int.config.ts",
    ".oxlintrc.json",
    "packages/tooling/vitest-config/src/index.ts",
    "tools/scripts/pr-merge.mjs",
    ".npmrc",
    "lefthook.yml",
  ])
    assert.equal(isVerifyDefinition(path), true, path);
  // the Quality Gate's own policies are main's, so a PR cannot weaken the gate it is judged by
  for (const path of [
    ".github/zizmor.yml",
    ".gitleaks.toml",
    ".gitleaksignore",
    ".commitlintrc.yaml",
    "commitlint.config.mjs",
    "osv-scanner.toml",
    "tools/policy/licences.json",
    "tools/scripts/stackra-verify.mjs",
  ]) {
    assert.equal(isVerifyOverlay(path), true, path);
    assert.equal(isVerifyDefinition(path), true, path);
  }
  for (const path of [".github/workflows/ci.yml", "docs/zizmor.yml", "packages/x/osv-scanner.md"])
    assert.equal(isVerifyOverlay(path), false, path);
  for (const field of ["knip", "commitlint"]) {
    assert.equal(DEFINITION_FIELDS.includes(field), true, field);
    assert.equal(
      definitionFieldsChanged(`{"${field}":{"a":1}}`, `{"${field}":{"a":2}}`),
      true,
      field,
    );
  }
  for (const path of [
    "packages/ai/src/index.ts",
    "README.md",
    "packages/ai/package.json",
    "apps/docs/src/docs/x.mdx",
  ])
    assert.equal(isVerifyDefinition(path), false, path);
  assert.equal(
    scriptsChanged('{"scripts":{"test":"vitest run"}}', '{"scripts":{"test":"true"}}'),
    true,
  );
  assert.equal(
    scriptsChanged(
      '{"scripts":{"test":"vitest run"},"version":"1"}',
      '{"version":"2","scripts":{"test":"vitest run"}}',
    ),
    false,
  );
  assert.equal(scriptsChanged(null, '{"scripts":{"verify":"true"}}'), true);
  const changes = ["turbo.jsonc", "package.json"];
  assert.match(
    blockers(pr(), green, { app: APP, verifyRuns: verified, definitionChanges: changes }).join(),
    /label it risk:R3/,
  );
  // with risk:R3 the owner's approval decides (the existing gated-label rule)
  assert.match(
    blockers(pr({ labels: [{ name: "risk:R3" }] }), green, {
      app: APP,
      verifyRuns: verified,
      definitionChanges: changes,
    }).join(),
    /needs an owner approval/,
  );
});

test("condition 6: every config a gate tool discovers by name, at any depth, is main's (CTO review HIGH 1)", () => {
  for (const path of [
    "package.yaml",
    "packages/a/package.yaml",
    "packages/a/package.json5",
    ".commitlintrc",
    ".commitlintrc.json",
    ".commitlintrc.cts",
    "commitlint.config.mts",
    ".config/config.json",
    "packages/a/.config/commitlintrc.yaml",
    "knip.json",
    ".knip.json",
    ".knip.jsonc",
    "knip.ts",
    "packages/a/knip.config.js",
    "packages/a/.oxlintrc.json",
    "packages/a/oxlint.config.mts",
    "oxfmt.config.ts",
    ".eslintignore",
    ".oxlintignore",
    "packages/a/.prettierignore",
    ".prettierrc.json",
    ".editorconfig",
    "scripts/.shellcheckrc",
    "services/a/.squawk.toml",
    ".github/actionlint.yaml",
    ".github/actionlint.yml",
    "zizmor.yml",
    "packages/a/vitest.projects.ts",
  ]) {
    assert.equal(isVerifyOverlay(path), true, path);
    assert.equal(isVerifyDefinition(path), true, path);
  }
});

test("condition 6: a root-level file is a definition unless it is inert documentation or tested code", () => {
  // every root file main has today, as the rule sorts it
  for (const path of [
    ".commitlintrc.yaml",
    ".editorconfig",
    ".gitattributes",
    ".gitignore",
    ".gitleaks.toml",
    ".gitleaksignore",
    ".gitmodules",
    ".markdownlint.yaml",
    ".mcp.yaml",
    ".node-version",
    ".npmrc",
    ".oxfmtrc.jsonc",
    ".oxlintrc.jsonc",
    ".pnpmfile.mjs",
    "cspell.config.yaml",
    "flow.config.json",
    "knip.jsonc",
    "lefthook.yml",
    "mise.toml",
    "opencode.jsonc",
    "osv-scanner.toml",
    "turbo.jsonc",
    // and anything new a tool might read
    "biome.json",
    ".tool-versions",
    "deno.json",
  ]) {
    assert.equal(isRootDefinition(path), true, path);
    assert.equal(isVerifyOverlay(path), true, path);
  }
  for (const path of [
    "AGENTS.md",
    "CLAUDE.md",
    "CONTRIBUTING.md",
    "LICENSE",
    "NOTICE",
    "README.md",
    "SECURITY.md",
    "STATE.md",
    "THIRD_PARTY_NOTICES.md",
    "TRADEMARKS.md",
    "llms.txt",
    "CHANGELOG.md",
  ]) {
    assert.equal(isRootDefinition(path), false, path);
    assert.equal(isVerifyDefinition(path), false, path);
  }
  // tested code: a lane PR that bumps a dependency or edits a member's source is not a definition change
  for (const path of ["package.json", "runway.yaml", "packages/a/src/index.ts", "docs/guide.md"])
    assert.equal(isVerifyDefinition(path), false, path);
  for (const path of ["pnpm-lock.yaml", "pnpm-workspace.yaml"]) {
    assert.equal(isRootDefinition(path), false, path);
    assert.equal(isVerifyOverlay(path), false, path);
    assert.equal(isVerifyDefinition(path), true, path);
  }
  // a name that only looks inert at the root is a definition below it only when a tool reads it
  assert.equal(isVerifyDefinition("packages/a/README.md"), false);
  assert.equal(isVerifyDefinition("packages/a/mise.toml"), false);
});

test("condition 6: a PR that adds only a patch and a workspace entry needs risk:R3 (it changes what verify runs)", () => {
  for (const path of [
    "patches/vitest@5.0.5.patch",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "packages/a/tsconfig.json",
    "packages/a/tsconfig.build.json",
    "packages/a/vite.config.ts",
    "packages/a/vitest.setup.ts",
    "packages/developer/cli/src/x.ts",
    ".pnpmfile.cjs",
    ".gitattributes",
  ])
    assert.equal(isVerifyDefinition(path), true, path);
  assert.equal(isVerifyOverlay("pnpm-workspace.yaml"), false);
  assert.equal(isVerifyOverlay(".pnpmfile.cjs"), true);
  const changes = ["patches/vitest@5.0.5.patch", "pnpm-workspace.yaml"];
  assert.match(
    blockers(pr(), green, { app: APP, verifyRuns: verified, definitionChanges: changes }).join(),
    /label it risk:R3/,
  );
});

test("condition 6: package.json definition fields — scripts, pnpm, overrides, resolutions, packageManager; reads fail closed", () => {
  const base = '{"name":"a","version":"1","scripts":{"test":"vitest run"}}';
  assert.equal(
    definitionFieldsChanged(base, '{"name":"a","version":"2","scripts":{"test":"vitest run"}}'),
    false,
  );
  for (const head of [
    '{"name":"a","scripts":{"test":"true"}}',
    '{"name":"a","scripts":{"test":"vitest run"},"pnpm":{"patchedDependencies":{"vitest":"p"}}}',
    '{"name":"a","scripts":{"test":"vitest run"},"overrides":{"vitest":"npm:noop"}}',
    '{"name":"a","scripts":{"test":"vitest run"},"packageManager":"pnpm@1.0.0"}',
  ])
    assert.equal(definitionFieldsChanged(base, head), true, head);
  assert.equal(definitionFieldsChanged(base, null, "modified"), true);
  // a read failure counts as a change even when the copy that was read has no definition field
  assert.equal(definitionFieldsChanged('{"name":"a"}', null, "modified"), true);
  assert.equal(definitionFieldsChanged(null, '{"name":"a"}', "modified"), true);
  assert.equal(definitionFieldsChanged(null, null, "modified"), true);
  assert.equal(definitionFieldsChanged(null, base, "modified"), true);
  assert.equal(definitionFieldsChanged(null, '{"name":"new"}', "added"), false);
  assert.equal(definitionFieldsChanged(null, '{"name":"new","scripts":{"x":"y"}}', "added"), true);
  assert.equal(definitionFieldsChanged(base, null, "removed"), true);
  assert.equal(definitionFieldsChanged('{"name":"gone"}', null, "removed"), false);
});

test("condition 5: a success against an older main refuses until the re-verify", () => {
  const MAIN = "e".repeat(40);
  const ok = { ...appRun("success"), external_id: `base:${MAIN}` };
  assert.deepEqual(blockers(pr(), green, { app: APP, verifyRuns: [ok], mainSha: MAIN }), []);
  const old = { ...appRun("success"), external_id: `base:${"d".repeat(40)}` };
  assert.match(
    blockers(pr(), green, { app: APP, verifyRuns: [old], mainSha: MAIN }).join(),
    /main is now e{40}: wait for the re-verify/,
  );
});

test("verifyFacts: the main block reads the head's verify runs, current main and every changed definition file", () => {
  const HEAD = SHA;
  const MAIN = "e".repeat(40);
  const calls = [];
  const api = (path) => {
    calls.push(path);
    if (path.startsWith("repos/figentra/stackra/commits/" + HEAD + "/check-runs"))
      return { check_runs: [appRun("success")] };
    if (path === "repos/figentra/stackra/pulls/7")
      return { base: { sha: "b".repeat(40), ref: "main" }, changed_files: 5 };
    if (path === "repos/figentra/stackra/commits/main") return { sha: MAIN };
    throw new Error(`unexpected ${path}`);
  };
  const list = (path) => {
    calls.push(path);
    return [
      { filename: "src/a.ts", status: "modified" },
      { filename: "packages/a/package.json", status: "modified" },
      { filename: "packages/b/package.json", status: "modified" },
      { filename: "turbo.jsonc", status: "modified" },
    ];
  };
  const raw = (path, ref) =>
    path === "packages/a/package.json"
      ? ref === HEAD
        ? '{"scripts":{"test":"true"}}'
        : '{"scripts":{"test":"vitest run"}}'
      : '{"version":"' + ref.slice(0, 1) + '"}';
  const facts = verifyFacts({ repo: "figentra/stackra", n: "7", headSha: HEAD, api, list, raw });
  assert.equal(facts.verifyRuns.length, 1);
  assert.equal(facts.mainSha, MAIN);
  assert.deepEqual(facts.definitionChanges, [
    "1 unlisted files",
    "packages/a/package.json",
    "turbo.jsonc",
  ]);
  assert.ok(calls.includes("repos/figentra/stackra/pulls/7/files?per_page=100"));
  // only our App's runs are listed (LOW 8): another App's flood cannot push ours past the first page
  assert.match(calls[0], /check-runs\?check_name=stackra%2Fverify&app_id=5907714&filter=all/);
  assert.equal(VERIFY_APP.id, 5_907_714);
});

test("condition 6: a package.json `bin` or `directories` change can shadow a tool, so it counts", () => {
  const base = '{"name":"a","scripts":{"t":"x"}}';
  assert.equal(
    definitionFieldsChanged(base, '{"name":"a","scripts":{"t":"x"},"bin":{"tsc":"./fake.js"}}'),
    true,
  );
  assert.equal(
    definitionFieldsChanged(base, '{"name":"a","scripts":{"t":"x"},"directories":{"bin":"./b"}}'),
    true,
  );
});

/** A success against an older main, finished at `completed_at`. */
const oldBase = (completed_at) => ({
  ...appRun("success"),
  external_id: `base:${"d".repeat(40)}`,
  completed_at,
});

test("condition 5: a green against an older main stands for a day (to enter the queue), then refuses", () => {
  const MAIN = "e".repeat(40);
  const NOW = Date.parse("2026-11-24T15:00:00Z");
  assert.deepEqual(
    blockers(pr(), green, {
      app: APP,
      verifyRuns: [oldBase(new Date(NOW - 60_000).toISOString())],
      mainSha: MAIN,
      now: NOW,
    }),
    [],
  );
  assert.match(
    blockers(pr(), green, {
      app: APP,
      verifyRuns: [oldBase(new Date(NOW - VERIFY_FRESH_MS - 60_000).toISOString())],
      mainSha: MAIN,
      now: NOW,
    }).join(),
    /more than a day ago/,
  );
});

test("mergeBlockers: the main block always passes main, the runs and the definition changes from verifyFacts", () => {
  const facts = {
    verifyRuns: [
      {
        ...appRun("success"),
        external_id: `base:${"d".repeat(40)}`,
        completed_at: "2026-01-01T00:00:00Z",
      },
    ],
    mainSha: "e".repeat(40),
    definitionChanges: ["turbo.jsonc"],
  };
  const reasons = mergeBlockers(pr(), green, { app: APP }, facts).join();
  assert.match(reasons, /main is now e{40}/);
  assert.match(reasons, /label it risk:R3/);
});

test("isRecent: a future completed_at never counts as recent", () => {
  const NOW = Date.parse("2026-11-24T15:00:00Z");
  assert.equal(isRecent(new Date(NOW - 60_000).toISOString(), NOW), true);
  assert.equal(isRecent(new Date(NOW + 60_000).toISOString(), NOW), false);
  assert.equal(isRecent("garbage", NOW), false);
});
