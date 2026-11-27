/**
 * Stackra file contract:
 * Purpose: hold `guard-public-content.mjs` to its contract (STA-2876, STA-2911): the two policy files (the public one
 *          only `allow`s and refuses `deny`, the private one holds the hashed `deny` list, named by a flag or
 *          `PUBLIC_CONTENT_PRIVATE_POLICY_FILE`; without it denied terms go unchecked and the guard says so; an
 *          invalid or unreadable named policy stops every scan), no denied term or hash of one in a public file,
 *          denied words and hosts by hash, personal home folders, a file's path as well as its text,
 *          approval lines checked like any other (STA-2905) and the role-only approval format clean, the allow list
 *          exempt (a path, one line by its hash, a package) and its stale line entries reported, `--files` for the
 *          pre-commit hook, tarballs read file by file (an allowed package skipped), the guard wired into validate,
 *          the pre-commit hook, both release pack steps and the Quality Gate's private policy step.
 * Boundary: test-only denied terms ("zorblax", "zeta.cloud") live in in-memory or temporary policies; tarballs and
 *           policies are written to a temp folder (tarballs with the system `tar`); never writes this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-2876; STA-2911.
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EMPTY_POLICY,
  PRIVATE_POLICY_ENV,
  hashLine,
  hashTerm,
  lineFindings,
  parsePolicy,
  parsePrivatePolicy,
  readPolicy,
  scanTarball,
  scanText,
  staleLineEntries,
  tarballFiles,
} from "../guard-public-content.mjs";

const TOOL = fileURLToPath(new URL("../guard-public-content.mjs", import.meta.url));
const REPO = fileURLToPath(new URL("../../..", import.meta.url));
/** The text of a file of this checkout. */
const read = (path) => readFileSync(join(REPO, path), "utf8");
/** A user name that is not a placeholder, spliced in so this file's own text stays clean. */
const PERSON = "jdoe";
const root = mkdtempSync(join(tmpdir(), "guard-public-content-"));
after(() => rmSync(root, { recursive: true, force: true }));

/** The `deny` entries of the test-only terms, so this file names nothing it forbids. */
const TEST_DENY = [
  { sha256: hashTerm("zorblax"), length: 7, reason: "a test product name" },
  { sha256: hashTerm("zeta.cloud"), length: 10, reason: "a test host" },
];

/** A policy that denies the test terms (as a private policy would), with `allow` as given. */
function policyWith(allow = []) {
  const denied = parsePrivatePolicy({ deny: TEST_DENY });
  const { policy, errors } = parsePolicy({ allow });
  assert.deepEqual([...denied.errors, ...errors], []);
  return { deny: denied.deny, allow: policy.allow };
}
const TEST = policyWith();
/** The findings of one line against the test policy. */
const findings = (line) => lineFindings(line, TEST.deny);
/** An allow entry with the fields the policy requires. */
const entry = (fields) => ({ reason: "a test", issue: "STA-1", ...fields });

/** A policy file in the temp folder, from a YAML text. */
function policyFile(name, yaml) {
  const file = join(root, name);
  writeFileSync(file, yaml);
  return file;
}
const TEST_PRIVATE_FILE = policyFile(
  "test.private.yaml",
  `deny:\n${TEST_DENY.map((d) => `  - { sha256: "${d.sha256}", length: ${d.length}, reason: "${d.reason}" }`).join("\n")}\n`,
);

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

test("guard-public-content: no public file holds a denied term or its hash; the public policy refuses deny", () => {
  // A hash of a short name is recovered by hashing guesses: publishing it publishes the name (STA-2911).
  const source = readFileSync(TOOL, "utf8");
  assert.deepEqual(source.match(/\b[0-9a-f]{64}\b/g) ?? [], []);
  assert.ok(!source.includes("zorblax"));
  for (const line of read("tools/scripts/public-content.policy.yaml").split("\n"))
    if (/\b[0-9a-f]{64}\b/.test(line)) assert.match(line, /^\s+lineSha256: "[0-9a-f]{64}"$/, line);
  assert.deepEqual(EMPTY_POLICY.deny.size, 0);
  assert.match(
    parsePolicy({ deny: TEST_DENY, allow: [] }).errors.join("\n"),
    /^deny: denied terms go in the private policy/,
  );
});

