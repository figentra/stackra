#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the Stackra verify service (STA-2761, replaces the merge-now rule STA-2083). For a head SHA it runs main's
 *   whole Quality Gate (ci.yml's `dependency-scan` and `gate` jobs step by step, GATE_STEPS, then the licence policy
 *   in tools/policy/licences.json and the tests) in throwaway containers, every step to the end, and records the
 *   result as a `stackra/verify` check run posted by the stackra-verify GitHub App (id 5907714), plus a ledger line.
 *   `pr-merge.mjs` refuses a merge without a successful check run from that App on the PR's current head. The same
 *   App posts two checks that are never required: `stackra/verify-mobile` (ci.yml's `mobile` job: the two Uniwind
 *   Pro members the gate leaves out, on the licensed path; its failures, licence ones included, touch nothing else)
 *   and `stackra/codeql` (CodeQL nightly on main and for PRs labelled `codeql` or `risk:R3`). All three carry the
 *   same head SHA and `external_id` (`base:<main>`).
 *   Verbs:  run --sha <sha> [--pr <n>]  |  once  |  daemon [--interval <s>]      Common: [-R owner/repo] (repeatable)
 * Boundary: trust as the CTO ruled on 2026-11-24 (decisions A, B, C):
 *   - This process (the daemon user) is the only trusted actor. It holds the App key in a 0400 file, fetches into its
 *     own mirror, archives the exact SHA with `git archive`, builds the warm pnpm store image from main's lockfile, and
 *     reads results. PR code never runs as this user and never sees the mirror, the key, the ledger or the state.
 *   - PR code runs only inside containers of the verify user's own rootless Docker (STACKRA_VERIFY_RUN_AS through
 *     `sudo -n -u <user> -- sh` with an env file), two per run: an install container on a per-run `--internal`
 *     network whose only way out is the daemon's allowlisting proxy (the package registries; nothing secret is inside
 *     it), committed to a run image, then a verify container from that image with `--network none`. Both drop
 *     every capability, set no-new-privileges, and are capped (cpus, memory, pids, tmpfs sizes); the verify container
 *     is killed at the time limit. The writable layer has no disk quota (rootless overlay on ext4 has none), so the
 *     free-space gate and the per-run clean-up bound it.
 *   - The install network is sealed: before every install, a throwaway probe container on the same network tries to
 *     reach the instance metadata service (169.254.169.254, which hands out the box's IAM credentials), the internal
 *     network's gateway and DNS, docker0, the rootless host-loopback gateway, the box's own addresses and their
 *     service ports, directly and through the proxy. Any answer, or a probe that fails twice, stops the service. The
 *     host's backstop is per-uid REJECT rules for the verify user, set up by the box operator. Residual: the proxy
 *     admits the registries' hostnames on 443, so a PR could send data out to a service fronted on the same CDN
 *     (SNI/domain fronting). That is exfiltration only, the PR's own log is an equal channel, and no secret is there.
 *   - Nothing that a later run uses can be written by a PR: HOME and /tmp are per-run tmpfs; the warm store lives in
 *     image layers (read-only, copy-on-write per container); the base image is pinned by digest and pulled (verified)
 *     each run; the store image id is checked against the id this process recorded; after each run every container,
 *     volume, network and image except those two is removed. No container gets a Docker socket or any secret.
 *   - The result is the verify container's exit code, read with `docker inspect`; output is display only, scrubbed
 *     and size-capped. A container that never started is an `error`, never a pass.
 *   - The PR never defines its own verify: the tested tree is the PR head merged onto main's head (`git merge-tree`;
 *     a conflict is a failure), with main's verify definition laid over it (`isVerifyOverlay` paths and every
 *     package.json `scripts`, wherever main has the file). pr-merge.mjs asks the owner's review for a PR that changes
 *     that definition (condition 6). The mirror is the daemon's own, read with replace objects off.
 *   - Nothing crosses sudo or docker as an argument value: PATH and DOCKER_HOST come from an env file the verify user
 *     sources, the container environment from `--env-file`; every spawn has a timeout. A preflight refuses a host
 *     where the verify user can read the key holder's files or the shared Docker socket, or has no cgroup caps.
 *   - The SHA is bound once: the head resolved for the job is the SHA archived and the SHA the check run names; if a
 *     PR's head moved meanwhile, nothing is posted and the PR is verified again at its new head.
 *   - One service per box: the process re-executes itself under `flock -n` on STACKRA_VERIFY_HOME/lock.
 * Threat model, stated plainly: the service proves that a PR's code passes main's checks on our machines, cannot
 *   forge or replay a result, cannot reach the key, the host's services or instance credentials, and cannot poison
 *   another run. It cannot prove that a PR's own code is honest: code that runs during install or test can always
 *   make its own run pass (an emptied test does that too). That is what review, the risk:R3 label on a change to
 *   the verify definition, and the owner's approval are for. Residual risk: a verify-user escape from a container
 *   could alter the kept base or store image layers on disk without changing their ids.
 *   Start it directly from systemd, never through secrets-exec: it needs no stackra-bot secret, only its own key file.
 * Runbook (box 1): the unit runs as `User=stackra-verifyd` from the code clone /work/stackra/service with
 *     ExecStart=/usr/local/bin/node tools/scripts/stackra-verify.mjs daemon -R figentra/stackra -R figentra/stackra-template
 *   and these settings (none is a secret; the files they name are):
 *     STACKRA_VERIFY_HOME=/work/stackra/verify (the daemon's home; set to 0711 at start, so the verify user can reach
 *       a run's inputs by name and never list it), STACKRA_VERIFY_RUN_AS=stackra-verify (uid 1003),
 *       STACKRA_VERIFY_DOCKER_HOST (that user's rootless Docker), STACKRA_VERIFY_DOCKER_ROOT=/work/stackra/verify-docker/data,
 *       STACKRA_VERIFY_BASE_IMAGE (name@sha256:…), STACKRA_VERIFY_CPUS=8 (a number, `docker --cpus`),
 *       STACKRA_VERIFY_CPUSET=0-7 (a CPU list, `docker --cpuset-cpus`), STACKRA_VERIFY_MEMORY, STACKRA_VERIFY_PIDS;
 *     STACKRA_VERIFY_APP_ID=5907714, STACKRA_VERIFY_INSTALLATION_ID=185462179, STACKRA_VERIFY_KEY_FILE (the App's
 *       private key) and STACKRA_VERIFY_LICENCE_FILE=/etc/stackra-verify/uniwind.token (the Uniwind Pro CI token):
 *       /etc/stackra-verify is 0750 root:stackra-verifyd and each file in it 0400 stackra-verifyd;
 *     STACKRA_VERIFY_SHA256_ACTIONLINT, _ZIZMOR, _OSV_SCANNER, _GITLEAKS, _SHFMT, _SQUAWK, _SHELLCHECK (required: the
 *       sha256 of each TOOLS download, from the release's published checksums; main has no mise.lock);
 *     STACKRA_VERIFY_OSV_DIR (default <home>/osv; refreshed by the daemon every 6 h) and STACKRA_VERIFY_OSV_MAX_AGE_H
 *       (default 24: an older database is a service error, never a green scan);
 *     STACKRA_VERIFY_CODEQL_BUNDLE_URL and STACKRA_VERIFY_CODEQL_BUNDLE_SHA256 (both or neither; neither: no CodeQL),
 *       STACKRA_VERIFY_CODEQL_LANGUAGES (default javascript-typescript,actions), STACKRA_VERIFY_CODEQL_HOUR_UTC (2);
 *     STACKRA_VERIFY_PROTECTED_ROOTS (default /work,/work/stackra: each traverse-only for the verify user, o=x, and
 *       listable by the service) and STACKRA_VERIFY_ALLOW_PATHS (default /work/stackra/verify, /work/stackra/service,
 *       /work/stackra/verify-work, /work/stackra/verify-docker): deny by default, every other entry of a protected
 *       root the verify user can read or list stops the service, and so does a protected path that does not exist.
 *   Licensed builds (uniwind-pro): the daemon builds them into a separate licensed image on top of the store image,
 *   for stackra/verify-mobile only (the gate's store image never holds one), from main's versions, with the licence
 *   token as a BuildKit secret (piped on stdin, never a file, ENV, ARG or layer), scans the image history and every
 *   layer for the token and refuses the image if it is there, and PR installs only copy the built output. Both
 *   images are for this box only: never pushed to or published in any registry (licence: our own use).
 *   The service clone needs main's `yaml` (the root's devDependency, the parser buildTree reads a PR's
 *   pnpm-workspace.yaml with): `pnpm install --frozen-lockfile --ignore-scripts --filter .` in /work/stackra/service,
 *   and again when main's lockfile moves `yaml`; the preflight and the self-check refuse a missing or different one.
 *   What PR code can reach before the gate: the install container runs `pnpm rebuild --ignore-pnpmfile` for main's
 *   allowBuilds only, at the versions the PR's lockfile resolves (registry code the PR chose for those packages; main's
 *   allowBuilds limits which), with main's pnpmfile and settings (buildTree keeps every pnpm-workspace.yaml key but
 *   packages, catalog, catalogs and overrides main's). The licence step runs first in the gate, before any
 *   lockfile-installed tool.
 *   Self-update: between passes the daemon fetches main (only main) into its own clone, and when any file it loaded
 *   (SERVICE_FILES) differs from main it fast-forwards a clean clone after the new code's `self-check` passed in a
 *   staged copy, then exits RESTART_EXIT so the shell that holds the lock starts the new code; a refused switch keeps
 *   the old code and every job posts neutral naming the reason. Every switch and refusal is in ledger/service.jsonl.
 *   Shared steps (format-check, knip: one process over every member) run with main's copy of every config module they
 *   could execute (SHARED_STEP_LOADERS); a new member's own config, kept for its per-package steps, is set aside for
 *   them. When knip then reports the new member as misconfigured, that is an honest red: the PR resolves it through
 *   risk:R3 and the owner (the config lands on main), never by keeping the config in the shared step.
 *   When stackra/verify goes neutral (the check run's "Reason" line says which), the operator's action:
 *     - "this service runs ... blob X, main has Y": self-update normally follows within one pass. If the reason adds
 *       "self-update refused: …": local changes in the clone: restore it (git -C /work/stackra/service status;
 *       discard or move the changes); not a fast-forward: fetch and reset the clone to main after reading why it moved;
 *       a job is running: wait one pass; the self-check failed: read ledger/service.jsonl, and when it names the
 *       service clone's yaml run `pnpm install --frozen-lockfile --ignore-scripts --filter .` in /work/stackra/service.
 *     - The offline OSV database is missing, too old, under 1 MiB or dated in the future, or the OSV canary failed:
 *       check the refresh in the service log (download from osv-vulnerabilities.storage.googleapis.com), then the
 *       store image (osv-scanner in it) and the canary's GHSA in the database.
 *     - Any other error three times on one SHA (a fetch, Docker, the store image, the install network or its proxy,
 *       disk): the service log names it; fix the host and post a new run (`stackra-verify.mjs run --sha <sha>`).
 *     - The egress probe found a leak or did not run: the service has stopped itself; fix the network rules first.
 *   Go-live, before the ruleset swap: the ruleset swap to stackra/verify waits until STA-2781 (replace
 *   buffers@0.1.1) has merged and main's licence-policy step passes. No buffers exception (CTO ruling 2026-11-24).
 *   The OSV canary's first real run (the daemon's first database refresh in the verify user's Docker) passes and is
 *   recorded in #1043 before the ruleset swap.
 *   stackra/verify-mobile runs the licence policy over the full install (the mobile-scoped exceptions and every licence
 *   only the mobile apps pull in). A red licence step on stackra/verify-mobile is a lane finding with an STA issue,
 *   never ignored. verify-mobile becomes required after 7 consecutive days with no infrastructure-caused red, by the
 *   CTO's decision on that date.
 * Runtime: node on Linux with flock, sudo, git, and docker for the verify user.
 * Governing contract: ADR 0119 (merge policy); ADR 0523 (decision 3); STA-2761.
 * Secrets: the App key is read from STACKRA_VERIFY_KEY_FILE (owner-placed, mode 0400) only to mint a token, which
 *   stays in the gh child's environment. No secret is passed to sudo, docker or a container: the gate runs with no
 *   token, so zizmor's online audits are off (`--offline`) and the PR facts come from the daemon's API read.
 * Exit: 0 every head recorded, 1 a head could not be recorded or the host is not set up, 2 usage, 75 lock held.
 */
import { spawn as spawnChild, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  closeSync,
  createWriteStream,
  openSync,
  readSync,
  renameSync,
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statfsSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { hostname, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import * as botNetwork from "./bot-token.mjs";
import {
  gh,
  isVerifyOverlay,
  VERIFY_OVERLAY_DIRS,
  aliasTarget,
  isGateToolPackage,
  SHARED_STEP_LOADERS,
  VERIFY_APP,
  VERIFY_CHECK,
  VERIFY_MOBILE_CHECK,
  CODEQL_CHECK,
} from "./pr-merge.mjs";

export const DEFAULT_REPO = "figentra/stackra";
export const INSTALL_COMMAND =
  "pnpm install --frozen-lockfile --store-dir /store --ignore-scripts --ignore-pnpmfile";

/**
 * The dependencies main allows to build (`allowBuilds: { name: true }` or `onlyBuiltDependencies: [name]` in main's
 * pnpm-workspace.yaml): the only build scripts the install runs, through `pnpm rebuild`. Names are checked against
 * the npm name grammar, so nothing else reaches the shell.
 */
export function allowedBuilds(workspaceYaml) {
  const names = [];
  let section = null;
  for (const line of workspaceYaml.split("\n")) {
    if (/^\S/.test(line))
      section = /^(allowBuilds|onlyBuiltDependencies):\s*$/.exec(line)?.[1] ?? null;
    else if (section === "allowBuilds") {
      const m = /^\s+["']?([@\w./-]+)["']?:\s*true\s*(?:#.*)?$/.exec(line);
      if (m) names.push(m[1]);
    } else if (section === "onlyBuiltDependencies") {
      const m = /^\s+-\s+["']?([@\w./-]+)["']?\s*(?:#.*)?$/.exec(line);
      if (m) names.push(m[1]);
    }
  }
  return [...new Set(names)].filter((n) => /^(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/.test(n));
}

/** Builds that need a licence token (their postinstall downloads a licensed binary); never run with PR code. */
export const LICENSED_BUILDS = ["uniwind-pro"];
/** The install's exit code when the PR needs a licensed build the store image does not have. */
export const NEEDS_STORE_REBUILD_EXIT = 78;

/**
 * Each locked version of `name` with its integrity, from a pnpm lockfile's `packages:` section
 * (`  name@1.2.3:` then `    resolution: {integrity: sha512-…}`). Entries without an integrity are left out.
 */
export function lockedPackages(lockText, name) {
  const escaped = name.replaceAll(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const pattern = new RegExp(
    `^  '?/?${escaped}@(\\d[\\w.+-]*)'?:\\n    resolution: \\{integrity: (sha512-[A-Za-z0-9+/=]+)`,
    "gm",
  );
  const seen = new Map();
  for (const m of lockText.matchAll(pattern)) seen.set(m[1], m[2]);
  return [...seen].map(([version, integrity]) => ({ name, version, integrity }));
}

/** The versions of `name` in a pnpm lockfile's packages and snapshots (`  name@1.2.3:` or `  name@1.2.3(peers):`). */
export function lockedVersions(lockText, name) {
  const escaped = name.replaceAll(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const pattern = new RegExp(`^  '?/?${escaped}@(\\d[\\w.+-]*)[(:']`, "gm");
  return [...new Set([...lockText.matchAll(pattern)].map((m) => m[1]))];
}

/** A pnpm `--filter` selector the service passes: a package name or path, optionally negated; nothing else. */
const FILTER = /^!?[@\w./-]+$/;

/**
 * The install: no lifecycle script and no pnpmfile from the PR; then only main's allowed builds that need no
 * licence; then each licensed package is laid in from the store image's prebuilt copy (`/prebuilt/<name>@<version>`),
 * or the install exits NEEDS_STORE_REBUILD_EXIT when the PR resolves a version the store image has not built.
 * `filters` narrow the install to the members a check covers (the Quality Gate leaves out GATE_FILTERS, as ci.yml).
 */
export function installCommand(builds, licensed = LICENSED_BUILDS, filters = []) {
  for (const filter of filters)
    if (!FILTER.test(filter)) throw new Error(`not a pnpm filter: ${filter}`);
  const free = builds.filter((b) => !licensed.includes(b));
  const steps = [[INSTALL_COMMAND, ...filters.map((f) => `--filter='${f}'`)].join(" ")];
  if (free.length) steps.push(`pnpm rebuild --ignore-pnpmfile ${free.join(" ")}`);
  for (const name of licensed.filter((l) => builds.includes(l)))
    steps.push(
      `for d in node_modules/.pnpm/${name}@*/node_modules/${name}; do [ -e "$d" ] || continue; ` +
        `v=$(node -p "require('./$d/package.json').version"); ` +
        `[ -d "/prebuilt/${name}@$v" ] || exit ${NEEDS_STORE_REBUILD_EXIT}; cp -a "/prebuilt/${name}@$v/." "$d/"; done`,
    );
  return steps.join(" && ");
}

// ---- the Quality Gate: main's ci.yml, step by step ------------------------------------------------------------

/**
 * The two members ci.yml's gate leaves out of its install, lint, typecheck and build (they alias `uniwind` to
 * Uniwind Pro, whose build needs the licence): `stackra/verify-mobile` checks them, so a licence or quota failure
 * never fails `stackra/verify`. The licence policy's `mobile`-scoped exceptions may be a dependency of these two only,
 * each named by its directory and its package name together.
 */
export const MOBILE_MEMBERS = Object.freeze([
  Object.freeze({ dir: "apps/mobile", name: "@figentra/mobile" }),
  Object.freeze({ dir: "apps/playground", name: "@figentra/playground" }),
]);
export const GATE_FILTERS = MOBILE_MEMBERS.map((member) => `!${member.name}`);
const EXCLUDE = GATE_FILTERS.map((f) => `--filter='${f}'`).join(" ");
/** Where every verify container finds the run's read-only inputs, and the gate the offline OSV database. */
export const IN_DIR = "/in";
export const OSV_MOUNT = "/osv";

/**
 * The Squawk flags of ci.yml's "Migration lint (Squawk)" step (ADR 0159 d3), byte for byte: the excluded rules are
 * house decisions, and the runner sets lock and statement timeouts per session.
 */
export const SQUAWK_FLAGS =
  "--pg-version=18.0 \\\n    --exclude=prefer-robust-stmts --exclude=prefer-text-field --exclude=ban-char-field \\\n" +
  "    --exclude=prefer-bigint-over-int \\\n    --exclude=require-lock-timeout --exclude=require-statement-timeout";

/**
 * The licence-policy step's commands over an install (review of #1043, MEDIUM A, LOW 5, LOW C; CTO ruling of round 4): main's
 * policy (/in/licences.json, the CTO's ruling of 2026-11-24) over every package that install laid down, offline; the
 * workspace's members and closures from pnpm-lock.yaml and from pnpm's own view of the installed tree, which must
 * agree. `install` is `gate` (the Quality Gate's install without the mobile members, GATE_FILTERS, which must not hold
 * a mobile-scoped package at all) or `mobile` (stackra/verify-mobile's full install, where the mobile-scoped
 * exceptions and every licence only the mobile apps pull in are checked).
 */
export function licenceRun(install) {
  if (install !== "gate" && install !== "mobile") throw new Error(`not an install: ${install}`);
  const filters = install === "gate" ? ` ${EXCLUDE}` : "";
  return [
    `pnpm licenses list --json --offline --ignore-pnpmfile --recursive${filters} > "\${TMPDIR:-/tmp}/stackra-licences.json"`,
    'pnpm list --recursive --json --depth Infinity --offline --ignore-pnpmfile > "${TMPDIR:-/tmp}/stackra-pnpm-list.json"',
    `node "$GATE_IN/licence-check.mjs" "$GATE_IN/licences.json" "\${TMPDIR:-/tmp}/stackra-licences.json" . "\${TMPDIR:-/tmp}/stackra-pnpm-list.json" ${install}`,
  ].join("\n");
}

/**
 * The Quality Gate as `stackra/verify` runs it: ci.yml's `dependency-scan` job and its `gate` job, step by step, in
 * order, with the same commands, filters and conditions; then the licence policy and the tests (STA-2761's verify
 * ran them; ci.yml leaves tests to the box). Each step names the ci.yml job and step it mirrors (`job`, `ci`, the
 * step's `- name:` line in `line`), and how it differs (`ciReplace`: text swapped, `dropEnv`: ci.yml env it cannot
 * have); a test reads ci.yml and fails when the two drift apart. Not mirrored: Checkout and Toolchain (the archived
 * tree and the store image), the Turborepo remote cache (no secret enters a verify), and Install dependencies (the
 * install container runs it with GATE_FILTERS). `when` is ci.yml's `if:` on the event; `env` values are this
 * script's own variables (FACT_* are the PR facts the daemon read from GitHub).
 */
export const GATE_STEPS = Object.freeze([
  // Not in ci.yml, so its place is free: first, before any lockfile-installed code runs (linear-key-check's
  // `pnpm exec commitlint`, lint, build, validate), reading the install pnpm laid down as the install left it.
  { id: "licence-policy", run: licenceRun("gate") },
  {
    id: "dependency-scan",
    job: "dependency-scan",
    ci: "Dependency scan (OSV-Scanner)",
    line: 59,
    // Offline: the daemon refreshes the OSV database into a read-only mount and refuses a stale one (osvDbProblem).
    env: { OSV_SCANNER_LOCAL_DB_CACHE_DIRECTORY: OSV_MOUNT },
    ciReplace: [["scan source --lockfile", "scan source --offline --lockfile"]],
    run: "osv-scanner scan source --offline --lockfile=pnpm-lock.yaml",
  },
  {
    id: "workflow-lint",
    job: "gate",
    ci: "Workflow lint",
    line: 90,
    // No network and no token in a verify: zizmor's online audits (impostor commits, ref confusion) are off.
    dropEnv: ["GH_TOKEN"],
    ciReplace: [["zizmor --config", "zizmor --offline --config"]],
    run: "actionlint\nzizmor --offline --config .github/zizmor.yml .github/workflows",
  },
  {
    id: "linear-key-check",
    job: "gate",
    ci: "Linear key check",
    line: 115,
    when: "pull_request",
    env: {
      PR_TITLE: "$FACT_TITLE",
      PR_BRANCH: "$FACT_BRANCH",
      PR_LABELS: "$FACT_LABELS",
      BASE_SHA: "$FACT_BASE",
      HEAD_SHA: "$FACT_HEAD",
    },
    run: [
      "node tools/scripts/linear.mjs check-pr",
      'case "$PR_BRANCH" in renovate/*|changeset-release/*) exit 0 ;; esac',
      "# The preset builds to dist for its tarball; here, before any build, Node reads its src (ADR 0025).",
      'NODE_OPTIONS=--conditions=@stackra/source pnpm exec commitlint --from "$BASE_SHA" --to "$HEAD_SHA"',
    ].join("\n"),
  },
  // Shared: one oxfmt process over the whole tree, which executes any nested oxfmt.config.{ts,mts} (C1).
  {
    id: "format-check",
    job: "gate",
    ci: "Format check",
    line: 130,
    run: "pnpm format:check",
    shared: true,
  },
  {
    id: "lint",
    job: "gate",
    ci: "Lint",
    line: 133,
    run: `pnpm exec turbo run lint ${EXCLUDE} && pnpm lint:root`,
  },
  {
    id: "typecheck",
    job: "gate",
    ci: "Typecheck",
    line: 141,
    env: { AFFECTED: "$AFFECTED", TURBO_SCM_BASE: "HEAD~1" },
    run: `pnpm exec turbo run typecheck \${AFFECTED:+--affected} ${EXCLUDE} --continue=dependencies-successful --concurrency=2`,
  },
  {
    id: "build",
    job: "gate",
    ci: "Build",
    line: 149,
    env: { AFFECTED: "$AFFECTED" },
    run: [
      "# A PR checks out its merge into main, so HEAD~1 is main and the diff is the PR's own.",
      'if [ -n "$AFFECTED" ]; then',
      `  pnpm exec turbo run build --filter='...[HEAD~1]' --filter='@stackra/cli...' ${EXCLUDE}`,
      "else",
      `  pnpm exec turbo run build ${EXCLUDE}`,
      "fi",
    ].join("\n"),
  },
  {
    id: "service-gen",
    job: "gate",
    ci: "Service gen (stackra gen)",
    line: 163,
    run: "pnpm exec turbo run gen --filter='./services/*'",
  },
  {
    id: "manifests-match-gen",
    job: "gate",
    ci: "Committed manifests match gen",
    line: 168,
    run: [
      "if ! git diff --quiet -- '*stackra.manifest.json' '*src/node/entities.gen.ts'; then",
      "  git diff --stat -- '*stackra.manifest.json' '*src/node/entities.gen.ts'",
      '  echo "::error title=Stale manifests::run pnpm gen and commit the stackra.manifest.json and entities.gen.ts files above"',
      "  exit 1",
      "fi",
    ].join("\n"),
  },
  {
    id: "migration-lint",
    job: "gate",
    ci: "Migration lint (Squawk)",
    line: 182,
    // squawk 2.71.0 is baked into the store image (TOOLS), so `mise exec` is not needed.
    ciReplace: [["mise exec github:sbdchd/squawk@2.71.0 -- squawk", "squawk"]],
    run: [
      "mapfile -t files < <(find . -path ./node_modules -prune -o -path '*/.stackra/migrations/*.up.sql' -print | sort)",
      'if [ "${#files[@]}" -eq 0 ]; then',
      '  echo "::notice title=Squawk::no compiled migrations (.stackra/migrations) in this checkout; nothing linted"',
      "  exit 0",
      "fi",
      "transactional=()",
      "online=()",
      'for file in "${files[@]}"; do',
      `  if head -n 1 "$file" | grep -qx -- '-- stackra:transactional=false'; then online+=("$file"); else transactional+=("$file"); fi`,
      "done",
      "lint() {",
      `  squawk ${SQUAWK_FLAGS} "$@"`,
      "}",
      'if [ "${#transactional[@]}" -gt 0 ]; then lint --assume-in-transaction "${transactional[@]}"; fi',
      'if [ "${#online[@]}" -gt 0 ]; then lint "${online[@]}"; fi',
    ].join("\n"),
  },
  {
    id: "validate",
    job: "gate",
    ci: "Validate repository",
    line: 204,
    env: { SPEC_GATE_REQUIRE_READY: "$READY", STACKRA_BRANCH: "$FACT_BRANCH" },
    run: "pnpm validate",
  },
  {
    id: "env-names",
    job: "gate",
    ci: "Environment names (runway env check)",
    line: 212,
    run: "pnpm exec turbo run build --filter=@stackra/runway --output-logs=errors-only\npnpm runway env check",
  },
  { id: "boundaries", job: "gate", ci: "Check boundaries", line: 217, run: "pnpm boundaries" },
  {
    // Shared: one knip process at the root, whose plugins execute every workspace's config modules (C1).
    shared: true,
    id: "knip",
    job: "gate",
    ci: "Check unused code",
    line: 222,
    run: [
      "pnpm exec turbo run build --filter=@stackra/vitest-config --output-logs=errors-only",
      `pnpm exec turbo run gen ${EXCLUDE} --output-logs=errors-only`,
      "pnpm knip",
    ].join("\n"),
  },
  { id: "secrets-scan", job: "gate", ci: "Secrets scan", line: 228, run: "pnpm secrets:scan" },
  {
    // Not in ci.yml (it leaves tests to the box): the tests STA-2761's verify ran, for the gate's members.
    id: "test",
    run: `pnpm exec turbo run test ${EXCLUDE} --continue=dependencies-successful`,
  },
]);

/**
 * `stackra/verify-mobile`: ci.yml's `mobile` job after its install (which the install container runs in full, with
 * the licensed builds the daemon made). Never required; its result never touches `stackra/verify`.
 */
export const MOBILE_STEPS = Object.freeze([
  // The mobile install's licences, before the mobile apps' code runs; a red here is a lane finding (runbook).
  { id: "licence-policy", run: licenceRun("mobile") },
  {
    id: "mobile-apps",
    job: "mobile",
    ci: "Lint, typecheck and build the mobile apps",
    line: 350,
    run: "pnpm exec turbo run lint typecheck build --filter=@figentra/mobile --filter=@figentra/playground --continue=dependencies-successful",
  },
]);

/**
 * Reads the PR facts file (written by the daemon from GitHub's answer, never from the PR tree) and prints its seven
 * values NUL-separated, so the shell never parses a value. No single quote: it sits in a single-quoted argument.
 */
const FACTS_READER =
  'const f = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")); ' +
  'const v = [f.event, f.title, f.branch, (f.labels ?? []).join(","), f.base, f.head, f.draft === true ? "true" : "false"]; ' +
  'process.stdout.write(v.map((x) => String(x ?? "").replaceAll(String.fromCharCode(0), "") + String.fromCharCode(0)).join(""));';

const stepFunction = (id) => `step_${id.replaceAll("-", "_")}`;

/**
 * The bash script that runs `steps` in `workDir`. Every step runs, failed or not, in a subshell with GitHub's
 * `bash -eo pipefail`, between `== step: <id>` and `== result: <id> pass|FAIL|skip`, so the output names every
 * failing step; any failure exits 1. With `facts`, the PR facts come from `<inDir>/facts.json` first.
 */
export function stepScript(steps, { inDir = IN_DIR, workDir = "/work", facts = true } = {}) {
  for (const step of steps)
    if (!/^[a-z][a-z0-9-]*$/.test(step.id)) throw new Error(`not a step id: ${step.id}`);
  const lines = [
    "#!/usr/bin/env bash",
    "# Generated by tools/scripts/stackra-verify.mjs (STA-2761) from main's ci.yml; never edited by hand.",
    "set -o pipefail",
    `GATE_IN=${inDir}`,
    `cd ${workDir} || exit 1`,
  ];
  if (facts)
    lines.push(
      "facts=()",
      `while IFS= read -r -d '' value; do facts+=("$value"); done < <(node -e '${FACTS_READER}' "$GATE_IN/facts.json")`,
      'if [ "${#facts[@]}" -ne 7 ]; then echo "stackra-verify: the PR facts file is unreadable"; exit 1; fi',
      "FACT_EVENT=${facts[0]}; FACT_TITLE=${facts[1]}; FACT_BRANCH=${facts[2]}; FACT_LABELS=${facts[3]}",
      "FACT_BASE=${facts[4]}; FACT_HEAD=${facts[5]}; FACT_DRAFT=${facts[6]}",
      // ci.yml: `--affected` on a pull request; SPEC_GATE_REQUIRE_READY on a pull request that is not a draft.
      'AFFECTED=; if [ "$FACT_EVENT" = pull_request ]; then AFFECTED=1; fi',
      'READY=; if [ "$FACT_EVENT" = pull_request ] && [ "$FACT_DRAFT" != true ]; then READY=1; fi',
    );
  lines.push(
    "failed=()",
    // A shared step (one process over every member) runs with main's copy of each config module it could execute:
    // the daemon lists the tested tree's loader files that are not main's (shared-definitions) and packs main's copy
    // of those main has (shared-main.tar); they are set aside, main's laid in, and the PR's put back after (C1).
    "shared_dir=${TMPDIR:-/tmp}/stackra-shared",
    "swap_out() {",
    '  rm -rf "$shared_dir" && mkdir -p "$shared_dir/pr" || return 1',
    '  [ -s "$GATE_IN/shared-definitions" ] || return 0',
    "  local p",
    "  while IFS= read -r -d '' p; do",
    '    case "$p" in /*|..|../*|*/..|*/../*) echo "stackra-verify: a shared-step path is not relative: $p"; return 1 ;; esac',
    '    if [ -e "$p" ] || [ -L "$p" ]; then',
    '      mkdir -p "$shared_dir/pr/$(dirname -- "$p")" && mv -- "$p" "$shared_dir/pr/$p" || return 1',
    "    fi",
    '  done < "$GATE_IN/shared-definitions"',
    '  if [ -s "$GATE_IN/shared-main.tar" ]; then tar -xf "$GATE_IN/shared-main.tar" || return 1; fi',
    "}",
    "swap_back() {",
    '  [ -s "$GATE_IN/shared-definitions" ] || return 0',
    "  local p",
    "  while IFS= read -r -d '' p; do",
    '    rm -f -- "$p"',
    '    if [ -e "$shared_dir/pr/$p" ] || [ -L "$shared_dir/pr/$p" ]; then',
    '      mkdir -p "$(dirname -- "$p")" && mv -- "$shared_dir/pr/$p" "$p"',
    "    fi",
    '  done < "$GATE_IN/shared-definitions"',
    '  rm -rf "$shared_dir"',
    "}",
    "run_step() {",
    "  local id=$1 when=$2 fn=$3 shared=$4",
    '  echo "== step: $id"',
    '  if [ -n "$when" ] && [ "${FACT_EVENT:-}" != "$when" ]; then',
    '    echo "skipped: ci.yml runs this step on $when only"',
    '    echo "== result: $id skip"',
    "    return 0",
    "  fi",
    "  local rc=0",
    '  if [ -n "$shared" ] && ! swap_out; then',
    '    echo "stackra-verify: could not lay in main\x27s config modules for this shared step"',
    "    rc=1",
    "  else",
    '    ( set -eo pipefail; "$fn" ) 2>&1',
    "    rc=$?",
    "  fi",
    '  if [ -n "$shared" ] && ! swap_back; then echo "stackra-verify: could not put the PR\x27s config modules back"; rc=1; fi',
    '  if [ "$rc" -eq 0 ]; then echo "== result: $id pass"; else echo "== result: $id FAIL"; failed+=("$id"); fi',
    "}",
  );
  for (const step of steps) {
    lines.push(`${stepFunction(step.id)}() {`);
    for (const [name, value] of Object.entries(step.env ?? {})) {
      if (!/^[A-Z_][A-Z0-9_]*$/.test(name) || /["`\\]/.test(value))
        throw new Error(`not a step env: ${name}`);
      lines.push(`  export ${name}="${value}"`);
    }
    lines.push(...step.run.split("\n").map((line) => `  ${line}`), "}");
  }
  for (const step of steps)
    lines.push(
      `run_step ${step.id} "${step.when ?? ""}" ${stepFunction(step.id)}${step.shared ? " shared" : ""}`,
    );
  lines.push(
    'if [ "${#failed[@]}" -gt 0 ]; then echo "== failed: ${failed[*]}"; exit 1; fi',
    'echo "== passed: every step"',
    "",
  );
  return lines.join("\n");
}

export const gateScript = (options) => stepScript(GATE_STEPS, options);
export const mobileScript = (options) => stepScript(MOBILE_STEPS, { ...options, facts: false });

/**
 * Before the gate: the tested tree is unpacked again over /work and committed as a merge onto main, like GitHub's
 * merge ref: first parent main (`refs/stackra/base`), second the PR head (`refs/stackra/head`, absent for main
 * itself), both with their history from the daemon's read-only bundle. So `HEAD~1` is main for `--affected`,
 * commitlint reads the PR's commits, and gitleaks scans main's and the PR's history.
 */
export const gatePrepare = (inDir = IN_DIR, workDir = "/work") =>
  [
    "set -e",
    `tar -xf ${inDir}/src.tar -C ${workDir}`,
    `cd ${workDir}`,
    "rm -rf .git",
    "git init -q",
    `git fetch -q --no-tags ${inDir}/history.bundle '+refs/stackra/*:refs/stackra/*'`,
    "git add -A",
    "tree=$(git write-tree)",
    "parents='-p refs/stackra/base'",
    'if git rev-parse -q --verify refs/stackra/head >/dev/null; then parents="$parents -p refs/stackra/head"; fi',
    // $parents is split on purpose: it holds one or two `-p <ref>` pairs this script wrote.
    'commit=$(git -c user.name=stackra-verify -c user.email=verify@stackra.invalid commit-tree "$tree" $parents -m tested)',
    'git update-ref HEAD "$commit"',
    "git reset -q",
  ].join("; ");

/**
 * Whether an SPDX licence expression is allowed: every licence an AND joins, and at least one an OR offers, is on
 * `allowed` (a Set). `X WITH Y` must be listed whole. Anything that does not parse (MIT/X11, an empty field) is not.
 * Self-contained: the licence check file the gate runs is this function's own source.
 */
export function spdxAllowed(expression, allowed) {
  const tokens = String(expression ?? "").match(/\(|\)|[^\s()]+/g) ?? [];
  let i = 0;
  const keyword = (word) => (tokens[i] ?? "").toUpperCase() === word;
  const atom = () => {
    const token = tokens[i++];
    if (token === "(") {
      const value = anyOf();
      if (tokens[i++] !== ")") throw new Error("unbalanced");
      return value;
    }
    if (token === undefined || token === ")" || /^(?:AND|OR|WITH)$/i.test(token))
      throw new Error("malformed");
    if (keyword("WITH")) {
      const exception = tokens[i + 1];
      i += 2;
      if (!exception) throw new Error("malformed");
      return allowed.has(`${token} WITH ${exception}`);
    }
    return allowed.has(token);
  };
  const allOf = () => {
    let value = atom();
    while (keyword("AND")) {
      i++;
      const next = atom();
      value = value && next;
    }
    return value;
  };
  const anyOf = () => {
    let value = allOf();
    while (keyword("OR")) {
      i++;
      const next = allOf();
      value = value || next;
    }
    return value;
  };
  try {
    const value = anyOf();
    return tokens.length > 0 && i === tokens.length && value;
  } catch {
    return false;
  }
}

/**
 * The packages of a `pnpm licenses list --json` listing (`{ licence: [{ name, versions, license }] }`) whose licence
 * the policy does not allow, and the policy's own faults, as sorted lines. The policy (tools/policy/licences.json):
 * `allow` holds SPDX ids; `deny` names licence families (GPL, LGPL, AGPL, SSPL, BUSL, Elastic, CC NC/ND, Unknown) as
 * case-insensitive regular expressions over one SPDX id, and a denied id is taken out of `allow` even when listed
 * there, so it passes only as one OR alternative beside an allowed licence, or through a named exception. Each
 * exception has exactly `name`, `licence` (the exact string the listing shows), `reason`, `scope` (dev-only, runtime,
 * tool or mobile; exceptionScopeViolations and lockfileScopeViolations hold dev-only, tool and mobile to theirs) and,
 * when it is pinned, `versions`: it holds for that package under that string, and only while every version installed
 * is pinned. A malformed exception is a violation and holds for nothing. A policy without `allow` or `deny`, or an
 * empty or unreadable listing, is itself a violation: nothing passes vacuously. Self-contained: the licence check file
 * is this function's own source.
 */
export function licenceViolations(listing, policy) {
  if (!Array.isArray(policy?.allow) || policy.allow.length === 0)
    return ["the licence policy has no `allow` list"];
  if (!Array.isArray(policy.deny) || policy.deny.length === 0)
    return ["the licence policy has no `deny` list"];
  let denyPatterns;
  try {
    denyPatterns = policy.deny.map((pattern) => {
      if (typeof pattern !== "string" || pattern === "")
        throw new Error(`${JSON.stringify(pattern)} is not a pattern`);
      return new RegExp(pattern, "i");
    });
  } catch (error) {
    return [`the licence policy's \`deny\` list does not parse: ${error.message}`];
  }
  const denied = (id) => denyPatterns.some((pattern) => pattern.test(id));
  const allowed = new Set(policy.allow.filter((id) => !denied(id)));
  const out = [];
  if (policy.exceptions !== undefined && !Array.isArray(policy.exceptions))
    out.push("the licence policy's `exceptions` is not a list");
  const scopes = ["dev-only", "runtime", "tool", "mobile"];
  const fields = new Set(["name", "licence", "reason", "scope", "versions"]);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const text = (value) => typeof value === "string" && value.trim() !== "";
  const exceptions = [];
  for (const [index, exception] of (Array.isArray(policy.exceptions)
    ? policy.exceptions
    : []
  ).entries()) {
    const problems = [];
    if (!exception || typeof exception !== "object" || Array.isArray(exception))
      problems.push("is not an object");
    else {
      for (const key of Object.keys(exception))
        if (!fields.has(key)) problems.push(`has an unknown field \`${key}\``);
      for (const key of ["name", "licence", "reason"])
        if (!text(exception[key])) problems.push(`has no \`${key}\``);
      if (!scopes.includes(exception.scope))
        problems.push(`has no \`scope\` of ${scopes.join(", ")}`);
      if (
        "versions" in exception &&
        !(
          Array.isArray(exception.versions) &&
          exception.versions.length > 0 &&
          exception.versions.every(text)
        )
      )
        problems.push("has a `versions` that is not a list of versions");
    }
    const label = `licence exception ${index + 1}${text(exception?.name) ? ` (${exception.name})` : ""}`;
    if (problems.length) out.push(`${label} ${problems.join("; ")}`);
    else exceptions.push(exception);
  }
  const entries = Object.entries(listing && typeof listing === "object" ? listing : {});
  if (!entries.some(([, packages]) => Array.isArray(packages) && packages.length))
    return [...out, "the licence listing names no package"].toSorted();
  for (const [licence, packages] of entries)
    for (const pkg of Array.isArray(packages) ? packages : []) {
      const id = pkg.license ?? licence;
      const versions = Array.isArray(pkg.versions) ? pkg.versions : [];
      if (spdxAllowed(id, allowed)) continue;
      const excepted = exceptions.some(
        (e) =>
          e.name === pkg.name &&
          e.licence === id &&
          (e.versions === undefined ||
            (versions.length > 0 && versions.every((v) => e.versions.includes(v)))),
      );
      if (!excepted) out.push(`${pkg.name}@${versions.join(",")}: ${id}`);
    }
  return out.toSorted();
}

/**
 * What the licence check reads from a pnpm-workspace.yaml: the `packages` globs, the default `catalog` and the named
 * `catalogs` (as `catalogs.default` and `catalogs.<name>`, each `{ dependency: spec }`), the `overrides`, and
 * `problems`. A line reader for the block style pnpm writes. In the sections it reads, any YAML construct it does not
 * understand is a problem, never a value it skips: a flow collection, an anchor, an alias, a tag, a block scalar, a
 * complex or merge key, a second document (review of #1043, MEDIUM 3). Comments are fine. Self-contained: the licence
 * check file is this function's own source.
 */
export function workspaceManifest(yamlText) {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const map = () => Object.create(null);
  const result = { packages: [], catalogs: map(), overrides: map(), problems: [] };
  result.catalogs.default = map();
  const read = new Set(["packages", "catalog", "catalogs", "overrides"]);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const quoted = (raw) => /^(?:"(?:[^"\\]|\\.)*"|'(?:[^']|'')*')$/.test(raw);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  // YAML's double-quoted escapes (\\x61 is "a"); an escape YAML does not have is an error, never a guess.
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const unescape = (body) => {
    const named = {
      0: "\0",
      a: "\x07",
      b: "\b",
      t: "\t",
      "\t": "\t",
      n: "\n",
      v: "\v",
      f: "\f",
      r: "\r",
    };
    Object.assign(named, {
      e: "\x1b",
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      N: "\x85",
      _: "\xa0",
    });
    Object.assign(named, { L: "\u2028", P: "\u2029" });
    return body.replaceAll(/\\(x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|U[\dA-Fa-f]{8}|[^])/g, (_, e) => {
      if (e.length > 1) return String.fromCodePoint(Number.parseInt(e.slice(1), 16));
      if (Object.hasOwn(named, e)) return named[e];
      throw new Error(`a double-quoted scalar with the escape \\${e}`);
    });
  };
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const scalar = (raw) => {
    const value = raw.trim();
    const m = /^"((?:[^"\\]|\\.)*)"$|^'((?:[^']|'')*)'$/.exec(value);
    if (!m) return value;
    return m[1] === undefined ? m[2].replaceAll("''", "'") : unescape(m[1]);
  };
  // A plain scalar may not start with a YAML indicator; a quoted one is taken as written.
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const special = (raw) => raw !== "" && !quoted(raw) && /^[&*!|>?%@`{[\]},#]|^<<$/.test(raw);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const uncomment = (line) => {
    let quote = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
    }
    return line;
  };
  // Linear: a quoted key, or the text before the first `: ` (or a final `:`).
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const pair = (body) => {
    const q = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*')\s*:(?:\s+(.*))?$/.exec(body);
    if (q) return [q[1], q[2] ?? ""];
    const colon = body.search(/:(?:\s|$)/);
    if (colon < 1) return null;
    return [body.slice(0, colon).trimEnd(), body.slice(colon + 1).trim()];
  };
  let section = null;
  let catalog = null;
  let catalogIndent = null;
  let line = 0;
  const problem = (text) => result.problems.push(`pnpm-workspace.yaml line ${line}: ${text}`);
  for (const raw of String(yamlText ?? "").split(/\r?\n/)) {
    // A line the reader cannot decode (a bad escape) is a problem, never a skipped line.
    try {
      line++;
      const text = uncomment(raw).trimEnd();
      if (text.trim() === "") continue;
      if (/^(?:---|\.\.\.)(?:\s|$)/.test(text)) {
        problem("a second YAML document");
        section = null;
        continue;
      }
      const indent = text.length - text.trimStart().length;
      const body = text.trimStart();
      const watched = read.has(section);
      if (/^ *\t/.test(text) && (watched || indent === 0)) problem("a tab in the indentation");
      const item = /^-(?:\s+(.*))?$/.exec(body);
      if (item) {
        if (section !== "packages") {
          if (watched) problem(`a list item in \`${section}\``);
          continue;
        }
        const value = (item[1] ?? "").trim();
        if (value === "" || special(value))
          problem(`a \`packages\` entry the reader cannot read: ${body}`);
        else result.packages.push(scalar(value));
        continue;
      }
      const entry = pair(body);
      if (indent === 0) {
        catalog = null;
        catalogIndent = null;
        if (!entry) {
          section = null;
          continue;
        }
        section = scalar(entry[0]);
        if (read.has(section) && entry[1] !== "")
          problem(`\`${section}\` is not a block mapping (${entry[1]})`);
        continue;
      }
      if (!watched) continue;
      if (!entry) {
        problem(`a line the reader cannot read: ${body}`);
        continue;
      }
      const [rawKey, rawValue] = entry;
      if (special(rawKey) || special(rawValue)) {
        problem(`a YAML construct the reader does not follow: ${body}`);
        continue;
      }
      const key = scalar(rawKey);
      const value = scalar(rawValue);
      if (section === "packages") problem(`a mapping in \`packages\`: ${body}`);
      else if (section === "catalog" || section === "overrides") {
        if (value === "") problem(`a nested mapping in \`${section}\`: ${body}`);
        else (section === "catalog" ? result.catalogs.default : result.overrides)[key] = value;
      } else if (catalogIndent === null || indent <= catalogIndent) {
        catalogIndent = indent;
        catalog = value === "" ? key : null;
        if (catalog === null) problem(`a catalog that is not a block mapping: ${body}`);
        else result.catalogs[catalog] ??= map();
      } else if (catalog !== null) {
        if (value === "") problem(`a nested mapping in catalog \`${catalog}\`: ${body}`);
        else result.catalogs[catalog][key] = value;
      }
    } catch (error) {
      problem(error.message);
    }
  }
  return result;
}

/**
 * The manifests of `dirs` under `root`, each `{ dir, manifest }`, or `{ dir, unreadable }` when its package.json does
 * not parse. Self-contained: the licence check file is this function's own source (it needs `readFileSync`).
 */
export function readMembers(root, dirs) {
  return [...dirs].toSorted().map((dir) => {
    try {
      return { dir, manifest: JSON.parse(readFileSync(`${root}/${dir}/package.json`, "utf8")) };
    } catch (error) {
      return { dir, unreadable: error.message };
    }
  });
}

/**
 * The workspace's members under `root` by its globs: the root itself (`.`) and every directory a `packages` glob
 * matches that holds a package.json (a `!` glob takes directories out; node_modules never counts), as readMembers
 * reads them. The licence check takes its members from pnpm-lock.yaml's importers and fails when these differ
 * (memberSetProblems). Self-contained: the licence check file is this function's own source (it needs `globSync`).
 */
export function workspaceMembers(root, patterns) {
  const globs = Array.isArray(patterns) ? patterns.filter((p) => typeof p === "string") : [];
  const excluded = new Set(
    globs
      .filter((p) => p.startsWith("!"))
      .flatMap((p) => globSync(p.slice(1).replace(/\/+$/, ""), { cwd: root })),
  );
  const dirs = new Set(["."]);
  for (const pattern of globs.filter((p) => !p.startsWith("!")))
    for (const file of globSync(`${pattern.replace(/\/+$/, "")}/package.json`, { cwd: root })) {
      const dir = file.slice(0, -"/package.json".length);
      if (!dir.split("/").includes("node_modules") && !excluded.has(dir)) dirs.add(dir);
    }
  return readMembers(root, dirs);
}

/**
 * Where the workspace's globs and pnpm-lock.yaml's importers disagree, as sorted lines: a member the lockfile does not
 * list, or an importer no glob matches. The members the check walks are the lockfile's, so either is a violation.
 * Self-contained: the licence check file is this function's own source.
 */
export function memberSetProblems(globDirs, importerDirs) {
  const globbed = new Set(globDirs);
  const imported = new Set(importerDirs);
  return [
    ...[...globbed]
      .filter((dir) => !imported.has(dir))
      .map((dir) => `${dir} is a workspace member pnpm-lock.yaml does not list`),
    ...[...imported]
      .filter((dir) => !globbed.has(dir))
      .map((dir) => `pnpm-lock.yaml lists ${dir}, which no pnpm-workspace.yaml glob matches`),
  ].toSorted();
}

/**
 * Where the policy's scoped exceptions may sit in each member's own package.json, as sorted lines (the closure checks
 * hold the installed tree to the same rules): a `dev-only` or `tool` package is never in a publishable member's (no
 * `"private": true`) `dependencies`, `optionalDependencies` or non-optional `peerDependencies` (devDependencies and
 * peers marked optional in `peerDependenciesMeta` are fine); a `mobile` package is a dependency of any kind of
 * `mobileMembers` only (each `{ dir, name }`, both must match), and no override aliases it. A dependency counts under
 * its real name: the alias pnpm-lock.yaml resolved it to in the member's importer (`graph`, lockfileGraph's answer),
 * else an `npm:<name>@…` spec, directly or through the `catalog:` entry it names. `workspace` is workspaceManifest's
 * answer, whose problems are violations too. No `packages`, no member or an unreadable manifest is itself a violation.
 * Self-contained: the licence check file is this function's own source.
 */
export function exceptionScopeViolations(members, workspace, policy, mobileMembers, graph = null) {
  const exceptions = Array.isArray(policy?.exceptions)
    ? policy.exceptions.filter((e) => e && typeof e === "object" && typeof e.name === "string")
    : [];
  const unshipped = new Map(
    exceptions
      .filter((e) => e.scope === "dev-only" || e.scope === "tool")
      .map((e) => [e.name, e.scope]),
  );
  const mobile = new Set(exceptions.filter((e) => e.scope === "mobile").map((e) => e.name));
  const out = [...(workspace?.problems ?? [])];
  if (!Array.isArray(workspace?.packages) || workspace.packages.length === 0)
    out.push("pnpm-workspace.yaml names no `packages`");
  if (!Array.isArray(members) || members.length === 0)
    return [...out, "the workspace has no member"].toSorted();
  const catalogs = workspace?.catalogs ?? {};
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const aliasOf = (spec) =>
    /^npm:((?:@[^/\s]+\/)?[^@\s]+)(?:@.*)?$/.exec(typeof spec === "string" ? spec : "")?.[1];
  const realName = (dir, kind, key, spec) => {
    const importer = graph?.importers?.[dir];
    const locked =
      importer?.[kind]?.[key] ??
      importer?.dependencies?.[key] ??
      importer?.optionalDependencies?.[key] ??
      importer?.devDependencies?.[key];
    const lockedAlias = /^((?:@[^/@(]+\/)?[^@(:/][^@(:]*)@/.exec(
      typeof locked === "string" ? locked : "",
    )?.[1];
    if (lockedAlias) return lockedAlias;
    const fromCatalog = /^catalog:(.*)$/.exec(typeof spec === "string" ? spec : "");
    const resolved = fromCatalog ? catalogs[fromCatalog[1].trim() || "default"]?.[key] : spec;
    return aliasOf(resolved) ?? key;
  };
  const mobileDirs = mobileMembers.map((m) => m.dir).join(" and ");
  const isMobile = (member) =>
    mobileMembers.some((m) => m.dir === member.dir && m.name === member.manifest.name);
  for (const member of members) {
    if (!member?.manifest || typeof member.manifest !== "object") {
      out.push(`${member?.dir}/package.json is unreadable: ${member?.unreadable ?? "no manifest"}`);
      continue;
    }
    const manifest = member.manifest;
    const where = `${member.dir} (${manifest.name ?? "unnamed"})`;
    const publishable = manifest.private !== true;
    for (const kind of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
      "devDependencies",
    ]) {
      const deps = manifest[kind];
      if (!deps || typeof deps !== "object") continue;
      for (const [key, spec] of Object.entries(deps)) {
        const name = realName(member.dir, kind, key, spec);
        if (mobile.has(name) && !isMobile(member))
          out.push(`${where}: ${name} (scope mobile) is in ${kind}; only ${mobileDirs} may use it`);
        const optionalPeer =
          kind === "peerDependencies" && manifest.peerDependenciesMeta?.[key]?.optional === true;
        if (unshipped.has(name) && publishable && kind !== "devDependencies" && !optionalPeer)
          out.push(
            `${where}: ${name} (scope ${unshipped.get(name)}) is in ${kind === "peerDependencies" ? "non-optional peerDependencies" : kind} of a publishable package; only devDependencies or an optional peer`,
          );
      }
    }
  }
  const rootManifest = members.find((m) => m?.dir === ".")?.manifest;
  for (const [source, overrides] of [
    ["pnpm-workspace.yaml overrides", workspace?.overrides],
    ["package.json pnpm.overrides", rootManifest?.pnpm?.overrides],
    ["package.json resolutions", rootManifest?.resolutions],
  ])
    for (const [key, spec] of Object.entries(
      overrides && typeof overrides === "object" ? overrides : {},
    ))
      if (mobile.has(aliasOf(spec)))
        out.push(
          `${source}: ${key} is aliased to ${aliasOf(spec)} (scope mobile); only ${mobileDirs} may use it`,
        );
  return out.toSorted();
}

/**
 * What the licence check reads from pnpm-lock.yaml (lockfile v9, every `---` document merged: pnpm 12 writes its own
 * package-manager document first): each importer's `dependencies`, `devDependencies` and `optionalDependencies`
 * (`{ name: version }`, the version as the lockfile writes it: `1.2.3(peer@1.0.0)`, `alias@1.2.3(…)` or `link:../x`);
 * each snapshot's `dependencies` and `optionalDependencies` together (`snapshots[key]`, resolved peers included);
 * each package's optional peers (`optionalPeers["name@1.2.3"]`, a Set); and `problems`. A reader for the block layout
 * pnpm writes, which fails closed (review of #1043, MEDIUM A): inside `importers`, `packages` and `snapshots`, a line
 * it does not consume is a problem, never a skipped edge: a comment, a flow value other than `{}` (a package's own
 * fields, such as `resolution: {…}` or `os: [linux]`, excepted), a YAML indicator (`& * ! | > ? %`), an indent off
 * the two-space steps, a line under a scalar, or a key the layout does not have where the reader looks.
 * Self-contained: the licence check file is this function's own source.
 */
export function lockfileGraph(lockText) {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const map = () => Object.create(null);
  const graph = { importers: map(), snapshots: map(), optionalPeers: map(), problems: [] };
  const sections = new Set(["dependencies", "devDependencies", "optionalDependencies"]);
  const depKeys = new Set([
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
    "peerDependenciesMeta",
  ]);
  const snapshotKeys = new Set([
    "dependencies",
    "optionalDependencies",
    "transitivePeerDependencies",
    "optional",
    "patched",
    "id",
  ]);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const quoted = (raw) => /^(?:'(?:[^']|'')*'|"(?:[^"\\]|\\.)*")$/.test(raw);
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  // YAML's double-quoted escapes (\\x61 is "a"); an escape YAML does not have is an error, never a guess.
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const unescape = (body) => {
    const named = {
      0: "\0",
      a: "\x07",
      b: "\b",
      t: "\t",
      "\t": "\t",
      n: "\n",
      v: "\v",
      f: "\f",
      r: "\r",
    };
    Object.assign(named, {
      e: "\x1b",
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      N: "\x85",
      _: "\xa0",
    });
    Object.assign(named, { L: "\u2028", P: "\u2029" });
    return body.replaceAll(/\\(x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|U[\dA-Fa-f]{8}|[^])/g, (_, e) => {
      if (e.length > 1) return String.fromCodePoint(Number.parseInt(e.slice(1), 16));
      if (Object.hasOwn(named, e)) return named[e];
      throw new Error(`a double-quoted scalar with the escape \\${e}`);
    });
  };
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const scalar = (raw) => {
    const value = raw.trim();
    const m = /^'((?:[^']|'')*)'$|^"((?:[^"\\]|\\.)*)"$/.exec(value);
    if (!m) return value;
    return m[1] === undefined ? unescape(m[2]) : m[1].replaceAll("''", "'");
  };
  // Linear: a quoted key, or the text before the first `: ` (or a final `:`).
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const pair = (body) => {
    const q = /^('(?:[^']|'')*'|"(?:[^"\\]|\\.)*")\s*:(?:\s+(.*))?$/.exec(body);
    if (q) return [q[1], q[2] ?? ""];
    const colon = body.search(/:(?:\s|$)/);
    if (colon < 1) return null;
    return [body.slice(0, colon).trimEnd(), body.slice(colon + 1).trim()];
  };
  // A plain scalar that starts with an indicator, or carries a comment, is a construct the reader does not follow.
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const special = (raw) =>
    raw !== "" && !quoted(raw) && (/^[&*!|>?%@`\]},#]|^<<$/.test(raw) || /\s#/.test(raw));
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const flow = (raw) => /^[{[]/.test(raw);
  let top = null;
  let line = 0;
  // keys[d]: the key open at indent 2d (null when that line held a scalar, so nothing may sit under it).
  let keys = [];
  const problem = (text) => {
    if (graph.problems.length < 20) graph.problems.push(`pnpm-lock.yaml line ${line}: ${text}`);
  };
  for (const raw of String(lockText ?? "").split(/\r?\n/)) {
    // A line the reader cannot decode (a bad escape) is a problem, never a skipped line.
    try {
      line++;
      if (raw.trim() === "") continue;
      if (raw.trimEnd() === "---") {
        top = null;
        keys = [];
        continue;
      }
      const indent = raw.length - raw.trimStart().length;
      const body = raw.trim();
      if (indent === 0) {
        const entry = pair(body);
        top = entry ? scalar(entry[0]) : null;
        keys = [top];
        if (["importers", "packages", "snapshots"].includes(top) && entry[1] !== "")
          problem(`\`${top}\` is not a block mapping`);
        continue;
      }
      if (top !== "importers" && top !== "packages" && top !== "snapshots") continue;
      if (/^ *\t/.test(raw)) {
        problem("a tab in the indentation");
        continue;
      }
      if (body.startsWith("#")) {
        problem(`a comment: ${body}`);
        continue;
      }
      if (indent % 2 !== 0) {
        problem(`an indent of ${indent} spaces: ${body}`);
        continue;
      }
      const depth = indent / 2;
      if (keys.length < depth || keys[depth - 1] === null) {
        problem(`a line under a scalar or a missing key: ${body}`);
        continue;
      }
      keys = keys.slice(0, depth);
      const path = keys.slice(1);
      // A list item: only a snapshot's transitivePeerDependencies and a package's own list fields hold them.
      const item = /^-(?:\s+(.*))?$/.exec(body);
      if (item) {
        const value = (item[1] ?? "").trim();
        const allowed =
          (top === "snapshots" && depth === 3 && path[1] === "transitivePeerDependencies") ||
          (top === "packages" && depth === 3 && !depKeys.has(path[1]));
        if (!allowed || value === "" || special(value) || flow(value))
          problem(`a list item the reader does not follow: ${body}`);
        keys.push(null);
        continue;
      }
      const entry = pair(body);
      if (!entry) {
        problem(`a line the reader cannot read: ${body}`);
        keys.push(null);
        continue;
      }
      const [rawKey, rawValue] = entry;
      const key = scalar(rawKey);
      const value = scalar(rawValue);
      const packageField = top === "packages" && depth === 2 && !depKeys.has(key);
      if (special(rawKey) || flow(rawKey) || special(rawValue)) {
        problem(`a YAML construct the reader does not follow: ${body}`);
        keys.push(null);
        continue;
      }
      if (flow(rawValue) && rawValue !== "{}" && !packageField) {
        problem(`a flow value the reader does not follow: ${body}`);
        keys.push(null);
        continue;
      }
      keys.push(rawValue === "" ? key : null);
      const empty = rawValue === "" || rawValue === "{}";
      if (top === "importers") {
        if (depth === 1) {
          if (!empty) problem(`an importer that is not a mapping: ${body}`);
          else graph.importers[key] ??= map();
        } else if (sections.has(path[1])) {
          if (depth === 3 && rawValue !== "")
            problem(`a dependency that is not a mapping: ${body}`);
          else if (depth === 4) {
            if ((key !== "specifier" && key !== "version") || value === "")
              problem(`an importer dependency field the reader does not know: ${body}`);
            else if (key === "version")
              (graph.importers[path[0]][path[1]] ??= map())[path[2]] = value;
          } else if (depth > 4) problem(`a line too deep in an importer: ${body}`);
        } else if (depth === 2 && sections.has(key) && !empty)
          problem(`importer dependencies that are not a mapping: ${body}`);
        else if (depth > 5) problem(`a line too deep in an importer: ${body}`);
      } else if (top === "snapshots") {
        if (depth === 1) {
          if (!empty) problem(`a snapshot that is not a mapping: ${body}`);
          else graph.snapshots[key] ??= map();
        } else if (depth === 2) {
          if (!snapshotKeys.has(key)) problem(`a snapshot field the reader does not know: ${body}`);
          else if ((key === "dependencies" || key === "optionalDependencies") && !empty)
            problem(`snapshot dependencies that are not a mapping: ${body}`);
        } else if (
          depth === 3 &&
          (path[1] === "dependencies" || path[1] === "optionalDependencies")
        ) {
          if (value === "") problem(`a snapshot dependency without a version: ${body}`);
          else graph.snapshots[path[0]][key] = value;
        } else problem(`a snapshot line the reader does not follow: ${body}`);
      } else if (depth === 1) {
        if (!empty) problem(`a package that is not a mapping: ${body}`);
      } else if (depth === 2) {
        if (depKeys.has(key) && !empty) problem(`package ${key} that are not a mapping: ${body}`);
      } else if (path[1] === "peerDependenciesMeta") {
        if (depth === 3 && rawValue !== "") problem(`a peer meta that is not a mapping: ${body}`);
        else if (depth === 4) {
          if (key !== "optional" || (value !== "true" && value !== "false"))
            problem(`a peer meta field the reader does not know: ${body}`);
          else if (value === "true") (graph.optionalPeers[path[0]] ??= new Set()).add(path[2]);
        } else if (depth > 4) problem(`a peer meta line too deep: ${body}`);
      } else if (depKeys.has(path[1]) && (depth > 3 || value === ""))
        problem(`a package ${path[1]} line the reader does not follow: ${body}`);
    } catch (error) {
      problem(error.message);
    }
  }
  return graph;
}

