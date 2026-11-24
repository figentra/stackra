#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: create the NestJS baseline's starting app in a directory: the official starter from `nest new` at a pinned
 *   CLI version, with its hello-world controller replaced by the starting app of benchmarks/tasks/starting-app.md.
 * Boundary: the first call builds the starter once inside a one-off node container (the container is removed when it
 *   ends, runs at the lowest priority with 2 CPUs, and reaches the npm registry) into a cache folder under
 *   `$XDG_CACHE_HOME`, else under `~/.cache`; every call then copies the cache into the target. Nothing is built twice. The build is refused when the
 *   resolved @nestjs/core is not the version in framework.json.
 * Runtime: node, with docker for the first call
 * Governing contract: benchmarks/tasks/starting-app.md; STA-2709 rule "fair baselines: each framework's own
 *   idiomatic starter, set up by its own docs".
 * Input: the target directory, as the first argument.
 * Output: the starter plus the starting app in the target directory, not yet built.
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

const CLI_VERSION = "12.0.15";
const here = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(here, "framework.json"), "utf8"));
const cacheHome = process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache");
const cache = join(cacheHome, "stk-bench", `nestjs-${version}`);
const HELLO_WORLD = [
  "src/app.controller.ts",
  "src/app.controller.spec.ts",
  "src/app.service.ts",
  "test",
];

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
      "2",
      "--user",
      `${process.getuid()}:${process.getgid()}`,
      "-e",
      "HOME=/tmp",
      "-v",
      `${scratch}:/work`,
      "-w",
      "/work",
      "node:24-slim",
      "npx",
      "--yes",
      `@nestjs/cli@${CLI_VERSION}`,
      "new",
      "starter",
      "--package-manager",
      "npm",
      "--skip-git",
      "--strict",
    ],
    { encoding: "utf8" },
  );
  if (ran.status !== 0) {
    rmSync(scratch, { recursive: true, force: true });
    fail(`nest new failed: ${(ran.stderr || ran.stdout).slice(-600)}`);
  }
  const core = join(scratch, "starter", "node_modules", "@nestjs", "core", "package.json");
  const resolved = JSON.parse(readFileSync(core, "utf8")).version;
  if (resolved !== version) {
    rmSync(scratch, { recursive: true, force: true });
    fail(`the starter resolved @nestjs/core ${resolved}, not the pinned ${version}`);
  }
  for (const path of HELLO_WORLD)
    rmSync(join(scratch, "starter", path), { recursive: true, force: true });
  renameSync(join(scratch, "starter"), cache);
  rmSync(scratch, { recursive: true, force: true });
}

const target = process.argv[2];
if (target === undefined) fail("usage: node create.mjs <directory>");
if (!existsSync(join(cache, "node_modules"))) buildTemplate();
mkdirSync(resolve(target), { recursive: true });
const copied = spawnSync("cp", ["-a", `${cache}/.`, resolve(target)], { encoding: "utf8" });
if (copied.status !== 0) fail(`copy failed: ${copied.stderr}`);
cpSync(join(here, "starting-app"), resolve(target), { recursive: true });
