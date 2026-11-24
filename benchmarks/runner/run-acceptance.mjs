/**
 * Stackra file contract:
 * Purpose: run a task's acceptance tests against a running app and count the results.
 * Boundary: one `node --test` child process over the task's acceptance/*.test.mjs files, with BASE_URL set and a
 *   minimal environment; killed when it passes the time limit. It never starts the app.
 * Runtime: node
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: the acceptance directory and the app's base URL.
 * Output: { passed, failed, total, ok, firstError } where firstError is the first failing test's line, or null.
 * Secrets: none.
 */
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const TIME_LIMIT_MS = 180_000;

function count(output, name) {
  const match = output.match(new RegExp(`^# ${name} (\\d+)$`, "m"));
  return match ? Number(match[1]) : 0;
}

export function runAcceptance({ directory, baseUrl }) {
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".test.mjs"))
    .map((name) => join(directory, name));
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--test", "--test-reporter=tap", ...files], {
      env: { PATH: process.env.PATH, BASE_URL: baseUrl },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), TIME_LIMIT_MS);
    child.on("close", (code) => {
      clearTimeout(timer);
      const passed = count(output, "pass");
      const failed = count(output, "fail");
      const total = count(output, "tests");
      const firstError = output.match(/^\s*not ok .*$/m)?.[0].trim() ?? null;
      resolve({ passed, failed, total, ok: code === 0 && failed === 0 && total > 0, firstError });
    });
  });
}