/**
 * The scoped exceptions the lockfile's closures reach, from a lockfileGraph: `found`, a Map keyed `<dir>\t<package>`
 * of `{ where, name, scope, path }` (the path `member → … → package`, breadth first, so the shortest), and `problems`
 * (the reader's own, and lockfile entries the walk reached but could not find). A `dev-only` or `tool` package is
 * searched in each publishable member's (no `"private": true`) production closure, which follows its `dependencies`,
 * `optionalDependencies` and non-optional peers, through workspace links (`link:`) and every snapshot's dependencies,
 * but never devDependencies nor a peer the package marks optional; a `mobile` package in the full closure
 * (devDependencies included) of every member other than `mobileMembers`. Each package is visited once, so a cycle
 * ends. A lockfile without importers, a member it does not list, and a package or link the walk reaches without a
 * snapshot or importer entry (pnpm writes one for every package, `{}` included) are problems, never a shorter
 * closure. Self-contained: the licence check file is this function's own source.
 */
export function lockfileFindings(graph, members, policy, mobileMembers) {
  const exceptions = Array.isArray(policy?.exceptions)
    ? policy.exceptions.filter((e) => e && typeof e === "object" && typeof e.name === "string")
    : [];
  const unshipped = new Map(
    exceptions
      .filter((e) => e.scope === "dev-only" || e.scope === "tool")
      .map((e) => [e.name, e.scope]),
  );
  const mobile = new Map(
    exceptions.filter((e) => e.scope === "mobile").map((e) => [e.name, e.scope]),
  );
  const found = new Map();
  const problems = [...(graph?.problems ?? [])];
  const importers = graph?.importers ?? {};
  if (Object.keys(importers).length === 0)
    return { found, problems: [...problems, "pnpm-lock.yaml lists no importers"] };
  const manifests = new Map(
    (Array.isArray(members) ? members : [])
      .filter((m) => m?.manifest)
      .map((m) => [m.dir, m.manifest]),
  );
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const nameOf = (key) => key.slice(0, key.indexOf("@", 1));
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const show = (node) => (node.startsWith("importer:") ? node.slice(9) : node.replace(/\(.*$/, ""));
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- self-contained: the check file is this function's source
  const linked = (dir, relative) => {
    const parts = dir === "." ? [] : dir.split("/");
    for (const part of relative.split("/"))
      if (part === "..") parts.pop();
      else if (part && part !== ".") parts.push(part);
    return parts.length ? parts.join("/") : ".";
  };
  const node = (dir, name, version) => {
    if (typeof version !== "string" || version === "") return null;
    if (version.startsWith("link:")) return `importer:${linked(dir, version.slice(5))}`;
    // An alias resolves to another package: `uniwind: uniwind-pro@1.9.0(…)`.
    if (/^(?:@[^/@(]+\/)?[^@(:/][^@(:]*@/.test(version)) return version;
    return `${name}@${version}`;
  };
  // Null when the lockfile has no entry for `from`: the caller reports it instead of walking on.
  const edges = (from, full) => {
    if (!from.startsWith("importer:")) {
      if (!Object.hasOwn(graph.snapshots ?? {}, from)) return null;
      const optional = graph.optionalPeers?.[from.replace(/\(.*$/, "")];
      return Object.entries(graph.snapshots[from])
        .filter(([name]) => !optional?.has(name))
        .map(([name, version]) => node(".", name, version));
    }
    const dir = from.slice(9);
    if (!Object.hasOwn(importers, dir)) return null;
    const importer = importers[dir];
    const kinds = full
      ? ["dependencies", "optionalDependencies", "devDependencies"]
      : ["dependencies", "optionalDependencies"];
    const next = kinds.flatMap((kind) =>
      Object.entries(importer[kind] ?? {}).map(([name, version]) => node(dir, name, version)),
    );
    const manifest = manifests.get(dir);
    for (const peer of Object.keys(manifest?.peerDependencies ?? {}))
      if (manifest.peerDependenciesMeta?.[peer]?.optional !== true)
        next.push(
          node(
            dir,
            peer,
            importer.dependencies?.[peer] ??
              importer.optionalDependencies?.[peer] ??
              importer.devDependencies?.[peer],
          ),
        );
    return next;
  };
  const pathTo = (end, parent) => {
    const path = [];
    for (let at = end; at !== null; at = parent.get(at)) path.unshift(show(at));
    return path.join(" → ");
  };
  // Lockfile entries the walk reached but could not find (key: the node), each with the first path that reached it.
  const missing = new Map();
  // Breadth first from the member, so each package found is named with its shortest path.
  const reach = (dir, full, targets) => {
    const start = `importer:${dir}`;
    const parent = new Map([[start, null]]);
    const queue = [start];
    const hits = new Map();
    for (let i = 0; i < queue.length; i++) {
      const next = edges(queue[i], full && i === 0);
      if (next === null) {
        if (!missing.has(queue[i])) missing.set(queue[i], pathTo(queue[i], parent));
        continue;
      }
      for (const to of next) {
        if (to === null || parent.has(to)) continue;
        parent.set(to, queue[i]);
        queue.push(to);
        const name = to.startsWith("importer:") ? null : nameOf(to);
        if (name !== null && targets.has(name) && !hits.has(name)) hits.set(name, to);
      }
    }
    return [...hits].map(([name, end]) => [name, pathTo(end, parent)]);
  };
  for (const member of Array.isArray(members) ? members : []) {
    if (!member?.manifest) continue;
    const where = `${member.dir} (${member.manifest.name ?? "unnamed"})`;
    if (!Object.hasOwn(importers, member.dir)) {
      problems.push(`${where} is not in pnpm-lock.yaml`);
      continue;
    }
    if (member.manifest.private !== true && unshipped.size)
      for (const [name, path] of reach(member.dir, false, unshipped))
        found.set(`${member.dir}\t${name}`, { where, name, scope: unshipped.get(name), path });
    const isMobile = mobileMembers.some(
      (m) => m.dir === member.dir && m.name === member.manifest.name,
    );
    if (!isMobile && mobile.size)
      for (const [name, path] of reach(member.dir, true, mobile))
        found.set(`${member.dir}\t${name}`, { where, name, scope: "mobile", path });
  }
  for (const [at, path] of missing)
    problems.push(
      at.startsWith("importer:")
        ? `pnpm-lock.yaml has no importer for ${at.slice(9)} (reached via ${path})`
        : `pnpm-lock.yaml has no snapshot for ${at} (reached via ${path})`,
    );
  return { found, problems };
}

/**
 * The same search as lockfileFindings over pnpm's own view of the installed tree, the authoritative one (review of
 * #1043, MEDIUM A): `list` is `pnpm list --recursive --json --depth Infinity --offline` run in the workspace `root`
 * (absolute) after the gate's install. pnpm prints a repeated subtree once and marks later copies `deduped`, so a
 * deduped node is expanded from its first copy (by `path`), and a workspace link from that project's own entry. A
 * peer a package marks optional (`optionalPeers`, lockfileGraph's) is not followed. Returns `{ found, problems }`,
 * keyed and shaped as lockfileFindings'; a path names an alias as `key (package)`. Self-contained: the licence check
 * file is this function's own source.
 */
export function pnpmFindings(list, root, members, policy, mobileMembers, optionalPeers = {}) {
  const exceptions = Array.isArray(policy?.exceptions)
    ? policy.exceptions.filter((e) => e && typeof e === "object" && typeof e.name === "string")
    : [];
  const unshipped = new Map(
    exceptions
      .filter((e) => e.scope === "dev-only" || e.scope === "tool")
      .map((e) => [e.name, e.scope]),
  );
  const mobile = new Set(exceptions.filter((e) => e.scope === "mobile").map((e) => e.name));
  const found = new Map();
  const problems = [];
  if (!Array.isArray(list) || list.length === 0)
    return { found, problems: ["pnpm list names no project"] };
  const dirOf = (path) =>
    path === root ? "." : String(path).startsWith(`${root}/`) ? path.slice(root.length + 1) : null;
  const projects = new Map(list.map((p) => [p.path, p]));
  const full = new Map();
  // The first printed copy of each package, wherever pnpm printed it (a project's devDependencies included).
  const index = (node) => {
    for (const kind of ["dependencies", "optionalDependencies", "devDependencies"])
      for (const child of Object.values(node[kind] ?? {})) {
        if (!child || typeof child !== "object" || child.deduped || full.has(child.path)) continue;
        full.set(child.path, child);
        index(child);
      }
  };
  for (const project of list) index(project);
  const manifests = new Map(
    (Array.isArray(members) ? members : [])
      .filter((m) => m?.manifest)
      .map((m) => [m.dir, m.manifest]),
  );
  const projectEdges = (project, withDev) => {
    const kinds = withDev
      ? ["dependencies", "optionalDependencies", "devDependencies"]
      : ["dependencies", "optionalDependencies"];
    const next = kinds.flatMap((kind) => Object.entries(project[kind] ?? {}));
    const manifest = manifests.get(dirOf(project.path));
    for (const peer of Object.keys(manifest?.peerDependencies ?? {}))
      if (manifest.peerDependenciesMeta?.[peer]?.optional !== true) {
        const child =
          project.dependencies?.[peer] ??
          project.optionalDependencies?.[peer] ??
          project.devDependencies?.[peer];
        if (child) next.push([peer, child]);
      }
    return next;
  };
  const edges = (node) => {
    if (String(node.version ?? "").startsWith("link:")) {
      const project = projects.get(node.path);
      if (project) return projectEdges(project, false);
    }
    const whole = node.deduped ? full.get(node.path) : node;
    if (!whole) {
      problems.push(`pnpm list dedupes ${node.path} without printing its subtree`);
      return [];
    }
    const optional = optionalPeers[`${node.from}@${String(node.version).replace(/\(.*$/, "")}`];
    return Object.entries(whole.dependencies ?? {}).filter(([key]) => !optional?.has(key));
  };
  const show = (key, node) => {
    if (String(node.version ?? "").startsWith("link:")) return dirOf(node.path) ?? node.path;
    const name = node.from ?? key;
    return `${key === name ? name : `${key} (${name})`}@${node.version}`;
  };
  const reach = (project, withDev, targets) => {
    const start = dirOf(project.path);
    const parent = new Map([[project.path, null]]);
    const label = new Map([[project.path, start]]);
    const queue = [[project.path, project, true]];
    const hits = new Map();
    // The queue grows while it is read: breadth first.
    for (const [at, node, top] of queue) {
      for (const [key, child] of top ? projectEdges(node, withDev) : edges(node)) {
        if (!child || typeof child !== "object" || parent.has(child.path)) continue;
        parent.set(child.path, at);
        label.set(child.path, show(key, child));
        queue.push([child.path, child, false]);
        const name = child.from ?? key;
        if (targets.has(name) && !hits.has(name)) hits.set(name, child.path);
      }
    }
    return [...hits].map(([name, end]) => {
      const path = [];
      for (let at = end; at !== null; at = parent.get(at)) path.unshift(label.get(at));
      return [name, path.join(" → ")];
    });
  };
  // pnpm's projects and the lockfile's importer members must be the same set, either way (review nit).
  const listed = new Set(list.map((p) => dirOf(p.path)));
  for (const dir of manifests.keys())
    if (!listed.has(dir)) problems.push(`${dir} is a workspace member pnpm list does not name`);
  for (const project of list) {
    const dir = dirOf(project.path);
    const manifest = manifests.get(dir);
    if (dir === null || !manifest) {
      problems.push(`pnpm list names ${project.path}, which is not a workspace member`);
      continue;
    }
    const where = `${dir} (${manifest.name ?? "unnamed"})`;
    if (manifest.private !== true && unshipped.size)
      for (const [name, path] of reach(project, false, unshipped))
        found.set(`${dir}\t${name}`, { where, name, scope: unshipped.get(name), path });
    const isMobile = mobileMembers.some((m) => m.dir === dir && m.name === manifest.name);
    if (!isMobile && mobile.size)
      for (const [name, path] of reach(project, true, mobile))
        found.set(`${dir}\t${name}`, { where, name, scope: "mobile", path });
  }
  return { found, problems: [...new Set(problems)] };
}

/**
 * The closure verdict, as sorted lines: each problem of either side, each package both found (with the lockfile's
 * path), and each one only one side found, naming both answers so a human can tell a reader bug from a hostile
 * lockfile. `pnpm` is null when only the lockfile is read (the unit tests' shape). Self-contained: the licence check
 * file is this function's own source.
 */
export function closureViolations(reader, pnpm, mobileMembers) {
  const mobileDirs = mobileMembers.map((m) => m.dir).join(" and ");
  const line = ({ where, name, scope, path }) =>
    scope === "mobile"
      ? `${where}: ${name} (scope mobile) is installed: ${path}; only ${mobileDirs} may`
      : `${where}: ${name} (scope ${scope}) ships with a publishable package: ${path}`;
  const out = [...reader.problems, ...(pnpm?.problems ?? [])];
  for (const [key, hit] of reader.found) if (!pnpm || pnpm.found.has(key)) out.push(line(hit));
  if (pnpm)
    for (const key of new Set([...reader.found.keys(), ...pnpm.found.keys()])) {
      const a = pnpm.found.get(key);
      const b = reader.found.get(key);
      if (a && b) continue;
      const { where, name, scope } = a ?? b;
      out.push(
        `${where}: ${name} (scope ${scope}): pnpm finds ${a ? a.path : "nothing"}; the lockfile reader finds ${b ? b.path : "nothing"}`,
      );
    }
  return out.toSorted();
}

/**
 * The lockfile half alone, as sorted lines (closureViolations without pnpm's view): what the unit tests and a tree
 * without an install can check. Self-contained: the licence check file is this function's own source.
 */
export function lockfileScopeViolations(graph, members, policy, mobileMembers) {
  return closureViolations(
    lockfileFindings(graph, members, policy, mobileMembers),
    null,
    mobileMembers,
  );
}

/**
 * A mobile-scoped package the gate's install holds at all, as lines: the gate installs without `mobileMembers`, so
 * any `node_modules/.pnpm/<name>@…` directory (`entries`) means something else pulled it in; `pnpm` (pnpmFindings')
 * names the path when pnpm can. Self-contained: the licence check file is this function's own source.
 */
export function installedMobile(entries, policy, mobileMembers, pnpm = null) {
  const names = (Array.isArray(policy?.exceptions) ? policy.exceptions : [])
    .filter((e) => e?.scope === "mobile" && typeof e.name === "string")
    .map((e) => e.name);
  const mobileDirs = mobileMembers.map((m) => m.dir).join(" and ");
  const out = [];
  for (const name of names)
    for (const entry of entries.filter((e) => e.startsWith(`${name.replace("/", "+")}@`))) {
      const via = [...(pnpm?.found.values() ?? [])]
        .filter((hit) => hit.name === name)
        .map((hit) => hit.path);
      out.push(
        `node_modules/.pnpm/${entry}: ${name} (scope mobile) is in the gate's install, which leaves out ${mobileDirs}; ${via.length ? `pulled in by ${via.join("; ")}` : "no member's pnpm tree names it"}`,
      );
    }
  return out.toSorted();
}

/**
 * The licence check the gate and stackra/verify-mobile run, right after the install and before any PR code
 * (`node licence-check.mjs <policy> <listing> <workspace root> <pnpm list> gate|mobile`, licenceStep): this file's spdxAllowed,
 * licenceViolations, workspaceManifest, readMembers, workspaceMembers, memberSetProblems, exceptionScopeViolations,
 * lockfileGraph, lockfileFindings, pnpmFindings, closureViolations, lockfileScopeViolations and installedMobile, with
 * MOBILE_MEMBERS. The policy is main's (`/in/licences.json`). The members are pnpm-lock.yaml's importers, which must
 * match the workspace globs; the closures come from pnpm's view and the lockfile reader, which must agree. Anything it
 * cannot read fails the step.
 */
export const licenceCheckSource = () =>
  [
    "// Generated by tools/scripts/stackra-verify.mjs (STA-2761): the licence policy step of stackra/verify.",
    'import { globSync, readFileSync, readdirSync, realpathSync } from "node:fs";',
    `const MOBILE_MEMBERS = ${JSON.stringify(MOBILE_MEMBERS)};`,
    spdxAllowed.toString(),
    licenceViolations.toString(),
    workspaceManifest.toString(),
    readMembers.toString(),
    workspaceMembers.toString(),
    memberSetProblems.toString(),
    exceptionScopeViolations.toString(),
    lockfileGraph.toString(),
    lockfileFindings.toString(),
    pnpmFindings.toString(),
    closureViolations.toString(),
    lockfileScopeViolations.toString(),
    installedMobile.toString(),
    "const read = (path) => {",
    "  try {",
    '    return JSON.parse(readFileSync(path, "utf8"));',
    "  } catch (error) {",
    "    return { unreadable: `${path}: ${error.message}` };",
    "  }",
    "};",
    "const [policyPath, listingPath, root, pnpmListPath, install] = process.argv.slice(2);",
    "const policy = read(policyPath);",
    "const listing = read(listingPath);",
    "const pnpmList = pnpmListPath ? read(pnpmListPath) : null;",
    "const problems = [policy, listing, pnpmList ?? {}].filter((x) => x.unreadable).map((x) => x.unreadable);",
    'if (!root || !pnpmListPath || !["gate", "mobile"].includes(install))',
    '  problems.push("usage: licence-check <policy> <listing> <workspace root> <pnpm list --json> gate|mobile");',
    "let members = [];",
    "if (!problems.length) {",
    "  problems.push(...licenceViolations(listing, policy));",
    "  try {",
    '    const workspace = workspaceManifest(readFileSync(`${root}/pnpm-workspace.yaml`, "utf8"));',
    '    const graph = lockfileGraph(readFileSync(`${root}/pnpm-lock.yaml`, "utf8"));',
    "    const globbed = workspaceMembers(root, workspace.packages);",
    "    members = readMembers(root, Object.keys(graph.importers));",
    "    problems.push(...memberSetProblems(globbed.map((m) => m.dir), members.map((m) => m.dir)));",
    "    problems.push(...exceptionScopeViolations(members, workspace, policy, MOBILE_MEMBERS, graph));",
    "    const reader = lockfileFindings(graph, members, policy, MOBILE_MEMBERS);",
    "    const pnpm = pnpmFindings(pnpmList, realpathSync(root), members, policy, MOBILE_MEMBERS, graph.optionalPeers);",
    "    problems.push(...closureViolations(reader, pnpm, MOBILE_MEMBERS));",
    "    // The gate's install leaves the mobile members out, so it must not hold a mobile-scoped package at all.",
    '    if (install === "gate")',
    "      problems.push(...installedMobile(readdirSync(`${root}/node_modules/.pnpm`), policy, MOBILE_MEMBERS, pnpm));",
    "  } catch (error) {",
    "    problems.push(error.message);",
    "  }",
    "}",
    "if (problems.length) {",
    '  console.log(`licence policy ${policyPath} not met:\\n${problems.map((p) => `  - ${p}`).join("\\n")}`);',
    "  process.exit(1);",
    "}",
    "const count = Object.values(listing).reduce((n, list) => n + list.length, 0);",
    "console.log(",
    "  `${count} packages, every licence allowed by ${policyPath}; ${members.length} workspace members keep each exception in its scope`,",
    ");",
    "",
  ].join("\n");

/**
 * The steps of a run log, for display only (a PR's output can print anything, so nothing here decides a verdict):
 * each `== step: <id>` … `== result: <id> pass|FAIL|skip` section with its lines; a step that never printed its result
 * is `unfinished`.
 */
export function stepSections(log) {
  const sections = [];
  let current = null;
  for (const line of String(log).split("\n")) {
    const start = /^== step: ([a-z][a-z0-9-]*)$/.exec(line);
    const end = /^== result: ([a-z][a-z0-9-]*) (pass|FAIL|skip)$/.exec(line);
    if (start) {
      current = { id: start[1], result: "unfinished", lines: [] };
      sections.push(current);
    } else if (end && current?.id === end[1]) {
      current.result = end[2];
      current = null;
    } else if (current) current.lines.push(line);
  }
  return sections;
}

/**
 * What one run checks, each posted as its own check run on the head SHA by the same App with the same `external_id`
 * scheme: `gate` is `stackra/verify` (required; the Quality Gate without the two Uniwind Pro members), `mobile` is
 * `stackra/verify-mobile` (never required; those two members, on the licensed path). A mobile or licence failure
 * fails `stackra/verify-mobile` only.
 */
export const KINDS = Object.freeze({
  gate: {
    check: VERIFY_CHECK,
    label: "Quality Gate",
    script: "gate.sh",
    install: "gate",
    describe:
      "ci.yml's dependency-scan and Quality Gate jobs, then the licence policy and the tests",
  },
  mobile: {
    check: VERIFY_MOBILE_CHECK,
    label: "Mobile apps (Uniwind Pro)",
    script: "mobile.sh",
    install: "full",
    describe:
      "the licence policy over the full install, then ci.yml's mobile job: lint, typecheck and build of the two Uniwind Pro members",
  },
  codeql: {
    check: CODEQL_CHECK,
    label: "CodeQL",
    script: "codeql.sh",
    install: null,
    describe:
      "CodeQL from the pinned bundle, each language's code-scanning suite, offline; fails on an error-level or high-severity result",
  },
});
/** The kinds every head gets; CodeQL runs nightly on main and on demand (codeqlJobs). */
export const PER_HEAD_KINDS = ["gate", "mobile"];
/** The command the verify container runs for a kind: its generated script, mounted read-only. */
export const kindCommand = (kind) => `bash ${IN_DIR}/${KINDS[kind].script}`;
export const VERIFY_COMMAND = kindCommand("gate");

/**
 * The read-only inputs a kind's verify container gets besides the archive: the gate its script, the licence check,
 * main's licence policy (written from the mirror at the job's base), the PR facts, the history bundle and the offline OSV database; mobile its script. Each `[host path, container path]`.
 */
export function kindMounts(kind, { runDir, osvDir, codeqlDir }) {
  const file = (name) => [join(runDir, name), `${IN_DIR}/${name}`];
  if (kind === "gate")
    return [
      file("gate.sh"),
      file("licence-check.mjs"),
      file("licences.json"),
      file("shared-definitions"),
      file("shared-main.tar"),
      file("facts.json"),
      file("history.bundle"),
      [osvDir, OSV_MOUNT],
    ];
  if (kind === "mobile")
    return [file("mobile.sh"), file("licence-check.mjs"), file("licences.json")];
  if (kind === "codeql")
    return [file("codeql.sh"), file("codeql-results.cjs"), [codeqlDir, "/codeql"]];
  throw new Error(`not a verify kind: ${kind}`);
}

/** The files a kind's run writes for its mounts (the facts and the bundle come from GitHub and the mirror). */
export function kindFiles(kind, languages = CODEQL_DEFAULT_LANGUAGES) {
  if (kind === "gate")
    return { "gate.sh": gateScript(), "licence-check.mjs": licenceCheckSource() };
  if (kind === "mobile")
    return { "mobile.sh": mobileScript(), "licence-check.mjs": licenceCheckSource() };
  if (kind === "codeql")
    return {
      "codeql.sh": codeqlScript(languages),
      "codeql-results.cjs": `${codeqlResults.toString()}\nprocess.exit(codeqlResults(process.argv.slice(2)));\n`,
    };
  throw new Error(`not a verify kind: ${kind}`);
}

/**
 * The PR facts the gate's Linear check and validate step read, from GitHub's pull request (the daemon's own API call,
 * never the PR tree); a job without a PR (main, a merge-queue commit) is a push.
 */
export const prFacts = (job, pull) =>
  pull
    ? {
        event: "pull_request",
        title: String(pull.title ?? ""),
        branch: String(pull.head?.ref ?? ""),
        labels: (pull.labels ?? []).map((l) => String(l.name)),
        draft: pull.draft === true,
        base: job.base,
        head: job.sha,
      }
    : {
        event: "push",
        title: "",
        branch: "",
        labels: [],
        draft: false,
        base: job.base,
        head: job.sha,
      };

/**
 * The gate's tools, as main's mise.toml pins them (shellcheck, which actionlint runs on every `run:`, as box 1's mise
 * has it), baked into the store image. Each download is checked against its sha256 setting (TOOL_SHA_SETTING; main
 * has no mise.lock, so the owner sets them from each release's published checksums) before Docker sees it.
 */
export const TOOLS = Object.freeze([
  {
    name: "actionlint",
    version: "1.7.12",
    url: "https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz",
    member: "actionlint",
    check: "actionlint -version",
  },
  {
    name: "zizmor",
    version: "1.31.1",
    url: "https://github.com/zizmorcore/zizmor/releases/download/v1.31.1/zizmor-x86_64-unknown-linux-gnu.tar.gz",
    member: "zizmor",
    check: "zizmor --version",
  },
  {
    name: "osv-scanner",
    version: "2.7.0",
    url: "https://github.com/google/osv-scanner/releases/download/v2.7.0/osv-scanner_linux_amd64",
    check: "osv-scanner --version",
  },
  {
    name: "gitleaks",
    version: "8.30.1",
    url: "https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz",
    member: "gitleaks",
    check: "gitleaks version",
  },
  {
    name: "shfmt",
    version: "3.14.1",
    url: "https://github.com/mvdan/sh/releases/download/v3.14.1/shfmt_v3.14.1_linux_amd64",
    check: "shfmt --version",
  },
  {
    name: "squawk",
    version: "2.71.0",
    url: "https://github.com/sbdchd/squawk/releases/download/v2.71.0/squawk-linux-x64",
    check: "squawk --version",
  },
  {
    name: "shellcheck",
    version: "0.11.0",
    url: "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz",
    member: "shellcheck-v0.11.0/shellcheck",
    check: "shellcheck --version",
  },
]);
/** The setting that holds a tool's sha256: STACKRA_VERIFY_SHA256_<NAME>. */
export const toolShaSetting = (tool) =>
  `STACKRA_VERIFY_SHA256_${tool.name.toUpperCase().replaceAll("-", "_")}`;
/** The tool's file in the store image's build context. */
export const toolFile = (tool) =>
  `${tool.name}-${tool.version}${/\.tar\.(?:gz|xz)$/.exec(tool.url)?.[0] ?? ""}`;
const SHA256 = /^[0-9a-f]{64}$/;

/** The store build's tool step (a bind mount, so no layer holds the downloads): unpack, install, prove each runs. */
export function toolInstallScript(tools = TOOLS) {
  const lines = ["set -e", "mkdir -p /opt/stackra-verify/bin /tmp/stackra-tools"];
  for (const tool of tools) {
    const file = `/tools/${toolFile(tool)}`;
    if (tool.member)
      lines.push(
        `tar -xf ${file} -C /tmp/stackra-tools ${tool.member}`,
        `install -m 0755 /tmp/stackra-tools/${tool.member} /opt/stackra-verify/bin/${tool.name}`,
      );
    else lines.push(`install -m 0755 ${file} /opt/stackra-verify/bin/${tool.name}`);
  }
  lines.push(
    "rm -rf /tmp/stackra-tools",
    'PATH="/opt/stackra-verify/bin:$PATH"',
    ...tools.map((t) => t.check),
    "",
  );
  return lines.join("\n");
}

/**
 * Streams `url` to `dest`, checking its sha256 on the way (`sha256` null: no published checksum, the caller checks the
 * content); a mismatch leaves no file. `fetcher` is fetch (a test passes a fake).
 */
export async function downloadVerified(url, sha256, dest, fetcher = fetch) {
  const response = await fetcher(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(30 * 60_000),
  });
  if (!response.ok || !response.body) throw new Error(`download ${url}: HTTP ${response.status}`);
  const hash = createHash("sha256");
  const part = `${dest}.part`;
  await pipeline(
    Readable.fromWeb(response.body),
    async function* hashed(source) {
      for await (const chunk of source) {
        hash.update(chunk);
        yield chunk;
      }
    },
    createWriteStream(part, { mode: 0o644 }),
  );
  const got = hash.digest("hex");
  if (sha256 && got !== sha256) {
    rmSync(part, { force: true });
    throw new Error(`${url}: sha256 is ${got}, the setting says ${sha256}`);
  }
  renameSync(part, dest);
  return got;
}

/** The OSV npm database osv-scanner reads offline (`<cache>/osv-scalibr/npm/all.zip`, as osv-scanner 2.7.0 lays it). */
export const OSV_DB_URL = "https://osv-vulnerabilities.storage.googleapis.com/npm/all.zip";
export const osvDbPath = (dir) => join(dir, "osv-scalibr", "npm", "all.zip");
/** The daemon refreshes the database when it is older than this; STACKRA_VERIFY_OSV_MAX_AGE_H refuses a run. */
export const OSV_REFRESH_MS = 6 * 60 * 60 * 1000;

/**
 * The OSV canary (review of #1043, MEDIUM 4): a lockfile that locks lodash 4.17.20, whose command injection advisory
 * GHSA-35jh-r3h4-6jhm (CVE-2021-23337, fixed in 4.17.21) every OSV npm database since 2021 carries. Committed as
 * `tools/scripts/osv-canary.lock.yaml` (not a lockfile name, so no dependency scanner reads it) and scanned as
 * `pnpm-lock.yaml` exactly as the gate scans: osv-scanner offline, `--network none`, in the store image, over the
 * mounted database. A database it cannot find the advisory in is refused: a service error, never a green scan.
 */
export const OSV_CANARY = Object.freeze({
  file: "tools/scripts/osv-canary.lock.yaml",
  advisory: "GHSA-35jh-r3h4-6jhm",
  package: "lodash@4.17.20",
});
/** The canary runs again after this long even when the database file has not changed (a database swapped in place). */
export const OSV_CANARY_EVERY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether the canary must run: a database, store image or osv-scanner version it has not passed (by the database's
 * mtime and size, the image id, the scanner's pinned version), or a day since it last did (review LOW-3).
 */
export const osvCanaryDue = (last, db, now) =>
  !last ||
  last.mtimeMs !== db.mtimeMs ||
  last.size !== db.size ||
  last.image !== db.image ||
  last.scanner !== db.scanner ||
  !(now - last.at >= 0 && now - last.at < OSV_CANARY_EVERY_MS);
/** The smallest OSV npm database the gate accepts, in place as well as at download (review LOW-3). */
export const OSV_DB_MIN_BYTES = 1024 * 1024;

/**
 * Why a canary scan (`{ code, stdout }` of the container) does not prove the database, or null when it does: the
 * scan must fail (osv-scanner exits 1 when it finds vulnerabilities) and name the canary's advisory.
 */
export function osvCanaryProblem({ code, stdout }, advisory = OSV_CANARY.advisory) {
  if (code === 0)
    return `the OSV canary found nothing: the offline database does not know ${advisory}`;
  if (code !== 1) return `the OSV canary did not run (exit ${code ?? "none"})`;
  if (!String(stdout ?? "").includes(advisory))
    return `the OSV canary failed without naming ${advisory}: the offline database is not the one the gate needs`;
  return null;
}

/** The canary container: the store image, no network, the database and the canary lockfile read-only. */
export const osvCanaryArgs = (s, { name, image, envFile, osvDir, lockfile }) => [
  "run",
  "--rm",
  "--name",
  name,
  "--network",
  "none",
  ...containerLimits(s, envFile),
  "--env",
  `OSV_SCANNER_LOCAL_DB_CACHE_DIRECTORY=${OSV_MOUNT}`,
  "--volume",
  `${osvDir}:${OSV_MOUNT}:ro`,
  "--volume",
  `${lockfile}:/canary/pnpm-lock.yaml:ro`,
  "--workdir",
  "/canary",
  image,
  "osv-scanner",
  "scan",
  "source",
  "--offline",
  "--lockfile=pnpm-lock.yaml",
];

/**
 * Why the offline OSV database may not be used (missing, under OSV_DB_MIN_BYTES, from the future, or older than
 * `maxAgeMs`), or null. A run
 * without a fresh database is a service error (retried, then `neutral`), never a green dependency scan.
 */
export function osvDbProblem(mtimeMs, now, maxAgeMs, size = OSV_DB_MIN_BYTES) {
  if (mtimeMs === null || mtimeMs === undefined) return "the offline OSV database is missing";
  if (!(size >= OSV_DB_MIN_BYTES))
    return `the offline OSV database is ${size ?? 0} bytes (at least ${OSV_DB_MIN_BYTES})`;
  const age = now - mtimeMs;
  if (!Number.isFinite(age) || age < 0) return "the offline OSV database is dated in the future";
  if (age > maxAgeMs)
    return `the offline OSV database is ${Math.floor(age / 3_600_000)} h old (at most ${Math.round(maxAgeMs / 3_600_000)} h)`;
  return null;
}

// ---- CodeQL: stackra/codeql, never required -----------------------------------------------------------------

/** The languages CodeQL analyses and each one's code-scanning suite (what GitHub's default setup runs). */
export const CODEQL_SUITES = Object.freeze({
  "javascript-typescript": "codeql/javascript-queries:codeql-suites/javascript-code-scanning.qls",
  actions: "codeql/actions-queries:codeql-suites/actions-code-scanning.qls",
});
export const CODEQL_DEFAULT_LANGUAGES = ["javascript-typescript", "actions"];
/** A PR with one of these labels gets a stackra/codeql run on its head: on demand, or a strict (risk:R3) change. */
export const CODEQL_LABELS = ["codeql", "risk:R3"];

/**
 * The CodeQL steps: per language, a database from the tested tree and its code-scanning suite (the bundle carries the
 * query packs, so nothing is downloaded), then the results step. Databases live in /tmp, outside the source root.
 */
export function codeqlScript(languages = CODEQL_DEFAULT_LANGUAGES) {
  const steps = languages.map((language) => {
    if (!CODEQL_SUITES[language]) throw new Error(`not a CodeQL language: ${language}`);
    return {
      id: `codeql-${language}`,
      run: [
        `/codeql/codeql database create /tmp/stackra-codeql/db-${language} --language=${language} --source-root=/work --threads=0 --overwrite`,
        `/codeql/codeql database analyze /tmp/stackra-codeql/db-${language} ${CODEQL_SUITES[language]} --format=sarif-latest --output=/tmp/stackra-codeql/${language}.sarif --threads=0`,
      ].join("\n"),
    };
  });
  steps.push({
    id: "codeql-results",
    run: 'node "$GATE_IN/codeql-results.cjs" /tmp/stackra-codeql/*.sarif',
  });
  return stepScript(steps, { facts: false }).replace(
    "cd /work || exit 1",
    "cd /work || exit 1\nmkdir -p /tmp/stackra-codeql",
  );
}

/**
 * Prints every result of the SARIF files (level, rule, place, first line of the message) and returns the exit code:
 * 1 when any result is error-level or its rule's security-severity is 7.0 or more (GitHub's high and critical), or a
 * file is unreadable; else 0. Self-contained: the results step runs this function's own source.
 */
export function codeqlResults(
  files,
  read = (path) => require("node:fs").readFileSync(path, "utf8"),
) {
  let total = 0;
  let failing = 0;
  if (!files.length) {
    console.log("no SARIF file: the analysis did not run");
    return 1;
  }
  for (const file of files) {
    let sarif;
    try {
      sarif = JSON.parse(read(file));
    } catch (error) {
      console.log(`${file}: ${error.message}`);
      return 1;
    }
    for (const run of sarif.runs ?? []) {
      const rules = new Map((run.tool?.driver?.rules ?? []).map((rule) => [rule.id, rule]));
      for (const result of run.results ?? []) {
        const rule = rules.get(result.ruleId);
        const level = result.level ?? rule?.defaultConfiguration?.level ?? "warning";
        const severity = Number(rule?.properties?.["security-severity"] ?? 0);
        const fails = level === "error" || severity >= 7;
        total++;
        if (fails) failing++;
        const place = result.locations?.[0]?.physicalLocation;
        console.log(
          `${fails ? "FAIL" : "note"} ${level}${severity ? ` (security-severity ${severity})` : ""} ${result.ruleId} ` +
            `${place?.artifactLocation?.uri ?? "?"}:${place?.region?.startLine ?? 0} ${String(
              result.message?.text ?? "",
            )
              .split("\n")[0]
              .slice(0, 200)}`,
        );
      }
    }
  }
  console.log(`${total} results, ${failing} at error level or high severity`);
  return failing ? 1 : 0;
}

/**
 * The CodeQL jobs of one pass: every open PR labelled CODEQL_LABELS (on demand), and main's head once per UTC day
 * from `hourUtc` (`nightly` names the day, so a posted run marks it done).
 */
export function codeqlJobs(jobs, { now, hourUtc, lastNightly }) {
  const out = jobs
    .filter((j) => j.pr && (j.labels ?? []).some((l) => CODEQL_LABELS.includes(l)))
    .map((j) => ({ ...j, kind: "codeql" }));
  const day = new Date(now).toISOString().slice(0, 10);
  const main = jobs.find((j) => !j.pr && !j.queue);
  if (main && lastNightly !== day && new Date(now).getUTCHours() >= hourUtc)
    out.push({ ...main, kind: "codeql", nightly: day });
  return out;
}

/** The uid:gid PR code runs as inside every container (the base image's unprivileged user), never root. */
export const CONTAINER_USER = "1000:1000";
/**
 * Before verify: the tested tree is unpacked again over /work (undoing whatever the install phase wrote to tracked
 * files), and committed to a fresh git repository so `git ls-files` sees the tree as a local checkout would.
 */
export const VERIFY_PREPARE =
  "set -e; tar -xf /in/src.tar -C /work; cd /work; rm -rf .git; git init -q; git add -A; " +
  "git -c user.name=stackra-verify -c user.email=verify@stackra.invalid -c commit.gpgsign=false commit -qm tested --no-verify";
/** An infrastructure error (fetch, Docker, disk) is retried after this long … */
export const ERROR_RETRY_MS = 30 * 60 * 1000;
/** … and after this many on one SHA the service posts `neutral` (could not run), which never merges. */
export const MAX_ERROR_ATTEMPTS = 3;
/** Whether a run finished within FRESH_MS of `now`; a time in the future (or unreadable) is never fresh. */
export function isFresh(completedAt, now = Date.now()) {
  const age = now - Date.parse(completedAt ?? "");
  return Number.isFinite(age) && age >= 0 && age < FRESH_MS;
}

/** How long a green against an older main stands, for the PR to enter the merge queue (CTO ruling M3). */
export const FRESH_MS = 24 * 60 * 60 * 1000;
export const LOG_KEEP_MS = 14 * 24 * 60 * 60 * 1000;
/** The check run output's text limit is 65535 characters; the log tail stays well inside it. */
export const OUTPUT_TEXT_MAX = 60_000;
export const LOCK_HELD_EXIT = 75;
const REPO_PART = /^(?!\.+$)[\w.-]+$/;
const validRepo = (r) => r.split("/").length === 2 && r.split("/").every((p) => REPO_PART.test(p));
const DIGEST_PINNED = /^[\w./:-]+@sha256:[0-9a-f]{64}$/;
/** A cpuset list for `docker --cpuset-cpus`: CPU numbers and ranges, comma-separated. */
const CPUSET = /^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/;

// ---- arguments and settings ---------------------------------------------------------------------------------

/** `<verb> [flags]` → options, or null on a usage error. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--");
  const verb = args.shift();
  if (verb === "self-check") return args.length ? null : { verb };
  if (!["run", "once", "daemon"].includes(verb)) return null;
  const out = { verb, repos: [], interval: 300 };
  let interval = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-R" || a === "--repo") out.repos.push(args[++i] ?? "");
    else if (a === "--sha") out.sha = args[++i] ?? "";
    else if (a === "--pr") out.pr = args[++i] ?? "";
    else if (a === "--interval") {
      out.interval = Number(args[++i]);
      interval = true;
    } else return null;
  }
  if (out.repos.length === 0) out.repos.push(DEFAULT_REPO);
  if (!out.repos.every(validRepo)) return null;
  if (verb === "run" && out.repos.length !== 1) return null;
  out.repo = out.repos[0];
  if (out.pr !== undefined && !/^\d+$/.test(out.pr)) return null;
  if (verb === "run" && !/^[0-9a-f]{40}$/.test(out.sha ?? "")) return null;
  if (verb !== "run" && (out.sha || out.pr)) return null;
  if (interval && verb !== "daemon") return null;
  if (!Number.isFinite(out.interval) || out.interval < 30) return null;
  return out;
}

/**
 * The directories whose every entry the verify user must not read or list (deny by default): box 1's work root and
 * the Stackra root that holds the lanes' worktrees. Each must itself be traverse-only for the verify user (o=x).
 */
export const PROTECTED_ROOTS = ["/work", "/work/stackra"];
/**
 * The entries of a protected root the verify user may reach: the daemon's home (0711 at start; the run archives are
 * mounted from it), the code clone the unit runs from, and the verify user's own work and Docker data-root.
 */
export const ALLOW_PATHS = [
  "/work/stackra/verify",
  "/work/stackra/service",
  "/work/stackra/verify-work",
  "/work/stackra/verify-docker",
];
/** A comma-separated path setting, or `fallback` when unset. */
const list = (value, fallback) =>
  value === undefined
    ? [...fallback]
    : value
        .split(",")
        .map((p) => p.trim().replace(/(?<=.)\/+$/, ""))
        .filter(Boolean);

/** The host settings, from the environment the service was started with. None of them is a secret. */
export function settings(env = process.env) {
  return {
    home: env.STACKRA_VERIFY_HOME ?? "/work/stackra/verify",
    runAs: env.STACKRA_VERIFY_RUN_AS || null,
    dockerHost: env.STACKRA_VERIFY_DOCKER_HOST || null,
    baseImage: env.STACKRA_VERIFY_BASE_IMAGE || null,
    cpus: env.STACKRA_VERIFY_CPUS ?? "8",
    memory: env.STACKRA_VERIFY_MEMORY ?? "24g",
    pids: Number(env.STACKRA_VERIFY_PIDS ?? 8192),
    timeoutMs: Number(env.STACKRA_VERIFY_TIMEOUT_MIN ?? 120) * 60_000,
    minFreeBytes: Number(env.STACKRA_VERIFY_MIN_FREE_GB ?? 20) * 1024 ** 3,
    path: env.STACKRA_VERIFY_PATH || "/usr/local/bin:/usr/bin:/bin",
    box: env.STACKRA_VERIFY_BOX ?? hostname(),
    appId: env.STACKRA_VERIFY_APP_ID || null,
    installationId: env.STACKRA_VERIFY_INSTALLATION_ID || null,
    keyFile: env.STACKRA_VERIFY_KEY_FILE || null,
    dockerRoot: env.STACKRA_VERIFY_DOCKER_ROOT || null,
    licenceFile: env.STACKRA_VERIFY_LICENCE_FILE || null,
    cpuset: env.STACKRA_VERIFY_CPUSET || null,
    codeDir: CODE_DIR,
    protectedRoots: list(env.STACKRA_VERIFY_PROTECTED_ROOTS, PROTECTED_ROOTS),
    allowPaths: list(env.STACKRA_VERIFY_ALLOW_PATHS, ALLOW_PATHS),
    toolSha256: Object.fromEntries(
      TOOLS.map((tool) => [tool.name, env[toolShaSetting(tool)]?.trim().toLowerCase() || null]),
    ),
    osvDir:
      env.STACKRA_VERIFY_OSV_DIR || join(env.STACKRA_VERIFY_HOME ?? "/work/stackra/verify", "osv"),
    osvMaxAgeMs: Number(env.STACKRA_VERIFY_OSV_MAX_AGE_H ?? 24) * 3_600_000,
    codeqlBundleUrl: env.STACKRA_VERIFY_CODEQL_BUNDLE_URL || null,
    codeqlBundleSha256: env.STACKRA_VERIFY_CODEQL_BUNDLE_SHA256?.trim().toLowerCase() || null,
    codeqlLanguages: list(env.STACKRA_VERIFY_CODEQL_LANGUAGES, CODEQL_DEFAULT_LANGUAGES),
    codeqlHourUtc: Number(env.STACKRA_VERIFY_CODEQL_HOUR_UTC ?? 2),
    registries: (env.STACKRA_VERIFY_REGISTRIES?.split(",").filter(Boolean) ?? REGISTRY_HOSTS).map(
      (h) => h.trim(),
    ),
  };
}

/**
 * Why this host may not run the service; empty when it may. `keyMode` is the key file's permission bits (null when
 * unreadable). PR code must never run as the key holder, and only a digest-pinned base image is trusted.
 */
export function hostProblems(s, keyMode, licenceMode = 0o400) {
  const problems = [];
  if (!s.runAs)
    problems.push("STACKRA_VERIFY_RUN_AS is not set: PR code would run as the key holder");
  if (!s.dockerHost)
    problems.push("STACKRA_VERIFY_DOCKER_HOST is not set: the verify user's own rootless Docker");
  if (!s.baseImage || !DIGEST_PINNED.test(s.baseImage))
    problems.push("STACKRA_VERIFY_BASE_IMAGE must be pinned by digest (name@sha256:<64 hex>)");
  if (!s.appId || !s.installationId || !s.keyFile)
    problems.push(
      "STACKRA_VERIFY_APP_ID, STACKRA_VERIFY_INSTALLATION_ID and STACKRA_VERIFY_KEY_FILE are required",
    );
  else if (keyMode === null) problems.push("the App key file is not readable");
  else if (keyMode !== 0o400)
    problems.push("the App key file must be mode 0400 (readable by its owner only)");
  if (s.licenceFile && licenceMode !== 0o400)
    problems.push("the licence token file must be mode 0400 and owned by the service");
  if (VERIFY_APP.id && s.appId && String(VERIFY_APP.id) !== String(s.appId))
    problems.push(
      `STACKRA_VERIFY_APP_ID differs from VERIFY_APP.id (${VERIFY_APP.id}) in pr-merge.mjs`,
    );
  for (const tool of TOOLS)
    if (!SHA256.test(s.toolSha256?.[tool.name] ?? ""))
      problems.push(
        `${toolShaSetting(tool)} must be the sha256 (64 hex) of ${tool.url}, from the release's published checksums`,
      );
  if (!/^\d+(?:\.\d+)?$/.test(String(s.cpus)) || !(Number(s.cpus) > 0))
    problems.push(
      `STACKRA_VERIFY_CPUS is "${s.cpus}": it must be a positive number of CPUs such as 8 (docker --cpus); a CPU list such as 0-7 goes in STACKRA_VERIFY_CPUSET`,
    );
  if (s.cpuset && !CPUSET.test(s.cpuset))
    problems.push(
      `STACKRA_VERIFY_CPUSET is "${s.cpuset}": it must be a CPU list such as 0-7 or 0,2-4 (docker --cpuset-cpus)`,
    );
  if (Boolean(s.codeqlBundleUrl) !== Boolean(s.codeqlBundleSha256))
    problems.push(
      "STACKRA_VERIFY_CODEQL_BUNDLE_URL and STACKRA_VERIFY_CODEQL_BUNDLE_SHA256 are set together (or neither: no CodeQL)",
    );
  else if (s.codeqlBundleUrl) {
    if (!/^https:\/\/\S+$/.test(s.codeqlBundleUrl))
      problems.push("STACKRA_VERIFY_CODEQL_BUNDLE_URL must be an https URL");
    if (!SHA256.test(s.codeqlBundleSha256))
      problems.push("STACKRA_VERIFY_CODEQL_BUNDLE_SHA256 must be 64 hex characters");
    for (const language of s.codeqlLanguages ?? [])
      if (!CODEQL_SUITES[language])
        problems.push(`STACKRA_VERIFY_CODEQL_LANGUAGES: not a CodeQL language here: ${language}`);
    if (!Number.isInteger(s.codeqlHourUtc) || s.codeqlHourUtc < 0 || s.codeqlHourUtc > 23)
      problems.push("STACKRA_VERIFY_CODEQL_HOUR_UTC must be a whole hour, 0 to 23");
  }
  for (const [name, value] of [
    ["STACKRA_VERIFY_OSV_MAX_AGE_H", s.osvMaxAgeMs],
    ["STACKRA_VERIFY_PIDS", s.pids],
    ["STACKRA_VERIFY_TIMEOUT_MIN", s.timeoutMs],
    ["STACKRA_VERIFY_MIN_FREE_GB", s.minFreeBytes],
  ])
    if (!Number.isFinite(value) || value <= 0) problems.push(`${name} must be a positive number`);
  return problems;
}

// ---- pure builders ------------------------------------------------------------------------------------------

/**
 * The argv that runs `docker args` as the verify user. sudo resets the environment; PATH and DOCKER_HOST come from
 * `envFile` (0644, daemon-written), so no value appears in argv, `ps` or the sudo log.
 */
export const dockerAs = (s, args) => [
  "sudo",
  "-n",
  "-u",
  s.runAs,
  "--",
  "/bin/sh",
  "-c",
  'set -a; . "$1"; set +a; shift; exec docker "$@"',
  "stackra-verify",
  join(s.home, "docker.env"),
  ...args,
];

/** The verify user's Docker client environment, written to `<home>/docker.env`: two names, no secret. */
export const dockerEnvFile = (s) => `PATH=${s.path}\nDOCKER_HOST=${s.dockerHost}\n`;

/** Every PR container's environment, passed with `--env-file`: an allowlist, nothing from this process. */
export const CONTAINER_ENV =
  "HOME=/home/run\nXDG_CACHE_HOME=/home/run/.cache\nTURBO_CACHE_DIR=/tmp/turbo-cache\nCI=1\nTURBO_TELEMETRY_DISABLED=1\n" +
  "FORCE_COLOR=0\nLANG=C.UTF-8\nTZ=UTC\n";

/** The limits every PR container runs with; `envFile` holds CONTAINER_ENV. */
export const containerLimits = (s, envFile) => [
  "--cpus",
  s.cpus,
  ...(s.cpuset ? ["--cpuset-cpus", s.cpuset] : []),
  "--memory",
  s.memory,
  "--memory-swap",
  s.memory,
  "--pids-limit",
  String(s.pids),
  "--cap-drop",
  "ALL",
  "--security-opt",
  "no-new-privileges",
  "--user",
  CONTAINER_USER,
  "--tmpfs",
  "/tmp:rw,nosuid,nodev,size=4g,mode=1777",
  "--tmpfs",
  "/home/run:rw,nosuid,nodev,size=1g,uid=1000,gid=1000,mode=0700",
  "--env-file",
  envFile,
];

/**
 * The install container: the archived SHA (read-only) unpacked into /work, then `pnpm install` against the warm
 * store in the image. It has network for the registries and nothing secret.
 */
export const installArgs = (
  s,
  { name, image, tarPath, envFile, network, builds = [], licensed = LICENSED_BUILDS, filters = [] },
) => [
  "run",
  "--name",
  name,
  "--network",
  network,
  // External names never resolve, whatever the Docker version; the embedded DNS still answers for `proxy`.
  "--dns",
  "127.0.0.1",
  ...containerLimits(s, envFile),
  "--volume",
  `${tarPath}:/in/src.tar:ro`,
  image,
  "sh",
  "-c",
  `set -e; tar -xf /in/src.tar -C /work; cd /work; ${installCommand(builds, licensed, filters)}`,
];

/** The hosts the install's proxy lets through, on port 443 only: the package registries. */
export const REGISTRY_HOSTS = ["registry.npmjs.org", "npm.stackra.figentra.com"];
export const PROXY_PORT = 3128;
/** What the proxy prints, followed by its port, once it listens: the install network's readiness signal. */
export const PROXY_READY = "stackra-proxy listening on ";
/** How long the network step waits for PROXY_READY before the run errors (a proxy that never comes up). */
export const PROXY_START_MS = 2 * 60_000;

/**
 * The allowlisting proxy: the install container sits on an `--internal` network whose only way out is this proxy,
 * which answers CONNECT to an allowed host on 443 and refuses everything else (403), including any address literal.
 * It prints PROXY_READY and its port once it listens (port 0: one the system picks); nothing reaches it before.
 */
export function proxyScript(allow, port = PROXY_PORT) {
  return [
    'const http = require("node:http"); const net = require("node:net");',
    `const allow = new Set(${JSON.stringify(allow.map((h) => h.toLowerCase()))});`,
    "const server = http.createServer((req, res) => { res.writeHead(403); res.end(); });",
    'server.on("connect", (req, socket) => {',
    '  const [host, port] = String(req.url).split(":");',
    '  if (!allow.has(String(host).toLowerCase()) || port !== "443" || net.isIP(host)) {',
    '    socket.end("HTTP/1.1 403 Forbidden\\r\\n\\r\\n"); return; }',
    "  const up = net.connect(443, host, () => {",
    '    socket.write("HTTP/1.1 200 Connection Established\\r\\n\\r\\n"); up.pipe(socket); socket.pipe(up); });',
    '  up.on("error", () => socket.end("HTTP/1.1 502 Bad Gateway\\r\\n\\r\\n"));',
    '  socket.on("error", () => up.destroy());',
    "});",
    `server.listen(${port}, "0.0.0.0", () => console.log(${JSON.stringify(PROXY_READY)} + server.address().port));`,
  ].join("\n");
}

/**
 * The first line of `stream` that starts with `prefix`, as soon as it is written (lines may arrive split across
 * chunks); rejects when the stream ends or closes without one, or at `timeoutMs`, a deadline for a process that never
 * comes up, never a wait for one that does.
 */
export function untilLine(stream, prefix, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let timer = null;
    const finish = (done, value) => {
      clearTimeout(timer);
      stream.off("data", onData);
      stream.off("end", onEnd);
      stream.off("close", onEnd);
      stream.off("error", onEnd);
      done(value);
    };
    const onData = (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop();
      const line = lines.find((l) => l.startsWith(prefix));
      if (line !== undefined) finish(resolve, line.trimEnd());
    };
    const onEnd = () => finish(reject, new Error(`it ended before printing "${prefix.trim()}"`));
    timer = setTimeout(
      () => finish(reject, new Error(`no "${prefix.trim()}" within ${timeoutMs} ms`)),
      timeoutMs,
    );
    stream.on("data", onData);
    stream.on("end", onEnd);
    stream.on("close", onEnd);
    stream.on("error", onEnd);
  });
}

/**
 * untilLine over a child's stdout, and a rejection when the child itself fails (`error`: it could not be started or
 * signalled), so a missing sudo or docker is a failed run, never an unhandled event that ends the service.
 */
export function childLine(child, prefix, timeoutMs) {
  let onError;
  const failed = new Promise((_, reject) => {
    onError = (error) =>
      reject(new Error(`the follower failed: ${error.message}`, { cause: error }));
    child.once("error", onError);
  });
  return Promise.race([untilLine(child.stdout, prefix, timeoutMs), failed]).finally(() =>
    child.off("error", onError),
  );
}

/** The proxy container: on the default bridge (the only one with egress), joined to the run's internal network. */
export const proxyArgs = (s, { name, image, envFile, allow }) => [
  "run",
  "--detach",
  "--name",
  name,
  "--network",
  "bridge",
  ...containerLimits(s, envFile),
  image,
  "node",
  "-e",
  proxyScript(allow),
];

/** The install container's proxy settings, for its env file (pnpm and node read both spellings). */
export const proxyEnv = (url) =>
  [
    `HTTPS_PROXY=${url}`,
    `https_proxy=${url}`,
    `HTTP_PROXY=${url}`,
    `http_proxy=${url}`,
    `npm_config_https_proxy=${url}`,
    `npm_config_proxy=${url}`,
    "NO_PROXY=",
    "",
  ].join("\n");

/** Ports probed on every host address: ssh, web, Encore, Postgres, Redis, the Docker API, dev servers. */
export const PROBE_PORTS = [22, 80, 443, 2375, 2376, 3000, 4000, 5432, 6379, 8080, 9400];

/**
 * The addresses an install must never reach: instance metadata, the rootless host-loopback gateway, and each of the
 * box's own addresses (`hostAddresses`, from `hostname -I`) on PROBE_PORTS.
 */
export function probeTargets(hostAddresses = [], gateways = []) {
  const targets = [
    ...gateways.flatMap((g) =>
      [53, ...PROBE_PORTS].map((port) => (g.includes(":") ? `[${g}]:${port}` : `${g}:${port}`)),
    ),
    "169.254.169.254:80",
    "169.254.169.254:443",
    "169.254.170.2:80",
    "172.17.0.1:5432",
    "172.17.0.1:2375",
    "172.17.0.1:80",
    "[fd00:ec2::254]:80",
    ...PROBE_PORTS.map((port) => `10.0.2.2:${port}`),
  ];
  for (const address of hostAddresses)
    for (const port of PROBE_PORTS)
      targets.push(address.includes(":") ? `[${address}]:${port}` : `${address}:${port}`);
  return [...new Set(targets)];
}

/**
 * The probe: node in the store image tries a TCP connection to each target for 2 s and exits 9 when any connects
 * (it prints which), 0 when none does. Any other exit is an error, never a pass.
 */
export function probeScript(targets, proxy = null, dnsName = "example.com") {
  return [
    'const net = require("node:net");',
    `const targets = ${JSON.stringify(targets)};`,
    `const proxy = ${JSON.stringify(proxy)};`,
    "const viaProxy = (t) => new Promise((done) => {",
    "  if (!proxy) return done(null);",
    '  const [h, p] = proxy.split(":"); const s = net.connect({ host: h, port: Number(p), timeout: 3000 });',
    '  let buf = ""; s.on("connect", () => s.write("CONNECT " + t + " HTTP/1.1\\r\\nHost: " + t + "\\r\\n\\r\\n"));',
    '  s.on("data", (d) => { buf += d; if (buf.includes("\\r\\n")) { s.destroy(); done(/^HTTP\\/1\\.[01] 200/.test(buf) ? "proxy->" + t : null); } });',
    '  s.on("timeout", () => { s.destroy(); done(null); }); s.on("error", () => done(null)); s.on("end", () => done(null));',
    "});",
    // Docker's embedded DNS answers on every network (the install needs it for `proxy`); a leak is an external name
    // that resolves, so the probe resolves one and any answer counts.
    `const dnsName = ${JSON.stringify(dnsName)};`,
    'const dnsLeak = () => new Promise((done) => require("node:dns").lookup(dnsName, (e, a) => done(e ? null : "dns->" + dnsName + "=" + a)));',
    "const tryOne = (t) => new Promise((done) => {",
    '  const i = t.lastIndexOf(":"); const host = t.slice(0, i).replace(/^\\[|\\]$/g, ""); const port = Number(t.slice(i + 1));',
    "  const s = net.connect({ host, port, timeout: 2000 });",
    '  s.on("connect", () => { s.destroy(); done(t); });',
    '  s.on("timeout", () => { s.destroy(); done(null); });',
    '  s.on("error", () => done(null));',
    "});",
    'Promise.all([...targets.map(tryOne), ...targets.map(viaProxy), dnsLeak()]).then((r) => { const open = r.filter(Boolean); if (open.length) { console.log("reachable: " + open.join(" ")); process.exit(9); } process.exit(0); });',
  ].join("\n");
}

/**
 * The leaks a probe found, from its docker result: [] sealed, the reachable targets on exit 9. A probe that did not
 * run (any other exit) is run again once (`attempts[1]` is the retry); still not run, the answer is null: unsafe.
 */
const probeLeaks = (r) =>
  r.code === 0
    ? []
    : r.code === 9
      ? (r.stdout.match(/^reachable: (.*)$/m)?.[1] ?? "unknown").split(" ")
      : null;

export function probeVerdict([first, again]) {
  const firstVerdict = probeLeaks(first);
  if (firstVerdict !== null || !again) return firstVerdict;
  return probeLeaks(again());
}

/** The probe container: the install's network and limits, nothing mounted, removed when it ends. */
export const probeArgs = (s, { name, image, envFile, targets, network, proxy = null }) => [
  "run",
  "--rm",
  "--name",
  name,
  "--network",
  network,
  "--dns",
  "127.0.0.1",
  ...containerLimits(s, envFile),
  image,
  "node",
  "-e",
  probeScript(targets, proxy),
];

/**
 * The verify container: the committed install, the tree unpacked again (read-only archive) by `prepare`, the kind's
 * other inputs as read-only `mounts` ([host, container] pairs), no network, then `command`.
 */
export const verifyArgs = (
  s,
  { name, image, envFile, tarPath, mounts = [], command = VERIFY_COMMAND, prepare = gatePrepare() },
) => [
  "run",
  "--name",
  name,
  "--network",
  "none",
  ...containerLimits(s, envFile),
  "--volume",
  `${tarPath}:${IN_DIR}/src.tar:ro`,
  ...mounts.flatMap(([host, container]) => ["--volume", `${host}:${container}:ro`]),
  "--workdir",
  "/work",
  image,
  "sh",
  "-c",
  `${prepare}; ${command}`,
];

/** The warm store image's tag, from the lockfile it was fetched for. */
export const storeTag = (lockfile, baseImage = "", tools = "") =>
  `stackra-verify-store:${createHash("sha256").update(baseImage).update("\0").update(lockfile).update("\0").update(tools).digest("hex").slice(0, 16)}`;

/** The store tag's tool part: every pin and its checksum, so a changed pin or checksum builds a new image. */
export const toolsFingerprint = (s) =>
  JSON.stringify(TOOLS.map((t) => [t.name, t.version, t.url, s.toolSha256?.[t.name] ?? null]));

/** The warm store: main's lockfile fetched into /store on top of the pinned base, built by the daemon only. */
export function storeDockerfile({ baseImage, pnpmVersion }) {
  if (!DIGEST_PINNED.test(baseImage)) throw new Error("the base image must be pinned by digest");
  if (!/^\d+\.\d+\.\d+$/.test(pnpmVersion)) throw new Error(`not a pnpm version: ${pnpmVersion}`);
  return [
    `FROM ${baseImage}`,
    "ENV CI=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0 COREPACK_HOME=/opt/corepack",
    `RUN corepack enable && corepack prepare pnpm@${pnpmVersion} --activate && chmod -R a+rX /opt/corepack`,
    // The gate's pinned tools, from the checked downloads in the context's tools/ (a bind mount, never a layer).
    "RUN --mount=type=bind,source=tools,target=/tools sh /tools/install.sh",
    "ENV PATH=/opt/stackra-verify/bin:$PATH",
    "RUN git --version && tar --version && bash --version",
    "WORKDIR /seed",
    "COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./",
    "RUN pnpm fetch --store-dir /store && rm -rf /seed",
    `RUN mkdir -p /work /prebuilt && chown -R ${CONTAINER_USER} /store /work /prebuilt`,
    "",
  ].join("\n");
}

/**
 * The licensed image: the store image plus /prebuilt/<name>@<version>, built by the daemon only. The token is a
 * BuildKit secret mount and the stage script a bind mount, so no layer holds either.
 */
export function licensedDockerfile(storeImage) {
  return [
    `FROM ${storeImage}`,
    "USER root",
    "RUN --mount=type=secret,id=licence,required=true --mount=type=tmpfs,target=/scan --mount=type=bind,source=licensed.sh,target=/licensed.sh sh /licensed.sh",
    `RUN chown -R ${CONTAINER_USER} /prebuilt`,
    "",
  ].join("\n");
}

const PACKAGE_NAME = /^[a-z0-9][\w.-]*$/;
const PACKAGE_VERSION = /^\d[\w.+-]*$/;
const INTEGRITY = /^sha512-[A-Za-z0-9+/]+={0,2}$/;

/**
 * The licensed stage (bind-mounted, never in a layer). For each package: `npm pack` the publisher's tarball from the
 * registry and check it against the lockfile's integrity; install it with scripts off; hash the package directory;
 * run its postinstall with the token; copy to /prebuilt only the files the postinstall added or changed (the explicit
 * artifact list). A failure prints its output with the token redacted (plain and base64). Last, the whole filesystem
 * is searched for the token in both forms, and the build fails if it is anywhere: proof it was not persisted.
 */
/**
 * The proof the token was not persisted: every file outside the kernel's and the secret mounts (pruned by full path)
 * is searched for the patterns, and any file listed fails the build. The verdict is the list itself, never xargs'
 * exit status (which a batch without a match turns into 123 even when another batch matched).
 */
export function persistenceCheck(root, patterns) {
  const prune = root === "/" ? "/proc /sys /dev /run/secrets /scan" : "";
  const pruneExpr = prune
    .split(" ")
    .filter(Boolean)
    .map((path) => `-path ${path}`)
    .join(" -o ");
  const walk = pruneExpr
    ? `find ${root} \\( ${pruneExpr} \\) -prune -o -type f -print0`
    : `find ${root} -type f -print0`;
  return `hits=$(${walk} | xargs -0 -r grep -lF -f ${patterns} 2>/dev/null || true); [ -z "$hits" ] || { echo "the licence token was persisted"; exit 1; }`;
}

export function licensedScript(packages) {
  for (const { name, version, integrity } of packages)
    if (
      !PACKAGE_NAME.test(name) ||
      !PACKAGE_VERSION.test(version) ||
      !INTEGRITY.test(integrity ?? "")
    )
      throw new Error(`not a package: ${name}@${version}`);
  const lines = [
    "set -e",
    // The secret holds the token on its first line and its base64 cores on the next: only builtins and files
    // touch them, so no value is ever on a command line (`ps`).
    "head -n 1 /run/secrets/licence > /scan/token",
    "cp /run/secrets/licence /scan/patterns",
    "redact() { awk 'NR == FNR { p[++n] = $0; next } { for (k = 1; k <= n; k++) while ((i = index($0, p[k])) > 0) $0 = substr($0, 1, i - 1) \"[redacted]\" substr($0, i + length(p[k])); print }' /scan/patterns -; }",
    "mkdir -p /lic /prebuilt",
  ];
  for (const { name, version, integrity } of packages) {
    const dir = `/lic/${name}@${version}`;
    lines.push(
      `mkdir -p ${dir} && cd ${dir}`,
      `npm pack ${name}@${version} --silent --pack-destination ${dir} > /dev/null`,
      `f=$(ls ${dir}/*.tgz)`,
      `got=$(node -e 'process.stdout.write("sha512-"+require("crypto").createHash("sha512").update(require("fs").readFileSync(process.argv[1])).digest("base64"))' "$f")`,
      `[ "$got" = "${integrity}" ] || { echo "${name}@${version}: the registry tarball does not match the lockfile integrity"; exit 1; }`,
      `printf '%s' '${JSON.stringify({ name: "licensed", private: true })}' > package.json`,
      // Its dependencies resolve only to versions published at least a day ago (a fresh malicious release is the risk).
      `pnpm add "$f" --store-dir /store --ignore-scripts --config.minimum-release-age=1440 > /dev/null`,
      `p=${dir}/node_modules/${name}`,
      `(cd "$p" && find . -type f -exec sha256sum {} + | sort -k2) > ${dir}/.before`,
      // The token reaches the postinstall through its environment only, read from the file by the shell itself.
      `(cd "$p" && UNIWIND_CACHE_DIR=${dir}/.cache UNIWIND_AUTH_TOKEN="$(cat /scan/token)" sh -c "$(node -p 'require("./package.json").scripts.postinstall')") > ${dir}/.out 2>&1 || { redact < ${dir}/.out; exit 1; }`,
      `(cd "$p" && find . -type f -exec sha256sum {} + | sort -k2) > ${dir}/.after`,
      `mkdir -p /prebuilt/${name}@${version}`,
      `comm -13 ${dir}/.before ${dir}/.after | awk '{ print substr($0, 67) }' | (cd "$p" && tar -cf - -T -) | tar -xf - -C /prebuilt/${name}@${version}`,
      "cd /",
    );
  }
  lines.push(
    "rm -rf /lic /tmp/* /root/.cache /root/.npm /root/.uniwind /root/.local /root/.config",
    // Proof the token was not persisted: every file outside the kernel's and the secret mounts (pruned by full path,
    // so a nested dev/ or run/ is still searched) is searched for the token and its base64 cores.
    persistenceCheck("/", "/scan/patterns"),
  );
  return lines.join("\n");
}

/**
 * Whether `needle` occurs in a stream of chunks, across chunk boundaries (the image scan for the licence token).
 * Returns a consumer `{ push(chunk), found }`.
 */
export function needleScanner(needle) {
  const target = Buffer.from(needle);
  let carry = Buffer.alloc(0);
  const scanner = {
    found: false,
    push(chunk) {
      if (scanner.found || target.length === 0) return;
      const data = Buffer.concat([carry, Buffer.from(chunk)]);
      if (data.indexOf(target) !== -1) scanner.found = true;
      carry = data.subarray(Math.max(0, data.length - target.length + 1));
    },
  };
  return scanner;
}

/** pnpm's version from a root package.json's `packageManager` (`pnpm@12.16.1+sha…`). */
export function pnpmVersionOf(packageJson) {
  const match = /^pnpm@(\d+\.\d+\.\d+)/.exec(JSON.parse(packageJson).packageManager ?? "");
  if (!match) throw new Error("the root package.json names no pnpm version in packageManager");
  return match[1];
}

/**
 * The package.json fields the tested tree always takes from main's copy: the commands, and the knip and commitlint
 * configs a package.json can carry (the Quality Gate reads both). A field main does not have is dropped.
 */
export const OVERLAY_FIELDS = ["scripts", "knip", "commitlint"];

const overlayFields = (json) => JSON.stringify(OVERLAY_FIELDS.map((field) => json[field] ?? null));

/**
 * A package.json text with OVERLAY_FIELDS taken from main's copy, keys in the PR's order: the PR keeps its
 * dependencies, never its checks. Null when the PR's fields already equal main's, so its file stays byte for byte.
 */
export function withMainScripts(headText, mainText) {
  const head = JSON.parse(headText);
  const main = JSON.parse(mainText);
  if (overlayFields(head) === overlayFields(main)) return null;
  const out = {};
  for (const [key, value] of Object.entries(head))
    if (!OVERLAY_FIELDS.includes(key)) out[key] = value;
    else if (main[key] !== undefined) out[key] = main[key];
  for (const field of OVERLAY_FIELDS)
    if (!(field in head) && main[field] !== undefined) out[field] = main[field];
  return `${JSON.stringify(out, null, 2)}\n`;
}

// ---- what the tested tree may carry (review of #1043, HIGH-1 and HIGH-2; CTO rulings, round 4) ---------------------

/** A refusal of the tested tree: the PR's failure, with the reason the check run names. */
const treeRefusal = (problems) =>
  Object.assign(
    new Error(
      `the tested tree is refused: ${problems.slice(0, 8).join("; ")}${problems.length > 8 ? `; and ${problems.length - 8} more` : ""}`,
    ),
    { refused: true, problems },
  );

/**
 * The paths a PR adds or changes that the tested tree may never carry, as problems: anything under a `node_modules/`
 * or `.turbo/` directory at any depth (a committed `node_modules/.bin/node` would run in place of node through every
 * pnpm bin shim, a `.bin/gitleaks` in place of the secrets scan, a `.turbo/cache` entry would replay a cached pass),
 * and anything main's `.gitignore` files ignore (`ignored`, from git check-ignore).
 */
export function forbiddenPaths(paths, ignored = new Set()) {
  return paths
    .filter((p) => /(?:^|\/)(?:node_modules|\.turbo)(?:\/|$)/.test(p) || ignored.has(p))
    .map((p) => `${p} is a tool or cache path main ignores and the tested tree never carries`);
}

/**
 * Which of `paths` main's `.gitignore` files ignore: those files (blobs at the job's base, read from the bare mirror)
 * are laid into a throwaway work tree, and `git check-ignore --no-index` answers for each path.
 */
function ignoredByMain(mirror, base, paths) {
  if (!paths.length) return new Set();
  const dir = mkdtempSync(join(tmpdir(), "stackra-ignore-"));
  try {
    sh("git", ["init", "-q", dir], { env: gitEnv() });
    for (const line of git(mirror, ["ls-tree", "-r", "-z", "--full-tree", base]).split("\0")) {
      const [meta, path] = line.split("\t");
      if (!path || !/(?:^|\/)\.gitignore$/.test(path)) continue;
      mkdirSync(join(dir, dirname(path)), { recursive: true });
      writeFileSync(join(dir, path), git(mirror, ["cat-file", "blob", meta.split(" ")[2]]));
    }
    const r = spawnSync(
      "git",
      ["-c", "core.hooksPath=/dev/null", "-C", dir, "check-ignore", "--no-index", "-z", "--stdin"],
      spawnOptions({ env: gitEnv(), input: `${paths.join("\0")}\0` }),
    );
    if (r.status !== 0 && r.status !== 1)
      throw new Error(`git check-ignore: ${String(r.stderr).trim()}`);
    return new Set(String(r.stdout).split("\0").filter(Boolean));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The real YAML library the daemon parses a PR's pnpm-workspace.yaml with: the root's `yaml` devDependency, as the
 * operator installed it in the service clone (`pnpm install --frozen-lockfile --ignore-scripts --filter .`), resolved
 * from `codeDir`. Trusted because the clone is main's code and pnpm checked the package against main's lockfile
 * integrity; `yaml` is pure JavaScript with no dependency. Missing or not main's locked version is a host problem
 * (yamlProblem), never a skip.
 */
export const serviceYaml = (codeDir = CODE_DIR) =>
  createRequire(join(codeDir, "package.json"))("yaml");

/** The operator's command for the service clone's own dependencies (the runbook's, and every message's that needs it). */
export const SERVICE_INSTALL = "pnpm install --frozen-lockfile --ignore-scripts --filter .";

/** Why the service cannot parse with main's `yaml` (missing, or not the version main's lockfile locks), or null. */
export function yamlProblem(codeDir = CODE_DIR) {
  let installed;
  try {
    const manifest = createRequire(join(codeDir, "package.json")).resolve("yaml/package.json");
    installed = JSON.parse(readFileSync(manifest, "utf8")).version;
  } catch {
    return `the service clone has no \`yaml\` installed: run \`${SERVICE_INSTALL}\` in ${codeDir}`;
  }
  let locked;
  try {
    const graph = lockfileGraph(readFileSync(join(codeDir, "pnpm-lock.yaml"), "utf8"));
    locked =
      graph.importers["."]?.devDependencies?.yaml ?? graph.importers["."]?.dependencies?.yaml;
  } catch {
    locked = null;
  }
  if (!locked) return `the service clone's pnpm-lock.yaml locks no \`yaml\` for the root`;
  if (locked !== installed)
    return `the service clone has yaml ${installed} installed, main locks ${locked}: run \`${SERVICE_INSTALL}\` in ${codeDir}`;
  return null;
}

/** A value as one comparable string, keys sorted at every level. */
const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );

/** The keys of pnpm-workspace.yaml that are the PR's to change: what it installs. Everything else is main's. */
export const WORKSPACE_TESTED_KEYS = Object.freeze([
  "packages",
  "catalog",
  "catalogs",
  "overrides",
]);

/**
 * The tested pnpm-workspace.yaml (CTO ruling, round 4, HIGH-2): main's text, with only the PR's `packages`,
 * `catalog`, `catalogs` and `overrides` sections spliced in. The PR's copy is parsed with the real `yaml` library and
 * refused on any parse error or warning, any anchor, alias, explicit tag or merge key, and any other top-level key it
 * adds, removes or changes (pnpm 12 reads settings such as `scriptShell` and `pnpmfile` from this file for every
 * command), each named. The splice is by text: each top-level key's lines run to the next column-0 key, main's for
 * every other section and the PR's for the four. The result is then parsed again, and must equal the PR's four values
 * and main's everything else, and pass the fail-closed line reader (`reader`, workspaceManifest); anything else is a
 * problem, never a guess. Returns `{ text, value, problems }`.
 */
export function spliceWorkspace(mainText, prText, yaml, reader = workspaceManifest) {
  const problems = [];
  const parse = (text, who) => {
    const doc = yaml.parseDocument(text, { uniqueKeys: true, prettyErrors: false });
    for (const e of [...doc.errors, ...doc.warnings])
      problems.push(`${who} pnpm-workspace.yaml does not parse: ${e.message.split("\n")[0]}`);
    return doc;
  };
  const prDoc = parse(prText, "the PR's");
  const mainDoc = parse(mainText, "main's");
  yaml.visit(prDoc, {
    Alias: () => {
      problems.push("the PR's pnpm-workspace.yaml uses an alias");
    },
    Node: (_, node) => {
      if (node.anchor)
        problems.push(`the PR's pnpm-workspace.yaml uses an anchor (&${node.anchor})`);
      if (node.tag) problems.push(`the PR's pnpm-workspace.yaml uses a tag (${node.tag})`);
    },
    Pair: (_, pair) => {
      if (yaml.isScalar(pair.key) && pair.key.value === "<<")
        problems.push("the PR's pnpm-workspace.yaml uses a merge key (<<)");
    },
  });
  if (problems.length) return { text: null, value: null, problems };
  const pr = prDoc.toJS() ?? {};
  const main = mainDoc.toJS() ?? {};
  if (!yaml.isMap(prDoc.contents) || typeof pr !== "object" || Array.isArray(pr))
    return { text: null, value: null, problems: ["the PR's pnpm-workspace.yaml is not a mapping"] };
  for (const key of new Set([...Object.keys(pr), ...Object.keys(main)]))
    if (!WORKSPACE_TESTED_KEYS.includes(key) && canonical(pr[key]) !== canonical(main[key]))
      problems.push(`the PR changes pnpm-workspace.yaml \`${key}\`, which only main may set`);
  if (problems.length) return { text: null, value: null, problems };
  const sections = (text) => {
    const out = [{ key: null, lines: [] }];
    for (const line of text.split("\n")) {
      const m = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[A-Za-z_$@][\w$@.-]*)\s*:(?:\s|$)/.exec(line);
      if (m) out.push({ key: yaml.parse(m[1]), lines: [line] });
      else out.at(-1).lines.push(line);
    }
    return out;
  };
  const prSections = new Map(
    sections(prText)
      .filter((x) => x.key !== null)
      .map((x) => [x.key, x]),
  );
  const spliced = [];
  const done = new Set();
  for (const section of sections(mainText)) {
    if (!WORKSPACE_TESTED_KEYS.includes(section.key)) spliced.push(...section.lines);
    else if (prSections.has(section.key)) spliced.push(...prSections.get(section.key).lines);
    done.add(section.key);
  }
  for (const key of WORKSPACE_TESTED_KEYS)
    if (!done.has(key) && prSections.has(key)) {
      if (spliced.at(-1) !== "") spliced.push("");
      spliced.push(...prSections.get(key).lines);
    }
  const text = spliced.join("\n");
  const check = yaml.parseDocument(text, { uniqueKeys: true });
  const value = check.errors.length ? null : (check.toJS() ?? {});
  const expected = Object.fromEntries([
    ...Object.entries(main).filter(([key]) => !WORKSPACE_TESTED_KEYS.includes(key)),
    ...Object.entries(pr).filter(([key]) => WORKSPACE_TESTED_KEYS.includes(key)),
  ]);
  if (!value || canonical(value) !== canonical(expected))
    problems.push(
      "the PR's pnpm-workspace.yaml sections cannot be spliced into main's file as written",
    );
  else problems.push(...reader(text).problems);
  return { text, value, problems };
}

/** A version, a semver range or a dist-tag: what a registry resolves (no protocol, no path). */
const registryRange = (range) =>
  typeof range === "string" && /^[\w.^~<>=*|+ -]*$/.test(range) && !/^[.~]?\//.test(range);
/** The package an override's selector (`a@1>b@2`) targets. */
const overrideTarget = (selector) =>
  String(selector)
    .split(">")
    .at(-1)
    .replace(/(?<=.)@[^@]*$/, "");

/**
 * The dependency specs that must resolve from the registry (CTO ruling, round 4, 2a and 2b), as problems: every spec
 * in the workspace's `catalog`, `catalogs` and `overrides` and in each manifest's dependencies, devDependencies,
 * optionalDependencies and peerDependencies. A spec is a semver range, a version or a dist-tag, a `catalog:`
 * reference, or an `npm:<name>@<range>` alias; `workspace:` only between members (`memberNames`). `link:`, `file:`,
 * `portal:`, git, GitHub and http(s) tarball specs, and paths, are refused. An alias that renames a gate-tool package
 * (GATE_TOOL_PACKAGES) to another registry name is refused too: it would swap the gate's runner for a stub. An
 * override may also be `-` (removal) or a `$name` reference.
 */
export function dependencySpecProblems({
  workspace = {},
  manifests = [],
  memberNames = new Set(),
}) {
  const problems = [];
  const check = (where, key, spec, { workspaceOk = false, override = false } = {}) => {
    const bad = (why) => problems.push(`${where}: ${key} ${JSON.stringify(spec)} ${why}`);
    if (typeof spec !== "string") return bad("is not a version spec");
    if (override && (spec === "-" || /^\$[@\w./-]+$/.test(spec))) return;
    if (/^catalog:[\w.-]*$/.test(spec)) return;
    if (spec.startsWith("workspace:"))
      return workspaceOk
        ? undefined
        : bad("is a workspace: spec for a package that is not a member");
    if (spec.startsWith("npm:")) {
      const target = aliasTarget(spec);
      const range = target ? spec.slice(`npm:${target}`.length).replace(/^@/, "") : null;
      if (!target || !registryRange(range)) return bad("is not a registry alias");
      if (isGateToolPackage(key) && target !== key)
        return bad(`renames the gate tool ${key} to ${target}`);
      return;
    }
    if (!registryRange(spec))
      bad("is not a registry spec (link:, file:, portal:, git, http and paths are refused)");
  };
  for (const [key, spec] of Object.entries(workspace.catalog ?? {}))
    check("pnpm-workspace.yaml catalog", key, spec);
  for (const [name, entries] of Object.entries(workspace.catalogs ?? {}))
    for (const [key, spec] of Object.entries(entries ?? {}))
      check(`pnpm-workspace.yaml catalogs.${name}`, key, spec);
  for (const [selector, spec] of Object.entries(workspace.overrides ?? {}))
    check("pnpm-workspace.yaml overrides", overrideTarget(selector), spec, { override: true });
  for (const { path, json } of manifests) {
    for (const kind of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ])
      for (const [key, spec] of Object.entries(json?.[kind] ?? {}))
        check(`${path} ${kind}`, key, spec, { workspaceOk: memberNames.has(key) });
    for (const [selector, spec] of Object.entries(json?.pnpm?.overrides ?? {}))
      check(`${path} pnpm.overrides`, overrideTarget(selector), spec, { override: true });
  }
  return problems;
}

/**
 * What the shared gate steps (one process over every member) must not run from the PR (CTO ruling, round 5, C1):
 * each tested-tree file matching SHARED_STEP_LOADERS that is not main's copy. `paths` are all of them (set aside for
 * the step), `main` those main has (main's copy laid in for the step). A new member's own config modules, kept in the
 * tested tree by ruling 3 for its per-package steps, are among them.
 */
export function sharedStepSwaps(testedEntries, mainEntries) {
  const main = new Map(mainEntries.map((e) => [e.path, e.object]));
  const paths = testedEntries
    .filter((e) => SHARED_STEP_LOADERS.test(e.path) && main.get(e.path) !== e.object)
    .map((e) => e.path)
    .toSorted();
  return { paths, main: paths.filter((p) => main.has(p)) };
}

/** The directory a definition file configures: its own, or for a file under `.config/`, the one holding `.config`. */
export function definitionDirectory(path) {
  const config = /^(?:(.*)\/)?\.config\//.exec(path);
  if (config) return config[1] ?? "";
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

/**
 * What the tested tree takes from main: `whole`, main's entry of every verify-definition file (isVerifyOverlay);
 * `remove`, every merged path that is a verify definition main does not have, at the root or in a directory main
 * already has (a PR-added `.commitlintrc.json` or `knip.json` that a tool would find before main's config), and every
 * new file under VERIFY_OVERLAY_DIRS; `scripts`, the package.json files whose checks come from main (OVERLAY_FIELDS).
 * A definition file inside a directory main does not have at all (a new workspace member's own vitest.config) stays,
 * so the new member runs with it; it reaches only that directory, and it still needs the owner's review (CTO ruling,
 * round 4). A `.config/` directory belongs to the directory that holds it.
 */
export function overlayPlan(mergedPaths, mainEntries) {
  const main = new Map(mainEntries.map((e) => [e.path, e]));
  const whole = [...main.values()].filter((e) => isVerifyOverlay(e.path));
  const dirs = new Set([""]);
  for (const path of main.keys()) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"));
  }
  const remove = mergedPaths.filter(
    (p) =>
      isVerifyOverlay(p) &&
      !main.has(p) &&
      (VERIFY_OVERLAY_DIRS.test(p) || dirs.has(definitionDirectory(p))),
  );
  const scripts = mergedPaths.filter(
    (p) => /(?:^|\/)package\.json$/.test(p) && main.has(p) && !isVerifyOverlay(p),
  );
  return { whole, remove, scripts };
}

/** The container's own exit code from `docker inspect --format '{{.State.StartedAt}} {{.State.ExitCode}}'`; null when it never started. */
export function exitFromInspect(code, stdout) {
  if (code !== 0) return null;
  const [startedAt, exit] = String(stdout).trim().split(" ");
  if (!startedAt || startedAt.startsWith("0001-") || !/^-?\d+$/.test(exit ?? "")) return null;
  return Number(exit);
}

/** Every docker command of the clean-up after a run, in order (`allIds`: every image id there is). */
export function cleanupPlan({ names, images, leftover, allIds, keep }) {
  const plan = [["rm", "-f", "-v", ...names]];
  if (images.length) plan.push(["rmi", "-f", ...images]);
  if (leftover.length) plan.push(["rm", "-f", "-v", ...leftover]);
  plan.push(["volume", "prune", "-af"], ["network", "prune", "-f"]);
  const remove = imagesToRemove(allIds, keep);
  if (remove.length) plan.push(["rmi", "-f", ...remove]);
  plan.push(["builder", "prune", "-af"]);
  return plan;
}

/** How old a store image may get before it is rebuilt from scratch on the current base. */
export const STORE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Whether the recorded store image may be used: same id as recorded, and young enough. Anything else rebuilds. */
export const storeReusable = ({ recordedId, currentId, builtAt }, now = Date.now()) =>
  Boolean(recordedId) && currentId === recordedId && now - (builtAt ?? 0) < STORE_MAX_AGE_MS;

/** At most this many licensed package versions are built for one tested tree. */
export const MAX_LICENSED_PER_TREE = 3;

/**
 * The licensed packages a tested tree needs: each licensed build main allows, at every version the tree's lockfile
 * locks, with its integrity. More than MAX_LICENSED_PER_TREE is refused (a service error, never built).
 */
export function licensedPackagesFor(lockText, builds) {
  const packages = LICENSED_BUILDS.filter((name) => builds.includes(name)).flatMap((name) =>
    lockedPackages(lockText, name),
  );
  if (packages.length > MAX_LICENSED_PER_TREE)
    throw new Error(
      `the tree locks ${packages.length} licensed builds; at most ${MAX_LICENSED_PER_TREE} are built`,
    );
  return packages;
}

/** The BuildKit secret: the token on its first line, then its base64 cores, which the in-build scan searches for. */
export const licenceSecret = (token) => [token, ...secretPatterns(token).slice(1)].join("\n");

/**
 * The licensed images worth keeping: those built on the current store image and younger than STORE_MAX_AGE_MS. The
 * rest would pin old store layers forever, so they leave the record (and the clean-up then removes them).
 */
export const pruneLicensed = (licensed, storeId, now = Date.now()) =>
  Object.fromEntries(
    Object.entries(licensed).filter(
      ([, entry]) => entry?.storeId === storeId && now - (entry.builtAt ?? 0) < STORE_MAX_AGE_MS,
    ),
  );

/** The image ids a clean-up keeps: the base, and every store and licensed image the daemon recorded. */
export const keepIdsFrom = (state, baseId) =>
  [
    ...[...Object.values(state.stores ?? {}), ...Object.values(state.licensed ?? {})].map(
      (entry) => entry?.id ?? entry,
    ),
    baseId,
  ].filter(Boolean);

/** The key and licence files' modes as hostProblems reads them: null when missing, unreadable or not ours. */
export function secretModes(s, stat, uid) {
  const modeOf = (path) => {
    try {
      return ownedMode(stat(path), uid);
    } catch {
      return null;
    }
  };
  return {
    keyMode: s.keyFile ? modeOf(s.keyFile) : null,
    licenceMode: s.licenceFile ? modeOf(s.licenceFile) : 0o400,
  };
}

/** A secret file's mode bits when this process owns it; null otherwise (someone else's file could be swapped). */
export const ownedMode = (stat, uid) => (stat && stat.uid === uid ? stat.mode & 0o777 : null);

/**
 * What the service does with a run's result: `stop` when the host proved unsafe (nothing more runs), `skip` when
 * nothing is recorded (a stop or a moved head), `error` for an infrastructure error, `post` for a result.
 */
/** The stop on an unsafe host: stops the service, posts nothing and counts nothing against the PR. */
export function stopIfUnsafe(result, stop) {
  if (outcome(result) !== "stop") return;
  stop();
  throw new Error(`stopping: ${result.error}; seal the install network (box runbook) and restart`);
}

export function outcome(result) {
  if (result.unsafe) return "stop";
  if (result.stopped || result.moved) return "skip";
  if (!result.post) return "error";
  return "post";
}

/** Every image id to remove after a run: all of them but the pinned base and the current store. */
export const imagesToRemove = (ids, keep) => [...new Set(ids)].filter((id) => !keep.includes(id));

/** The verify App's completed `stackra/verify` run for `sha`, or undefined (our own App only, by id). */
export const recordedRun = (checkRuns, sha, appId, base, name = VERIFY_CHECK) =>
  checkRuns.find(
    (r) =>
      r.name === name &&
      r.head_sha === sha &&
      String(r.app?.id) === String(appId) &&
      r.status === "completed" &&
      (!base || r.external_id === `base:${base}`),
  );

/**
 * Whether a head needs a verify. A completed run from this App against the current main (`base`) stands until the
 * head or main moves; pr-merge refuses a run against an older main. Otherwise the local error record decides: no
 * error yet, or the last one older than ERROR_RETRY_MS while fewer than MAX_ERROR_ATTEMPTS.
 */
export function needsRun(
  { checkRuns, sha, appId, base, errors = { count: 0 }, name = VERIFY_CHECK },
  now = Date.now(),
) {
  if (recordedRun(checkRuns, sha, appId, base, name)) return false;
  // A run against an older main stands while it is fresh: re-verifying every PR on every main merge, one verify at a
  // time, would never finish. The merge queue's own commit verify is the gate that sees the latest main.
  const fresh = recordedRun(checkRuns, sha, appId, undefined, name);
  if (fresh && isFresh(fresh.completed_at, now)) return false;
  if (errors.count === 0) return true;
  return errors.count < MAX_ERROR_ATTEMPTS && now - errors.at > ERROR_RETRY_MS;
}

/** Terminal colour codes, built from the ESC code point so the source holds none. */
const ANSI = new RegExp(`${String.fromCodePoint(27)}\\[[0-9;?]*[A-Za-z]`, "g");
/** Control characters but tab and newline, built from code points for the same reason. */
const CONTROL = new RegExp(
  `[${String.fromCodePoint(0)}-${String.fromCodePoint(8)}${String.fromCodePoint(11)}-${String.fromCodePoint(31)}${String.fromCodePoint(127)}]`,
  "g",
);
const SECRET_SHAPES = [
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  /\bA(?:KIA|SIA)[0-9A-Z]{16}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bnpm_[A-Za-z0-9]{36}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\bAGE-SECRET-KEY-1[0-9A-Z]{50,}\b/g,
];
/**
 * The byte patterns that give a secret away in data: the value, and the stable core of its base64 at each of the three
 * alignments it can start at inside a longer base64 run (standard and URL-safe alphabets). Used for the scans, where
 * the token may sit anywhere in a file.
 */
export function secretPatterns(value) {
  const v = Buffer.from(String(value));
  const out = new Set([v.toString("utf8")]);
  for (let k = 0; k < 3; k++) {
    const b64 = Buffer.concat([Buffer.alloc(k), v]).toString("base64");
    const start = Math.ceil((k * 4) / 3);
    const end = Math.floor(((k + v.length) * 4) / 3) - ((k + v.length) % 3 ? 1 : 0);
    const core = b64.slice(start, Math.max(start, end));
    if (core.length >= 8) {
      out.add(core);
      out.add(core.replaceAll("+", "-").replaceAll("/", "_"));
    }
  }
  return [...out];
}

/** Secret values this process holds (the licence token), in every encoding a tool may print them. */
const SECRET_VALUES = new Set();
/** Registers a secret so `scrub` removes it (plain, base64, base64url and URL-encoded) from every output path. */
export function registerSecret(value) {
  const v = String(value ?? "").trim();
  if (v.length < 8) return;
  const percent = encodeURIComponent(v);
  for (const form of [
    v,
    Buffer.from(v).toString("base64"),
    Buffer.from(v).toString("base64").replace(/=+$/, ""),
    Buffer.from(v).toString("base64url"),
    percent,
    percent.replaceAll(/%[0-9A-F]{2}/g, (m) => m.toLowerCase()),
    new URLSearchParams({ v }).toString().slice(2),
    ...secretPatterns(v),
  ])
    if (form.length >= 8) SECRET_VALUES.add(form);
}

/** Display hygiene for every output path: no colour or control codes, no registered secret, no token or key shape. */
export function scrub(text) {
  let out = String(text).replaceAll(ANSI, "").replaceAll("\r", "").replaceAll(CONTROL, "");
  for (const secret of [...SECRET_VALUES].toSorted((a, b) => b.length - a.length))
    out = out.replaceAll(secret, "[redacted]");
  for (const shape of SECRET_SHAPES) out = out.replaceAll(shape, "[redacted]");
  return out.replaceAll(
    /(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/g,
    "$1 [redacted] $2",
  );
}

/**
 * The last part of a log, scrubbed, made inert for Markdown (no backticks to break the fence, no @mention), and cut to
 * `max` characters on a line boundary. Links inside the fence render as text.
 */
export function logTail(log, max = OUTPUT_TEXT_MAX) {
  const clean = scrub(log).replaceAll("`", "'").replaceAll("@", "@\u200b");
  if (clean.length <= max) return clean;
  const cut = clean.slice(-max);
  return `…\n${cut.slice(cut.indexOf("\n") + 1)}`;
}

export const formatDuration = (ms) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};

/** A fenced, scrubbed, inert tail of `text` in at most `budget` characters. */
const fence = (text, budget) => `\`\`\`text\n${logTail(text, Math.max(0, budget))}\n\`\`\``;

/**
 * The check run's text: a table of the steps the log names and, for each that failed or never finished, the end of
 * its own output, then the end of the whole log, all within `max`. Display only: the table comes from the log, which
 * a PR can write to, so it never decides anything. A log without steps is one fenced tail, as before.
 */
export function outputText(log, max = OUTPUT_TEXT_MAX) {
  const sections = stepSections(scrub(log));
  if (!sections.length) return fence(log, max - 20);
  const table = [
    "### Steps (from the log, display only)",
    "",
    "| step | result |",
    "| --- | --- |",
    ...sections.map((x) => `| ${x.id} | ${x.result === "FAIL" ? "**FAIL**" : x.result} |`),
    "",
  ].join("\n");
  const failing = sections.filter((x) => x.result === "FAIL" || x.result === "unfinished");
  const parts = [table];
  let left = max - table.length - 400;
  const each = failing.length ? Math.floor((left * 0.7) / failing.length) - 80 : 0;
  for (const section of failing) {
    const part = `### ${section.id} (${section.result})\n\n${fence(section.lines.join("\n"), each)}\n`;
    parts.push(part);
    left -= part.length;
  }
  if (left > 200) parts.push(`### Log tail\n\n${fence(log, left - 40)}`);
  const text = parts.join("\n");
  return text.length <= max ? text : fence(log, max - 20);
}

/**
 * The check run body. The verdict and the title come only from the result (`conclusion`, `phase`, `reason`); the
 * log is shown, never read for a verdict. It carries no environment and no secret. `kind` names the check run.
 */
export function checkRunBody({
  kind = "gate",
  sha,
  base,
  conclusion,
  phase,
  reason,
  durationMs,
  box,
  log,
  startedAt,
  completedAt,
}) {
  const { check, label, describe } = KINDS[kind];
  const verdict =
    conclusion === "success"
      ? `${label} passed`
      : conclusion === "neutral"
        ? `could not run (${reason})`
        : phase === "merge"
          ? "the PR conflicts with main"
          : phase === "tree"
            ? `the PR's tree is refused (${String(reason ?? "")
                .replace(/^the tested tree is refused: /, "")
                .slice(0, 160)})`
            : phase === "install"
              ? reason === "time limit"
                ? "pnpm install hit the time limit"
                : "pnpm install failed"
              : phase === "licence"
                ? `the licensed build is unavailable (${reason ?? "see the service log"})`
                : reason === "time limit"
                  ? `${label} hit the time limit`
                  : `${label} failed`;
  const failed = stepSections(scrub(log ?? ""))
    .filter((x) => x.result === "FAIL" || x.result === "unfinished")
    .map((x) => x.id);
  return {
    name: check,
    head_sha: sha,
    external_id: base ? `base:${base}` : undefined,
    status: "completed",
    conclusion,
    started_at: startedAt,
    completed_at: completedAt,
    output: {
      title: `${verdict} in ${formatDuration(durationMs)}`,
      summary: [
        `- Checks: ${describe}; every step runs, and the verdict is the container's exit code`,
        KINDS[kind].install
          ? `- Install: \`${INSTALL_COMMAND}\`${KINDS[kind].install === "gate" ? ` without ${GATE_FILTERS.map((f) => f.slice(1)).join(" and ")}` : ""} (registries only), then \`${kindCommand(kind)}\` (no network)`
          : `- Run: \`${kindCommand(kind)}\` on the tested tree (no install, no network)`,
        `- Box: ${box}; throwaway containers`,
        ...(conclusion === "neutral" || phase === "tree"
          ? [`- Reason: ${reason ?? "unknown"}`]
          : []),
        `- Head: \`${sha}\`, merged onto main \`${base ?? "-"}\` with main's verify definition (scripts, configs, policies)`,
        ...(failed.length ? [`- Failed steps (from the log): ${failed.join(", ")}`] : []),
      ].join("\n"),
      text: outputText(log ?? ""),
    },
  };
}

/** One ledger entry: JSON (the machine copy) and a markdown row (the human copy). */
export function ledgerEntry({
  kind = "gate",
  repo,
  sha,
  pr,
  conclusion,
  phase,
  reason,
  durationMs,
  box,
  at,
  link,
  posted,
}) {
  const json = {
    at,
    repo,
    sha,
    pr: pr ? Number(pr) : null,
    check: KINDS[kind].check,
    install: INSTALL_COMMAND,
    command: kindCommand(kind),
    conclusion,
    phase: phase ?? null,
    reason: reason ?? null,
    durationMs,
    box,
    link: link ?? null,
    posted,
  };
  const result = `${KINDS[kind].check}: ${conclusion ?? "error"}${reason ? ` (${reason})` : ""}${posted ? "" : ", not posted"}`;
  const md = `| ${at} | ${repo} | ${pr ? `#${pr}` : "main"} | \`${sha.slice(0, 12)}\` | ${result} | ${formatDuration(durationMs)} | ${link ?? "-"} |`;
  return { json, md };
}

export const LEDGER_HEADER =
  "| at | repo | PR | SHA | result | duration | check run |\n| --- | --- | --- | --- | --- | --- | --- |";

// ---- the job --------------------------------------------------------------------------------------------------

/**
 * Runs one verify of `job` ({ repo, sha, pr, kind }) with the side effects in `deps`, and returns what to record:
 *   { post: false, error, stopped } — an infrastructure error or a stop: nothing is posted;
 *   { post: false, moved: true }     — the PR's head moved during the run: nothing is posted, it runs again;
 *   { post: true, conclusion, phase, reason, log } — a result the container's exit code decided.
 * `deps`: archive(job) → tarPath; storeImage(job) → image; docker(args) → { code, stdout } (sync, as the verify
 * user); runContainer(args, name) → Promise<{ code }> (the docker client's exit); exitCodeOf(name) → number or null
 * (the container's own exit code; null when it never started); kill(name); cleanUp(names, images); headOf(job) →
 * current head SHA or null (main: the job's own SHA); readLog() → string; stopping() → boolean; timeoutMs;
 * setTimer(fn, ms) → cancel; optional: facts(job) → false when the PR's head moved (the gate's PR facts);
 * verifyMounts() → the kind's read-only inputs. `job.kind` (KINDS, default gate) picks the install and the command: a
 * storeImage error marked `licence` (the mobile kind's licensed build) is that check's failure, never an error of
 * another check.
 */
export async function runJob(job, deps) {
  const kind = job.kind ?? "gate";
  if (!KINDS[kind]) throw new Error(`not a verify kind: ${kind}`);
  const id = `${job.sha.slice(0, 12)}-${Date.now().toString(36)}`;
  const install = `sv-${id}-install`;
  const check = `sv-${id}-verify`;
  const runImage = `stackra-verify-run:${id}`;
  const proxyName = `sv-${id}-proxy`;
  const network = `sv-net-${id}`;
  const names = [install, check, proxyName];
  const s = deps.settings;
  // One time limit for the whole run, shared by every phase.
  const deadline = deps.now() + deps.timeoutMs;
  /** Runs a container under what is left of the time limit; `timedOut` says the limit killed it. */
  const limited = async (args, name) => {
    let timedOut = false;
    const cancel = deps.setTimer(
      () => {
        timedOut = true;
        deps.kill(name);
      },
      Math.max(0, deadline - deps.now()),
    );
    await deps.runContainer(args, name);
    cancel();
    return timedOut;
  };
  try {
    let tarPath;
    try {
      tarPath = deps.archive(job);
    } catch (error) {
      if (error.conflict)
        return settle(job, deps, {
          conclusion: "failure",
          phase: "merge",
          reason: "conflicts with main",
        });
      // A path or setting the tested tree may not carry: the PR's failure, each problem named (buildTree).
      if (error.refused)
        return settle(job, deps, { conclusion: "failure", phase: "tree", reason: error.message });
      // The service is not main's definition: it cannot vouch for this head either way (LOW 6).
      if (error.drift)
        return settle(job, deps, {
          conclusion: "neutral",
          phase: "definition",
          reason: error.message,
        });
      throw error;
    }
    if (deps.facts && (await deps.facts(job)) === false) return { post: false, moved: true };
    let store;
    try {
      store = await deps.storeImage(job);
    } catch (error) {
      if (!error.licence) throw error;
      return settle(job, deps, {
        conclusion: "failure",
        phase: "licence",
        reason: String(error.message).slice(0, 120),
      });
    }
    const envFile = deps.envFile;
    // The gate installs without the Uniwind Pro members and never lays in a licensed build; mobile installs all;
    // CodeQL installs nothing and reads the tree only.
    const gate = KINDS[kind].install === "gate";
    let image = store;
    if (KINDS[kind].install) {
      const builds = deps.builds();

      const net = await deps.network({ id, image: store, proxyName, network });
      const leaks = deps.egressLeaks(store, net);
      if (leaks === null || leaks.length) {
        // Unsafe host: no PR code runs, and the service stops before anything else does.
        deps.stop();
        return {
          post: false,
          error:
            leaks === null
              ? "the egress probe did not run"
              : `the install network reaches ${leaks.join(" ")}`,
          unsafe: true,
        };
      }

      const installTimedOut = await limited(
        installArgs(s, {
          name: install,
          image: store,
          tarPath,
          envFile: deps.installEnvFile,
          network: net.network,
          builds: gate ? builds.filter((b) => !LICENSED_BUILDS.includes(b)) : builds,
          licensed: gate ? [] : LICENSED_BUILDS,
          filters: gate ? GATE_FILTERS : [],
        }),
        install,
      );
      if (deps.stopping() && !installTimedOut) return { post: false, stopped: true };
      if (installTimedOut)
        return settle(job, deps, { conclusion: "failure", phase: "install", reason: "time limit" });
      const installExit = deps.exitCodeOf(install);
      if (installExit === null)
        return { post: false, error: "the install container did not start" };
      // The licensed image is built for exactly the versions this tree locks, so a missing build is the service's
      // fault: an error (retried), never the PR's pass, fail or neutral.
      if (installExit === NEEDS_STORE_REBUILD_EXIT)
        return { post: false, error: "a licensed build is missing from the run image" };
      if (installExit !== 0) return settle(job, deps, { conclusion: "failure", phase: "install" });

      const commit = deps.docker(["commit", install, runImage]);
      if (commit.code !== 0)
        return { post: false, error: "could not commit the install container" };
      image = runImage;
    }

    const verifyTimedOut = await limited(
      verifyArgs(s, {
        name: check,
        image,
        envFile,
        tarPath,
        mounts: deps.verifyMounts?.() ?? [],
        command: kindCommand(kind),
        prepare: gate ? gatePrepare() : VERIFY_PREPARE,
      }),
      check,
    );
    if (deps.stopping() && !verifyTimedOut) return { post: false, stopped: true };
    if (verifyTimedOut)
      return settle(job, deps, { conclusion: "failure", phase: "verify", reason: "time limit" });
    const verifyExit = deps.exitCodeOf(check);
    if (verifyExit === null) return { post: false, error: "the verify container did not start" };
    return settle(job, deps, {
      conclusion: verifyExit === 0 ? "success" : "failure",
      phase: "verify",
    });
  } catch (error) {
    return { post: false, error: error.message };
  } finally {
    deps.cleanUp(names, [runImage], [network]);
  }
}

/** The SHA binding: a PR result is posted only while the PR's head is still the SHA that ran. */
// ---- self-update: the service follows main (CTO ruling, round 4 of #1043, option a) -------------------------------

/** The exit code of a locked service that asks its lock holder to start it again, on the code a self-update laid in. */
export const RESTART_EXIT = 76;
/** The service's own code, as a path in its clone. */
export const SELF_PATH = "tools/scripts/stackra-verify.mjs";
/** The clone the service runs from: this file's repository, owned by the service user. */
export const CODE_DIR = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
/**
 * Every file the service loads, as paths in its clone: this module, the modules it imports (a test keeps the list
 * complete by following the relative imports) and the OSV canary's lockfile. A difference from main in any of them
 * is a definition drift, and any of them moving on main starts a self-update (review of #1043, LOW-2).
 */
export const SERVICE_FILES = Object.freeze([
  SELF_PATH,
  "tools/scripts/pr-merge.mjs",
  "tools/scripts/bot-token.mjs",
  "tools/scripts/osv-canary.lock.yaml",
]);
/** The git blob id of `bytes` (SHA-1, as GitHub's repositories hash them). */
export const gitBlobId = (bytes) =>
  createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
/**
 * The blob ids of SERVICE_FILES as this process loaded them, taken once at module load (its imports are evaluated
 * before this line), so a later change on disk, a self-update's fast-forward included, never passes for the running
 * code (review of #1043, LOW-1).
 */
export const LOADED_BLOBS = Object.freeze(
  Object.fromEntries(SERVICE_FILES.map((f) => [f, gitBlobId(readFileSync(join(CODE_DIR, f)))])),
);

/**
 * The tests a new version's self-check runs before the service switches to it, by name: what every run depends on
 * and runs in seconds with no network or Docker. Argument parsing, the settings and the preflight; the gate's and the
 * mobile check's scripts, every step's commands and their mirror of main's ci.yml; the licence policy, both readers
 * and the generated check; the tested tree's overlay (buildTree on throwaway repositories); the run's verdict, check
 * run body, ledger and this self-update. Left out: the proxy and egress probe (sockets and timing), the store image,
 * the licensed build and CodeQL (image scripts), and anything that needs node_modules (the staged tree has none, so
 * those skip anyway).
 */
export const SELF_CHECK_TESTS =
  /^(?:parseArgs|hostProblems|preflight|servicePass|settings|spdxAllowed|licence |lockfileGraph|workspaceManifest|memberSetProblems|pnpmFindings|closureViolations|installedMobile|withMainScripts|buildTree|gate script|gate step|gate mirrors|mobile script|kinds|checkRunBody|ledger|runJob|definitionDrift|self-update|OSV canary)/;

/**
 * What a self-update does between passes: `none` (the service is main's code), `refuse` with the reason (a job is
 * running, the clone has local changes, or main is not a fast-forward of the clone's HEAD), or `update`. `own` and
 * `main` map each of SERVICE_FILES to its blob id as loaded and on main; `dirty` is `git status --porcelain`.
 */
export function selfUpdatePlan({ busy, own, main, dirty = [], fastForward }) {
  if (busy)
    return { action: "refuse", reason: "a job is running; self-update waits for the next pass" };
  const files = Object.keys(own ?? {});
  if (files.length && files.every((f) => own[f] && own[f] === main?.[f])) return { action: "none" };
  const absent = files.filter((f) => !main?.[f]);
  if (!files.length || absent.length)
    return { action: "refuse", reason: `main has no ${absent.join(", ") || "service files"}` };
  if (dirty.length)
    return {
      action: "refuse",
      reason: `the service clone has local changes (${dirty.slice(0, 3).join(", ")}${dirty.length > 3 ? ", …" : ""})`,
    };
  if (!fastForward)
    return { action: "refuse", reason: "main is not a fast-forward of the service clone's HEAD" };
  return { action: "update" };
}

/** Why a self-check run (`{ status, stdout, stderr }`) does not clear the new code, or null when it passes. */
export function selfCheckProblem({ status, stdout = "", stderr = "" }) {
  if (status === 0) return null;
  const lines = `${stdout}\n${stderr}`
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // The first named problem (an operator command in it, such as SERVICE_INSTALL, survives), else the last line.
  const named = lines.find((l) => l.startsWith("- ")) ?? lines.at(-1);
  return `the new code's self-check failed (exit ${status ?? "none"})${named ? `: ${named.slice(0, 240)}` : ""}`;
}

/**
 * One self-update step, between passes only (`busy` says a job runs): fetch main (and only main) from `remote` into
 * the service clone, and when the running file's blob differs from main's, switch only by a fast-forward of a clean
 * clone, and only after the new code's own `self-check` passed in a staged copy of main's tree (under `home`, 0700,
 * removed after). Every switch and every refusal goes to `ledger` with the old blob, the new blob and main's commit;
 * a refusal leaves the old code running, so the next jobs post neutral naming the reason (definitionDrift). Returns
 * `{ action, reason?, main?, oldBlob?, newBlob? }`; `update` means the caller exits RESTART_EXIT to be started again.
 * `env` carries the App's read access for the fetch; `runSelfCheck(dir)` runs the staged code's self-check.
 */
export function selfUpdate({ clone, remote, home, busy, own, ledger, runSelfCheck, env = {} }) {
  const git = (args, options = {}) =>
    spawnSync(
      "git",
      ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-C", clone, ...args],
      spawnOptions({ env: { ...gitEnv(), ...env }, ...options }),
    );
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- reads like the git helper above it
  const out = (r) => (r.status === 0 ? r.stdout.trim() : null);
  const refuse = (reason, facts = {}) => {
    ledger({ event: "self-update-refused", reason, ...facts });
    return { action: "refuse", reason, ...facts };
  };
  if (busy) return refuse(selfUpdatePlan({ busy }).reason);
  const oldBlob = own;
  // Only main, into a remote-tracking ref: never a PR ref, never a tag, never the branch the clone has checked out.
  const fetched = git([
    "fetch",
    "--quiet",
    "--no-tags",
    remote,
    "+refs/heads/main:refs/remotes/origin/main",
  ]);
  if (fetched.status !== 0)
    return refuse(`could not fetch main: ${String(fetched.stderr).trim().slice(0, 160)}`, {
      oldBlob,
    });
  const main = out(git(["rev-parse", "--verify", "refs/remotes/origin/main^{commit}"]));
  const newBlob = Object.fromEntries(
    Object.keys(own).map((f) => [f, out(git(["rev-parse", "-q", "--verify", `${main}:${f}`]))]),
  );
  const facts = { oldBlob, newBlob, main };
  const status = git(["status", "--porcelain", "--untracked-files=all"]);
  const plan = selfUpdatePlan({
    own: oldBlob,
    main: newBlob,
    dirty: status.status === 0 ? status.stdout.split("\n").filter(Boolean) : ["git status failed"],
    fastForward: git(["merge-base", "--is-ancestor", "HEAD", main]).status === 0,
  });
  if (plan.action === "none") return { action: "none", ...facts };
  if (plan.action === "refuse") return refuse(plan.reason, facts);
  const stage = mkdtempSync(join(home, "self-check-"));
  let problem;
  try {
    chmodSync(stage, 0o700);
    const staged = spawnSync(
      "sh",
      [
        "-c",
        'git -c core.hooksPath=/dev/null -C "$1" archive "$2" | tar -x -C "$3"',
        "sh",
        clone,
        main,
        stage,
      ],
      spawnOptions({ env: gitEnv() }),
    );
    // The staged code resolves its one dependency (`yaml`) from the clone's install, as the service does.
    if (staged.status === 0 && existsSync(join(clone, "node_modules")))
      symlinkSync(join(clone, "node_modules"), join(stage, "node_modules"));
    problem =
      staged.status === 0
        ? selfCheckProblem(runSelfCheck(stage))
        : `could not stage main: ${String(staged.stderr).trim().slice(0, 160)}`;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
  if (problem) return refuse(problem, facts);
  const merged = git(["merge", "--ff-only", "--quiet", main]);
  if (merged.status !== 0)
    return refuse(`the fast-forward failed: ${String(merged.stderr).trim().slice(0, 160)}`, facts);
  ledger({ event: "self-update", ...facts });
  return { action: "update", ...facts };
}

/**
 * The new code's self-check (`stackra-verify.mjs self-check`, run from the staged tree): it parses (it runs at all),
 * the settings pass hostProblems, the preflight's filesystem half passes as a dry run, and SELF_CHECK_TESTS pass.
 * Returns the problems; none means the service may switch to this code.
 */
export function selfCheck({ s, keyMode, licenceMode, filesystem, runTests }) {
  const problems = [...hostProblems(s, keyMode, licenceMode), ...filesystem()];
  const r = runTests();
  if (r.status !== 0)
    problems.push(
      `the self-check tests failed (exit ${r.status ?? "none"}): ${
        String(r.stdout ?? "")
          .split("\n")
          .filter((l) => /^ℹ (?:pass|fail)|^✖ /.test(l))
          .slice(0, 4)
          .join("; ") || "no output"
      }`,
    );
  return problems;
}

/**
 * The argv of `sh` that takes the service's flock and keeps it across restarts (RESTART_EXIT): the shell holds the
 * lock on fd 9 for its whole life (`flock -n` exits LOCK_HELD_EXIT when another service holds it), runs `command`
 * with fd 9 closed (so no child of the service ever holds the lock), forwards TERM and INT to it as TERM, and starts
 * it again only on RESTART_EXIT, so a self-update never leaves the box without its one service or with two.
 */
export const lockedShell = (lockPath, command) => [
  "-c",
  [
    'lock=$1; shift; exec 9>"$lock"',
    `flock -n 9 || exit ${LOCK_HELD_EXIT}`,
    'pid=; trap \'[ -n "$pid" ] && kill -TERM "$pid" 2>/dev/null\' TERM INT',
    "while :; do",
    '  "$@" 9>&- & pid=$!',
    '  while :; do wait "$pid"; rc=$?; kill -0 "$pid" 2>/dev/null || break; done',
    `  [ "$rc" -eq ${RESTART_EXIT} ] || exit "$rc"`,
    "done",
  ].join("\n"),
  "stackra-verify",
  lockPath,
  ...command,
];

/**
 * Whether this service runs main's own definition: `own` is the git blob id of the running stackra-verify.mjs, `main`
 * the blob main has at the job's base (null when main has none). A difference is the reason the run cannot be
 * trusted, naming both ids; null when they match.
 */
export function definitionDrift(own, main, refused = null) {
  const files = Object.keys(own ?? {});
  const differ = files.filter((f) => !own[f] || own[f] !== main?.[f]);
  if (files.length && !differ.length) return null;
  const why = refused ? ` (self-update refused: ${String(refused).slice(0, 300)})` : "";
  const which = (differ.length ? differ : ["the service files"])
    .map(
      (f) =>
        `${f.replace(/^tools\/scripts\//, "")} blob ${own?.[f] ?? "unknown"}, main has ${main?.[f] ?? "none"}`,
    )
    .join("; ");
  return `this service runs ${which}: update the service${why}`;
}

async function settle(job, deps, result) {
  const head = await deps.headOf(job);
  if (head !== job.sha) return { post: false, moved: true };
  return { post: true, ...result, log: deps.readLog() };
}

// ---- side effects -------------------------------------------------------------------------------------------

/** Paths the verify user must not be able to read, besides the key file, the daemon's home and STACKRA_VERIFY_HOME. */
export const FORBIDDEN_DEFAULTS = [
  "/var/run/docker.sock",
  "/run/docker.sock",
  "/home/build/.claude",
  "/home/build/.config/sops",
  "/home/build/.ssh",
];

/**
 * The host checks that need the machine: the verify user can read none of the forbidden paths, its user slice has
 * cgroup caps (CPU, memory, tasks), and its Docker is rootless. Each problem is a reason not to start.
 */
/**
 * Why the verify user's subordinate uid range (`/etc/subuid`, `name:start:count`) is unsafe, or null: it must exist,
 * and overlap no other user's range, or a container's root could own another user's files.
 */
export function subuidOverlap(text, user) {
  const ranges = text
    .split("\n")
    .map((l) => l.trim().split(":"))
    .filter((p) => p.length === 3 && /^\d+$/.test(p[1]) && /^\d+$/.test(p[2]))
    .map(([name, start, count]) => ({
      name,
      start: Number(start),
      end: Number(start) + Number(count),
    }));
  const own = ranges.filter((r) => r.name === user);
  if (!own.length) return `the verify user ${user} has no /etc/subuid range`;
  for (const mine of own)
    for (const other of ranges.filter((r) => r.name !== user))
      if (mine.start < other.end && other.start < mine.end)
        return `the verify user's /etc/subuid range overlaps ${other.name}'s`;
  return null;
}

/**
 * The filesystem half of the preflight, run at start and again before every pass (a new problem stops the service
 * the same way): the forbidden and named paths, each protected root and its entries (reading or traversing a
 * non-allowlisted entry is reaching it), non-empty root and allow lists, and a positive control: the verify user must
 * read `<home>/docker.env` (0644 under the 0711 home), or a broken sudo would make every path look unreadable.
 */
export function filesystemProblems(s, io, extraForbidden = []) {
  const problems = [];
  const control = join(s.home, "docker.env");
  if (!io.exists(control) || !io.canRead(control))
    problems.push(
      `the verify user ${s.runAs} cannot read ${control}, which it must: the readability checks would prove nothing (check sudo -u ${s.runAs})`,
    );
  // Named by the settings or the operator: each must exist, or its check would pass without proving anything.
  const named = [s.keyFile, s.licenceFile, s.home, ...extraForbidden].filter(Boolean);
  for (const path of named)
    if (!io.exists(path))
      problems.push(`${path} is named as unreadable but does not exist, so nothing proves it`);
    else if (io.canRead(path)) problems.push(`the verify user ${s.runAs} can read ${path}`);
  // Generic defaults (sockets, the build user's secrets) that a host may not have.
  for (const path of FORBIDDEN_DEFAULTS)
    if (io.exists(path) && io.canRead(path))
      problems.push(`the verify user ${s.runAs} can read ${path}`);
  // The code clone self-update fast-forwards: the service's own, and never the verify user's to change.
  if (s.codeDir && io.ownedByService && !io.ownedByService(s.codeDir))
    problems.push(`the service's code clone ${s.codeDir} is not owned by the service user`);
  if (s.codeDir && io.canWrite?.(s.codeDir))
    problems.push(`the verify user ${s.runAs} can write the service's code clone ${s.codeDir}`);
  const roots = s.protectedRoots ?? PROTECTED_ROOTS;
  const allowed = new Set(s.allowPaths ?? ALLOW_PATHS);
  // An empty list would make the deny-by-default check pass without looking at anything.
  if (!roots.length) problems.push("STACKRA_VERIFY_PROTECTED_ROOTS names no directory");
  if (!allowed.size) problems.push("STACKRA_VERIFY_ALLOW_PATHS names no path");
  for (const root of roots) {
    if (!io.exists(root)) {
      problems.push(`the protected root ${root} does not exist, so nothing proves it`);
      continue;
    }
    if (io.canRead(root))
      problems.push(`the verify user ${s.runAs} can list ${root}: make it traverse-only (o=x)`);
    if (io.canTraverse && !io.canTraverse(root))
      problems.push(
        `the verify user ${s.runAs} cannot traverse ${root}, which its run inputs sit under`,
      );
    const entries = io.list?.(root) ?? null;
    if (entries === null) {
      problems.push(
        `this service cannot list ${root}, so its entries cannot be shown unreadable (give the service user read on it, e.g. an ACL)`,
      );
      continue;
    }
    for (const entry of entries) {
      const path = root === "/" ? `/${entry}` : `${root}/${entry}`;
      if (roots.includes(path) || allowed.has(path)) continue;
      // Traversing is reaching: through an o=x directory the verify user opens any name it can guess.
      if (io.canRead(path) || io.canTraverse?.(path))
        problems.push(
          `the verify user ${s.runAs} can read or traverse ${path} (deny by default: not on STACKRA_VERIFY_ALLOW_PATHS)`,
        );
    }
  }
  return problems;
}

/**
 * The host checks that need the machine, through `io` so a test can stand in: `exists(path)`, `canRead(path)` (as the
 * verify user: read a file, list a directory), `canTraverse(path)` (as the verify user), `list(dir)` (as this
 * process; null when it cannot), `cgroup(file)` (the verify user's slice, null when missing) and `dockerInfo()`
 * ({ code, stdout }). The verify user can read none of the forbidden paths; under each protected root (deny by
 * default) it can read no entry but the allowed ones, and the root itself is traverse-only; its slice has CPU,
 * memory and task caps, and its Docker is rootless. A path that is named but missing, or a root this process cannot
 * list, is a problem too: what cannot be checked never passes. Each problem is a reason not to start.
 */
export function preflightProblems(s, io, extraForbidden = []) {
  const problems = filesystemProblems(s, io, extraForbidden);
  for (const file of ["memory.max", "pids.max", "cpu.max"]) {
    const value = io.cgroup(file);
    if (value === null || value.startsWith("max"))
      problems.push(
        `the verify user's slice has no ${file} cap (a drop-in on its user@.service sets it)`,
      );
  }
  // The per-uid REJECT rules, proven: on the default bridge (where the proxy and the builds run), instance metadata
  // must not answer, over IPv4 or IPv6.
  const bridge = io.bridgeProbe?.();
  if (bridge === null) problems.push("the bridge probe did not run");
  else if (bridge?.length)
    problems.push(
      `the bridge network reaches ${bridge.join(" ")} (the per-uid REJECT rules are missing)`,
    );
  const overlap = subuidOverlap(io.subuid?.() ?? "", s.runAs);
  if (overlap) problems.push(overlap);
  const info = io.dockerInfo();
  if (info.code !== 0) problems.push("the verify user's Docker does not answer");
  else if (!info.stdout.includes("rootless"))
    problems.push("the verify user's Docker is not rootless");
  return problems;
}

/** The paths the operator names as unreadable besides the settings': the service user's home and the list it sets. */
const operatorForbidden = () => [
  process.env.HOME,
  ...(process.env.STACKRA_VERIFY_FORBIDDEN?.split(",").filter(Boolean) ?? []),
];

function preflight(s) {
  return [
    ...preflightProblems(s, hostIo(s), operatorForbidden()),
    ...[yamlProblem(s.codeDir ?? CODE_DIR)].filter(Boolean),
  ];
}

/** The filesystem half again, before each pass of `once` or the daemon. */
const recheckHost = (s) => filesystemProblems(s, hostIo(s), operatorForbidden());

/** The machine behind preflightProblems' `io`. */
function hostIo(s) {
  const uid = spawnSync("id", ["-u", s.runAs], spawnOptions({ timeout: 30_000 })).stdout?.trim();
  return {
    exists: existsSync,
    // STACKRA_VERIFY_HOME is 0711: the verify user may pass through it to a run's archive, never list or read it.
    canRead: (path) =>
      spawnSync(
        "sudo",
        ["-n", "-u", s.runAs, "--", "test", "-r", path],
        spawnOptions({ timeout: 30_000 }),
      ).status === 0,
    canTraverse: (path) =>
      spawnSync(
        "sudo",
        ["-n", "-u", s.runAs, "--", "test", "-x", path],
        spawnOptions({ timeout: 30_000 }),
      ).status === 0,
    canWrite: (path) =>
      spawnSync(
        "sudo",
        ["-n", "-u", s.runAs, "--", "test", "-w", path],
        spawnOptions({ timeout: 30_000 }),
      ).status === 0,
    ownedByService: (path) => {
      try {
        return statSync(path).uid === process.getuid();
      } catch {
        return false;
      }
    },
    list: (dir) => {
      try {
        return readdirSync(dir);
      } catch {
        return null;
      }
    },
    cgroup: (file) => {
      try {
        return readFileSync(`/sys/fs/cgroup/user.slice/user-${uid}.slice/${file}`, "utf8").trim();
      } catch {
        return null;
      }
    },
    bridgeProbe: () => {
      if (docker(s, ["pull", "--quiet", s.baseImage], { timeout: 10 * 60_000 }).code !== 0)
        return null;
      return probeVerdict([
        docker(
          s,
          [
            "run",
            "--rm",
            "--network",
            "bridge",
            ...containerLimits(s, join(s.home, "preflight.env")),
            s.baseImage,
            "node",
            "-e",
            probeScript(["169.254.169.254:80", "169.254.169.254:443", "[fd00:ec2::254]:80"]),
          ],
          { timeout: 5 * 60_000 },
        ),
      ]);
    },
    subuid: () => {
      try {
        return readFileSync("/etc/subuid", "utf8");
      } catch {
        return "";
      }
    },
    dockerInfo: () =>
      docker(s, ["info", "--format", "{{json .SecurityOptions}}"], { timeout: 60_000 }),
  };
}

/**
 * One pass of `once` or the daemon over `repos`: the filesystem checks run again first (`recheck()`, problems as
 * lines), and a problem now stops the service as one at start does (`stop(problems)`; false, nothing runs).
 */
export async function servicePass(repos, { recheck, run, stop }) {
  const problems = recheck();
  if (problems.length) {
    stop(problems);
    return false;
  }
  for (const repo of repos) await run(repo);
  return true;
}

let stopping = false;
let activeKill = null;

/** A run log is capped: past LOG_MAX_BYTES nothing more is written, except the last LOG_TAIL_BYTES when it closes. */
export const LOG_MAX_BYTES = 20 * 1024 * 1024;
export const LOG_TAIL_BYTES = 256 * 1024;

/** A capped writer: `write(chunk)` appends while under the cap and keeps a tail after it; `close()` writes the tail. */
export function cappedLog(append, max = LOG_MAX_BYTES, tailBytes = LOG_TAIL_BYTES) {
  let written = 0;
  let tail = Buffer.alloc(0);
  let capped = false;
  return {
    write(chunk) {
      const data = Buffer.from(chunk);
      if (!capped && written + data.length <= max) {
        append(data);
        written += data.length;
        return;
      }
      capped = true;
      tail = Buffer.concat([tail, data]).subarray(-tailBytes);
    },
    close() {
      if (capped)
        append(Buffer.concat([Buffer.from("\n[log capped; its last part follows]\n"), tail]));
    },
  };
}

/** The first stop signal kills the running container; the run then records nothing and cleans up. */
function onStop() {
  if (stopping) {
    process.stderr.write(
      "stackra-verify: cleaning up the current run; it exits when that is done\n",
    );
    return;
  }
  stopping = true;
  if (activeKill) activeKill();
}
const isStopping = () => stopping;

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Every spawn has a time limit: a hung git or docker call ends as an error, never a stuck service. */
export const SPAWN_TIMEOUT_MS = 20 * 60 * 1000;
const spawnOptions = (options) => ({
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  timeout: SPAWN_TIMEOUT_MS,
  killSignal: "SIGKILL",
  ...options,
});

function sh(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, spawnOptions(options));
  if (r.error) throw new Error(`${cmd} ${args[0] ?? ""}: ${r.error.message}`);
  if (r.status !== 0)
    throw new Error(`${cmd} ${args.slice(0, 2).join(" ")}: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout;
}

/** The environment of every git call on the mirror: replace objects off, no system or user config. */
export const gitEnv = (index) => ({
  PATH: process.env.PATH,
  HOME: "/nonexistent",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_CONFIG_NOSYSTEM: "1",
  ...(index ? { GIT_INDEX_FILE: index } : {}),
});
/** git on the daemon's own mirror, hooks and fsmonitor off; `index` selects a scratch index. */
const git = (mirror, args, { index, ...options } = {}) =>
  sh(
    "git",
    ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-C", mirror, ...args],
    {
      ...options,
      env: gitEnv(index),
    },
  );

function docker(s, args, options = {}) {
  const [bin, ...argv] = dockerAs(s, args);
  const r = spawnSync(bin, argv, spawnOptions(options));
  return { code: r.error ? null : r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/**
 * The tree that is tested: the PR head merged onto `base` (main), then main's verify definition laid over it and
 * every definition file main lacks removed (overlayPlan), so a PR can neither skip a check nor redefine one. Built in
 * a scratch index of the daemon's bare mirror (every index change goes through `update-index --index-info`, which
 * needs no work tree; review MEDIUM-1). Refused, as the PR's failure (`{ refused: true }`, each problem named): a
 * path the tree may never carry (forbiddenPaths), a pnpm-workspace.yaml change outside what it installs
 * (spliceWorkspace, with `yaml`, the real parser), and a dependency spec that does not resolve from the registry or
 * renames a gate tool (dependencySpecProblems). A merge conflict throws `{ conflict: true }`, the PR's failure too.
 */
export function buildTree(mirror, base, sha, scratchIndex, yaml = null, out = {}) {
  const merge = spawnSync(
    "git",
    [
      "-c",
      "core.hooksPath=/dev/null",
      "-C",
      mirror,
      "merge-tree",
      "--write-tree",
      "--no-messages",
      base,
      sha,
    ],
    spawnOptions({ env: gitEnv() }),
  );
  if (merge.status === 1)
    throw Object.assign(new Error(`${sha} conflicts with main ${base}`), { conflict: true });
  if (merge.status !== 0)
    throw new Error(`git merge-tree: ${(merge.stderr || merge.stdout).trim()}`);
  const merged = merge.stdout.split("\n")[0].trim();
  const listing = (treeish) =>
    git(mirror, ["ls-tree", "-r", "-z", "--full-tree", treeish])
      .split("\0")
      .filter(Boolean)
      .map((line) => {
        const [meta, path] = line.split("\t");
        const [mode, type, object] = meta.split(" ");
        return { mode, type, object, path };
      })
      .filter((e) => e.type === "blob");
  const mergedEntries = listing(merged);
  const mainEntries = listing(base);
  const mainByPath = new Map(mainEntries.map((e) => [e.path, e]));
  const changed = mergedEntries
    .filter((e) => mainByPath.get(e.path)?.object !== e.object)
    .map((e) => e.path);
  const forbidden = forbiddenPaths(changed, ignoredByMain(mirror, base, changed));
  if (forbidden.length) throw treeRefusal(forbidden);
  const { whole, remove, scripts } = overlayPlan(
    mergedEntries.map((e) => e.path),
    mainEntries,
  );
  const mergedByPath = new Map(mergedEntries.map((e) => [e.path, e]));
  const blob = (entry) => git(mirror, ["cat-file", "blob", entry.object]);
  // pnpm-workspace.yaml: the PR's sections pnpm installs from, spliced into main's file; anything else is refused.
  const problems = [];
  const wsPath = "pnpm-workspace.yaml";
  let workspace = {};
  const lines = whole.map((e) => `${e.mode} ${e.object}\t${e.path}`);
  if (mainByPath.has(wsPath) && !mergedByPath.has(wsPath))
    problems.push("the PR removes pnpm-workspace.yaml, which only main may set");
  else if (mergedByPath.get(wsPath)?.object !== mainByPath.get(wsPath)?.object) {
    const prText = blob(mergedByPath.get(wsPath));
    const mainText = mainByPath.has(wsPath) ? blob(mainByPath.get(wsPath)) : "";
    const spliced = spliceWorkspace(mainText, prText, yaml ?? serviceYaml());
    problems.push(...spliced.problems);
    workspace = spliced.value ?? {};
    if (!spliced.problems.length && spliced.text !== prText) {
      const object = git(mirror, ["hash-object", "-w", "--stdin"], { input: spliced.text }).trim();
      lines.push(`${mergedByPath.get(wsPath).mode} ${object}\t${wsPath}`);
    }
  }
  // Every member's dependency specs: registry only, and no gate tool renamed.
  const manifests = [];
  for (const entry of mergedEntries.filter((e) => /(?:^|\/)package\.json$/.test(e.path)))
    try {
      manifests.push({ path: entry.path, json: JSON.parse(blob(entry)) });
    } catch {
      problems.push(`${entry.path} is not JSON`);
    }
  problems.push(
    ...dependencySpecProblems({
      workspace,
      manifests,
      memberNames: new Set(manifests.map((m) => m.json?.name).filter(Boolean)),
    }),
  );
  if (problems.length) throw treeRefusal(problems);
  git(mirror, ["read-tree", merged], { index: scratchIndex });
  for (const path of scripts) {
    const text = withMainScripts(
      git(mirror, ["cat-file", "blob", mergedByPath.get(path).object]),
      git(mirror, ["cat-file", "blob", mainByPath.get(path).object]),
    );
    if (text === null) continue;
    const object = git(mirror, ["hash-object", "-w", "--stdin"], { input: text }).trim();
    lines.push(`${mergedByPath.get(path).mode} ${object}\t${path}`);
  }
  // A removal is a zero-id entry (mode 0); NUL-separated, so no path character reaches a parser.
  const zero = "0".repeat(
    git(mirror, ["rev-parse", "--show-object-format"]).trim() === "sha256" ? 64 : 40,
  );
  for (const path of remove) lines.push(`0 ${zero}\t${path}`);
  if (lines.length)
    git(mirror, ["update-index", "-z", "--index-info"], {
      index: scratchIndex,
      input: `${lines.join("\0")}\0`,
    });
  const tree = git(mirror, ["write-tree"], { index: scratchIndex }).trim();
  out.shared = sharedStepSwaps(listing(tree), mainEntries);
  return tree;
}

/** A token of the stackra-verify App, minted from the 0400 key file; the key never enters an environment. */
async function appToken(s) {
  return botNetwork.mintToken(
    {
      STACKRA_VERIFY_APP_ID: s.appId,
      STACKRA_VERIFY_INSTALLATION_ID: s.installationId,
      STACKRA_VERIFY_PRIVATE_KEY: readFileSync(s.keyFile, "utf8"),
    },
    botNetwork.netFetch,
    "STACKRA_VERIFY",
  );
}

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

const statePath = (s) => join(s.home, "state.json");
const readState = (s) => {
  try {
    return JSON.parse(readFileSync(statePath(s), "utf8"));
  } catch {
    return { errors: {}, stores: {} };
  }
};
const writeState = (s, state) =>
  writeFileSync(statePath(s), JSON.stringify(state, null, 2), { mode: 0o600 });

function freeBytes(dir) {
  const stat = statfsSync(dir);
  return stat.bavail * stat.bsize;
}

/** The refs to delete after a job: its PR ref, and every queue ref it fetched (`queued`: for-each-ref output). */
export const refsToDelete = (job, queued = "") => [
  ...(job.pr ? [`refs/verify/pr-${job.pr}`] : []),
  ...(job.queue ? queued.split("\n").filter((ref) => ref.startsWith("refs/verify/queue/")) : []),
];

/** The refs a job fetches: main, and the PR head or the merge queue's group commits (or the queue job stalls). */
export function fetchRefs(job) {
  const refs = ["+refs/heads/main:refs/heads/main"];
  if (job.pr) refs.push(`+refs/pull/${job.pr}/head:refs/verify/pr-${job.pr}`);
  if (job.queue) refs.push("+refs/heads/gh-readonly-queue/*:refs/verify/queue/*");
  return refs;
}

/**
 * `git archive` honours the archived tree's `.gitattributes`: a PR's `export-ignore` would drop main's overlaid
 * configs or its own tests from the tested tree, and `export-subst` would rewrite files. The mirror's own
 * `info/attributes`, which wins over the tree's, turns both off for every path.
 */
export function neutraliseAttributes(mirror) {
  const gitDir =
    existsSync(join(mirror, "HEAD")) && !existsSync(join(mirror, ".git"))
      ? mirror
      : join(mirror, ".git");
  mkdirSync(join(gitDir, "info"), { recursive: true });
  writeFileSync(join(gitDir, "info", "attributes"), "* -export-ignore -export-subst\n");
}

/** The refs a history bundle carries: main's head and, for a PR or queue commit, the head. */
export const historyRefs = (job) => [
  ["refs/stackra/base", job.base],
  ...(job.sha === job.base ? [] : [["refs/stackra/head", job.sha]]),
];

/**
 * The daemon's mirror of `repo`, fetched; the tested tree built and archived; `job.base` set to main's head. With
 * `history`, a bundle of main's and the head's history (read-only in the gate: commitlint and gitleaks need it).
 */
function archiveJob(s, job, runDir, { history = false } = {}) {
  const mirror = join(s.home, "mirror", job.repo.replace("/", "__"));
  if (!existsSync(join(mirror, "HEAD")))
    sh("git", ["clone", "--quiet", "--bare", `https://github.com/${job.repo}.git`, mirror], {
      env: gitEnv(),
    });
  git(mirror, ["fetch", "--quiet", "--no-tags", "origin", ...fetchRefs(job)]);
  git(mirror, ["rev-parse", "--verify", `${job.sha}^{commit}`]);
  job.base ??= git(mirror, ["rev-parse", "--verify", "refs/heads/main^{commit}"]).trim();
  try {
    const built = {};
    const tree = buildTree(mirror, job.base, job.sha, join(runDir, "index"), null, built);
    // The shared steps' swap: the paths (NUL-separated) and main's copy of those main has, both read-only inputs.
    writeFileSync(
      join(runDir, "shared-definitions"),
      built.shared.paths.map((p) => `${p}\0`).join(""),
      { mode: 0o644 },
    );
    writeFileSync(join(runDir, "shared-main.tar"), "", { mode: 0o644 });
    if (built.shared.main.length)
      git(mirror, [
        "archive",
        "--format=tar",
        "-o",
        join(runDir, "shared-main.tar"),
        job.base,
        "--",
        ...built.shared.main.map((p) => `:(literal)${p}`),
      ]);
    const tarPath = join(runDir, "src.tar");
    neutraliseAttributes(mirror);
    git(mirror, ["archive", "--format=tar", "-o", tarPath, tree]);
    chmodSync(tarPath, 0o644);
    if (history) {
      const refs = historyRefs(job);
      for (const [ref, sha] of refs) git(mirror, ["update-ref", ref, sha]);
      const bundle = join(runDir, "history.bundle");
      git(mirror, ["bundle", "create", "--quiet", bundle, ...refs.map(([ref]) => ref)]);
      chmodSync(bundle, 0o644);
    }
    return { tarPath, mirror, tree };
  } finally {
    for (const ref of ["refs/stackra/base", "refs/stackra/head"])
      spawnSync(
        "git",
        ["-c", "core.hooksPath=/dev/null", "-C", mirror, "update-ref", "-d", ref],
        spawnOptions({ env: gitEnv() }),
      );
    const queued = job.queue
      ? git(mirror, ["for-each-ref", "--format=%(refname)", "refs/verify/queue/"])
      : "";
    for (const ref of refsToDelete(job, queued)) git(mirror, ["update-ref", "-d", ref]);
  }
}

/**
 * The warm store image for main's current lockfile: built by this process from main (trusted, merged), its id
 * recorded in the daemon's state, and checked against that record before every use. The base is pulled by digest.
 */
async function ensureStore(s, mirror, base, runDir, state) {
  const pull = docker(s, ["pull", "--quiet", s.baseImage]);
  if (pull.code !== 0)
    throw new Error(`could not pull the pinned base image: ${pull.stderr.trim()}`);
  const ctx = join(runDir, "store-context");
  mkdirSync(ctx, { recursive: true, mode: 0o755 });
  for (const file of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"])
    writeFileSync(join(ctx, file), git(mirror, ["show", `${base}:${file}`]), { mode: 0o644 });
  const lockfile = readFileSync(join(ctx, "pnpm-lock.yaml"));
  const tag = storeTag(lockfile, s.baseImage, toolsFingerprint(s));
  const recorded = state.stores[tag];
  const current = docker(s, ["image", "inspect", "--format", "{{.Id}}", tag]).stdout.trim();
  if (storeReusable({ recordedId: recorded?.id, currentId: current, builtAt: recorded?.builtAt }))
    return tag;
  const dockerfile = storeDockerfile({
    baseImage: s.baseImage,
    pnpmVersion: pnpmVersionOf(readFileSync(join(ctx, "package.json"), "utf8")),
  });
  writeFileSync(join(ctx, "Dockerfile"), dockerfile, { mode: 0o644 });
  await ensureTools(s, ctx);
  const build = docker(s, ["build", "--quiet", "--pull=false", "--no-cache", "--tag", tag, ctx], {
    timeout: 60 * 60 * 1000,
  });
  if (build.code !== 0) {
    serviceLog(`store image build failed: ${scrub(build.stderr).slice(-4000)}`);
    throw new Error("could not build the store image (the service log has the detail)");
  }
  state.stores = {
    [tag]: {
      id: docker(s, ["image", "inspect", "--format", "{{.Id}}", tag]).stdout.trim(),
      builtAt: Date.now(),
    },
  };
  return tag;
}

const sha256Of = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/**
 * The gate's tools in the store build context (`tools/`): each download kept in `<home>/tools/<sha256>`, checked
 * against its setting on every use, and the install script beside them.
 */
async function ensureTools(s, ctx) {
  const cache = join(s.home, "tools");
  mkdirSync(cache, { recursive: true, mode: 0o700 });
  mkdirSync(join(ctx, "tools"), { recursive: true, mode: 0o755 });
  for (const tool of TOOLS) {
    const sha = s.toolSha256[tool.name];
    const cached = join(cache, sha);
    if (!existsSync(cached) || sha256Of(cached) !== sha)
      await downloadVerified(tool.url, sha, cached);
    writeFileSync(join(ctx, "tools", toolFile(tool)), readFileSync(cached), { mode: 0o644 });
  }
  writeFileSync(join(ctx, "tools", "install.sh"), toolInstallScript(), { mode: 0o644 });
}

/** Whether a file starts like a zip archive (the OSV database download is checked by its content). */
function isZip(path) {
  const fd = openSync(path, "r");
  try {
    const head = Buffer.alloc(4);
    return readSync(fd, head, 0, 4, 0) === 4 && head.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  } finally {
    closeSync(fd);
  }
}

/**
 * The offline OSV database the gate mounts read-only: refreshed by this process when older than OSV_REFRESH_MS
 * (readable by the verify user's Docker, 0755 / 0644), and refused (an error, never a pass) when missing, older than
 * STACKRA_VERIFY_OSV_MAX_AGE_H, or failing the OSV canary (OSV_CANARY) at a new database or a day after its last pass.
 */
async function ensureOsvDb(s, { store, envFile, runDir, state }) {
  const path = osvDbPath(s.osvDir);
  const mtime = () => {
    try {
      return statSync(path).mtimeMs;
    } catch {
      return null;
    }
  };
  const before = mtime();
  if (before === null || Date.now() - before > OSV_REFRESH_MS) {
    try {
      mkdirSync(dirname(path), { recursive: true, mode: 0o755 });
      for (const dir of [s.osvDir, join(s.osvDir, "osv-scalibr"), dirname(path)])
        chmodSync(dir, 0o755);
      const fresh = `${path}.new`;
      await downloadVerified(OSV_DB_URL, null, fresh);
      if (!isZip(fresh) || statSync(fresh).size < OSV_DB_MIN_BYTES) {
        rmSync(fresh, { force: true });
        throw new Error("the download is not the OSV database (not a zip, or too small)");
      }
      chmodSync(fresh, 0o644);
      renameSync(fresh, path);
    } catch (error) {
      serviceLog(`OSV database refresh failed: ${error.message}`);
    }
  }
  let size;
  try {
    size = statSync(path).size;
  } catch {
    size = null;
  }
  const problem = osvDbProblem(mtime(), Date.now(), s.osvMaxAgeMs, size);
  if (problem) throw new Error(problem);
  // At each new database, store image or scanner, and once a day: the canary proves osv-scanner reads this database
  // the way the gate does.
  const stat = statSync(path);
  const db = {
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    image: docker(s, ["image", "inspect", "--format", "{{.Id}}", store]).stdout.trim() || null,
    scanner: TOOLS.find((t) => t.name === "osv-scanner")?.version ?? null,
  };
  const last = state.osvCanary;
  if (!osvCanaryDue(last, db, Date.now())) return;
  const lockfile = join(runDir, "osv-canary-lock.yaml");
  writeFileSync(
    lockfile,
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "osv-canary.lock.yaml")),
    {
      mode: 0o644,
    },
  );
  const r = docker(
    s,
    osvCanaryArgs(s, {
      name: `sv-osv-canary-${Date.now().toString(36)}`,
      image: store,
      envFile,
      osvDir: s.osvDir,
      lockfile,
    }),
    { timeout: 10 * 60_000 },
  );
  const canary = osvCanaryProblem(r);
  if (canary) {
    delete state.osvCanary;
    writeState(s, state);
    throw new Error(canary);
  }
  state.osvCanary = { ...db, at: Date.now() };
  writeState(s, state);
}

