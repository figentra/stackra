/**
 * Stackra file contract:
 * Purpose: hold `changeset-check.mjs` to its contract: a changed published member needs a changeset naming it (one
 *          for another member does not count), tests and the generated changelog do not count (a `test/`, `tests/`
 *          or `e2e/` tier only at the member root, so published `src/e2e/` source still counts), private and ignored
 *          members never need one, an empty changeset waives only with a written reason and only when no other
 *          changeset names a package, a catalog bump touches the published members that ship the entry, an unknown
 *          package or a broken front matter fails, only `changeset-release/<baseBranch>` from this repository is
 *          skipped, and a missing implicit base warns while a bad explicit base fails.
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
import {
  catalogTouches,
  changedCatalogEntries,
  check,
  countsAsChange,
  parseChangeset,
  pullRequestRepos,
  run,
  workspaceDirs,
} from "../changeset-check.mjs";

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
delete env.GITHUB_EVENT_PATH;
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

/** A pull_request event payload whose head repository is `head`. */
const prEvent = (head) =>
  JSON.stringify({
    pull_request: {
      head: { repo: { full_name: head } },
      base: { repo: { full_name: "stackra-inc/stackra" } },
    },
  });

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
      "tests/x.ts",
      "e2e/x.spec.ts",
      "e2e/helpers/login.ts",
      "src/e2e/__fixtures__/page.html",
      "CHANGELOG.md",
    ];
    for (const rel of skipped) assert.equal(countsAsChange(rel, undefined), false, rel);
    for (const rel of ["src/index.ts", "package.json", "README.md", "src/testing/index.ts"]) {
      assert.equal(countsAsChange(rel, undefined), true, rel);
    }
  });
  test("a test, tests or e2e folder below the member root is published source and counts", () => {
    for (const rel of [
      "src/e2e/api-calls/api-calls.function.ts",
      "src/e2e/index.ts",
      "src/test/setup.ts",
      "src/tests/helpers.ts",
      "lib/e2e/preset.js",
    ]) {
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

describe("changedCatalogEntries and catalogTouches", () => {
  const was = {
    catalog: { zod: "4.0.0", yaml: "2.0.0" },
    catalogs: { react: { react: "19.0.0" }, gone: { old: "1.0.0" } },
  };
  const now = {
    catalog: { zod: "4.1.0", yaml: "2.0.0", added: "1.0.0" },
    catalogs: { react: { react: "19.0.0" }, default: { undici: "8.0.0" } },
  };

  test("names the entries whose version changed, was added or was removed, per catalog", () => {
    const changed = changedCatalogEntries(was, now);
    assert.deepEqual(Object.fromEntries([...changed].map(([k, v]) => [k, [...v].toSorted()])), {
      default: ["added", "undici", "zod"],
      gone: ["old"],
    });
    assert.equal(changedCatalogEntries(was, was).size, 0);
    assert.equal(changedCatalogEntries(undefined, null).size, 0);
  });

  test("a member that ships the entry is touched; a devDependency or another catalog is not", () => {
    const changed = changedCatalogEntries(was, now);
    const members = [
      { name: "@x/dep", manifest: { dependencies: { zod: "catalog:" } } },
      { name: "@x/peer", manifest: { peerDependencies: { undici: "catalog:default" } } },
      {
        name: "@x/opt",
        manifest: { optionalDependencies: { zod: "catalog:", added: "catalog:" } },
      },
      { name: "@x/dev", manifest: { devDependencies: { zod: "catalog:" } } },
      {
        name: "@x/react",
        manifest: { dependencies: { react: "catalog:react", yaml: "catalog:" } },
      },
      { name: "@x/literal", manifest: { dependencies: { zod: "^4.0.0" } } },
      { name: "@x/none" },
    ];
    assert.deepEqual(Object.fromEntries(catalogTouches(members, changed)), {
      "@x/dep": ["pnpm-workspace.yaml (catalog default: zod)"],
      "@x/peer": ["pnpm-workspace.yaml (catalog default: undici)"],
      "@x/opt": [
        "pnpm-workspace.yaml (catalog default: added)",
        "pnpm-workspace.yaml (catalog default: zod)",
      ],
    });
  });

  test("check reports a catalog-touched member with no changeset and covers a named one", () => {
    const members = [{ name: "@x/a", dir: "packages/core/a" }];
    const catalogTouched = new Map([["@x/a", ["pnpm-workspace.yaml (catalog default: zod)"]]]);
    const bare = check({
      changed: ["pnpm-workspace.yaml"],
      members,
      changesets: [],
      catalogTouched,
    });
    assert.equal(bare.ok, false);
    assert.deepEqual(bare.missing, [
      { name: "@x/a", files: ["pnpm-workspace.yaml (catalog default: zod)"] },
    ]);
    const named = check({
      changed: ["pnpm-workspace.yaml"],
      members,
      changesets: [{ file: ".changeset/z.md", text: changeset(["@x/a"]) }],
      catalogTouched,
    });
    assert.equal(named.ok, true);
  });
});

describe("pullRequestRepos", () => {
  test("reads the head and base repositories of a pull request event, nothing otherwise", () => {
    const dir = mkdtempSync(join(scratch, "event-"));
    const event = join(dir, "event.json");
    writeFileSync(event, prEvent("fork/stackra"));
    assert.deepEqual(pullRequestRepos(event), {
      headRepo: "fork/stackra",
      baseRepo: "stackra-inc/stackra",
    });
    writeFileSync(event, JSON.stringify({ push: {} }));
    assert.equal(pullRequestRepos(event), undefined);
    writeFileSync(event, "not json");
    assert.equal(pullRequestRepos(event), undefined);
    assert.equal(pullRequestRepos(join(dir, "missing.json")), undefined);
    assert.equal(pullRequestRepos(undefined), undefined);
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

  test("a published src/e2e change needs a changeset; a member-root e2e tier does not", () => {
    const root = repo();
    put(root, "packages/core/a/e2e/a.spec.ts", "test;\n");
    put(root, "packages/core/a/e2e/helpers/login.ts", "export {};\n");
    commit(root);
    const tier = runIn(root);
    assert.equal(tier.code, 0, tier.err);
    assert.match(tier.out, /no published package changed/);
    put(root, "packages/core/a/src/e2e/login-as.function.ts", "export const loginAs = 1;\n");
    commit(root);
    const source = runIn(root);
    assert.equal(source.code, 1);
    assert.match(
      source.err,
      /@x\/a changed \(packages\/core\/a\/src\/e2e\/login-as\.function\.ts\) and no changeset names it/,
    );
    put(root, ".changeset/e2e.md", changeset(["@x/a"]));
    assert.equal(runIn(root).code, 0);
  });

  test("an empty changeset with a reason waives; without one it fails", () => {
    const root = repo();
    put(root, "packages/core/a/README.md", "# a\n");
    put(root, ".changeset/no-release.md", changeset([], "Docs only: the README wording."));
    commit(root);
    const waived = runIn(root);
    assert.equal(waived.code, 0, waived.err);
    assert.match(
      waived.out,
      /1 changed package\(s\) waived by \.changeset\/no-release\.md: @x\/a$/,
    );
    put(root, ".changeset/no-release.md", "---\n---\n");
    const bare = runIn(root);
    assert.equal(bare.code, 1);
    assert.match(bare.err, /names no package and gives no reason/);
  });

  test("an empty changeset beside one that names packages waives nothing; `none` covers the rest", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    put(root, "packages/core/b/README.md", "# b\n");
    put(root, ".changeset/a.md", changeset(["@x/a"]));
    put(root, ".changeset/no-release.md", changeset([], "b's README wording only."));
    commit(root);
    const r = runIn(root);
    assert.equal(r.code, 1);
    assert.match(
      r.err,
      /@x\/b changed \(packages\/core\/b\/README\.md\) and no changeset names it/,
    );
    assert.doesNotMatch(r.err, /@x\/a changed/);
    assert.match(r.err, /no-release\.md waives nothing beside a changeset that names packages/);
    assert.match(r.err, /"<package>": none/);
    put(root, ".changeset/no-release.md", '---\n"@x/b": none\n---\n\nb\'s README wording only.\n');
    const fixed = runIn(root);
    assert.equal(fixed.code, 0, fixed.err);
    assert.match(fixed.out, /2 changed package\(s\) covered/);
  });

  test("a catalog bump needs a changeset for each published member that ships the entry", () => {
    const root = repo();
    sh(root, "checkout", "-q", "main");
    put(
      root,
      "pnpm-workspace.yaml",
      'packages:\n  - apps/*\n  - "packages/*/*"\n  - "!packages/skip/*"\ncatalog:\n  zod: 4.0.0\n  vitest: 4.0.0\n',
    );
    put(
      root,
      "packages/core/a/package.json",
      pkg("@x/a", { dependencies: { zod: "catalog:" }, devDependencies: { vitest: "catalog:" } }),
    );
    put(
      root,
      "packages/core/b/package.json",
      pkg("@x/b", { devDependencies: { zod: "catalog:" } }),
    );
    put(
      root,
      "apps/web/package.json",
      pkg("@x/web", { private: true, dependencies: { zod: "catalog:" } }),
    );
    commit(root);
    sh(root, "checkout", "-q", "-B", "feature/x");
    put(
      root,
      "pnpm-workspace.yaml",
      'packages:\n  - apps/*\n  - "packages/*/*"\n  - "!packages/skip/*"\ncatalog:\n  zod: 4.0.0\n  vitest: 4.1.0\n',
    );
    commit(root);
    const devOnly = runIn(root);
    assert.equal(devOnly.code, 0, devOnly.err);
    assert.match(devOnly.out, /no published package changed/);
    put(
      root,
      "pnpm-workspace.yaml",
      'packages:\n  - apps/*\n  - "packages/*/*"\n  - "!packages/skip/*"\ncatalog:\n  zod: 4.1.0\n  vitest: 4.1.0\n',
    );
    commit(root);
    const shipped = runIn(root);
    assert.equal(shipped.code, 1);
    assert.match(
      shipped.err,
      /@x\/a changed \(pnpm-workspace\.yaml \(catalog default: zod\)\) and no changeset names it/,
    );
    assert.doesNotMatch(shipped.err, /@x\/b changed|@x\/web changed/);
    put(root, ".changeset/zod.md", changeset(["@x/a"]));
    const covered = runIn(root);
    assert.equal(covered.code, 0, covered.err);
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
    const same = { headRepo: "stackra-inc/stackra", baseRepo: "stackra-inc/stackra" };
    assert.equal(runIn(root, { headRef: "changeset-release/main", pullRequest: same }).code, 0);
    sh(root, "checkout", "-q", "-b", "changeset-release/main");
    const r = runIn(root);
    assert.equal(r.code, 0);
    assert.match(r.out, /version branch; skipped/);
  });

  test("only changeset-release/<baseBranch> from this repository is skipped", () => {
    const root = repo();
    put(root, "packages/core/a/src/index.ts", "export const a = 2;\n");
    commit(root);
    for (const headRef of [
      "changeset-release/other",
      "changeset-release/main-x",
      "changeset-release",
    ])
      assert.equal(runIn(root, { headRef }).code, 1, headRef);
    const fork = runIn(root, {
      headRef: "changeset-release/main",
      pullRequest: { headRepo: "someone/stackra", baseRepo: "stackra-inc/stackra" },
    });
    assert.equal(fork.code, 1);
    assert.match(fork.err, /comes from someone\/stackra, not stackra-inc\/stackra; checked/);
    assert.match(fork.err, /@x\/a changed/);
    const gone = runIn(root, {
      headRef: "changeset-release/main",
      pullRequest: { baseRepo: "stackra-inc/stackra" },
    });
    assert.equal(gone.code, 1);
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
    const event = join(root, "..", `event-${count}.json`);
    const release = (head) => {
      writeFileSync(event, prEvent(head));
      return spawnSync(process.execPath, [TOOL], {
        cwd: root,
        env: { ...env, GITHUB_HEAD_REF: "changeset-release/main", GITHUB_EVENT_PATH: event },
        encoding: "utf8",
      });
    };
    assert.equal(release("stackra-inc/stackra").status, 0);
    assert.equal(release("someone/stackra").status, 1);
  });
});