test("guard-public-content: the private policy is the deny list and the public policy the allow list", () => {
  const pub = policyFile(
    "pub.policy.yaml",
    'allow:\n  - { path: "x/**", reason: "a test", issue: "STA-1" }\n',
  );
  const both = readPolicy(pub, TEST_PRIVATE_FILE);
  assert.deepEqual(both.errors, []);
  assert.equal(both.hasPrivate, true);
  assert.deepEqual(
    [...both.policy.deny.keys()],
    TEST_DENY.map((d) => d.sha256),
  );
  assert.deepEqual(
    both.policy.allow.map((a) => a.path),
    ["x/**"],
  );
  assert.deepEqual(lineFindings("a zorblax line", both.policy.deny), ["a test product name"]);
  // Without a private policy nothing is denied, and the result says so.
  const alone = readPolicy(pub);
  assert.deepEqual(alone.errors, []);
  assert.equal(alone.hasPrivate, false);
  assert.equal(alone.policy.deny.size, 0);
  assert.deepEqual(lineFindings("a zorblax line", alone.policy.deny), []);
  // An empty document is an empty policy.
  assert.deepEqual(parsePolicy(null), { policy: { deny: new Map(), allow: [] }, errors: [] });
  assert.deepEqual(parsePrivatePolicy(null), { deny: new Map(), errors: [] });
});

test("guard-public-content: an invalid policy names each problem", () => {
  const { errors } = parsePolicy({
    deny: [],
    waive: [],
    allow: [
      { path: "a.md", package: "@acme/a", reason: "x", issue: "STA-1" },
      { reason: "x", issue: "STA-1" },
      { path: "dir/**", lineSha256: hashLine("x"), reason: "x", issue: "STA-1" },
      { path: "a.md", lineSha256: "nope", reason: "x", issue: "STA-1" },
      { package: "@acme/a" },
    ],
  });
  for (const expected of [
    "deny: denied terms go in the private policy",
    'policy: unknown key "waive" (one of allow)',
    "allow[0]: names exactly one of path and package",
    "allow[1]: names exactly one of path and package",
    "allow[2]: a line entry names one exact file",
    "allow[3]: lineSha256 is not a SHA-256",
    "allow[4]: needs a reason",
    "allow[4]: needs the issue that removes it",
  ])
    assert.ok(
      errors.some((problem) => problem.startsWith(expected)),
      `${expected}\n${errors.join("\n")}`,
    );
  const own = parsePrivatePolicy({
    allow: [],
    deny: [
      { sha256: "abc", length: 3, reason: "x" },
      { sha256: hashTerm("acme"), length: 0, reason: "" },
      { sha256: hashTerm("zorblax"), length: 7, reason: "a" },
      { sha256: hashTerm("zorblax"), length: 7, reason: "b" },
      { sha256: hashTerm("other"), length: 5, reason: "c", term: "other" },
    ],
  }).errors;
  for (const expected of [
    'private policy: unknown key "allow" (one of deny)',
    "deny[0]: sha256 is not a SHA-256",
    "deny[1]: length is the term's length",
    "deny[1]: needs a reason",
    "deny[3]: denies the same term twice",
    'deny[4]: unknown key "term"',
  ])
    assert.ok(
      own.some((problem) => problem.startsWith(expected)),
      `${expected}\n${own.join("\n")}`,
    );
  assert.deepEqual(parsePolicy([]).errors, ["the policy is not a mapping with an allow list"]);
  assert.deepEqual(parsePrivatePolicy([]).errors, [
    "the private policy is not a mapping with a deny list",
  ]);
  assert.deepEqual(parsePolicy({ allow: "a.md" }).errors, ["allow: a list of entries"]);
});

test("guard-public-content: a denied word is found whole and in any case, never inside another word", () => {
  assert.deepEqual(findings("Ported from Zorblax's console"), ["a test product name"]);
  assert.deepEqual(findings("ZORBLAX_API_KEY"), ["a test product name"]);
  assert.deepEqual(findings("@zorblax/ui and zorblax-web"), ["a test product name"]);
  assert.deepEqual(findings("zorblaxing and prezorblax are other words"), []);
});

test("guard-public-content: a denied host is found by each suffix, in a URL or a subdomain", () => {
  assert.deepEqual(findings("https://console-me.zeta.cloud/x"), ["a test host"]);
  assert.deepEqual(findings("ZETA.CLOUD"), ["a test host"]);
  assert.deepEqual(findings("zeta.clouds.net, zeta and cloud"), []);
  assert.deepEqual(findings("api.zorblax.example"), ["a test product name"]);
});

