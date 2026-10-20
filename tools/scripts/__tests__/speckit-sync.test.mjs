/**
 * @module tools/scripts/speckit-sync.test
 *
 * Purpose: hold the order of `pnpm speckit:sync`'s specify calls to their contract.
 * Boundary: pure function; never runs specify.
 * Runtime: node — node:test and node:assert.
 */
// @covers sta-163:FR-001
import { test } from "node:test";
import assert from "node:assert/strict";
import { steps } from "../speckit-sync.mjs";

test("installs or updates each preset from .agents/speckit, disables the workflow, renders OpenCode then Claude", () => {
  assert.deepEqual(steps(["stackra"], ["stackra"]), [
    ["preset", "update", "stackra", "--dev", ".agents/speckit/presets/stackra"],
    ["workflow", "disable", "speckit"],
    ["integration", "use", "opencode"],
    ["integration", "use", "claude"],
  ]);
  assert.deepEqual(steps(["stackra"], [])[0], [
    "preset",
    "add",
    "--dev",
    ".agents/speckit/presets/stackra",
  ]);
});
