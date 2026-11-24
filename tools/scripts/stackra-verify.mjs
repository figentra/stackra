#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the Stackra verify service (STA-2761, replaces the merge-now rule STA-2083). For a head SHA it checks the
 *   exact commit out in a clean worktree, runs `pnpm install --frozen-lockfile && pnpm verify` (format, lint,
 *   typecheck, test, build, validate, boundaries, knip), and records the result three ways: a commit status
 *   `stackra/verify` posted as stackra-bot, a commit comment with the log tail and the failing names (the status
 *   links to it), and a ledger line (SHA, command, result, duration, failing names). `pr-merge.mjs` refuses a merge
 *   without a green `stackra/verify` on the exact head.
 *   Verbs:
 *     run --sha <sha> [--pr <n>] [--in-place]   verify one SHA (`--in-place`: the current checkout, for a runner job)
 *     once                                      verify every open non-draft PR head and main's head that lacks a result
 *     daemon [--interval <s>]                   `once`, then again every interval (default 300 s)
 *   Common: [-R owner/repo] (default figentra/stackra); `once` and `daemon` take -R more than once (core and template).
 *   The lock is taken per verify, so one daemon serves every repository in turn.
 * Boundary: one verify at a time (a lock directory), under `nice` and pinned to at most STACKRA_VERIFY_CORES cores
 *   (default 8) with `taskset`, so the box's other lanes keep their room. Testcontainers containers a run started are
 *   removed with their volumes after it. Writes only under STACKRA_VERIFY_HOME (default /work/stackra/verify):
 *   mirror/<repo>, worktrees/, logs/, ledger/.
 * Runtime: node (Linux for taskset; elsewhere it runs without the core pin).
 * Governing contract: ADR 0119 (merge policy); ADR 0523 (decision 3); STA-2761.
 * Secrets: the bot token is minted in-process (bot-token.mjs) and stays in the gh child's environment; the verify
 *   itself gets an environment with every secret name removed (`childEnv`), and fork PRs are never run
 *   (`verifiable`). Logs are scrubbed of token shapes before they leave the box. Run the verify under its own Unix
 *   user where the box allows it: a same-user process can read the daemon's environment from /proc.
 * Exit: 0 every verify recorded (pass or fail), 1 a verify could not be recorded, 2 usage.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as botNetwork from "./bot-token.mjs";
import { gh, latestVerify, VERIFY_CONTEXT } from "./pr-merge.mjs";

export const DEFAULT_REPO = "figentra/stackra";
export const COMMAND = "pnpm install --frozen-lockfile && pnpm verify";
/** A `pending` status older than this is a run that died; the next pass runs the SHA again. */
export const STALE_PENDING_MS = 3 * 60 * 60 * 1000;
/** A verify that runs longer than this is stopped and recorded as `error`. */
export const RUN_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const TAIL_LINES = 80;

/** `<verb> [flags]` → options, or null on a usage error. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--");
  const verb = args.shift();
  if (!["run", "once", "daemon"].includes(verb)) return null;
  const out = { verb, repos: [], inPlace: false, interval: 300 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-R" || a === "--repo") out.repos.push(args[++i] ?? "");
    else if (a === "--sha") out.sha = args[++i] ?? "";
    else if (a === "--pr") out.pr = args[++i] ?? "";
    else if (a === "--interval") out.interval = Number(args[++i]);
    else if (a === "--in-place") out.inPlace = true;
    else return null;
  }
  if (out.repos.length === 0) out.repos.push(DEFAULT_REPO);
  if (!out.repos.every((r) => /^[\w.-]+\/[\w.-]+$/.test(r))) return null;
  if (verb === "run" && out.repos.length !== 1) return null;
  out.repo = out.repos[0];
  if (out.pr !== undefined && !/^\d+$/.test(out.pr)) return null;
  if (verb === "run" && !/^[0-9a-f]{40}$/.test(out.sha ?? "")) return null;
  if (verb !== "run" && (out.sha || out.inPlace)) return null;
  if (!Number.isFinite(out.interval) || out.interval < 30) return null;
  return out;
}

/**
 * Whether a head needs a verify: no `stackra/verify` yet, or a `pending` one older than STALE_PENDING_MS (its run
 * died). A recorded success, failure or error stands until the head moves.
 */
