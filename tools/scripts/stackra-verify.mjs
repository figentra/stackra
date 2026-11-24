#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the Stackra verify service (STA-2761, replaces the merge-now rule STA-2083). For a head SHA it runs
 *   `pnpm install --frozen-lockfile` and then `pnpm verify` (format, lint, typecheck, test, build, validate,
 *   boundaries, knip) in a throwaway container, and records the result as a `stackra/verify` check run posted by the
 *   stackra-verify GitHub App, plus a ledger line. `pr-merge.mjs` refuses a merge without a successful check run from
 *   that App on the PR's current head.
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
 *   Start it directly (`node tools/scripts/stackra-verify.mjs daemon …` from systemd), never through secrets-exec:
 *   it needs no stackra-bot secret, only its own key file.
 *   Licensed builds (uniwind-pro): the daemon builds them into the store image from main's versions, with the licence
 *   token as a BuildKit secret (piped on stdin, never a file, ENV, ARG or layer), scans the image history and every
 *   layer for the token and refuses the image if it is there, and PR installs only copy the built output. The store
 *   image is for this box only: it is never pushed to or published in any registry (licence: our own use).
 * Runtime: node on Linux with flock, sudo, git, and docker for the verify user.
 * Governing contract: ADR 0119 (merge policy); ADR 0523 (decision 3); STA-2761.
 * Secrets: the App key is read from STACKRA_VERIFY_KEY_FILE (owner-placed, mode 0400) only to mint a token, which
 *   stays in the gh child's environment. No secret is passed to sudo, docker or a container.
 * Exit: 0 every head recorded, 1 a head could not be recorded or the host is not set up, 2 usage, 75 lock held.
 */
