#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the box deploy service (STA-2783, ADR 0536), Stackra's recorded exception to "Runway + CI, no hand
 *   deploys" while figentra's GitHub Actions is billing-locked. Built OFF: nothing deploys until its switch is on.
 *   Two paths, each a target with its own lock, ledger lines and switch:
 *   (1) Encore staging: app `stackra-nzk2`, environment `staging` and nothing else (any other environment is refused
 *       in code before a setting is read). Mints a one-hour token from the staging OAuth client (Encore's Deployer
 *       role), triggers a rollout of the exact SHA (`POST /api/apps/<app>/envs/staging/rollouts {sha}`), follows it
 *       to its end, then requires `GET <staging>/readyz` to answer 200. A failed rollout or smoke is recorded failed
 *       and rolled back by a rollout of the last SHA the ledger records as good (Encore has no rollback endpoint; a
 *       rollout of an earlier commit is its rollback). A rollout that proposes infrastructure changes stops for the
 *       owner: the service never approves or rejects them.
 *   (2) The Cloudflare Workers registry, static, turbo-cache and edge, from runway.yaml's
 *       `targets.cloudflare-workers.members` (a Worker that is not a member there is refused). Per Worker and SHA it
 *       reproduces CI's caller workflow and runway-cloudflare-workers.yml step for step (install, build, gen, the
 *       member build, the binding-id swap, runway's rendering of the operational settings with the deployed SHA's own
 *       @stackra/runway, `d1 migrations apply --remote`, `versions upload --message <sha>`), with these differences:
 *       a D1 migration runs only when every pending statement is additive (d1-migration-gate.mjs; anything else
 *       stops and is recorded "needs the owner"); the new version first joins the deployment at 0% beside the one
 *       serving at 100% (a version override only reaches a version that is in the current deployment, and every
 *       member keeps `previewUrls: false`), where the smoke suite (stackra-deploy-smoke.mjs) runs through
 *       `Cloudflare-Workers-Version-Overrides`; then promotion in STACKRA_DEPLOY_STEPS (10 then 100), held
 *       STACKRA_DEPLOY_HOLD_SECONDS and smoked again at each step; any failure puts the old version back at 100%. The
 *       Worker's secrets are not handled here: `wrangler versions upload` inherits a Worker's secrets from the
 *       previous version (wrangler 4.148.0 sets keep_bindings secret_text and secret_key), so the box holds no
 *       REGISTRY_SIGNING_KEY or EDGE_SIGNING_SECRET; rotating one stays CI's or the owner's. Promotion mode per Worker
 *       (STACKRA_DEPLOY_PROMOTION): `auto` (the owner's choice of 2026-11-25 for all four, ADR 0536) or `approve`
 *       (stop after the 0% smoke until an approval file written by the approver user names the SHA and the version;
 *       the approval is recorded in the ledger).
 *   Both deploy only commits on origin/main with a green `stackra/verify` check run from the stackra-verify App
 *   (5907714) at that exact SHA; while STACKRA_DEPLOY_ACCEPT_BOX_GREEN is on (until verify is live), a box-green
 *   record at that SHA stands in for it. The timer (`once`) deploys main's head: Encore whenever it moved, a Worker
 *   only when a file of its runway unit or of its workspace dependency closure (pnpm-lock importers, `link:` deps)
 *   changed since the last SHA the ledger records as deployed; the first box deploy of a target is run by hand.
 *   Verbs: preflight [encore|workers]  |  once [--dry-run]  |  status  |  workers run --worker <w> --sha <sha>
 *          [--dry-run]  |  encore run --sha <sha> [--dry-run]  |  approve --worker <w> --sha <sha> --version <id>
 * Boundary: runs git, sudo (install and build as the build user), node (wrangler from the deployed tree, and a child
 *   that loads the tree's @stackra/runway to render the config) and flock; calls the GitHub REST API (check runs),
 *   the Encore Cloud API and the Workers' own URLs. Never touches Encore production: the environment is a constant
 *   checked before anything else. Never writes a secret into argv, a child's environment beyond what wrangler needs,
 *   a log, the ledger or a file other than wrangler's private run folder.
 * Runbook (box 1), what Lukas sets up:
 *   - Users: `stackra-deploy` (the deploy user: no login shell, no sudo except the rule below, never `build`, never
 *     `stackra-verify` or `stackra-verifyd`), `stackra-deploy-build` (installs and builds the SHA's tree; holds no
 *     secret) and `stackra-deploy-approver` (writes approval files; only needed when a Worker is set to approve).
 *     sudoers: `stackra-deploy ALL=(stackra-deploy-build) NOPASSWD: /usr/bin/env`.
 *   - Folders: STACKRA_DEPLOY_HOME=/work/stackra/deploy, 0700 stackra-deploy (ledger/, locks/, state/, run/);
 *     STACKRA_DEPLOY_MIRROR=/work/stackra/deploy-mirror.git, 0755 stackra-deploy (main and tags only, nothing
 *     secret; the build user clones from it); STACKRA_DEPLOY_WORK=/work/stackra/deploy-work, 0755 stackra-deploy-build (the trees);
 *     /etc/stackra-deploy 0750 root:stackra-deploy holding the secret files, each 0400 stackra-deploy;
 *     STACKRA_DEPLOY_BOX_GREEN_DIR (box-green records, owned by STACKRA_DEPLOY_BOX_GREEN_OWNER, the user that runs
 *     the box trains) and STACKRA_DEPLOY_APPROVALS (0755 stackra-deploy-approver).
 *   - The service clone /work/stackra/deploy-service (main, `pnpm install --frozen-lockfile --ignore-scripts
 *     --filter .` for `yaml`), owned by stackra-deploy.
 *   - systemd: `stackra-deploy.service` (Type=oneshot, User=stackra-deploy, WorkingDirectory=the service clone,
 *     ExecStartPre=/usr/bin/git pull --ff-only origin main, ExecStart=/usr/local/bin/node
 *     tools/scripts/stackra-deploy.mjs once, EnvironmentFile=/etc/stackra-deploy/settings.env (settings only, no
 *     secret), Nice=10) and `stackra-deploy.timer` (OnUnitActiveSec=5min). Before the first timer run: `preflight`,
 *     then each target's first deploy by hand (`workers run --worker <w> --sha <sha>`, `encore run --sha <sha>`)
 *     watched and recorded.
 *   - Settings (none secret): STACKRA_DEPLOY_WORKERS and STACKRA_DEPLOY_ENCORE (the switches: exactly `on`, else
 *     off; a typo is a preflight problem), STACKRA_DEPLOY_ACCEPT_BOX_GREEN (`on` until stackra/verify is live, then
 *     `off`), STACKRA_DEPLOY_PROMOTION (`registry=auto,static=auto,turbo-cache=auto,edge=auto` by default),
 *     STACKRA_DEPLOY_STEPS (10,100), STACKRA_DEPLOY_HOLD_SECONDS (300), STACKRA_DEPLOY_BUILD_AS, STACKRA_DEPLOY_BUILD_HOME,
 *     STACKRA_DEPLOY_APPROVER, STACKRA_DEPLOY_BOX_GREEN_OWNER, STACKRA_DEPLOY_WORKER_VARS_FILE (the binding ids and
 *     vars CI reads from the `registry` environment's variables, as JSON: REGISTRY_D1_DATABASE_ID,
 *     REGISTRY_KV_NAMESPACE_ID, REGISTRY_READ_ONLY; ids, not secrets, but not writable by others),
 *     STACKRA_DEPLOY_ENCORE_URL (the staging base URL of /readyz), and the file settings below.
 *   What the owner creates and places (never pasted into a chat, a command or a file in a repository): through
 *   ~/Secrets-inbox into figentra/secrets, scope ci/deploy/box1, from where Lukas installs each value as a 0400 file:
 *   - STACKRA_DEPLOY_ENCORE_CLIENT_FILE: an Encore OAuth client of app stackra-nzk2 with the Deployer role, made for
 *     this box only, as JSON {"client_id","client_secret"}. Encore's OAuth clients carry a role, not an
 *     environment, so the token could deploy any environment of the app: the staging-only rule is this code's
 *     (ENCORE_ENV, tested), and the owner revokes the client to stop it at once.
 *   - STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE: an account API token with Workers Scripts Edit, D1 Edit and Account
 *     Settings Read on account d861f9ac9df28b7f0b1298cc0c89bc9d, Client IP Address Filtering set to box 1's egress
 *     address only, and an expiry (TTL) the owner picks. Blast radius: Cloudflare cannot scope Workers Scripts Edit
 *     to named scripts, so the token can change every Worker and D1 database of the account, which also holds Agent
 *     Desk / Figentra Flow's Workers and the tax-practice Worker; the IP filter and the expiry are what bound it.
 *   - STACKRA_DEPLOY_TURBO_TOKEN_FILE: the turbo cache token (ci/build/turbo TURBO_TOKEN), read only by the
 *     turbo-cache smoke. STACKRA_DEPLOY_GITHUB_TOKEN_FILE (optional): a read-only token for check runs; without it
 *     the public API's rate limit applies.
 *   Switch on: set the switch to `on` in settings.env after `preflight` passes and the first hand run is recorded;
 *   switch off: set it to `off` (the next run refuses), or stop the timer; the owner revokes the Encore client or the
 *   Cloudflare token to cut it off from outside. A run in flight finishes or rolls back; nothing restarts it.
 * Runtime: node 24 on Linux with git, flock and sudo.
 * Governing contract: ADR 0536 (box deploys); ADR 0468 (amended by 0536); ADR 0170; ADR 0352; ADR 0453; ADR 0519;
 *   ADR 0525 (secrets); STA-2783.
 * Secrets: each read from its 0400 file of the deploy user at the moment it is needed: the Encore client secret
 *   goes only in the token request's body; the Cloudflare token only into wrangler's environment
 *   (CLOUDFLARE_API_TOKEN); the turbo token only into the turbo-cache smoke's header; the GitHub token only into the
 *   check-run request's header. The build user's environment is PATH, HOME and CI only. Every output path is
 *   scrubbed of the values read.
 * Exit: 0 done (deployed, skipped, waiting for approval, dry run), 1 refused, failed or needs the owner, 2 usage,
 *   75 the target's lock is held.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname, userInfo } from "node:os";
import { dirname, isAbsolute, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAllDocuments, parse as parseYaml } from "yaml";
import { migrationVerdict, pendingMigrations } from "./d1-migration-gate.mjs";
import { registryBaseline, registrySample, smokeWorker } from "./stackra-deploy-smoke.mjs";

// ---- constants --------------------------------------------------------------------------------------------------

/** The check run that proves a SHA passed main's gate, and the App that alone may post it (pr-merge.mjs). */
export const VERIFY_CHECK = "stackra/verify";
export const VERIFY_APP_ID = 5_907_714;
/** The Encore app and the one environment this service may deploy. */
export const ENCORE_APP = "stackra-nzk2";
export const ENCORE_ENV = "staging";
/** The Workers this service may deploy; each must also be a runway.yaml member. */
export const WORKER_KEYS = Object.freeze(["registry", "static", "turbo-cache", "edge"]);
/** The owner's choice of 2026-11-25 (ADR 0536): all four promote automatically when every check passes. */
export const DEFAULT_PROMOTION = Object.freeze({
  registry: "auto",
  static: "auto",
  "turbo-cache": "auto",
  edge: "auto",
});
/** The reusable workflow whose steps the box reproduces, and runway's driver whose deploy steps it mirrors. */
export const PROVIDER_WORKFLOW = ".github/workflows/runway-cloudflare-workers.yml";
export const RUNWAY_DRIVER =
  "packages/developer/runway/src/node/drivers/cloudflare-workers-provider.driver.ts";
export const RUNWAY_DIST = "packages/developer/runway/dist/index.mjs";
/** Users the deploy service must never run as. */
export const FORBIDDEN_USERS = Object.freeze([
  "root",
  "build",
  "stackra-verify",
  "stackra-verifyd",
]);
export const LOCK_HELD_EXIT = 75;
export const LEDGER_SCHEMA = "stackra.deploy/1";
export const BOX_GREEN_SCHEMA = "stackra.box-green/1";
export const APPROVAL_SCHEMA = "stackra.deploy-approval/1";

const SHA = /^[0-9a-f]{40}$/;
const VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** A binding id wrangler accepts; nothing that could leave a JSON string (runway's driver uses the same). */
const BINDING_ID = /^[A-Za-z0-9-]+$/;
const VAR_NAME = /^[A-Z][A-Z0-9_]*$/;
const USER_NAME = /^[a-z_][a-z0-9_-]*$/;
/** The version line `wrangler versions upload` prints. */
const UPLOADED = /(?:Worker|Current) Version ID:\s*([0-9a-f-]{36})/;
/** A string, or a `//` or block comment of JSONC; strings are kept (runway's driver strips the same way). */
const JSONC_TOKEN = /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

// ---- output hygiene ---------------------------------------------------------------------------------------------

const ANSI = new RegExp(`${String.fromCodePoint(27)}\\[[0-9;?]*[A-Za-z]`, "g");
const SECRET_SHAPES = [
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\bnpm_[A-Za-z0-9]{36}\b/g,
  /(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/g,
];
const SECRET_VALUES = new Set();

/** Registers a value read from a secret file, so `scrub` removes it (plain, base64, URL-encoded). */
export function registerSecret(value) {
  const v = String(value ?? "").trim();
  if (v.length < 8) return;
  for (const form of [
    v,
    Buffer.from(v).toString("base64"),
    Buffer.from(v).toString("base64url"),
    encodeURIComponent(v),
  ])
    if (form.length >= 8) SECRET_VALUES.add(form);
}

/** Forgets every registered value (tests). */
export const clearSecrets = () => SECRET_VALUES.clear();

/** No colour codes, no registered secret, no token or key shape. */
export function scrub(text) {
  let out = String(text).replaceAll(ANSI, "").replaceAll("\r", "");
  for (const secret of [...SECRET_VALUES].toSorted((a, b) => b.length - a.length))
    out = out.replaceAll(secret, "[redacted]");
  for (const shape of SECRET_SHAPES) out = out.replaceAll(shape, "[redacted]");
  return out;
}

/** The last `max` characters of a scrubbed output, for a ledger reason. */
const tail = (text, max = 400) => {
  const clean = scrub(text).trim();
  return clean.length <= max ? clean : `…${clean.slice(-max)}`;
};

// ---- arguments --------------------------------------------------------------------------------------------------

/** `<verb> [target] [flags]` → options, or null on a usage error. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--");
  const verb = args.shift();
  const out = { verb, dryRun: false, trigger: "manual" };
  if (verb === "workers" || verb === "encore") {
    if (args.shift() !== "run") return null;
    out.target = verb;
    out.verb = "run";
  } else if (verb === "preflight") {
    if (args[0] === "workers" || args[0] === "encore") out.target = args.shift();
  } else if (!["once", "status", "approve"].includes(verb)) return null;
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--sha") out.sha = args[(i += 1)] ?? "";
    else if (a === "--worker") out.worker = args[(i += 1)] ?? "";
    else if (a === "--version") out.version = args[(i += 1)] ?? "";
    else if (a === "--trigger") out.trigger = args[(i += 1)] ?? "";
    else if (a === "--dry-run") out.dryRun = true;
    else return null;
  }
  if (!["manual", "timer"].includes(out.trigger)) return null;
  if (out.verb === "run" || out.verb === "approve") {
    if (!SHA.test(out.sha ?? "")) return null;
    if (out.target !== "encore" && !WORKER_KEYS.includes(out.worker ?? "")) return null;
    if (out.verb === "approve") out.target = "workers";
  } else if (out.sha !== undefined || out.worker !== undefined) return null;
  if (out.verb === "approve" && !VERSION_ID.test(out.version ?? "")) return null;
  if (out.verb !== "approve" && out.version !== undefined) return null;
  if (out.target === "encore" && out.worker !== undefined) return null;
  return out;
}

// ---- settings ---------------------------------------------------------------------------------------------------

/** `on`, `off` or `invalid` for a switch: only exactly `on` turns a path on; unset is off. */
export const switchOf = (value) =>
  value === undefined || value === "" || value === "off"
    ? "off"
    : value === "on"
      ? "on"
      : "invalid";

/** The per-Worker promotion modes: the defaults with `name=mode` pairs laid over them; null when malformed. */
export function parsePromotion(value) {
  const modes = { ...DEFAULT_PROMOTION };
  if (value === undefined || value.trim() === "") return modes;
  for (const pair of value.split(",")) {
    const [name, mode, extra] = pair.trim().split("=");
    if (extra !== undefined || !WORKER_KEYS.includes(name) || !["auto", "approve"].includes(mode))
      return null;
    modes[name] = mode;
  }
  return modes;
}

/** The promotion steps (percent of traffic), ascending and ending at 100; null when malformed. */
export function parseSteps(value) {
  const steps = String(value ?? "10,100")
    .split(",")
    .map((s) => s.trim());
  if (!steps.every((s) => /^\d{1,3}$/.test(s))) return null;
  const numbers = steps.map(Number);
  const ascending = numbers.every((n, i) => n > 0 && n <= 100 && (i === 0 || n > numbers[i - 1]));
  return ascending && numbers.at(-1) === 100 ? numbers : null;
}

/** A setting in seconds, as milliseconds. */
const seconds = (value, fallback) => (value === undefined ? fallback : Number(value)) * 1000;

/** The service settings from its environment. None is a secret; the `*File` settings name the secret files. */
export function settings(env = process.env) {
  const home = env.STACKRA_DEPLOY_HOME || "/work/stackra/deploy";
  return {
    home,
    box: env.STACKRA_DEPLOY_BOX || hostname(),
    repo: env.STACKRA_DEPLOY_REPO || "figentra/stackra",
    remote: env.STACKRA_DEPLOY_REMOTE || "https://github.com/figentra/stackra.git",
    // Outside the home (0700): the build user clones from it.
    mirror: env.STACKRA_DEPLOY_MIRROR || "/work/stackra/deploy-mirror.git",
    work: env.STACKRA_DEPLOY_WORK || "/work/stackra/deploy-work",
    path: env.STACKRA_DEPLOY_PATH || "/usr/local/bin:/usr/bin:/bin",
    buildAs: env.STACKRA_DEPLOY_BUILD_AS || null,
    buildHome: env.STACKRA_DEPLOY_BUILD_HOME || null,
    workers: switchOf(env.STACKRA_DEPLOY_WORKERS),
    encore: switchOf(env.STACKRA_DEPLOY_ENCORE),
    acceptBoxGreen: switchOf(env.STACKRA_DEPLOY_ACCEPT_BOX_GREEN),
    boxGreenDir: env.STACKRA_DEPLOY_BOX_GREEN_DIR || join(home, "box-green"),
    boxGreenOwner: env.STACKRA_DEPLOY_BOX_GREEN_OWNER || null,
    approver: env.STACKRA_DEPLOY_APPROVER || null,
    approvals: env.STACKRA_DEPLOY_APPROVALS || "/work/stackra/deploy-approvals",
    promotion: parsePromotion(env.STACKRA_DEPLOY_PROMOTION),
    steps: parseSteps(env.STACKRA_DEPLOY_STEPS),
    holdMs: seconds(env.STACKRA_DEPLOY_HOLD_SECONDS, 300),
    propagationMs: seconds(env.STACKRA_DEPLOY_PROPAGATION_SECONDS, 15),
    smokeAttempts: Number(env.STACKRA_DEPLOY_SMOKE_ATTEMPTS ?? 3),
    minSample: Number(env.STACKRA_DEPLOY_REGISTRY_MIN_SAMPLE ?? 3),
    cloudflareTokenFile: env.STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE || null,
    cloudflareAccountId: env.STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID || null,
    varsFile: env.STACKRA_DEPLOY_WORKER_VARS_FILE || null,
    turboTokenFile: env.STACKRA_DEPLOY_TURBO_TOKEN_FILE || null,
    githubTokenFile: env.STACKRA_DEPLOY_GITHUB_TOKEN_FILE || null,
    githubApi: env.STACKRA_DEPLOY_GITHUB_API || "https://api.github.com",
    encoreClientFile: env.STACKRA_DEPLOY_ENCORE_CLIENT_FILE || null,
    encoreApp: env.STACKRA_DEPLOY_ENCORE_APP || ENCORE_APP,
    encoreEnv: env.STACKRA_DEPLOY_ENCORE_ENV || ENCORE_ENV,
    encoreApi: env.STACKRA_DEPLOY_ENCORE_API || "https://api.encore.dev",
    encoreUrl: env.STACKRA_DEPLOY_ENCORE_URL || null,
    rolloutTimeoutMs: seconds(env.STACKRA_DEPLOY_ENCORE_ROLLOUT_MINUTES, 30) * 60,
    readyTimeoutMs: seconds(env.STACKRA_DEPLOY_READY_SECONDS, 300),
    pollMs: seconds(env.STACKRA_DEPLOY_POLL_SECONDS, 10),
  };
}

/** Refuses any Encore app or environment but stackra-nzk2 staging; the first check of the Encore path. */
export function assertEncoreTarget(app, environment) {
  if (environment !== ENCORE_ENV)
    throw new Error(
      `refused: the box deploys Encore environment "${ENCORE_ENV}" only, never "${environment}"`,
    );
  if (app !== ENCORE_APP)
    throw new Error(`refused: the box deploys Encore app "${ENCORE_APP}" only, never "${app}"`);
}

// ---- files and users --------------------------------------------------------------------------------------------

/** A file's owner and mode, or null when it does not exist; a symbolic link is reported as one. */
export function fileFacts(io, path) {
  try {
    return io.lstat(path);
  } catch {
    return null;
  }
}

/** Why a secret file may not be used: it must be a regular file owned by this user with mode 0400. */
export function secretFileProblem(io, label, path) {
  if (!path) return `${label} is not set`;
  const facts = fileFacts(io, path);
  if (!facts) return `${label} (${path}) does not exist`;
  if (facts.symlink || !facts.file) return `${label} (${path}) is not a regular file`;
  if (facts.uid !== io.uid) return `${label} (${path}) is not owned by the deploy user`;
  if ((facts.mode & 0o777) !== 0o400) return `${label} (${path}) must be mode 0400`;
  return null;
}

/** Reads a secret file after its checks, registers its value for scrubbing, and returns it. */
export function readSecret(io, label, path) {
  const problem = secretFileProblem(io, label, path);
  if (problem) throw new Error(problem);
  const value = io.readFile(path).trim();
  if (value === "") throw new Error(`${label} (${path}) is empty`);
  registerSecret(value);
  return value;
}

/** Why a trusted, non-secret file may not be used: regular, owned by `uids`, writable by its owner only. */
export function trustedFileProblem(io, label, path, uids) {
  const facts = fileFacts(io, path);
  if (!facts) return `${label} (${path}) does not exist`;
  if (facts.symlink || !facts.file) return `${label} (${path}) is not a regular file`;
  if (!uids.includes(facts.uid)) return `${label} (${path}) has an untrusted owner`;
  if ((facts.mode & 0o022) !== 0) return `${label} (${path}) is writable by its group or others`;
  return null;
}

/** The binding ids and vars from STACKRA_DEPLOY_WORKER_VARS_FILE: `{ NAME: "value" }`, strings only. */
export function readVars(io, s) {
  if (!s.varsFile) return {};
  const problem = trustedFileProblem(io, "STACKRA_DEPLOY_WORKER_VARS_FILE", s.varsFile, [
    0,
    io.uid,
  ]);
  if (problem) throw new Error(problem);
  const vars = JSON.parse(io.readFile(s.varsFile));
  if (!vars || typeof vars !== "object" || Array.isArray(vars))
    throw new Error("STACKRA_DEPLOY_WORKER_VARS_FILE is not a JSON object");
  for (const [name, value] of Object.entries(vars))
    if (!VAR_NAME.test(name) || typeof value !== "string" || value.includes("\n"))
      throw new Error(
        `STACKRA_DEPLOY_WORKER_VARS_FILE: ${name} is not a NAME with a one-line string`,
      );
  return vars;
}

// ---- preflight --------------------------------------------------------------------------------------------------

/**
 * Why this host may not run `target` (`workers` or `encore`); empty when it may. `dryRun` lets a path that is
 * switched off plan, never deploy.
 */
export function preflightProblems(s, io, target, { dryRun = false } = {}) {
  const problems = [];
  const name = target === "encore" ? "STACKRA_DEPLOY_ENCORE" : "STACKRA_DEPLOY_WORKERS";
  const state = target === "encore" ? s.encore : s.workers;
  if (state === "invalid") problems.push(`${name} must be exactly "on" or "off"`);
  else if (state !== "on" && !dryRun)
    problems.push(`${name} is not on: this deploy path is built OFF (ADR 0536)`);
  if (FORBIDDEN_USERS.includes(io.user) || io.uid === 0)
    problems.push(`the deploy service runs as its own user, never ${io.user}`);
  if (s.acceptBoxGreen === "invalid")
    problems.push('STACKRA_DEPLOY_ACCEPT_BOX_GREEN must be exactly "on" or "off"');
  if (s.acceptBoxGreen === "on") {
    if (!USER_NAME.test(s.boxGreenOwner ?? ""))
      problems.push(
        "STACKRA_DEPLOY_BOX_GREEN_OWNER must name the user that writes box-green records",
      );
    else if (s.boxGreenOwner === io.user || io.uidOf(s.boxGreenOwner) === io.uid)
      problems.push("box-green records must not be writable by the deploy user itself");
  }
  if (!s.githubTokenFile) {
    // Optional: the public API answers without a token, at a lower rate.
  } else {
    const problem = secretFileProblem(io, "STACKRA_DEPLOY_GITHUB_TOKEN_FILE", s.githubTokenFile);
    if (problem) problems.push(problem);
  }
  const home = fileFacts(io, s.home);
  if (!home) problems.push(`STACKRA_DEPLOY_HOME (${s.home}) does not exist`);
  else if (home.uid !== io.uid || (home.mode & 0o077) !== 0)
    problems.push(`STACKRA_DEPLOY_HOME (${s.home}) must be 0700 and the deploy user's`);
  if (s.mirror === s.home || s.mirror.startsWith(`${s.home}/`))
    problems.push(
      "STACKRA_DEPLOY_MIRROR must be outside STACKRA_DEPLOY_HOME: the build user clones from it",
    );
  for (const tool of ["git", "flock"])
    if (io.which(tool) === null) problems.push(`${tool} is not on PATH`);

  if (target === "encore") {
    try {
      assertEncoreTarget(s.encoreApp, s.encoreEnv);
    } catch (error) {
      problems.push(error.message);
    }
    // A dry run reads no secret and builds nothing: the switch, the user and the home are enough.
    if (dryRun) return problems;
    const problem = secretFileProblem(io, "STACKRA_DEPLOY_ENCORE_CLIENT_FILE", s.encoreClientFile);
    if (problem) problems.push(problem);
    if (!/^https:\/\/[^/\s]+$/.test(s.encoreUrl ?? ""))
      problems.push("STACKRA_DEPLOY_ENCORE_URL must be the staging origin, https://<host>");
    if (!/^https:\/\/[^/\s]+$/.test(s.encoreApi))
      problems.push("STACKRA_DEPLOY_ENCORE_API must be an https origin");
    return problems;
  }
  if (dryRun) return problems;

  for (const [label, path] of [
    ["STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE", s.cloudflareTokenFile],
    ["STACKRA_DEPLOY_TURBO_TOKEN_FILE", s.turboTokenFile],
  ]) {
    const problem = secretFileProblem(io, label, path);
    if (problem) problems.push(problem);
  }
  if (!/^[0-9a-f]{32}$/.test(s.cloudflareAccountId ?? ""))
    problems.push(
      "STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID must be the 32-hex account id of runway.yaml",
    );
  if (!s.varsFile) problems.push("STACKRA_DEPLOY_WORKER_VARS_FILE is not set");
  else
    try {
      readVars(io, s);
    } catch (error) {
      problems.push(error.message);
    }
  if (!USER_NAME.test(s.buildAs ?? "") || !s.buildHome)
    problems.push(
      "STACKRA_DEPLOY_BUILD_AS and STACKRA_DEPLOY_BUILD_HOME name the build user and its home",
    );
  else if (s.buildAs === io.user || FORBIDDEN_USERS.includes(s.buildAs))
    problems.push(`STACKRA_DEPLOY_BUILD_AS must be its own user, not ${s.buildAs}`);
  else if (!io.canSudo(s.buildAs))
    problems.push(`sudo -n -u ${s.buildAs} is not allowed for the deploy user`);
  if (s.promotion === null)
    problems.push("STACKRA_DEPLOY_PROMOTION must be <worker>=auto|approve pairs");
  else if (Object.values(s.promotion).includes("approve")) {
    if (!USER_NAME.test(s.approver ?? "") || s.approver === io.user)
      problems.push(
        "a Worker in approve mode needs STACKRA_DEPLOY_APPROVER, a user other than the deploy user",
      );
  }
  if (s.steps === null)
    problems.push("STACKRA_DEPLOY_STEPS must be ascending percentages ending at 100 (10,100)");
  for (const [setting, value] of [
    ["STACKRA_DEPLOY_HOLD_SECONDS", s.holdMs],
    ["STACKRA_DEPLOY_PROPAGATION_SECONDS", s.propagationMs],
  ])
    if (!Number.isFinite(value) || value < 0)
      problems.push(`${setting} must be a number of seconds`);
  if (!Number.isInteger(s.smokeAttempts) || s.smokeAttempts < 1)
    problems.push("STACKRA_DEPLOY_SMOKE_ATTEMPTS must be a whole number, at least 1");
  if (!Number.isInteger(s.minSample) || s.minSample < 2)
    problems.push("STACKRA_DEPLOY_REGISTRY_MIN_SAMPLE must be at least 2");
  return problems;
}

// ---- ledger and state -------------------------------------------------------------------------------------------

/** The ledger file: one JSON object per line, the machine record of every attempt. */
export const ledgerPath = (s) => join(s.home, "ledger", "deploys.jsonl");

/** Keeps only plain data, every string scrubbed: nothing secret can reach the ledger. */
function scrubbed(value) {
  if (typeof value === "string") return scrub(value);
  if (Array.isArray(value)) return value.map(scrubbed);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubbed(v)]));
  return value;
}

/** One ledger line for `entry`, with the fields every line carries. */
export function ledgerLine(s, io, entry) {
  return JSON.stringify(
    scrubbed({
      schema: LEDGER_SCHEMA,
      at: new Date(io.now()).toISOString(),
      box: s.box,
      user: io.user,
      ...entry,
    }),
  );
}

/** Appends one line to the ledger (0600, created with its folder). */
export function appendLedger(s, io, entry) {
  const path = ledgerPath(s);
  io.mkdir(dirname(path));
  io.append(path, `${ledgerLine(s, io, entry)}\n`);
}

/** Every parsed ledger line; a broken line is skipped, never trusted. */
export function readLedger(s, io) {
  let text;
  try {
    text = io.readFile(ledgerPath(s));
  } catch {
    return [];
  }
  return text
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

/** The newest successful (not dry-run) deploy of `target`, or undefined; `except` skips one SHA. */
export const lastGood = (entries, target, except) =>
  entries.findLast(
    (e) => e.target === target && e.result === "success" && !e.dryRun && e.sha !== except,
  );

const statePath = (s, target) => join(s.home, "state", `${target.replace(":", "-")}.json`);

/** A target's in-flight state (a version waiting for approval or mid-promotion), or null. */
export function readState(s, io, target) {
  try {
    return JSON.parse(io.readFile(statePath(s, target)));
  } catch {
    return null;
  }
}

/** Writes (or with null, removes) a target's in-flight state. */
export function writeState(s, io, target, state) {
  const path = statePath(s, target);
  if (state === null) io.remove(path);
  else {
    io.mkdir(dirname(path));
    io.write(path, `${JSON.stringify(state)}\n`);
  }
}

// ---- lock -------------------------------------------------------------------------------------------------------

/** The lock of one target: one deploy at a time per Worker, and one for Encore staging. */
export const lockPath = (s, target) => join(s.home, "locks", `${target.replace(":", "-")}.lock`);

/** The argv that runs this script again under `flock -n` on `lock` (exit 75 when it is held). */
export const lockedArgv = (lock, script, args) => [
  "flock",
  "-n",
  "-E",
  String(LOCK_HELD_EXIT),
  lock,
  process.execPath,
  script,
  ...args,
];

// ---- git --------------------------------------------------------------------------------------------------------

/** Runs git against the service's own mirror. */
const git = (s, io, args) =>
  io.run("git", ["-C", s.mirror, ...args], { env: { PATH: s.path, GIT_TERMINAL_PROMPT: "0" } });

/** Fetches main and the tags into the mirror (created on first use); nothing else of origin. */
export async function fetchMain(s, io) {
  if (!io.exists(join(s.mirror, "HEAD"))) {
    io.mkdir(s.mirror);
    const init = await git(s, io, ["init", "--bare", "--quiet"]);
    if (init.code !== 0) throw new Error(`git init of the mirror failed: ${tail(init.stderr)}`);
  }
  const fetched = await git(s, io, [
    "fetch",
    "--quiet",
    "--prune",
    "--no-write-fetch-head",
    s.remote,
    "+refs/heads/main:refs/remotes/origin/main",
    "+refs/tags/*:refs/tags/*",
  ]);
  if (fetched.code !== 0) throw new Error(`git fetch of main failed: ${tail(fetched.stderr)}`);
  const head = await git(s, io, ["rev-parse", "refs/remotes/origin/main"]);
  const sha = head.stdout.trim();
  if (head.code !== 0 || !SHA.test(sha)) throw new Error("the mirror has no origin/main");
  return sha;
}

/** Whether `sha` is a commit of origin/main (ADR 0170 decision 6: only main deploys). */
export async function onMain(s, io, sha) {
  if (!SHA.test(sha)) return false;
  const answer = await git(s, io, ["merge-base", "--is-ancestor", sha, "refs/remotes/origin/main"]);
  return answer.code === 0;
}

/** A file's text at `sha`, or null when it does not exist there. */
export async function showFile(s, io, sha, path) {
  const answer = await git(s, io, ["show", `${sha}:${path}`]);
  return answer.code === 0 ? answer.stdout : null;
}

// ---- the verify gate --------------------------------------------------------------------------------------------

/** The newest completed stackra/verify run of the verify App at exactly `sha`, or undefined. */
export function newestVerifyRun(checkRuns, sha) {
  return checkRuns
    .filter(
      (r) =>
        r.name === VERIFY_CHECK &&
        r.head_sha === sha &&
        String(r.app?.id) === String(VERIFY_APP_ID) &&
        r.status === "completed",
    )
    .toSorted((a, b) =>
      String(b.completed_at ?? "").localeCompare(String(a.completed_at ?? "")),
    )[0];
}

/**
 * Why a box-green record does not stand for `sha`; null when it does. The record is `<dir>/<sha>.json`:
 *   { "schema": "stackra.box-green/1", "repo": "figentra/stackra", "sha": "<40 hex>", "result": "green",
 *     "suite": "<the command the box ran>", "box": "<host>", "at": "<ISO time>" }
 * written by the box-green owner (never the deploy user), writable by its owner only.
 */
export function boxGreenProblem(s, io, sha) {
  const path = join(s.boxGreenDir, `${sha}.json`);
  const owner = io.uidOf(s.boxGreenOwner ?? "");
  if (owner === null) return "the box-green owner is not a user on this host";
  if (owner === io.uid) return "the box-green owner is the deploy user";
  const problem = trustedFileProblem(io, "the box-green record", path, [owner]);
  if (problem) return problem;
  let record;
  try {
    record = JSON.parse(io.readFile(path));
  } catch {
    return "the box-green record is not JSON";
  }
  if (record?.schema !== BOX_GREEN_SCHEMA) return `the box-green record is not ${BOX_GREEN_SCHEMA}`;
  if (record.repo !== s.repo || record.sha !== sha)
    return "the box-green record names another commit";
  if (record.result !== "green") return `the box-green record says ${record.result}`;
  if (typeof record.suite !== "string" || record.suite === "" || typeof record.box !== "string")
    return "the box-green record names no suite or box";
  if (Number.isNaN(Date.parse(record.at ?? ""))) return "the box-green record has no time";
  return null;
}

/**
 * Whether `sha` passed main's gate: `{ ok, via, reason }`. A green stackra/verify from the verify App at that SHA;
 * else, only while STACKRA_DEPLOY_ACCEPT_BOX_GREEN is on, a box-green record. An API error never passes.
 */
export async function verifyGate(s, io, sha) {
  let reason;
  try {
    const headers = { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
    if (s.githubTokenFile)
      headers.authorization = `Bearer ${readSecret(io, "the GitHub token", s.githubTokenFile)}`;
    const url = `${s.githubApi}/repos/${s.repo}/commits/${sha}/check-runs?check_name=${encodeURIComponent(VERIFY_CHECK)}&per_page=100`;
    const answer = await io.fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    if (!answer.ok) reason = `GitHub answered ${answer.status} for the check runs`;
    else {
      const run = newestVerifyRun((await answer.json()).check_runs ?? [], sha);
      if (run?.conclusion === "success") return { ok: true, via: "check-run", run: run.id ?? null };
      reason = run
        ? `the newest ${VERIFY_CHECK} at ${sha} is ${run.conclusion}`
        : `no ${VERIFY_CHECK} from the verify App at ${sha}`;
    }
  } catch (error) {
    reason = `the check runs could not be read: ${scrub(error.message)}`;
  }
  if (s.acceptBoxGreen !== "on") return { ok: false, reason };
  const problem = boxGreenProblem(s, io, sha);
  return problem === null
    ? { ok: true, via: "box-green", reason }
    : { ok: false, reason: `${reason}; box-green: ${problem}` };
}

// ---- runway data and the change trigger -------------------------------------------------------------------------

/** A runway member of `targets.cloudflare-workers`, or undefined. */
export const memberOf = (root, key) => root?.targets?.["cloudflare-workers"]?.members?.[key];

/** The `with:` inputs of a caller workflow's job that uses runway-cloudflare-workers.yml. */
export function callerInputs(workflow) {
  const job = Object.values(workflow?.jobs ?? {}).find((j) =>
    String(j?.uses ?? "").endsWith("runway-cloudflare-workers.yml"),
  );
  if (!job) throw new Error("the caller workflow has no runway-cloudflare-workers.yml job");
  const w = job.with ?? {};
  return {
    member: w.member,
    package: w.package,
    installArgs: String(w["install-args"] ?? "--frozen-lockfile")
      .split(/\s+/)
      .filter(Boolean),
    vars: String(w.vars ?? "")
      .split(/\s+/)
      .filter(Boolean),
    environment: w.environment,
  };
}

/**
 * The workspace importers of a pnpm lockfile. pnpm 12 writes two YAML documents: the package manager's own (its
 * `importers` hold only `.`'s pnpm pin) and then the workspace's, with its `settings`; this reads the latter.
 */
export function lockImporters(lockText) {
  const docs = parseAllDocuments(lockText).map((doc) => doc.toJS());
  // The workspace's document carries its settings; else the one with the most importers.
  const workspace =
    docs.find((doc) => doc?.settings && doc?.importers) ??
    docs
      .filter((doc) => doc?.importers)
      .toSorted((a, b) => Object.keys(b.importers).length - Object.keys(a.importers).length)[0];
  return workspace?.importers ?? {};
}

/**
 * The workspace dependency closure of the importer at `start` (a path such as `workers/registry`): every importer it
 * reaches through `link:` dependencies of any kind, itself included.
 */
export function workspaceClosure(importers, start) {
  const seen = new Set();
  const queue = [start];
  while (queue.length > 0) {
    const at = queue.shift();
    if (seen.has(at) || !importers[at]) continue;
    seen.add(at);
    for (const kind of ["dependencies", "devDependencies", "optionalDependencies"])
      for (const spec of Object.values(importers[at][kind] ?? {})) {
        const version = typeof spec === "string" ? spec : spec?.version;
        if (typeof version === "string" && version.startsWith("link:"))
          queue.push(posix.normalize(posix.join(at, version.slice(5))));
      }
  }
  return seen;
}

/**
 * Whether the change `base..head` touches a Worker: a changed file under its closure, its runway files or its caller
 * workflows, or a lockfile importer of its closure (or the root's) that differs.
 */
export function workerTouched({ changed, closure, workflow, beforeImporters, afterImporters }) {
  const roots = [...closure].map((p) => `${p}/`);
  const exact = new Set([
    "runway.yaml",
    "pnpm-workspace.yaml",
    PROVIDER_WORKFLOW,
    ...(workflow ? [`.github/workflows/${workflow}`] : []),
  ]);
  const files = changed.filter((f) => exact.has(f) || roots.some((r) => f.startsWith(r)));
  const importers = [...closure, "."].filter(
    (p) => JSON.stringify(beforeImporters?.[p]) !== JSON.stringify(afterImporters?.[p]),
  );
  return { touched: files.length > 0 || importers.length > 0, files, importers };
}

// ---- the Worker plan --------------------------------------------------------------------------------------------

/**
 * The steps that ship `worker` at `sha`, as CI's caller workflow and runway-cloudflare-workers.yml run them, with the
 * box's own gates and promotion: `as` is the user (`build` or `deploy`), `wrangler` the wrangler arguments (`$OLD`,
 * `$NEW` and `$NAME` stand for values known at run time). Pure: the plan a dry run prints and the parity test reads.
 */
export function workerPlan({ worker, sha, root, caller, steps, mode }) {
  const member = memberOf(root, worker);
  if (!member)
    throw new Error(`${worker} is not a member of runway.yaml targets.cloudflare-workers`);
  return [
    { id: "main-only", kind: "gate", detail: `${sha} is a commit of origin/main` },
    { id: "verify", kind: "gate", detail: `${VERIFY_CHECK} green at ${sha}` },
    { id: "install", as: "build", command: "pnpm", args: ["install", ...caller.installArgs] },
    {
      id: "build",
      as: "build",
      command: "pnpm",
      args: ["turbo", "run", "build", `--filter=${caller.package}^...`, "--filter=@stackra/cli..."],
    },
    {
      id: "gen",
      as: "build",
      command: "pnpm",
      args: ["turbo", "run", "gen", `--filter=${caller.package}`, "--only"],
    },
    {
      id: "build-member",
      as: "build",
      command: "pnpm",
      args: ["turbo", "run", "build", `--filter=./${member.path}`],
    },
    { id: "ids", kind: "file", detail: Object.keys(member.ids ?? {}).join(",") || "none" },
    {
      id: "render",
      kind: "file",
      detail: "runway's renderWranglerConfig(workerSettingsOf(…, production))",
    },
    { id: "status", as: "deploy", wrangler: ["deployments", "status", "--json"] },
    ...(member.d1 ?? []).flatMap((database) => [
      {
        id: `d1-pending:${database}`,
        as: "deploy",
        wrangler: ["d1", "migrations", "list", database, "--remote"],
      },
      {
        id: `d1-additive:${database}`,
        kind: "gate",
        detail: "every pending statement is additive",
      },
      {
        id: `d1-apply:${database}`,
        as: "deploy",
        wrangler: ["d1", "migrations", "apply", database, "--remote"],
      },
    ]),
    {
      id: "upload",
      as: "deploy",
      wrangler: [
        "versions",
        "upload",
        "--message",
        sha,
        ...(member.vars ?? []).flatMap((name) => ["--var", `${name}:$${name}`]),
      ],
    },
    {
      id: "preview",
      as: "deploy",
      wrangler: ["versions", "deploy", "$OLD@100", "$NEW@0", "--message", sha, "--yes"],
    },
    { id: "smoke:0", kind: "smoke" },
    ...(mode === "approve"
      ? [{ id: "approval", kind: "gate", detail: "the approver's file" }]
      : []),
    ...steps.flatMap((percent) => [
      {
        id: `promote:${percent}`,
        as: "deploy",
        wrangler: [
          "versions",
          "deploy",
          `$NEW@${percent}`,
          ...(percent === 100 ? [] : [`$OLD@${100 - percent}`]),
          "--message",
          sha,
          "--yes",
        ],
      },
      { id: `smoke:${percent}`, kind: "smoke" },
    ]),
  ];
}

/** `config` (wrangler.jsonc text) with comments and trailing commas removed: strict JSON. */
export const stripJsonc = (config) =>
  config.replaceAll(JSONC_TOKEN, (_, text) => text ?? "").replaceAll(/,(\s*[}\]])/g, "$1");

/** `config` with each quoted placeholder id of the member swapped for its real id from `vars`. */
export function swapIds(config, member, vars) {
  let swapped = config;
  for (const [name, placeholder] of Object.entries(member.ids ?? {})) {
    const value = vars[name] ?? "";
    if (!BINDING_ID.test(value))
      throw new Error(`${name} is not set to a binding id in the vars file`);
    if (!swapped.includes(`"${placeholder}"`))
      throw new Error(`${member.path}/wrangler.jsonc has no "${placeholder}" for ${name}`);
    swapped = swapped.replaceAll(`"${placeholder}"`, `"${value}"`);
  }
  return swapped;
}

/**
 * The rendered config made runnable from the deploy user's run folder: every path absolute against the member's
 * folder; refused when it ships Durable Object migrations (those go out at 100% through `wrangler deploy`, which
 * the box never runs) or names another account.
 */
export function placeConfig(config, memberDir, accountId) {
  if (config.migrations !== undefined)
    throw new Error("the Worker ships Durable Object migrations: a deploy at 100% needs the owner");
  if (config.account_id !== undefined && config.account_id !== accountId)
    throw new Error(`wrangler.jsonc names account ${config.account_id}, not ${accountId}`);
  const at = (p) => (isAbsolute(p) ? p : join(memberDir, p));
  const out = { ...config, account_id: accountId };
  if (typeof out.main === "string") out.main = at(out.main);
  if (typeof out.tsconfig === "string") out.tsconfig = at(out.tsconfig);
  if (typeof out.base_dir === "string") out.base_dir = at(out.base_dir);
  if (out.assets?.directory) out.assets = { ...out.assets, directory: at(out.assets.directory) };
  if (Array.isArray(out.d1_databases))
    out.d1_databases = out.d1_databases.map((db) => ({
      ...db,
      migrations_dir: at(db.migrations_dir ?? "migrations"),
    }));
  return out;
}

/** The child that renders a member's config with the deployed tree's own @stackra/runway (no secret in it). */
export const RENDER_SCRIPT = [
  'import { pathToFileURL } from "node:url";',
  "const chunks = [];",
  "for await (const chunk of process.stdin) chunks.push(chunk);",
  "const input = JSON.parse(Buffer.concat(chunks).toString());",
  "const runway = await import(pathToFileURL(process.argv[1]).href);",
  "const settings = runway.workerSettingsOf(input.target, input.member, input.environment);",
  "process.stdout.write(JSON.stringify(runway.renderWranglerConfig(JSON.parse(input.config), settings)));",
].join("\n");

/** The deployment status (`wrangler deployments status --json`): `[{ version, percent }]`, largest first. */
export function parseStatus(output) {
  const text = String(output);
  const start = text.indexOf("{");
  if (start === -1) throw new Error("wrangler deployments status printed no JSON");
  const doc = JSON.parse(text.slice(start));
  return (doc.versions ?? [])
    .map((v) => ({ version: v.version_id, percent: Number(v.percentage) }))
    .toSorted((a, b) => b.percent - a.percent);
}

/** The SHA a version was uploaded with (`wrangler versions view <id> --json`: its message), or null. */
export function parseVersionMessage(output) {
  try {
    const text = String(output);
    const doc = JSON.parse(text.slice(text.indexOf("{")));
    const message = doc.annotations?.["workers/message"] ?? doc.metadata?.message ?? "";
    return SHA.test(message) ? message : null;
  } catch {
    return null;
  }
}

/** The workspace packages of a tree: `[{ name, dir, private }]` for every packages/<group>/<name>/package.json. */
export function workspacePackages(io, tree) {
  const out = [];
  for (const group of io.list(join(tree, "packages"))) {
    for (const name of io.list(join(tree, "packages", group))) {
      const file = join(tree, "packages", group, name, "package.json");
      if (!io.exists(file)) continue;
      try {
        const pkg = JSON.parse(io.readFile(file));
        out.push({
          name: pkg.name,
          dir: `packages/${group}/${name}`,
          private: pkg.private === true,
        });
      } catch {
        // A package.json that is not JSON is not a published package.
      }
    }
  }
  return out;
}

/** The node and pnpm versions mise.toml pins (`node = "24.22.0"`). */
export function toolPins(miseToml) {
  const pin = (tool) => new RegExp(`^${tool}\\s*=\\s*"([^"]+)"`, "m").exec(miseToml)?.[1] ?? null;
  return { node: pin("node"), pnpm: pin("pnpm") };
}

/** The wrangler version the lockfile resolves for `memberPath` (its `wrangler` dev dependency), or null. */
export function lockedWrangler(importers, memberPath) {
  const entry =
    importers?.[memberPath]?.devDependencies?.wrangler ??
    importers?.[memberPath]?.dependencies?.wrangler;
  const version = typeof entry === "string" ? entry : entry?.version;
  return typeof version === "string" ? version.replace(/\(.*$/, "") : null;
}

// ---- approvals --------------------------------------------------------------------------------------------------

const approvalPath = (s, worker, sha) => join(s.approvals, worker, `${sha}.json`);

/**
 * The approval of `version` of `worker` at `sha`, or `{ problem }`: the file `<approvals>/<worker>/<sha>.json`
 * `{ "schema": "stackra.deploy-approval/1", "worker", "sha", "version", "by", "at" }`, written by the approver user
 * (never the deploy user), writable by its owner only.
 */
export function readApproval(s, io, { worker, sha, version }) {
  const path = approvalPath(s, worker, sha);
  if (!fileFacts(io, path)) return { problem: "no approval yet" };
  const approver = io.uidOf(s.approver ?? "");
  if (approver === null || approver === io.uid) return { problem: "no approver user is set" };
  const problem = trustedFileProblem(io, "the approval", path, [approver]);
  if (problem) return { problem };
  let doc;
  try {
    doc = JSON.parse(io.readFile(path));
  } catch {
    return { problem: "the approval is not JSON" };
  }
  if (doc?.schema !== APPROVAL_SCHEMA || doc.worker !== worker || doc.sha !== sha)
    return { problem: "the approval names another Worker or commit" };
  if (doc.version !== version) return { problem: `the approval is for version ${doc.version}` };
  return { approval: { file: path, by: String(doc.by ?? ""), at: String(doc.at ?? "") } };
}

/** Writes an approval as the approver user (the `approve` verb). */
export function writeApproval(s, io, { worker, sha, version }) {
  if (!s.approver || io.user !== s.approver)
    throw new Error(`approve runs as the approver user ${s.approver ?? "(unset)"}, not ${io.user}`);
  const path = approvalPath(s, worker, sha);
  io.mkdir(dirname(path));
  io.write(
    path,
    `${JSON.stringify({
      schema: APPROVAL_SCHEMA,
      worker,
      sha,
      version,
      by: io.user,
      at: new Date(io.now()).toISOString(),
    })}\n`,
  );
  return path;
}

// ---- the Worker deploy ------------------------------------------------------------------------------------------

/** The environment wrangler gets: nothing of this process's, only what it needs to run and to sign in. */
export function wranglerEnv(s, run, token) {
  return {
    PATH: s.path,
    HOME: run,
    XDG_CONFIG_HOME: join(run, "config"),
    WRANGLER_LOG_PATH: join(run, "logs"),
    WRANGLER_SEND_METRICS: "false",
    NO_COLOR: "1",
    CI: "true",
    CLOUDFLARE_ACCOUNT_ID: s.cloudflareAccountId,
    CLOUDFLARE_API_TOKEN: token,
  };
}

/** The environment the build user's commands get: PATH, its own HOME and CI; no secret. */
export const buildEnv = (s) => ({ PATH: s.path, HOME: s.buildHome, CI: "true" });

/** The argv that runs `command args` as the build user with exactly `env` (values are not secrets). */
export const asBuildUser = (s, command, args) => [
  "sudo",
  "-n",
  "-u",
  s.buildAs,
  "--",
  "/usr/bin/env",
  "-i",
  ...Object.entries(buildEnv(s)).map(([k, v]) => `${k}=${v}`),
  command,
  ...args,
];

/**
 * Ships `worker` at `sha` (the box path of ADR 0536). Returns `{ code, result }`; every attempt ends in one ledger
 * line, except a run that finds the Worker already serving `sha` or still waiting for its approval.
 */
export async function deployWorker(s, io, { worker, sha, trigger, dryRun = false }) {
  const target = `worker:${worker}`;
  const started = io.now();
  const entry = {
    target,
    env: "production",
    sha,
    trigger: { kind: trigger, by: io.user, sudoUser: io.sudoUser ?? null },
    dryRun,
    mode: s.promotion?.[worker] ?? null,
    steps: [],
  };
  const finish = (result, extra = {}) => {
    Object.assign(entry, extra, {
      result,
      startedAt: new Date(started).toISOString(),
      durationMs: io.now() - started,
    });
    appendLedger(s, io, entry);
    io.log(`${target} ${sha} ${result}${extra.reason ? `: ${extra.reason}` : ""}`);
    return { code: ["success", "dry-run", "awaiting-approval"].includes(result) ? 0 : 1, result };
  };

  const problems = preflightProblems(s, io, "workers", { dryRun });
  if (problems.length > 0) return finish("refused", { reason: problems.join("; ") });
  if (!WORKER_KEYS.includes(worker))
    return finish("refused", { reason: `${worker} is not a box Worker` });

  await fetchMain(s, io);
  if (!(await onMain(s, io, sha)))
    return finish("refused", { reason: `${sha} is not a commit of origin/main` });
  const gate = await verifyGate(s, io, sha);
  entry.verify = { via: gate.via ?? null, note: gate.reason ?? null };
  if (!gate.ok) return finish("refused", { reason: gate.reason });

  const rootText = await showFile(s, io, sha, "runway.yaml");
  const root = rootText === null ? null : parseYaml(rootText);
  const member = memberOf(root, worker);
  if (!member)
    return finish("refused", {
      reason: `${worker} is not a runway.yaml member at ${sha}; its first deploy is the owner's`,
    });
  const workflow = root.targets["cloudflare-workers"].workflows?.[worker];
  const workflowText = workflow
    ? await showFile(s, io, sha, `.github/workflows/${workflow}`)
    : null;
  if (workflowText === null)
    return finish("refused", {
      reason: `${worker} has no caller workflow in runway.yaml at ${sha}`,
    });
  const caller = callerInputs(parseYaml(workflowText));
  if (caller.member !== worker)
    return finish("refused", { reason: `${workflow} deploys ${caller.member}, not ${worker}` });
  const plan = workerPlan({ worker, sha, root, caller, steps: s.steps, mode: entry.mode });
  if (dryRun) {
    for (const step of plan)
      io.log(
        `  ${step.id}${step.as ? ` (${step.as})` : ""}: ${
          step.wrangler
            ? `wrangler ${step.wrangler.join(" ")}`
            : step.command
              ? `${step.command} ${step.args.join(" ")}`
              : (step.detail ?? step.kind)
        }`,
      );
    return finish("dry-run", { plan: plan.map((p) => p.id) });
  }

  // The secrets are read only now, after every gate: the token for wrangler, the turbo token for its smoke.
  const vars = readVars(io, s);
  for (const name of caller.vars)
    if (vars[name] === undefined)
      return finish("refused", {
        reason: `${name} (a variable of ${workflow}) is not in the vars file`,
      });

  const run = join(s.home, "run", `${worker}-${sha.slice(0, 12)}-${started}`);
  const tree = join(s.work, `${worker}-${sha.slice(0, 12)}-${started}`);
  io.mkdir(run);
  try {
    // ---- the tree, as the build user (no secret on its side) ----
    const asBuild = async (id, command, args, cwd) => {
      const argv = asBuildUser(s, command, args);
      const answer = await io.run(argv[0], argv.slice(1), { cwd, env: { PATH: s.path } });
      entry.steps.push({ id, code: answer.code });
      if (answer.code !== 0)
        throw new StepError(id, `${id} failed: ${tail(answer.stderr || answer.stdout)}`);
    };
    await asBuild(
      "clone",
      "git",
      ["-c", `safe.directory=${s.mirror}`, "clone", "--quiet", "--no-checkout", s.mirror, tree],
      s.work,
    );
    await asBuild(
      "checkout",
      "git",
      ["-C", tree, "-c", "advice.detachedHead=false", "checkout", "--quiet", "--detach", sha],
      s.work,
    );
    // The toolchain mise.toml pins at that commit (CI's mise step): node and pnpm, as the build user sees them.
    const pins = toolPins(io.readFile(join(tree, "mise.toml")));
    for (const tool of ["node", "pnpm"]) {
      const argv = asBuildUser(s, tool, ["--version"]);
      const answer = await io.run(argv[0], argv.slice(1), { cwd: tree, env: { PATH: s.path } });
      const version = answer.stdout.trim().replace(/^v/, "");
      if (answer.code !== 0 || version !== pins[tool])
        return finish("refused", {
          reason: `${tool} ${version || "is missing"}; mise.toml pins ${pins[tool]}`,
        });
    }
    for (const step of plan.filter((p) => p.as === "build"))
      await asBuild(step.id, step.command, step.args, tree);

    // ---- wrangler from the lockfile ----
    const memberDir = join(tree, member.path);
    const importers = lockImporters(io.readFile(join(tree, "pnpm-lock.yaml")));
    const locked = lockedWrangler(importers, member.path);
    const installed = JSON.parse(
      io.readFile(join(memberDir, "node_modules", "wrangler", "package.json")),
    ).version;
    if (!locked || installed !== locked)
      return finish("refused", {
        reason: `wrangler ${installed} is installed, the lockfile has ${locked}`,
      });
    const wranglerBin = join(memberDir, "node_modules", "wrangler", "bin", "wrangler.js");

    // ---- the config: ids swapped, rendered by the tree's own runway, placed in the run folder ----
    const source = io.readFile(join(memberDir, "wrangler.jsonc"));
    const strict = stripJsonc(swapIds(source, member, vars));
    const rendered = await io.run(
      process.execPath,
      ["--input-type=module", "-e", RENDER_SCRIPT, join(tree, RUNWAY_DIST)],
      {
        cwd: run,
        env: { PATH: s.path },
        input: JSON.stringify({
          config: strict,
          target: root.targets["cloudflare-workers"],
          member: worker,
          environment: "production",
        }),
      },
    );
    if (rendered.code !== 0)
      throw new StepError("render", `render failed: ${tail(rendered.stderr)}`);
    const config = placeConfig(JSON.parse(rendered.stdout), memberDir, s.cloudflareAccountId);
    const configFile = join(run, "wrangler.json");
    io.write(configFile, JSON.stringify(config, null, 2));
    entry.worker = config.name;

    const token = readSecret(io, "the Cloudflare token", s.cloudflareTokenFile);
    const turboToken =
      worker === "turbo-cache" ? readSecret(io, "the turbo token", s.turboTokenFile) : undefined;
    const wrangler = async (id, args) => {
      const answer = await io.run(
        process.execPath,
        [wranglerBin, ...args, "--config", configFile],
        {
          cwd: run,
          env: wranglerEnv(s, run, token),
        },
      );
      entry.steps.push({ id, code: answer.code });
      return answer;
    };
    const mustWrangler = async (id, args) => {
      const answer = await wrangler(id, args);
      if (answer.code !== 0)
        throw new StepError(id, `${id} failed: ${tail(answer.stderr || answer.stdout)}`);
      return answer.stdout;
    };
    const status = async () =>
      parseStatus(await mustWrangler("status", ["deployments", "status", "--json"]));

    // ---- what serves now ----
    let serving = await status();
    const state = readState(s, io, target);
    const stale =
      state && state.sha !== sha ? serving.find((v) => v.version === state.newVersion) : undefined;
    if (stale && stale.percent > 0)
      return finish("needs-owner", {
        reason: `${state.sha}'s version ${state.newVersion} serves ${stale.percent}% from a run that did not finish`,
      });
    if (stale) {
      // A newer commit supersedes one that waits at 0%: the deployment goes back to the old version alone.
      await mustWrangler("supersede", [
        "versions",
        "deploy",
        `${state.oldVersion}@100`,
        "--message",
        `superseded by ${sha}`,
        "--yes",
      ]);
      appendLedger(s, io, {
        target,
        env: "production",
        sha: state.sha,
        result: "superseded",
        reason: `superseded by ${sha}`,
        oldVersion: state.oldVersion,
        newVersion: state.newVersion,
      });
      serving = await status();
    }
    if (state && state.sha !== sha) writeState(s, io, target, null);

    const resume =
      state && state.sha === sha && serving.some((v) => v.version === state.newVersion)
        ? state
        : null;
    let oldVersion;
    let newVersion;
    if (resume) {
      ({ oldVersion, newVersion } = resume);
    } else {
      if (serving.length !== 1 || serving[0].percent !== 100)
        return finish("needs-owner", {
          reason: `${worker} is not served by one version at 100% (${JSON.stringify(serving)})`,
        });
      oldVersion = serving[0].version;
      const oldSha = parseVersionMessage(
        (await wrangler("old-version", ["versions", "view", oldVersion, "--json"])).stdout,
      );
      entry.oldSha = oldSha;
      if (oldSha === sha) {
        io.log(`${target} already serves ${sha}`);
        return { code: 0, result: "skipped" };
      }
    }
    entry.oldVersion = oldVersion;

    // ---- the registry sample and production's answers before the deploy ----
    const base = member.customDomains?.[0] ? `https://${member.customDomains[0]}` : undefined;
    let sample = [];
    let baseline = {};
    if (worker === "registry") {
      const { baseline: before, absent } = await registryBaseline(io, {
        base,
        sample: registrySample(workspacePackages(io, tree)),
      });
      baseline = before;
      sample = Object.keys(before);
      entry.sample = { names: sample, absent };
      if (!sample.includes("@stackra/cli") || sample.length < s.minSample)
        return finish("refused", {
          reason: `the registry sample is too small (${sample.join(", ")})`,
        });
    }
    const smoke = async (stage, version) => {
      let last;
      for (let attempt = 1; attempt <= s.smokeAttempts; attempt += 1) {
        if (attempt > 1) await io.sleep(s.propagationMs);
        try {
          last = await smokeWorker(io, {
            root,
            member: worker,
            workerName: config.name,
            version,
            sample,
            baseline,
            readOnly: vars.REGISTRY_READ_ONLY === "true",
            turboToken,
          });
        } catch (error) {
          last = {
            ok: false,
            results: [{ name: "smoke", ok: false, detail: scrub(error.message) }],
          };
        }
        if (last.ok) break;
      }
      const failed = last.results.filter((r) => !r.ok);
      entry.steps.push({ id: `smoke:${stage}`, ok: last.ok, checks: last.results.length, failed });
      return last.ok ? null : failed.map((r) => `${r.name}: ${r.detail}`).join("; ");
    };
    const rollBack = async (why) => {
      const back = await wrangler("rollback", [
        "versions",
        "deploy",
        `${oldVersion}@100`,
        "--message",
        `rollback to ${entry.oldSha ?? oldVersion} from ${sha}`,
        "--yes",
      ]);
      writeState(s, io, target, null);
      const after = back.code === 0 ? await status().catch(() => []) : [];
      const restored =
        after.length === 1 && after[0].version === oldVersion && after[0].percent === 100;
      const health = restored ? await smoke("after-rollback", undefined) : "not restored";
      return finish("failure", {
        reason: why,
        newVersion,
        rolledBack: restored,
        rollbackHealthy: restored && health === null,
      });
    };

    if (!resume) {
      // ---- D1: additive migrations only, before any version ships ----
      entry.migrations = [];
      for (const database of member.d1 ?? []) {
        const listed = await mustWrangler(`d1-pending:${database}`, [
          "d1",
          "migrations",
          "list",
          database,
          "--remote",
        ]);
        const pending = pendingMigrations(listed);
        const dbConfig = (config.d1_databases ?? []).find((d) => d.database_name === database);
        const dir = dbConfig?.migrations_dir ?? join(memberDir, "migrations");
        const verdict = migrationVerdict(
          pending.map((file) => ({ file, sql: io.readFile(join(dir, file)) })),
        );
        entry.migrations.push({ database, ...verdict });
        if (!verdict.additive)
          return finish("needs-owner", {
            reason: `${database} has a migration that is not additive: ${verdict.blocking.map((b) => `${b.file} ${b.kind}`).join(", ")}`,
          });
        if (pending.length > 0)
          await mustWrangler(`d1-apply:${database}`, [
            "d1",
            "migrations",
            "apply",
            database,
            "--remote",
          ]);
      }

      // ---- the version, with no traffic ----
      const uploaded = await mustWrangler("upload", [
        "versions",
        "upload",
        "--message",
        sha,
        ...(member.vars ?? []).flatMap((name) => ["--var", `${name}:${vars[name] ?? ""}`]),
      ]);
      newVersion = UPLOADED.exec(uploaded)?.[1];
      if (!newVersion)
        throw new StepError("upload", "wrangler versions upload printed no version id");
      entry.newVersion = newVersion;
      await mustWrangler("preview", [
        "versions",
        "deploy",
        `${oldVersion}@100`,
        `${newVersion}@0`,
        "--message",
        sha,
        "--yes",
      ]);
      writeState(s, io, target, {
        sha,
        oldVersion,
        newVersion,
        oldSha: entry.oldSha ?? null,
        phase: "preview",
      });
      await io.sleep(s.propagationMs);
    }
    entry.newVersion = newVersion;
    const joined = await status();
    if (!joined.some((v) => v.version === newVersion))
      return rollBack(`${newVersion} is not in the deployment, so no override can reach it`);

    const previewFailure = await smoke(0, newVersion);
    if (previewFailure) return rollBack(`the 0% smoke failed: ${previewFailure}`);

    if (entry.mode === "approve") {
      const answer = readApproval(s, io, { worker, sha, version: newVersion });
      if (!answer.approval) {
        writeState(s, io, target, {
          sha,
          oldVersion,
          newVersion,
          oldSha: entry.oldSha ?? null,
          phase: "awaiting-approval",
        });
        if (resume?.phase === "awaiting-approval") {
          io.log(`${target} ${sha} still waits for approval of ${newVersion} (${answer.problem})`);
          return { code: 0, result: "awaiting-approval" };
        }
        return finish("awaiting-approval", {
          reason: `approve ${newVersion}: ${answer.problem}`,
          newVersion,
        });
      }
      entry.approval = answer.approval;
    }

    // A resumed run continues from the share the new version already has; it never moves traffic back.
    const already = joined.find((v) => v.version === newVersion)?.percent ?? 0;
    for (const percent of s.steps.filter((p) => p > already)) {
      writeState(s, io, target, {
        sha,
        oldVersion,
        newVersion,
        oldSha: entry.oldSha ?? null,
        phase: "promoting",
        percent,
      });
      const split =
        percent === 100
          ? [`${newVersion}@100`]
          : [`${newVersion}@${percent}`, `${oldVersion}@${100 - percent}`];
      const moved = await wrangler(`promote:${percent}`, [
        "versions",
        "deploy",
        ...split,
        "--message",
        sha,
        "--yes",
      ]);
      if (moved.code !== 0)
        return rollBack(`promote to ${percent}% failed: ${tail(moved.stderr || moved.stdout)}`);
      await io.sleep(percent === 100 ? s.propagationMs : s.holdMs);
      const failure = await smoke(percent, newVersion);
      if (failure) return rollBack(`the ${percent}% smoke failed: ${failure}`);
    }
    const live = await smoke("live", undefined);
    if (live) return rollBack(`the live smoke failed: ${live}`);
    writeState(s, io, target, null);
    return finish("success", { newVersion });
  } catch (error) {
    const reason = scrub(error.message);
    if (entry.newVersion && entry.oldVersion) {
      // A failure after the version joined the deployment: production goes back to the old version.
      const back = await io
        .run(
          process.execPath,
          [
            join(tree, member.path, "node_modules", "wrangler", "bin", "wrangler.js"),
            "versions",
            "deploy",
            `${entry.oldVersion}@100`,
            "--message",
            `rollback from ${sha}`,
            "--yes",
            "--config",
            join(run, "wrangler.json"),
          ],
          {
            cwd: run,
            env: wranglerEnv(s, run, readSecret(io, "the Cloudflare token", s.cloudflareTokenFile)),
          },
        )
        .catch(() => ({ code: 1 }));
      writeState(s, io, target, null);
      return finish("failure", { reason, rolledBack: back.code === 0 });
    }
    return finish("failure", { reason, step: error.step ?? null });
  } finally {
    io.remove(run);
    const cleaned = asBuildUser(s, "rm", ["-rf", "--", tree]);
    await io.run(cleaned[0], cleaned.slice(1), { env: { PATH: s.path } }).catch(() => undefined);
  }
}

/** A failed step, named. */
class StepError extends Error {
  constructor(step, message) {
    super(message);
    this.step = step;
  }
}

// ---- Encore staging ---------------------------------------------------------------------------------------------

/** The Encore Cloud API client: a one-hour token from the OAuth client, refreshed before it expires. */
export function encoreClient(s, io) {
  let token = null;
  let expires = 0;
  const call = async (method, path, body) => {
    if (token === null || io.now() > expires - 5 * 60_000) {
      const client = JSON.parse(readSecret(io, "the Encore OAuth client", s.encoreClientFile));
      if (typeof client.client_id !== "string" || typeof client.client_secret !== "string")
        throw new Error("the Encore OAuth client file must hold client_id and client_secret");
      registerSecret(client.client_secret);
      const answer = await io.fetch(`${s.encoreApi}/api/oauth/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: client.client_id,
          client_secret: client.client_secret,
        }).toString(),
        signal: AbortSignal.timeout(30_000),
      });
      if (!answer.ok) throw new Error(`Encore answered ${answer.status} to the token request`);
      const doc = await answer.json();
      if (typeof doc.access_token !== "string")
        throw new Error("Encore's token answer has no access_token");
      token = doc.access_token;
      registerSecret(token);
      expires = io.now() + Number(doc.expires_in ?? 3600) * 1000;
    }
    const answer = await io.fetch(`${s.encoreApi}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
    });
    const doc = await answer.json().catch(() => ({}));
    if (!answer.ok || doc.ok === false)
      throw new Error(
        `Encore answered ${answer.status} to ${method} ${path}: ${scrub(doc.error?.code ?? "")}`,
      );
    return doc.data ?? doc;
  };
  return {
    trigger: (sha) =>
      call(
        "POST",
        `/api/apps/${encodeURIComponent(s.encoreApp)}/envs/${encodeURIComponent(s.encoreEnv)}/rollouts`,
        { sha },
      ),
    rollout: (id) =>
      call(
        "GET",
        `/api/apps/${encodeURIComponent(s.encoreApp)}/rollouts/${encodeURIComponent(id)}`,
      ),
  };
}

/** Follows a rollout to its end: `{ conclusion, rollout }`, `needs-owner` for proposed infra, `timeout`. */
export async function followRollout(s, io, client, id) {
  const deadline = io.now() + s.rolloutTimeoutMs;
  for (;;) {
    const rollout = await client.rollout(id);
    if (rollout.infra?.status === "proposed") return { conclusion: "needs-owner", rollout };
    if (rollout.status === "completed") return { conclusion: rollout.conclusion, rollout };
    if (io.now() >= deadline) return { conclusion: "timeout", rollout };
    await io.sleep(s.pollMs);
  }
}

/** Whether `<url>/readyz` answers exactly 200 within the ready timeout: null when it does, else what it said. */
export async function readyz(s, io) {
  const deadline = io.now() + s.readyTimeoutMs;
  let last;
  for (;;) {
    try {
      const answer = await io.fetch(`${s.encoreUrl}/readyz`, {
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      if (answer.status === 200) return null;
      last = `/readyz answered ${answer.status}`;
    } catch (error) {
      last = `/readyz failed: ${error.name}`;
    }
    if (io.now() >= deadline) return last;
    await io.sleep(s.pollMs);
  }
}

/** Ships `sha` to Encore staging and nowhere else. */
export async function deployEncore(
  s,
  io,
  { sha, environment = ENCORE_ENV, trigger, dryRun = false },
) {
  // First, before any setting or file: the box never deploys another Encore environment or app.
  assertEncoreTarget(s.encoreApp, environment);
  assertEncoreTarget(s.encoreApp, s.encoreEnv);
  const target = `encore:${ENCORE_ENV}`;
  const started = io.now();
  const entry = {
    target,
    env: ENCORE_ENV,
    app: ENCORE_APP,
    sha,
    dryRun,
    trigger: { kind: trigger, by: io.user, sudoUser: io.sudoUser ?? null },
  };
  const finish = (result, extra = {}) => {
    Object.assign(entry, extra, {
      result,
      startedAt: new Date(started).toISOString(),
      durationMs: io.now() - started,
    });
    appendLedger(s, io, entry);
    io.log(`${target} ${sha} ${result}${extra.reason ? `: ${extra.reason}` : ""}`);
    return { code: ["success", "dry-run"].includes(result) ? 0 : 1, result };
  };
  const problems = preflightProblems(s, io, "encore", { dryRun });
  if (problems.length > 0) return finish("refused", { reason: problems.join("; ") });
  await fetchMain(s, io);
  if (!(await onMain(s, io, sha)))
    return finish("refused", { reason: `${sha} is not a commit of origin/main` });
  const gate = await verifyGate(s, io, sha);
  entry.verify = { via: gate.via ?? null, note: gate.reason ?? null };
  if (!gate.ok) return finish("refused", { reason: gate.reason });
  const entries = readLedger(s, io);
  if (lastGood(entries, target)?.sha === sha) {
    io.log(`${target} already runs ${sha}`);
    return { code: 0, result: "skipped" };
  }
  if (dryRun)
    return finish("dry-run", { plan: ["token", `rollout ${sha}`, "follow", "readyz 200"] });

  const client = encoreClient(s, io);
  try {
    const rollout = await client.trigger(sha);
    if (typeof rollout.id !== "string" || !/^roll_\w+$/.test(rollout.id))
      return finish("failure", { reason: "Encore's rollout answer has no rollout id" });
    entry.rollout = rollout.id;
    const followed = await followRollout(s, io, client, rollout.id);
    if (followed.conclusion === "needs-owner")
      return finish("needs-owner", {
        reason: `rollout ${rollout.id} proposes infrastructure changes; the owner approves or rejects them`,
      });
    const failure =
      followed.conclusion === "success"
        ? await readyz(s, io)
        : `rollout ${rollout.id} ended ${followed.conclusion}`;
    if (failure === null) return finish("success");
    const previous = lastGood(entries, target, sha);
    if (!previous)
      return finish("failure", {
        reason: `${failure}; no earlier good SHA to roll back to`,
        rolledBack: false,
      });
    const back = await client.trigger(previous.sha);
    const backFollowed = await followRollout(s, io, client, back.id);
    const backReady =
      backFollowed.conclusion === "success" ? await readyz(s, io) : backFollowed.conclusion;
    return finish("failure", {
      reason: failure,
      rolledBack: backFollowed.conclusion === "success",
      rollback: { sha: previous.sha, rollout: back.id ?? null, ready: backReady === null },
    });
  } catch (error) {
    return finish("failure", { reason: scrub(error.message) });
  }
}

// ---- the timer pass ---------------------------------------------------------------------------------------------

/**
 * One pass for the timer: for each switched-on path, what to deploy at main's head. Returns `[{ target, args }]`,
 * each run then under its own lock. A Worker needs a recorded deploy first (the first one is by hand), a change in
 * its closure since that deploy, and a green verify at the head; a Worker waiting for approval of the head is run
 * again so its approval is picked up.
 */
export async function plannedRuns(s, io, { dryRun = false } = {}) {
  const runs = [];
  const wantWorkers = s.workers === "on" || dryRun;
  const wantEncore = s.encore === "on" || dryRun;
  if (!wantWorkers && !wantEncore) {
    io.log("both deploy paths are off (STACKRA_DEPLOY_WORKERS, STACKRA_DEPLOY_ENCORE)");
    return runs;
  }
  const head = await fetchMain(s, io);
  const entries = readLedger(s, io);
  let verified;
  const green = async () => (verified ??= (await verifyGate(s, io, head)).ok);
  const flags = dryRun ? ["--dry-run"] : [];

  if (wantEncore) {
    const good = lastGood(entries, `encore:${ENCORE_ENV}`);
    if (!good)
      io.log("encore: no recorded deploy yet; the first is run by hand (encore run --sha <sha>)");
    else if (good.sha !== head && (await green()))
      runs.push({
        target: `encore-${ENCORE_ENV}`,
        args: ["encore", "run", "--sha", head, "--trigger", "timer", ...flags],
      });
  }
  if (!wantWorkers) return runs;
  const rootText = await showFile(s, io, head, "runway.yaml");
  const root = rootText === null ? null : parseYaml(rootText);
  const afterLock = await showFile(s, io, head, "pnpm-lock.yaml");
  const afterImporters = afterLock === null ? {} : lockImporters(afterLock);
  for (const worker of WORKER_KEYS) {
    const target = `worker:${worker}`;
    const member = memberOf(root, worker);
    if (!member) continue;
    const state = readState(s, io, target);
    if (state?.phase === "awaiting-approval") {
      // A version waiting for its approval is looked at again each pass, whatever main's head is now.
      runs.push({
        target: `worker-${worker}`,
        args: [
          "workers",
          "run",
          "--worker",
          worker,
          "--sha",
          state.sha,
          "--trigger",
          "timer",
          ...flags,
        ],
      });
      continue;
    }
    const good = lastGood(entries, target);
    if (!good) {
      io.log(
        `${worker}: no recorded deploy yet; the first is run by hand (workers run --worker ${worker} --sha <sha>)`,
      );
      continue;
    }
    if (good.sha === head) continue;
    const diff = await git(s, io, ["diff", "--name-only", good.sha, head]);
    if (diff.code !== 0) {
      io.log(`${worker}: cannot diff ${good.sha}..${head}`);
      continue;
    }
    const beforeLock = await showFile(s, io, good.sha, "pnpm-lock.yaml");
    const beforeImporters = beforeLock === null ? {} : lockImporters(beforeLock);
    const closure = new Set([
      ...workspaceClosure(afterImporters, member.path),
      ...workspaceClosure(beforeImporters, member.path),
    ]);
    const touched = workerTouched({
      changed: diff.stdout.split("\n").filter(Boolean),
      closure,
      workflow: root.targets["cloudflare-workers"].workflows?.[worker],
      beforeImporters,
      afterImporters,
    });
    if (!touched.touched) continue;
    if (!(await green())) {
      io.log(`${worker}: ${head} changes it; waiting for a green ${VERIFY_CHECK}`);
      continue;
    }
    runs.push({
      target: `worker-${worker}`,
      args: ["workers", "run", "--worker", worker, "--sha", head, "--trigger", "timer", ...flags],
    });
  }
  return runs;
}

// ---- the real host ----------------------------------------------------------------------------------------------

/** Runs a program with exactly `env` (nothing inherited) and a time limit; never through a shell. */
function runProgram(command, args, { cwd, env = {}, input, timeoutMs = 60 * 60_000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => err.push(d));
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ code: 127, stdout: "", stderr: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        code: code ?? 1,
        stdout: Buffer.concat(out).toString(),
        stderr: Buffer.concat(err).toString(),
      });
    });
    child.stdin.end(input ?? "");
  });
}

