/**
 * Stackra file contract:
 * Purpose: name the GitHub repository (`owner/name`) a bot command acts on, so bot-token.mjs mints for the
 *          installation that covers it: stackra-bot is installed in more than one organization (figentra,
 *          stackra-inc), and one stored installation id serves only one of them (STA-2861; the `figentra bot`
 *          twin is figentra/figentra#74, STA-2809).
 * Boundary: reads arguments, GH_REPO and, when they name no repository, one `git remote get-url`; no network, no
 *           secret.
 * Runtime: node
 * Governing contract: ADR 0230 (stackra-bot is the builder identity); ADR 0293 (agent pushes go through the bot);
 *                     STA-2861.
 */
import { spawnSync } from "node:child_process";

/** `owner/name` from a GitHub remote URL or a `[github.com/]owner/name` spec; null when it is not one. */
export function repoOf(spec) {
  if (typeof spec !== "string") return null;
  const m =
    /^(?:https?:\/\/(?:[^@/]+@)?github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:|github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(
      spec.trim(),
    );
  return m ? `${m[1]}/${m[2]}` : null;
}

/** The URL of git remote `name` (in the `-C` directories given), or null. */
function remoteUrl(name, dirs, run) {
  const r = run("git", [...dirs, "remote", "get-url", name], { encoding: "utf8" });
  return r.status === 0 ? String(r.stdout).trim() : null;
}

/** The `-C <dir>` options a git command starts with (kept for its own `remote get-url`) and the rest. */
function leadingDirs(args) {
  const dirs = [];
  let i = 0;
  while (args[i] === "-C" && args[i + 1] !== undefined) {
    dirs.push("-C", args[i + 1]);
    i += 2;
  }
  return { dirs, rest: args.slice(i) };
}

/** git subcommands whose first non-flag argument is the remote (or URL) they talk to. */
const REMOTE_FIRST = new Set(["push", "fetch", "pull", "ls-remote"]);

/**
 * The repository `tool args` acts on, or null when it cannot be told (bot-token.mjs then mints for the stored
 * installation id).
 * gh: `-R`/`--repo`/`--repo=`/`-R<x>`, else `GH_REPO`, else an `api repos/<owner>/<name>/…` path, else the working
 *     directory's `origin`.
 * git: for push, fetch, pull and ls-remote the remote named (or URL given) after the subcommand, default `origin`;
 *      any other git command uses `origin`. Leading `-C <dir>` options are honoured.
 */
export function targetRepo(tool, args, { run = spawnSync, env = process.env } = {}) {
  if (tool === "git") {
    const { dirs, rest } = leadingDirs(args);
    const [sub, ...after] = rest;
    const remote = (REMOTE_FIRST.has(sub) && after.find((a) => !a.startsWith("-"))) || "origin";
    return repoOf(remote) ?? repoOf(remoteUrl(remote, dirs, run));
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-R" || a === "--repo") return repoOf(args[i + 1]);
    if (a.startsWith("--repo=")) return repoOf(a.slice("--repo=".length));
    if (/^-R./.test(a)) return repoOf(a.slice(2));
  }
  if (env.GH_REPO) return repoOf(env.GH_REPO);
  if (args[0] === "api") {
    const m = args
      .slice(1)
      .map((a) => /^\/?repos\/([\w.-]+)\/([\w.-]+)(?:[/?]|$)/.exec(a))
      .find(Boolean);
    if (m && !m[1].startsWith("{")) return `${m[1]}/${m[2]}`;
  }
  return repoOf(remoteUrl("origin", [], run));
}
