#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the box deploy service (STA-2783, STA-2784, ADR 0536), Stackra's recorded exception to "Runway + CI, no hand
 *   deploys" while figentra's GitHub Actions is billing-locked. Built OFF: nothing deploys until its switch is on.
 *   It never deploys the shared Figentra services (the registry, the build cache, static): those stay in the main
 *   Cloudflare account and deploy through CI only, and the box holds no token for that account. Two paths, each a
 *   target with its own lock, ledger lines and switch:
 *   (1) Encore staging: app `stackra-nzk2`, environment `staging` only (ENCORE_DEPLOY_ENVS, checked before any API
 *       call, the token mint included; every call is recorded with its environment). Mints a one-hour token from the
 *       box's OAuth client (Encore's Deployer role, which Encore does not scope to an environment, so this code does),
 *       triggers a rollout of the exact SHA, follows it, then requires `GET <staging>/readyz` to answer 200. A failure
 *       is rolled back by a rollout of the last SHA the ledger records as good (Encore has no rollback endpoint). A
 *       rollout that proposes infrastructure changes stops for the owner. `encore audit` (its own daily timer) reads
 *       production's recent rollouts and alerts (a ledger line and exit 1) on any that is not from CI: its actor must
 *       be a CI OAuth client (never the box's) and GitHub must record a successful `production` deployment of its SHA.
 *   (2) Stackra's own Workers in the Stackra Cloudflare account 57227d408957e241465c38ebd9c3959a (BOX_WORKERS: docs,
 *       edge), each a runway.yaml member of `targets.cloudflare-workers` whose own wrangler.jsonc names that account and
 *       whose hosts are on Stackra's own domain (STACKRA_DEPLOY_STACKRA_DOMAIN, `<stackra-domain>` until the owner
 *       picks it); anything else is refused, the main account by name. The Stackra landing is not a Worker here: it is
 *       experience documents the OS landing shell renders in figentra/os's edge Worker (ADR 0440). Per Worker and SHA
 *       it reproduces CI's caller workflow and runway-cloudflare-workers.yml step for step (install, build, gen, the
 *       member build, the binding-id swap, runway's rendering with the deployed SHA's own @stackra/runway,
 *       `d1 migrations apply --remote`, `versions upload --message <sha>`; the parity test is mandatory), with these
 *       differences: a D1 migration runs only when every pending statement is additive (d1-migration-gate.mjs); the new
 *       version joins the deployment at 0% beside the one at 100% (an override only reaches a version in the current
 *       deployment), where the smoke (worker-smoke.mjs) runs through `Cloudflare-Workers-Version-Overrides` and must
 *       see that version answer (edge's `x-stackra-version`, docs' `/-/version`), so an ignored override fails; then
 *       10%, 50% and 100% (STACKRA_DEPLOY_STEPS, as CI's rollout), held and smoked again at each step, and live at the
 *       end; any failure puts the old version back at 100% and smokes it. A Worker's secrets stay on the Worker:
 *       `wrangler versions upload` inherits them (wrangler 4.148.0 keeps secret_text and secret_key bindings).
 *       Promotion per Worker (STACKRA_DEPLOY_PROMOTION): `auto`, the owner's "All automatic" of 2026-11-25, or
 *       `approve` (kept, tested: stop after the 0% smoke until the approver's file names the SHA and the version).
 *   Both deploy only commits on origin/main with a green `stackra/verify` from the stackra-verify App (5907714) at that
 *   exact SHA; while STACKRA_DEPLOY_ACCEPT_BOX_GREEN is on (until verify is live) a box-green record at that SHA stands
 *   in. The timer (`once`) deploys main's head: Encore whenever it moved, a Worker only when a file of its runway unit
 *   or its workspace closure (pnpm-lock importers, `link:` deps) changed since its last recorded deploy.
 *   The timer never repeats a failed SHA: once an attempt at main's head ends in failure, needs-owner or refused, that
 *   target is held at that SHA (one `held` ledger line) until main's head moves or a person runs it by hand.
 *   The service's own code is pinned: `service update` (the unit's ExecStartPre) moves the service clone only to a main
 *   SHA that passed the same verify gate, as a fast-forward, and every deploy's preflight refuses a clone that is not
 *   at its pinned commit or whose code another user could change.
 *   Verbs: preflight [encore|workers] | once [encore|workers] [--dry-run] | status | service update
 *          | workers run --worker <docs|edge> --sha <sha> [--dry-run] | encore run --sha <sha> [--dry-run]
 *          | encore audit | approve --worker <w> --sha <sha> --version <id>
 * Boundary: runs git, sudo (install and build as the build user), node (wrangler from the deployed tree, and a child
 *   that loads the tree's @stackra/runway to render the config) and flock; calls the GitHub REST API (check runs and
 *   deployments), the Encore Cloud API, Infisical (when STACKRA_DEPLOY_SECRETS=infisical) and the Workers' own URLs,
 *   each at an origin fixed in code. Never writes a secret into argv, a child's
 *   environment beyond wrangler's, a log, the ledger or a file other than wrangler's private run folder.
 * Runbook (box 1), what Lukas sets up. The two paths never share a user (the credential split, enforced by preflight):
 *   the Workers path runs wrangler and runway from a tree the build user wrote, so it holds only the Cloudflare token;
 *   the Encore path runs no tree code and alone holds the production-capable Encore credential.
 *   - Users: `stackra-deploy` (the Workers path: no login shell, never `build`, `stackra-verify` or `stackra-verifyd`),
 *     `stackra-deploy-encore` (the Encore path and its audit: no login shell, no sudo at all),
 *     `stackra-deploy-build` (installs and builds the SHA's tree; holds no secret) and `stackra-deploy-approver`
 *     (only when a Worker is set to approve). sudoers: `stackra-deploy ALL=(stackra-deploy-build) NOPASSWD: /usr/bin/env`
 *     and nothing for stackra-deploy-encore.
 *   - Folders, Workers path: STACKRA_DEPLOY_HOME=/work/stackra/deploy, 0700 stackra-deploy (ledger/, locks/, state/,
 *     run/); STACKRA_DEPLOY_MIRROR=/work/stackra/deploy-mirror.git, 0755 stackra-deploy (main and tags only, nothing
 *     secret; the build user clones from it); STACKRA_DEPLOY_WORK=/work/stackra/deploy-work, 0755 stackra-deploy-build;
 *     /etc/stackra-deploy 0750 root:stackra-deploy holding its secret files, each 0400 stackra-deploy;
 *     STACKRA_DEPLOY_BOX_GREEN_DIR (records owned by STACKRA_DEPLOY_BOX_GREEN_OWNER, the user that runs the box trains)
 *     and STACKRA_DEPLOY_APPROVALS (0755 stackra-deploy-approver).
 *   - Folders, Encore path: STACKRA_DEPLOY_HOME=/work/stackra/deploy-encore, 0700 stackra-deploy-encore, with its own
 *     STACKRA_DEPLOY_MIRROR=/work/stackra/deploy-encore/mirror.git; /etc/stackra-deploy-encore (ENCORE_SECRET_DIR) 0700
 *     stackra-deploy-encore holding its one credential file, 0400. The Workers path refuses to run while it can reach
 *     that folder or names an Encore setting; the Encore path refuses any Workers setting, a credential outside that
 *     folder, or a user that can act as the build user.
 *   - Two service clones, one per path user, each owned by it and writable by it only: /work/stackra/deploy-service
 *     (stackra-deploy) and /work/stackra/deploy-encore/service (stackra-deploy-encore), each `git clone` of main, then
 *     `pnpm install --frozen-lockfile --ignore-scripts --filter .` (for `yaml`) and `node tools/scripts/stackra-deploy.mjs
 *     service update` as that user (it verifies the commit and detaches HEAD there: the first pin). A change to the
 *     service's own dependencies needs that install again, by hand.
 *   - systemd, Workers: `stackra-deploy.service` (Type=oneshot, User=stackra-deploy, WorkingDirectory=its service
 *     clone, ExecStartPre=/usr/local/bin/node tools/scripts/stackra-deploy.mjs service update, ExecStart=/usr/local/bin/node
 *     tools/scripts/stackra-deploy.mjs once workers, EnvironmentFile=/etc/stackra-deploy/settings.env, Nice=10) with
 *     `stackra-deploy.timer` (OnUnitActiveSec=5min). Never `git pull` in a unit: that would run unverified main.
 *   - systemd, Encore: `stackra-deploy-encore.service` (the same with User=stackra-deploy-encore, its own clone,
 *     ExecStart=… once encore, EnvironmentFile=/etc/stackra-deploy-encore/settings.env) with its 5-minute timer;
 *     `stackra-deploy-audit.service` (User=stackra-deploy-encore, ExecStart=… encore audit) with
 *     `stackra-deploy-audit.timer` (OnCalendar=hourly while the Encore path is on, else daily) and OnFailure= to the
 *     box's alert unit, so a non-zero audit reaches a person.
 *   - Settings (none secret): STACKRA_DEPLOY_WORKERS and STACKRA_DEPLOY_ENCORE (the switches: exactly `on`, else off;
 *     a typo is a preflight problem), STACKRA_DEPLOY_ACCEPT_BOX_GREEN (`on` until stackra/verify is live, then `off`),
 *     STACKRA_DEPLOY_PROMOTION (`docs=auto,edge=auto` by default), STACKRA_DEPLOY_STEPS (10,50,100),
 *     STACKRA_DEPLOY_HOLD_SECONDS (300), STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID=57227d408957e241465c38ebd9c3959a,
 *     STACKRA_DEPLOY_STACKRA_DOMAIN (<stackra-domain>), STACKRA_DEPLOY_BUILD_AS, STACKRA_DEPLOY_BUILD_HOME,
 *     STACKRA_DEPLOY_APPROVER, STACKRA_DEPLOY_BOX_GREEN_OWNER, STACKRA_DEPLOY_WORKER_VARS_FILE (ids and vars a member
 *     declares, as JSON; none today), STACKRA_DEPLOY_ENCORE_URL (the staging origin), STACKRA_DEPLOY_ENCORE_CI_ACTORS
 *     (the CI OAuth client ids that may deploy Encore production) and the file settings below.
 *   Secrets (an owner decision, STACKRA_DEPLOY_SECRETS): `infisical` fetches each value at run time into memory with the
 *   path user's own Infisical machine identity (Universal Auth; STACKRA_DEPLOY_INFISICAL_IDENTITY_FILE holds only that
 *   identity's client, 0400; STACKRA_DEPLOY_INFISICAL_URL one of INFISICAL_ORIGINS, _PROJECT, _ENV, _PATH, and
 *   STACKRA_DEPLOY_INFISICAL_GITHUB=on for the optional GitHub token). One identity per path user, each allowed to read
 *   only its own folder: the Workers identity /ci/deploy/box1-stackra/workers (STACKRA_DEPLOY_CLOUDFLARE_TOKEN,
 *   STACKRA_DEPLOY_GITHUB_TOKEN), the Encore identity /ci/deploy/box1-stackra/encore (STACKRA_DEPLOY_ENCORE_CLIENT,
 *   STACKRA_DEPLOY_GITHUB_TOKEN); the Encore identity's file lives in ENCORE_SECRET_DIR. No person copies a value.
 *   `files` (the default and the fallback) reads 0400 files, as below.
 *   What the owner creates and places (never pasted into a chat, a command or a file in a repository): through
 *   ~/Secrets-inbox into figentra/secrets, in the new scope ci/deploy/box1-stackra (never the shared ci/deploy or
 *   ci/production), from where Lukas installs each value as a 0400 file:
 *   - STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE: an API token on account 57227d408957e241465c38ebd9c3959a only, with Workers
 *     Scripts Edit (and D1 Edit only once a Stackra-account member declares a D1 database; none does), Client IP
 *     Address Filtering set to box 1's egress address, and an expiry. Blast radius: Stackra's own Workers in that
 *     account (docs, edge); the shared services in the main account are out of its reach.
 *   - STACKRA_DEPLOY_ENCORE_CLIENT_FILE (in ENCORE_SECRET_DIR, owned by stackra-deploy-encore): an Encore OAuth client
 *     of app stackra-nzk2 with the Deployer role, for this box only, as JSON {"client_id","client_secret"}. The role is not environment-scoped: staging-only is this code's
 *     rule (tested), and the owner revokes the client to stop it at once.
 *   - STACKRA_DEPLOY_GITHUB_TOKEN_FILE (optional): a read-only token for check runs and deployments.
 *   Go-live list (each verified on the first watched deploy and recorded in the ledger by Lukas before the switch):
 *     1. `preflight` passes for both paths, as the deploy user.
 *     2. Encore builds a bare SHA of stackra-nzk2 (the app is linked to figentra/stackra and builds the generated app),
 *        and staging's `/readyz` answers 200 (the health readiness fix and #1060/#1061/#1063/#1064 merged).
 *     3. `encore audit` reads production's rollouts: the list route answers, and its rollouts name an actor and a
 *        commit (Encore documents no list route and no actor field; until both are confirmed the audit alerts, never
 *        passes silently).
 *     4. wrangler 4.148.0's real output matches what the box parses: `deployments status --json`, `versions view
 *        --json` (the message), `versions upload` (Worker Version ID) and `d1 migrations list`.
 *     5. The override reaches the 0% version on Stackra's domain: the smoke's version proof passes at 0%, and Workers
 *        Logs show the new version id for those requests.
 *     6. The token: its scope is the Stackra account only, the IP filter refuses a call from elsewhere, the expiry is
 *        set; a deploy to the main account is refused (preflight).
 *     7. docs and edge carry their version proof once deployed by CI or the owner's first deploy (`/-/version`,
 *        `x-stackra-version`), their wrangler.jsonc names the Stackra account, and runway.yaml's members name hosts on
 *        Stackra's domain.
 *     8. Wrangler runs from the deploy user's run folder with a config pointing into the build user's tree.
 *     9. The split holds: `preflight workers` as stackra-deploy and `preflight encore` as stackra-deploy-encore both
 *        pass, and `sudo -u stackra-deploy ls /etc/stackra-deploy-encore` is refused.
 *    10. Each service clone sits at the commit `service update` pinned (`status` shows the `service` line).
 *    11. The owner's own changes: CODEOWNERS (owner only) for tools/scripts/stackra-deploy.mjs, worker-smoke.mjs and
 *        d1-migration-gate.mjs through the owner-only list; the secrets model chosen (STACKRA_DEPLOY_SECRETS) and, for
 *        `infisical`, one machine identity per path user scoped to its own folder; the owner's go for each switch.
 *   Switch on: set the switch to `on` in settings.env after the go-live list is recorded; switch off: set it to `off`
 *   (the next run refuses) or stop the timer; the owner revokes the Encore client or the Cloudflare token to cut it off
 *   from outside. A run in flight finishes or rolls back; nothing restarts it.
 * Runtime: node 24 on Linux with git, flock and sudo.
 * Governing contract: ADR 0536 (box deploys); ADR 0468 (amended by 0536); ADR 0170; ADR 0352; ADR 0440; ADR 0519;
 *   ADR 0525 (secrets); STA-2783; STA-2784; STA-2786.
 * Secrets: each read at the moment it is needed, from its 0400 file of the path user or fetched from Infisical into
 *   memory (the identity's client only in the sign-in body, its access token only in Infisical requests' headers):
 *   the Encore client secret goes only in the token request's body; the Cloudflare token only into wrangler's environment (CLOUDFLARE_API_TOKEN);
 *   the GitHub token only into GitHub requests' headers. The build user's environment is PATH, HOME and CI only. Every
 *   output path is scrubbed of the values read.
 * Exit: 0 done (deployed, skipped, waiting for approval, dry run, a clean audit), 1 refused, failed, needs the owner
 *   or an audit alert, 2 usage, 75 the target's lock is held.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  accessSync,
  appendFileSync,
  constants as fsConstants,
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
import {
  migrationVerdict,
  pendingMigrations,
  REGISTRY_TRUST_TABLES,
} from "./d1-migration-gate.mjs";
import { redirectsOf, smokeWorker } from "./worker-smoke.mjs";

// ---- constants --------------------------------------------------------------------------------------------------

/** The check run that proves a SHA passed main's gate, and the App that alone may post it (pr-merge.mjs). */
export const VERIFY_CHECK = "stackra/verify";
export const VERIFY_APP_ID = 5_907_714;
/** The Encore app and the one environment this service may deploy. */
export const ENCORE_APP = "stackra-nzk2";
export const ENCORE_ENV = "staging";
/**
 * The Cloudflare account of Stackra's own Workers, the only account the box deploys to (STA-2784). The main Figentra
 * account holds the shared services (the registry, the build cache, static) and is deployed by CI only.
 */
export const STACKRA_ACCOUNT_ID = "57227d408957e241465c38ebd9c3959a";
export const MAIN_ACCOUNT_ID = "d861f9ac9df28b7f0b1298cc0c89bc9d";
/**
 * The Workers this service may deploy: Stackra's own, in the Stackra account; each must also be a runway.yaml member
 * whose wrangler.jsonc names that account. The Stackra landing is not among them: it is experience documents the OS
 * landing shell renders in figentra/os's edge Worker (ADR 0440), published by runway's product publish, not a Worker
 * of this repository.
 */
export const BOX_WORKERS = Object.freeze(["docs", "edge"]);
/** The owner's choice of 2026-11-25 (ADR 0536): Stackra's Workers promote automatically when every check passes. */
export const DEFAULT_PROMOTION = Object.freeze({ docs: "auto", edge: "auto" });
/** The one Encore environment a deploy may name; checked before any API call, the token mint included. */
export const ENCORE_DEPLOY_ENVS = Object.freeze(["staging"]);
/** The Encore environment the daily audit reads (never writes). */
export const ENCORE_AUDIT_ENV = "production";
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
/** The build user's name the runbook gives; the Encore path's user must not be able to act as it. */
export const DEFAULT_BUILD_USER = "stackra-deploy-build";
/**
 * The folder that alone holds the Encore path's credential (its OAuth client file, or its Infisical identity file),
 * readable by the Encore path's own user only. The Workers path refuses to run while it can reach this folder: the
 * Workers path runs wrangler and runway from a tree the build user wrote, so it must never be able to read a
 * production-capable Encore credential.
 */
export const ENCORE_SECRET_DIR = "/etc/stackra-deploy-encore";
/** The API origins the box talks to; fixed in code, so a changed setting cannot send a credential elsewhere. */
export const GITHUB_API = "https://api.github.com";
export const ENCORE_API = "https://api.encore.dev";
/** The Infisical origins a machine identity may sign in to (Infisical Cloud); a self-hosted one is a code change. */
export const INFISICAL_ORIGINS = Object.freeze([
  "https://eu.infisical.com",
  "https://us.infisical.com",
  "https://app.infisical.com",
]);
/**
 * The secrets the service reads, by key: the file setting that names its 0400 file (`STACKRA_DEPLOY_SECRETS=files`)
 * and the Infisical secret name the deploy user's machine identity reads (`STACKRA_DEPLOY_SECRETS=infisical`).
 */
export const SECRET_KEYS = Object.freeze({
  cloudflare: {
    label: "the Cloudflare token",
    fileSetting: "STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE",
    file: "cloudflareTokenFile",
    name: "STACKRA_DEPLOY_CLOUDFLARE_TOKEN",
  },
  encore: {
    label: "the Encore OAuth client",
    fileSetting: "STACKRA_DEPLOY_ENCORE_CLIENT_FILE",
    file: "encoreClientFile",
    name: "STACKRA_DEPLOY_ENCORE_CLIENT",
  },
  github: {
    label: "the GitHub token",
    fileSetting: "STACKRA_DEPLOY_GITHUB_TOKEN_FILE",
    file: "githubTokenFile",
    name: "STACKRA_DEPLOY_GITHUB_TOKEN",
  },
});
/**
 * The service's own code: these paths of the service clone must be its user's (or root's) and writable by their owner
 * only, so neither the build user nor the other deploy path can change what runs holding a credential.
 */
export const SERVICE_PATHS = Object.freeze([
  { path: ".", dir: true },
  { path: "tools", dir: true },
  { path: "tools/scripts", dir: true },
  { path: "tools/scripts/stackra-deploy.mjs" },
  { path: "tools/scripts/d1-migration-gate.mjs" },
  { path: "tools/scripts/worker-smoke.mjs" },
  { path: "node_modules", dir: true },
]);
/**
 * The results of an attempt the timer does not repeat at the same SHA: it holds that SHA (one `held` ledger line)
 * until main's head moves or a person runs the target by hand.
 */
export const HELD_RESULTS = Object.freeze(["failure", "needs-owner", "refused"]);
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
/** A DNS name of at least two labels. */
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
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
  if (verb === "encore" && args[0] === "audit") {
    args.shift();
    out.target = "encore";
    out.verb = "audit";
    if (args.length > 0) return null;
  } else if (verb === "workers" || verb === "encore") {
    if (args.shift() !== "run") return null;
    out.target = verb;
    out.verb = "run";
  } else if (verb === "service") {
    if (args.shift() !== "update" || args.length > 0) return null;
    out.verb = "service-update";
  } else if (verb === "preflight" || verb === "once") {
    if (args[0] === "workers" || args[0] === "encore") out.target = args.shift();
  } else if (!["status", "approve"].includes(verb)) return null;
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
    if (out.target !== "encore" && !BOX_WORKERS.includes(out.worker ?? "")) return null;
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
    if (extra !== undefined || !BOX_WORKERS.includes(name) || !["auto", "approve"].includes(mode))
      return null;
    modes[name] = mode;
  }
  return modes;
}

/** The promotion steps (percent of traffic), ascending and ending at 100; null when malformed. */
export function parseSteps(value) {
  const steps = String(value ?? "10,50,100")
    .split(",")
    .map((s) => s.trim());
  if (!steps.every((s) => /^\d{1,3}$/.test(s))) return null;
  const numbers = steps.map(Number);
  const ascending = numbers.every((n, i) => n > 0 && n <= 100 && (i === 0 || n > numbers[i - 1]));
  return ascending && numbers.at(-1) === 100 ? numbers : null;
}

/** Where secret values come from: `files` (the default, 0400 files) or `infisical`; anything else is `invalid`. */
export const secretsModeOf = (value) =>
  value === undefined || value === "" || value === "files"
    ? "files"
    : value === "infisical"
      ? "infisical"
      : "invalid";

/** The service clone this script runs from (two folders above tools/scripts). */
const OWN_CLONE = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/$/, "");

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
    cloudflareTokenFile: env.STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE || null,
    cloudflareAccountId: env.STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID || null,
    varsFile: env.STACKRA_DEPLOY_WORKER_VARS_FILE || null,
    stackraDomain: env.STACKRA_DEPLOY_STACKRA_DOMAIN || null,
    githubTokenFile: env.STACKRA_DEPLOY_GITHUB_TOKEN_FILE || null,
    // Fixed origins: no setting can point a credential at another host.
    githubApi: GITHUB_API,
    encoreClientFile: env.STACKRA_DEPLOY_ENCORE_CLIENT_FILE || null,
    encoreSecretDir: env.STACKRA_DEPLOY_ENCORE_SECRET_DIR || ENCORE_SECRET_DIR,
    encoreApp: env.STACKRA_DEPLOY_ENCORE_APP || ENCORE_APP,
    encoreEnv: env.STACKRA_DEPLOY_ENCORE_ENV || ENCORE_ENV,
    encoreApi: ENCORE_API,
    secrets: secretsModeOf(env.STACKRA_DEPLOY_SECRETS),
    infisical: {
      url: env.STACKRA_DEPLOY_INFISICAL_URL || INFISICAL_ORIGINS[0],
      identityFile: env.STACKRA_DEPLOY_INFISICAL_IDENTITY_FILE || null,
      project: env.STACKRA_DEPLOY_INFISICAL_PROJECT || null,
      environment: env.STACKRA_DEPLOY_INFISICAL_ENV || "prod",
      path: env.STACKRA_DEPLOY_INFISICAL_PATH || null,
      github: switchOf(env.STACKRA_DEPLOY_INFISICAL_GITHUB) === "on",
    },
    serviceDir: env.STACKRA_DEPLOY_SERVICE_DIR || OWN_CLONE,
    encoreUrl: env.STACKRA_DEPLOY_ENCORE_URL || null,
    encoreCiActors: (env.STACKRA_DEPLOY_ENCORE_CI_ACTORS ?? "")
      .split(",")
      .map((actor) => actor.trim())
      .filter(Boolean),
    auditHours: Number(env.STACKRA_DEPLOY_AUDIT_HOURS ?? 26),
    rolloutTimeoutMs: seconds(env.STACKRA_DEPLOY_ENCORE_ROLLOUT_MINUTES, 30) * 60,
    readyTimeoutMs: seconds(env.STACKRA_DEPLOY_READY_SECONDS, 300),
    pollMs: seconds(env.STACKRA_DEPLOY_POLL_SECONDS, 10),
  };
}

/** Refuses any Encore app or environment but stackra-nzk2 staging; the first check of the Encore path. */
export function assertEncoreTarget(app, environment) {
  if (!ENCORE_DEPLOY_ENVS.includes(environment))
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

// ---- secrets: files, or Infisical at run time ----------------------------------------------------------------

/** Whether `path` lies inside the folder `dir` (or is it). */
const inside = (path, dir) => Boolean(path) && (path === dir || path.startsWith(`${dir}/`));

/** Whether the service uses `key` at all: the GitHub token is optional, the others are required by their path. */
export const usesSecret = (s, key) =>
  key !== "github" || (s.secrets === "infisical" ? s.infisical.github : Boolean(s.githubTokenFile));

/**
 * Why the settings of the Infisical path are unusable; empty when they are. The machine identity's own client
 * (`{"client_id","client_secret"}`, Universal Auth) is the one file left, 0400 and the deploy user's; every other
 * value is fetched into memory just before use.
 */
export function infisicalProblems(s, io) {
  const problems = [];
  const i = s.infisical;
  if (!INFISICAL_ORIGINS.includes(i.url))
    problems.push(`STACKRA_DEPLOY_INFISICAL_URL must be one of ${INFISICAL_ORIGINS.join(", ")}`);
  const identity = secretFileProblem(io, "STACKRA_DEPLOY_INFISICAL_IDENTITY_FILE", i.identityFile);
  if (identity) problems.push(identity);
  if (!/^[A-Za-z0-9-]{1,64}$/.test(i.project ?? ""))
    problems.push("STACKRA_DEPLOY_INFISICAL_PROJECT must name the Infisical project id");
  if (!/^[a-z0-9-]{1,64}$/.test(i.environment))
    problems.push("STACKRA_DEPLOY_INFISICAL_ENV must be an environment slug");
  if (!/^\/[A-Za-z0-9_\-/]*$/.test(i.path ?? "") || (i.path ?? "").includes("//"))
    problems.push(
      "STACKRA_DEPLOY_INFISICAL_PATH must be the secret folder, /ci/deploy/box1-stackra/<path>",
    );
  for (const key of Object.values(SECRET_KEYS))
    if (s[key.file])
      problems.push(
        `${key.fileSetting} is set: with STACKRA_DEPLOY_SECRETS=infisical no value is a file`,
      );
  return problems;
}

/** Why the secret `key` cannot be read; null when it can (a dry run of the checks: nothing is fetched). */
export function secretProblem(s, io, key) {
  const k = SECRET_KEYS[key];
  if (s.secrets === "invalid") return 'STACKRA_DEPLOY_SECRETS must be "files" or "infisical"';
  if (s.secrets === "infisical") return infisicalProblems(s, io).join("; ") || null;
  return secretFileProblem(io, k.fileSetting, s[k.file]);
}

/** Infisical access tokens, one per host io (a run), each refreshed a minute before it expires. */
const INFISICAL_SESSIONS = new WeakMap();

/** An Infisical access token for the deploy user's machine identity (Universal Auth), registered for scrubbing. */
async function infisicalToken(s, io) {
  const held = INFISICAL_SESSIONS.get(io);
  if (held && io.now() < held.expires - 60_000) return held.token;
  const problems = infisicalProblems(s, io);
  if (problems.length > 0) throw new Error(problems.join("; "));
  let identity;
  try {
    identity = JSON.parse(readSecret(io, "the Infisical identity", s.infisical.identityFile));
  } catch (error) {
    throw new Error(`the Infisical identity file is unusable: ${scrub(error.message)}`, {
      cause: error,
    });
  }
  if (typeof identity?.client_id !== "string" || typeof identity?.client_secret !== "string")
    throw new Error("the Infisical identity file must hold client_id and client_secret");
  registerSecret(identity.client_secret);
  const answer = await io.fetch(`${s.infisical.url}/api/v1/auth/universal-auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ clientId: identity.client_id, clientSecret: identity.client_secret }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!answer.ok) throw new Error(`Infisical answered ${answer.status} to the identity's sign-in`);
  const doc = await answer.json();
  if (typeof doc.accessToken !== "string")
    throw new Error("Infisical's sign-in has no accessToken");
  registerSecret(doc.accessToken);
  INFISICAL_SESSIONS.set(io, {
    token: doc.accessToken,
    expires: io.now() + Number(doc.expiresIn ?? 600) * 1000,
  });
  return doc.accessToken;
}

