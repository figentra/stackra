#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: run `gh` or `git` as `stackra-bot` — `pnpm bot:gh -- pr list`, `pnpm bot:git -- commit -m …`,
 *   `pnpm bot:git -- push origin HEAD`. Mints an installation token (bot-token.mjs) and passes it as GH_TOKEN.
 *   The `review` mode (the `stackra-reviewer` App, ADR 0230) is retired with that App (ADR 0523 decision 6); the
 *   gate and the ruleset are the merge condition since ADR 0523, and an AI review is advisory.
 * git: author and committer are the bot; pushes go over https with `gh auth git-credential` as the only credential
 *   helper, and ssh remotes are rewritten to https for this one command. Everything is `-c`, so nothing is written
 *   to .git/config and the token never appears in argv. No hook runs (`core.hooksPath=/dev/null`): the CI gate runs
 *   the checks a hook would, and a hook is repository code that would see every /agents value.
 * Boundary: runs one `gh` or `git` child with the minted token in its environment; writes no git config and no file.
 * Runtime: node
 * Governing contract: ADR 0230 (reviewer identity separate from builder, amended by ADR 0523 decision 6); ADR 0293
 *                     (agent permission tiers and executor pushes).
 * Secrets: the token lives only in the child's environment; never printed.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ghIdempotent, mintToken, spawnRetrying } from "./bot-token.mjs";

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
  // A hook (lefthook's pre-push runs the worktree's lefthook.yml) would run repo code with every /agents value.
  "-c",
  "core.hooksPath=/dev/null",
];

const CAPTURE_MIB = 256; // as pr-merge: a lockfile diff passes 1 MiB

/** Writes `text` and resolves once it is flushed: the caller exits right after, which would cut a large diff written
 * to a pipe. */
const write = (stream, text) =>
  new Promise((resolve) => {
    stream.write(text ?? "", resolve);
  });

/**
 * Run gh/git as the bot; resolves to the exit status. A gh read whose output goes to a pipe or file is retried on a
 * transient network error (STA-302): its output is captured and only the last attempt's is shown, so a cut-off
 * attempt never prints twice. At a terminal or with `--watch`, gh writes straight through (colour, table, pager, live
 * progress) and runs once; a person re-runs it.
 */
