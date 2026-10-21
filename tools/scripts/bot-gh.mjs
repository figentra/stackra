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
 * setup-git) and `git credential …` / `git credential-<helper> …` (they answer with a token).
 */
export function leaksToken(tool, args) {
  const [first = ""] = words(tool, args);
  return tool === "git" ? /^credential(-|$)/.test(first) : first === "auth";
}

/** A word percent-decoded (up to three layers), then slashes collapsed and `.` / `..` segments resolved (STA-216). */
function normalizeWord(w) {
  let d = w;
  for (let i = 0; i < 3; i++) {
    try {
      const n = decodeURIComponent(d);
      if (n === d) break;
      d = n;
    } catch {
      break;
    }
  }
  const out = [];
  for (const seg of d.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

/**
 * Merges outside `pnpm pr:merge` (STA-214, ADR 0119): `gh pr merge`, `gh api …/pulls/<n>/merge` with any method, and
 * the GraphQL merge mutations. pr-merge.mjs runs gh itself after its checks, so it never comes through here.
 */
export function mergesPr(args) {
  const [group, verb] = words("gh", args);
  if (group === "pr") return verb === "merge";
  return group === "api" && args.some((a) => MERGE.test(a) || MERGE.test(normalizeWord(a)));
}

/** The only `-c` keys an agent may set: display and identity, none runs a command or redirects a remote (STA-216). */
const ALLOWED_C =
  /^(?:color\.ui|color\.diff|color\.status|color\.branch|core\.quotepath|core\.abbrev|core\.precomposeunicode|user\.name|user\.email|advice\.detachedhead|diff\.renames|diff\.algorithm|diff\.context|diff\.noprefix|log\.abbrevcommit|log\.decorate|log\.date|merge\.ff|merge\.conflictstyle|pull\.rebase|pull\.ff|push\.default|rebase\.autosquash|init\.defaultbranch|column\.ui|status\.short|status\.branch|status\.showuntrackedfiles)$/i;
const CONFIG_READ = new Set([
  "--get",
  "--get-all",
  "--get-regexp",
  "--get-urlmatch",
  "--list",
  "-l",
  "get",
  "list",
]);
const CONFIG_WRITE = new Set([
  "--add",
  "--replace-all",
  "--unset",
  "--unset-all",
  "-e",
  "--edit",
  "--rename-section",
  "--remove-section",
  "set",
  "unset",
  "edit",
]);
/** `git config` arguments (after the subcommand) that are not a plain read: the first option reads, no write flag follows. */
export function configWrites(args) {
  const [first, ...rest] = args.slice(0, args.findIndex((a) => a.startsWith("#")) + 1 || undefined);
  const reads =
    CONFIG_READ.has(first) ||
    (["--show-origin", "--show-scope"].includes(first) && rest.some((w) => CONFIG_READ.has(w)));
  return !reads || rest.some((w) => CONFIG_WRITE.has(w));
}
const MERGE = /\bpulls\/\d+\/merge\b|\b(?:mergePullRequest|enablePullRequestAutoMerge)\b/i;

/**
 * Why a command is refused regardless of tool (STA-216), or null. git: `-c alias.*` / `-c include*` / `--config-env`
 * run any git command past the guards. gh: `alias` rewrites the owner's gh config; `api graphql` with the document
 * from a file (`-F query=@f`, `--input`) cannot be checked for a merge mutation, so file-sourced GraphQL is denied.
 */
export function unsafeArgs(tool, args) {
  if (tool === "git") {
    let sub = -1;
    for (let i = 0; i < args.length && sub < 0; i++) {
      if (["-c", "-C", "--git-dir", "--work-tree", "--namespace"].includes(args[i])) i++;
      else if (!args[i].startsWith("-")) sub = i;
    }
    const bad =
      args.some(
        (a, i) =>
          /^--config-env\b/.test(a) ||
          (a === "-c" && !ALLOWED_C.test((args[i + 1] ?? "").split("=")[0])) ||
          /^-c./.test(a),
      ) ||
      (args[sub] === "config" && configWrites(args.slice(sub + 1)));
    return bad
      ? "`-c` outside the display/identity allow-list, any `git config` that is not a read, and `--config-env` bypass the guards"
      : null;
  }
  const [group] = words("gh", args);
  if (group === "alias") return "`gh alias` rewrites the owner's gh config";
  if (group === "api" && args.includes("graphql") && args.some((a) => /=@|^@|^--input\b/.test(a)))
    return "GraphQL from a file cannot be checked for a merge mutation; inline the query";
  return null;
}

/** The non-flag words: git's `-c`/`-C`/`--git-dir`/`--work-tree`/`--namespace` and gh's `-R`/`--repo` values skipped. */
function words(tool, args) {
  const takesValue =
    tool === "git" ? ["-c", "-C", "--git-dir", "--work-tree", "--namespace"] : ["-R", "--repo"];
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (takesValue.includes(args[i])) i++;
    else if (!args[i].startsWith("-")) out.push(args[i]);
  }
  return out;
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
  const unsafe = unsafeArgs(tool === "review" ? "gh" : tool, args);
  if (unsafe) {
    process.stderr.write(`bot-gh: ${unsafe}\n`);
    process.exit(2);
  }
  if (tool !== "git" && mergesPr(args)) {
    process.stderr.write("bot-gh: agents merge only through `pnpm pr:merge <n>`\n");
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