test("guard-public-content: a home folder with a real user name is found; placeholders are not", () => {
  const home = "a personal home folder (/Users/<name>/ or /home/<name>/)";
  assert.deepEqual(findings(`cd /Users/${PERSON}/Projects/stackra`), [home]);
  assert.deepEqual(findings(`cwd: "/home/${PERSON}/work"`), [home]);
  for (const line of [
    "/Users/me/Projects/stackra",
    "/home/runner/work/x",
    "/Users/<you>/x",
    "/home/node/app",
    "~/Projects/stackra",
    "https://example.com/home/jdoe/x", // a URL path is not a home folder
    "/tmp/Users/jdoe/x",
  ])
    assert.deepEqual(findings(line), [], line);
});

test("guard-public-content: a file's path is read as well as its text (line 0); binary text is not", () => {
  assert.deepEqual(scanText("apps/themes/zorblax.json", "{}", TEST), [
    { path: "apps/themes/zorblax.json", line: 0, reason: "a test product name" },
  ]);
  assert.deepEqual(scanText("a.md", "one\ntwo zorblax\n", TEST), [
    { path: "a.md", line: 2, reason: "a test product name" },
  ]);
  assert.deepEqual(scanText("font.woff2", "\u0000zorblax", TEST), []);
});

test("guard-public-content: an approval line that names a person is a finding, in a spec or anywhere", () => {
  const text =
    "- 2026-11-26 → Planned — Approved by zorblax (CTO) 2026-11-26\n**Approver**: CTO (zorblax)\n" +
    "the design zorblax approved by mail\n- 2026-11-27 → Planned — Approved by CTO 2026-11-27\n";
  assert.deepEqual(
    scanText(".agents/specs/sta-1-x/spec.md", text, TEST).map((f) => f.line),
    [1, 2, 3],
  );
  assert.deepEqual(
    scanText("docs/notes.md", text, TEST).map((f) => f.line),
    [1, 2, 3],
  );
});

test("guard-public-content: the role-only approval format passes this repository's policy", () => {
  const { policy, errors } = readPolicy();
  assert.deepEqual(errors, []);
  const spec = [
    "**Approver**: CTO",
    "**Approver**: leader (technical stop under the owner's delegation; change risk R2)",
    "- 2026-11-27 → Implementing — Approved by CTO 2026-11-27",
    "- 2026-11-27 → Planned — Approved by leader 2026-11-27",
  ].join("\n");
  assert.deepEqual(scanText(".agents/specs/sta-1-x/spec.md", spec, policy), []);
});

