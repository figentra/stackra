/**
 * Stackra file contract:
 * Purpose: hold `tools/scripts/mcp.sh` and the committed `.mcp.yaml` to STA-1617: a secret reaches an MCP server only
 *          through its environment, never its argv. Every `.mcp.yaml` server that starts through `mcp.sh` is launched
 *          for real with its own arguments, with a fake `sops` that "decrypts" canaries and a fake `npx` that records
 *          what it was started with: each declared secret is in its environment and no canary is on its argv. A
 *          `$NAME` reference left in the arguments is refused before anything decrypts, and a header file a server
 *          reads holds placeholders only.
 * Boundary: a throwaway secrets clone, a fake `sops` and a fake `npx` on PATH; the real `mcp.sh` and
 *           `secrets-exec.mjs`. No real repository clone, key, vault or MCP server.
 * Runtime: node
 * Governing contract: ADR 0525 (sops agents scope); ADR 0267 (the model never sees a secret); ADR 0257; STA-1617.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { parse } from "yaml";

const root = new URL("../../../", import.meta.url).pathname;
const mcpSh = join(root, "tools/scripts/mcp.sh");
const MCP_SH = "./tools/scripts/mcp.sh";
const REFERENCE = /\$\{?([A-Z_][A-Z0-9_]*)/g;
const canary = () => `fake-${randomBytes(12).toString("hex")}`;

/**
 * A secrets clone holding `names`, a fake `sops` that answers each file with its canary, and a fake `npx` that writes
 * its argv and environment to a record file. `sops` marks a file when it runs, so a refusal can prove nothing
 * decrypted.
 */
function sandbox(names) {
  const values = Object.fromEntries(names.map((name) => [name, canary()]));
  const dir = mkdtempSync(join(tmpdir(), "mcp-sh-test-"));
  const secrets = join(dir, "secrets");
  mkdirSync(join(secrets, "agents"), { recursive: true });
  for (const name of names)
    writeFileSync(join(secrets, "agents", `${name}.enc.yaml`), `ENC: ${name}\nsops:\n`);
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const sops = join(bin, "sops");
  writeFileSync(
    sops,
    `#!${process.execPath}
const fs = require("node:fs");
fs.writeFileSync(process.env.FAKE_SOPS_MARK, "ran");
const values = JSON.parse(process.env.FAKE_SOPS_VALUES);
const name = /agents\\/([A-Z0-9_]+)\\.enc\\.yaml$/.exec(process.argv.at(-1))[1];
process.stdout.write(JSON.stringify({ [name]: values[name] }));
`,
  );
  const npx = join(bin, "npx");
  writeFileSync(
    npx,
    `#!${process.execPath}
require("node:fs").writeFileSync(
  process.env.FAKE_NPX_RECORD,
  JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), env: process.env }),
);
`,
  );
  chmodSync(sops, 0o755);
  chmodSync(npx, 0o755);
  const record = join(dir, "record.json");
  const mark = join(dir, "sops.mark");
  const run = (args) => {
    rmSync(record, { force: true });
    rmSync(mark, { force: true });
    const r = spawnSync("bash", [mcpSh, ...args], {
      cwd: dir,
      encoding: "utf8",
      env: {
        HOME: dir,
        PATH: [bin, dirname(process.execPath), "/usr/bin", "/bin"].join(delimiter),
        STACKRA_SECRETS_DIR: secrets,
        FAKE_SOPS_VALUES: JSON.stringify(values),
        FAKE_SOPS_MARK: mark,
        FAKE_NPX_RECORD: record,
      },
    });
    const recorded = existsSync(record) ? JSON.parse(readFileSync(record, "utf8")) : undefined;
    return { ...r, recorded, decrypted: existsSync(mark) };
  };
  return { values, run };
}

/** The local servers of the committed `.mcp.yaml`. */
function localServers() {
  const { mcpServers } = parse(readFileSync(join(root, ".mcp.yaml"), "utf8"));
  return Object.entries(mcpServers).filter(([, server]) => "command" in server);
}

/** The names a `mcp.sh` launch declares with `--env`. */
const declared = (args) => (args[0] === "--env" ? args[1].split(",") : []);

