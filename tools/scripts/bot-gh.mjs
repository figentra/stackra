#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: run `gh` or `git` as `stackra-bot` — `pnpm bot:gh -- pr list`, `pnpm bot:git -- commit -m …`,
 *   `pnpm bot:git -- push origin HEAD`. Mints an installation token (bot-token.mjs) and passes it as GH_TOKEN.
 *   `pnpm bot:review -- pr comment <n> --body-file f` runs gh as the separate `stackra-reviewer` app (ADR 0230): the
 *   only identity whose `AI-REVIEW:` verdict pr-merge accepts. It may only read a PR and comment or review on it.
 * git: author and committer are the bot; pushes go over https with `gh auth git-credential` as the only credential
 *   helper, and ssh remotes are rewritten to https for this one command. Everything is `-c`, so nothing is written
 *   to .git/config and the token never appears in argv.
 * Secrets: the token lives only in the child's environment; never printed.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mintToken } from "./bot-token.mjs";

// Bot user id from `gh api /users/stackra-bot%5Bbot%5D` (not the app id).
export const BOT_NAME = "stackra-bot[bot]";
export const BOT_EMAIL = "344982495+stackra-bot[bot]@users.noreply.github.com";

/** `-c` options that make one git command act as the bot. */
export const gitBotArgs = () => [
  "-c",
  `user.name=${BOT_NAME}`,
  "-c",
  `user.email=${BOT_EMAIL}`,
  "-c",
  "credential.helper=", // drop the developer's helpers so their credential cannot be used
  "-c",
  "credential.helper=!gh auth git-credential",
  "-c",
  "url.https://github.com/.insteadOf=git@github.com:",
  "-c",
  "url.https://github.com/.insteadOf=ssh://git@github.com/",
];

/** Run gh/git as the bot; returns the exit status. */
export function runAsBot(tool, args, token) {
  const argv = tool === "git" ? [...gitBotArgs(), ...args] : args;
  const env = { ...process.env, GH_TOKEN: token, GH_PROMPT_DISABLED: "1" };
  return spawnSync(tool, argv, { stdio: "inherit", env }).status ?? 1;
}

/** gh subcommands the reviewer identity may run: read a PR, then comment or review. Never push, merge or edit. */
export function reviewerAllows(args) {
  const [group, verb] = args;
  // A verdict is never edited or deleted (ADR 0230): post a new comment.
  if (args.some((a) => /^--(edit|delete)-last(=|$)/.test(a))) return false;
  if (group === "pr") return ["view", "diff", "checks", "comment", "review"].includes(verb);
  // gh api switches to POST when given fields or --input. pflag bundles short flags (`-iX`, `-if`), so every
  // single-dash arg is read letter by letter; a value that happens to hold X, f or F is denied too.
  const write = (a) =>
    a.startsWith("--")
      ? ["method", "field", "raw-field", "input"].includes(a.slice(2).split("=")[0])
      : a.startsWith("-") && /[XfF]/.test(a.slice(1));
  return group === "api" && !args.some(write);
}

/**
 * Commands that would print the token or store it (STA-208): `gh auth …` (token, status --show-token, login,
 * setup-git) and `git credential …` (fill answers with the token). git's `-c`/`-C` values are skipped.
 */
export function leaksToken(tool, args) {
  const words = [];
  for (let i = 0; i < args.length; i++) {
    if (tool === "git" && ["-c", "-C"].includes(args[i])) i++;
    else if (!args[i].startsWith("-")) words.push(args[i]);
  }
  return words[0] === (tool === "git" ? "credential" : "auth");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [tool, ...rest] = process.argv.slice(2);
  const args = rest[0] === "--" ? rest.slice(1) : rest;
  if (tool !== "gh" && tool !== "git" && tool !== "review") {
    process.stderr.write("usage: bot-gh.mjs gh|git|review [args...]\n");
    process.exit(2);
  }
  if (leaksToken(tool, args)) {
    process.stderr.write("bot-gh: `gh auth` and `git credential` would expose the bot token\n");
    process.exit(2);
  }
  if (tool === "review" && !reviewerAllows(args)) {
    process.stderr.write(
      "bot-gh: the reviewer identity only runs gh pr view|diff|checks|comment|review and GET api\n",
    );
    process.exit(2);
  }
  try {
    if (tool === "review")
      process.exit(runAsBot("gh", args, await mintToken(process.env, fetch, "STACKRA_REVIEWER")));
    process.exit(runAsBot(tool, args, await mintToken()));
  } catch (error) {
    process.stderr.write(`bot-gh: ${error.message}\n`);
    process.exit(1);
  }
}
