/**
 * Stackra file contract:
 * Purpose: hold `pr-merge.mjs` to its contract: the green gate, draft and closed PRs refused, the reviewer app's
 *          verdict on the head's patch id, owner approval where needed, and the merge or enqueue retries.
 * Boundary: mocked gh and GraphQL; no network, nothing merged.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). ADR 0119 (merge policy);
 *                     ADR 0230 (reviewer identity).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as network from "../bot-token.mjs";
import {
  actor,
  aiReview,
  blockers,
  enqueueReady,
  gh,
  graphql,
  OWNER,
  ownerLabelled,
  parseArgs,
  patchId,
  REVIEWER,
  samePatchShas,
} from "../pr-merge.mjs";
import { fakeGh } from "./__fixtures__/fake-gh.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const T0 = "2026-10-19T10:00:00Z";
const T1 = "2026-10-19T11:00:00Z";
const T2 = "2026-10-19T12:00:00Z";
// Shapes as the REST issue comments, pull reviews, check-runs and commits APIs return them.
const appComment = (slug, body, created_at = T0, updated_at = created_at) => ({
  user: { login: `${slug}[bot]`, type: "Bot" },
  performed_via_github_app: { slug },
  body,
  created_at,
  updated_at,
});
const reviewer = (body, created, updated) => appComment(REVIEWER, body, created, updated);
const userComment = (login, body) => ({
  user: { login, type: "User" },
  performed_via_github_app: null,
  body,
  created_at: T0,
  updated_at: T0,
});
const PASS = `AI-REVIEW: PASS ${SHA} base=main\n\nNo findings.`;
const FAIL = `AI-REVIEW: FAIL ${SHA}\n\nH1.`;
const pr = (over = {}) => ({
  number: 1,
  state: "OPEN",
  isDraft: false,
  headRefOid: SHA,
  baseRefName: "main",
  author: { login: "app/stackra-bot" },
  labels: [],
  ...over,
});
const green = [{ id: 2, status: "completed", conclusion: "success" }];
const builtByBot = {
  author: { login: "stackra-bot[bot]" },
  committer: { login: "stackra-bot[bot]" },
};
const review = (over = {}) => ({
  user: { login: OWNER, type: "User" },
  state: "APPROVED",
  commit_id: SHA,
  body: "owner-approval",
  ...over,
});
const verdict = (comments, reviews = [], p = pr()) =>
  aiReview(p, comments, reviews, ["app/stackra-bot"]).verdict;

test("merges when gate is green, not draft, and the reviewer app passed the head SHA on this base", () => {
  assert.deepEqual(blockers(pr(), green, builtByBot, [reviewer(PASS)]), []);
});

test("gate: missing, failed, in progress, or only an older rerun green", () => {
  const ok = [reviewer(PASS)];
  assert.match(blockers(pr(), [], {}, ok).join(), /no Quality Gate run/);
  assert.match(blockers(pr(), [{ id: 1, conclusion: "failure" }], {}, ok).join(), /is failure/);
  assert.match(
    blockers(pr(), [{ id: 1, status: "in_progress", conclusion: null }], {}, ok).join(),
    /is in_progress/,
  );
  const rerunRed = [
    { id: 1, conclusion: "success" },
    { id: 3, conclusion: "failure" },
  ];
  assert.match(blockers(pr(), rerunRed, {}, ok).join(), /is failure/);
});

test("draft and closed PRs are refused", () => {
  assert.match(blockers(pr({ isDraft: true }), green, {}, [reviewer(PASS)]).join(), /draft/);
  assert.match(blockers(pr({ state: "MERGED" }), green, {}, [reviewer(PASS)]).join(), /MERGED/);
});

test("logins normalise across gh's user and app forms", () => {
  assert.equal(actor("app/stackra-bot"), "stackra-bot");
  assert.equal(actor("stackra-bot[bot]"), "stackra-bot");
  assert.equal(actor("Figentra-Usr"), "figentra-usr");
});

test("H1: only the App counts, never an account that shares its name or another app", () => {
  assert.equal(verdict([userComment(REVIEWER, PASS)]), null);
  assert.equal(verdict([userComment(`${REVIEWER}[bot]`, PASS)]), null);
  const botNoApp = { ...reviewer(PASS), performed_via_github_app: null };
  assert.equal(verdict([botNoApp]), null);
  const reasons = blockers(pr(), green, builtByBot, [appComment("stackra-bot", PASS)]).join();
  assert.match(reasons, /stackra-bot\[bot\] is not the stackra-reviewer app/);
});

test("H2: an edited verdict is ignored, and an edit voids every older reviewer verdict", () => {
  assert.equal(verdict([reviewer(PASS, T0, T1)]), null);
  // FAIL at T1 edited at T2 into anything: the older PASS at T0 must not come back.
  assert.equal(verdict([reviewer(PASS, T0), reviewer("ok", T1, T2)]), null);
  assert.match(
    blockers(pr(), green, builtByBot, [reviewer(PASS, T0), reviewer("x", T1, T2)]).join(),
    /edited after this verdict/,
  );
  // A fresh verdict after the edit counts.
  assert.equal(verdict([reviewer(PASS, T0), reviewer("x", T1, T2), reviewer(PASS, T2)]), "PASS");
});

test("L1: the full 40-hex head SHA, on the first line", () => {
  assert.equal(verdict([reviewer(`AI-REVIEW: PASS ${SHA.slice(0, 7)} base=main`)]), null);
  assert.equal(verdict([reviewer(`see AI-REVIEW: PASS ${SHA} base=main`)]), null);
  assert.equal(verdict([reviewer(`AI-REVIEW: PASS ${"f".repeat(40)} base=main`)]), null);
});

test("M3: a PASS is bound to the base ref the PR targets", () => {
  assert.equal(verdict([reviewer(`AI-REVIEW: PASS ${SHA}`)]), null);
  assert.equal(verdict([reviewer(PASS)], [], pr({ baseRefName: "release" })), null);
  assert.match(
    blockers(pr({ baseRefName: "release" }), green, builtByBot, [reviewer(PASS)]).join(),
    /PASS names base main, the PR targets release/,
  );
});

test("L3: a FAIL for the head SHA is sticky over any PASS, older or newer", () => {
  assert.equal(verdict([reviewer(FAIL, T0), reviewer(PASS, T1)]), "FAIL");
  assert.equal(verdict([reviewer(PASS, T0), reviewer(FAIL, T1)]), "FAIL");
  assert.match(
    blockers(pr(), green, builtByBot, [reviewer(FAIL, T0), reviewer(PASS, T1)]).join(),
    /counted verdict: FAIL/,
  );
});

test("N1: a FAIL is read loosely (short SHA, no SHA, trailing text); PASS stays strict", () => {
  for (const body of [
    `AI-REVIEW: FAIL ${SHA.slice(0, 7)}`,
    `AI-REVIEW: FAIL ${SHA} base=main — see H1`,
    "AI-REVIEW: FAIL",
    "ai-review: fail, two blocking findings",
    "AI-REVIEW: FAILED",
    `**AI-REVIEW: FAIL** ${SHA}`,
    "**AI-REVIEW: FAIL**",
    "> AI-REVIEW - fail",
  ])
    assert.equal(verdict([reviewer(body, T1), reviewer(PASS, T0)]), "FAIL", body);
  // A FAIL naming another commit belongs to an older head; a new commit clears it.
  assert.equal(verdict([reviewer("AI-REVIEW: FAIL fedcba9", T1), reviewer(PASS, T0)]), "PASS");
  // Still only the reviewer app's FAIL counts.
  assert.equal(verdict([appComment("stackra-bot", "AI-REVIEW: FAIL"), reviewer(PASS)]), "PASS");
  assert.equal(verdict([reviewer(`AI-REVIEW: PASS ${SHA} base=main trailing`)]), null);
});

test("pr:merge arguments: a number and an optional -R owner/repo", () => {
  assert.deepEqual(parseArgs(["--", "12"]), { n: "12", repo: "{owner}/{repo}" });
  assert.deepEqual(parseArgs(["-R", "figentra/os", "3"]), { n: "3", repo: "figentra/os" });
  assert.deepEqual(parseArgs(["3", "--repo=figentra/os"]), { n: "3", repo: "figentra/os" });
  for (const bad of [[], ["x"], ["1", "2"], ["-R", "os", "1"], ["-R", "a/b;rm", "1"]])
    assert.equal(parseArgs(bad), null, bad.join(" "));
});

test("the reviewer cannot pass a change it authored or committed", () => {
  const byReviewer = { author: { login: `${REVIEWER}[bot]` }, committer: { login: "web-flow" } };
  assert.match(
    blockers(pr(), green, byReviewer, [reviewer(PASS)]).join(),
    /stackra-reviewer\[bot\] authored this change/,
  );
  assert.match(
    blockers(pr({ author: { login: `app/${REVIEWER}` } }), green, builtByBot, [
      reviewer(PASS),
    ]).join(),
    /authored this change/,
  );
});

test("M2/L2: the owner passes only by an APPROVED review on the head ending in owner-approval", () => {
  assert.equal(verdict([], [review()]), "PASS");
  assert.equal(verdict([], [review({ body: "LGTM\n\nowner-approval" })]), "PASS");
  assert.equal(verdict([userComment(OWNER, `${PASS} owner-approval`)]), null);
  assert.equal(verdict([], [review({ body: "not-owner-approval" })]), null);
  assert.equal(verdict([], [review({ body: "no owner-approval yet" })]), null);
  assert.equal(verdict([], [review({ state: "COMMENTED" })]), null);
  assert.equal(verdict([], [review({ commit_id: "abc" })]), null);
  assert.equal(verdict([], [review({ user: { login: OWNER, type: "Bot" } })]), null);
  const ownCommit = { author: { login: OWNER }, committer: { login: OWNER } };
  assert.match(blockers(pr(), green, ownCommit, [], [review()]).join(), /no AI review PASS/);
  // N2: a reviewer FAIL on the same SHA overrides the owner's approving review, loose FAIL too.
  assert.equal(verdict([reviewer(FAIL)], [review()]), "FAIL");
  assert.equal(verdict([reviewer("AI-REVIEW: FAIL")], [review()]), "FAIL");
});

test("design / risk:R3 need an owner approval on the head SHA or owner-approved", () => {
  const labels = [{ name: "risk:R3" }];
  const ok = [reviewer(PASS)];
  assert.match(blockers(pr({ labels }), green, {}, ok).join(), /owner approval/);
  const stale = [review({ commit_id: "abc", body: "" })];
  assert.match(blockers(pr({ labels }), green, {}, ok, stale).join(), /owner approval/);
  const notOwner = [review({ user: { login: "someone", type: "User" }, body: "" })];
  assert.match(blockers(pr({ labels }), green, {}, ok, notOwner).join(), /owner approval/);
  assert.deepEqual(blockers(pr({ labels }), green, {}, ok, [review({ body: "" })]), []);
  const labelled = [{ name: "design" }, { name: "owner-approved" }];
  const byOwner = [labelEvent("labeled", OWNER, "User")];
  assert.deepEqual(blockers(pr({ labels: labelled }), green, {}, ok, [], undefined, byOwner), []);
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
  const ok = [reviewer(PASS)];
  const merge = (events) => blockers(pr({ labels }), green, {}, ok, [], undefined, events);
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
  assert.deepEqual(
    blockers(pr({ labels }), green, {}, ok, [review({ body: "" })], undefined, []),
    [],
  );
});

const OLD = "fedcba9876543210fedcba9876543210fedcba98";
const P1 = "1".repeat(40);
const P2 = "2".repeat(40);

test("STA-234: a verdict on an earlier head with the same patch id counts as the head's", () => {
  const oldPass = reviewer(`AI-REVIEW: PASS ${OLD} base=main`);
  const patches = { [SHA]: P1, [OLD]: P1 };
  const same = samePatchShas(pr(), [oldPass], (c) => patches[c] ?? null);
  assert.deepEqual([...same], [OLD]);
  assert.deepEqual(blockers(pr(), green, builtByBot, [oldPass], [], same), []);
  // Any diff change voids it.
  const changed = samePatchShas(pr(), [oldPass], (c) => ({ [SHA]: P2, [OLD]: P1 })[c]);
  assert.equal(changed.size, 0);
  assert.match(blockers(pr(), green, builtByBot, [oldPass], [], changed).join(), /no AI review/);
});

test("STA-234: a FAIL on a same-patch earlier head stays sticky, strict, short or with trailing text", () => {
  // The real path: samePatchShas parses the comments, then aiReview counts them.
  const patches = { [SHA]: P1, [OLD]: P1 };
  const patchOf = (c) => patches[Object.keys(patches).find((k) => k.startsWith(c))] ?? null;
  const counted = (comments) =>
    aiReview(pr(), comments, [], [], samePatchShas(pr(), comments, patchOf)).verdict;
  const oldPass = reviewer(`AI-REVIEW: PASS ${OLD} base=main`, T0);
  for (const fail of [
    `AI-REVIEW: FAIL ${OLD}`,
    `AI-REVIEW: FAIL ${OLD.slice(0, 9)}`,
    `AI-REVIEW: FAIL ${OLD} blocking: tenant leak`,
  ]) {
    assert.equal(counted([oldPass, reviewer(fail, T1)]), "FAIL", fail);
    assert.equal(counted([reviewer(fail, T0), reviewer(PASS, T1)]), "FAIL", fail);
  }
  // A FAIL for an earlier head whose diff differs is cleared by the new diff, as before.
  patches[OLD] = P2;
  assert.equal(counted([reviewer(`AI-REVIEW: FAIL ${OLD.slice(0, 9)}`), reviewer(PASS)]), "PASS");
});

test("STA-234: patch= is used only when the earlier head is gone; only the app's verdicts count", () => {
  const claimed = (patch) => reviewer(`AI-REVIEW: PASS ${OLD} base=main patch=${patch}`);
  const gone = (c) => (c === SHA ? P1 : null);
  assert.deepEqual([...samePatchShas(pr(), [claimed(P1)], gone)], [OLD]);
  assert.equal(samePatchShas(pr(), [claimed(P2)], gone).size, 0);
  // A recomputed patch id beats the claim.
  const both = (c) => ({ [SHA]: P1, [OLD]: P2 })[c];
  assert.equal(samePatchShas(pr(), [claimed(P1)], both).size, 0);
  const user = userComment(REVIEWER, `AI-REVIEW: PASS ${OLD} base=main patch=${P1}`);
  assert.equal(samePatchShas(pr(), [user], gone).size, 0);
  // An edited verdict's claim is not read, and disagreeing claims cancel out.
  const edited = reviewer(`AI-REVIEW: PASS ${OLD} base=main patch=${P1}`, T0, T1);
  assert.equal(samePatchShas(pr(), [edited], gone).size, 0);
  assert.equal(samePatchShas(pr(), [claimed(P1), claimed(P2)], gone).size, 0);
  // No head patch id (compare failed): nothing carries over.
  assert.equal(samePatchShas(pr(), [claimed(P1)], () => null).size, 0);
  // The head's own PASS may carry patch=.
  assert.equal(verdict([reviewer(`AI-REVIEW: PASS ${SHA} base=main patch=${P1}`)]), "PASS");
});

const oneLineDiff = (at, ...lines) =>
  `diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -${at},1 +${at},${lines.length} @@\n-old\n` +
  lines.map((l) => `+${l}\n`).join("");

test("patchId ignores line numbers and changes with the content, whitespace included", () => {
  assert.match(patchId(oneLineDiff(1, "new")), /^[0-9a-f]{40}$/);
  assert.equal(patchId(oneLineDiff(1, "new")), patchId(oneLineDiff(40, "new")));
  assert.notEqual(patchId(oneLineDiff(1, "new")), patchId(oneLineDiff(1, "other")));
  // Whitespace-only differences change the id (`--stable` would give one id for each pair).
  assert.notEqual(patchId(oneLineDiff(1, "echo /tmp/x")), patchId(oneLineDiff(1, "echo / tmp/x")));
  assert.notEqual(
    patchId(oneLineDiff(1, "  - run: deploy", "    if: github.ref == y")),
    patchId(oneLineDiff(1, "  - run: deploy", "  if: github.ref == y")),
  );
  assert.equal(patchId(""), null);
});

const ciStepDiff = (at, line) =>
  `diff --git a/ci.yml b/ci.yml\n--- a/ci.yml\n+++ b/ci.yml\n@@ -${at},2 +${at},2 @@\n` +
  ` steps:\n-  old\n+${line}\n`;

test("ADR 0285 end to end: a rebase that only shifts lines keeps the PASS, a whitespace edit voids it", () => {
  const oldPass = reviewer(`AI-REVIEW: PASS ${OLD} base=main`);
  const run = (headDiff) => {
    const diffs = { [OLD]: ciStepDiff(3, "    if: github.ref == y"), [SHA]: headDiff };
    const same = samePatchShas(pr(), [oldPass], (c) => patchId(diffs[c]));
    return blockers(pr(), green, builtByBot, [oldPass], [], same);
  };
  assert.deepEqual(run(ciStepDiff(30, "    if: github.ref == y")), []);
  assert.match(run(ciStepDiff(3, "  if: github.ref == y")).join(), /no AI review/);
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