/**
 * The CodeQL bundle, unpacked once per sha256 under `<home>/codeql/<sha256>/codeql` (0755, read-only in the CodeQL
 * container): downloaded from STACKRA_VERIFY_CODEQL_BUNDLE_URL and checked against its sha256 setting first.
 */
async function ensureCodeql(s) {
  const root = join(s.home, "codeql");
  mkdirSync(root, { recursive: true, mode: 0o755 });
  chmodSync(root, 0o755);
  const dir = join(root, s.codeqlBundleSha256);
  if (existsSync(join(dir, "codeql", "codeql"))) return join(dir, "codeql");
  const archive = join(root, `${s.codeqlBundleSha256}.tar.gz`);
  await downloadVerified(s.codeqlBundleUrl, s.codeqlBundleSha256, archive);
  const unpacking = `${dir}.part`;
  rmSync(unpacking, { recursive: true, force: true });
  mkdirSync(unpacking, { mode: 0o755 });
  try {
    sh("tar", ["-xzf", archive, "-C", unpacking], { timeout: 30 * 60_000 });
    sh("chmod", ["-R", "a+rX,go-w", unpacking]);
    renameSync(unpacking, dir);
  } finally {
    rmSync(archive, { force: true });
    rmSync(unpacking, { recursive: true, force: true });
  }
  if (!existsSync(join(dir, "codeql", "codeql")))
    throw new Error("the CodeQL bundle has no codeql/codeql");
  return join(dir, "codeql");
}

