/**
 * Stackra file contract:
 * Purpose: hold `changeset-check.mjs` to its contract: a changed published member needs a changeset naming it (one
 *          for another member does not count), tests and the generated changelog do not count, private and ignored
 *          members never need one, an empty changeset waives only with a written reason, an unknown package or a
 *          broken front matter fails, the version branch is skipped, and a missing implicit base warns while a bad
 *          explicit base fails.
 * Boundary: builds throwaway git repositories under the OS temp directory; never reads or writes this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); ADR 0013 (Enforcement);
 *                     STA-2604.
 */
import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { check, countsAsChange, parseChangeset, run, workspaceDirs } from "../changeset-check.mjs";

const TOOL = fileURLToPath(new URL("../changeset-check.mjs", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "changeset-check-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const env = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@t",
  GIT_COMMITTER_NAME: "t",
};
Object.assign(env, {
  GIT_COMMITTER_EMAIL: "t@t",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
});
delete env.GITHUB_HEAD_REF;
const sh = (cwd, ...args) => {
  const r = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};
const put = (root, file, text) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};
const pkg = (name, extra = {}) => `${JSON.stringify({ name, version: "1.0.0", ...extra })}\n`;
const changeset = (names, body = "Changed.") =>
  `---\n${names.map((name) => `"${name}": patch\n`).join("")}---\n\n${body}\n`;

