import { test } from "node:test";
import assert from "node:assert/strict";
import { actor, aiReview, blockers, OWNER, parseArgs, REVIEWER } from "../pr-merge.mjs";

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
  assert.deepEqual(blockers(pr({ labels: labelled }), green, {}, ok), []);
});
