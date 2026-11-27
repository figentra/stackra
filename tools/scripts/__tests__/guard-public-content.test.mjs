/**
 * Stackra file contract:
 * Purpose: hold `guard-public-content.mjs` to its contract (STA-2876): denied words and hosts by hash, personal home
 *          folders, a file's path as well as its text, approval lines checked like any other (STA-2905), the allow
 *          list exempt (a path, one line by its hash, a package) and its stale line entries reported, tarballs read
 *          file by file (an allowed package skipped), and this repository's tracked files clean.
 * Boundary: a test-only denied term ("zorblax") is added to the in-memory list; tarballs are built in a temp folder
 *           with the system `tar`; never writes this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-2876.
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DENIED,
  hashLine,
  hashTerm,
  lineFindings,
  readAllow,
  scanTarball,
  scanText,
  staleLineEntries,
  tarballFiles,
} from "../guard-public-content.mjs";

const TOOL = fileURLToPath(new URL("../guard-public-content.mjs", import.meta.url));
/** A user name that is not a placeholder, spliced in so this file's own text stays clean. */
const PERSON = "jdoe";
const root = mkdtempSync(join(tmpdir(), "guard-public-content-"));
after(() => rmSync(root, { recursive: true, force: true }));

// Test-only terms, so this file names nothing it forbids.
DENIED.set(hashTerm("zorblax"), { length: 7, reason: "a test product name" });
DENIED.set(hashTerm("zeta.cloud"), { length: 10, reason: "a test host" });

/** A gzipped tarball of `files` (`{ path: text }`) under `package/`, as `pnpm pack` lays it out. */
function tarball(name, files) {
  const dir = join(root, name);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, "package", path)), { recursive: true });
    writeFileSync(join(dir, "package", path), text);
  }
  const file = join(root, `${name}.tgz`);
  const out = spawnSync("tar", ["-czf", file, "-C", dir, "package"], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  return file;
}

test("guard-public-content: every denied entry is a hash with its length and reason, never the term", () => {
  const source = readFileSync(TOOL, "utf8");
  for (const [hash, entry] of DENIED) {
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.ok(Number.isInteger(entry.length) && entry.length > 0, hash);
    assert.ok(entry.reason.length > 0, hash);
  }
  assert.ok(!source.includes("zorblax"));
});

test("guard-public-content: a denied word is found whole and in any case, never inside another word", () => {
  assert.deepEqual(lineFindings("Ported from Zorblax's console"), ["a test product name"]);
  assert.deepEqual(lineFindings("ZORBLAX_API_KEY"), ["a test product name"]);
  assert.deepEqual(lineFindings("@zorblax/ui and zorblax-web"), ["a test product name"]);
  assert.deepEqual(lineFindings("zorblaxing and prezorblax are other words"), []);
});

test("guard-public-content: a denied host is found by each suffix, in a URL or a subdomain", () => {
  assert.deepEqual(lineFindings("https://console-me.zeta.cloud/x"), ["a test host"]);
  assert.deepEqual(lineFindings("ZETA.CLOUD"), ["a test host"]);
  assert.deepEqual(lineFindings("zeta.clouds.net, zeta and cloud"), []);
  assert.deepEqual(lineFindings("api.zorblax.example"), ["a test product name"]);
});

test("guard-public-content: a home folder with a real user name is found; placeholders are not", () => {
  const home = "a personal home folder (/Users/<name>/ or /home/<name>/)";
  assert.deepEqual(lineFindings(`cd /Users/${PERSON}/Projects/stackra`), [home]);
  assert.deepEqual(lineFindings(`cwd: "/home/${PERSON}/work"`), [home]);
  for (const line of [
    "/Users/me/Projects/stackra",
    "/home/runner/work/x",
    "/Users/<you>/x",
    "/home/node/app",
    "~/Projects/stackra",
    "https://example.com/home/jdoe/x", // a URL path is not a home folder
    "/tmp/Users/jdoe/x",
  ])
    assert.deepEqual(lineFindings(line), [], line);
});

test("guard-public-content: a file's path is read as well as its text (line 0); binary text is not", () => {
  assert.deepEqual(scanText("apps/themes/zorblax.json", "{}"), [
    { path: "apps/themes/zorblax.json", line: 0, reason: "a test product name" },
  ]);
  assert.deepEqual(scanText("a.md", "one\ntwo zorblax\n"), [
    { path: "a.md", line: 2, reason: "a test product name" },
  ]);
  assert.deepEqual(scanText("font.woff2", "\u0000zorblax"), []);
});

test("guard-public-content: an approval line that names a person is a finding, in a spec or anywhere", () => {
  const text =
    "- 2026-11-26 → Planned — Approved by zorblax (CTO) 2026-11-26\n**Approver**: CTO (zorblax)\n" +
    "the design zorblax approved by mail\n- 2026-11-27 → Planned — Approved by CTO 2026-11-27\n";
  assert.deepEqual(
    scanText(".agents/specs/sta-1-x/spec.md", text).map((f) => f.line),
    [1, 2, 3],
  );
  assert.deepEqual(
    scanText("docs/notes.md", text).map((f) => f.line),
    [1, 2, 3],
  );
});

