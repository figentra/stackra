import { test } from "node:test";
import assert from "node:assert/strict";
import { BOT_EMAIL, gitBotArgs, reviewerAllows } from "../bot-gh.mjs";

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
