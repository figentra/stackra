import { test } from "node:test";
import assert from "node:assert/strict";
import { aiReview, blockers, OWNER } from "../pr-merge.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const comment = (login, body, createdAt = "2026-10-19T10:00:00Z") => ({
  author: { login },
  body,
  createdAt,
});
// Shapes as `gh pr view --json …` and the check-runs API return them.
const pr = (over = {}) => ({
  number: 1,
  state: "OPEN",
  isDraft: false,
  headRefOid: SHA,
  labels: [],
  reviews: [],
  comments: [comment("stackra-bot", `AI-REVIEW: PASS ${SHA}\n\nNo findings.`)],
  ...over,
});
const green = [{ id: 2, status: "completed", conclusion: "success" }];

test("merges when gate is green, not draft, and AI review passed on the head SHA", () => {
  assert.deepEqual(blockers(pr(), green), []);
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

test("AI review must be for the exact head SHA, by a trusted author, newest wins", () => {
  const old = "fffffff";
  assert.equal(aiReview([comment("stackra-bot", `AI-REVIEW: PASS ${old}`)], SHA), null);
  assert.equal(aiReview([comment("mallory", `AI-REVIEW: PASS ${SHA}`)], SHA), null);
  assert.equal(aiReview([comment(OWNER, `AI-REVIEW: PASS ${SHA.slice(0, 7)}`)], SHA), "PASS");
  assert.equal(aiReview([comment("stackra-bot", `see AI-REVIEW: PASS ${SHA}`)], SHA), null);
  const flipped = [
    comment("stackra-bot", `AI-REVIEW: FAIL ${SHA}`, "2026-10-19T11:00:00Z"),
    comment("stackra-bot", `AI-REVIEW: PASS ${SHA}`, "2026-10-19T10:00:00Z"),
  ];
  assert.equal(aiReview(flipped, SHA), "FAIL");
  assert.match(blockers(pr({ comments: flipped }), green).join(), /newest verdict: FAIL/);
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
