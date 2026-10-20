import { test } from "node:test";
import assert from "node:assert/strict";
import { actor, aiReview, blockers, OWNER, REVIEWER } from "../pr-merge.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const comment = (login, body, createdAt = "2026-10-19T10:00:00Z") => ({
  author: { login },
  body,
  createdAt,
});
// Shapes as `gh pr view --json …`, the check-runs API and the commits API return them.
const pr = (over = {}) => ({
  number: 1,
  state: "OPEN",
  isDraft: false,
  headRefOid: SHA,
  author: { login: "app/stackra-bot" },
  labels: [],
  reviews: [],
  comments: [comment(`${REVIEWER}[bot]`, `AI-REVIEW: PASS ${SHA}\n\nNo findings.`)],
  ...over,
});
const green = [{ id: 2, status: "completed", conclusion: "success" }];
const builtByBot = {
  author: { login: "stackra-bot[bot]" },
  committer: { login: "stackra-bot[bot]" },
};
const verdict = (comments, authors) => aiReview(comments, SHA, authors).verdict;

test("merges when gate is green, not draft, and the reviewer app passed the head SHA", () => {
  assert.deepEqual(blockers(pr(), green, builtByBot), []);
});

test("gate: missing, failed, in progress, or only an older rerun green", () => {
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

test("draft and closed PRs are refused", () => {
  assert.match(blockers(pr({ isDraft: true }), green).join(), /draft/);
  assert.match(blockers(pr({ state: "MERGED" }), green).join(), /MERGED/);
});

test("logins normalise across gh's user and app forms", () => {
  assert.equal(actor("app/stackra-bot"), "stackra-bot");
  assert.equal(actor("stackra-bot[bot]"), "stackra-bot");
  assert.equal(actor("Figentra-Usr"), "figentra-usr");
});

test("only the reviewer identity's verdict for the exact head SHA counts; newest wins", () => {
  assert.equal(verdict([comment(REVIEWER, `AI-REVIEW: PASS fffffff`)]), null);
  assert.equal(verdict([comment(REVIEWER, `AI-REVIEW: PASS ${SHA.slice(0, 7)}`)]), "PASS");
  assert.equal(verdict([comment(REVIEWER, `see AI-REVIEW: PASS ${SHA}`)]), null);
  assert.equal(verdict([comment("mallory", `AI-REVIEW: PASS ${SHA}`)]), null);
  const flipped = [
    comment(REVIEWER, `AI-REVIEW: FAIL ${SHA}`, "2026-10-19T11:00:00Z"),
    comment(REVIEWER, `AI-REVIEW: PASS ${SHA}`, "2026-10-19T10:00:00Z"),
  ];
  assert.equal(verdict(flipped), "FAIL");
  assert.match(blockers(pr({ comments: flipped }), green).join(), /newest counted verdict: FAIL/);
});

test("the builder app cannot pass its own PR (the incident this guards against)", () => {
  const self = [comment("stackra-bot", `AI-REVIEW: PASS ${SHA}`)];
  const reasons = blockers(pr({ comments: self }), green, builtByBot).join();
  assert.match(reasons, /no AI review PASS/);
  assert.match(reasons, /stackra-bot authored this change and cannot review it/);
});

test("the reviewer cannot pass a change it authored or committed", () => {
  const byReviewer = { author: { login: `${REVIEWER}[bot]` }, committer: { login: "web-flow" } };
  assert.match(blockers(pr(), green, byReviewer).join(), /stackra-reviewer authored this change/);
  assert.match(
    blockers(pr({ author: { login: `app/${REVIEWER}` } }), green, builtByBot).join(),
    /stackra-reviewer authored this change/,
  );
});

test("the owner account's verdict needs the explicit owner-approval token, and never on its own commit", () => {
  const plain = [comment(OWNER, `AI-REVIEW: PASS ${SHA}`)];
  assert.match(blockers(pr({ comments: plain }), green, builtByBot).join(), /owner-approval/);
  const marked = [comment(OWNER, `AI-REVIEW: PASS ${SHA} owner-approval`)];
  assert.deepEqual(blockers(pr({ comments: marked }), green, builtByBot), []);
  const ownCommit = { author: { login: OWNER }, committer: { login: OWNER } };
  assert.match(
    blockers(pr({ comments: marked }), green, ownCommit).join(),
    /figentra-usr authored this change/,
  );
});

test("design / risk:R3 need an owner approval on the head SHA or owner-approved", () => {
  const labels = [{ name: "risk:R3" }];
  assert.match(blockers(pr({ labels }), green).join(), /owner approval/);
  const stale = [{ author: { login: OWNER }, state: "APPROVED", commit: { oid: "abc" } }];
  assert.match(blockers(pr({ labels, reviews: stale }), green).join(), /owner approval/);
  const notOwner = [{ author: { login: "someone" }, state: "APPROVED", commit: { oid: SHA } }];
  assert.match(blockers(pr({ labels, reviews: notOwner }), green).join(), /owner approval/);
  const fresh = [{ author: { login: OWNER }, state: "APPROVED", commit: { oid: SHA } }];
  assert.deepEqual(blockers(pr({ labels, reviews: fresh }), green), []);
  const labelled = [{ name: "design" }, { name: "owner-approved" }];
  assert.deepEqual(blockers(pr({ labels: labelled }), green), []);
});
