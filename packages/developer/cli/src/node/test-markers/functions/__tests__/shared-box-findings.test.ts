/**
 * Stackra file contract:
 * Purpose: hold the shared-box rules (`sharedBoxFindings`) to their contract: binding a literal port (`.listen`,
 *          `.bind`, a `{ port }` option, `new …Server({ port })`), a port-named variable holding a fixed number, and a
 *          write to a fixed `/tmp` or `/var/tmp` path, a fixed name under `tmpdir()` or the real home folder are
 *          findings with their line, read from the argument the call writes (a symlink's target is not written); port 0, a port read back from the OS, a `mkdtemp` folder, text inside a string or
 *          comment and a line accepted with `// shared-box: <reason>` are not; this checkout's tests pass.
 * Boundary: writes fixture trees into temp directories; the last test reads this checkout.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (decisions 3 and 4); STA-2842.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@stackra/testing";

import { sharedBoxFindings } from "#node/test-markers/functions/shared-box-findings.function";

/** The fixture test file. */
const FILE = "packages/a/src/__tests__/a.test.ts";

/** The finding texts of one test file holding `source`. */
function findings(source: string): string[] {
  const root = mkdtempSync(join(tmpdir(), "shared-box-"));
  mkdirSync(dirname(join(root, FILE)), { recursive: true });
  writeFileSync(join(root, FILE), source);
  return sharedBoxFindings(root).map(({ dir, text }) => {
    assert.equal(dir, FILE);
    return text;
  });
}

test("binding a literal port is a finding with its line", () => {
  assert.deepEqual(findings('\nserver.listen(4000, "127.0.0.1");'), [
    "line 2: binds the fixed port 4000, which another run on the box can hold: listen on port 0 and read the port the OS gave",
  ]);
  assert.equal(findings("socket.bind(41_234);").length, 1);
  assert.equal(findings('server.listen({ host: "::1", port: 8080 });').length, 1);
  assert.equal(findings("const wss = new WebSocketServer({ port: 9001 });").length, 1);
});

test("port 0, a port the OS gave and a port read from a variable are not findings", () => {
  assert.deepEqual(findings("server.listen(0);"), []);
  assert.deepEqual(findings("server.listen({ port: 0 });"), []);
  assert.deepEqual(findings("server.listen(port);"), []);
  assert.deepEqual(findings("const port = (server.address() as AddressInfo).port;"), []);
  assert.deepEqual(findings("new WebSocketServer({ port: 0 });"), []);
});

test("a port-named variable holding a fixed number is a finding, other numbers are not", () => {
  assert.match(findings("const PORT = 47_913;")[0] ?? "", /line 1: PORT fixes port 47913/);
  assert.equal(findings("const relayPort: number = 47914;\n").length, 1);
  assert.equal(findings("let DISCOVERY_PORT = 5353, other = 1;").length, 1);
  assert.deepEqual(findings("const TIMEOUT = 5000;"), []);
  assert.deepEqual(findings("const report = 3;"), []);
  assert.deepEqual(findings("const PORT = 70000;"), []);
});

test("a write to a fixed shared temp path or the real home folder is a finding", () => {
  assert.match(
    findings('writeFileSync("/tmp/stackra-lock", "x");')[0] ?? "",
    /line 1: writes the fixed shared path "\/tmp\/stackra-lock", .* make a private folder with mkdtemp/,
  );
  assert.equal(findings("mkdirSync('/var/tmp/cache', { recursive: true });").length, 1);
  assert.equal(findings('await writeFile(join(tmpdir(), "stackra-runway-locks"), "");').length, 1);
  assert.equal(findings('rmSync(join(os.tmpdir(), "fixed"), { force: true });').length, 1);
  assert.match(
    findings('writeFileSync(join(homedir(), ".stackra", "x"), "");')[0] ?? "",
    /writes into the real home folder/,
  );
});

test("the argument a link, copy or move writes is the one checked", () => {
  assert.deepEqual(findings('symlinkSync(homedir(), join(dir, "home"));'), []);
  assert.equal(findings('symlinkSync(target, join(homedir(), "link"));').length, 1);
  assert.deepEqual(findings('copyFileSync("/tmp/in", join(dir, "out"));'), []);
  assert.equal(
    findings('cpSync(join(dir, "a"), "/tmp/fixed-copy", { recursive: true });').length,
    1,
  );
  assert.equal(findings('renameSync("/tmp/fixed-old", join(dir, "new"));').length, 1);
  assert.equal(findings('renameSync(join(dir, "old"), "/tmp/fixed-new");').length, 1);
});

test("a private temp folder, a computed temp name and text in a string are not findings", () => {
  assert.deepEqual(
    findings('const dir = mkdtempSync(join(tmpdir(), "x-"));\nwriteFileSync(join(dir, "a"), "");'),
    [],
  );
  assert.deepEqual(findings("writeFileSync(join(tmpdir(), `run-${process.pid}`), '');"), []);
  assert.deepEqual(
    findings('const text = "server.listen(4000); writeFileSync(\\"/tmp/a\\")";'),
    [],
  );
  assert.deepEqual(findings("// server.listen(4000)\n"), []);
});

test("a shared-box comment with a reason on the line or the line above accepts it", () => {
  assert.deepEqual(findings("// shared-box: the port is data, never bound\nconst PORT = 443;"), []);
  assert.deepEqual(findings("const PORT = 443; // shared-box: the port is data, never bound"), []);
  assert.equal(findings("// shared-box:\nconst PORT = 443;").length, 1);
});

test("the tests of this checkout follow the shared-box rules", () => {
  const root = fileURLToPath(new URL("../../../../../../../../", import.meta.url));
  assert.deepEqual(sharedBoxFindings(root), []);
});
