#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: create the Express baseline's starting app in a directory: the setup of the Express docs ("npm init", then
 *   "npm install express") with express pinned exactly, plus the starting app of benchmarks/tasks/starting-app.md.
 * Boundary: the first call installs express once inside a one-off node container (removed when it ends, lowest
 *   priority, 1 CPU, reaches the npm registry) into a cache folder under the home directory; every call then copies the
 *   cache into the target. The install is refused when the installed express is not the version in framework.json.
 * Runtime: node, with docker for the first call
 * Governing contract: benchmarks/tasks/starting-app.md; STA-2709 rule "fair baselines: each framework's own
 *   idiomatic starter, set up by its own docs".
 * Input: the target directory, as the first argument.
 * Output: package.json, node_modules and the starting app in the target directory.
 * Secrets: none.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(here, "framework.json"), "utf8"));
const cache = join(homedir(), ".cache", "stk-bench", `express-${version}`);

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function buildTemplate() {
  mkdirSync(dirname(cache), { recursive: true });
  const scratch = mkdtempSync(`${cache}.tmp-`);
  const ran = spawnSync(
    "nice",
    [
      "-n",
      "19",
      "docker",
      "run",
      "--rm",
      "--cpus",
      "1",
      "--user",
      `${process.getuid()}:${process.getgid()}`,
      "-e",
      "HOME=/tmp",
      "-v",
      `${scratch}:/work`,
      "-w",
      "/work",
      "node:24-slim",
      "sh",
      "-c",
      `npm init -y && npm install --save-exact --no-audit --no-fund express@${version}`,
    ],
    { encoding: "utf8" },
  );
  if (ran.status !== 0) {
    rmSync(scratch, { recursive: true, force: true });
    fail(`npm install failed: ${(ran.stderr || ran.stdout).slice(-600)}`);
  }
  const installed = JSON.parse(
    readFileSync(join(scratch, "node_modules", "express", "package.json"), "utf8"),
  ).version;
  if (installed !== version) {
    rmSync(scratch, { recursive: true, force: true });
    fail(`npm installed express ${installed}, not the pinned ${version}`);
  }
  renameSync(scratch, cache);
}

const target = process.argv[2];
if (target === undefined) fail("usage: node create.mjs <directory>");
if (!existsSync(join(cache, "node_modules"))) buildTemplate();
mkdirSync(resolve(target), { recursive: true });
const copied = spawnSync("cp", ["-a", `${cache}/.`, resolve(target)], { encoding: "utf8" });
if (copied.status !== 0) fail(`copy failed: ${copied.stderr}`);
cpSync(join(here, "starting-app"), resolve(target), { recursive: true });
