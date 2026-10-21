// Every test runs against a throwaway HOME (temp dir) with a fake Infisical runner; the real ~/Secrets-inbox and
// the real vault are never touched. Values are random canaries generated here; each test asserts none of them
// reaches the output, the audit log or the runner's argv.
// @covers sta-185:FR-001 sta-185:FR-002 sta-185:FR-003 sta-185:FR-005 sta-185:P-001 sta-185:P-002 sta-185:P-003 sta-185:P-005
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  statSync,
  readdirSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { TOKEN_TTL_MS, importSecret, main, scanInbox } from "../secrets-import.mjs";

const script = new URL("../secrets-import.mjs", import.meta.url).pathname;
const canary = () => `fake-${randomBytes(12).toString("hex")}`;

function setup() {
  const home = mkdtempSync(join(tmpdir(), "secrets-import-test-"));
  const inbox = join(home, "Secrets-inbox");
  mkdirSync(inbox);
  return { home, inbox };
}

/** In-memory Infisical: `secrets get … --output=json` and `secrets set NAME=@file`. */
function fakeInfisical({
  failSet = false,
  failGet = 0,
  corrupt = false,
  crashSet = false,
  noFileSyntax = false,
} = {}) {
  const store = new Map();
  const calls = [];
  const flag = (args, k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
  const runner = (args) => {
    calls.push(args);
    const key = `${flag(args, "env")}:${flag(args, "path")}`;
    if (args[1] === "get") {
      if (failGet-- > 0) return { status: 1, stdout: "", stderr: "error: please login" };
      const v = store.get(`${key}:${args[2]}`);
      return {
        status: 0,
        stdout: JSON.stringify([
          v === undefined
            ? { secretKey: args[2], secretValue: "*not found*", type: "*not found*" }
            : { secretKey: args[2], secretValue: v, type: "shared" },
        ]),
        stderr: "",
      };
    }
    if (args[1] === "set" && args.includes("--help"))
      return {
        status: 0,
        stdout: noFileSyntax ? "set <a=b>" : "set <secretName=@/path/to/file>",
        stderr: "",
      };
    if (args[1] === "set") {
      if (crashSet) throw new Error("simulated crash mid-write");
      const [name, file] = args[2].split("=@");
      const value = readFileSync(file, "utf8");
      // The CLI's own output may contain the value; the script must swallow it.
      if (failSet) return { status: 1, stdout: value, stderr: `boom ${value}` };
      store.set(`${key}:${name}`, corrupt ? value + "x" : value);
      return { status: 0, stdout: `${name} ${value}`, stderr: "" };
    }
    return { status: 2, stdout: "", stderr: "" };
  };
  return { store, calls, runner };
}

function run(home, argv, runner, now) {
  let out = "";
  const code = main(argv, { home, runner, now, write: (s) => (out += s) });
  return { code, out };
}

const auditLog = (home) => {
  const p = join(home, ".stackra", "secrets-audit.log");
  return existsSync(p) ? readFileSync(p, "utf8") : "";
};

function assertNoLeak(values, { out, home, calls }) {
  for (const v of values) {
    assert.ok(!out.includes(v), "value in output");
    assert.ok(!auditLog(home).includes(v), "value in audit log");
    assert.ok(!JSON.stringify(calls).includes(v), "value on argv");
  }
}

test("imports dev:/agents by default, verifies, deletes the inbox file, logs names only", () => {
  const { home, inbox } = setup();
  const v = canary();
  writeFileSync(join(inbox, "STACKRA_TEST_KEY.pem"), v + "\n");
  const fake = fakeInfisical();
  const r = run(home, ["--actor", "secret-manager"], fake.runner);
  assert.equal(r.code, 0);
  assert.equal(fake.store.get("dev:/agents:STACKRA_TEST_KEY"), v, "one trailing newline stripped");
  assert.equal(existsSync(join(inbox, "STACKRA_TEST_KEY.pem")), false);
  assert.match(r.out, /STACKRA_TEST_KEY {2}dev:\/agents {2}imported/);
  const line = JSON.parse(auditLog(home).trim());
  assert.deepEqual(
    [line.actor, line.name, line.env, line.path, line.action, line.result],
    ["secret-manager", "STACKRA_TEST_KEY", "dev", "/agents", "import", "ok"],
  );
  assertNoLeak([v], { ...r, home, calls: fake.calls });
});

test("sidecar sets env/path; flags override; sidecar removed on success", () => {
  const { home, inbox } = setup();
  const v = canary();
  writeFileSync(join(inbox, "STACKRA_CI_TOKEN"), v);
  writeFileSync(join(inbox, "STACKRA_CI_TOKEN.target.yaml"), "env: staging\npath: /ci\n");
  const fake = fakeInfisical();
  assert.equal(run(home, ["--path", "/ci/release"], fake.runner).code, 0);
  assert.equal(fake.store.get("staging:/ci/release:STACKRA_CI_TOKEN"), v);
  assert.equal(existsSync(join(inbox, "STACKRA_CI_TOKEN.target.yaml")), false);
});

test("--name renames a single file; refused with several", () => {
  const { home, inbox } = setup();
  writeFileSync(join(inbox, "A_ONE"), canary());
  writeFileSync(join(inbox, "B_TWO"), canary());
  const fake = fakeInfisical();
  assert.equal(run(home, ["--name", "RENAMED"], fake.runner).code, 2);
  assert.equal(run(home, ["A_ONE", "--name", "RENAMED"], fake.runner).code, 0);
  assert.ok(fake.store.has("dev:/agents:RENAMED"));
  assert.ok(existsSync(join(inbox, "B_TWO")), "only the named file is touched");
});

test("refuses symlinks, directories, oversize, empty, bad names, bad env/path; nothing written", () => {
  const { home, inbox } = setup();
  const outside = join(home, "outside");
  writeFileSync(outside, canary());
  symlinkSync(outside, join(inbox, "LINKED_SECRET"));
  mkdirSync(join(inbox, "SUBDIR"));
  writeFileSync(join(inbox, "TOO_BIG"), "x".repeat(64 * 1024 + 1));
  writeFileSync(join(inbox, "EMPTY_ONE"), "\n");
  writeFileSync(join(inbox, "lower_case"), canary());
  writeFileSync(join(inbox, ".DS_Store"), "ignored");
  writeFileSync(join(inbox, "BAD_ENV"), canary());
  writeFileSync(join(inbox, "BAD_ENV.target.yaml"), "env: qa\n");
  writeFileSync(join(inbox, "BAD_PATH"), canary());
  writeFileSync(join(inbox, "BAD_PATH.target.yaml"), "path: /other\n");
  const fake = fakeInfisical();
  const r = run(home, [], fake.runner);
  assert.equal(r.code, 1);
  for (const [file, why] of [
    ["LINKED_SECRET", "symlink refused"],
    ["SUBDIR", "directory refused"],
    ["TOO_BIG", "larger than"],
    ["lower_case", "SCREAMING_SNAKE"],
    ["EMPTY_ONE", "empty"],
    ["BAD_ENV", "env must be one of"],
    ["BAD_PATH", "path must be"],
  ])
    assert.match(r.out, new RegExp(`${file}.*refused: .*${why}`));
  assert.ok(!r.out.includes(".DS_Store"));
  assert.equal(fake.store.size, 0);
  assert.equal(fake.calls.filter((c) => c[1] === "set").length, 0, "refusals never reach a write");
});

test("--dry-run validates and reports would-overwrite, writes nothing, keeps the file", () => {
  const { home, inbox } = setup();
  const v = canary();
  writeFileSync(join(inbox, "EXISTING_KEY"), v);
  writeFileSync(join(inbox, "NEW_KEY"), canary());
  const fake = fakeInfisical();
  fake.store.set("dev:/agents:EXISTING_KEY", "older");
  const r = run(home, ["--dry-run"], fake.runner);
  assert.equal(r.code, 0);
  assert.match(r.out, /EXISTING_KEY .* would-overwrite: yes/);
  assert.match(r.out, /NEW_KEY .* would-overwrite: no/);
  assert.equal(fake.store.get("dev:/agents:EXISTING_KEY"), "older");
  assert.ok(existsSync(join(inbox, "EXISTING_KEY")) && existsSync(join(inbox, "NEW_KEY")));
  assertNoLeak([v], { ...r, home, calls: fake.calls });
});

test("unreachable / logged-out Infisical: value-free refusal, file kept", () => {
  const { home, inbox } = setup();
  writeFileSync(join(inbox, "SOME_KEY"), canary());
  const r = run(home, [], fakeInfisical({ failGet: 1 }).runner);
  assert.equal(r.code, 1);
  assert.match(r.out, /SOME_KEY .*refused: read: not logged in to Infisical/);
  assert.ok(existsSync(join(inbox, "SOME_KEY")));
});

test("a failed write never echoes the CLI output and keeps the file", () => {
  const { home, inbox } = setup();
  const v = canary();
  writeFileSync(join(inbox, "WRITE_FAILS"), v);
  const fake = fakeInfisical({ failSet: true });
  const r = run(home, [], fake.runner);
  assert.equal(r.code, 1);
  assert.match(r.out, /WRITE_FAILS .*refused: write: infisical exited 1/);
  assert.ok(existsSync(join(inbox, "WRITE_FAILS")));
  assertNoLeak([v], { ...r, home, calls: fake.calls });
});

test("a read-back hash mismatch fails and keeps the file", () => {
  const { home, inbox } = setup();
  writeFileSync(join(inbox, "CORRUPTED"), canary());
  const r = run(home, [], fakeInfisical({ corrupt: true }).runner);
  assert.equal(r.code, 1);
  assert.match(r.out, /read-back hash does not match/);
  assert.ok(existsSync(join(inbox, "CORRUPTED")));
});

test("production: refused without a token; dry-run token works once, binds the file, expires", () => {
  const { home, inbox } = setup();
  const v = canary();
  const file = join(inbox, "PROD_KEY");
  const side = join(inbox, "PROD_KEY.target.yaml");
  writeFileSync(file, v);
  writeFileSync(side, "env: prod\npath: /ci\n");
  const fake = fakeInfisical();
  const t0 = 1_800_000_000_000;

  assert.match(run(home, [], fake.runner, () => t0).out, /needs --confirm <token>/);
  const dry = run(home, ["--dry-run"], fake.runner, () => t0);
  const token = dry.out.match(/--confirm (\S+)/)[1];

  assert.match(run(home, ["--confirm", "0-bad"], fake.runner, () => t0).out, /expired/);
  assert.match(
    run(home, ["--confirm", token], fake.runner, () => t0 + TOKEN_TTL_MS + 1).out,
    /expired/,
  );
  writeFileSync(file, v + "changed");
  assert.match(run(home, ["--confirm", token], fake.runner, () => t0).out, /does not match/);
  writeFileSync(file, v);
  const ok = run(home, ["--confirm", token], fake.runner, () => t0 + 60_000);
  assert.equal(ok.code, 0);
  assert.equal(fake.store.get("prod:/ci:PROD_KEY"), v);

  writeFileSync(file, v);
  writeFileSync(side, "env: prod\npath: /ci\n");
  assert.match(run(home, ["--confirm", token], fake.runner, () => t0).out, /already used/);
  assertNoLeak([v], { ...ok, home, calls: fake.calls });
});

test("--list prints file names only", () => {
  const { home, inbox } = setup();
  const v = canary();
  writeFileSync(join(inbox, "LISTED_KEY.pem"), v);
  const r = run(home, ["--list"], fakeInfisical().runner);
  assert.equal(r.out, "LISTED_KEY.pem\n");
  assert.deepEqual(scanInbox(inbox).entries, [{ file: "LISTED_KEY.pem", name: "LISTED_KEY" }]);
});

test("--list exits 1 when the inbox itself is refused (symlink or not a directory) (STA-194)", () => {
  const linked = mkdtempSync(join(tmpdir(), "secrets-import-list-link-"));
  mkdirSync(join(linked, "elsewhere"));
  symlinkSync(join(linked, "elsewhere"), join(linked, "Secrets-inbox"));
  const linkRun = run(linked, ["--list"], fakeInfisical().runner);
  assert.equal(linkRun.code, 1);
  assert.match(linkRun.out, /refused: inbox is not a real directory/);
  const file = mkdtempSync(join(tmpdir(), "secrets-import-list-file-"));
  writeFileSync(join(file, "Secrets-inbox"), canary());
  assert.equal(run(file, ["--list"], fakeInfisical().runner).code, 1);
  const { home } = setup();
  assert.equal(run(home, ["--list"], fakeInfisical().runner).code, 0);
});

test("CLI: no --value flag, unknown flags are not echoed, missing inbox is reported", () => {
  const home = mkdtempSync(join(tmpdir(), "secrets-import-cli-"));
  const v = canary();
  const cli = (...args) =>
    spawnSync("node", [script, ...args], { env: { ...process.env, HOME: home }, encoding: "utf8" });
  const bad = cli(`--value=${v}`);
  assert.equal(bad.status, 2);
  assert.ok(!bad.stdout.includes(v) && !bad.stderr.includes(v));
  const named = cli("--name", v);
  assert.equal(named.status, 2);
  assert.ok(!named.stdout.includes(v));
  const list = cli("--list");
  assert.equal(list.status, 0);
  assert.match(list.stdout, /inbox does not exist/);
});

test("importSecret streams a value in and returns only { name, ok, reason }", async () => {
  const { home } = setup();
  const v = canary();
  const fake = fakeInfisical();
  const base = { home, runner: fake.runner, actor: "request-page" };
  const ok = await importSecret({ ...base, name: "STREAMED_KEY", valueStream: Readable.from([v]) });
  assert.deepEqual(ok, { name: "STREAMED_KEY", ok: true });
  assert.equal(fake.store.get("dev:/agents:STREAMED_KEY"), v);

  const prod = await importSecret({
    ...base,
    name: "PROD_STREAM",
    env: "prod",
    path: "/ci",
    valueStream: Readable.from([v]),
  });
  assert.equal(prod.ok, false);
  assert.match(prod.reason, /needs --confirm/);

  const big = await importSecret({
    ...base,
    name: "BIG_STREAM",
    valueStream: Readable.from([Buffer.alloc(64 * 1024 + 1, 120)]),
  });
  assert.deepEqual(big, { name: "BIG_STREAM", ok: false, reason: "larger than 65536 bytes" });

  const bad = await importSecret({ ...base, name: v, valueStream: Readable.from([v]) });
  assert.deepEqual(bad, {
    name: "(invalid name)",
    ok: false,
    reason: "name is not SCREAMING_SNAKE",
  });
  assertNoLeak([v], { out: JSON.stringify([ok, prod, big, bad]), home, calls: fake.calls });
});

test("overwrite and unchanged are reported, and the audit line is written before the file is deleted", () => {
  const { home, inbox } = setup();
  const v = canary();
  const fake = fakeInfisical();
  fake.store.set("dev:/agents:OVER_KEY", "older");
  fake.store.set("dev:/agents:SAME_KEY", v);
  writeFileSync(join(inbox, "OVER_KEY"), v);
  writeFileSync(join(inbox, "SAME_KEY"), v);
  const r = run(home, [], fake.runner);
  assert.equal(r.code, 0);
  assert.match(r.out, /OVER_KEY .*imported \(overwritten\)/);
  assert.match(r.out, /SAME_KEY .*imported \(unchanged\)/);
  assert.equal(fake.store.get("dev:/agents:OVER_KEY"), v);
  assert.equal(fake.calls.filter((c) => c[1] === "set" && !c.includes("--help")).length, 1);
  assert.equal(auditLog(home).match(/"result":"ok"/g).length, 2);
  assertNoLeak([v], { ...r, home, calls: fake.calls });
});

test("production: a crash after the token is spent still refuses its reuse", () => {
  const { home, inbox } = setup();
  writeFileSync(join(inbox, "PROD_CRASH"), canary());
  writeFileSync(join(inbox, "PROD_CRASH.target.yaml"), "env: prod\npath: /ci\n");
  const t0 = 1_800_000_000_000;
  const token = run(home, ["--dry-run"], fakeInfisical().runner, () => t0).out.match(
    /--confirm (\S+)/,
  )[1];
  assert.throws(() =>
    run(home, ["--confirm", token], fakeInfisical({ crashSet: true }).runner, () => t0),
  );
  assert.ok(existsSync(join(inbox, "PROD_CRASH")), "inbox file kept after the crash");
  assert.deepEqual(
    readdirSync(inbox).filter((f) => f.startsWith(".")),
    [],
    "temp dir removed",
  );
  assert.match(
    run(home, ["--confirm", token], fakeInfisical().runner, () => t0).out,
    /already used/,
  );
});

test("a CLI without NAME=@file support fails before any write", () => {
  const { home, inbox } = setup();
  writeFileSync(join(inbox, "OLD_CLI"), canary());
  const fake = fakeInfisical({ noFileSyntax: true });
  const r = run(home, [], fake.runner);
  assert.equal(r.code, 1);
  assert.match(r.out, /does not support NAME=@file/);
  assert.equal(fake.store.size, 0);
  assert.ok(existsSync(join(inbox, "OLD_CLI")));
});

test("stale temp dirs are removed at start; ~/.stackra is tightened to 0700; names are sanitised", () => {
  const { home, inbox } = setup();
  mkdirSync(join(inbox, ".import-stale"));
  writeFileSync(join(inbox, ".import-stale", "value"), canary());
  mkdirSync(join(home, ".stackra"), { mode: 0o755 });
  mkdirSync(join(inbox, "EVIL\u001b[2JDIR"));
  const r = run(home, ["--list"], fakeInfisical().runner);
  assert.equal(existsSync(join(inbox, ".import-stale")), false);
  assert.equal(statSync(join(home, ".stackra")).mode & 0o777, 0o700);
  assert.ok(!r.out.includes("\u001b"));
  assert.match(r.out, /EVIL\?\[2JDIR/);
});

test("importSecret refuses a symlinked inbox before creating its temp dir (STA-192)", async () => {
  const home = mkdtempSync(join(tmpdir(), "secrets-import-link-"));
  const elsewhere = join(home, "elsewhere");
  mkdirSync(elsewhere);
  symlinkSync(elsewhere, join(home, "Secrets-inbox"));
  const fake = fakeInfisical();
  const r = await importSecret({
    name: "LINKED_INBOX",
    valueStream: Readable.from([canary()]),
    home,
    runner: fake.runner,
  });
  assert.deepEqual(r, { name: "LINKED_INBOX", ok: false, reason: "inbox is not a real directory" });
  assert.deepEqual(readdirSync(elsewhere), []);
  assert.equal(fake.calls.length, 0);
});
