/**
 * Stackra file contract:
 * Purpose: hold `bot-gh.mjs` to its contract: the commands that would print or store the token are refused, merges go
 *          only through `pnpm pr:merge`, the reviewer identity only reads and comments, git runs as the bot with a
 *          token-free credential setup, and gh reads retry on transient errors.
 * Boundary: pure functions plus child processes against a fake `gh` in a temp directory; no network, no token.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy). ADR 0230 (reviewer
 *                     identity).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BOT_EMAIL, gitBotArgs, leaksToken, mergesPr, reviewerAllows } from "../bot-gh.mjs";
import { fakeGh } from "./__fixtures__/fake-gh.mjs";

test("STA-214: credential helpers leak too; merges go only through pnpm pr:merge", () => {
  assert.equal(leaksToken("git", ["credential-osxkeychain", "get"]), true);
  assert.equal(leaksToken("git", ["--git-dir", "x", "credential", "approve"]), true);
  assert.equal(leaksToken("git", ["config", "credential.helper"]), false);
  for (const args of [
    ["pr", "merge", "12", "--squash"],
    ["pr", "-R", "figentra/os", "merge", "3"],
    ["api", "-X", "PUT", "repos/figentra/stackra/pulls/12/merge"],
    ["api", "--method=put", "/repos/figentra/os/pulls/3/merge"],
    ["api", "-XPUT", "repos/x/y/pulls/1/merge", "-f", "merge_method=squash"],
    ["api", "graphql", "-f", "query=mutation { mergePullRequest(input: {}) { clientMutationId } }"],
    ["api", "graphql", "-f", "query=mutation { enablePullRequestAutoMerge(input: {}) { x } }"],
    ["api", "graphql", "-f", "query=mutation { enqueuePullRequest(input: {}) { x } }"],
    // ADR 0293: branch merges, commits on a branch and ref moves skip pr:merge too
    ["api", "-X", "POST", "repos/figentra/stackra/merges", "-f", "base=main", "-f", "head=x"],
    ["api", "graphql", "-f", "query=mutation { mergeBranch(input: {}) { clientMutationId } }"],
    ["api", "graphql", "-f", "query=mutation { createCommitOnBranch(input: {}) { x } }"],
    ["api", "graphql", "-f", "query=mutation { updateRefs(input: {}) { x } }"],
    ["api", "graphql", "-f", "query=mutation { deleteRef(input: {}) { x } }"],
  ])
    assert.equal(mergesPr(args), true, args.join(" "));
  for (const args of [
    ["pr", "view", "12", "--json", "mergeable"],
    ["pr", "list", "--search", "merge"],
    ["api", "repos/x/y/pulls/12/files"],
  ])
    assert.equal(mergesPr(args), false, args.join(" "));
});

test("STA-208: the wrappers refuse commands that print or store the token", () => {
  for (const [tool, args] of [
    ["gh", ["auth", "token"]],
    ["gh", ["auth", "status", "--show-token"]],
    ["review", ["auth", "login", "--with-token"]],
    ["git", ["credential", "fill"]],
    ["git", ["-C", "../os", "-c", "x=y", "credential", "fill"]],
  ])
    assert.equal(leaksToken(tool, args), true, args.join(" "));
  for (const [tool, args] of [
    ["gh", ["pr", "view", "1"]],
    ["gh", ["api", "repos/x/auth"]],
    ["git", ["-C", "credential", "fetch"]],
    ["git", ["push", "origin", "HEAD"]],
  ])
    assert.equal(leaksToken(tool, args), false, args.join(" "));
});

test("the reviewer identity may only read a PR and comment or review on it", () => {
  const allowed = [
    ["pr", "comment", "5"],
    ["pr", "review", "5", "--approve"],
    ["pr", "diff", "5"],
    ["api", "repos/x/y/pulls/5"],
    ["api", "-i", "/installation/repositories", "--jq", ".repositories[].full_name"],
  ];
  for (const args of allowed) assert.ok(reviewerAllows(args), args.join(" "));
  const denied = [
    ["pr", "merge", "5"],
    ["pr", "edit", "5"],
    ["api", "-X", "PATCH", "repos/x/y"],
    ["api", "--method=POST", "x"],
    ["api", "-XPOST", "x"],
    ["api", "repos/x/y/issues/5/comments", "-f", "body=hi"],
    ["api", "graphql", "-Fquery=mutation"],
    ["api", "repos/x/y", "--raw-field=a=b"],
    ["api", "repos/x/y", "--input", "f.json"],
    ["api", "-iX", "DELETE", "repos/x/y/issues/comments/1"],
    ["api", "-if", "query=mutation{x}", "graphql"],
    ["api", "repos/x/y", "-iF", "body=@f"],
    ["api", "repos/x/y", "--field=a=b"],
    ["pr", "comment", "5", "--edit-last"],
    ["pr", "comment", "5", "--delete-last"],
    ["repo", "edit"],
  ];
  for (const args of denied) assert.ok(!reviewerAllows(args), args.join(" "));
});

test("git runs as the bot with a token-free, non-persisted credential setup", () => {
  const args = gitBotArgs();
  assert.ok(
    args.every((arg, i) => i % 2 === 1 || arg === "-c"),
    "only -c options",
  );
  assert.ok(args.includes(`user.email=${BOT_EMAIL}`));
  assert.match(BOT_EMAIL, /^\d+\+stackra-bot\[bot\]@users\.noreply\.github\.com$/);
  // The helper list is reset before the gh helper is added.
  assert.ok(
    args.indexOf("credential.helper=") < args.indexOf("credential.helper=!gh auth git-credential"),
  );
  assert.ok(!args.some((arg) => /ghs_|x-access-token/.test(arg)));
});

test("STA-330 review: bot git never runs the repository's hooks, which would see every /agents value", () => {
  const repo = mkdtempSync(join(tmpdir(), "bot-git-hooks-"));
  const git = (...a) => spawnSync("git", a, { cwd: repo, encoding: "utf8" });
  git("init", "-q");
  const marker = join(repo, "hook-ran");
  // lefthook installs here; a worktree's lefthook.yml decides what it runs, so an agent can edit it
  writeFileSync(join(repo, ".git", "hooks", "pre-commit"), `#!/bin/sh\ntouch '${marker}'\n`);
  chmodSync(join(repo, ".git", "hooks", "pre-commit"), 0o755);
  const r = git(...gitBotArgs(), "commit", "-q", "--allow-empty", "-m", "x");
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!existsSync(marker), "the pre-commit hook ran as the bot");
  rmSync(repo, { recursive: true, force: true });
});

test("STA-216: aliases, file-sourced GraphQL and encoded merge paths are refused", async () => {
  const { unsafeArgs } = await import("../bot-gh.mjs");
  for (const [tool, args] of [
    ["git", ["-c", "alias.x=credential", "x", "fill"]],
    ["git", ["-calias.p=push", "p"]],
    ["git", ["-c", "include.path=/tmp/x", "status"]],
    ["git", ["--config-env=alias.x=V", "x"]],
    ["gh", ["alias", "set", "x", "pr merge"]],
    // STA-330 review: the real arguments, after the shell expanded `$(printf owner-approved)` or "a, b"
    ["gh", ["pr", "edit", "113", "--add-label", "design, owner-approved"]],
    ["gh", ["-R", "figentra/stackra", "pr", "create", "-l", "design", "-l", "OWNER-APPROVED"]],
    ["gh", ["issue", "edit", "4", "--add-label=owner-approved"]],
    ["gh", ["label", "edit", "design", "--name", "owner-approved"]],
    ["gh", ["api", "repos/x/y/issues/4/labels", "-f", "labels[]=owner-approved"]],
    ["gh", ["api", "graphql", "-F", "query=@q.graphql"]],
    ["gh", ["api", "-X", "POST", "graphql", "--input", "q.json"]],
    ["gh", ["api", "graphql", "-f", "query=@q.graphql"]],
  ])
    assert.ok(unsafeArgs(tool, args), `${tool} ${args.join(" ")}`);
  for (const [tool, args] of [
    ["git", ["-c", "user.name=x", "status"]],
    ["gh", ["api", "graphql", "-f", "query=query { viewer { login } }"]],
    ["gh", ["pr", "create", "--body", "alias set"]],
    ["gh", ["pr", "create", "--title", "the owner-approved label", "--body", "owner-approved"]],
    ["gh", ["pr", "list", "--label", "owner-approved"]],
    ["gh", ["api", "repos/x/y/issues/4/comments", "-f", "body=the owner-approved label"]],
  ])
    assert.equal(unsafeArgs(tool, args), null, `${tool} ${args.join(" ")}`);
  for (const path of [
    "repos/x/y/pulls/12//merge",
    "repos/x/y/pulls%2F12%2Fmerge",
    "repos/x/y/pulls/12%2fmerge",
  ])
    assert.equal(mergesPr(["api", "-X", "PUT", path]), true, path);
});

test("STA-216 review: git config writes, risky -c keys and normalised merge paths", async () => {
  const { unsafeArgs } = await import("../bot-gh.mjs");
  for (const args of [
    ["config", "--global", "alias.x", "credential fill"],
    ["config", "--file", "f", "includeIf.gitdir:/.path", "x"],
    ["-c", "core.fsmonitor=x", "status"],
    ["-c", "core.sshCommand=x", "fetch"],
    ["-c", "core.pager=x", "log"],
    ["-c", "core.editor=x", "commit"],
    ["-c", "credential.helper=x", "status"],
    ["-ccore.pager=x", "log"],
  ])
    assert.ok(unsafeArgs("git", args), args.join(" "));
  for (const args of [
    ["config", "--get", "user.name"],
    ["-c", "user.name=x", "status"],
  ])
    assert.equal(unsafeArgs("git", args), null, args.join(" "));
  for (const path of [
    "repos/x/y/pulls/12/%6derge",
    "repos/x/y/pulls/12/./merge",
    "repos/x/y/pulls/4/../5/merge",
    "repos/x/y/pulls/12/%252e/merge",
    "repos/x/y/pulls//12///merge",
  ])
    assert.equal(mergesPr(["api", "-X", "PUT", path]), true, path);
  assert.equal(mergesPr(["api", "repos/x/y/pulls/12/files"]), false);
});

test("STA-216 re-review: git config is read-only, -c is an allow-list", async () => {
  const { unsafeArgs } = await import("../bot-gh.mjs");
  for (const args of [
    ["config", "alias.p", "x", "--get"],
    ["config", "user.name", "x"],
    ["config", "-e"],
    ["config", "--get", "x", "--replace-all"],
    ["config", "set", "alias.x", "y"],
    ["config", "--file", "f", "alias.x", "y"],
    ["config"],
    ["-c", "remote.origin.push=x", "status"],
    ["-c", "url.x.insteadOf=y", "status"],
    ["-c", "core.askPass=x", "status"],
    ["-c", "diff.external=x", "diff"],
    ["-c", "gpg.program=x", "status"],
    ["-c", "pager.log=x", "log"],
  ])
    assert.ok(unsafeArgs("git", args), args.join(" "));
  for (const args of [
    ["config", "--get-regexp", "remote"],
    ["config", "--show-origin", "--list"],
  ])
    assert.equal(unsafeArgs("git", args), null, args.join(" "));
});

test("STA-216: the -c allow-list is exact keys", async () => {
  const { unsafeArgs } = await import("../bot-gh.mjs");
  for (const key of ["color.pager=sh", "status.displayCommentPrefix=x", "advice.foo=x"])
    assert.ok(unsafeArgs("git", ["-c", key, "status"]), key);
  assert.equal(unsafeArgs("git", ["-c", "color.ui=never", "status"]), null);
});

/** `runAsBot("gh", args)` in a child whose PATH finds the fake gh first; its output and exit status. */
const runAsBotArgv = (args, prelude = "") => [
  "--input-type=module",
  "-e",
  `import { runAsBot } from ${JSON.stringify(new URL("../bot-gh.mjs", import.meta.url).href)};` +
    `${prelude}process.exitCode = await runAsBot("gh", ${JSON.stringify(args)}, "token");`,
];
const runAsBotWith = (gh, args, prelude) =>
  spawnSync(process.execPath, runAsBotArgv(args, prelude), {
    encoding: "utf8",
    env: { ...process.env, PATH: gh.path },
  });

