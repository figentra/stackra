import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const hook = new URL("./context-health.mjs", import.meta.url).pathname;

test("fires on every 10th call per session", () => {
  const id = `test-${process.pid}-${Date.now()}`;
  try {
    const outs = Array.from(
      { length: 20 },
      () =>
        spawnSync("node", [hook], { input: JSON.stringify({ session_id: id }), encoding: "utf8" })
          .stdout,
    );
    outs.forEach((o, i) =>
      assert.equal(o.includes("CONTEXT HEALTH"), (i + 1) % 10 === 0, `call ${i + 1}`),
    );
    assert.match(outs[19], /Phase 2/);
  } finally {
    rmSync(join(tmpdir(), `claude-context-health-${id}`), { force: true });
  }
});
