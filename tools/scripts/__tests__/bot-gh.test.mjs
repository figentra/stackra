import { test } from "node:test";
import assert from "node:assert/strict";
import { BOT_EMAIL, gitBotArgs, leaksToken, mergesPr, reviewerAllows } from "../bot-gh.mjs";

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

test("STA-216: aliases, file-sourced GraphQL and encoded merge paths are refused", async () => {
  const { unsafeArgs } = await import("../bot-gh.mjs");
  for (const [tool, args] of [
    ["git", ["-c", "alias.x=credential", "x", "fill"]],
    ["git", ["-calias.p=push", "p"]],
    ["git", ["-c", "include.path=/tmp/x", "status"]],
    ["git", ["--config-env=alias.x=V", "x"]],
    ["gh", ["alias", "set", "x", "pr merge"]],
    ["gh", ["api", "graphql", "-F", "query=@q.graphql"]],
    ["gh", ["api", "-X", "POST", "graphql", "--input", "q.json"]],
    ["gh", ["api", "graphql", "-f", "query=@q.graphql"]],
  ])
    assert.ok(unsafeArgs(tool, args), `${tool} ${args.join(" ")}`);
  for (const [tool, args] of [
    ["git", ["-c", "user.name=x", "status"]],
    ["gh", ["api", "graphql", "-f", "query=query { viewer { login } }"]],
    ["gh", ["pr", "create", "--body", "alias set"]],
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
