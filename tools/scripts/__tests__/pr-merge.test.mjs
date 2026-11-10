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
  OWNER,
  ownerLabelled,
  parseArgs,
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
// Shapes as the REST pull reviews API returns them.
const review = (over = {}) => ({
  user: { login: OWNER, type: "User" },
  state: "APPROVED",
  commit_id: SHA,
  body: "",
  ...over,
});

test("merges an open PR with a green gate, a clean merge state and no hold, with no review at all", () => {
  assert.deepEqual(blockers(pr(), green), []);
  // UNSTABLE: only a non-required check is not green; HAS_HOOKS: mergeable with pre-receive hooks
  assert.deepEqual(blockers(pr({ mergeStateStatus: "UNSTABLE" }), green), []);
  assert.deepEqual(blockers(pr({ mergeStateStatus: "HAS_HOOKS" }), green), []);
});

test("condition 1: draft and closed PRs are refused", () => {
  assert.match(blockers(pr({ isDraft: true }), green).join(), /draft/);
  assert.match(blockers(pr({ state: "MERGED" }), green).join(), /MERGED/);
  assert.match(blockers(pr({ state: "CLOSED" }), green).join(), /CLOSED/);
});

test("condition 2: gate missing, failed, in progress, or only an older rerun green", () => {
  assert.match(blockers(pr(), []).join(), /no Quality Gate run/);
  assert.match(blockers(pr(), [{ id: 1, conclusion: "failure" }]).join(), /is failure/);
  assert.match(
    blockers(pr(), [{ id: 1, status: "in_progress", conclusion: null }]).join(),
    /is in_progress/,
  );
  const rerunRed = [
    { id: 1, conclusion: "success" },
    { id: 3, conclusion: "failure" },
  ];
  assert.match(blockers(pr(), rerunRed).join(), /is failure/);
});

test("condition 3: without a merge queue, the ruleset's merge state must let it merge", () => {
  for (const [state, hint] of [
    ["BEHIND", /merge the base in/],
    ["BLOCKED", /required check or rule/],
    ["DIRTY", /merge conflicts/],
    ["UNKNOWN", /run pr:merge again/],
  ])
    assert.match(
      blockers(pr({ mergeStateStatus: state }), green).join(),
      new RegExp(`mergeStateStatus is ${state} \\(.*${hint.source}`),
      state,
    );
  assert.match(blockers(pr({ mergeStateStatus: undefined }), green).join(), /is UNKNOWN/);
  // the queue applies the ruleset itself, so any state enqueues
  assert.deepEqual(blockers(pr({ mergeStateStatus: "BLOCKED" }), green, { queue: true }), []);
});

test("condition 4: a hold label in any case refuses, queue or not", () => {
  for (const name of ["hold", "HOLD", "Hold"]) {
    assert.match(blockers(pr({ labels: [{ name }] }), green).join(), /labelled hold/, name);
    assert.match(
      blockers(pr({ labels: [{ name }] }), green, { queue: true }).join(),
      /labelled hold/,
    );
  }
  assert.deepEqual(blockers(pr({ labels: [{ name: "on-hold-later" }] }), green), []);
});

test("an AI-REVIEW verdict is never read: a FAIL comment does not refuse, and none is needed", () => {
  // blockers takes no comments; the reviewer App is retired (ADR 0523 decision 6)
  assert.equal(blockers.length, 2);
  assert.deepEqual(blockers(pr(), green, { reviews: [] }), []);
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
  assert.match(blockers(pr({ labels }), green).join(), /owner approval/);
  const stale = [review({ commit_id: "abc" })];
  assert.match(blockers(pr({ labels }), green, { reviews: stale }).join(), /owner approval/);
  const notOwner = [review({ user: { login: "someone", type: "User" } })];
  assert.match(blockers(pr({ labels }), green, { reviews: notOwner }).join(), /owner approval/);
  const botOwner = [review({ user: { login: OWNER, type: "Bot" } })];
  assert.match(blockers(pr({ labels }), green, { reviews: botOwner }).join(), /owner approval/);
  assert.deepEqual(blockers(pr({ labels }), green, { reviews: [review()] }), []);
  const labelled = [{ name: "design" }, { name: "owner-approved" }];
  const byOwner = [labelEvent("labeled", OWNER, "User")];
  assert.deepEqual(blockers(pr({ labels: labelled }), green, { events: byOwner }), []);
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
  const merge = (events) => blockers(pr({ labels }), green, { events });
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
  assert.deepEqual(blockers(pr({ labels }), green, { reviews: [review()], events: [] }), []);
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