/**
 * The licensed image for a tested tree: the store image plus a build of each licensed package at the version the
 * tree locks (publisher code from the registry, checked against the lockfile integrity, never PR code). Built once per
 * version set and recorded like the store image. Without licensed builds in the tree it is the store image itself.
 */
async function ensureLicensed(s, store, packages, runDir, state) {
  if (!packages.length) return store;
  if (!s.licenceFile)
    throw new Error("the tree has licensed builds; STACKRA_VERIFY_LICENCE_FILE is not set");
  const storeId = docker(s, ["image", "inspect", "--format", "{{.Id}}", store]).stdout.trim();
  const tag = `stackra-verify-licensed:${createHash("sha256").update(storeId).update(JSON.stringify(packages)).digest("hex").slice(0, 16)}`;
  state.licensed = pruneLicensed(state.licensed ?? {}, storeId);
  const recorded = state.licensed[tag];
  const current = docker(s, ["image", "inspect", "--format", "{{.Id}}", tag]).stdout.trim();
  if (storeReusable({ recordedId: recorded?.id, currentId: current, builtAt: recorded?.builtAt }))
    return tag;
  const token = readFileSync(s.licenceFile, "utf8").trim();
  registerSecret(token);
  const ctx = join(runDir, "licensed-context");
  mkdirSync(ctx, { recursive: true, mode: 0o755 });
  writeFileSync(join(ctx, "licensed.sh"), licensedScript(packages), { mode: 0o644 });
  writeFileSync(join(ctx, "Dockerfile"), licensedDockerfile(store), { mode: 0o644 });
  // The token reaches BuildKit on stdin only: no file the verify user can read, no argument, no environment.
  const build = docker(
    s,
    [
      "build",
      "--quiet",
      "--pull=false",
      "--no-cache",
      "--secret",
      "id=licence,src=/dev/stdin",
      "--tag",
      tag,
      ctx,
    ],
    { timeout: 60 * 60 * 1000, input: licenceSecret(token) },
  );
  if (build.code !== 0) {
    // The tool prints its download URL, which holds the token: only the scrubbed text reaches the service log, and
    // none of it reaches a check run.
    serviceLog(`licensed build failed: ${scrub(build.stderr).slice(-4000)}`);
    throw new Error("could not build the licensed image (the service log has the detail)");
  }
  if (await imageCarries(dockerReader(s), tag, token)) {
    docker(s, ["rmi", "-f", tag]);
    throw new Error(
      "the licensed image carries the licence token or its name; refused and removed",
    );
  }
  state.licensed = {
    ...state.licensed,
    [tag]: {
      id: docker(s, ["image", "inspect", "--format", "{{.Id}}", tag]).stdout.trim(),
      storeId,
      builtAt: Date.now(),
    },
  };
  return tag;
}

