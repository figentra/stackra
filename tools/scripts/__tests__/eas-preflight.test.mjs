/**
 * Stackra file contract:
 * Purpose: hold `eas-preflight.mjs` to its contract: a dirty tree, a HEAD that is not the deployed sha and too little
 *          disk each refuse a local build, with the iOS bar above Android's; the record line holds the build id next
 *          to the rollout id.
 * Boundary: pure functions on injected facts; runs no git and writes no file.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-1577.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { MIN_FREE_BYTES, problems, recordLine } from "../eas-preflight.mjs";

const GB = 1024 ** 3;
const OK = { dirty: false, head: "abc", deployedSha: "abc", freeBytes: 30 * GB };

test("problems: a clean tree at the deployed sha with room passes", () => {
  assert.deepEqual(problems({ ...OK, platform: "ios" }), []);
  assert.deepEqual(problems({ ...OK, platform: "android" }), []);
});

test("problems: dirty tree, wrong sha and low disk each refuse", () => {
  const found = problems({
    platform: "ios",
    dirty: true,
    head: "abc",
    deployedSha: "def",
    freeBytes: 20 * GB,
  });
  assert.equal(found.length, 3);
  assert.match(found[0], /uncommitted changes/);
  assert.match(found[1], /HEAD abc is not the deployed sha def/);
  assert.match(found[2], /needs 25 GB/);
});

test("problems: Android takes less disk than iOS", () => {
  assert.ok(MIN_FREE_BYTES.android < MIN_FREE_BYTES.ios);
  assert.deepEqual(problems({ ...OK, platform: "android", freeBytes: 12 * GB }), []);
  assert.equal(problems({ ...OK, platform: "ios", freeBytes: 12 * GB }).length, 1);
  assert.match(problems({ ...OK, platform: "web" })[0], /unknown platform/);
});

test("recordLine: one JSON line with the build id next to the rollout id", () => {
  const line = recordLine({
    at: "2026-10-29T00:00:00.000Z",
    platform: "android",
    sha: "abc",
    buildId: "b1",
    rolloutId: "r1",
  });
  assert.ok(line.endsWith("\n"));
  assert.deepEqual(JSON.parse(line), {
    at: "2026-10-29T00:00:00.000Z",
    platform: "android",
    profile: null,
    sha: "abc",
    buildId: "b1",
    rolloutId: "r1",
  });
  assert.throws(() => recordLine({ platform: "ios", sha: "abc" }), /--build-id is required/);
});