test("mcp.sh: a declared secret reaches the server's environment and no argv", () => {
  const { values, run } = sandbox(["STACKRA_TEST_TOKEN"]);
  const r = run(["--env", "STACKRA_TEST_TOKEN", "--", "npx", "-y", "server@1.0.0", "--flag"]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.recorded.argv, ["-y", "server@1.0.0", "--flag"]);
  assert.equal(r.recorded.env.STACKRA_TEST_TOKEN, values.STACKRA_TEST_TOKEN);
  assert.equal(
    r.recorded.cwd.replace(/\/$/, ""),
    root.replace(/\/$/, ""),
    "starts at the repository root",
  );
  assert.ok(!r.stdout.includes(values.STACKRA_TEST_TOKEN), "value on stdout");
  assert.ok(!r.stderr.includes(values.STACKRA_TEST_TOKEN), "value on stderr");
});

test("mcp.sh: a $NAME or ${NAME} reference in the arguments is refused before anything decrypts", () => {
  const { values, run } = sandbox(["CONTEXT7_API_KEY"]);
  for (const args of [
    ["--env", "CONTEXT7_API_KEY", "--", "npx", "server@1.0.0", "--api-key", "$CONTEXT7_API_KEY"],
    ["npx", "server@1.0.0", "--api-key=${CONTEXT7_API_KEY}"],
    [
      "npx",
      "mcp-remote@0.17.1",
      "https://x.example/mcp",
      "--header",
      "Authorization:Bearer $CONTEXT7_API_KEY",
    ],
  ]) {
    const r = run(args);
    assert.equal(r.status, 2, args.join(" "));
    assert.match(
      r.stderr,
      /CONTEXT7_API_KEY in the server's arguments would show in every process listing/,
    );
    assert.equal(r.recorded, undefined, "the server never started");
    assert.equal(r.decrypted, false, "nothing was decrypted");
    assert.ok(!r.stderr.includes(values.CONTEXT7_API_KEY));
  }
});

test("mcp.sh: a launch without secrets starts unchanged; a bad --env is a usage error", () => {
  const { run } = sandbox([]);
  const plain = run(["npx", "-y", "@playwright/mcp@0.0.84"]);
  assert.equal(plain.status, 0, plain.stderr);
  assert.deepEqual(plain.recorded.argv, ["-y", "@playwright/mcp@0.0.84"]);
  assert.equal(plain.decrypted, false);
  for (const args of [["--env"], ["--env", "lower-case", "--", "npx"], ["--env", "A_B", "--"]]) {
    const r = run(args);
    assert.equal(r.status, 2, args.join(" "));
    assert.match(r.stderr, /Usage: mcp\.sh/);
    assert.equal(r.recorded, undefined);
  }
});

test(".mcp.yaml: no server takes a secret reference on its command line", () => {
  for (const [name, server] of localServers()) {
    const refs = [server.command, ...(server.args ?? [])].flatMap((a) =>
      [...String(a).matchAll(REFERENCE)].map((m) => m[1]),
    );
    assert.deepEqual(refs, [], `${name}: secret reference on argv`);
  }
});

test(".mcp.yaml: every mcp.sh server gets its secrets in its environment and none on its argv", () => {
  const launched = localServers().filter(([, server]) => server.command === MCP_SH);
  assert.ok(launched.length >= 4, "context7, github, stripe and resend start through mcp.sh");
  for (const [name, server] of launched) {
    const names = declared(server.args);
    // Every name the server could be handed, declared or referenced, holds a canary.
    const referenced = server.args.flatMap((a) =>
      [...String(a).matchAll(REFERENCE)].map((m) => m[1]),
    );
    const { values, run } = sandbox([...new Set([...names, ...referenced])]);
    const r = run(server.args);
    assert.equal(r.status, 0, `${name}: ${r.stderr}`);
    const argv = JSON.stringify(r.recorded.argv);
    for (const [secret, value] of Object.entries(values))
      assert.ok(!argv.includes(value), `${name}: ${secret} on argv`);
    assert.ok(names.length > 0, `${name}: declares the secrets it reads with --env`);
    for (const secret of names)
      assert.equal(r.recorded.env[secret], values[secret], `${name}: ${secret} in the environment`);
    // A header file the server reads holds placeholders of its declared names only, and they resolve.
    const at = server.args.indexOf("--header-file");
    if (at !== -1) {
      const text = readFileSync(join(root, server.args[at + 1]), "utf8");
      const placeholders = [...text.matchAll(/\$\{([A-Z_][A-Z0-9_]*)\}/g)].map((m) => m[1]);
      assert.ok(placeholders.length > 0, `${name}: the header file names its token`);
      for (const placeholder of placeholders)
        assert.ok(names.includes(placeholder), `${name}: ${placeholder} is declared with --env`);
      const resolved = text.replaceAll(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, n) => r.recorded.env[n]);
      assert.ok(resolved.includes(values[placeholders[0]]), `${name}: the placeholder resolves`);
    }
  }
});
