/**
 * Stackra file contract:
 * Purpose: start the app under test as a child process on a free port, wait until it answers, and stop it again.
 * Boundary: one child process in the given directory with a minimal environment (PATH, NODE_ENV, PORT and the task's
 *   settings); nothing else of the caller's environment reaches the generated code. It never leaves the child running:
 *   `stop` ends it, and a failed start ends it before the error is thrown.
 * Runtime: node
 * Governing contract: STA-2709 (the owner's method rules).
 * Input: the app directory, the start command as an array, and the task's environment settings.
 * Output: { baseUrl, stop, output } where output() returns the last output the app wrote.
 * Secrets: none. The settings are fixed test values from the task folder.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

import { freePort } from "./free-port.mjs";

const READY_TIMEOUT_MS = 20_000;
const OUTPUT_KEEP = 4000;

async function answers(baseUrl) {
  try {
    await fetch(`${baseUrl}/tasks`);
    return true;
  } catch {
    return false;
  }
}

export async function startApp({ directory, command, env = {} }) {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const [program, ...args] = command;
  const child = spawn(program, args, {
    cwd: directory,
    env: { PATH: process.env.PATH, NODE_ENV: "test", ...env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let written = "";
  const keep = (chunk) => {
    written = (written + chunk.toString()).slice(-OUTPUT_KEEP);
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  let exited = false;
  const exit = new Promise((resolve) => {
    child.on("exit", () => {
      exited = true;
      resolve();
    });
  });

  const stop = async () => {
    if (exited) return;
    child.kill("SIGTERM");
    await Promise.race([exit, sleep(3000)]);
    if (!exited) child.kill("SIGKILL");
    await exit;
  };

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (!(await answers(baseUrl))) {
    if (exited || Date.now() > deadline) {
      await stop();
      throw new Error(`the app did not start: ${written.trim() || "no output"}`);
    }
    await sleep(100);
  }
  return { baseUrl, stop, output: () => written };
}
