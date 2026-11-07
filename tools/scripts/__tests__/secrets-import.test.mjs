/**
 * Stackra file contract:
 * Purpose: hold `secrets-import.mjs` to its contract: the inbox listing, refused inputs, `--scope` or `--tree` as
 *          the only targets (the figentra/secrets writes themselves are in `secrets-sops.test.mjs`), and no secret
 *          value in the output or the audit log.
 * Boundary: a throwaway HOME; the real inbox and figentra/secrets are never touched.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). ADR 0257 (secrets inbox);
 *                     ADR 0525.
 */
// Every test runs against a throwaway HOME (temp dir); the real ~/Secrets-inbox is never touched. Values are random
// canaries generated here; each test asserts none of them reaches the output or the audit log.
// @covers sta-185:FR-001 sta-185:FR-002 sta-185:P-001 sta-185:P-002
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  statSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, scanInbox } from "../secrets-import.mjs";

const script = new URL("../secrets-import.mjs", import.meta.url).pathname;
const canary = () => `fake-${randomBytes(12).toString("hex")}`;

function setup() {
  const home = mkdtempSync(join(tmpdir(), "secrets-import-test-"));
  const inbox = join(home, "Secrets-inbox");
  mkdirSync(inbox);
  return { home, inbox };
}

/** A sops runner that fails the test if any write is attempted. */
const sopsRun = (command) => assert.fail(`no ${command} call expected`);

/** Runs main against `home`; returns the exit code and the output. */
function run(home, argv, env = {}) {
  let out = "";
  const code = main(argv, { home, sopsRun, write: (s) => (out += s), env });
  return { code, out };
}

const auditLog = (home) => {
  const p = join(home, ".stackra", "secrets-audit.log");
  return existsSync(p) ? readFileSync(p, "utf8") : "";
};

test("without --scope or --tree nothing is read or written: Infisical is no longer a target", () => {
  const { home, inbox } = setup();
  const v = canary();
  writeFileSync(join(inbox, "STACKRA_TEST_KEY"), v);
  for (const argv of [[], ["STACKRA_TEST_KEY"], ["--dry-run"]]) {
    const r = run(home, argv);
    assert.equal(r.code, 2);
    assert.match(r.out, /--scope <scope> or --tree is required/);
    assert.ok(!r.out.includes(v));
  }
  for (const flag of ["--env", "--path", "--project", "--confirm"]) {
    const r = run(home, [flag, "x"]);
    assert.equal(r.code, 2, `${flag} is gone`);
  }
  assert.ok(existsSync(join(inbox, "STACKRA_TEST_KEY")), "the inbox file is kept");
  assert.ok(!auditLog(home).includes(v));
});

test("--scope refuses symlinks, directories, oversize, empty and bad names; a dry run writes nothing", () => {
  const { home, inbox } = setup();
  const values = [canary(), canary(), canary()];
  const outside = join(home, "outside");
  writeFileSync(outside, values[0]);
  symlinkSync(outside, join(inbox, "LINKED_SECRET"));
  mkdirSync(join(inbox, "SUBDIR"));
  writeFileSync(join(inbox, "TOO_BIG"), "x".repeat(64 * 1024 + 1));
  writeFileSync(join(inbox, "EMPTY_ONE"), "\n");
  writeFileSync(join(inbox, "lower_case"), values[1]);
  writeFileSync(join(inbox, ".DS_Store"), "ignored");
  writeFileSync(join(inbox, "GOOD_ONE"), values[2]);
  const r = run(home, ["--scope", "agents", "--dry-run"]);
  assert.equal(r.code, 1);
  for (const [file, why] of [
    ["LINKED_SECRET", "symlink refused"],
    ["SUBDIR", "directory refused"],
    ["TOO_BIG", "larger than"],
    ["lower_case", "SCREAMING_SNAKE"],
    ["EMPTY_ONE", "empty"],
  ])
    assert.match(r.out, new RegExp(`${file}.*refused: .*${why}`));
  assert.match(r.out, /GOOD_ONE {2}agents {2}ok \(dry run, nothing written\)/);
  assert.ok(!r.out.includes(".DS_Store"));
  assert.ok(existsSync(join(inbox, "GOOD_ONE")), "a dry run keeps the file");
  for (const v of values) assert.ok(!r.out.includes(v) && !auditLog(home).includes(v));
});

test("--list prints file names only", () => {
  const { home, inbox } = setup();
  const v = canary();
  writeFileSync(join(inbox, "LISTED_KEY.pem"), v);
  const r = run(home, ["--list"]);
  assert.equal(r.out, "LISTED_KEY.pem\n");
  assert.deepEqual(scanInbox(inbox).entries, [{ file: "LISTED_KEY.pem", name: "LISTED_KEY" }]);
});

test("--list exits 1 when the inbox itself is refused (symlink or not a directory) (STA-194)", () => {
  const linked = mkdtempSync(join(tmpdir(), "secrets-import-list-link-"));
  mkdirSync(join(linked, "elsewhere"));
  symlinkSync(join(linked, "elsewhere"), join(linked, "Secrets-inbox"));
  const linkRun = run(linked, ["--list"]);
  assert.equal(linkRun.code, 1);
  assert.match(linkRun.out, /refused: inbox is not a real directory/);
  const file = mkdtempSync(join(tmpdir(), "secrets-import-list-file-"));
  writeFileSync(join(file, "Secrets-inbox"), canary());
  assert.equal(run(file, ["--list"]).code, 1);
  const { home } = setup();
  assert.equal(run(home, ["--list"]).code, 0);
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

test("stale temp dirs are removed at start; ~/.stackra is tightened to 0700; names are sanitised", () => {
  const { home, inbox } = setup();
  mkdirSync(join(inbox, ".import-stale"));
  writeFileSync(join(inbox, ".import-stale", "value"), canary());
  mkdirSync(join(home, ".stackra"), { mode: 0o755 });
  mkdirSync(join(inbox, "EVIL\u001b[2JDIR"));
  const r = run(home, ["--list"]);
  assert.equal(existsSync(join(inbox, ".import-stale")), false);
  assert.equal(statSync(join(home, ".stackra")).mode & 0o777, 0o700);
  assert.ok(!r.out.includes("\u001b"));
  assert.match(r.out, /EVIL\?\[2JDIR/);
});