let count = 0;
/** A repository on main with two published members, a private app, an ignored and an excluded member; then a branch. */
function repo() {
  const root = join(scratch, `r${(count += 1)}`);
  mkdirSync(root);
  sh(root, "init", "-q", "-b", "main");
  put(
    root,
    "pnpm-workspace.yaml",
    'packages:\n  - apps/*\n  - "packages/*/*"\n  - "!packages/skip/*"\n',
  );
  put(
    root,
    ".changeset/config.json",
    JSON.stringify({ baseBranch: "main", ignore: ["@x/ignored"] }),
  );
  put(root, ".changeset/README.md", "# changesets\n");
  put(root, "packages/core/a/package.json", pkg("@x/a"));
  put(root, "packages/core/a/src/index.ts", "export const a = 1;\n");
  put(root, "packages/core/b/package.json", pkg("@x/b"));
  put(root, "packages/core/b/src/index.ts", "export const b = 1;\n");
  put(root, "packages/core/ignored/package.json", pkg("@x/ignored"));
  put(root, "packages/core/ignored/src/index.ts", "export const i = 1;\n");
  put(root, "packages/skip/s/package.json", pkg("@x/skip"));
  put(root, "packages/skip/s/index.ts", "export const s = 1;\n");
  put(root, "apps/web/package.json", pkg("@x/web", { private: true }));
  put(root, "apps/web/src/main.ts", "export {};\n");
  sh(root, "add", "-A");
  sh(root, "commit", "-q", "-m", "base");
  sh(root, "checkout", "-q", "-b", "feature/x");
  return root;
}
const commit = (root) => {
  sh(root, "add", "-A");
  sh(root, "commit", "-q", "-m", "change");
};
function runIn(root, opts = {}) {
  const out = [];
  const err = [];
  const code = run(root, { log: (s) => out.push(s), warn: (s) => err.push(s), ...opts });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

describe("parseChangeset", () => {
  test("reads quoted and bare names with their bump", () => {
    assert.deepEqual(
      parseChangeset("---\n\"@x/a\": minor\n'@x/b': patch\n@x/c: none\n---\n\nNote.\n"),
      {
        releases: [
          { name: "@x/a", type: "minor" },
          { name: "@x/b", type: "patch" },
          { name: "@x/c", type: "none" },
        ],
        summary: "Note.",
      },
    );
  });
  test("an empty front matter keeps its reason", () => {
    assert.deepEqual(parseChangeset("---\n---\n\nDocs only.\n"), {
      releases: [],
      summary: "Docs only.",
    });
  });
  test("refuses a missing or unclosed front matter and an unknown bump", () => {
    assert.match(parseChangeset("no front matter").error, /does not open/);
    assert.match(parseChangeset('---\n"@x/a": patch\n').error, /not closed/);
    assert.match(parseChangeset('---\n"@x/a": huge\n---\n').error, /unreadable/);
  });
});

describe("countsAsChange", () => {
  test("tests, fixtures and the generated changelog do not count", () => {
    const skipped = [
      "src/__tests__/a.test.ts",
      "src/a.spec.tsx",
      "__fixtures__/x.json",
      "test/x.ts",
      "CHANGELOG.md",
    ];
    for (const rel of skipped) assert.equal(countsAsChange(rel, undefined), false, rel);
    for (const rel of ["src/index.ts", "package.json", "README.md", "src/testing/index.ts"]) {
      assert.equal(countsAsChange(rel, undefined), true, rel);
    }
  });
  test("changedFilePatterns narrows what counts", () => {
    assert.equal(countsAsChange("README.md", ["src/**"]), false);
    assert.equal(countsAsChange("src/index.ts", ["src/**"]), true);
  });
});

describe("check", () => {
  const members = [
    { name: "@x/a", dir: "packages/core/a" },
    { name: "@x/ab", dir: "packages/core/a/b" },
  ];
  test("a file belongs to the deepest member that holds it", () => {
    const r = check({ changed: ["packages/core/a/b/src/x.ts"], members, changesets: [] });
    assert.deepEqual(r.missing, [{ name: "@x/ab", files: ["packages/core/a/b/src/x.ts"] }]);
  });
  test("files outside every member need nothing", () => {
    assert.equal(
      check({ changed: ["docs/x.md", "packages/core/ax/y.ts"], members, changesets: [] }).ok,
      true,
    );
  });
});

describe("workspaceDirs", () => {
  test("expands * segments and drops ! exclusions and folders without a package.json", () => {
    const root = repo();
    mkdirSync(join(root, "packages/core/empty"));
    assert.deepEqual(workspaceDirs(root, ["apps/*", "packages/*/*", "!packages/skip/*"]), [
      "apps/web",
      "packages/core/a",
      "packages/core/b",
      "packages/core/ignored",
    ]);
  });
});

describe("run", () => {
  test("no change since the base passes", () => {
    const r = runIn(repo());
    assert.equal(r.code, 0);
    assert.match(r.out, /no published package changed/);
  });

  test("a changed published member with no changeset fails and names the file", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    commit(root);
    const r = runIn(root);
    assert.equal(r.code, 1);
    assert.match(
      r.err,
      /@x\/a changed \(packages\/core\/a\/src\/index\.ts\) and no changeset names it/,
    );
    assert.match(r.err, /pnpm changeset --empty/);
  });

  test("a changeset for another member does not cover it (changeset status would pass)", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    put(root, "packages/core/b/src/index.ts", "export const b = 2;\n");
    put(root, ".changeset/only-b.md", changeset(["@x/b"]));
    commit(root);
    const r = runIn(root);
    assert.equal(r.code, 1);
    assert.match(r.err, /@x\/a changed/);
    assert.doesNotMatch(r.err, /@x\/b changed/);
  });

  test("one changeset per changed member passes, uncommitted and untracked included", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    put(root, "packages/core/b/src/new.ts", "export const c = 1;\n");
    put(root, ".changeset/both.md", changeset(["@x/a", "@x/b"]));
    const r = runIn(root);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /2 changed package\(s\) covered/);
  });

  test("tests, the changelog, private apps, ignored and excluded members need no changeset", () => {
    const root = repo();
    put(root, "packages/core/a/src/__tests__/a.test.ts", "test;\n");
    put(root, "packages/core/a/CHANGELOG.md", "# a\n");
    put(root, "apps/web/src/main.ts", "export const x = 1;\n");
    put(root, "packages/core/ignored/src/index.ts", "export const i = 2;\n");
    put(root, "packages/skip/s/index.ts", "export const s = 2;\n");
    commit(root);
    const r = runIn(root);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /no published package changed/);
  });

  test("an empty changeset with a reason waives; without one it fails", () => {
    const root = repo();
    put(root, "packages/core/a/README.md", "# a\n");
    put(root, ".changeset/no-release.md", changeset([], "Docs only: the README wording."));
    commit(root);
    const waived = runIn(root);
    assert.equal(waived.code, 0, waived.err);
    assert.match(waived.out, /waived by \.changeset\/no-release\.md/);
    put(root, ".changeset/no-release.md", "---\n---\n");
    const bare = runIn(root);
    assert.equal(bare.code, 1);
    assert.match(bare.err, /names no package and gives no reason/);
  });

  test("a changeset naming an unknown or private package fails", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    put(root, ".changeset/typo.md", changeset(["@x/a", "@x/web", "@x/nope"]));
    const r = runIn(root);
    assert.equal(r.code, 1);
    assert.match(r.err, /@x\/web is not a published workspace member/);
    assert.match(r.err, /@x\/nope is not a published workspace member/);
  });

  test("a changeset the branch deletes does not count", () => {
    const root = repo();
    sh(root, "checkout", "-q", "main");
    put(root, ".changeset/old.md", changeset(["@x/a"]));
    commit(root);
    sh(root, "checkout", "-q", "-B", "feature/x");
    rmSync(join(root, ".changeset/old.md"));
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    assert.equal(runIn(root).code, 1);
  });

  test("the changesets version branch is skipped, by branch or by GITHUB_HEAD_REF", () => {
    const root = repo();
    put(root, "packages/core/a/package.json", pkg("@x/a", { version: "1.0.1" }));
    commit(root);
    assert.equal(runIn(root).code, 1);
    assert.equal(runIn(root, { headRef: "changeset-release/main" }).code, 0);
    sh(root, "checkout", "-q", "-b", "changeset-release/main");
    const r = runIn(root);
    assert.equal(r.code, 0);
    assert.match(r.out, /version branch; skipped/);
  });

  test("an explicit base is honoured and a bad one fails with 2", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    commit(root);
    assert.equal(runIn(root, { base: "HEAD" }).code, 0);
    assert.equal(runIn(root, { base: "HEAD~1" }).code, 1);
    const bad = runIn(root, { base: "no-such-ref" });
    assert.equal(bad.code, 2);
    assert.match(bad.err, /does not resolve/);
  });

  test("with no base branch in the checkout it warns and passes", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    commit(root);
    sh(root, "branch", "-D", "main");
    const r = runIn(root);
    assert.equal(r.code, 0);
    assert.match(r.err, /skipped, neither origin\/main nor main exists/);
  });

  test("the CLI exits 1 on a missing changeset, 0 against its own HEAD and 2 on an unknown flag", () => {
    const root = repo();
    put(root, "packages/core/b/src/index.ts", "export const b = 2;\n");
    commit(root);
    const cli = (...args) =>
      spawnSync(process.execPath, [TOOL, ...args], { cwd: root, env, encoding: "utf8" });
    const missing = cli();
    assert.equal(missing.status, 1, missing.stderr);
    assert.match(missing.stderr, /@x\/b changed/);
    assert.equal(cli("--base", "HEAD").status, 0);
    assert.equal(cli("--nope").status, 2);
  });
});
