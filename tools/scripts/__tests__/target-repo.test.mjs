/**
 * Stackra file contract:
 * Purpose: hold `target-repo.mjs` to its contract: it names the repository (`owner/name`) a bot gh or git command
 *          acts on, from -R/--repo, GH_REPO, an `api repos/` path, the remote a push or fetch names, or origin, so
 *          bot-token.mjs can mint for the installation that covers it (STA-2861).
 * Boundary: a mocked git; no network, no secret.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). STA-2861.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { repoOf, targetRepo } from "../target-repo.mjs";

/** A git that knows `remotes` (name → URL) and records every call. */
const fakeGit =
  (remotes, calls = []) =>
  (cmd, argv) => {
    calls.push([cmd, ...argv]);
    const name = argv[argv.indexOf("get-url") + 1];
    return Object.hasOwn(remotes, name)
      ? { status: 0, stdout: `${remotes[name]}\n` }
      : { status: 2, stdout: "" };
  };
const noGit = () => assert.fail("git must not be asked");
const noEnv = {};

test("repoOf reads every GitHub remote form and refuses anything else", () => {
  for (const url of [
    "https://github.com/stackra-inc/stackra.git",
    "https://github.com/stackra-inc/stackra",
    "https://github.com/stackra-inc/stackra/",
    "https://x-access-token@github.com/stackra-inc/stackra.git",
    "git@github.com:stackra-inc/stackra.git",
    "ssh://git@github.com/stackra-inc/stackra.git",
    "github.com/stackra-inc/stackra",
    "stackra-inc/stackra",
  ])
    assert.equal(repoOf(url), "stackra-inc/stackra", url);
  for (const bad of [
    "origin",
    "",
    "https://gitlab.com/a/b.git",
    "a/b/c",
    "/work/x",
    undefined,
    null,
  ])
    assert.equal(repoOf(bad), null, String(bad));
});

test("gh: -R, --repo, --repo= and -R<x> name the repository before anything else", () => {
  const env = { GH_REPO: "figentra/figentra" };
  const at = (args) => targetRepo("gh", args, { run: noGit, env });
  assert.equal(
    at(["pr", "create", "-R", "stackra-inc/stackra-template"]),
    "stackra-inc/stackra-template",
  );
  assert.equal(at(["pr", "view", "1", "--repo", "stackra-inc/stackra"]), "stackra-inc/stackra");
  assert.equal(at(["pr", "list", "--repo=stackra-inc/stackra-pro"]), "stackra-inc/stackra-pro");
  assert.equal(at(["pr", "list", "-Rstackra-inc/stackra"]), "stackra-inc/stackra");
  assert.equal(at(["pr", "list", "-R", "not a repo"]), null);
});

test("gh: GH_REPO, then an api repos/ path, then the working directory's origin", () => {
  assert.equal(
    targetRepo("gh", ["pr", "list"], { run: noGit, env: { GH_REPO: "stackra-inc/stackra" } }),
    "stackra-inc/stackra",
  );
  assert.equal(
    targetRepo("gh", ["api", "repos/stackra-inc/stackra/pulls/3"], { run: noGit, env: noEnv }),
    "stackra-inc/stackra",
  );
  assert.equal(
    targetRepo("gh", ["api", "-X", "GET", "/repos/figentra/infra/issues?state=open"], {
      run: noGit,
      env: noEnv,
    }),
    "figentra/infra",
  );
  const origin = fakeGit({ origin: "https://github.com/stackra-inc/stackra.git" });
  // gh's own `{owner}/{repo}` placeholder is not a repository: origin decides, as gh does.
  assert.equal(
    targetRepo("gh", ["api", "repos/{owner}/{repo}/contents/x"], { run: origin, env: noEnv }),
    "stackra-inc/stackra",
  );
  assert.equal(
    targetRepo("gh", ["pr", "list"], { run: origin, env: noEnv }),
    "stackra-inc/stackra",
  );
  assert.equal(targetRepo("gh", [], { run: origin, env: noEnv }), "stackra-inc/stackra");
  assert.equal(targetRepo("gh", ["pr", "list"], { run: fakeGit({}), env: noEnv }), null);
});

test("git: the remote a push or fetch names, a URL given directly, -C dirs kept, default origin", () => {
  const calls = [];
  const git = fakeGit(
    {
      origin: "git@github.com:stackra-inc/stackra.git",
      up: "https://github.com/figentra/figentra.git",
    },
    calls,
  );
  const at = (args) => targetRepo("git", args, { run: git, env: noEnv });
  assert.equal(at(["push", "--force-with-lease", "origin", "HEAD"]), "stackra-inc/stackra");
  assert.equal(at(["push"]), "stackra-inc/stackra");
  assert.equal(at(["fetch", "-q", "up", "main"]), "figentra/figentra");
  assert.equal(at(["ls-remote", "up"]), "figentra/figentra");
  assert.equal(at(["push", "https://github.com/figentra/infra.git", "x"]), "figentra/infra");
  assert.equal(at(["-C", "/w", "push", "origin", "b"]), "stackra-inc/stackra");
  assert.deepEqual(calls.at(-1), ["git", "-C", "/w", "remote", "get-url", "origin"]);
  assert.equal(at(["commit", "-m", "up"]), "stackra-inc/stackra");
  assert.equal(at(["push", "nowhere"]), null);
});