/** The host's side effects, all behind one object a test replaces. */
export function hostIo(s) {
  const uidCache = new Map();
  return {
    user: userInfo().username,
    uid: process.getuid(),
    sudoUser: process.env.SUDO_USER ?? null,
    now: () => Date.now(),
    sleep: (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      }),
    fetch: (url, init) => globalThis.fetch(url, init),
    run: runProgram,
    readFile: (path) => readFileSync(path, "utf8"),
    write: (path, text) => writeFileSync(path, text, { mode: 0o600 }),
    append: (path, text) => appendFileSync(path, text, { mode: 0o600 }),
    mkdir: (path) => mkdirSync(path, { recursive: true, mode: 0o700 }),
    remove: (path) => rmSync(path, { recursive: true, force: true }),
    exists: (path) => existsSync(path),
    list: (path) => {
      try {
        return readdirSync(path).toSorted();
      } catch {
        return [];
      }
    },
    lstat: (path) => {
      const st = lstatSync(path);
      return { uid: st.uid, mode: st.mode, file: st.isFile(), symlink: st.isSymbolicLink() };
    },
    uidOf: (name) => {
      if (!USER_NAME.test(name)) return null;
      if (!uidCache.has(name)) {
        const answer = spawnSync("id", ["-u", name], { encoding: "utf8", env: { PATH: s.path } });
        uidCache.set(name, answer.status === 0 ? Number(answer.stdout.trim()) : null);
      }
      return uidCache.get(name);
    },
    which: (tool) => {
      const answer = spawnSync("sh", ["-c", 'command -v "$1"', "sh", tool], {
        encoding: "utf8",
        env: { PATH: s.path },
      });
      return answer.status === 0 ? answer.stdout.trim() : null;
    },
    canSudo: (user) =>
      spawnSync("sudo", ["-n", "-u", user, "--", "/usr/bin/env", "-i", "true"], {
        env: { PATH: s.path },
      }).status === 0,
    log: (line) => process.stdout.write(`${scrub(line)}\n`),
  };
}

