/**
 * Stackra file contract:
 * Purpose: hold `scan-tarballs.mjs` to its contract: it reads the files of a gzipped tarball (long names included),
 *          reports each test file and each secret-shaped string with the tarball, path, line and kind but never the
 *          string, and exits 0 clean, 1 with findings, 2 on a usage error or an unreadable tarball (STA-2917).
 * Boundary: writes throwaway tarballs under the OS temp directory with the system `tar` and removes them. The
 *           secret-shaped samples are joined at run time, so this file holds none.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks on the packed tarball); STA-2917.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";

import { main, tarballFindings, tarEntries } from "../scan-tarballs.mjs";

const PEM_HEADER = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
const LIVE_KEY = ["sk", "live", "a1B2".repeat(6)].join("_");

/** A long path (over the 100 bytes of a ustar name field) that a tar writes as a long-name or pax record. */
const LONG = `dist/${"nested-folder/".repeat(8)}deep.mjs`;

/** A gzipped tarball at `<tmp>/<name>` of `files` (relative path → content) under `package/`, as `pnpm pack`. */
function tarball(name, files) {
  const dir = mkdtempSync(join(tmpdir(), "scan-tarballs-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, "package", path)), { recursive: true });
    writeFileSync(join(dir, "package", path), content);
  }
  const file = join(dir, name);
  const made = spawnSync("tar", ["-czf", file, "-C", dir, "package"], { encoding: "utf8" });
  assert.equal(made.status, 0, made.stderr);
  return { dir, file };
}

/** Runs `main` and returns its exit code with what it printed. */
function run(args) {
  const out = [];
  const err = [];
  const code = main(
    args,
    (line) => out.push(line),
    (line) => err.push(line),
  );
  return { code, out, err };
}

test("tarEntries reads every regular file, a long path included", () => {
  const { dir, file } = tarball("a-1.0.0.tgz", {
    "package.json": "{}",
    "dist/index.mjs": "export {};\n",
    [LONG]: "export const deep = 1;\n",
  });
  try {
    const entries = tarEntries(readFileSync(file));
    assert.deepEqual(entries.map(({ path }) => path).sort(), [
      "package/dist/index.mjs",
      `package/${LONG}`,
      "package/package.json",
    ]);
    const deep = entries.find(({ path }) => path.endsWith("deep.mjs"));
    assert.equal(deep.data.toString("utf8"), "export const deep = 1;\n");
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("tarballFindings names each test file and each secret-shaped string, never the string", () => {
  const { dir, file } = tarball("b-1.0.0.tgz", {
    "package.json": "{}",
    "src/a.ts": "export const a = 1;\n",
    "src/__tests__/a.test.ts": `const key = "${LIVE_KEY}";\n`,
    "src/core/b.spec.ts": "\n",
    "dist/index.mjs": `export {};\n\nconst key = "${PEM_HEADER}";\n`,
    [LONG]: `const key = "${LIVE_KEY}";\n`,
  });
  try {
    const findings = tarballFindings(readFileSync(file)).sort();
    assert.deepEqual(findings, [
      "dist/index.mjs:3: a private key block (private-key)",
      `${LONG}:1: a Stripe secret, restricted or webhook key (stripe-key)`,
      "src/__tests__/a.test.ts:0: a test file",
      "src/core/b.spec.ts:0: a test file",
    ]);
    assert.ok(!findings.join("\n").includes(LIVE_KEY));
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("main exits 0 for clean tarballs, 1 with findings, 2 on usage or an unreadable tarball", () => {
  const clean = tarball("clean-1.0.0.tgz", { "package.json": "{}", "dist/a.mjs": "export {};\n" });
  const dirty = tarball("dirty-1.0.0.tgz", { "package.json": "{}", "src/__tests__/a.ts": "\n" });
  try {
    assert.deepEqual(run([clean.file]), { code: 0, out: ["1 tarball(s) clean"], err: [] });

    const found = run([clean.file, dirty.file]);
    assert.equal(found.code, 1);
    assert.deepEqual(found.out, ["dirty-1.0.0.tgz: src/__tests__/a.ts:0: a test file"]);
    assert.match(found.err[0], /^1 finding\(s\) in 2 tarball\(s\)/);

    assert.equal(run([]).code, 2);
    assert.equal(run(["--all"]).code, 2);
    const notGzip = join(clean.dir, "not.tgz");
    writeFileSync(notGzip, "plain text");
    const unreadable = run([notGzip]);
    assert.equal(unreadable.code, 2);
    assert.match(unreadable.err[0], /not\.tgz: cannot read the tarball/);
    const cut = join(clean.dir, "cut.tgz");
    writeFileSync(cut, gzipSync(Buffer.alloc(1024, 0x41))); // gzip, but no tar header inside
    const garbage = run([cut]);
    assert.equal(garbage.code, 2);
    assert.match(garbage.err[0], /cut\.tgz: cannot read the tarball: no tar header at byte 0/);
  } finally {
    rmSync(clean.dir, { recursive: true });
    rmSync(dirty.dir, { recursive: true });
  }
});