/**
 * The value of the secret `key`, read at the moment it is needed and registered for scrubbing: from its 0400 file
 * (`STACKRA_DEPLOY_SECRETS=files`, the fallback) or fetched from Infisical into memory by the deploy user's own
 * machine identity (`infisical`). Neither path writes it anywhere.
 */
export async function secretValue(s, io, key) {
  const k = SECRET_KEYS[key];
  if (s.secrets === "files") return readSecret(io, k.label, s[k.file]);
  if (s.secrets !== "infisical")
    throw new Error('STACKRA_DEPLOY_SECRETS must be "files" or "infisical"');
  const token = await infisicalToken(s, io);
  const query = new URLSearchParams({
    projectId: s.infisical.project,
    environment: s.infisical.environment,
    secretPath: s.infisical.path,
    expandSecretReferences: "false",
    includeImports: "false",
  });
  const answer = await io.fetch(
    `${s.infisical.url}/api/v4/secrets/${encodeURIComponent(k.name)}?${query}`,
    { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000) },
  );
  if (!answer.ok) throw new Error(`Infisical answered ${answer.status} for ${k.name}`);
  const value = String((await answer.json())?.secret?.secretValue ?? "").trim();
  if (value === "") throw new Error(`Infisical holds no value for ${k.name}`);
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

