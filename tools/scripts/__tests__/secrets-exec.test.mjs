/**
 * Stackra file contract:
 * Purpose: hold `secrets-exec.mjs` to its contract (ADR 0525): only the named `agents` secrets are decrypted, they
 *          reach only the child's environment, `$NAME` in the arguments expands only with `--expand-args`, and no
 *          canary value reaches stdout, stderr, the runner's output or any argv but an expanded MCP argument.
 * Boundary: a throwaway clone directory, a fake sops and git runner, a fake spawn, and one real run of the script
 *           with a fake `sops` on PATH; no real repository, key or vault.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182; ADR 0525; ADR 0257; ADR 0267.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { USAGE, agentVars, expandArg, main, parseExecArgs } from "../secrets-exec.mjs";

const script = new URL("../secrets-exec.mjs", import.meta.url).pathname;
const canary = () => `fake-${randomBytes(12).toString("hex")}`;

/** A clone with `agents/<NAME>.enc.yaml` per value and one file in another scope; sops "decrypts" from memory. */
function clone(values) {
  const dir = mkdtempSync(join(tmpdir(), "secrets-exec-test-"));
  mkdirSync(join(dir, "agents"));
  mkdirSync(join(dir, "ci", "deploy"), { recursive: true });
  writeFileSync(join(dir, "ci", "deploy", "TURBO_TOKEN.enc.yaml"), "ENC: other\nsops:\n");
  for (const name of Object.keys(values))
    writeFileSync(join(dir, "agents", `${name}.enc.yaml`), `ENC: ${name}\nsops:\n`);
  const calls = [];
  const run = (command, args) => {
    calls.push([command, ...args]);
    if (command === "sops") {
      const name = /agents\/([A-Z0-9_]+)\.enc\.yaml$/.exec(args.at(-1))?.[1];
      return { status: 0, stdout: JSON.stringify({ [name]: values[name] }), stderr: "" };
    }
    return { status: 0, stdout: "", stderr: "" };
  };
  return { dir, run, calls };
}

/** Runs main with a fake spawn; returns what the child would have been started with. */
function exec(argv, c) {
  let out = "";
  const spawned = [];
  const child = main(argv, {
    env: { STACKRA_SECRETS_DIR: c.dir, PATH: "/usr/bin" },
    run: c.run,
    spawnChild: (command, args, options) => {
      spawned.push({ command, args, env: options.env });
      return { fake: true };
    },
    write: (s) => (out += s),
  });
  return { child, out, spawned };
}

/** No canary in the runner's output, any CLI argv or the child's argv. */
function assertNoLeak(value, { out, spawned }, c) {
  assert.ok(!out.includes(value), "value in output");
  assert.ok(!JSON.stringify(c.calls).includes(value), "value on a CLI's argv");
  assert.ok(
    !spawned.some((s) => JSON.stringify([s.command, ...s.args]).includes(value)),
    "value on argv",
  );
}

test("exec: only the named agents files are decrypted, into the child's environment only", () => {
  const a = canary();
  const b = canary();
  const c = clone({ LINEAR_API_KEY: a, OTHER_TOKEN: b });
  const r = exec(
    ["--names", "LINEAR_API_KEY,LINEAR_AGENT_TOKEN", "--", "node", "linear.mjs", "$LINEAR_API_KEY"],
    c,
  );
  assert.ok(r.child);
  assert.equal(r.out, "");
  const [child] = r.spawned;
  assert.equal(child.env.LINEAR_API_KEY, a);
  assert.equal(child.env.OTHER_TOKEN, undefined, "an unnamed secret is never decrypted");
  assert.equal(child.env.LINEAR_AGENT_TOKEN, undefined, "a named secret with no file is skipped");
  assert.deepEqual(
    child.args,
    ["linear.mjs", "$LINEAR_API_KEY"],
    "no expansion without --expand-args",
  );
  const decrypted = c.calls.filter((call) => call[0] === "sops").map((call) => call.at(-1));
  assert.deepEqual(decrypted, ["agents/LINEAR_API_KEY.enc.yaml"]);
  assertNoLeak(a, r, c);
  assertNoLeak(b, r, c);
});