test("guard-public-content: a line entry exempts that exact line of that file only", () => {
  const named = "- 2026-11-26 → Planned — Approved by zorblax (CTO) 2026-11-26";
  const text = `${named}\n**Approver**: CTO (zorblax)\n`;
  const policy = policyWith([
    entry({ path: ".agents/specs/sta-1-x/spec.md", lineSha256: hashLine(named) }),
  ]);
  assert.deepEqual(
    scanText(".agents/specs/sta-1-x/spec.md", text, policy).map((f) => f.line),
    [2],
  );
  // The same line in another file, or the line changed, is still a finding.
  assert.deepEqual(
    scanText(".agents/specs/sta-2-y/spec.md", text, policy).map((f) => f.line),
    [1, 2],
  );
  assert.deepEqual(
    scanText(".agents/specs/sta-1-x/spec.md", `${named} \n`, policy).map((f) => f.line),
    [1],
  );
  // A line entry never exempts the file's path (line 0).
  const own = policyWith([entry({ path: "zorblax.md", lineSha256: hashLine(named) })]);
  assert.deepEqual(
    scanText("zorblax.md", named, own).map((f) => f.line),
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

test("guard-public-content: --hash prints a private deny entry, --hash-line a line entry", () => {
  const hash = spawnSync(process.execPath, [TOOL, "--hash", "Zorblax"], { encoding: "utf8" });
  assert.equal(hash.status, 0, hash.stderr);
  assert.deepEqual(JSON.parse(hash.stdout), {
    sha256: hashTerm("zorblax"),
    length: 7,
    reason: "…",
  });
  assert.equal(
    parsePrivatePolicy({ deny: [{ ...JSON.parse(hash.stdout), reason: "x" }] }).errors.length,
    0,
  );

  const file = join(root, "approval.md");
  writeFileSync(file, "one\nApproved by zorblax 2026-11-26\n");
  const out = spawnSync(process.execPath, [TOOL, "--hash-line", `${file}:2`], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
  const line = JSON.parse(out.stdout);
  assert.equal(line.path, file);
  assert.equal(line.lineSha256, hashLine("Approved by zorblax 2026-11-26"));
  assert.equal(spawnSync(process.execPath, [TOOL, "--hash-line", `${file}:9`]).status, 2);
  assert.equal(spawnSync(process.execPath, [TOOL, "--hash-line", file]).status, 2);
});

test("guard-public-content: the allow list exempts a folder or an exact path, never a sibling", () => {
  const policy = policyWith([entry({ path: "packages/x/**" }), entry({ path: "a/b.md" })]);
  assert.deepEqual(scanText("packages/x/src/zorblax.ts", "zorblax", policy), []);
  assert.deepEqual(scanText("a/b.md", "zorblax", policy), []);
  assert.equal(scanText("packages/xy/a.ts", "zorblax", policy).length, 1);
  assert.equal(scanText("a/b.mdx", "zorblax", policy).length, 1);
});

test("guard-public-content: this repository's policy is valid and every allow entry says why and which issue", () => {
  const { policy, errors } = readPolicy();
  assert.deepEqual(errors, []);
  assert.ok(policy.allow.length > 0);
  for (const allowed of policy.allow)
    assert.ok(
      allowed.reason.length > 0 && /^STA-\d+$/.test(allowed.issue),
      JSON.stringify(allowed),
    );
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
    // Sorted: `tar` adds a folder's entries in the file system's order, which differs between machines.
    scanTarball("dirty.tgz", bytes, TEST)
      .map(({ path, line }) => `${path}:${line}`)
      .sort(),
    [`dirty.tgz!package/${deep}:1`, "dirty.tgz!package/dist/index.mjs:1"].sort(),
  );
  assert.deepEqual(
    scanTarball("dirty.tgz", bytes, policyWith([entry({ package: "@acme/dirty" })])),
    [],
  );
  assert.equal(
    scanTarball("dirty.tgz", bytes, policyWith([entry({ package: "@acme/other" })])).length,
    2,
  );
  // A repository path entry never exempts a file inside a tarball.
  assert.equal(scanTarball("dirty.tgz", bytes, policyWith([entry({ path: "dist/**" })])).length, 2);
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
  assert.equal(spawnSync(process.execPath, [TOOL, "--files"]).status, 2);
  assert.equal(spawnSync(process.execPath, [TOOL, "--policy"]).status, 2);
  assert.equal(spawnSync(process.execPath, [TOOL, "--private-policy"]).status, 2);
  assert.equal(spawnSync(process.execPath, [TOOL, "--recommended"]).status, 2);
  assert.equal(spawnSync(process.execPath, [TOOL, "--nope"]).status, 2);
});

test("guard-public-content: the private policy denies its terms, by flag or by environment, in tarballs and --files", () => {
  const product = tarball("product", {
    "package.json": JSON.stringify({ name: "@acme/product", version: "1.0.0" }),
    "README.md": "Built for Zorblax.\n",
  });
  const env = { ...process.env, [PRIVATE_POLICY_ENV]: "" };
  // Without a private policy the term passes, and the guard says it was not checked.
  const unchecked = spawnSync(process.execPath, [TOOL, "--pack", product], {
    encoding: "utf8",
    env,
  });
  assert.equal(unchecked.status, 0);
  assert.match(unchecked.stderr, /no private policy .*denied terms are not checked/);
  assert.match(unchecked.stdout, /denied terms not checked/);
  const pack = spawnSync(
    process.execPath,
    [TOOL, "--private-policy", TEST_PRIVATE_FILE, "--pack", product],
    { encoding: "utf8", env },
  );
  assert.equal(pack.status, 1);
  assert.match(pack.stderr, /product\.tgz!package\/README\.md:1: a test product name/);
  assert.doesNotMatch(pack.stderr, /no private policy/);
  const fromEnv = spawnSync(process.execPath, [TOOL, "--pack", product], {
    encoding: "utf8",
    env: { ...process.env, [PRIVATE_POLICY_ENV]: TEST_PRIVATE_FILE },
  });
  assert.equal(fromEnv.status, 1);
  assert.match(fromEnv.stderr, /product\.tgz!package\/README\.md:1: a test product name/);

  const note = join(root, "note.md");
  writeFileSync(note, "ok\nsee zeta.cloud\n");
  const files = spawnSync(
    process.execPath,
    [TOOL, "--private-policy", TEST_PRIVATE_FILE, "--files", note, join(root, "gone.md")],
    { encoding: "utf8", env },
  );
  assert.equal(files.status, 1, files.stderr);
  assert.match(files.stderr, /note\.md:2: a test host/);
  assert.doesNotMatch(files.stderr, /gone\.md/); // a deleted file is not committed
  writeFileSync(note, "ok\n");
  assert.equal(
    spawnSync(process.execPath, [TOOL, "--private-policy", TEST_PRIVATE_FILE, "--files", note])
      .status,
    0,
  );
});

test("guard-public-content: an invalid policy stops every scan with exit 2 and names each problem", () => {
  const clean = tarball("clean2", {
    "package.json": JSON.stringify({ name: "@acme/clean2", version: "1.0.0" }),
  });
  const brokenPrivate = policyFile(
    "broken.private.yaml",
    "deny:\n  - { sha256: nope, length: 4 }\nallo: []\n",
  );
  const brokenPublic = policyFile("broken.policy.yaml", "deny: []\nallo: []\n");
  for (const args of [["--pack", clean], ["--files", brokenPrivate], []]) {
    const own = spawnSync(process.execPath, [TOOL, "--private-policy", brokenPrivate, ...args], {
      encoding: "utf8",
    });
    assert.equal(own.status, 2, args.join(" "));
    assert.match(own.stderr, /broken\.private\.yaml: private policy: unknown key "allo"/);
    assert.match(own.stderr, /deny\[0\]: sha256 is not a SHA-256/);
    assert.match(own.stderr, /deny\[0\]: needs a reason/);
    assert.match(own.stderr, /nothing was checked/);
    const pub = spawnSync(process.execPath, [TOOL, "--policy", brokenPublic, ...args], {
      encoding: "utf8",
    });
    assert.equal(pub.status, 2, args.join(" "));
    assert.match(pub.stderr, /broken\.policy\.yaml: deny: denied terms go in the private policy/);
    assert.match(pub.stderr, /broken\.policy\.yaml: policy: unknown key "allo"/);
  }
  // A private policy that is named but missing fails closed, by flag or by environment.
  const missing = join(root, "missing.yaml");
  for (const [args, env] of [
    [["--private-policy", missing, "--pack", clean], process.env],
    [["--pack", clean], { ...process.env, [PRIVATE_POLICY_ENV]: missing }],
  ]) {
    const out = spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8", env });
    assert.equal(out.status, 2);
    assert.match(out.stderr, /missing\.yaml: cannot read the private policy/);
  }
  const unreadable = spawnSync(process.execPath, [TOOL, "--policy", missing, "--pack", clean], {
    encoding: "utf8",
  });
  assert.equal(unreadable.status, 2);
  assert.match(unreadable.stderr, /cannot read the policy/);
});

test("guard-public-content: the guard runs in validate, before each commit and in both release pack steps", () => {
  const scripts = JSON.parse(read("package.json")).scripts;
  assert.equal(scripts["public-content"], "node tools/scripts/guard-public-content.mjs");
  assert.match(scripts.validate, /(^|&& )pnpm public-content( &&|$)/);
  assert.match(scripts.verify, /pnpm validate/);
  for (const hooks of ["lefthook.yml", ".flow/overrides/hooks/lefthook.yml.txt"])
    assert.match(
      read(hooks),
      /node tools\/scripts\/guard-public-content\.mjs --files \{staged_files\}/,
      hooks,
    );
  // The Quality Gate reads the private policy from sops once the owner turns it on, before `pnpm validate`.
  const ci = read(".github/workflows/ci.yml");
  const step = ci.indexOf("- name: Public-content private policy (sops)");
  assert.ok(step > 0 && step < ci.indexOf("run: pnpm validate"));
  assert.match(ci, /if: \$\{\{ vars\.PUBLIC_CONTENT_PRIVATE_POLICY == 'sops'/);
  assert.match(ci, /names: PUBLIC_CONTENT_PRIVATE_POLICY\n/);
  assert.match(ci, /PUBLIC_CONTENT_PRIVATE_POLICY_FILE=/);
  const release = read(".github/workflows/release.yml");
  assert.match(release, /pack-check: node tools\/scripts\/guard-public-content\.mjs --pack\n/);
  assert.match(
    release,
    /node tools\/scripts\/guard-public-content\.mjs --pack "\$\{tarballs\[@\]\}"/,
  );
});
