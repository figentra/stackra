/**
 * Stackra file contract:
 * Purpose: hold the launch files to their contract: one `surface-<key>` per root runway surface (`ops` left out) on
 *          4173 plus its place, built then served by `stackra preview serve`; one configuration per app or Worker
 *          member with a runway dev port (Metro's for mobile), its imports built first and a Worker itself too;
 *          services and members without a port left out; VS Code's `dev: …` tasks beside the hand-written ones; gen
 *          writes once and then finds the files current; a hand edit, a port two servers share and an unparseable
 *          tasks file are findings.
 * Boundary: writes fixture repositories into temp directories; reads nothing of this checkout.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0295 (amendment of 2026-11-03); STA-2081.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { test } from "@stackra/testing";

import { LAUNCH_FILE } from "#node/launch-config/constants/launch-file.constant";
import { VSCODE_TASKS_FILE } from "#node/launch-config/constants/vscode-tasks-file.constant";
import { launchConfigFindings } from "#node/launch-config/functions/launch-config-findings.function";
import { readLaunchInputs } from "#node/launch-config/functions/read-launch-inputs.function";
import { renderLaunchConfig } from "#node/launch-config/functions/render-launch-config.function";
import { writeLaunchFiles } from "#node/launch-config/functions/write-launch-files.function";

const write = (root: string, path: string, text: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

const appRunway = (dev: string): string =>
  `$schema: "@stackra/runway/schema/app.json"\nversion: 3\nenvironments:\n  dev:\n${dev}`;

/** A product: two surfaces and ops, docs, mobile, a static Worker, a service and an app without a port. */
function repository(): string {
  const root = mkdtempSync(join(tmpdir(), "launch-config-"));
  write(
    root,
    "runway.yaml",
    "version: 3\nsurfaces:\n  landing:\n    shell: figentra/landing@1\n  console:\n    shell: figentra/console@1\n  ops:\n    contributes: {}\n",
  );
  const member = (dir: string, name: string, runway?: string): void => {
    write(root, `${dir}/package.json`, JSON.stringify({ name }));
    if (runway !== undefined) write(root, `${dir}/runway.yaml`, runway);
  };
  member("apps/docs", "@acme/docs", appRunway("    port: 3333\n"));
  member("apps/mobile", "@acme/mobile", appRunway("    mobile:\n      metroPort: 8081\n"));
  member("apps/console", "@acme/console");
  member("workers/static", "@acme/worker-static", appRunway("    port: 8787\n"));
  write(root, "workers/static/wrangler.jsonc", "{}\n");
  member(
    "services/notes",
    "@acme/service-notes",
    "version: 3\nenvironments:\n  dev:\n    port: 4000\n",
  );
  write(
    root,
    VSCODE_TASKS_FILE,
    '// Hand-written tasks.\n{\n  "version": "2.0.0",\n  "tasks": [{ "label": "verify", "command": "pnpm verify" }]\n}\n',
  );
  return root;
}

test("surfaces come first on stable ports, then members by name with their build step", () => {
  const { configurations } = renderLaunchConfig(readLaunchInputs(repository()));
  assert.deepEqual(
    configurations.map(({ name, port }) => [name, port]),
    [
      ["surface-landing", 4173],
      ["surface-console", 4174],
      ["docs", 3333],
      ["mobile", 8081],
      ["worker-static", 8787],
    ],
  );
  assert.deepEqual(configurations[0]?.runtimeArgs, [
    "-c",
    "pnpm exec stackra build --product --surfaces-only && exec pnpm exec stackra preview serve --surface landing --port 4173",
  ]);
  assert.match(
    String(configurations[2]?.runtimeArgs[1]),
    /--filter=@acme\/docs\^\.\.\. && exec pnpm --filter @acme\/docs run dev$/,
  );
  assert.match(
    String(configurations[4]?.runtimeArgs[1]),
    /--filter=@acme\/worker-static\.\.\. && /,
  );
});

test("core builds its own CLI before a surface", () => {
  const root = repository();
  write(root, "packages/developer/cli/package.json", JSON.stringify({ name: "@stackra/cli" }));
  const [landing] = renderLaunchConfig(readLaunchInputs(root)).configurations;
  assert.match(
    String(landing?.runtimeArgs[1]),
    /^pnpm turbo run build --output-logs=errors-only --filter=@stackra\/cli\.\.\. && node packages\/developer\/cli\/dist\/stackra\.mjs build/,
  );
});

test("gen writes both files once, keeps the hand-written tasks, and then finds them current", () => {
  const root = repository();
  assert.deepEqual(
    writeLaunchFiles(root, false).map(({ status }) => status),
    ["written", "written"],
  );
  const tasks = readFileSync(join(root, VSCODE_TASKS_FILE), "utf8");
  assert.ok(tasks.startsWith("// Hand-written tasks.\n"));
  const labels = (
    JSON.parse(tasks.split("\n").slice(1).join("\n")) as { tasks: { label: string }[] }
  ).tasks.map(({ label }) => label);
  assert.deepEqual(labels, [
    "verify",
    "dev: surface-landing",
    "dev: surface-console",
    "dev: docs",
    "dev: mobile",
    "dev: worker-static",
  ]);
  assert.deepEqual(
    writeLaunchFiles(root, false).map(({ status }) => status),
    ["current", "current"],
  );
  assert.deepEqual(launchConfigFindings(root), []);
});

test("a hand edit is a finding, and --check writes nothing", () => {
  const root = repository();
  writeLaunchFiles(root, false);
  write(root, LAUNCH_FILE, '{ "version": "0.0.1", "configurations": [] }\n');
  assert.deepEqual(
    launchConfigFindings(root).map(({ dir }) => dir),
    [LAUNCH_FILE],
  );
  assert.equal(
    readFileSync(join(root, LAUNCH_FILE), "utf8"),
    '{ "version": "0.0.1", "configurations": [] }\n',
  );
});

test("an unparseable tasks file is stale and left alone", () => {
  const root = repository();
  write(root, VSCODE_TASKS_FILE, "{ not json\n");
  assert.deepEqual(
    writeLaunchFiles(root, false).map(({ file, status }) => [file, status]),
    [
      [LAUNCH_FILE, "written"],
      [VSCODE_TASKS_FILE, "stale"],
    ],
  );
  assert.equal(readFileSync(join(root, VSCODE_TASKS_FILE), "utf8"), "{ not json\n");
});

test("two servers on one port are a finding", () => {
  const root = repository();
  write(root, "apps/docs/runway.yaml", appRunway("    port: 8787\n"));
  writeLaunchFiles(root, false);
  assert.deepEqual(
    launchConfigFindings(root).map(({ text }) => text),
    ["docs and worker-static both listen on port 8787: give one another dev port in its runway"],
  );
});