export async function runAsBot(tool, args, token) {
  const argv = tool === "git" ? [...gitBotArgs(), ...args] : args;
  const env = { ...process.env, GH_TOKEN: token, GH_PROMPT_DISABLED: "1" };
  const live = process.stdout.isTTY || args.some((a) => /^--watch(=|$)/.test(a));
  if (tool === "git" || live || !ghIdempotent(args))
    return spawnSync(tool, argv, { stdio: "inherit", env }).status ?? 1;
  const r = spawnRetrying(tool, argv, {
    stdio: ["inherit", "pipe", "pipe"],
    env,
    encoding: "utf8",
    maxBuffer: CAPTURE_MIB * 1024 * 1024,
  });
  // A reader that stops early (`| head`) ends the command quietly, as gh does on SIGPIPE.
  process.stdout.on("error", (error) => {
    if (error.code !== "EPIPE") throw error;
    process.exit(141);
  });
  await write(process.stderr, r.stderr);
  // spawnSync kills gh past maxBuffer (ENOBUFS); its cut-off output is not printed.
  if (r.error) {
    const why =
      r.error.code === "ENOBUFS" ? `gh printed more than ${CAPTURE_MIB} MiB` : r.error.message;
    await write(process.stderr, `bot-gh: ${why}\n`);
  } else await write(process.stdout, r.stdout);
  return r.status ?? 1;
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
 * Merges outside `pnpm pr:merge` (STA-214, ADR 0119): `gh pr merge`, `gh api …/pulls/<n>/merge` with any method,
 * `gh api repos/<o>/<r>/merges`, and the GraphQL merge, enqueue, commit-on-branch and ref mutations (ADR 0293).
 * pr-merge.mjs runs gh itself after its checks, so it never comes through here.
 */
export function mergesPr(args) {
  const [group, verb] = words("gh", args);
  if (group === "pr") return verb === "merge";
  return group === "api" && args.some((a) => MERGE.test(a) || MERGE.test(normalizeWord(a)));
}

const CHECK_SEGMENTS = new Set(["statuses", "check-runs", "check-suites"]);
const CHECK_MUTATION =
  /\b(?:createCheckRun|updateCheckRun|createCheckSuite|rerequestCheckSuite|createCommitStatus)\b/;
// gh api's shorthands that take a value (-F -f -H -p -q -t -X); -i is its only boolean shorthand.
const SHORT_VALUE = new Set(["F", "f", "H", "p", "q", "t", "X"]);
const LONG_VALUE = new Set([
  "--field",
  "--raw-field",
  "--input",
  "--method",
  "--header",
  "--jq",
  "--template",
  "--preview",
  "--hostname",
  "--cache",
]);

/**
 * A `gh api` call parsed as gh's flag library reads it: bundled shorthands (`-iF k=v`, `-ifk=v`, `-iXPOST`), values
 * attached with or without `=`, and the last `-X`/`--method` winning. The endpoint is the first positional after
 * `api`; `-R`/`--repo` values are skipped. (Parser after the L4 review of figentra/figentra#73.)
 */
export function parseApi(args) {
  const flags = [];
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-R" || a === "--repo") i++;
    else if (a.startsWith("--")) {
      const [name, ...rest] = a.split("=");
      if (rest.length > 0) flags.push([name, rest.join("=")]);
      else flags.push([name, LONG_VALUE.has(name) ? (args[++i] ?? "") : ""]);
    } else if (a.startsWith("-") && a.length > 1) {
      for (let c = 1; c < a.length; c++) {
        if (!SHORT_VALUE.has(a[c])) continue;
        const attached = a.slice(c + 1).replace(/^=/, "");
        flags.push([`-${a[c]}`, attached === "" ? (args[++i] ?? "") : attached]);
        break;
      }
    } else positional.push(a);
  }
  const method = flags.findLast(([n]) => n === "-X" || n === "--method")?.[1] ?? "";
  const fields = flags.filter(([n]) => ["-f", "-F", "--field", "--raw-field"].includes(n));
  const input = flags.some(([n]) => n === "--input");
  return { method: method.toUpperCase(), fields, input, endpoint: positional[1] ?? "" };
}

