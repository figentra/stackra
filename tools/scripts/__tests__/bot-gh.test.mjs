import { test } from "node:test";
import assert from "node:assert/strict";
import { BOT_EMAIL, gitBotArgs } from "../bot-gh.mjs";

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