/**
 * Why the service's own code may not run holding a credential: each of SERVICE_PATHS in the service clone must be the
 * deploy user's (or root's), not a symbolic link, and writable by its owner only; the clone must sit at a commit
 * (a detached HEAD) that `service update` pinned after its verify gate.
 */
export function serviceCodeProblems(s, io) {
  const problems = [];
  for (const { path, dir } of SERVICE_PATHS) {
    const full = path === "." ? s.serviceDir : join(s.serviceDir, path);
    const facts = fileFacts(io, full);
    if (!facts) problems.push(`the service code ${full} does not exist`);
    else if (facts.symlink || (dir ? !facts.dir : !facts.file))
      problems.push(`the service code ${full} is not a plain ${dir ? "folder" : "file"}`);
    else if (facts.uid !== io.uid && facts.uid !== 0)
      problems.push(
        `the service code ${full} is not the deploy user's: another user could change it`,
      );
    else if ((facts.mode & 0o022) !== 0)
      problems.push(`the service code ${full} is writable by its group or others`);
  }
  let head = null;
  try {
    head = io.readFile(join(s.serviceDir, ".git", "HEAD")).trim();
  } catch {
    // reported below
  }
  const pin = readState(s, io, "service");
  if (!SHA.test(head ?? ""))
    problems.push(
      "the service clone is not pinned to a commit: run `service update` (it detaches HEAD)",
    );
  else if (pin?.sha !== head)
    problems.push(
      `the service runs at ${head}, which no \`service update\` pinned after its verify gate`,
    );
  return problems;
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
 * The credential split, Encore side: the Encore path runs as its own user (stackra-deploy-encore), which runs no tree
 * code, holds no Workers setting and cannot act as the build user; its credential (the OAuth client file, or its
 * Infisical identity) lives only in the Encore secret folder.
 */
export function encoreSplitProblems(s, io) {
  const problems = [];
  const credential = s.secrets === "infisical" ? s.infisical.identityFile : s.encoreClientFile;
  const setting =
    s.secrets === "infisical"
      ? "STACKRA_DEPLOY_INFISICAL_IDENTITY_FILE"
      : "STACKRA_DEPLOY_ENCORE_CLIENT_FILE";
  if (!inside(credential, s.encoreSecretDir) || credential === s.encoreSecretDir)
    problems.push(
      `${setting} must be a file in ${s.encoreSecretDir}, the Encore path's own folder`,
    );
  if (s.cloudflareTokenFile || s.buildAs || s.workers === "on")
    problems.push(
      "the Encore path runs as its own user, with no Workers setting (STACKRA_DEPLOY_WORKERS, " +
        "STACKRA_DEPLOY_CLOUDFLARE_TOKEN_FILE, STACKRA_DEPLOY_BUILD_AS)",
    );
  if (io.canSudo(DEFAULT_BUILD_USER))
    problems.push(
      `the Encore path's user can act as ${DEFAULT_BUILD_USER}: it must run no tree code`,
    );
  return problems;
}

/**
 * The credential split, Workers side: the Workers path runs wrangler and runway from a tree the build user wrote, so
 * it must not be able to reach the Encore path's credential at all, nor name it.
 */
export function workersSplitProblems(s, io) {
  const problems = [];
  if (s.encoreClientFile || s.encore === "on")
    problems.push(
      "the Workers path holds no Encore setting (STACKRA_DEPLOY_ENCORE, STACKRA_DEPLOY_ENCORE_CLIENT_FILE): " +
        "Encore runs as its own user",
    );
  if (io.canAccess(s.encoreSecretDir))
    problems.push(
      `the Workers path's user can reach ${s.encoreSecretDir}: the Encore credential must be out of its reach`,
    );
  if (s.secrets === "infisical" && inside(s.infisical.identityFile, s.encoreSecretDir))
    problems.push("the Workers path's Infisical identity must not be the Encore path's");
  return problems;
}

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
  if (s.secrets === "invalid")
    problems.push('STACKRA_DEPLOY_SECRETS must be "files" or "infisical"');
  else if (s.secrets === "files" && s.githubTokenFile) {
    // Optional: the public API answers without a token, at a lower rate.
    const problem = secretFileProblem(io, "STACKRA_DEPLOY_GITHUB_TOKEN_FILE", s.githubTokenFile);
    if (problem) problems.push(problem);
  }
  const home = fileFacts(io, s.home);
  if (!home) problems.push(`STACKRA_DEPLOY_HOME (${s.home}) does not exist`);
  else if (home.uid !== io.uid || (home.mode & 0o077) !== 0)
    problems.push(`STACKRA_DEPLOY_HOME (${s.home}) must be 0700 and the deploy user's`);
  if (target !== "encore" && (s.mirror === s.home || s.mirror.startsWith(`${s.home}/`)))
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
    problems.push(...serviceCodeProblems(s, io), ...encoreSplitProblems(s, io));
    const problem = secretProblem(s, io, "encore");
    if (problem) problems.push(problem);
    if (!/^https:\/\/[^/\s]+$/.test(s.encoreUrl ?? ""))
      problems.push("STACKRA_DEPLOY_ENCORE_URL must be the staging origin, https://<host>");
    return problems;
  }
  if (dryRun) return problems;

  problems.push(...serviceCodeProblems(s, io), ...workersSplitProblems(s, io));
  const problem = secretProblem(s, io, "cloudflare");
  if (problem) problems.push(problem);
  if (s.cloudflareAccountId !== STACKRA_ACCOUNT_ID)
    problems.push(
      s.cloudflareAccountId === MAIN_ACCOUNT_ID
        ? "STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID names the main account: the box never deploys there (CI does)"
        : `STACKRA_DEPLOY_CLOUDFLARE_ACCOUNT_ID must be the Stackra account ${STACKRA_ACCOUNT_ID}`,
    );
  if (!DOMAIN.test(s.stackraDomain ?? ""))
    problems.push(
      "STACKRA_DEPLOY_STACKRA_DOMAIN must name Stackra's own domain (<stackra-domain>)",
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
    problems.push("STACKRA_DEPLOY_STEPS must be ascending percentages ending at 100 (10,50,100)");
  for (const [setting, value] of [
    ["STACKRA_DEPLOY_HOLD_SECONDS", s.holdMs],
    ["STACKRA_DEPLOY_PROPAGATION_SECONDS", s.propagationMs],
  ])
    if (!Number.isFinite(value) || value < 0)
      problems.push(`${setting} must be a number of seconds`);
  if (!Number.isInteger(s.smokeAttempts) || s.smokeAttempts < 1)
    problems.push("STACKRA_DEPLOY_SMOKE_ATTEMPTS must be a whole number, at least 1");
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
    if (usesSecret(s, "github"))
      headers.authorization = `Bearer ${await secretValue(s, io, "github")}`;
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
 * the box never runs) or does not name the Stackra account itself.
 */