/** The service's own log (stderr, the journal under systemd), always scrubbed. */
function serviceLog(line) {
  process.stderr.write(`stackra-verify: ${scrub(line)}\n`);
}

/** The docker reads imageCarries needs, as the verify user; `exportStream` streams the image's final filesystem. */
function dockerReader(s) {
  return {
    history: (image) => docker(s, ["history", "--no-trunc", "--format", "{{.CreatedBy}}", image]),
    config: (image) => docker(s, ["image", "inspect", image]),
    exportStream: (image, onChunk) =>
      new Promise((resolve) => {
        const name = `sv-scan-${Date.now().toString(36)}`;
        if (docker(s, ["create", "--name", name, image, "true"]).code !== 0) {
          resolve(false);
          return;
        }
        const [bin, ...argv] = dockerAs(s, ["export", name]);
        const child = spawnChild(bin, argv, { stdio: ["ignore", "pipe", "ignore"] });
        const timer = setTimeout(() => child.kill("SIGKILL"), 30 * 60_000);
        child.stdout.on("data", onChunk);
        child.on("close", (code) => {
          clearTimeout(timer);
          docker(s, ["rm", "-f", name]);
          resolve(code === 0);
        });
        child.on("error", () => resolve(false));
      }),
  };
}

/**
 * Whether an image carries the licence token: its history and config (the token or its variable name), or any byte
 * of any layer (the token; the variable name legitimately appears in the licensed package's own code).
 */