test("guard-public-content: a line entry exempts that exact line of that file only", () => {
  const named = "- 2026-11-26 → Planned — Approved by zorblax (CTO) 2026-11-26";
  const text = `${named}\n**Approver**: CTO (zorblax)\n`;
  const allow = [{ path: ".agents/specs/sta-1-x/spec.md", lineSha256: hashLine(named) }];
  assert.deepEqual(
    scanText(".agents/specs/sta-1-x/spec.md", text, allow).map((f) => f.line),
    [2],
  );
  // The same line in another file, or the line changed, is still a finding.
  assert.deepEqual(
    scanText(".agents/specs/sta-2-y/spec.md", text, allow).map((f) => f.line),
    [1, 2],
  );
  assert.deepEqual(
    scanText(".agents/specs/sta-1-x/spec.md", `${named} \n`, allow).map((f) => f.line),
    [1],
  );
  // A line entry never exempts the file's path (line 0).
  assert.deepEqual(
    scanText("zorblax.md", named, [{ path: "zorblax.md", lineSha256: hashLine(named) }]).map(
      (f) => f.line,
    ),
    [0],
  );
});

test("guard-public-content: a line entry whose line is gone is reported, so the list only shrinks", () => {
  const named = "Approved by zorblax 2026-11-26";
  const allow = [
    { path: "a.md", lineSha256: hashLine(named), issue: "STA-1" },
    { path: "b.md", lineSha256: hashLine(named), issue: "STA-2" },
    { path: "c.md", lineSha256: hashLine(named), issue: "STA-3" },
    { path: "d/**", issue: "STA-4" },
  ];
  const files = { "a.md": `x\n${named}\n`, "b.md": "Approved by CTO 2026-11-27\n" };
  assert.deepEqual(
    staleLineEntries(allow, (path) => files[path]).map((f) => `${f.path}:${f.line}`),
    ["b.md:0", "c.md:0"],
  );
  assert.match(staleLineEntries(allow, (path) => files[path])[0].reason, /STA-2.*remove it/);
});

test("guard-public-content: --hash-line prints the line entry of one line", () => {
  const file = join(root, "approval.md");
  writeFileSync(file, "one\nApproved by zorblax 2026-11-26\n");
  const out = spawnSync(process.execPath, [TOOL, "--hash-line", `${file}:2`], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  const entry = JSON.parse(out.stdout);
  assert.equal(entry.path, file);
  assert.equal(entry.lineSha256, hashLine("Approved by zorblax 2026-11-26"));
  assert.equal(spawnSync(process.execPath, [TOOL, "--hash-line", `${file}:9`]).status, 2);
  assert.equal(spawnSync(process.execPath, [TOOL, "--hash-line", file]).status, 2);
});

test("guard-public-content: the allow list exempts a folder or an exact path, never a sibling", () => {
  const allow = [{ path: "packages/x/**" }, { path: "a/b.md" }];
  assert.deepEqual(scanText("packages/x/src/zorblax.ts", "zorblax", allow), []);
  assert.deepEqual(scanText("a/b.md", "zorblax", allow), []);
  assert.equal(scanText("packages/xy/a.ts", "zorblax", allow).length, 1);
  assert.equal(scanText("a/b.mdx", "zorblax", allow).length, 1);
  // Every entry of the real list says why and which issue removes it.
  for (const entry of readAllow()) {
    assert.ok((entry.path ?? entry.package) !== undefined, JSON.stringify(entry));
    assert.ok(entry.reason?.length > 0 && /^STA-\d+$/.test(entry.issue), JSON.stringify(entry));
    // A line entry names one exact file and the line's SHA-256, never the line.
    if (entry.lineSha256 !== undefined) {
      assert.match(entry.lineSha256, /^[0-9a-f]{64}$/, JSON.stringify(entry));
      assert.ok(entry.path !== undefined && !entry.path.endsWith("/**"), JSON.stringify(entry));
    }
  }
});

test("guard-public-content: a tarball is read file by file, long paths included; an allowed package is skipped", () => {
  const deep = `src/${"nested-folder/".repeat(9)}deep.ts`;
  const file = tarball("dirty", {
    "package.json": JSON.stringify({ name: "@acme/dirty", version: "1.0.0" }),
    "dist/index.mjs": "export const host = 'api.zeta.cloud';\n",
    [deep]: "// zorblax\n",
  });
  const bytes = readFileSync(file);
  assert.ok(tarballFiles(bytes).some(([name]) => name === `package/${deep}`));
  assert.deepEqual(
    scanTarball("dirty.tgz", bytes).map(({ path, line }) => `${path}:${line}`),
    ["dirty.tgz!package/dist/index.mjs:1", `dirty.tgz!package/${deep}:1`],
  );
  assert.deepEqual(scanTarball("dirty.tgz", bytes, [{ package: "@acme/dirty" }]), []);
  assert.equal(scanTarball("dirty.tgz", bytes, [{ package: "@acme/other" }]).length, 2);
});

test("guard-public-content: the command exits 1 on a dirty tarball, 0 on a clean one, 2 on bad usage", () => {
  const dirty = tarball("home", {
    "package.json": JSON.stringify({ name: "@acme/home", version: "1.0.0" }),
    "dist/index.mjs": `const root = '/Users/${PERSON}/Projects/acme';\n`,
  });
  const clean = tarball("clean", {
    "package.json": JSON.stringify({ name: "@acme/clean", version: "1.0.0" }),
    "dist/index.mjs": "const root = '/Users/me/Projects/acme';\n",
  });
  const bad = spawnSync(process.execPath, [TOOL, "--pack", clean, dirty], { encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /home\.tgz!package\/dist\/index\.mjs:1: a personal home folder/);
  assert.doesNotMatch(bad.stderr, /clean\.tgz/);
  assert.equal(spawnSync(process.execPath, [TOOL, "--pack", clean]).status, 0);
  assert.equal(spawnSync(process.execPath, [TOOL, "--pack"]).status, 2);
  assert.equal(spawnSync(process.execPath, [TOOL, "--nope"]).status, 2);
});

test("guard-public-content: this repository's tracked files carry no internal content", () => {
  const out = spawnSync(process.execPath, [TOOL], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr.split("\n").slice(-20).join("\n"));
});