test("STA-302: a retried gh read prints only the last attempt's output", () => {
  const cut = { out: '[{"page":1}]', err: "net/http: TLS handshake timeout\n", code: 1 };
  let gh = fakeGh([cut, { out: '[{"page":1}]\n[{"page":2}]\n' }]);
  let r = runAsBotWith(gh, ["api", "--paginate", "repos/a/b/issues"]);
  assert.equal(r.stdout, '[{"page":1}]\n[{"page":2}]\n');
  assert.equal(r.status, 0);
  assert.equal(gh.runs(), 2);

  // A final failure still fails, with that attempt's output only.
  gh = fakeGh([cut, { out: "half", err: "HTTP 404: Not Found\n", code: 1 }]);
  r = runAsBotWith(gh, ["pr", "diff", "7"]);
  assert.equal(r.stdout, "half");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /retrying gh pr \(2\/4\)[^]*HTTP 404/);

  // A write runs once.
  gh = fakeGh([cut, { out: "ok" }]);
  r = runAsBotWith(gh, ["pr", "comment", "7", "--body", "x"]);
  assert.equal(r.status, 1);
  assert.equal(gh.runs(), 1);
});

test("STA-302: at a terminal or with --watch, a gh read writes straight through and runs once", () => {
  const blip = { out: "live\n", err: "HTTP 502: Bad Gateway\n", code: 1 };
  let gh = fakeGh([blip, { out: "second\n" }]);
  // A TTY is faked: the child's real stdout is a pipe, so only the path taken is observable.
  let r = runAsBotWith(gh, ["pr", "view", "7"], "process.stdout.isTTY = true;");
  assert.deepEqual([r.stdout, r.status, gh.runs()], ["live\n", 1, 1]);

  gh = fakeGh([blip, { out: "second\n" }]);
  r = runAsBotWith(gh, ["pr", "checks", "7", "--watch"]);
  assert.deepEqual([r.stdout, r.status, gh.runs()], ["live\n", 1, 1]);
});

test("STA-302: a reader that stops early (`| head`) ends a captured read quietly with 141", async () => {
  const gh = fakeGh([{ out: "x".repeat(8 * 1024 * 1024) }]);
  const child = spawn(process.execPath, runAsBotArgv(["pr", "diff", "7"]), {
    env: { ...process.env, PATH: gh.path },
  });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  child.stdout.once("data", () => child.stdout.destroy());
  const code = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(code, 141);
  assert.doesNotMatch(stderr, /EPIPE|Unhandled/);
});