export async function imageCarries(reader, image, token) {
  const history = reader.history(image);
  const config = reader.config(image);
  if (history.code !== 0 || config.code !== 0) return true;
  for (const text of [history.stdout, config.stdout])
    if (text.includes(token) || text.includes("UNIWIND_AUTH_TOKEN")) return true;
  // Secondary to the in-build search: the image's final filesystem, streamed, for the token and its base64 cores at
  // every alignment.
  const scanners = secretPatterns(token).map((pattern) => needleScanner(pattern));
  const ok = await reader.exportStream(image, (chunk) => {
    for (const scanner of scanners) scanner.push(chunk);
  });
  return !ok || scanners.some((scanner) => scanner.found);
}

/** Everything a run left in the verify user's Docker goes: containers, run images, volumes, networks, other images. */
function cleanDocker(s, names, images, keepIds) {
  const leftover = docker(s, ["ps", "-aq"]).stdout.split("\n").filter(Boolean);
  const allIds = docker(s, ["image", "ls", "-aq", "--no-trunc"]).stdout.split("\n").filter(Boolean);
  for (const args of cleanupPlan({ names, images, leftover, allIds, keep: keepIds }))
    docker(s, args);
}

async function headOf(s, job) {
  if (!job.pr) return job.sha;
  const token = await appToken(s);
  return JSON.parse(gh(["api", `repos/${job.repo}/pulls/${job.pr}`], token, true)).head.sha;
}

