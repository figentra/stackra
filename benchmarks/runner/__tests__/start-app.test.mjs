/**
 * Stackra file contract:
 * Purpose: test that `startApp(...).stop()` ends the whole process tree of the app under test, not only the process
 *   the runner started. A baseline whose start command is a wrapper (`npm run start`, a shell script) runs the real
 *   server as a grandchild; a stop that signals only the child would leave it running on its port.
 * Boundary: starts a small local HTTP app that spawns one grandchild, in a temporary folder, on a free loopback port;
 *   no network beyond loopback, no model.
 * Runtime: node (`node --test`)
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: a generated app script.
 * Output: pass or fail.
 * Secrets: none.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

import { startApp } from "../start-app.mjs";

const APP = `
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";

const grandchild = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
writeFileSync("grandchild.pid", String(grandchild.pid));
createServer((request, response) => response.end("ok")).listen(Number(process.env.PORT), "127.0.0.1");
`;

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/** Waits up to two seconds for `pid` to be gone. */
async function gone(pid) {
  for (let waited = 0; waited < 2000; waited += 50) {
    if (!alive(pid)) return true;
    await sleep(50);
  }
  return !alive(pid);
}

test("stop ends the app's grandchild as well as the app", async () => {
  const directory = mkdtempSync(join(tmpdir(), "stk-start-app-"));
  writeFileSync(join(directory, "app.mjs"), APP);
  const app = await startApp({ directory, command: [process.execPath, "app.mjs"] });
  const grandchild = Number(readFileSync(join(directory, "grandchild.pid"), "utf8"));
  try {
    assert.ok(alive(grandchild), "the grandchild runs while the app is up");
    await app.stop();
    assert.ok(await gone(grandchild), "the grandchild is gone after stop");
  } finally {
    if (alive(grandchild)) process.kill(grandchild, "SIGKILL");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("stop is safe to call twice", async () => {
  const directory = mkdtempSync(join(tmpdir(), "stk-start-app-"));
  writeFileSync(join(directory, "app.mjs"), APP);
  const app = await startApp({ directory, command: [process.execPath, "app.mjs"] });
  const grandchild = Number(readFileSync(join(directory, "grandchild.pid"), "utf8"));
  try {
    await app.stop();
    await app.stop();
    assert.ok(await gone(grandchild));
  } finally {
    if (alive(grandchild)) process.kill(grandchild, "SIGKILL");
    rmSync(directory, { recursive: true, force: true });
  }
});