/** Runs `args` of this script again under the target's lock; resolves with its exit code. */
function runLocked(s, lockTarget, args) {
  mkdirSync(join(s.home, "locks"), { recursive: true, mode: 0o700 });
  const lock = lockPath(s, lockTarget);
  const argv = lockedArgv(lock, fileURLToPath(import.meta.url), args);
  const answer = spawnSync(argv[0], argv.slice(1), {
    stdio: "inherit",
    env: { ...process.env, STACKRA_DEPLOY_LOCK: lock },
  });
  return answer.status ?? 1;
}

const USAGE =
  "usage: stackra-deploy.mjs preflight [workers|encore] | once [--dry-run] | status\n" +
  "       | workers run --worker <registry|static|turbo-cache|edge> --sha <sha> [--dry-run]\n" +
  "       | encore run --sha <sha> [--dry-run] | approve --worker <w> --sha <sha> --version <id>";

async function main(argv) {
  const options = parseArgs(argv);
  if (!options) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  const s = settings();
  const io = hostIo(s);
  if (options.verb === "preflight") {
    const targets = options.target ? [options.target] : ["workers", "encore"];
    let failed = 0;
    for (const target of targets) {
      const problems = preflightProblems(s, io, target);
      io.log(
        problems.length === 0
          ? `${target}: ready`
          : `${target}:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
      );
      failed += problems.length;
    }
    return failed === 0 ? 0 : 1;
  }
  if (options.verb === "status") {
    for (const e of readLedger(s, io).slice(-20))
      io.log(
        `${e.at} ${e.target} ${String(e.sha).slice(0, 12)} ${e.result}${e.reason ? `: ${e.reason}` : ""}`,
      );
    for (const worker of WORKER_KEYS) {
      const state = readState(s, io, `worker:${worker}`);
      if (state)
        io.log(
          `${worker}: ${state.phase} ${state.sha} new ${state.newVersion} old ${state.oldVersion}`,
        );
    }
    return 0;
  }
  if (options.verb === "approve") {
    io.log(`approval written: ${writeApproval(s, io, options)}`);
    return 0;
  }
  if (options.verb === "once") {
    let code = 0;
    for (const run of await plannedRuns(s, io, options)) {
      const answer = runLocked(s, run.target, run.args);
      if (answer !== 0 && answer !== LOCK_HELD_EXIT) code = 1;
    }
    return code;
  }
  // `run`: one target under its lock (taken here when the caller did not take it).
  const lockTarget =
    options.target === "encore" ? `encore-${ENCORE_ENV}` : `worker-${options.worker}`;
  if (process.env.STACKRA_DEPLOY_LOCK !== lockPath(s, lockTarget))
    return runLocked(s, lockTarget, argv);
  const result =
    options.target === "encore"
      ? await deployEncore(s, io, {
          sha: options.sha,
          trigger: options.trigger,
          dryRun: options.dryRun,
        })
      : await deployWorker(s, io, {
          worker: options.worker,
          sha: options.sha,
          trigger: options.trigger,
          dryRun: options.dryRun,
        });
  return result.code;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`stackra-deploy: ${scrub(error.message)}\n`);
      process.exitCode = 1;
    },
  );