/** Verifies one head end to end and records it. Returns the ledger JSON entry, or null when nothing ran. */
export async function verify(s, job) {
  const kind = job.kind ?? "gate";
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const name = `${job.repo.replace("/", "__")}-${job.sha}-${kind}`;
  for (const dir of ["logs", "ledger", "runs", "mirror"])
    mkdirSync(join(s.home, dir), { recursive: true });
  chmodSync(join(s.home, "logs"), 0o700);
  chmodSync(join(s.home, "mirror"), 0o700);
  chmodSync(join(s.home, "ledger"), 0o700);
  const logPath = join(s.home, "logs", `${name}-${started}.log`);
  writeFileSync(logPath, "", { mode: 0o600 });
  const runDir = join(s.home, "runs", `${name}-${started}`);
  mkdirSync(runDir, { recursive: true, mode: 0o755 });
  chmodSync(join(s.home, "runs"), 0o711);
  const envFile = join(runDir, "container.env");
  writeFileSync(envFile, CONTAINER_ENV, { mode: 0o644 });
  const installEnvFile = join(runDir, "install.env");
  writeFileSync(installEnvFile, CONTAINER_ENV + proxyEnv(`http://proxy:${PROXY_PORT}`), {
    mode: 0o644,
  });
  writeFileSync(join(s.home, "docker.env"), dockerEnvFile(s), { mode: 0o644 });
  for (const [file, text] of Object.entries(kindFiles(kind, s.codeqlLanguages)))
    writeFileSync(join(runDir, file), text, { mode: 0o644 });
  const state = readState(s);

  const deps = {
    settings: s,
    envFile,
    installEnvFile,
    now: Date.now,
    archive: () => {
      for (const dir of [s.home, s.dockerRoot].filter(Boolean))
        if (freeBytes(dir) < s.minFreeBytes)
          throw new Error(`not enough free disk in ${dir} for a run`);
      const { tarPath, mirror, tree } = archiveJob(s, job, runDir, { history: kind === "gate" });
      deps.mirror = mirror;
      deps.tree = tree;
      const onMain = Object.fromEntries(
        SERVICE_FILES.map((f) => {
          const r = spawnSync(
            "git",
            ["-C", mirror, "rev-parse", "-q", "--verify", `${job.base}:${f}`],
            spawnOptions({ env: gitEnv() }),
          );
          return [f, r.status === 0 ? r.stdout.trim() : null];
        }),
      );
      const drift = definitionDrift(LOADED_BLOBS, onMain, state.selfUpdate?.refused);
      if (drift) throw Object.assign(new Error(drift), { drift: true });
      if (kind === "gate" || kind === "mobile")
        writeFileSync(
          join(runDir, "licences.json"),
          git(mirror, ["show", `${job.base}:tools/policy/licences.json`]),
          { mode: 0o644 },
        );
      deps.buildList = allowedBuilds(git(mirror, ["show", `${job.base}:pnpm-workspace.yaml`]));
      return tarPath;
    },
    builds: () => deps.buildList ?? [],
    // Ready means the proxy printed PROXY_READY: before it, the egress probe's checks through the proxy would find it
    // refusing connections and count that as sealed, and the install would fail on a proxy still starting.
    network: async ({ image, proxyName, network }) => {
      const steps = [
        ["network", "create", "--internal", network],
        proxyArgs(s, { name: proxyName, image, envFile, allow: s.registries }),
        ["network", "connect", "--alias", "proxy", network, proxyName],
      ];
      for (const args of steps) {
        const r = docker(s, args, { timeout: 120_000 });
        if (r.code !== 0)
          throw new Error(`could not set up the install network: ${scrub(r.stderr).slice(0, 200)}`);
      }
      const [bin, ...argv] = dockerAs(s, ["logs", "--follow", proxyName]);
      const logs = spawnChild(bin, argv, { stdio: ["ignore", "pipe", "ignore"] });
      try {
        await childLine(logs, PROXY_READY, PROXY_START_MS);
      } catch (error) {
        throw new Error(`the install proxy did not start: ${error.message}`, { cause: error });
      } finally {
        logs.kill();
      }
      const gateway = docker(s, [
        "network",
        "inspect",
        "--format",
        "{{range .IPAM.Config}}{{.Gateway}} {{end}}",
        network,
      ])
        .stdout.trim()
        .split(/\s+/)
        .filter(Boolean);
      return { network, proxy: `proxy:${PROXY_PORT}`, gateway };
    },
    // The gate: the store image and a fresh OSV database, never a licensed build. Mobile: the licensed image, whose
    // failure is stackra/verify-mobile's alone (marked `licence`).
    storeImage: async () => {
      const store = await ensureStore(s, deps.mirror, job.base, runDir, state);
      if (kind === "gate") await ensureOsvDb(s, { store, envFile, runDir, state });
      if (kind === "codeql") deps.codeqlDir = await ensureCodeql(s);
      if (kind !== "mobile") return store;
      try {
        const lockText = git(deps.mirror, ["show", `${deps.tree}:pnpm-lock.yaml`]);
        const builds = allowedBuilds(git(deps.mirror, ["show", `${job.base}:pnpm-workspace.yaml`]));
        return await ensureLicensed(s, store, licensedPackagesFor(lockText, builds), runDir, state);
      } catch (error) {
        throw Object.assign(error, { licence: true });
      }
    },
    facts:
      kind === "gate"
        ? async () => {
            let pull = null;
            if (job.pr) {
              pull = JSON.parse(
                gh(["api", `repos/${job.repo}/pulls/${job.pr}`], await appToken(s), true),
              );
              if (pull.head?.sha !== job.sha) return false;
            }
            writeFileSync(join(runDir, "facts.json"), JSON.stringify(prFacts(job, pull)), {
              mode: 0o644,
            });
            return true;
          }
        : undefined,
    verifyMounts: () => kindMounts(kind, { runDir, osvDir: s.osvDir, codeqlDir: deps.codeqlDir }),
    docker: (args) => docker(s, args),
    runContainer: (args) =>
      new Promise((resolve) => {
        const [bin, ...argv] = dockerAs(s, args);
        const child = spawnChild(bin, argv, { stdio: ["ignore", "pipe", "pipe"] });
        const log = cappedLog((data) => appendFileSync(logPath, data));
        child.stdout.on("data", (chunk) => log.write(chunk));
        child.stderr.on("data", (chunk) => log.write(chunk));
        const nameIndex = args.indexOf("--name") + 1;
        activeKill = () => docker(s, ["kill", args[nameIndex]]);
        // Backstop: if `docker kill` at the time limit did not end the client, end it here.
        const backstop = setTimeout(() => child.kill("SIGKILL"), s.timeoutMs + 5 * 60_000);
        child.on("close", (code) => {
          clearTimeout(backstop);
          log.close();
          activeKill = null;
          resolve({ code });
        });
        child.on("error", () => {
          activeKill = null;
          resolve({ code: null });
        });
      }),
    exitCodeOf: (container) => {
      const r = docker(s, [
        "inspect",
        "--format",
        "{{.State.StartedAt}} {{.State.ExitCode}}",
        container,
      ]);
      return exitFromInspect(r.code, r.stdout);
    },
    kill: (container) => docker(s, ["kill", container]),
    egressLeaks: (image, net) => {
      const hostAddresses = spawnSync("hostname", ["-I"], spawnOptions({ timeout: 10_000 }))
        .stdout?.trim()
        .split(/\s+/)
        .filter(Boolean);
      const probe = () =>
        docker(
          s,
          probeArgs(s, {
            name: `sv-probe-${Date.now().toString(36)}`,
            image,
            envFile,
            network: net.network,
            proxy: net.proxy,
            targets: probeTargets(hostAddresses, net.gateway),
          }),
          { timeout: 5 * 60_000 },
        );
      // A probe that did not run is tried once more before the service stops.
      return probeVerdict([probe(), probe]);
    },
    // The keep list comes from the daemon's own state at clean-up time, so a run that failed early (a merge conflict,
    // a fetch error) never removes the base or the store image.
    cleanUp: (names, images) =>
      cleanDocker(
        s,
        names,
        images,
        keepIdsFrom(
          state,
          docker(s, ["image", "inspect", "--format", "{{.Id}}", s.baseImage]).stdout.trim(),
        ),
      ),
    headOf: () => headOf(s, job),
    readLog: () => readFileSync(logPath, "utf8"),
    stopping: isStopping,
    stop: onStop,
    timeoutMs: s.timeoutMs,
    setTimer: (fn, ms) => {
      const timer = setTimeout(fn, ms);
      return () => clearTimeout(timer);
    },
  };

  let result;
  try {
    result = await runJob(job, deps);
  } finally {
    spawnSync("chmod", ["-R", "u+rwX", runDir], spawnOptions({}));
    rmSync(runDir, { recursive: true, force: true });
  }
  if (result.error) appendFileSync(logPath, `\nstackra-verify: ${result.error}\n`);
  stopIfUnsafe(result, onStop);

  const key = errorKey(job);
  if (result.stopped || result.moved) {
    writeState(s, state);
    return null;
  }
  let conclusion = result.conclusion;
  let reason = result.reason;
  if (!result.post) {
    const errors = state.errors[key] ?? { count: 0 };
    state.errors[key] = { count: errors.count + 1, at: Date.now() };
    writeState(s, state);
    if (state.errors[key].count < MAX_ERROR_ATTEMPTS) return null;
    conclusion = "neutral";
    reason = scrub(result.error ?? "unknown").slice(0, 120);
  } else {
    state.errors = Object.fromEntries(Object.entries(state.errors).filter(([k]) => k !== key));
    writeState(s, state);
  }

  const durationMs = Date.now() - started;
  const body = checkRunBody({
    kind,
    sha: job.sha,
    base: job.base,
    conclusion,
    phase: result.phase,
    reason,
    durationMs,
    box: s.box,
    log: result.log ?? readFileSync(logPath, "utf8"),
    startedAt,
    completedAt: new Date().toISOString(),
  });
  let link;
  let posted = true;
  try {
    const created = await retry(async () => postCheckRun(job.repo, body, await appToken(s)));
    link = created.html_url;
  } catch (error) {
    posted = false;
    appendFileSync(logPath, `\nstackra-verify: check run not posted: ${error.message}\n`);
  }
  const { json, md } = ledgerEntry({
    ...job,
    kind,
    conclusion,
    phase: result.phase,
    reason,
    durationMs,
    box: s.box,
    at: new Date().toISOString(),
    link,
    posted,
  });
  const base = join(s.home, "ledger", job.repo.replace("/", "__"));
  appendFileSync(`${base}.jsonl`, `${JSON.stringify(json)}\n`);
  if (!existsSync(`${base}.md`))
    writeFileSync(`${base}.md`, `# ${job.repo} verify ledger\n\n${LEDGER_HEADER}\n`);
  appendFileSync(`${base}.md`, `${md}\n`);
  if (!posted)
    throw new Error(`the ${conclusion} result for ${job.sha} is in the ledger but was not posted`);
  return json;
}