/** The endpoint as a normalized, lower-case path: a full URL reduced to its path first. */
export function endpointPath(endpoint) {
  let path;
  try {
    path = new URL(endpoint).pathname;
  } catch {
    // A relative endpoint such as `repos/o/r/statuses/<sha>` or `graphql`: its query and fragment go, or
    // `statuses?x=1` would hide the segment (L4, second read of figentra#73).
    path = endpoint.split(/[?#]/, 1)[0];
  }
  return normalizeWord(path).toLowerCase();
}

/** Whether a `gh api` call goes to the GraphQL endpoint, however it is spelled (`graphql`, `/graphql`, a full URL). */
const toGraphql = (args) => endpointPath(parseApi(args).endpoint).split("/").at(-1) === "graphql";

/**
 * A write of a commit status or a check run or suite (STA-2761): a `gh api` call whose endpoint path has a `statuses`,
 * `check-runs` or `check-suites` segment and that writes (a non-GET method, any field or `--input`), and any GraphQL
 * call whose document comes from a file or stdin or names a check or status mutation. Reads stay open, and a field
 * that merely mentions those words is not a write to them. Every agent acts as stackra-bot, so such a write could
 * forge `stackra/verify`; this is a speed bump, not the fence (a raw bot token reaches the API without this command;
 * the fence is the stackra-verify App and the ruleset bound to its integration id).
 */
export function writesCheck(args) {
  const [group] = words("gh", args);
  if (group !== "api") return false;
  const { method, fields, input, endpoint } = parseApi(args);
  const segments = endpointPath(endpoint).split("/");
  if (segments.at(-1) === "graphql") {
    const fromFile =
      input || fields.some(([n, v]) => ["-F", "--field"].includes(n) && /=@/.test(v));
    return fromFile || fields.some(([, v]) => CHECK_MUTATION.test(v));
  }
  const writes =
    (method !== "" && method !== "GET" && method !== "HEAD") || fields.length > 0 || input;
  return writes && segments.some((s) => CHECK_SEGMENTS.has(s));
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
const MERGE =
  /\bpulls\/\d+\/merge\b|\brepos\/[^/\s]+\/[^/\s]+\/merges\b|\b(?:mergePullRequest|enablePullRequestAutoMerge|enqueuePullRequest|mergeBranch|createCommitOnBranch|updateRefs?|deleteRef)\b/i;

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
  const [group, verb] = words("gh", args);
  if (group === "alias") return "`gh alias` rewrites the owner's gh config";
  if (group === "extension") return "`gh extension` installs and runs code under the bot token";
  if (writesOwnerLabel(group, verb, args))
    return "`owner-approved` records the owner's own decision; an agent never adds it (ADR 0230 rule 4)";
  if (group === "api" && toGraphql(args) && args.some((a) => /=@|^@|^--input\b/.test(a)))
    return "GraphQL from a file cannot be checked for a merge mutation; inline the query";
  return null;
}

/**
 * A label write (`pr|issue create|edit`, `label create|edit|clone`, an `api` call on labels) that names
 * `owner-approved` outside a title, body or description. Here the arguments are the real ones, after the shell
 * expanded them, so no spelling hides the label (STA-330 review).
 */
function writesOwnerLabel(group, verb, args) {
  const edits =
    (["pr", "issue"].includes(group) && ["create", "edit"].includes(verb)) ||
    (group === "label" && ["create", "edit", "clone"].includes(verb)) ||
    (group === "api" && args.some((a) => /(?:^|\/)labels\b|\blabels(?:\[\])?=|Label/.test(a)));
  return (
    edits &&
    args.some(
      (a, i) =>
        /owner-approv/i.test(a) &&
        !/^(?:-t|--title|-b|--body|-d|--description)$/.test(args[i - 1] ?? "") &&
        !/^--(?:title|body|description)=/.test(a),
    )
  );
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
  if (tool === "review") {
    process.stderr.write(
      "bot-gh: the stackra-reviewer App is retired (ADR 0523 decision 6), and the gate and the ruleset are the merge condition since ADR 0523; post an advisory review with `pnpm bot:gh -- pr comment`\n",
    );
    process.exit(2);
  }
  if (tool !== "gh" && tool !== "git") {
    process.stderr.write("usage: bot-gh.mjs gh|git [args...]\n");
    process.exit(2);
  }
  if (leaksToken(tool, args)) {
    process.stderr.write("bot-gh: `gh auth` and `git credential` would expose the bot token\n");
    process.exit(2);
  }
  const unsafe = unsafeArgs(tool, args);
  if (unsafe) {
    process.stderr.write(`bot-gh: ${unsafe}\n`);
    process.exit(2);
  }
  if (tool !== "git" && writesCheck(args)) {
    process.stderr.write(
      "bot-gh: agents never write commit statuses or check runs; only the stackra-verify App posts results (STA-2761)\n",
    );
    process.exit(2);
  }
  if (tool !== "git" && mergesPr(args)) {
    process.stderr.write("bot-gh: agents merge only through `pnpm pr:merge <n>`\n");
    process.exit(2);
  }
  try {
    process.exit(await runAsBot(tool, args, await mintToken()));
  } catch (error) {
    process.stderr.write(`bot-gh: ${error.message}\n`);
    process.exit(1);
  }
}