test("exec --expand-args: $NAME and ${NAME} expand for mcp.sh; a referenced name with no file is refused", () => {
  const v = canary();
  const c = clone({ CONTEXT7_API_KEY: v });
  const r = exec(
    [
      "--names",
      "CONTEXT7_API_KEY",
      "--expand-args",
      "--",
      "npx",
      "x-token:$CONTEXT7_API_KEY",
      "${HOME}",
    ],
    c,
  );
  assert.deepEqual(r.spawned[0].args, [`x-token:${v}`, "${HOME}"], "only a named secret expands");
  assert.equal(expandArg("${CONTEXT7_API_KEY}/$MISSING", { CONTEXT7_API_KEY: v }), `${v}/$MISSING`);

  const missing = exec(
    [
      "--names",
      "CONTEXT7_API_KEY,STRIPE_SECRET_KEY",
      "--expand-args",
      "--",
      "npx",
      "--api-key=$STRIPE_SECRET_KEY",
    ],
    c,
  );
  assert.equal(missing.child, null);
  assert.equal(missing.spawned.length, 0);
  assert.match(missing.out, /not in the agents scope of .*: STRIPE_SECRET_KEY\n$/);
  assertNoLeak(v, missing, c);
});

test("exec: usage, bad names and a missing clone are value-free refusals; nothing starts", () => {
  const v = canary();
  assert.throws(() => parseExecArgs(["--", "node"]), { message: USAGE });
  assert.throws(() => parseExecArgs(["--names", "A"]), { message: USAGE });
  assert.throws(() => parseExecArgs(["--names", v, "--", "node"]), { message: USAGE });
  assert.throws(() => parseExecArgs(["--scope", "ci", "--names", "A", "--", "node"]), {
    message: USAGE,
  });
  const c = clone({});
  const bad = exec(["--names", v, "--", "node"], c);
  assert.equal(bad.child, null);
  assert.equal(bad.out, `secrets-exec: ${USAGE}\n`);
  const none = exec(["--names", "A_B", "--", "node"], { ...c, dir: join(c.dir, "absent") });
  assert.equal(none.child, null);
  assert.match(none.out, /no figentra\/secrets clone with an agents scope/);
  assert.deepEqual(agentVars(c.dir, ["A_B"], { run: c.run }), {});
});

test("exec, end to end: the child sees the value, and no canary reaches stdout or stderr", () => {
  const v = canary();
  const c = clone({});
  writeFileSync(join(c.dir, "agents", "STACKRA_TEST_TOKEN.enc.yaml"), "ENC: x\nsops:\n");
  // A fake sops on PATH that "decrypts" to the canary it is handed through its own environment.
  const bin = mkdtempSync(join(tmpdir(), "secrets-exec-bin-"));
  const sops = join(bin, "sops");
  writeFileSync(
    sops,
    `#!${process.execPath}\nprocess.stdout.write(JSON.stringify({ STACKRA_TEST_TOKEN: process.env.FAKE_SOPS_VALUE }));\n`,
  );
  chmodSync(sops, 0o755);
  const check =
    "process.exit(process.env.STACKRA_TEST_TOKEN === process.env.FAKE_SOPS_VALUE ? 0 : 3)";
  const r = spawnSync(
    process.execPath,
    [script, "--names", "STACKRA_TEST_TOKEN", "--", process.execPath, "-e", check],
    {
      encoding: "utf8",
      env: {
        PATH: `${bin}${delimiter}${process.env.PATH}`,
        STACKRA_SECRETS_DIR: c.dir,
        FAKE_SOPS_VALUE: v,
      },
    },
  );
  assert.equal(r.status, 0, "the child read the decrypted value from its environment");
  assert.ok(!r.stdout.includes(v), "value on stdout");
  assert.ok(!r.stderr.includes(v), "value on stderr");
});
