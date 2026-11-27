/**
 * Stackra file contract:
 * Purpose: hold `.github/workflows/apply-testbed.yml` to its key-pair rule (STA-2876): a run without the `testbed`
 *          environment variable TESTBED_KEY_PAIR refuses before AWS, with an error that names the variable, and the
 *          Pulumi step sets `keyPair` from it on every run, never removing it to fall back to a package default.
 * Boundary: reads the workflow file and runs its Prerequisites script with bash in a temp folder, `mise` stubbed on
 *           PATH; no AWS, no Pulumi, never writes this checkout.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0022 (tests live in tests folders); ADR 0182; STA-2876.
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WORKFLOW = readFileSync(
  fileURLToPath(new URL("../../../.github/workflows/apply-testbed.yml", import.meta.url)),
  "utf8",
);
const root = mkdtempSync(join(tmpdir(), "apply-testbed-workflow-"));
after(() => rmSync(root, { recursive: true, force: true }));

/** The `run: |` script of the step named `name`, dedented. */
function stepScript(name) {
  const lines = WORKFLOW.split("\n");
  const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  assert.ok(start >= 0, `step ${name}`);
  const run = lines.findIndex((line, index) => index > start && line.trim() === "run: |");
  assert.ok(run > start, `run of ${name}`);
  const indent = lines[run + 1].length - lines[run + 1].trimStart().length;
  const body = [];
  for (const line of lines.slice(run + 1)) {
    if (line.trim() !== "" && line.length - line.trimStart().length < indent) break;
    body.push(line.slice(indent));
  }
  return body.join("\n");
}

/** Runs the Prerequisites step as Actions does (`bash -e`), with `env` over a complete, valid environment. */
function prerequisites(env) {
  const bin = join(root, "bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, "mise"), "#!/bin/sh\nexit 0\n");
  chmodSync(join(bin, "mise"), 0o755);
  const script = join(root, "prerequisites.sh");
  writeFileSync(script, stepScript("Prerequisites"));
  return spawnSync("bash", ["-e", script], {
    encoding: "utf8",
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      ROLE_ARN: "arn:aws:iam::123456789012:role/stackra-testbed-deploy",
      IDENTITY_ID: "identity",
      PROJECT_ID: "project",
      KEY_PAIR: "ops-key",
      ACTION: "preview",
      REGION: "eu-west-1",
      HOME_REGION: "eu-west-1",
      PULUMI_TOOL: "pulumi@3.268.0",
      ...env,
    },
  });
}

test("apply-testbed: a run without TESTBED_KEY_PAIR refuses, naming the variable", () => {
  for (const action of ["preview", "up", "build-image"]) {
    const out = prerequisites({ KEY_PAIR: "", ACTION: action });
    assert.equal(out.status, 1, action);
    assert.match(out.stdout, /^::error title=TESTBED_KEY_PAIR::missing/m, action);
  }
  const ok = prerequisites({});
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.doesNotMatch(ok.stdout, /::error/);
});

test("apply-testbed: the key pair comes from TESTBED_KEY_PAIR on every run, never a fallback", () => {
  assert.match(WORKFLOW, /^ {6}KEY_PAIR: \$\{\{ vars\.TESTBED_KEY_PAIR \}\}$/m);
  const pulumi = stepScript("Pulumi ${{ inputs.action }}");
  assert.match(pulumi, /^pulumi config set keyPair "\$KEY_PAIR"/m);
  assert.doesNotMatch(pulumi, /config rm keyPair/);
});