import { spawn as spawnChild, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statfsSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as botNetwork from "./bot-token.mjs";
import { gh, isVerifyOverlay, VERIFY_APP, VERIFY_CHECK } from "./pr-merge.mjs";

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

/**
 * The install: no lifecycle script and no pnpmfile from the PR; then only main's allowed builds that need no
 * licence; then each licensed package is laid in from the store image's prebuilt copy (`/prebuilt/<name>@<version>`),
 * or the install exits NEEDS_STORE_REBUILD_EXIT when the PR resolves a version the store image has not built.
 */
export function installCommand(builds, licensed = LICENSED_BUILDS) {
  const free = builds.filter((b) => !licensed.includes(b));
  const steps = [INSTALL_COMMAND];
  if (free.length) steps.push(`pnpm rebuild ${free.join(" ")}`);
  for (const name of licensed.filter((l) => builds.includes(l)))
    steps.push(
      `for d in node_modules/.pnpm/${name}@*/node_modules/${name}; do [ -e "$d" ] || continue; ` +
        `v=$(node -p "require('./$d/package.json').version"); ` +
        `[ -d "/prebuilt/${name}@$v" ] || exit ${NEEDS_STORE_REBUILD_EXIT}; cp -a "/prebuilt/${name}@$v/." "$d/"; done`,
    );
  return steps.join(" && ");
}
export const VERIFY_COMMAND = "pnpm verify";
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

// ---- arguments and settings ---------------------------------------------------------------------------------

/** `<verb> [flags]` → options, or null on a usage error. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== "--");
  const verb = args.shift();
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
  for (const [name, value] of [
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
  "HOME=/home/run\nCI=1\nTURBO_TELEMETRY_DISABLED=1\nFORCE_COLOR=0\nLANG=C.UTF-8\nTZ=UTC\n";

/** The limits every PR container runs with; `envFile` holds CONTAINER_ENV. */
export const containerLimits = (s, envFile) => [
  "--cpus",
  s.cpus,
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
export const installArgs = (s, { name, image, tarPath, envFile, network, builds = [] }) => [
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
  `set -e; tar -xf /in/src.tar -C /work; cd /work; ${installCommand(builds)}`,
];

/** The hosts the install's proxy lets through, on port 443 only: the package registries. */
export const REGISTRY_HOSTS = ["registry.npmjs.org", "npm.stackra.figentra.com"];
export const PROXY_PORT = 3128;

/**
 * The allowlisting proxy: the install container sits on an `--internal` network whose only way out is this proxy,
 * which answers CONNECT to an allowed host on 443 and refuses everything else (403), including any address literal.
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
    `server.listen(${port}, "0.0.0.0");`,
  ].join("\n");
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

/** The verify container: the committed install, the tree unpacked again (read-only archive), no network. */
export const verifyArgs = (s, { name, image, envFile, tarPath }) => [
  "run",
  "--name",
  name,
  "--network",
  "none",
  ...containerLimits(s, envFile),
  "--volume",
  `${tarPath}:/in/src.tar:ro`,
  "--workdir",
  "/work",
  image,
  "sh",
  "-c",
  `${VERIFY_PREPARE}; ${VERIFY_COMMAND}`,
];

/** The warm store image's tag, from the lockfile it was fetched for. */
export const storeTag = (lockfile, baseImage = "") =>
  `stackra-verify-store:${createHash("sha256").update(baseImage).update("\0").update(lockfile).digest("hex").slice(0, 16)}`;

/** The warm store: main's lockfile fetched into /store on top of the pinned base, built by the daemon only. */
export function storeDockerfile({ baseImage, pnpmVersion }) {
  if (!DIGEST_PINNED.test(baseImage)) throw new Error("the base image must be pinned by digest");
  if (!/^\d+\.\d+\.\d+$/.test(pnpmVersion)) throw new Error(`not a pnpm version: ${pnpmVersion}`);
  return [
    `FROM ${baseImage}`,
    "ENV CI=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0 COREPACK_HOME=/opt/corepack",
    `RUN corepack enable && corepack prepare pnpm@${pnpmVersion} --activate && chmod -R a+rX /opt/corepack`,
    "RUN git --version && tar --version",
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

/** A package.json text with `scripts` taken from main's copy: the PR keeps its dependencies, never its commands. */
export function withMainScripts(headText, mainText) {
  const head = JSON.parse(headText);
  const main = JSON.parse(mainText);
  if (main.scripts === undefined) delete head.scripts;
  else head.scripts = main.scripts;
  return `${JSON.stringify(head, null, 2)}\n`;
}

/** The paths of `tree` (ls-tree lines) that take main's copy: verify-definition files, and package.json scripts. */
export function overlayPlan(mergedPaths, mainEntries) {
  const main = new Map(mainEntries.map((e) => [e.path, e]));
  const whole = [...main.values()].filter((e) => isVerifyOverlay(e.path));
  const scripts = mergedPaths.filter(
    (p) => /(?:^|\/)package\.json$/.test(p) && main.has(p) && !isVerifyOverlay(p),
  );
  return { whole, scripts };
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
export const recordedRun = (checkRuns, sha, appId, base) =>
  checkRuns.find(
    (r) =>
      r.name === VERIFY_CHECK &&
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
export function needsRun({ checkRuns, sha, appId, base, errors = { count: 0 } }, now = Date.now()) {
  if (recordedRun(checkRuns, sha, appId, base)) return false;
  // A run against an older main stands while it is fresh: re-verifying every PR on every main merge, one verify at a
  // time, would never finish. The merge queue's own commit verify is the gate that sees the latest main.
  const fresh = recordedRun(checkRuns, sha, appId);
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

/**
 * The check run body. The verdict and the title come only from the result (`conclusion`, `phase`, `reason`); the
 * log is shown, never read for a verdict. It carries no environment and no secret.
 */
export function checkRunBody({
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
  const verdict =
    conclusion === "success"
      ? "pnpm verify passed"
      : conclusion === "neutral"
        ? `could not run (${reason})`
        : phase === "merge"
          ? "the PR conflicts with main"
          : phase === "install"
            ? "pnpm install failed"
            : reason === "time limit"
              ? "pnpm verify hit the time limit"
              : "pnpm verify failed";
  return {
    name: VERIFY_CHECK,
    head_sha: sha,
    external_id: base ? `base:${base}` : undefined,
    status: "completed",
    conclusion,
    started_at: startedAt,
    completed_at: completedAt,
    output: {
      title: `${verdict} in ${formatDuration(durationMs)}`,
      summary: [
        `- Commands: \`${INSTALL_COMMAND}\` (network), then \`${VERIFY_COMMAND}\` (no network)`,
        `- Box: ${box}; throwaway containers; the result is the container's exit code`,
        `- Head: \`${sha}\`, merged onto main \`${base ?? "-"}\` with main's verify definition (scripts, configs, presets)`,
      ].join("\n"),
      text: `\`\`\`text\n${logTail(log)}\n\`\`\``,
    },
  };
}

/** One ledger entry: JSON (the machine copy) and a markdown row (the human copy). */
export function ledgerEntry({
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
    install: INSTALL_COMMAND,
    command: VERIFY_COMMAND,
    conclusion,
    phase: phase ?? null,
    reason: reason ?? null,
    durationMs,
    box,
    link: link ?? null,
    posted,
  };
  const result = `${conclusion ?? "error"}${reason ? ` (${reason})` : ""}${posted ? "" : ", not posted"}`;
  const md = `| ${at} | ${repo} | ${pr ? `#${pr}` : "main"} | \`${sha.slice(0, 12)}\` | ${result} | ${formatDuration(durationMs)} | ${link ?? "-"} |`;
  return { json, md };
}

export const LEDGER_HEADER =
  "| at | repo | PR | SHA | result | duration | check run |\n| --- | --- | --- | --- | --- | --- | --- |";

// ---- the job --------------------------------------------------------------------------------------------------

/**
 * Runs one verify of `job` ({ repo, sha, pr }) with the side effects in `deps`, and returns what to record:
 *   { post: false, error, stopped } — an infrastructure error or a stop: nothing is posted;
 *   { post: false, moved: true }     — the PR's head moved during the run: nothing is posted, it runs again;
 *   { post: true, conclusion, phase, reason, log } — a result the container's exit code decided.
 * `deps`: archive(job) → tarPath; storeImage(job) → image; docker(args) → { code, stdout } (sync, as the verify
 * user); runContainer(args, name) → Promise<{ code }> (the docker client's exit); exitCodeOf(name) → number or null
 * (the container's own exit code; null when it never started); kill(name); cleanUp(names, images); headOf(job) →
 * current head SHA or null (main: the job's own SHA); readLog() → string; stopping() → boolean; timeoutMs;
 * setTimer(fn, ms) → cancel.
 */
export async function runJob(job, deps) {
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
      throw error;
    }
    const store = await deps.storeImage(job);
    const envFile = deps.envFile;

    const net = deps.network({ id, image: store, proxyName, network });
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
        builds: deps.builds(),
      }),
      install,
    );
    if (deps.stopping() && !installTimedOut) return { post: false, stopped: true };
    if (installTimedOut)
      return settle(job, deps, { conclusion: "failure", phase: "install", reason: "time limit" });
    const installExit = deps.exitCodeOf(install);
    if (installExit === null) return { post: false, error: "the install container did not start" };
    // The licensed image is built for exactly the versions this tree locks, so a missing build is the service's
    // fault: an error (retried), never the PR's pass, fail or neutral.
    if (installExit === NEEDS_STORE_REBUILD_EXIT)
      return { post: false, error: "a licensed build is missing from the run image" };
    if (installExit !== 0) return settle(job, deps, { conclusion: "failure", phase: "install" });

    const commit = deps.docker(["commit", install, runImage]);
    if (commit.code !== 0) return { post: false, error: "could not commit the install container" };

    const verifyTimedOut = await limited(
      verifyArgs(s, { name: check, image: runImage, envFile, tarPath }),
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
  "/work/academorix",
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
 * The host checks that need the machine, through `io` so a test can stand in: `exists(path)`, `canRead(path)` (as the
 * verify user), `cgroup(file)` (the verify user's slice, null when missing) and `dockerInfo()` ({ code, stdout }).
 * The verify user can read none of the forbidden paths, its slice has CPU, memory and task caps, and its Docker is
 * rootless. Each problem is a reason not to start.
 */
export function preflightProblems(s, io, extraForbidden = []) {
  const problems = [];
  const forbidden = [
    s.keyFile,
    s.licenceFile,
    s.home,
    ...FORBIDDEN_DEFAULTS,
    ...extraForbidden,
  ].filter(Boolean);
  for (const path of forbidden)
    if (io.exists(path) && io.canRead(path))
      problems.push(`the verify user ${s.runAs} can read ${path}`);
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

function preflight(s) {
  const uid = spawnSync("id", ["-u", s.runAs], spawnOptions({ timeout: 30_000 })).stdout?.trim();
  return preflightProblems(
    s,
    {
      exists: existsSync,
      // STACKRA_VERIFY_HOME is 0711: the verify user may pass through it to a run's archive, never list or read it.
      canRead: (path) =>
        spawnSync(
          "sudo",
          ["-n", "-u", s.runAs, "--", "test", "-r", path],
          spawnOptions({ timeout: 30_000 }),
        ).status === 0,
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
    },
    [process.env.HOME, ...(process.env.STACKRA_VERIFY_FORBIDDEN?.split(",").filter(Boolean) ?? [])],
  );
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
 * The tree that is tested: the PR head merged onto `base` (main), then main's verify definition laid over it, so a
 * PR can neither skip a check nor redefine one. Built in a scratch index of the daemon's mirror; a merge conflict
 * throws `{ conflict: true }`, which is the PR's failure.
 */
export function buildTree(mirror, base, sha, scratchIndex) {
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
  const { whole, scripts } = overlayPlan(
    mergedEntries.map((e) => e.path),
    mainEntries,
  );
  const mergedByPath = new Map(mergedEntries.map((e) => [e.path, e]));
  const mainByPath = new Map(mainEntries.map((e) => [e.path, e]));
  git(mirror, ["read-tree", merged], { index: scratchIndex });
  const lines = whole.map((e) => `${e.mode} ${e.object}\t${e.path}`);
  for (const path of scripts) {
    const text = withMainScripts(
      git(mirror, ["cat-file", "blob", mergedByPath.get(path).object]),
      git(mirror, ["cat-file", "blob", mainByPath.get(path).object]),
    );
    const object = git(mirror, ["hash-object", "-w", "--stdin"], { input: text }).trim();
    lines.push(`${mergedByPath.get(path).mode} ${object}\t${path}`);
  }
  if (lines.length)
    git(mirror, ["update-index", "--index-info"], {
      index: scratchIndex,
      input: `${lines.join("\n")}\n`,
    });
  return git(mirror, ["write-tree"], { index: scratchIndex }).trim();
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

/** The daemon's mirror of `repo`, fetched; the tested tree built and archived; `job.base` set to main's head. */
function archiveJob(s, job, runDir) {
  const mirror = join(s.home, "mirror", job.repo.replace("/", "__"));
  if (!existsSync(join(mirror, "HEAD")))
    sh("git", ["clone", "--quiet", "--bare", `https://github.com/${job.repo}.git`, mirror], {
      env: gitEnv(),
    });
  git(mirror, ["fetch", "--quiet", "--no-tags", "origin", ...fetchRefs(job)]);
  git(mirror, ["rev-parse", "--verify", `${job.sha}^{commit}`]);
  job.base ??= git(mirror, ["rev-parse", "--verify", "refs/heads/main^{commit}"]).trim();
  try {
    const tree = buildTree(mirror, job.base, job.sha, join(runDir, "index"));
    const tarPath = join(runDir, "src.tar");
    neutraliseAttributes(mirror);
    git(mirror, ["archive", "--format=tar", "-o", tarPath, tree]);
    chmodSync(tarPath, 0o644);
    return { tarPath, mirror, tree };
  } finally {
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
function ensureStore(s, mirror, base, runDir, state) {
  const pull = docker(s, ["pull", "--quiet", s.baseImage]);
  if (pull.code !== 0)
    throw new Error(`could not pull the pinned base image: ${pull.stderr.trim()}`);
  const ctx = join(runDir, "store-context");
  mkdirSync(ctx, { recursive: true, mode: 0o755 });
  for (const file of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"])
    writeFileSync(join(ctx, file), git(mirror, ["show", `${base}:${file}`]), { mode: 0o644 });
  const lockfile = readFileSync(join(ctx, "pnpm-lock.yaml"));
  const tag = storeTag(lockfile, s.baseImage);
  const recorded = state.stores[tag];
  const current = docker(s, ["image", "inspect", "--format", "{{.Id}}", tag]).stdout.trim();
  if (storeReusable({ recordedId: recorded?.id, currentId: current, builtAt: recorded?.builtAt }))
    return tag;
  const dockerfile = storeDockerfile({
    baseImage: s.baseImage,
    pnpmVersion: pnpmVersionOf(readFileSync(join(ctx, "package.json"), "utf8")),
  });
  writeFileSync(join(ctx, "Dockerfile"), dockerfile, { mode: 0o644 });
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
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const name = `${job.repo.replace("/", "__")}-${job.sha}`;
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
      const { tarPath, mirror, tree } = archiveJob(s, job, runDir);
      deps.mirror = mirror;
      deps.tree = tree;
      deps.buildList = allowedBuilds(git(mirror, ["show", `${job.base}:pnpm-workspace.yaml`]));
      return tarPath;
    },
    builds: () => deps.buildList ?? [],
    network: ({ image, proxyName, network }) => {
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
    storeImage: async () => {
      const store = ensureStore(s, deps.mirror, job.base, runDir, state);
      const lockText = git(deps.mirror, ["show", `${deps.tree}:pnpm-lock.yaml`]);
      const builds = allowedBuilds(git(deps.mirror, ["show", `${job.base}:pnpm-workspace.yaml`]));
      return ensureLicensed(s, store, licensedPackagesFor(lockText, builds), runDir, state);
    },
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

  const key = `${job.repo}@${job.sha}`;
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
    .map((p) => ({ repo, sha: p.head.sha, pr: String(p.number), base: main }));
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
        `repos/${job.repo}/commits/${job.sha}/check-runs?check_name=${encodeURIComponent(VERIFY_CHECK)}&filter=all&per_page=100`,
      ],
      token,
      true,
    ),
  ).check_runs;
  const errors = readState(s).errors[`${job.repo}@${job.sha}`];
  return needsRun({ checkRuns: runs, sha: job.sha, appId: s.appId, base: job.base, errors });
}

function pruneLogs(s) {
  const logs = join(s.home, "logs");
  if (!existsSync(logs)) return;
  for (const file of readdirSync(logs)) {
    const path = join(logs, file);
    if (Date.now() - statSync(path).mtimeMs > LOG_KEEP_MS) rmSync(path, { force: true });
  }
}

async function once(s, repo) {
  pruneLogs(s);
  let failed = 0;
  for (const job of await heads(s, repo)) {
    if (isStopping()) break;
    try {
      if (!(await wanted(s, job))) continue;
      const entry = await verify(s, job);
      if (entry)
        process.stdout.write(
          `${entry.conclusion} ${repo}@${job.sha}${job.pr ? ` #${job.pr}` : ""}\n`,
        );
    } catch (error) {
      failed++;
      process.stderr.write(`stackra-verify: ${repo}@${job.sha}: ${error.message}\n`);
    }
  }
  return failed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    process.stderr.write(
      "usage: stackra-verify.mjs run --sha <sha> [--pr <n>] | once | daemon [--interval <s>]  [-R owner/repo]\n",
    );
    process.exit(2);
  }
  const s = settings();
  const { keyMode, licenceMode } = secretModes(s, statSync, process.getuid());
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
    // One service per box: hold an flock for the whole life of the real process, released by the kernel on exit.
    mkdirSync(s.home, { recursive: true, mode: 0o711 });
    // The parent forwards stop signals to the locked child and waits for it, so the child's clean-up finishes.
    const child = spawnChild(
      "flock",
      [
        "-n",
        "-E",
        String(LOCK_HELD_EXIT),
        join(s.home, "lock"),
        process.execPath,
        ...process.argv.slice(1),
      ],
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

async function runLocked(options, s) {
  process.on("SIGINT", onStop);
  process.on("SIGTERM", onStop);
  try {
    if (options.verb === "run") {
      const entry = await verify(s, { repo: options.repo, sha: options.sha, pr: options.pr });
      process.stdout.write(
        `${entry ? entry.conclusion : "not recorded"} ${options.repo}@${options.sha}\n`,
      );
    } else if (options.verb === "once") {
      let failed = 0;
      for (const repo of options.repos) failed += await once(s, repo);
      process.exitCode = failed ? 1 : 0;
    } else {
      while (!isStopping()) {
        for (const repo of options.repos)
          await once(s, repo).catch((error) =>
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