export function placeConfig(config, memberDir, accountId) {
  if (config.migrations !== undefined)
    throw new Error("the Worker ships Durable Object migrations: a deploy at 100% needs the owner");
  // The member's own wrangler.jsonc states the account: runway.yaml has one account for the whole root (the main one).
  if (config.account_id !== accountId)
    throw new Error(
      `wrangler.jsonc names account ${config.account_id ?? "none"}, not the Stackra account ${accountId}`,
    );
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

/** The member's custom domains that are not Stackra's own domain (or a name under it). */
export const foreignHosts = (member, domain) =>
  (member.customDomains ?? []).filter((host) => host !== domain && !host.endsWith(`.${domain}`));

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
  if (!BOX_WORKERS.includes(worker))
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
  // Stackra's own Workers answer on Stackra's own domain only (the main account's zone is not reachable from its account).
  const foreign = s.stackraDomain ? foreignHosts(member, s.stackraDomain) : [];
  if (foreign.length > 0 || (!dryRun && (member.customDomains ?? []).length === 0))
    return finish("refused", {
      reason: `${worker} must answer on ${s.stackraDomain} only, not ${foreign.join(", ") || "no host"}`,
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

  // The token is read only later, after every gate and the build: it goes to wrangler alone.
  const vars = readVars(io, s);
  for (const name of caller.vars)
    if (vars[name] === undefined)
      return finish("refused", {
        reason: `${name} (a variable of ${workflow}) is not in the vars file`,
      });

  const run = join(s.home, "run", `${worker}-${sha.slice(0, 12)}-${started}`);
  const tree = join(s.work, `${worker}-${sha.slice(0, 12)}-${started}`);
  // Read once, after every gate and the build; the catch path's rollback reuses it rather than reading it again.
  let token;
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

    token = await secretValue(s, io, "cloudflare");
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

    // ---- the site's own redirects (docs), checked at every step ----
    const redirectsFile = join(memberDir, ".stackra", "site", "build", "client", "_redirects");
    const redirects = io.exists(redirectsFile) ? redirectsOf(io.readFile(redirectsFile)) : [];
    /** One smoke stage: `version` is the override target (none: production as it serves), `expect` must answer. */
    const smoke = async (stage, version, expect) => {
      let last;
      for (let attempt = 1; attempt <= s.smokeAttempts; attempt += 1) {
        if (attempt > 1) await io.sleep(s.propagationMs);
        try {
          last = await smokeWorker(io, {
            root,
            member: worker,
            workerName: config.name,
            version,
            expect,
            redirects,
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
      const health = restored
        ? await smoke("after-rollback", undefined, oldVersion)
        : "not restored";
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
        // An insert into a table that grants rights is a trust change, not data: it waits for the owner (gate 3).
        const verdict = migrationVerdict(
          pending.map((file) => ({ file, sql: io.readFile(join(dir, file)) })),
          { ownerTables: [...REGISTRY_TRUST_TABLES] },
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

    const previewFailure = await smoke(0, newVersion, newVersion);
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
      const failure = await smoke(percent, newVersion, newVersion);
      if (failure) return rollBack(`the ${percent}% smoke failed: ${failure}`);
    }
    const live = await smoke("live", undefined, newVersion);
    if (live) return rollBack(`the live smoke failed: ${live}`);
    writeState(s, io, target, null);
    return finish("success", { newVersion });
  } catch (error) {
    const reason = scrub(error.message);
    if (entry.newVersion && entry.oldVersion && token !== undefined) {
      // A failure after the version joined the deployment: production goes back to the old version. The rollback
      // never throws past here, so the attempt always ends in its ledger line.
      const back = await Promise.resolve()
        .then(() =>
          io.run(
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
            { cwd: run, env: wranglerEnv(s, run, token) },
          ),
        )
        .catch(() => ({ code: 1 }));
      try {
        writeState(s, io, target, null);
      } catch {
        // The ledger line below still records the attempt.
      }
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

/** Refuses an Encore environment a deploy may not name; runs before any API call, the token mint included. */
export function assertEncoreDeployEnv(environment) {
  if (!ENCORE_DEPLOY_ENVS.includes(environment))
    throw new Error(
      `refused: the box deploys Encore environments ${ENCORE_DEPLOY_ENVS.join(", ")} only, never "${environment}"`,
    );
}

/**
 * The Encore Cloud API client: a one-hour token from the OAuth client, refreshed before it expires. Each call names
 * its environment and is recorded in `calls` (method, kind, environment, time) before it is made; a write is refused
 * for any environment outside ENCORE_DEPLOY_ENVS, and a read for any but those and the audit's.
 */
export function encoreClient(s, io, calls = []) {
  let token = null;
  let expires = 0;
  const app = encodeURIComponent(s.encoreApp);
  const call = async ({ method, kind, env, path, body }) => {
    if (method !== "GET") assertEncoreDeployEnv(env);
    else if (env !== null && env !== ENCORE_AUDIT_ENV) assertEncoreDeployEnv(env);
    if (token === null || io.now() > expires - 5 * 60_000) {
      const client = JSON.parse(await secretValue(s, io, "encore"));
      if (typeof client.client_id !== "string" || typeof client.client_secret !== "string")
        throw new Error("the Encore OAuth client file must hold client_id and client_secret");
      registerSecret(client.client_secret);
      calls.push({ method: "POST", kind: "token", env, at: new Date(io.now()).toISOString() });
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
    calls.push({ method, kind, env, at: new Date(io.now()).toISOString() });
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
        `Encore answered ${answer.status} to ${method} ${kind} (${env ?? "app"}): ${scrub(doc.error?.code ?? "")}`,
      );
    return doc.data ?? doc;
  };
  return {
    /** Starts a rollout of `sha` in `env`: refused before any call unless `env` is allowed. */
    trigger: async (env, sha) => {
      assertEncoreDeployEnv(env);
      return call({
        method: "POST",
        kind: "rollout",
        env,
        path: `/api/apps/${app}/envs/${encodeURIComponent(env)}/rollouts`,
        body: { sha },
      });
    },
    rollout: (id, env) =>
      call({
        method: "GET",
        kind: "rollout-read",
        env,
        path: `/api/apps/${app}/rollouts/${encodeURIComponent(id)}`,
      }),
    /** The recent rollouts of `env` (a read: the audit's). */
    list: (env) =>
      call({
        method: "GET",
        kind: "rollouts-list",
        env,
        path: `/api/apps/${app}/envs/${encodeURIComponent(env)}/rollouts`,
      }),
  };
}

/** Follows a rollout to its end: `{ conclusion, rollout }`, `needs-owner` for proposed infra, `timeout`. */
export async function followRollout(s, io, client, id, env = ENCORE_ENV) {
  const deadline = io.now() + s.rolloutTimeoutMs;
  for (;;) {
    const rollout = await client.rollout(id, env);
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

  // Every Encore API call is recorded with its environment.
  entry.apiCalls = [];
  const client = encoreClient(s, io, entry.apiCalls);
  try {
    const rollout = await client.trigger(ENCORE_ENV, sha);
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
    const back = await client.trigger(ENCORE_ENV, previous.sha);
    if (typeof back.id !== "string" || !/^roll_\w+$/.test(back.id))
      return finish("failure", {
        reason: `${failure}; Encore's rollback answer has no rollout id`,
        rolledBack: false,
        rollback: { sha: previous.sha, rollout: null, ready: false },
      });
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

// ---- the daily Encore production audit ----------------------------------------------------------------------

/** A rollout's commit, from whichever field Encore names it in. */
const rolloutSha = (r) =>
  [r.commit?.hash, r.commit_hash, r.commit, r.sha].find(
    (v) => typeof v === "string" && SHA.test(v),
  ) ?? null;

/** Who started a rollout, from whichever field Encore names it in; null when it names nobody. */
const rolloutActor = (r) =>
  [r.trigger?.actor, r.triggered_by, r.actor, r.author?.id].find(
    (v) => typeof v === "string" && v !== "",
  ) ?? null;

/**
 * Why a production rollout is not from CI; empty when it is. "From CI" means both: its actor is one of the CI OAuth
 * clients (STACKRA_DEPLOY_ENCORE_CI_ACTORS, never the box's own client), and GitHub records a successful deployment of
 * its commit to the `production` environment (the CI job's record, ADR 0170 `records: github-deployments`). A rollout
 * that names no actor or no commit cannot be shown to be from CI, so it is reported too.
 */
export function rolloutProblems(rollout, { ciActors, boxActor, deployedByCi }) {
  const problems = [];
  const actor = rolloutActor(rollout);
  const sha = rolloutSha(rollout);
  if (actor === null) problems.push("it names no actor");
  else if (actor === boxActor) problems.push("the box's own OAuth client started it");
  else if (!ciActors.includes(actor)) problems.push(`its actor ${actor} is not a CI client`);
  if (sha === null) problems.push("it names no commit");
  else if (!deployedByCi)
    problems.push(`GitHub records no successful production deployment of ${sha}`);
  return problems;
}

/** Whether GitHub records a successful deployment of `sha` to `production` (public reads; the token is optional). */
export async function deployedToProduction(s, io, sha) {
  const headers = { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
  if (usesSecret(s, "github"))
    headers.authorization = `Bearer ${await secretValue(s, io, "github")}`;
  const base = `${s.githubApi}/repos/${s.repo}/deployments`;
  const list = await io.fetch(`${base}?sha=${sha}&environment=production&per_page=20`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!list.ok) throw new Error(`GitHub answered ${list.status} for the deployments of ${sha}`);
  for (const deployment of await list.json()) {
    const statuses = await io.fetch(`${base}/${deployment.id}/statuses?per_page=20`, {
      headers,
      signal: AbortSignal.timeout(30_000),
    });
    if (statuses.ok && (await statuses.json()).some((status) => status.state === "success"))
      return true;
  }
  return false;
}

/**
 * The daily audit (`encore audit`, its own timer): every production rollout of stackra-nzk2 queued in the last
 * STACKRA_DEPLOY_AUDIT_HOURS must be from CI. One ledger line; exit 1 (which the timer surfaces) on an alert or when
 * the rollouts cannot be read, which is never taken as clean.
 */
export async function auditEncore(s, io) {
  const started = io.now();
  const entry = {
    target: `encore:${ENCORE_AUDIT_ENV}-audit`,
    env: ENCORE_AUDIT_ENV,
    app: ENCORE_APP,
    apiCalls: [],
    windowHours: s.auditHours,
  };
  const finish = (result, extra = {}) => {
    Object.assign(entry, extra, { result, durationMs: io.now() - started });
    appendLedger(s, io, entry);
    io.log(`${entry.target} ${result}${extra.reason ? `: ${extra.reason}` : ""}`);
    return { code: result === "clean" ? 0 : 1, result };
  };
  try {
    assertEncoreTarget(s.encoreApp, s.encoreEnv);
    const problem = secretProblem(s, io, "encore");
    if (problem) return finish("error", { reason: problem });
    const boxActor = JSON.parse(await secretValue(s, io, "encore")).client_id;
    const answer = await encoreClient(s, io, entry.apiCalls).list(ENCORE_AUDIT_ENV);
    const rollouts = Array.isArray(answer) ? answer : (answer.rollouts ?? answer.items ?? null);
    if (!Array.isArray(rollouts))
      return finish("error", { reason: "Encore's answer holds no rollout list" });
    const since = started - s.auditHours * 3_600_000;
    const recent = rollouts.filter((r) => {
      const at = Date.parse(r.queued_at ?? r.started_at ?? "");
      return Number.isNaN(at) || at >= since;
    });
    const verdicts = [];
    for (const rollout of recent) {
      const sha = rolloutSha(rollout);
      const deployedByCi = sha === null ? false : await deployedToProduction(s, io, sha);
      const problems = rolloutProblems(rollout, {
        ciActors: s.encoreCiActors,
        boxActor,
        deployedByCi,
      });
      verdicts.push({ id: rollout.id ?? null, sha, actor: rolloutActor(rollout), problems });
    }
    const alerts = verdicts.filter((v) => v.problems.length > 0);
    return alerts.length === 0
      ? finish("clean", { rollouts: verdicts })
      : finish("alert", {
          rollouts: verdicts,
          reason: alerts.map((a) => `${a.id ?? "?"}: ${a.problems.join("; ")}`).join(" | "),
        });
  } catch (error) {
    return finish("error", { reason: scrub(error.message) });
  }
}

// ---- the timer pass ---------------------------------------------------------------------------------------------

/**
 * The attempt that holds `target` at `sha`: the newest real (not dry-run) ledger line of that target at that SHA, when
 * it ended in failure, needs-owner or refused. The timer never repeats such an SHA; a new head of main or a run by hand
 * (which writes a newer line) clears it.
 */
export function heldAttempt(entries, target, sha) {
  const last = entries.findLast(
    (e) => e.target === target && e.sha === sha && !e.dryRun && e.result !== "held",
  );
  return last && HELD_RESULTS.includes(last.result) ? last : undefined;
}

/**
 * Whether the timer holds `target` at `sha`; the first pass that holds it writes one `held` ledger line and one log
 * line, later passes stay quiet (a dry run writes nothing).
 */
function timerHolds(s, io, entries, target, sha, dryRun) {
  const attempt = heldAttempt(entries, target, sha);
  if (!attempt) return false;
  const since = entries.lastIndexOf(attempt);
  const noted = entries
    .slice(since + 1)
    .some((e) => e.target === target && e.sha === sha && e.result === "held");
  if (!noted) {
    const reason = `the timer holds ${sha} after its ${attempt.result} at ${attempt.at ?? "an earlier pass"}; a new head of main or a run by hand clears it`;
    io.log(`${target}: ${reason}`);
    if (!dryRun)
      appendLedger(s, io, { target, sha, result: "held", heldFor: attempt.result, reason });
  }
  return true;
}

/**
 * One pass for the timer: for each switched-on path (or only `target`), what to deploy at main's head. Returns
 * `[{ target, args }]`, each run then under its own lock. A Worker needs a recorded deploy first (the first one is by
 * hand), a change in its closure since that deploy, and a green verify at the head; a Worker waiting for approval of
 * the head is run again so its approval is picked up. A head whose last attempt failed, needed the owner or was
 * refused is held, never retried every pass.
 */
export async function plannedRuns(s, io, { dryRun = false, target: only } = {}) {
  const runs = [];
  const wantWorkers = only !== "encore" && (s.workers === "on" || dryRun);
  const wantEncore = only !== "workers" && (s.encore === "on" || dryRun);
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
    else if (
      good.sha !== head &&
      !timerHolds(s, io, entries, `encore:${ENCORE_ENV}`, head, dryRun) &&
      (await green())
    )
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
  for (const worker of BOX_WORKERS) {
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
    if (timerHolds(s, io, entries, target, head, dryRun)) continue;
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

// ---- the service's own code: pinned to a verified SHA ----------------------------------------------------------

/** Runs git against the service clone (the code this script runs from). */
const serviceGit = (s, io, args) =>
  io.run("git", ["-C", s.serviceDir, ...args], {
    env: { PATH: s.path, GIT_TERMINAL_PROMPT: "0" },
  });

/**
 * `service update` (the service unit's ExecStartPre, in place of `git pull`): moves the service clone to main's head
 * only when that head passed the same verify gate a deploy needs and is a fast-forward of the pinned commit, and
 * records the pin (state/service.json and a ledger line). Until then the clone stays at the last pinned commit. Every
 * deploy's preflight refuses a clone that is not at its pinned commit, so code that reached main without a green
 * verify never runs holding a credential. Exit 0 when the clone sits at a pinned commit, else 1 (the unit then stops
 * before the deploy runs).
 */
export async function serviceUpdate(s, io) {
  const target = "service";
  const record = (result, extra) => {
    appendLedger(s, io, { target, ...extra, result });
    io.log(`service ${extra.sha ?? ""} ${result}${extra.reason ? `: ${extra.reason}` : ""}`);
  };
  const pinned = readState(s, io, target);
  const current = (await serviceGit(s, io, ["rev-parse", "HEAD"])).stdout.trim();
  if (!SHA.test(current)) {
    record("refused", { reason: "the service clone has no HEAD commit" });
    return { code: 1, result: "refused" };
  }
  const dirty = await serviceGit(s, io, ["status", "--porcelain", "--untracked-files=no"]);
  if (dirty.code !== 0 || dirty.stdout.trim() !== "") {
    record("refused", { sha: current, reason: "the service clone has local changes" });
    return { code: 1, result: "refused" };
  }
  const fetched = await serviceGit(s, io, [
    "fetch",
    "--quiet",
    "--no-write-fetch-head",
    s.remote,
    "+refs/heads/main:refs/remotes/origin/main",
  ]);
  const head = (await serviceGit(s, io, ["rev-parse", "refs/remotes/origin/main"])).stdout.trim();
  const atPin = pinned?.sha === current;
  if (fetched.code !== 0 || !SHA.test(head)) {
    record(atPin ? "kept" : "refused", {
      sha: current,
      reason: `main could not be fetched: ${tail(fetched.stderr)}`,
    });
    return { code: atPin ? 0 : 1, result: atPin ? "kept" : "refused" };
  }
  if (atPin && head === current) return { code: 0, result: "current" };
  // The commit to pin: main's head when it moves forward, else the clone's own commit (the first pin).
  const candidate = head;
  if (candidate !== current) {
    const forward = await serviceGit(s, io, ["merge-base", "--is-ancestor", current, candidate]);
    if (forward.code !== 0) {
      record(atPin ? "kept" : "refused", {
        sha: candidate,
        from: current,
        reason: `${candidate} is not a fast-forward of ${current}`,
      });
      return { code: atPin ? 0 : 1, result: atPin ? "kept" : "refused" };
    }
  }
  const gate = await verifyGate(s, io, candidate);
  if (!gate.ok) {
    // Logged once per SHA: the timer runs this every pass.
    const entries = readLedger(s, io);
    const noted = entries.some(
      (e) => e.target === target && e.sha === candidate && e.result === "held",
    );
    if (!noted) record("held", { sha: candidate, from: current, reason: gate.reason });
    return { code: atPin ? 0 : 1, result: atPin ? "kept" : "held" };
  }
  const moved = await serviceGit(s, io, [
    "-c",
    "advice.detachedHead=false",
    "checkout",
    "--quiet",
    "--detach",
    candidate,
  ]);
  if (moved.code !== 0) {
    record("failure", { sha: candidate, from: current, reason: tail(moved.stderr) });
    return { code: atPin ? 0 : 1, result: "failure" };
  }
  writeState(s, io, target, {
    sha: candidate,
    from: current,
    verify: gate.via,
    at: new Date(io.now()).toISOString(),
  });
  record("pinned", { sha: candidate, from: current, verify: { via: gate.via ?? null } });
  return { code: 0, result: "pinned" };
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
      return {
        uid: st.uid,
        mode: st.mode,
        file: st.isFile(),
        dir: st.isDirectory(),
        symlink: st.isSymbolicLink(),
      };
    },
    canAccess: (path) => {
      for (const mode of [fsConstants.R_OK, fsConstants.X_OK])
        try {
          accessSync(path, mode);
          return true;
        } catch {
          // not with this mode
        }
      return false;
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
  "usage: stackra-deploy.mjs preflight [workers|encore] | once [workers|encore] [--dry-run] | status\n" +
  "       | service update\n" +
  "       | workers run --worker <docs|edge> --sha <sha> [--dry-run] | encore audit\n" +
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
    for (const worker of BOX_WORKERS) {
      const state = readState(s, io, `worker:${worker}`);
      if (state)
        io.log(
          `${worker}: ${state.phase} ${state.sha} new ${state.newVersion} old ${state.oldVersion}`,
        );
    }
    return 0;
  }
  if (options.verb === "audit") {
    const lock = lockPath(s, "encore-audit");
    if (process.env.STACKRA_DEPLOY_LOCK !== lock) return runLocked(s, "encore-audit", argv);
    return (await auditEncore(s, io)).code;
  }
  if (options.verb === "approve") {
    io.log(`approval written: ${writeApproval(s, io, options)}`);
    return 0;
  }
  if (options.verb === "service-update") {
    const lock = lockPath(s, "service");
    if (process.env.STACKRA_DEPLOY_LOCK !== lock) return runLocked(s, "service", argv);
    return (await serviceUpdate(s, io)).code;
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
