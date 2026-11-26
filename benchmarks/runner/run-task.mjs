#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: one benchmark run: task x framework x agent x run number. It creates the framework's starting app in a clean
 *   directory, runs the agent step (the scripted fake agent for a dry run), starts the app, runs the task's HTTP
 *   acceptance tests, and writes one JSON record.
 * Boundary: a temporary directory under the system temp folder (removed unless --keep), one app process at a time on a
 *   free port, one acceptance process; the record goes to benchmarks/results (or --out). Only the fake agent exists
 *   today: no model is called and no key is read.
 * Runtime: node
 * Governing contract: STA-2709 (the owner's method rules); benchmarks/README.md.
 * Input: --task <folder under tasks/> --framework <folder under baselines/> --agent fake [--run 1] [--out <dir>]
 *   [--keep].
 * Output: the record path on stdout, and a one-line summary; exit 0 when the acceptance tests all pass, 1 when they do
 *   not, 2 for a bad call or a run that could not finish.
 * Secrets: none.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { fakeAgent } from "./fake-agent.mjs";
import { HARNESS_VERSION } from "./harness-version.mjs";
import { recordFileName } from "./record-file-name.mjs";
import { runAcceptance } from "./run-acceptance.mjs";
import { startApp } from "./start-app.mjs";
import { validateRecord } from "./validate-record.mjs";

const BUILD_TIMEOUT_MS = 300_000;
const CREATE_TIMEOUT_MS = 900_000;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { values } = parseArgs({
  options: {
    task: { type: "string" },
    framework: { type: "string" },
    agent: { type: "string", default: "fake" },
    run: { type: "string", default: "1" },
    out: { type: "string", default: join(root, "results") },
    keep: { type: "boolean", default: false },
  },
});

function usage(message) {
  process.stderr.write(
    `${message}\nusage: run-task.mjs --task <task> --framework <framework> --agent fake [--run 1]\n`,
  );
  process.exit(2);
}

if (values.task === undefined || values.framework === undefined)
  usage("--task and --framework are required");
if (values.agent !== "fake")
  usage("only --agent fake exists: no model is run until the owner approves the pilot");
const taskDirectory = join(root, "tasks", values.task);
const baselineDirectory = join(root, "baselines", values.framework);
if (!existsSync(taskDirectory)) usage(`no task ${values.task}`);
if (!existsSync(baselineDirectory)) usage(`no baseline ${values.framework}`);

const framework = JSON.parse(readFileSync(join(baselineDirectory, "framework.json"), "utf8"));
const settingsPath = join(taskDirectory, "settings.json");
const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, "utf8")) : {};
const workdir = mkdtempSync(join(tmpdir(), "stk-bench-"));
const startedAt = new Date().toISOString();

let app;
try {
  const [program, ...args] = framework.create;
  const created = spawnSync(program, [...args, workdir], {
    cwd: baselineDirectory,
    env: {
      PATH: process.env.PATH,
      // A cache folder redirected away from the home directory stays redirected for the create step.
      ...(process.env.XDG_CACHE_HOME === undefined
        ? {}
        : { XDG_CACHE_HOME: process.env.XDG_CACHE_HOME }),
    },
    encoding: "utf8",
    timeout: CREATE_TIMEOUT_MS,
  });
  if (created.status !== 0)
    throw new Error(`baseline create failed: ${created.stderr || created.stdout}`);

  const agentStart = performance.now();
  const measured = fakeAgent({ baselineDirectory, task: values.task, workdir });
  const wallTimeMs = Math.round(performance.now() - agentStart);

  let acceptance;
  const built =
    framework.build === undefined
      ? { status: 0 }
      : spawnSync(framework.build[0], framework.build.slice(1), {
          cwd: workdir,
          env: { PATH: process.env.PATH, NODE_ENV: "test" },
          encoding: "utf8",
          timeout: BUILD_TIMEOUT_MS,
        });
  if (built.status === 0) {
    app = await startApp({ directory: workdir, command: framework.start, env: settings.env });
    acceptance = await runAcceptance({
      directory: join(taskDirectory, "__tests__"),
      baseUrl: app.baseUrl,
    });
  } else {
    const output = `${built.stdout ?? ""}${built.stderr ?? ""}`.trim().slice(-300);
    acceptance = {
      passed: 0,
      failed: 0,
      total: 0,
      ok: false,
      firstError: `build failed: ${output}`,
    };
  }
  const { firstError, ...counts } = acceptance;

  const record = {
    harnessVersion: HARNESS_VERSION,
    task: values.task,
    framework: framework.name,
    frameworkVersion: framework.version,
    model: "fake-agent",
    run: Number(values.run),
    dryRun: true,
    startedAt,
    wallTimeMs,
    ...measured,
    acceptance: counts,
  };
  const problems = validateRecord(record);
  if (problems.length > 0) throw new Error(`the record is not valid: ${problems.join("; ")}`);

  mkdirSync(values.out, { recursive: true });
  const path = join(values.out, recordFileName(record));
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
  const summary = `${record.task} x ${record.framework}@${record.frameworkVersion}: ${counts.passed}/${counts.total} passed, agent ${wallTimeMs} ms`;
  process.stdout.write(
    `${path}\n${summary}${firstError === null ? "" : `, first error: ${firstError}`}\n`,
  );
  process.exitCode = counts.ok ? 0 : 1;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
} finally {
  if (app !== undefined) await app.stop();
  if (values.keep) process.stderr.write(`kept ${workdir}\n`);
  else rmSync(workdir, { recursive: true, force: true });
}
