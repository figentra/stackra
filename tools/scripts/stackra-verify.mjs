#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the Stackra verify service (STA-2761, replaces the merge-now rule STA-2083). For a head SHA it checks the
 *   exact commit out in a clean worktree, runs `pnpm install --frozen-lockfile && pnpm verify` (format, lint,
 *   typecheck, test, build, validate, boundaries, knip), and records the result three ways: a commit status
 *   `stackra/verify` posted as stackra-bot, a commit comment with the log tail and the failing names (the status
 *   links to it), and a ledger line (SHA, command, result, duration, failing names). `pr-merge.mjs` refuses a merge
 *   without a green `stackra/verify` from the bot on the exact head.
 *   Verbs:
 *     run --sha <sha> [--pr <n>] [--in-place]   verify one SHA (`--in-place`: the current checkout, which must be <sha>)
 *     once                                      verify every open, non-draft, non-fork PR head and main's head that
 *                                               lacks a result
 *     daemon [--interval <s>]                   `once`, then again every interval (default 300 s)
 *   Common: [-R owner/repo] (default figentra/stackra); `once` and `daemon` take -R more than once (core and template).
 * Boundary: two privilege levels. This process holds the bot identity and only talks to GitHub and writes
 *   STACKRA_VERIFY_HOME (logs/, ledger/, the lock). Every git command and the verify itself run as the separate Unix
 *   user STACKRA_VERIFY_RUN_AS (`sudo -n -u <user> -- env -i …`, a clean environment, git hooks and fsmonitor off),
 *   which owns STACKRA_VERIFY_WORK (mirror/, worktrees/, home/, pnpm-store/). PR code therefore never runs as the user
 *   that holds the key and cannot read its environment, files or git config. `once`, `daemon` and `run` refuse to
 *   start without STACKRA_VERIFY_RUN_AS, unless STACKRA_VERIFY_SAME_USER=1 says the host is itself disposable (a
 *   runner job that is thrown away after the run).
 *   Containers: the verify user reaches Docker only through STACKRA_VERIFY_DOCKER_HOST, a daemon of its own (rootless
 *   Docker), which is emptied after each run; without it no container is touched and Ryuk cleans up. Never the
 *   box's shared Docker socket: membership of the docker group is root on the box.
 *   Capacity: one verify per box at a time (the lock), under `nice` and `taskset -c STACKRA_VERIFY_CPUS` (default
 *   0-7) and `timeout` (2 h, then the whole process group is killed); containers run under their own daemon and are
 *   not pinned by taskset, so the host caps them (systemd CPUQuota/MemoryMax on the service). A run starts only with
 *   STACKRA_VERIFY_MIN_FREE_GB (default 20) free in STACKRA_VERIFY_WORK; logs older than 14 days are deleted.
 * Runtime: node on Linux (sudo, taskset, timeout from coreutils, git, pnpm on the verify user's PATH).
 * Governing contract: ADR 0119 (merge policy); ADR 0523 (decision 3); STA-2761.
 * Secrets: the bot token is minted in-process (bot-token.mjs) and stays in the gh child's environment. The verify
 *   user gets `childEnv`: no secret-named variable, no SSH agent, its own HOME. Logs are scrubbed of token and key
 *   shapes (`redact`) before the tail is posted, as defence in depth: the verify holds no secret to print.
 * Exit: 0 every verify recorded (pass or fail), 1 a verify could not be recorded or the host is not set up, 2 usage.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statfsSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as botNetwork from "./bot-token.mjs";
import { gh, latestVerify, VERIFY_CONTEXT, VERIFY_CREATOR } from "./pr-merge.mjs";

export const DEFAULT_REPO = "figentra/stackra";
export const COMMAND = "pnpm install --frozen-lockfile && pnpm verify";
/** A `pending` status older than this is a run that died; the next pass runs the SHA again. */
export const STALE_PENDING_MS = 3 * 60 * 60 * 1000;
/** An `error` (the verify could not run: network, disk, shutdown) is retried after this long … */
export const ERROR_RETRY_MS = 30 * 60 * 1000;
/** … up to this many bot `error` statuses on one SHA; after that it waits for a new push. */
export const MAX_ERROR_ATTEMPTS = 3;
/** A verify that runs longer than this is stopped (`timeout`, then SIGKILL 30 s later) and recorded as `error`. */
export const RUN_TIMEOUT_S = 2 * 60 * 60;
/** A lock directory without a readable owner is stale after this long (a crash between mkdir and the write). */
export const LOCK_ORPHAN_MS = 10 * 60 * 1000;
export const LOG_KEEP_MS = 14 * 24 * 60 * 60 * 1000;
const TAIL_LINES = 80;

const REPO_PART = /^(?!\.+$)[\w.-]+$/;
const validRepo = (r) => r.split("/").length === 2 && r.split("/").every((p) => REPO_PART.test(p));

/** `<verb> [flags]` → options, or null on a usage error. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--");
  const verb = args.shift();
  if (!["run", "once", "daemon"].includes(verb)) return null;
  const out = { verb, repos: [], inPlace: false, interval: 300 };
  let interval = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-R" || a === "--repo") out.repos.push(args[++i] ?? "");
    else if (a === "--sha") out.sha = args[++i] ?? "";
    else if (a === "--pr") out.pr = args[++i] ?? "";
    else if (a === "--interval") {
      out.interval = Number(args[++i]);
      interval = true;
    } else if (a === "--in-place") out.inPlace = true;
    else return null;
  }
  if (out.repos.length === 0) out.repos.push(DEFAULT_REPO);
  if (!out.repos.every(validRepo)) return null;
  if (verb === "run" && out.repos.length !== 1) return null;
  out.repo = out.repos[0];
  if (out.pr !== undefined && !/^\d+$/.test(out.pr)) return null;
  if (verb === "run" && !/^[0-9a-f]{40}$/.test(out.sha ?? "")) return null;
  if (verb !== "run" && (out.sha || out.pr || out.inPlace)) return null;
  if (interval && verb !== "daemon") return null;
  if (!Number.isFinite(out.interval) || out.interval < 30) return null;
  return out;
}

/**
 * Whether a head needs a verify, from its commit statuses. Only the bot's `stackra/verify` counts (`latestVerify`),
 * so a status anyone else posted never stops a run. No result yet: run. `pending` older than STALE_PENDING_MS (the run
 * died): run. `error` older than ERROR_RETRY_MS while the bot has posted fewer than MAX_ERROR_ATTEMPTS errors: run.
 * A `success` or `failure` stands until the head moves.
 */
export function needsRun(statuses, now = Date.now()) {
  const last = latestVerify(statuses);
  if (!last) return true;
  const age = now - Date.parse(last.created_at);
  if (last.state === "pending") return age > STALE_PENDING_MS;
  if (last.state === "error") {
    const errors = statuses.filter(
      (s) =>
        s.context === VERIFY_CONTEXT && s.creator?.login === VERIFY_CREATOR && s.state === "error",
    ).length;
    return age > ERROR_RETRY_MS && errors < MAX_ERROR_ATTEMPTS;
  }
  return false;
}

/**
 * Which open PRs the service runs: not drafts, and never a fork's. A fork's code is anyone's code; a fork PR is
 * verified only after a maintainer pushes its commits to a branch here (or runs `run --sha` by hand, their call).
 */
export const verifiable = (pr) => !pr.isDraft && pr.isCrossRepository === false;

/** Names that never reach the verify: the bot identity, agents and sockets, and anything that names a secret. */
const SECRET_NAME =
  /^(STACKRA_BOT_|GH_|GITHUB_|SOPS_|AGE_|AWS_|SSH_|GPG_|NPM_TOKEN$|NODE_AUTH_TOKEN$|DOCKER_)|(TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE_KEY|API_KEY|CREDENTIAL|_AUTH)/i;

/**
 * The verify user's environment: `base` minus every secret name, with its own HOME and pnpm store, the verify
 * user's own Docker (when configured) and the CI flags. Built for `env -i`, so nothing else leaks through sudo.
 */
export function childEnv(base = process.env, { home, store, dockerHost, path } = {}) {
  const out = {};
  for (const [name, value] of Object.entries(base)) if (!SECRET_NAME.test(name)) out[name] = value;
  if (path) out.PATH = path;
  if (home) out.HOME = home;
  if (store) out.npm_config_store_dir = store;
  if (dockerHost) out.DOCKER_HOST = dockerHost;
  return { ...out, CI: "1", TURBO_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" };
}

/**
 * The argv that runs `cmd args` as the verify user with exactly `env`: `sudo -n -u <user> -- env -i K=V … cmd args`.
 * With no user (a disposable host, STACKRA_VERIFY_SAME_USER=1) it is `env -i K=V … cmd args` in this user.
 */
export function asUser(user, env, cmd, args) {
  const pairs = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  const inner = ["env", "-i", ...pairs, cmd, ...args];
  return user ? ["sudo", "-n", "-u", user, "--", ...inner] : inner;
}

/** git with hooks and fsmonitor off: PR code may have written the mirror's hooks or config. */
export const gitArgs = (dir, args) => [
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "core.fsmonitor=false",
  "-C",
  dir,
  ...args,
];

/** The verify command line: low priority, pinned cores, a hard time limit over the whole process group. */
export function verifyArgv({ cpus, linux = true }) {
  const limit = linux
    ? [
        "timeout",
        "-s",
        "TERM",
        "-k",
        "30",
        String(RUN_TIMEOUT_S),
        "nice",
        "-n",
        "10",
        "taskset",
        "-c",
        cpus,
      ]
    : ["nice", "-n", "10"];
  return [...limit, "sh", "-c", COMMAND];
}

/**
 * Whether a lock is stale. `owner` is the parsed lock file ({ pid, start }) or null when missing or unreadable;
 * `alive(pid)` says the pid exists; `startOf(pid)` its start time (null when unknown); `ageMs` the lock's age.
 */
export function lockIsStale(owner, { ageMs, alive: isAlive, startOf: startTimeOf }) {
  if (!owner || !Number.isInteger(owner.pid) || owner.pid <= 0) return ageMs > LOCK_ORPHAN_MS;
  if (!isAlive(owner.pid)) return true;
  const start = startTimeOf(owner.pid);
  return start !== null && owner.start !== undefined && start !== owner.start;
}

/** Terminal colour and cursor codes (ESC [ … letter), built from the ESC code point so the source holds none. */
const ANSI = new RegExp(`${String.fromCodePoint(27)}\\[[0-9;?]*[A-Za-z]`, "g");
const SECRET_SHAPES = [
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  /\bA(?:KIA|SIA)[0-9A-Z]{16}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bnpm_[A-Za-z0-9]{36}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\bAGE-SECRET-KEY-1[0-9A-Z]{50,}\b/g,
];
/**
 * Token and key shapes never leave the box, whatever a tool printed. Defence in depth only: an encoded or split
 * secret passes, which is why the verify holds none.
 */
export function redact(text) {
  let out = text.replaceAll(ANSI, "");
  for (const shape of SECRET_SHAPES) out = out.replaceAll(shape, "[redacted]");
  return out.replaceAll(
    /(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/g,
    "$1 [redacted] $2",
  );
}

/**
 * The names that failed, from a verify log: turbo's `Failed:` tasks, vitest's `FAIL` files and node:test's `✖`
 * tests. When a step outside turbo failed (format, validate, knip …) and none of those matched, the last
 * `> <command>` pnpm echoed names it.
 */
export function failingNames(log) {
  const lines = redact(log).split("\n");
  const names = new Set();
  for (const line of lines) {
    const turbo = line.match(/^\s*Failed:\s+([^\s,]+#[^\s,]+)/);
    if (turbo) names.add(turbo[1]);
    const vitest = line.match(/^\s*(?:\S+\s+)?FAIL\s+(\S+\.test\.\w+)/);
    if (vitest) names.add(vitest[1]);
    const nodeTest = line.match(/^\s*✖ (.+?) \(\d/);
    if (nodeTest) names.add(nodeTest[1]);
  }
  if (names.size === 0) {
    const step = lines.findLast((l) => /^> \S/.test(l));
    if (step) names.add(step.slice(2).trim());
  }
  return [...names].slice(0, 50);
}

export const formatDuration = (ms) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};

/** The commit status description GitHub shows (at most 140 characters). */
export function statusDescription({ state, durationMs, failing, box, reason }) {
  const verdict = state === "success" ? "passed" : state === "error" ? "could not run" : "failed";
  const why = state === "error" && reason ? ` (${reason})` : "";
  const names = state === "failure" && failing.length ? `: ${failing.join(", ")}` : "";
  const text = `pnpm verify ${verdict} in ${formatDuration(durationMs)} on ${box}${why}${names}`;
  return text.length > 140 ? `${text.slice(0, 139)}…` : text;
}

/** The commit comment: verdict, failing names and the scrubbed log tail. */
export function commentBody({ sha, pr, state, durationMs, failing, box, log, command, reason }) {
  const tail = redact(log)
    .split("\n")
    .slice(-TAIL_LINES)
    .map((l) => (l.length > 300 ? `${l.slice(0, 299)}…` : l))
    .join("\n");
  return [
    `**${VERIFY_CONTEXT}: ${state}** on \`${sha}\`${pr ? ` (#${pr})` : ""}`,
    "",
    `- Command: \`${command}\``,
    `- Box: ${box}, ${formatDuration(durationMs)}${reason ? ` (${reason})` : ""}`,
    `- Failing: ${failing.length ? failing.map((n) => `\`${n}\``).join(", ") : "none"}`,
    "",
    `<details><summary>Last ${TAIL_LINES} log lines</summary>`,
    "",
    "```text",
    tail.replaceAll("```", "'''"),
    "```",
    "</details>",
    "",
    "Posted by the Stackra verify service (STA-2761). A merge needs this status green on the exact head.",
  ].join("\n");
}

/** One ledger entry, as JSON (the machine copy) and a markdown table row (the human copy). */
export function ledgerEntry({
  repo,
  sha,
  pr,
  state,
  durationMs,
  failing,
  box,
  command,
  at,
  link,
  recorded = true,
}) {
  const json = {
    at,
    repo,
    sha,
    pr: pr ? Number(pr) : null,
    command,
    state,
    durationMs,
    failing,
    box,
    link: link ?? null,
    recorded,
  };
  const result = recorded ? state : `${state} (status not posted)`;
  const md = `| ${at} | ${repo} | ${pr ? `#${pr}` : "main"} | \`${sha.slice(0, 12)}\` | \`${command}\` | ${result} | ${formatDuration(durationMs)} | ${failing.join(", ") || "-"} | ${link ?? "-"} |`;
  return { json, md };
}

export const LEDGER_HEADER =
  "| at | repo | PR | SHA | command | result | duration | failing | log |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |";

// ---- side effects below -------------------------------------------------------------------------------------

/** The host settings, read once per verify from the environment the service was started with. */
export function settings(env = process.env) {
  const work = env.STACKRA_VERIFY_WORK ?? "/work/stackra/verify-work";
  return {
    home: env.STACKRA_VERIFY_HOME ?? "/work/stackra/verify",
    work,
    runAs: env.STACKRA_VERIFY_RUN_AS || null,
    sameUser: env.STACKRA_VERIFY_SAME_USER === "1",
    cpus: env.STACKRA_VERIFY_CPUS ?? "0-7",
    dockerHost: env.STACKRA_VERIFY_DOCKER_HOST || null,
    path: env.STACKRA_VERIFY_PATH || env.PATH,
    minFreeBytes: Number(env.STACKRA_VERIFY_MIN_FREE_GB ?? 20) * 1024 ** 3,
    box: env.STACKRA_VERIFY_BOX ?? hostname(),
  };
}

/** Refuses a host where PR code would run as the key holder. */
export function hostProblem(s) {
  if (s.runAs || s.sameUser) return null;
  return "STACKRA_VERIFY_RUN_AS is not set: PR code would run as the user that holds the bot identity (set it, or STACKRA_VERIFY_SAME_USER=1 on a disposable runner only)";
}

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Runs a command as the verify user and returns its stdout; throws with its stderr on a non-zero exit. */
function runAs(s, cmd, args, options = {}) {
  const env = childEnv(process.env, {
    home: join(s.work, "home"),
    store: join(s.work, "pnpm-store"),
    dockerHost: s.dockerHost,
    path: s.path,
  });
  const [bin, ...argv] = asUser(s.runAs, env, cmd, args);
  const r = spawnSync(bin, argv, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
  if (r.error) throw new Error(`${cmd} ${args.join(" ")}: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout;
}

const git = (s, dir, args) => runAs(s, "git", gitArgs(dir, args));

/** The process start time from /proc (clock ticks since boot), or null where /proc is missing. */
function startOf(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
    return Number(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[19]);
  } catch {
    return null;
  }
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
};

/**
 * One verify per box: an exclusive lock directory holding { pid, start }. A stale lock (dead owner, a reused pid, or
 * no owner after LOCK_ORPHAN_MS) is moved aside with an atomic rename, so of two processes that both find it stale
 * exactly one takes it. Returns the release function, or null when another live verify holds it.
 */
function lock(s) {
  const dir = join(s.home, "lock");
  mkdirSync(s.home, { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      mkdirSync(dir);
      writeFileSync(
        join(dir, "owner.json"),
        JSON.stringify({ pid: process.pid, start: startOf(process.pid) ?? undefined }),
      );
      return () => rmSync(dir, { recursive: true, force: true });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    let owner = null;
    try {
      owner = JSON.parse(readFileSync(join(dir, "owner.json"), "utf8"));
    } catch {
      // No owner file yet (a process between mkdir and its write) or a torn one: judged by the lock's age below.
    }
    let ageMs;
    try {
      ageMs = Date.now() - statSync(dir).mtimeMs;
    } catch {
      continue;
    }
    if (!lockIsStale(owner, { ageMs, alive, startOf })) return null;
    const aside = `${dir}.stale-${process.pid}-${Date.now()}`;
    try {
      renameSync(dir, aside);
      rmSync(aside, { recursive: true, force: true });
    } catch {
      return null;
    }
  }
  return null;
}

/** Retries a GitHub write a few times with backoff; repeating a status POST is harmless. */
async function retry(fn, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i >= attempts) throw error;
      await sleep(botNetwork.backoff(i));
    }
  }
}

async function postStatus(repo, sha, state, description, targetUrl) {
  const fields = [
    "-f",
    `state=${state}`,
    "-f",
    `context=${VERIFY_CONTEXT}`,
    "-f",
    `description=${description}`,
  ];
  if (targetUrl) fields.push("-f", `target_url=${targetUrl}`);
  await retry(async () =>
    gh(
      ["api", "--method", "POST", `repos/${repo}/statuses/${sha}`, ...fields],
      await botNetwork.mintToken(),
    ),
  );
}

/** The child running now, so a stop signal can end it cleanly (the verify records `error` and cleans up). */
let active = null;
let stopping = false;

/** The first stop signal ends the running verify and lets it record; the second exits at once. */
function stop(signal) {
  if (stopping) process.exit(130);
  stopping = true;
  if (active) active.kill(signal);
  else process.exit(130);
}

/** Read through a call, so a lint rule does not take the loop condition for a constant. */
const isStopping = () => stopping;

function runVerify(s, cwd, logPath) {
  const env = childEnv(process.env, {
    home: join(s.work, "home"),
    store: join(s.work, "pnpm-store"),
    dockerHost: s.dockerHost,
    path: s.path,
  });
  const [bin, ...argv] = asUser(
    s.runAs,
    env,
    ...splitFirst(verifyArgv({ cpus: s.cpus, linux: process.platform === "linux" })),
  );
  return new Promise((resolve) => {
    const child = spawn(bin, argv, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    active = child;
    child.stdout.on("data", (chunk) => appendFileSync(logPath, chunk));
    child.stderr.on("data", (chunk) => appendFileSync(logPath, chunk));
    child.on("close", (code, signal) => {
      active = null;
      // `timeout` exits 124 when it stopped the run, 137 when it had to kill it.
      resolve({ code, signal, timedOut: code === 124 || code === 137 });
    });
    child.on("error", (error) => {
      active = null;
      resolve({ code: null, signal: null, error });
    });
  });
}

const splitFirst = ([cmd, ...args]) => [cmd, args];

/** Empties the verify user's own Docker daemon after a run; the box's shared daemon is never touched. */
function cleanDocker(s, logPath) {
  if (!s.dockerHost) return;
  try {
    const ids = runAs(s, "docker", ["ps", "-aq"]).split("\n").filter(Boolean);
    if (ids.length) runAs(s, "docker", ["rm", "-f", "-v", ...ids]);
    runAs(s, "docker", ["volume", "prune", "-f"]);
    if (ids.length) appendFileSync(logPath, `\nstackra-verify: removed ${ids.length} containers\n`);
  } catch (error) {
    appendFileSync(logPath, `\nstackra-verify: docker clean-up: ${error.message}\n`);
  }
}

function freeBytes(dir) {
  const stat = statfsSync(dir);
  return stat.bavail * stat.bsize;
}

/** Verifies one SHA and records it. Returns the ledger JSON entry. */
export async function verify({ repo, sha, pr, inPlace = false }, s = settings()) {
  const started = Date.now();
  const name = repo.replace("/", "__");
  const logs = join(s.home, "logs");
  const ledgerDir = join(s.home, "ledger");
  mkdirSync(logs, { recursive: true });
  mkdirSync(ledgerDir, { recursive: true });
  const logPath = join(logs, `${name}-${sha}-${started}.log`);
  writeFileSync(logPath, "");

  let worktree;
  let mirror;
  let result;
  let reason;
  try {
    await postStatus(repo, sha, "pending", `pnpm verify running on ${s.box}`);
    let cwd = process.cwd();
    if (inPlace) {
      const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
      if (head !== sha)
        throw Object.assign(new Error(`the checkout is ${head}, not ${sha}`), {
          reason: "wrong checkout",
        });
    } else {
      runAs(s, "mkdir", [
        "-p",
        join(s.work, "mirror"),
        join(s.work, "worktrees"),
        join(s.work, "home"),
      ]);
      if (freeBytes(s.work) < s.minFreeBytes)
        throw Object.assign(
          new Error(`less than ${s.minFreeBytes / 1024 ** 3} GB free in ${s.work}`),
          { reason: "disk" },
        );
      mirror = join(s.work, "mirror", name);
      if (!existsSync(join(mirror, ".git")))
        runAs(s, "git", [
          "clone",
          "--quiet",
          "--no-checkout",
          `https://github.com/${repo}.git`,
          mirror,
        ]);
      const refs = ["+refs/heads/main:refs/remotes/origin/main"];
      if (pr) refs.push(`+refs/pull/${pr}/head:refs/verify/pr-${pr}`);
      git(s, mirror, ["fetch", "--quiet", "origin", ...refs]);
      worktree = join(s.work, "worktrees", `${name}-${sha}`);
      runAs(s, "rm", ["-rf", worktree]);
      git(s, mirror, ["worktree", "prune"]);
      git(s, mirror, ["worktree", "add", "--quiet", "--detach", worktree, sha]);
      cwd = worktree;
    }
    result = await runVerify(s, cwd, logPath);
    if (stopping) reason = "service stopped";
    else if (result.timedOut) reason = "time limit";
  } catch (error) {
    result = { code: null, error };
    reason = error.reason ?? "set-up";
    appendFileSync(logPath, `\nstackra-verify: ${error.message}\n`);
  } finally {
    if (!inPlace) cleanDocker(s, logPath);
    if (worktree) {
      try {
        runAs(s, "rm", ["-rf", worktree]);
        git(s, mirror, ["worktree", "prune"]);
        if (pr) git(s, mirror, ["update-ref", "-d", `refs/verify/pr-${pr}`]);
        git(s, mirror, ["gc", "--auto", "--quiet"]);
      } catch (error) {
        appendFileSync(logPath, `\nstackra-verify: worktree clean-up: ${error.message}\n`);
      }
    }
  }

  const durationMs = Date.now() - started;
  const log = readFileSync(logPath, "utf8");
  const state = result.code === 0 && !reason ? "success" : reason ? "error" : "failure";
  const failing = state === "failure" ? failingNames(log) : [];
  const facts = { sha, pr, state, durationMs, failing, box: s.box, log, command: COMMAND, reason };

  let link;
  let recorded = true;
  try {
    const comment = await retry(async () =>
      JSON.parse(
        gh(
          [
            "api",
            "--method",
            "POST",
            `repos/${repo}/commits/${sha}/comments`,
            "-f",
            `body=${commentBody(facts)}`,
          ],
          await botNetwork.mintToken(),
        ),
      ),
    );
    link = comment.html_url;
  } catch (error) {
    appendFileSync(logPath, `\nstackra-verify: comment not posted: ${error.message}\n`);
  }
  try {
    await postStatus(repo, sha, state, statusDescription(facts), link);
  } catch (error) {
    recorded = false;
    appendFileSync(logPath, `\nstackra-verify: status not posted: ${error.message}\n`);
  }

  const { json, md } = ledgerEntry({
    ...facts,
    repo,
    at: new Date().toISOString(),
    link,
    recorded,
  });
  appendFileSync(join(ledgerDir, `${name}.jsonl`), `${JSON.stringify(json)}\n`);
  const mdPath = join(ledgerDir, `${name}.md`);
  if (!existsSync(mdPath)) writeFileSync(mdPath, `# ${repo} verify ledger\n\n${LEDGER_HEADER}\n`);
  appendFileSync(mdPath, `${md}\n`);
  if (!recorded)
    throw new Error(
      `the ${state} result for ${sha} is in the ledger but its status was not posted`,
    );
  return json;
}

/** The current state of one head, read right before its verify: a long run before it may have made it moot. */
async function currentHead(repo, head) {
  const token = await botNetwork.mintToken();
  let sha = head.sha;
  if (head.pr) {
    const pr = JSON.parse(
      gh(
        ["pr", "view", head.pr, "-R", repo, "--json", "headRefOid,isDraft,isCrossRepository,state"],
        token,
        true,
      ),
    );
    if (pr.state !== "OPEN" || !verifiable(pr) || pr.headRefOid !== head.sha) return null;
  } else {
    sha = JSON.parse(gh(["api", `repos/${repo}/commits/main`], token, true)).sha;
  }
  const statuses = JSON.parse(
    gh(
      ["api", "--paginate", "--slurp", `repos/${repo}/commits/${sha}/statuses?per_page=100`],
      token,
      true,
    ),
  ).flat();
  return needsRun(statuses) ? { ...head, sha } : null;
}

/** Open, verifiable PR heads (oldest PR first), then main's head. */
async function heads(repo) {
  const token = await botNetwork.mintToken();
  const fields = "number,headRefOid,isDraft,isCrossRepository";
  const prs = JSON.parse(
    gh(
      ["pr", "list", "-R", repo, "--state", "open", "--limit", "200", "--json", fields],
      token,
      true,
    ),
  )
    .filter(verifiable)
    .toSorted((a, b) => a.number - b.number)
    .map((p) => ({ sha: p.headRefOid, pr: String(p.number) }));
  return [...prs, { sha: "main" }];
}

function pruneLogs(s) {
  const logs = join(s.home, "logs");
  if (!existsSync(logs)) return;
  for (const file of readdirSync(logs)) {
    const path = join(logs, file);
    if (Date.now() - statSync(path).mtimeMs > LOG_KEEP_MS) rmSync(path, { force: true });
  }
}

/** Runs `fn` holding the box's verify lock; false when another verify holds it. */
async function locked(s, fn) {
  const unlock = lock(s);
  if (!unlock) return false;
  process.once("exit", unlock);
  try {
    await fn();
  } finally {
    process.off("exit", unlock);
    unlock();
  }
  return true;
}

async function once(repo, s) {
  pruneLogs(s);
  let failed = 0;
  for (const listed of await heads(repo)) {
    if (stopping) break;
    try {
      const head = await currentHead(repo, listed);
      if (!head) continue;
      let entry;
      if (!(await locked(s, async () => (entry = await verify({ repo, ...head }, s))))) {
        process.stderr.write(
          "stackra-verify: another verify holds the lock; the next pass retries\n",
        );
        return failed;
      }
      process.stdout.write(`${entry.state} ${repo}@${head.sha}${head.pr ? ` #${head.pr}` : ""}\n`);
    } catch (error) {
      failed++;
      process.stderr.write(`stackra-verify: ${repo}@${listed.sha}: ${error.message}\n`);
    }
  }
  return failed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    process.stderr.write(
      "usage: stackra-verify.mjs run --sha <sha> [--pr <n>] [--in-place] | once | daemon [--interval <s>]  [-R owner/repo]\n",
    );
    process.exit(2);
  }
  const s = settings();
  const problem = hostProblem(s);
  if (problem) {
    process.stderr.write(`stackra-verify: ${problem}\n`);
    process.exit(1);
  }
  // A stop signal ends the running verify through sudo and `timeout`, which signal the whole process group; the
  // verify then records `error` (service stopped) and cleans up. A second signal exits at once.
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  try {
    if (options.verb === "run") {
      let entry;
      const ran = await locked(
        s,
        async () =>
          (entry = await verify(
            { repo: options.repo, sha: options.sha, pr: options.pr, inPlace: options.inPlace },
            s,
          )),
      );
      if (!ran) throw new Error("another verify holds the lock on this box; try again later");
      process.stdout.write(`${entry.state} ${options.repo}@${options.sha}\n`);
    } else if (options.verb === "once") {
      let failed = 0;
      for (const repo of options.repos) failed += await once(repo, s);
      process.exitCode = failed ? 1 : 0;
    } else {
      while (!isStopping()) {
        for (const repo of options.repos)
          await once(repo, s).catch((error) =>
            process.stderr.write(`stackra-verify: ${error.message}\n`),
          );
        if (!isStopping()) await sleep(options.interval * 1000);
      }
    }
  } catch (error) {
    process.stderr.write(`stackra-verify: ${error.message}\n`);
    process.exitCode = 1;
  }
}