export function needsRun(statuses, now = Date.now()) {
  const last = latestVerify(statuses);
  if (!last) return true;
  if (last.state !== "pending") return false;
  return now - Date.parse(last.created_at) > STALE_PENDING_MS;
}

/** Terminal colour and cursor codes (ESC [ … letter), built from the ESC code point so the source holds no control character. */
/**
 * Which open PRs the service runs: not drafts, and never a fork's. A fork's code is anyone's code; on the box it
 * would run as the service's user, next to the bot identity. A fork PR is verified only after a maintainer pushes
 * its commits to a branch here.
 */
export const verifiable = (pr) => !pr.isDraft && pr.isCrossRepository === false;

/** Names that never reach the verify's environment: the bot identity and anything that names a secret. */
const SECRET_NAME =
  /^(STACKRA_BOT_|GH_|GITHUB_TOKEN$|SOPS_|AGE_|AWS_|NPM_TOKEN$|NODE_AUTH_TOKEN$)|(TOKEN|SECRET|PASSWORD|PRIVATE_KEY|API_KEY)/i;

/** The verify's environment: this process's, minus every secret name, plus the CI flags. */
export function childEnv(env = process.env) {
  const out = {};
  for (const [name, value] of Object.entries(env)) if (!SECRET_NAME.test(name)) out[name] = value;
  return { ...out, CI: "1", TURBO_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" };
}

const ANSI = new RegExp(`${String.fromCodePoint(27)}\\[[0-9;?]*[A-Za-z]`, "g");
/** Token shapes never leave the box, whatever a tool printed. */
export const redact = (text) =>
  text
    .replaceAll(ANSI, "")
    .replaceAll(/\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, "[redacted]")
    .replaceAll(
      /(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/g,
      "$1 [redacted] $2",
    );

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
export function statusDescription({ state, durationMs, failing, box }) {
  const verdict = state === "success" ? "passed" : state === "error" ? "could not run" : "failed";
  const names = state === "failure" && failing.length ? `: ${failing.join(", ")}` : "";
  const text = `pnpm verify ${verdict} in ${formatDuration(durationMs)} on ${box}${names}`;
  return text.length > 140 ? `${text.slice(0, 139)}…` : text;
}

/** The commit comment: verdict, failing names and the scrubbed log tail. */
export function commentBody({ sha, pr, state, durationMs, failing, box, log, command }) {
  const tail = redact(log)
    .split("\n")
    .slice(-TAIL_LINES)
    .map((l) => (l.length > 300 ? `${l.slice(0, 299)}…` : l))
    .join("\n");
  return [
    `**${VERIFY_CONTEXT}: ${state}** on \`${sha}\`${pr ? ` (#${pr})` : ""}`,
    "",
    `- Command: \`${command}\``,
    `- Box: ${box}, ${formatDuration(durationMs)}`,
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
export function ledgerEntry({ repo, sha, pr, state, durationMs, failing, box, command, at, link }) {
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
    link,
  };
  const md = `| ${at} | ${repo} | ${pr ? `#${pr}` : "main"} | \`${sha.slice(0, 12)}\` | \`${command}\` | ${state} | ${formatDuration(durationMs)} | ${failing.join(", ") || "-"} | ${link ?? "-"} |`;
  return { json, md };
}

export const LEDGER_HEADER =
  "| at | repo | PR | SHA | command | result | duration | failing | log |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |";

// ---- side effects below -------------------------------------------------------------------------------------

const home = () => process.env.STACKRA_VERIFY_HOME ?? "/work/stackra/verify";
const cores = () => Math.max(1, Number(process.env.STACKRA_VERIFY_CORES ?? 8));
const box = () => process.env.STACKRA_VERIFY_BOX ?? hostname();

function sh(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
  if (r.error) throw new Error(`${cmd} ${args.join(" ")}: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout;
}

/** One verify at a time on this box: an exclusive lock directory naming its pid; a dead pid's lock is taken over. */
function lock() {
  const dir = join(home(), "lock");
  mkdirSync(home(), { recursive: true });
  try {
    mkdirSync(dir);
  } catch {
    const pid = Number(readFileSync(join(dir, "pid"), "utf8").trim() || 0);
    let alive = false;
    try {
      process.kill(pid, 0);
      alive = true;
    } catch {
      // ESRCH: the pid that held the lock is gone, so its lock is stale and this run takes it over.
    }
    if (alive) return null;
  }
  writeFileSync(join(dir, "pid"), String(process.pid));
  return () => rmSync(dir, { recursive: true, force: true });
}

const testcontainers = () => {
  const r = spawnSync("docker", ["ps", "-aq", "--filter", "label=org.testcontainers=true"], {
    encoding: "utf8",
  });
  return r.status === 0 ? new Set(r.stdout.split("\n").filter(Boolean)) : new Set();
};

/** Removes, with their volumes, the testcontainers this run started; never one that was there before it. */
function cleanContainers(before) {
  const started = [...testcontainers()].filter((id) => !before.has(id));
  if (started.length) spawnSync("docker", ["rm", "-f", "-v", ...started], { encoding: "utf8" });
  return started.length;
}

function runCommand(cwd, logPath) {
  const pin = process.platform === "linux" ? ["taskset", "-c", `0-${cores() - 1}`] : [];
  const [cmd, ...args] = ["nice", "-n", "10", ...pin, "sh", "-c", COMMAND];
  return new Promise((resolve) => {
    const out = createWriteStream(logPath);
    const child = spawn(cmd, args, {
      cwd,
      env: childEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      // Its own process group, so the timeout stops turbo, vitest and every grandchild, not only `nice`.
      detached: true,
    });
    child.stdout.pipe(out, { end: false });
    child.stderr.pipe(out, { end: false });
    const stopGroup = (signal) => {
      try {
        process.kill(-child.pid, signal);
      } catch {
        // ESRCH: the group has already exited.
      }
    };
    const timer = setTimeout(() => {
      stopGroup("SIGTERM");
      setTimeout(() => stopGroup("SIGKILL"), 30_000).unref();
    }, RUN_TIMEOUT_MS);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      out.end(() => resolve({ code, signal }));
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      out.end(() => resolve({ code: null, signal: null, error }));
    });
  });
}

function postStatus(repo, sha, state, description, targetUrl, token) {
  const fields = [
    "-f",
    `state=${state}`,
    "-f",
    `context=${VERIFY_CONTEXT}`,
    "-f",
    `description=${description}`,
  ];
  if (targetUrl) fields.push("-f", `target_url=${targetUrl}`);
  gh(["api", "--method", "POST", `repos/${repo}/statuses/${sha}`, ...fields], token);
}

/** Verifies one SHA and records it. Returns the ledger JSON entry. */
export async function verify({ repo, sha, pr, inPlace = false }) {
  const started = Date.now();
  const name = repo.replace("/", "__");
  const logs = join(home(), "logs");
  const ledgerDir = join(home(), "ledger");
  mkdirSync(logs, { recursive: true });
  mkdirSync(ledgerDir, { recursive: true });
  const logPath = join(logs, `${name}-${sha}.log`);

  postStatus(
    repo,
    sha,
    "pending",
    `pnpm verify running on ${box()}`,
    undefined,
    await botNetwork.mintToken(),
  );

  let cwd = process.cwd();
  let worktree;
  let result;
  const before = testcontainers();
  try {
    if (!inPlace) {
      const mirror = join(home(), "mirror", name);
      if (!existsSync(join(mirror, ".git")))
        sh("git", ["clone", "--quiet", `https://github.com/${repo}.git`, mirror]);
      const refs = ["+refs/heads/main:refs/remotes/origin/main"];
      if (pr) refs.push(`+refs/pull/${pr}/head:refs/verify/pr-${pr}`);
      sh("git", ["-C", mirror, "fetch", "--quiet", "origin", ...refs]);
      worktree = join(home(), "worktrees", `${name}-${sha}`);
      rmSync(worktree, { recursive: true, force: true });
      sh("git", ["-C", mirror, "worktree", "prune"]);
      sh("git", ["-C", mirror, "worktree", "add", "--quiet", "--detach", worktree, sha]);
      cwd = worktree;
    }
    result = await runCommand(cwd, logPath);
  } catch (error) {
    result = { code: null, signal: null, error };
    appendFileSync(logPath, `\nstackra-verify: ${error.message}\n`);
  } finally {
    const removed = cleanContainers(before);
    if (removed) appendFileSync(logPath, `\nstackra-verify: removed ${removed} testcontainers\n`);
    if (worktree) {
      rmSync(worktree, { recursive: true, force: true });
      spawnSync("git", ["-C", join(home(), "mirror", name), "worktree", "prune"]);
    }
  }

  const durationMs = Date.now() - started;
  const log = existsSync(logPath) ? readFileSync(logPath, "utf8") : "";
  const state = result.code === 0 ? "success" : result.error || result.signal ? "error" : "failure";
  const failing = state === "success" ? [] : failingNames(log);
  const facts = { sha, pr, state, durationMs, failing, box: box(), log, command: COMMAND };

  // A fresh token: a verify can outlive the one minted at the start (an installation token lasts an hour).
  const token = await botNetwork.mintToken();
  const comment = JSON.parse(
    gh(
      [
        "api",
        "--method",
        "POST",
        `repos/${repo}/commits/${sha}/comments`,
        "-f",
        `body=${commentBody(facts)}`,
      ],
      token,
    ),
  );
  postStatus(repo, sha, state, statusDescription(facts), comment.html_url, token);

  const { json, md } = ledgerEntry({
    ...facts,
    repo,
    at: new Date().toISOString(),
    link: comment.html_url,
  });
  appendFileSync(join(ledgerDir, `${name}.jsonl`), `${JSON.stringify(json)}\n`);
  const mdPath = join(ledgerDir, `${name}.md`);
  if (!existsSync(mdPath)) writeFileSync(mdPath, `# ${repo} verify ledger\n\n${LEDGER_HEADER}\n`);
  appendFileSync(mdPath, `${md}\n`);
  return json;
}

/** The heads that need a verify: open non-draft PRs first (oldest first), then main's head. */
async function pendingHeads(repo) {
  const token = await botNetwork.mintToken();
  const prs = JSON.parse(
    gh(
      [
        "pr",
        "list",
        "-R",
        repo,
        "--state",
        "open",
        "--limit",
        "200",
        "--json",
        "number,headRefOid,isDraft,isCrossRepository",
      ],
      token,
      true,
    ),
  )
    .filter(verifiable)
    .toSorted((a, b) => a.number - b.number)
    .map((p) => ({ sha: p.headRefOid, pr: String(p.number) }));
  const main = JSON.parse(gh(["api", `repos/${repo}/commits/main`], token, true)).sha;
  const heads = [...prs, { sha: main }];
  const out = [];
  for (const head of heads) {
    const statuses = JSON.parse(
      gh(
        ["api", "--paginate", "--slurp", `repos/${repo}/commits/${head.sha}/statuses?per_page=100`],
        token,
        true,
      ),
    ).flat();
    if (needsRun(statuses)) out.push(head);
  }
  return out;
}

/** Runs `fn` holding the box's verify lock; false when another verify holds it. */
async function locked(fn) {
  const unlock = lock();
  if (!unlock) return false;
  const release = () => unlock();
  process.once("exit", release);
  try {
    await fn();
  } finally {
    process.off("exit", release);
    unlock();
  }
  return true;
}

async function once(repo) {
  let failed = 0;
  for (const head of await pendingHeads(repo)) {
    try {
      let entry;
      if (!(await locked(async () => (entry = await verify({ repo, ...head }))))) {
        process.stderr.write(
          "stackra-verify: another verify holds the lock; the next pass retries\n",
        );
        return failed;
      }
      process.stdout.write(`${entry.state} ${repo}@${head.sha}${head.pr ? ` #${head.pr}` : ""}\n`);
    } catch (error) {
      failed++;
      process.stderr.write(`stackra-verify: ${repo}@${head.sha}: ${error.message}\n`);
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
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130));
  try {
    if (options.verb === "run") {
      let entry;
      const ran = await locked(
        async () =>
          (entry = await verify({
            repo: options.repo,
            sha: options.sha,
            pr: options.pr,
            inPlace: options.inPlace,
          })),
      );
      if (!ran) throw new Error("another verify holds the lock on this box; try again later");
      process.stdout.write(`${entry.state} ${options.repo}@${options.sha}\n`);
    } else if (options.verb === "once") {
      let failed = 0;
      for (const repo of options.repos) failed += await once(repo);
      process.exitCode = failed ? 1 : 0;
    } else {
      for (;;) {
        for (const repo of options.repos)
          await once(repo).catch((error) =>
            process.stderr.write(`stackra-verify: ${error.message}\n`),
          );
        await new Promise((resolve) => {
          setTimeout(resolve, options.interval * 1000);
        });
      }
    }
  } catch (error) {
    process.stderr.write(`stackra-verify: ${error.message}\n`);
    process.exitCode = 1;
  }
}
