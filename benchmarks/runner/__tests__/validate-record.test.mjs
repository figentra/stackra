/**
 * Stackra file contract:
 * Purpose: test validateRecord and recordFileName against one complete dry-run record.
 * Boundary: pure; no file, no network, no model.
 * Runtime: node (`node --test`)
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: an in-memory record.
 * Output: pass or fail.
 * Secrets: none.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { HARNESS_VERSION } from "../harness-version.mjs";
import { recordFileName } from "../record-file-name.mjs";
import { validateRecord } from "../validate-record.mjs";

const record = {
  harnessVersion: HARNESS_VERSION,
  task: "01-add-a-field",
  framework: "stackra",
  frameworkVersion: "0.33.1",
  model: "fake-agent",
  run: 1,
  dryRun: true,
  startedAt: "2026-11-24T07:00:00.000Z",
  wallTimeMs: 12,
  tokensIn: 0,
  tokensOut: 0,
  toolCalls: 3,
  wrongEdits: 0,
  searchCalls: 1,
  filesOpened: ["src/a.ts"],
  filesTouched: ["src/a.ts"],
  acceptance: { passed: 2, failed: 0, total: 2, ok: true },
};

test("a complete record is valid", () => {
  assert.deepEqual(validateRecord(record), []);
});

test("a missing field and a wrong type are named", () => {
  const { toolCalls: _dropped, ...rest } = record;
  assert.deepEqual(validateRecord({ ...rest, run: "1" }), [
    "run: expected number",
    "toolCalls: expected number",
  ]);
});

test("the file name carries harness, framework, model, date, task and run", () => {
  assert.equal(
    recordFileName(record),
    "h0.0.1__stackra-0.33.1__fake-agent__2026-11-24__01-add-a-field__run1.json",
  );
});