/**
 * Creates the check run: `gh api --method POST repos/<repo>/check-runs --input -` with the body on stdin, as the
 * verify App. `run` is the spawn (a test passes a fake). Throws with GitHub's answer when it is refused.
 */
export function postCheckRun(repo, body, token, run = spawnSync) {
  const r = run("gh", ["api", "--method", "POST", `repos/${repo}/check-runs`, "--input", "-"], {
    input: JSON.stringify(body),
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      GH_TOKEN: token,
      GH_PROMPT_DISABLED: "1",
    },
    timeout: 60_000,
  });
  if (r.error) throw new Error(`gh api check-runs: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`gh api check-runs: ${(r.stderr || r.stdout || "").trim()}`);
  return JSON.parse(r.stdout);
}

/** Open non-draft PRs whose head branch lives in this repository (never a fork's), then main's head. */
async function heads(s, repo) {
  const token = await appToken(s);
  const pulls = JSON.parse(
    gh(
      ["api", "--paginate", "--slurp", `repos/${repo}/pulls?state=open&per_page=100`],
      token,
      true,
    ),
  ).flat();
  const main = JSON.parse(gh(["api", `repos/${repo}/commits/main`], token, true)).sha;
  // A merge queue's group commits (gh-readonly-queue/main/…) need the check too, or the queue stalls.
  const queue = JSON.parse(
    gh(["api", `repos/${repo}/git/matching-refs/heads/gh-readonly-queue/`], token, true),
  ).map((ref) => ({ repo, sha: ref.object?.sha, base: main, queue: true }));
  return jobsFrom({ repo, pulls, main, queue });
}

/** The local error record's key for a job: one per head and check, so one check's errors never hold another back. */
export const errorKey = (job) =>
  `${job.repo}@${job.sha}${(job.kind ?? "gate") === "gate" ? "" : `#${job.kind}`}`;

/**
 * Runs each kind of `job` in turn through `runOne` (needs-run check, verify and post), each on its own: a kind that
 * throws or fails is recorded for that kind only, so a mobile or licence failure never stops or changes the gate.
 */
export async function runKinds(job, kinds, runOne) {
  const results = {};
  for (const kind of kinds)
    try {
      results[kind] = await runOne({ ...job, kind });
    } catch (error) {
      results[kind] = { error: error.message };
    }
  return results;
}

/** A full 40-hex commit id. */
const isSha = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);

/**
 * The jobs of one pass: open, non-draft PRs whose head lives in this repository (never a fork's), oldest first; merge
 * queue commits; then main. Every SHA must be 40 hex characters, or the head is skipped.
 */
export function jobsFrom({ repo, pulls, main, queue = [] }) {
  const sha = isSha;
  const prs = pulls
    .filter((p) => !p.draft && p.head?.repo?.full_name === repo && sha(p.head?.sha))
    .toSorted((a, b) => a.number - b.number)
    .map((p) => ({
      repo,
      sha: p.head.sha,
      pr: String(p.number),
      base: main,
      labels: (p.labels ?? []).map((l) => l.name),
    }));
  return [
    ...prs,
    ...queue.filter((q) => sha(q.sha)),
    ...(sha(main) ? [{ repo, sha: main, base: main }] : []),
  ];
}

async function wanted(s, job) {
  const token = await appToken(s);
  const runs = JSON.parse(
    gh(
      [
        "api",
        `repos/${job.repo}/commits/${job.sha}/check-runs?check_name=${encodeURIComponent(KINDS[job.kind ?? "gate"].check)}&filter=all&per_page=100`,
      ],
      token,
      true,
    ),
  ).check_runs;
  const errors = readState(s).errors[errorKey(job)];
  return needsRun({
    checkRuns: runs,
    sha: job.sha,
    appId: s.appId,
    base: job.base,
    errors,
    name: KINDS[job.kind ?? "gate"].check,
  });
}

function pruneLogs(s) {
  const logs = join(s.home, "logs");
  if (!existsSync(logs)) return;
  for (const file of readdirSync(logs)) {
    const path = join(logs, file);
    if (Date.now() - statSync(path).mtimeMs > LOG_KEEP_MS) rmSync(path, { force: true });
  }
}

/**
 * stackra/codeql for the PRs that ask for it and, once a day, main. The nightly is marked done when its run is posted,
 * or when main's head already has one; an error leaves it for the retry.
 */
async function codeqlPass(s, jobs) {
  let failed = 0;
  const due = codeqlJobs(jobs, {
    now: Date.now(),
    hourUtc: s.codeqlHourUtc,
    lastNightly: readState(s).codeqlNightly,
  });
  for (const job of due) {
    if (isStopping()) break;
    try {
      const needed = await wanted(s, job);
      const entry = needed ? await verify(s, job) : null;
      const errors = readState(s).errors[errorKey(job)];
      if (job.nightly && (entry || (!needed && !(errors?.count > 0)))) {
        const state = readState(s);
        state.codeqlNightly = job.nightly;
        writeState(s, state);
      }
      if (entry)
        process.stdout.write(`${entry.check} ${entry.conclusion} ${job.repo}@${job.sha}\n`);
    } catch (error) {
      failed++;
      process.stderr.write(`stackra-verify: ${job.repo}@${job.sha} codeql: ${error.message}\n`);
    }
  }
  return failed;
}

async function once(s, repo) {
  pruneLogs(s);
  let failed = 0;
  const jobs = await heads(s, repo);
  for (const job of jobs) {
    if (isStopping()) break;
    // stackra/verify first, then stackra/verify-mobile: separate runs, separate check runs, separate errors.
    const results = await runKinds(job, PER_HEAD_KINDS, async (kindJob) => {
      if (isStopping() || !(await wanted(s, kindJob))) return null;
      const entry = await verify(s, kindJob);
      if (entry)
        process.stdout.write(
          `${entry.check} ${entry.conclusion} ${repo}@${job.sha}${job.pr ? ` #${job.pr}` : ""}\n`,
        );
      return entry;
    });
    for (const [kind, result] of Object.entries(results))
      if (result?.error) {
        failed++;
        process.stderr.write(`stackra-verify: ${repo}@${job.sha} ${kind}: ${result.error}\n`);
      }
  }
  if (s.codeqlBundleUrl) failed += await codeqlPass(s, jobs);
  return failed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    process.stderr.write(
      "usage: stackra-verify.mjs run --sha <sha> [--pr <n>] | once | daemon [--interval <s>]  [-R owner/repo] | self-check\n",
    );
    process.exit(2);
  }
  const s = settings();
  const { keyMode, licenceMode } = secretModes(s, statSync, process.getuid());
  if (options.verb === "self-check") {
    // This file's own check before the running service switches to it (selfUpdate): no lock, no job, no write.
    const problems = selfCheck({
      s,
      keyMode,
      licenceMode,
      filesystem: () => [
        ...filesystemProblems(s, hostIo(s), operatorForbidden()),
        ...[yamlProblem(CODE_DIR)].filter(Boolean),
      ],
      runTests: () =>
        spawnSync(
          process.execPath,
          [
            "--test",
            `--test-name-pattern=${SELF_CHECK_TESTS.source}`,
            join(CODE_DIR, "tools", "scripts", "__tests__", "stackra-verify.test.mjs"),
          ],
          spawnOptions({ cwd: CODE_DIR, timeout: 5 * 60_000 }),
        ),
    });
    process.stdout.write(
      problems.length
        ? `stackra-verify self-check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`
        : "stackra-verify self-check passed\n",
    );
    process.exit(problems.length ? 1 : 0);
  }
  const problems = hostProblems(s, keyMode, licenceMode);
  if (!problems.length) {
    mkdirSync(s.home, { recursive: true, mode: 0o711 });
    chmodSync(s.home, 0o711);
    writeFileSync(join(s.home, "docker.env"), dockerEnvFile(s), { mode: 0o644 });
    writeFileSync(join(s.home, "preflight.env"), CONTAINER_ENV, { mode: 0o644 });
    problems.push(...preflight(s));
  }
  if (problems.length) {
    process.stderr.write(
      `stackra-verify: this host is not set up:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`,
    );
    process.exit(1);
  }
  if (process.env.STACKRA_VERIFY_LOCKED !== "1") {
    // One service per box: a shell holds the flock for the service's whole life, restarts included (lockedShell).
    mkdirSync(s.home, { recursive: true, mode: 0o711 });
    // The parent forwards stop signals to the locked shell (which passes them on) and waits for it to end.
    const child = spawnChild(
      "/bin/sh",
      lockedShell(join(s.home, "lock"), [process.execPath, ...process.argv.slice(1)]),
      { stdio: "inherit", env: { ...process.env, STACKRA_VERIFY_LOCKED: "1" } },
    );
    for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
    child.on("close", (code) => {
      if (code === LOCK_HELD_EXIT)
        process.stderr.write("stackra-verify: another verify service holds the lock\n");
      process.exit(code ?? 1);
    });
  } else {
    await runLocked(options, s);
  }
}

/**
 * selfUpdate on this service: main from GitHub over the App's read access (a token in the fetch's environment only),
 * the ledger at `<home>/ledger/service.jsonl`, and a refusal kept in the state so the next jobs' neutral names it.
 */
async function serviceUpdate(s, busy) {
  mkdirSync(join(s.home, "ledger"), { recursive: true, mode: 0o700 });
  const ledgerPath = join(s.home, "ledger", "service.jsonl");
  let env = {};
  try {
    const token = await appToken(s);
    env = {
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`,
    };
  } catch (error) {
    serviceLog(`self-update: no App token (${error.message}); fetching main without it`);
  }
  const result = selfUpdate({
    clone: CODE_DIR,
    remote: `https://github.com/${DEFAULT_REPO}.git`,
    home: s.home,
    busy,
    own: LOADED_BLOBS,
    env,
    ledger: (entry) =>
      appendFileSync(ledgerPath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`),
    runSelfCheck: (dir) =>
      spawnSync(
        process.execPath,
        [join(dir, SELF_PATH), "self-check"],
        spawnOptions({ cwd: dir, timeout: 10 * 60_000 }),
      ),
  });
  const state = readState(s);
  if (result.action === "refuse")
    state.selfUpdate = { refused: result.reason, at: Date.now(), main: result.main ?? null };
  else delete state.selfUpdate;
  writeState(s, state);
  return result;
}

async function runLocked(options, s) {
  process.on("SIGINT", onStop);
  process.on("SIGTERM", onStop);
  try {
    if (options.verb === "run") {
      const job = { repo: options.repo, sha: options.sha, pr: options.pr };
      const results = await runKinds(job, PER_HEAD_KINDS, (kindJob) => verify(s, kindJob));
      for (const [kind, entry] of Object.entries(results))
        process.stdout.write(
          `${KINDS[kind].check} ${entry?.error ? `error: ${entry.error}` : entry ? entry.conclusion : "not recorded"} ${options.repo}@${options.sha}\n`,
        );
    } else {
      let failed = 0;
      // The same stop as at start: the problems on stderr, no job runs, exit 1.
      const stop = (problems) => {
        process.stderr.write(
          `stackra-verify: this host is not set up:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`,
        );
        process.exitCode = 1;
        onStop();
      };
      const pass = () =>
        servicePass(options.repos, {
          recheck: () => recheckHost(s),
          stop,
          run: async (repo) => {
            if (options.verb === "once") failed += await once(s, repo);
            else
              await once(s, repo).catch((error) =>
                process.stderr.write(`stackra-verify: ${error.message}\n`),
              );
          },
        });
      if (options.verb === "once") {
        if (await pass()) process.exitCode = failed ? 1 : 0;
      } else
        while (!isStopping()) {
          // Between passes only: follow main, then let the lock holder start the new code (RESTART_EXIT).
          if ((await serviceUpdate(s, activeKill !== null)).action === "update") {
            process.exitCode = RESTART_EXIT;
            break;
          }
          if (!(await pass())) break;
          if (!isStopping()) await sleep(options.interval * 1000);
        }
    }
  } catch (error) {
    process.stderr.write(`stackra-verify: ${error.message}\n`);
    process.exitCode = 1;
  }
}
