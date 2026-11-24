/**
 * Stackra file contract:
 * Purpose: hold `stackra-verify.mjs` to the CTO's rulings of 2026-11-24 (STA-2761). Each protection has a test that
 *          fails when the protection is removed: the verify definition comes from main and is re-laid before verify,
 *          installs run no PR script or pnpmfile, the install network reaches only allowlisted registries through the
 *          proxy (metadata, host and docker0 refused), replace refs and export-ignore never change the tested tree,
 *          the verdict is the container's exit code, the SHA is bound and checked against current main, one time
 *          limit kills the container, nothing crosses sudo or docker as a value, PR code runs as a non-root user with
 *          no socket, network or secret, the clean-up prunes everything but the kept images, a changed or old store
 *          image is rebuilt, the preflight refuses an unsafe host, and only our App's run counts.
 * Boundary: pure functions, `runJob` with fakes, the proxy and probe scripts against local sockets, and `buildTree`
 *           and `git archive` on temporary repositories; no Docker, sudo, gh or network.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy); STA-2761.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createConnection, createServer } from "node:net";
import { PassThrough } from "node:stream";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  allowedBuilds,
  refsToDelete,
  persistenceCheck,
  licensedPackagesFor,
  licenceSecret,
  stopIfUnsafe,
  secretPatterns,
  secretModes,
  pruneLicensed,
  MAX_LICENSED_PER_TREE,
  isFresh,
  subuidOverlap,
  registerSecret,
  probeVerdict,
  ownedMode,
  outcome,
  lockedPackages,
  licensedDockerfile,
  keepIdsFrom,
  imageCarries,
  FRESH_MS,
  fetchRefs,
  buildTree,
  cappedLog,
  checkRunBody,
  cleanupPlan,
  CONTAINER_ENV,
  DEFAULT_REPO,
  dockerAs,
  dockerEnvFile,
  ERROR_RETRY_MS,
  exitFromInspect,
  formatDuration,
  hostProblems,
  imagesToRemove,
  installArgs,
  installCommand,
  licensedScript,
  lockedVersions,
  needleScanner,
  NEEDS_STORE_REBUILD_EXIT,
  jobsFrom,
  ledgerEntry,
  logTail,
  MAX_ERROR_ATTEMPTS,
  needsRun,
  neutraliseAttributes,
  OUTPUT_TEXT_MAX,
  overlayPlan,
  parseArgs,
  pnpmVersionOf,
  postCheckRun,
  preflightProblems,
  filesystemProblems,
  servicePass,
  probeArgs,
  probeScript,
  probeTargets,
  proxyArgs,
  proxyEnv,
  proxyScript,
  runJob,
  scrub,
  settings,
  STORE_MAX_AGE_MS,
  storeDockerfile,
  storeReusable,
  storeTag,
  verifyArgs,
  withMainScripts,
  FORBIDDEN_DEFAULTS,
  GATE_FILTERS,
  GATE_STEPS,
  CODEQL_LABELS,
  PER_HEAD_KINDS,
  codeqlJobs,
  codeqlResults,
  codeqlScript,
  KINDS,
  TOOLS,
  VERIFY_PREPARE,
  downloadVerified,
  errorKey,
  historyRefs,
  kindFiles,
  kindMounts,
  osvDbPath,
  osvDbProblem,
  outputText,
  prFacts,
  runKinds,
  toolFile,
  toolInstallScript,
  toolShaSetting,
  toolsFingerprint,
  MOBILE_STEPS,
  gatePrepare,
  gateScript,
  licenceCheckSource,
  licenceViolations,
  untilLine,
  childLine,
  SERVICE_FILES,
  LOADED_BLOBS,
  gitBlobId,
  LOCK_HELD_EXIT,
  selfUpdatePlan,
  selfCheckProblem,
  selfUpdate,
  selfCheck,
  lockedShell,
  RESTART_EXIT,
  SELF_PATH,
  SELF_CHECK_TESTS,
  CODE_DIR,
  OSV_CANARY,
  OSV_CANARY_EVERY_MS,
  osvCanaryArgs,
  osvCanaryDue,
  osvCanaryProblem,
  definitionDrift,
  PROXY_READY,
  exceptionScopeViolations,
  lockfileGraph,
  lockfileScopeViolations,
  lockfileFindings,
  pnpmFindings,
  closureViolations,
  installedMobile,
  memberSetProblems,
  workspaceManifest,
  workspaceMembers,
  MOBILE_MEMBERS,
  mobileScript,
  spdxAllowed,
  stepSections,
} from "../stackra-verify.mjs";
import { VERIFY_APP, isVerifyOverlay } from "../pr-merge.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const BASE = "fedcba9876543210fedcba9876543210fedcba98";
const NOW = Date.parse("2026-11-24T15:00:00Z");
const PINNED = `node@sha256:${"a".repeat(64)}`;
/** The registered stackra-verify App, as the host settings name it. */
const APP_ID = String(VERIFY_APP.id);
const FAKE_INSTALLATION = `${"gh"}s_${"a".repeat(36)}`;
const KEY = (edge) => `-----${edge} RSA ${"PRIVATE"} KEY-----`;
const S = {
  ...settings({}),
  home: "/work/stackra/verify",
  runAs: "stackra-verify",
  dockerHost: "unix:///run/user/1500/docker.sock",
  baseImage: PINNED,
  appId: APP_ID,
  installationId: "77",
  keyFile: "/home/svc/stackra-verify.pem",
  // Stand-in checksums, made at run time (the real ones are owner settings, never in the repository).
  toolSha256: Object.fromEntries(TOOLS.map((t, i) => [t.name, String(i).repeat(64)])),
};
const ENV = "/runs/x/container.env";
const TAR = "/runs/x/src.tar";

/** `host:port` of a listening test server. */
const at = (server) => `127.0.0.1:${server.address().port}`;
/** Runs the probe script in a child without blocking this process, whose test servers must keep answering. */
const runProbe = (targets, proxy, dnsName = "stackra-verify.invalid") =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, ["-e", probeScript(targets, proxy, dnsName)], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.on("close", (status) => resolve({ status, stdout }));
  });
/** The path the verify user must read (the preflight's positive control). */
const CONTROL = "/work/stackra/verify/docker.env";
/**
 * The preflight's machine checks, all passing unless overridden: the verify user reads only the positive control
 * (an override's `canRead` adds to it unless `control: false`) and traverses only the protected roots.
 */
const io = ({ control = true, canRead = () => false, ...over } = {}) => ({
  exists: () => true,
  canRead: (p) => (control && p === CONTROL) || canRead(p),
  canTraverse: (p) => ["/work", "/work/stackra"].includes(p),
  list: () => [],
  cgroup: () => "1000",
  subuid: () => "build:100000:65536\nstackra-verify:300000:65536\n",
  dockerInfo: () => ({ code: 0, stdout: '["name=seccomp","name=rootless"]' }),
  ...over,
});
/** The file names in a tar archive. */
const tarList = (tar) => spawnSync("tar", ["-tf", tar], { encoding: "utf8" }).stdout.split("\n");

/** A fake image reader for imageCarries. */
const imageReader = ({
  history = "RUN sh /tmp/licensed.sh",
  config = "{}",
  files = ["clean bytes"],
  exported = true,
} = {}) => ({
  history: () => ({ code: 0, stdout: history }),
  config: () => ({ code: 0, stdout: config }),
  exportStream: async (_image, onChunk) => {
    for (const f of files) onChunk(Buffer.from(f));
    return exported;
  },
});

/** One locked uniwind-pro version, as a pnpm lockfile writes it. */
const lockEntry = (v) =>
  [`  uniwind-pro@${v}:`, `    resolution: {integrity: sha512-${"B".repeat(86)}==}`].join("\n");

/** A lockfile that locks these uniwind-pro versions. */
const lockWith = (versions) => ["packages:", ...versions.map(lockEntry)].join("\n\n");

test("parseArgs: run needs a full SHA; --in-place and same-user modes are gone; bad input is a usage error", () => {
  assert.equal(parseArgs(["run", "--sha", SHA, "--pr", "12"]).sha, SHA);
  assert.deepEqual(parseArgs(["once"]).repos, [DEFAULT_REPO]);
  assert.deepEqual(parseArgs(["daemon", "-R", "a/b", "-R", "c/d", "--interval", "60"]).repos, [
    "a/b",
    "c/d",
  ]);
  for (const bad of [
    [],
    ["run"],
    ["run", "--sha", "abc"],
    ["run", "--sha", SHA, "--in-place"],
    ["run", "--sha", SHA, "-R", "a/b", "-R", "c/d"],
    ["once", "--pr", "3"],
    ["once", "--interval", "60"],
    ["once", "-R", "../.."],
    ["daemon", "--interval", "5"],
  ])
    assert.equal(parseArgs(bad), null, bad.join(" "));
});

test("hostProblems: no verify user, no rootless Docker, an unpinned base or a key that is not 0400 refuses", () => {
  assert.deepEqual(hostProblems(S, 0o400), []);
  assert.match(hostProblems({ ...S, runAs: null }, 0o400).join(), /RUN_AS is not set/);
  assert.match(hostProblems({ ...S, dockerHost: null }, 0o400).join(), /DOCKER_HOST/);
  assert.match(hostProblems({ ...S, baseImage: "node:24" }, 0o400).join(), /pinned by digest/);
  for (const mode of [0o440, 0o600, 0o644]) assert.match(hostProblems(S, mode).join(), /mode 0400/);
  assert.match(hostProblems(S, null).join(), /not readable/);
  assert.match(hostProblems({ ...S, keyFile: null }, 0o400).join(), /required/);
  assert.match(hostProblems({ ...S, appId: "4242" }, 0o400).join(), /differs from VERIFY_APP\.id/);
  const sameUser = settings({ STACKRA_VERIFY_SAME_USER: "1" });
  assert.equal("sameUser" in sameUser, false);
  assert.match(hostProblems(sameUser, 0o400).join(), /RUN_AS is not set/);
});

test("preflight: a readable forbidden path, a slice without caps or Docker that is not rootless refuses", () => {
  assert.deepEqual(preflightProblems(S, io()), []);
  assert.match(
    preflightProblems(S, io({ canRead: (p) => p === "/var/run/docker.sock" })).join(),
    /can read \/var\/run\/docker\.sock/,
  );
  assert.match(
    preflightProblems(S, io({ canRead: (p) => p === S.keyFile })).join(),
    /can read \/home\/svc/,
  );
  assert.match(
    preflightProblems(S, io({ canRead: (p) => p === "/x" }), ["/x"]).join(),
    /can read \/x/,
  );
  assert.match(
    preflightProblems(S, io({ cgroup: (f) => (f === "memory.max" ? "max" : "1") })).join(),
    /memory\.max/,
  );
  assert.match(preflightProblems(S, io({ cgroup: () => null })).join(), /pids\.max/);
  assert.match(
    preflightProblems(S, io({ dockerInfo: () => ({ code: 0, stdout: "[]" }) })).join(),
    /not rootless/,
  );
  assert.match(
    preflightProblems(S, io({ dockerInfo: () => ({ code: 1, stdout: "" }) })).join(),
    /does not answer/,
  );
});

test("dockerAs: every docker call runs as the verify user, and no value crosses sudo as an argument", () => {
  const argv = dockerAs(S, ["ps", "-aq"]);
  assert.deepEqual(argv.slice(0, 5), ["sudo", "-n", "-u", "stackra-verify", "--"]);
  assert.deepEqual(argv.slice(-2), ["ps", "-aq"]);
  assert.equal(argv.includes("/work/stackra/verify/docker.env"), true);
  assert.equal(
    argv.some((a) => /^(?:PATH|DOCKER_HOST|HOME)=/.test(a)),
    false,
  );
  assert.equal(dockerEnvFile(S), `PATH=${S.path}\nDOCKER_HOST=${S.dockerHost}\n`);
});

test("containers: non-root, no socket or host path but the read-only archive, no secret, capped", () => {
  const install = installArgs(S, {
    name: "i",
    image: "store",
    tarPath: TAR,
    envFile: ENV,
    network: "sv-net-x",
    builds: ["esbuild"],
  });
  const check = verifyArgs(S, { name: "v", image: "run", envFile: ENV, tarPath: TAR });
  const probe = probeArgs(S, {
    name: "p",
    image: "store",
    envFile: ENV,
    targets: ["1.2.3.4:5"],
    network: "sv-net-x",
    proxy: "proxy:3128",
  });
  const proxy = proxyArgs(S, {
    name: "x",
    image: "store",
    envFile: ENV,
    allow: ["registry.npmjs.org"],
  });
  for (const argv of [install, check, probe, proxy]) {
    const joined = argv.join(" ");
    assert.doesNotMatch(
      joined,
      /docker\.sock|--privileged|--network host|--pid[= ]|--ipc[= ]host|\.ssh|\.claude|\/home\/build/,
    );
    assert.equal(argv[argv.indexOf("--cap-drop") + 1], "ALL");
    assert.equal(argv[argv.indexOf("--security-opt") + 1], "no-new-privileges");
    assert.equal(argv[argv.indexOf("--user") + 1], "1000:1000");
    assert.equal(argv[argv.indexOf("--memory") + 1], argv[argv.indexOf("--memory-swap") + 1]);
    assert.ok(Number(argv[argv.indexOf("--pids-limit") + 1]) > 0);
    assert.equal(argv[argv.indexOf("--env-file") + 1], ENV);
    assert.equal(
      argv.slice(0, argv.indexOf("--env-file")).filter((a) => a === "--env" || a === "-e").length,
      0,
    );
    assert.equal(argv.includes("--env"), false);
  }
  for (const argv of [install, check]) {
    assert.equal(argv.filter((a) => a === "--volume").length, 1);
    assert.equal(argv[argv.indexOf("--volume") + 1], `${TAR}:/in/src.tar:ro`);
  }
  assert.equal(probe.includes("--volume") || proxy.includes("--volume"), false);
  assert.equal(install[install.indexOf("--network") + 1], "sv-net-x");
  assert.equal(probe[probe.indexOf("--network") + 1], "sv-net-x");
  assert.equal(check[check.indexOf("--network") + 1], "none");
  assert.equal(proxy[proxy.indexOf("--network") + 1], "bridge");
  assert.doesNotMatch(CONTAINER_ENV, /TOKEN|KEY|SECRET|PASSWORD|NPM_|GH_/);
  assert.match(proxyEnv("http://proxy:3128"), /^HTTPS_PROXY=http:\/\/proxy:3128$/m);
});

test("install: no PR lifecycle script or pnpmfile; only main's allowed builds run, by checked name", () => {
  const install = installArgs(S, {
    name: "i",
    image: "store",
    tarPath: TAR,
    envFile: ENV,
    network: "n",
    builds: ["esbuild", "@shopify/react-native-skia"],
  });
  assert.match(
    install.at(-1),
    /pnpm install --frozen-lockfile --store-dir \/store --ignore-scripts --ignore-pnpmfile && pnpm rebuild esbuild @shopify\/react-native-skia$/,
  );
  const none = installArgs(S, {
    name: "i",
    image: "store",
    tarPath: TAR,
    envFile: ENV,
    network: "n",
    builds: [],
  });
  assert.match(none.at(-1), /--ignore-scripts --ignore-pnpmfile$/);
  const yaml = [
    "catalogMode: strict",
    "allowBuilds:",
    "  esbuild: true",
    "  # a comment",
    "  lefthook: false",
    '  "sharp": true',
    "  evil; rm -rf /: true",
    "onlyBuiltDependencies:",
    "  - workerd",
    "  - '@scope/pkg'",
    "overrides:",
    "  x: 1",
  ].join("\n");
  assert.deepEqual(allowedBuilds(yaml), ["esbuild", "sharp", "workerd", "@scope/pkg"]);
});

test("verify: the tested tree is unpacked again over /work and committed (the gate: as a merge onto main) before the kind's script", () => {
  const check = verifyArgs(S, { name: "v", image: "run", envFile: ENV, tarPath: TAR });
  assert.match(
    check.at(-1),
    /^set -e; tar -xf \/in\/src\.tar -C \/work; cd \/work; rm -rf \.git; git init -q; git fetch -q --no-tags \/in\/history\.bundle .*; git update-ref HEAD "\$commit"; git reset -q; bash \/in\/gate\.sh$/,
  );
  const mobile = verifyArgs(S, {
    name: "v",
    image: "run",
    envFile: ENV,
    tarPath: TAR,
    command: "bash /in/mobile.sh",
    prepare: VERIFY_PREPARE,
  });
  assert.match(
    mobile.at(-1),
    /^set -e; tar -xf \/in\/src\.tar -C \/work; cd \/work; rm -rf \.git; git init -q; git add -A; .* commit -qm tested --no-verify; bash \/in\/mobile\.sh$/,
  );
});

/**
 * The proxy on a port the system picks, once it has said it listens (its readiness line): no port another process may
 * hold, no guess at how long a loaded machine takes to start node.
 */
async function startProxy(allow) {
  const child = spawn(process.execPath, ["-e", proxyScript(allow, 0)], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  const ready = await untilLine(child.stdout, PROXY_READY, 10 * 60_000).catch((error) => {
    child.kill();
    throw error;
  });
  const port = Number(ready.slice(PROXY_READY.length));
  assert.ok(Number.isInteger(port) && port > 0, ready);
  return { child, port };
}

/** The status line the proxy on `port` answers a CONNECT to `target` with (`error: <code>` if it cannot be asked). */
const askProxy = (port, target) =>
  new Promise((resolve) => {
    const socket = createConnection(port, "127.0.0.1", () =>
      socket.write(`CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n\r\n`),
    );
    let buf = "";
    socket.on("data", (d) => {
      buf += d;
      if (buf.includes("\r\n")) {
        socket.destroy();
        resolve(buf.split("\r\n")[0]);
      }
    });
    socket.on("error", (error) => resolve(`error: ${error.code}`));
  });

test("proxy: refuses a non-allowlisted host, an address literal and a port other than 443", async () => {
  const { child, port } = await startProxy(["registry.npmjs.org"]);
  try {
    for (const target of [
      "169.254.169.254:80",
      "169.254.169.254:443",
      "example.com:443",
      "registry.npmjs.org:80",
      "127.0.0.1:443",
    ])
      assert.match(await askProxy(port, target), /^HTTP\/1\.1 403/, target);
  } finally {
    child.kill();
  }
});

test("proxy: prints its readiness line with the port it listens on, and only once it listens", () => {
  const script = proxyScript(["registry.npmjs.org"]);
  assert.match(
    script,
    /server\.listen\(3128, "0\.0\.0\.0", \(\) => console\.log\("stackra-proxy listening on " \+ server\.address\(\)\.port\)\);$/,
  );
  assert.equal(script.split("console.log").length, 2);
});

test("untilLine: the first matching line, even split across chunks; rejects on end or at the deadline", async () => {
  const stream = new PassThrough();
  const line = untilLine(stream, PROXY_READY, 60_000);
  stream.write("noise\nstackra-proxy liste");
  stream.write("ning on 3128\r\nlater\n");
  assert.equal(await line, "stackra-proxy listening on 3128");
  assert.equal(stream.listenerCount("data"), 0);
  const ended = new PassThrough();
  const never = untilLine(ended, PROXY_READY, 60_000);
  ended.end("crashed: EADDRINUSE\n");
  await assert.rejects(never, /ended before printing "stackra-proxy listening on"/);
  await assert.rejects(untilLine(new PassThrough(), PROXY_READY, 1), /within 1 ms/);
});

test("childLine: a follower that cannot start rejects with its error, never an unhandled event; a line resolves", async () => {
  const missing = spawn(join(tmpdir(), "stackra-no-such-binary"), [], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  await assert.rejects(childLine(missing, PROXY_READY, 60_000), /the follower failed: .*ENOENT/);
  assert.equal(missing.listenerCount("error"), 0);
  const ok = spawn(process.execPath, ["-e", `console.log(${JSON.stringify(PROXY_READY)} + 3128)`], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  assert.equal(await childLine(ok, PROXY_READY, 60_000), "stackra-proxy listening on 3128");
});

test("OSV canary: only exit 1 naming the canary's advisory proves the offline database; anything else refuses it", () => {
  const id = OSV_CANARY.advisory;
  assert.equal(id, "GHSA-35jh-r3h4-6jhm");
  assert.equal(
    osvCanaryProblem({ code: 1, stdout: `| https://osv.dev/${id} | lodash | 4.17.20 |` }),
    null,
  );
  assert.match(
    osvCanaryProblem({ code: 1, stdout: "| GHSA-other | lodash |" }),
    /without naming GHSA-35jh-r3h4-6jhm/,
  );
  assert.match(
    osvCanaryProblem({ code: 0, stdout: `No issues found (${id} not here)` }),
    /found nothing/,
  );
  assert.match(osvCanaryProblem({ code: 127, stdout: id }), /did not run \(exit 127\)/);
  assert.match(osvCanaryProblem({ code: null, stdout: "" }), /did not run \(exit none\)/);
  // the fixture locks the vulnerable version, under a name no dependency scanner reads as a lockfile
  const fixture = readFileSync(new URL("../osv-canary.lock.yaml", import.meta.url), "utf8");
  assert.match(fixture, /^  lodash@4\.17\.20:$/m);
  assert.equal(OSV_CANARY.file, "tools/scripts/osv-canary.lock.yaml");
  assert.equal(isVerifyOverlay(OSV_CANARY.file), true);
});

test("OSV canary: runs at a new database (mtime or size) and a day after its last pass; offline in the store image", () => {
  const now = Date.parse("2026-11-24T12:00:00Z");
  const db = { mtimeMs: 1000, size: 5 };
  assert.equal(osvCanaryDue(undefined, db, now), true);
  assert.equal(osvCanaryDue({ mtimeMs: 1000, size: 5, at: now - 60_000 }, db, now), false);
  assert.equal(osvCanaryDue({ mtimeMs: 999, size: 5, at: now - 60_000 }, db, now), true);
  assert.equal(osvCanaryDue({ mtimeMs: 1000, size: 6, at: now - 60_000 }, db, now), true);
  assert.equal(
    osvCanaryDue({ mtimeMs: 1000, size: 5, at: now - OSV_CANARY_EVERY_MS }, db, now),
    true,
  );
  assert.equal(osvCanaryDue({ mtimeMs: 1000, size: 5, at: now + 60_000 }, db, now), true);
  const argv = osvCanaryArgs(S, {
    name: "c",
    image: "store",
    envFile: ENV,
    osvDir: "/osv-db",
    lockfile: "/runs/x/osv-canary-lock.yaml",
  });
  assert.equal(argv[argv.indexOf("--network") + 1], "none");
  assert.ok(argv.includes("/osv-db:/osv:ro"));
  assert.ok(argv.includes("/runs/x/osv-canary-lock.yaml:/canary/pnpm-lock.yaml:ro"));
  assert.ok(argv.includes("OSV_SCANNER_LOCAL_DB_CACHE_DIRECTORY=/osv"));
  assert.deepEqual(argv.slice(argv.indexOf("store")), [
    "store",
    "osv-scanner",
    "scan",
    "source",
    "--offline",
    "--lockfile=pnpm-lock.yaml",
  ]);
  // the same command the gate's dependency-scan step runs
  assert.equal(GATE_STEPS[0].run, "osv-scanner scan source --offline --lockfile=pnpm-lock.yaml");
});

test("egress probe: metadata, docker0, the host-loopback gateway and every host address on the service ports", () => {
  const targets = probeTargets(["10.77.0.12", "100.110.138.74", "fd7a::1"]);
  for (const t of [
    "169.254.169.254:80",
    "169.254.169.254:443",
    "10.0.2.2:5432",
    "172.17.0.1:5432",
    "172.17.0.1:2375",
    "10.77.0.12:2375",
    "100.110.138.74:4000",
    "[fd7a::1]:6379",
  ])
    assert.ok(targets.includes(t), t);
});

test("egress probe script: exits 9 when a target connects or the proxy lets one through, 0 when sealed", async () => {
  const open = createServer((c) => c.end());
  const leakyProxy = createServer((c) => c.end("HTTP/1.1 200 Connection Established\r\n\r\n"));
  const strictProxy = createServer((c) => c.end("HTTP/1.1 403 Forbidden\r\n\r\n"));
  for (const server of [open, leakyProxy, strictProxy])
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
  try {
    const direct = await runProbe([at(open), "127.0.0.1:1"], null);
    assert.equal(direct.status, 9);
    assert.match(direct.stdout, new RegExp(`reachable: ${at(open)}`));
    const viaProxy = await runProbe(["169.254.169.254:80"], at(leakyProxy));
    assert.equal(viaProxy.status, 9);
    assert.match(viaProxy.stdout, /proxy->169\.254\.169\.254:80/);
    assert.equal((await runProbe(["127.0.0.1:1"], at(strictProxy))).status, 0);
  } finally {
    for (const server of [open, leakyProxy, strictProxy]) server.close();
  }
});

test("store image: digest-pinned base, tagged by base and lockfile, rebuilt when its id changes or it gets old", () => {
  assert.throws(
    () => storeDockerfile({ baseImage: "node:24", pnpmVersion: "12.16.1" }),
    /pinned by digest/,
  );
  const dockerfile = storeDockerfile({ baseImage: PINNED, pnpmVersion: "12.16.1" });
  assert.match(dockerfile, new RegExp(`^FROM ${PINNED}$`, "m"));
  assert.match(dockerfile, /pnpm fetch --store-dir \/store/);
  assert.match(dockerfile, /chown -R 1000:1000 \/store \/work/);
  assert.match(dockerfile, /COREPACK_HOME=\/opt\/corepack/);
  assert.equal(pnpmVersionOf('{"packageManager":"pnpm@12.16.1+sha512.abc"}'), "12.16.1");
  assert.throws(() => pnpmVersionOf("{}"), /no pnpm version/);
  const lock = Buffer.from("lock");
  assert.notEqual(storeTag(lock, PINNED), storeTag(lock, `node@sha256:${"b".repeat(64)}`));
  assert.match(storeTag(lock, PINNED), /^stackra-verify-store:[0-9a-f]{16}$/);
  assert.equal(
    storeReusable({ recordedId: "sha256:1", currentId: "sha256:1", builtAt: NOW - 1000 }, NOW),
    true,
  );
  assert.equal(
    storeReusable({ recordedId: "sha256:1", currentId: "sha256:2", builtAt: NOW }, NOW),
    false,
  );
  assert.equal(
    storeReusable({ recordedId: undefined, currentId: "sha256:1", builtAt: NOW }, NOW),
    false,
  );
  assert.equal(
    storeReusable(
      { recordedId: "sha256:1", currentId: "sha256:1", builtAt: NOW - STORE_MAX_AGE_MS - 1 },
      NOW,
    ),
    false,
  );
});

test("clean-up: every container, volume, network and image but the kept ones goes, after every run", () => {
  const plan = cleanupPlan({
    names: ["sv-a-install", "sv-a-verify", "sv-a-proxy"],
    images: ["stackra-verify-run:a"],
    leftover: ["c1"],
    allIds: ["base", "store", "run", "poisoned"],
    keep: ["base", "store"],
  });
  assert.deepEqual(plan, [
    ["rm", "-f", "-v", "sv-a-install", "sv-a-verify", "sv-a-proxy"],
    ["rmi", "-f", "stackra-verify-run:a"],
    ["rm", "-f", "-v", "c1"],
    ["volume", "prune", "-af"],
    ["network", "prune", "-f"],
    ["rmi", "-f", "run", "poisoned"],
    ["builder", "prune", "-af"],
  ]);
  assert.deepEqual(imagesToRemove(["base", "store", "run", "run"], ["base", "store"]), ["run"]);
});

test("exitFromInspect: a container that never started (or cannot be read) has no exit code", () => {
  assert.equal(exitFromInspect(0, "2026-11-24T15:00:00Z 0\n"), 0);
  assert.equal(exitFromInspect(0, "2026-11-24T15:00:00Z 137"), 137);
  assert.equal(exitFromInspect(0, "0001-01-01T00:00:00Z 0"), null);
  assert.equal(exitFromInspect(1, "2026-11-24T15:00:00Z 0"), null);
  assert.equal(exitFromInspect(0, "garbage"), null);
});

test("needsRun: only our App's completed run against current main stands; forgeries never stop a verify", () => {
  const ours = {
    name: "stackra/verify",
    head_sha: SHA,
    status: "completed",
    conclusion: "failure",
    app: { id: Number(APP_ID) },
    external_id: `base:${BASE}`,
  };
  assert.equal(needsRun({ checkRuns: [ours], sha: SHA, appId: APP_ID, base: BASE }, NOW), false);
  assert.equal(
    needsRun({ checkRuns: [ours], sha: SHA, appId: APP_ID, base: "e".repeat(40) }, NOW),
    true,
  );
  const forged = { ...ours, conclusion: "success", app: { id: 1, slug: "stackra-bot" } };
  assert.equal(needsRun({ checkRuns: [forged], sha: SHA, appId: APP_ID, base: BASE }, NOW), true);
  assert.equal(
    needsRun(
      { checkRuns: [{ ...ours, head_sha: BASE }], sha: SHA, appId: APP_ID, base: BASE },
      NOW,
    ),
    true,
  );
  assert.equal(
    needsRun(
      { checkRuns: [{ ...ours, status: "in_progress" }], sha: SHA, appId: APP_ID, base: BASE },
      NOW,
    ),
    true,
  );
  const recent = { count: 1, at: NOW - ERROR_RETRY_MS + 60_000 };
  const old = { count: 1, at: NOW - ERROR_RETRY_MS - 60_000 };
  assert.equal(needsRun({ checkRuns: [], sha: SHA, appId: APP_ID, errors: recent }, NOW), false);
  assert.equal(needsRun({ checkRuns: [], sha: SHA, appId: APP_ID, errors: old }, NOW), true);
  assert.equal(
    needsRun(
      { checkRuns: [], sha: SHA, appId: APP_ID, errors: { count: MAX_ERROR_ATTEMPTS, at: old.at } },
      NOW,
    ),
    false,
  );
});

test("jobsFrom: own-repo, non-draft PRs oldest first, merge queue commits, then main; malformed SHAs skipped", () => {
  const pr = (number, over = {}) => ({
    number,
    draft: false,
    head: { sha: SHA, repo: { full_name: "figentra/stackra" } },
    ...over,
  });
  const jobs = jobsFrom({
    repo: "figentra/stackra",
    pulls: [
      pr(9),
      pr(3),
      pr(4, { draft: true }),
      pr(5, { head: { sha: SHA, repo: { full_name: "fork/stackra" } } }),
      pr(6, { head: { sha: "not-a-sha", repo: { full_name: "figentra/stackra" } } }),
    ],
    main: BASE,
    queue: [
      { repo: "figentra/stackra", sha: "c".repeat(40), base: BASE },
      { repo: "figentra/stackra", sha: "x", base: BASE },
    ],
  });
  assert.deepEqual(
    jobs.map((j) => j.pr ?? j.sha.slice(0, 4)),
    ["3", "9", "cccc", "fedc"],
  );
  assert.ok(jobs.every((j) => j.base === BASE));
});

test("output: scrubbed, inert Markdown (no fence breakout, no @mention), capped; the log never decides", () => {
  const log = `ok ${FAKE_INSTALLATION}\n${KEY("BEGIN")}\nMIIE\n${KEY("END")}\n\`\`\`\n@figentra-usr see [x](https://evil.test)\n`;
  const tail = logTail(log);
  assert.doesNotMatch(tail, /ghs_|MIIE|`/);
  assert.doesNotMatch(tail, /@figentra-usr/);
  assert.equal(logTail("x\n".repeat(OUTPUT_TEXT_MAX)).length <= OUTPUT_TEXT_MAX + 2, true);
  assert.equal(scrub(`a${String.fromCodePoint(27)}[31mb${String.fromCodePoint(7)}c`), "abc");
  const body = checkRunBody({
    sha: SHA,
    base: BASE,
    conclusion: "failure",
    phase: "verify",
    durationMs: 61_000,
    box: "box1",
    log: "PASS all green\n```\n",
    startedAt: "t0",
    completedAt: "t1",
  });
  assert.equal(body.conclusion, "failure");
  assert.equal(body.head_sha, SHA);
  assert.equal(body.external_id, `base:${BASE}`);
  assert.match(body.output.title, /^Quality Gate failed in 1m 1s$/);
  assert.equal(body.output.text.match(/```/g).length, 2);
  assert.equal(JSON.stringify(body).includes("STACKRA_VERIFY"), false);
});

test("cappedLog: writes up to the cap, then keeps only the last part and appends it on close", () => {
  const out = [];
  const log = cappedLog((d) => out.push(d.toString()), 10, 4);
  log.write("12345");
  log.write("67890");
  log.write("abcdef");
  log.write("ghij");
  log.close();
  assert.equal(out.join(""), "1234567890\n[log capped; its last part follows]\nghij");
});

test("postCheckRun: the body goes on stdin to POST check-runs with the App token, and a refusal throws", () => {
  const seen = [];
  const fake = (cmd, args, options) => {
    seen.push({ cmd, args, options });
    return { status: 0, stdout: '{"html_url":"https://github.com/x/runs/1"}', stderr: "" };
  };
  const body = { name: "stackra/verify", head_sha: SHA, conclusion: "success" };
  assert.equal(
    postCheckRun("figentra/stackra", body, "tok", fake).html_url,
    "https://github.com/x/runs/1",
  );
  assert.equal(seen[0].cmd, "gh");
  assert.deepEqual(seen[0].args, [
    "api",
    "--method",
    "POST",
    "repos/figentra/stackra/check-runs",
    "--input",
    "-",
  ]);
  assert.deepEqual(JSON.parse(seen[0].options.input), body);
  assert.equal(seen[0].options.env.GH_TOKEN, "tok");
  assert.throws(
    () =>
      postCheckRun("figentra/stackra", body, "tok", () => ({
        status: 1,
        stdout: "",
        stderr: "HTTP 422",
      })),
    /HTTP 422/,
  );
});

/** runJob with fakes. `exits` maps container role to its exit code (null: never started); `hang` never returns. */
function fakeDeps({
  exits = { install: 0, verify: 0 },
  head = SHA,
  hang = null,
  conflict = false,
  stop = null,
  leaks = [],
  storeError = null,
  facts = undefined,
  builds = ["esbuild"],
}) {
  const calls = { kill: [], cleanUp: [], docker: [], runs: [] };
  let stopping = false;
  const deps = {
    settings: S,
    envFile: ENV,
    installEnvFile: "/runs/x/install.env",
    now: () => Date.now(),
    builds: () => builds,
    archive: () => {
      if (conflict) throw Object.assign(new Error("conflict"), { conflict: true });
      return TAR;
    },
    storeImage: () => {
      if (storeError) throw storeError;
      return "stackra-verify-store:abc";
    },
    facts,
    verifyMounts: () => [["/runs/x/gate.sh", "/in/gate.sh"]],
    network: ({ network }) => {
      calls.network = network;
      return { network, proxy: "proxy:3128" };
    },
    egressLeaks: () => leaks,
    docker: (args) => {
      calls.docker.push(args);
      return { code: 0, stdout: "" };
    },
    runContainer: (args, name) => {
      calls.runs.push(args);
      const role = name.endsWith("-install") ? "install" : "verify";
      if (stop === role) stopping = true;
      if (hang === role)
        return new Promise((resolve) => {
          deps.release = resolve;
        });
      return Promise.resolve({ code: 0 });
    },
    exitCodeOf: (name) => exits[name.endsWith("-install") ? "install" : "verify"],
    kill: (name) => {
      calls.kill.push(name);
      deps.release?.({ code: 137 });
    },
    cleanUp: (names, images) => calls.cleanUp.push({ names, images }),
    headOf: async () => head,
    readLog: () => "PASS everything is fine\n",
    stopping: () => stopping,
    stop: () => {
      calls.stopped = (calls.stopped ?? 0) + 1;
    },
    timeoutMs: 5,
    setTimer: (fn, ms) => {
      const t = setTimeout(fn, ms);
      return () => clearTimeout(t);
    },
  };
  return { deps, calls };
}
const JOB = { repo: "figentra/stackra", sha: SHA, pr: "12", base: BASE };

test("runJob: exit 0 of the verify container is the only pass; install on the run's internal network, verify on none", async () => {
  const { deps, calls } = fakeDeps({});
  const r = await runJob(JOB, deps);
  assert.equal(r.post, true);
  assert.equal(r.conclusion, "success");
  assert.match(calls.network, /^sv-net-/);
  assert.equal(calls.runs[0][calls.runs[0].indexOf("--network") + 1], calls.network);
  assert.equal(calls.runs[1][calls.runs[1].indexOf("--network") + 1], "none");
  assert.equal(calls.cleanUp.length, 1);
  assert.equal(calls.cleanUp[0].names.length, 3);
});

test("runJob: the egress probe and the install wait for the install network, the proxy's readiness included", async () => {
  const { deps, calls } = fakeDeps({});
  let ready;
  deps.network = ({ network }) =>
    new Promise((resolve) => {
      ready = () => resolve({ network, proxy: "proxy:3128" });
    });
  let probed = null;
  deps.egressLeaks = (_image, net) => {
    probed = net;
    return [];
  };
  const run = runJob(JOB, deps);
  await new Promise((resolve) => {
    setImmediate(resolve);
  });
  assert.equal(probed, null);
  assert.equal(calls.runs.length, 0);
  ready();
  const r = await run;
  assert.equal(r.conclusion, "success");
  assert.match(probed.network, /^sv-net-/);
  assert.equal(probed.proxy, "proxy:3128");
});

test("definitionDrift: a service whose loaded files are not main's blobs errors as neutral, naming each one", async () => {
  const own = {
    "tools/scripts/stackra-verify.mjs": "a".repeat(40),
    "tools/scripts/pr-merge.mjs": "c".repeat(40),
  };
  const main = {
    "tools/scripts/stackra-verify.mjs": "b".repeat(40),
    "tools/scripts/pr-merge.mjs": "c".repeat(40),
  };
  assert.equal(definitionDrift(own, own), null);
  assert.equal(
    definitionDrift(own, main),
    `this service runs stackra-verify.mjs blob ${"a".repeat(40)}, main has ${"b".repeat(40)}: update the service`,
  );
  assert.match(
    definitionDrift(own, { ...main, "tools/scripts/pr-merge.mjs": null }),
    /pr-merge\.mjs blob c{40}, main has none/,
  );
  assert.match(definitionDrift({}, main), /the service files blob unknown/);
  const { deps, calls } = fakeDeps({});
  deps.archive = () => {
    throw Object.assign(new Error(definitionDrift(own, main)), { drift: true });
  };
  const r = await runJob(JOB, deps);
  assert.equal(r.post, true);
  assert.equal(r.conclusion, "neutral");
  assert.equal(r.phase, "definition");
  assert.equal(calls.runs.length, 0);
  const body = checkRunBody({ sha: SHA, base: BASE, ...r, durationMs: 1000 });
  assert.equal(body.conclusion, "neutral");
  assert.ok(
    body.output.title.includes("a".repeat(40)) && body.output.title.includes("b".repeat(40)),
  );
});

test("LOADED_BLOBS: every file the service loads, as loaded, by its git blob id; the list follows every relative import", () => {
  assert.deepEqual(Object.keys(LOADED_BLOBS), [...SERVICE_FILES]);
  for (const file of SERVICE_FILES) {
    const r = spawnSync("git", ["hash-object", join(CODE_DIR, file)], { encoding: "utf8" });
    assert.equal(LOADED_BLOBS[file], r.stdout.trim(), file);
  }
  assert.equal(gitBlobId(Buffer.from("")), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  // every module the service loads is listed: follow the relative imports from stackra-verify.mjs
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const text = readFileSync(join(CODE_DIR, file), "utf8");
    for (const m of text.matchAll(/^import[^;]*?from\s+"(\.[^"]+)"/gms))
      visit(join(dirname(file), m[1]));
  };
  visit(SELF_PATH);
  for (const file of seen)
    assert.ok(SERVICE_FILES.includes(file), `${file} is loaded but not in SERVICE_FILES`);
  assert.ok(SERVICE_FILES.includes(OSV_CANARY.file));
});

test("runJob: output that says PASS with exit 1 is a failure (the log is never read for a verdict)", async () => {
  const r = await runJob(JOB, fakeDeps({ exits: { install: 0, verify: 1 } }).deps);
  assert.equal(r.conclusion, "failure");
  assert.equal(r.phase, "verify");
});

test("runJob: a failed install is the PR's failure; a container that never started is an error, never a pass", async () => {
  assert.equal(
    (await runJob(JOB, fakeDeps({ exits: { install: 2, verify: 0 } }).deps)).phase,
    "install",
  );
  const unstarted = await runJob(JOB, fakeDeps({ exits: { install: 0, verify: null } }).deps);
  assert.equal(unstarted.post, false);
  assert.match(unstarted.error, /did not start/);
});

test(
  "runJob: one time limit for the whole run kills the container (every process in it) and records a failure",
  { timeout: 2000 },
  async () => {
    const { deps, calls } = fakeDeps({ hang: "verify" });
    const r = await runJob(JOB, deps);
    assert.deepEqual(r, {
      post: true,
      conclusion: "failure",
      phase: "verify",
      reason: "time limit",
      log: "PASS everything is fine\n",
    });
    assert.equal(calls.kill.length, 1);
    assert.match(calls.kill[0], /^sv-0123456789ab-.*-verify$/);
    assert.equal(calls.cleanUp.length, 1);
  },
);

test("runJob: a stale SHA posts nothing — the PR's head moved while it ran", async () => {
  assert.deepEqual(await runJob(JOB, fakeDeps({ head: "f".repeat(40) }).deps), {
    post: false,
    moved: true,
  });
});

test("runJob: a merge conflict with main is the PR's failure; a stop posts nothing", async () => {
  const conflict = await runJob(JOB, fakeDeps({ conflict: true }).deps);
  assert.equal(conflict.conclusion, "failure");
  assert.equal(conflict.phase, "merge");
  assert.deepEqual(await runJob(JOB, fakeDeps({ stop: "verify" }).deps), {
    post: false,
    stopped: true,
  });
});

test("runJob: a leaking or unprobed install network runs no PR code and marks the host unsafe", async () => {
  const leaking = fakeDeps({ leaks: ["169.254.169.254:80"] });
  const r = await runJob(JOB, leaking.deps);
  assert.equal(r.post, false);
  assert.equal(r.unsafe, true);
  assert.match(r.error, /reaches 169\.254\.169\.254:80/);
  assert.equal(leaking.calls.runs.length, 0);
  const unprobed = fakeDeps({ leaks: null });
  assert.equal((await runJob(JOB, unprobed.deps)).unsafe, true);
  assert.equal(unprobed.calls.runs.length, 0);
});

test("withMainScripts and overlayPlan: the PR keeps its dependencies, main keeps the commands and configs", () => {
  const head = '{"name":"x","dependencies":{"zod":"4"},"scripts":{"verify":"true","test":"true"}}';
  const main =
    '{"name":"x","dependencies":{"zod":"3"},"scripts":{"verify":"pnpm format:check && turbo run test"}}';
  const out = JSON.parse(withMainScripts(head, main));
  assert.deepEqual(out.scripts, { verify: "pnpm format:check && turbo run test" });
  assert.deepEqual(out.dependencies, { zod: "4" });
  assert.equal("scripts" in JSON.parse(withMainScripts(head, '{"name":"x"}')), false);
  // knip and commitlint configs in a package.json are main's too: a PR cannot loosen the gate through them
  const loose = '{"name":"x","knip":{"ignore":["**"]},"commitlint":{"rules":{}}}';
  const strict = '{"name":"x","knip":{"ignore":[]}}';
  const merged = JSON.parse(withMainScripts(loose, strict));
  assert.deepEqual(merged.knip, { ignore: [] });
  assert.equal("commitlint" in merged, false);
  // a package.json whose checks already match main's is left byte for byte (no reformatting)
  assert.equal(
    withMainScripts('{"name":"y","scripts":{"a":"b"}}', '{"scripts":{"a":"b"},"name":"z"}'),
    null,
  );
  assert.deepEqual(Object.keys(JSON.parse(withMainScripts(head, main))), [
    "name",
    "dependencies",
    "scripts",
  ]);
  const plan = overlayPlan(
    [
      "package.json",
      "packages/a/package.json",
      "packages/new/package.json",
      "src/a.ts",
      "turbo.jsonc",
      ".gitattributes",
      "knip.json",
      "packages/a/.oxlintrc.json",
      "mise.toml",
      "README.md",
      "packages/new/vitest.config.ts",
      "packages/new/src/new.test.ts",
      "packages/new/.config/config.json",
      "packages/a/.config/config.json",
      "tools/scripts/new.mjs",
      "tools/scripts/newdir/x.mjs",
      "packages/tooling/new-preset/index.js",
    ],
    [
      { path: "package.json" },
      { path: "packages/a/package.json" },
      { path: "turbo.jsonc" },
      { path: "packages/a/vitest.config.ts" },
      { path: "src/a.ts" },
      { path: ".gitattributes" },
      { path: ".pnpmfile.cjs" },
    ],
  );
  assert.deepEqual(plan.whole.map((e) => e.path).sort(), [
    ".gitattributes",
    ".pnpmfile.cjs",
    "packages/a/vitest.config.ts",
    "turbo.jsonc",
  ]);
  assert.deepEqual(plan.scripts, ["package.json", "packages/a/package.json"]);
  // definition files main does not have leave the tested tree; inert root files and source stay
  assert.deepEqual(plan.remove, [
    "knip.json",
    "packages/a/.oxlintrc.json",
    "mise.toml",
    "packages/a/.config/config.json",
    "tools/scripts/new.mjs",
    "tools/scripts/newdir/x.mjs",
    "packages/tooling/new-preset/index.js",
  ]);
  // a new member's own configs stay in the tested tree (CTO ruling, round 4): main has no packages/new at all
});

/** A temporary repository with main, a PR and an attacker's commit, for `buildTree`. */
function fixtureRepo() {
  const dir = mkdtempSync(join(tmpdir(), "stackra-verify-"));
  const git = (...args) => {
    const r = spawnSync(
      "git",
      [
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@t",
        "-c",
        "init.defaultBranch=main",
        "-c",
        "commit.gpgsign=false",
        ...args,
      ],
      { cwd: dir, encoding: "utf8", env: { PATH: process.env.PATH, HOME: dir } },
    );
    if (r.status !== 0) throw new Error(r.stderr);
    return r.stdout.trim();
  };
  const write = (path, text) => {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git("init", "-q");
  write(
    "package.json",
    '{"name":"r","scripts":{"verify":"turbo run test"},"devDependencies":{"vitest":"5"}}\n',
  );
  write("turbo.jsonc", '{"tasks":{"test":{}}}\n');
  write("packages/a/vitest.config.ts", "export default { test: { include: ['src/**'] } };\n");
  write("packages/a/src/a.ts", "export const a = 1;\n");
  write(".github/workflows/ci.yml", "on: push\n");
  git("add", "-A");
  git("commit", "-qm", "main");
  const base = git("rev-parse", "HEAD");
  git("checkout", "-qb", "pr");
  write(
    "package.json",
    '{"name":"r","scripts":{"verify":"true"},"devDependencies":{"vitest":"5","zod":"4"}}\n',
  );
  write("turbo.jsonc", '{"tasks":{}}\n');
  write("packages/a/vitest.config.ts", "export default { test: { include: [] } };\n");
  write("packages/a/src/a.ts", "export const a = 2;\n");
  git("add", "-A");
  git("commit", "-qm", "pr");
  const sha = git("rev-parse", "HEAD");
  write("packages/a/src/a.ts", "export const a = 'evil';\n");
  git("commit", "-qam", "evil");
  const evil = git("rev-parse", "HEAD");
  return { dir, git, base, sha, evil };
}

test("buildTree: the PR merged onto main, with main's verify definition — a PR's `verify: \"true\"` never runs", () => {
  const { dir, git, base, sha } = fixtureRepo();
  try {
    const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
    const show = (path) => git("cat-file", "blob", `${tree}:${path}`);
    const pkg = JSON.parse(show("package.json"));
    assert.deepEqual(pkg.scripts, { verify: "turbo run test" });
    assert.equal(pkg.devDependencies.zod, "4");
    assert.equal(show("turbo.jsonc"), '{"tasks":{"test":{}}}');
    assert.match(show("packages/a/vitest.config.ts"), /include: \['src\/\*\*'\]/);
    assert.equal(show("packages/a/src/a.ts"), "export const a = 2;");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * A PR that adds, next to main's `.commitlintrc.yaml`, every config a gate tool would find first (CTO review of
 * #1043, HIGH 1): each must be gone from the tested tree, main's must stay, and source and docs must stay.
 */
const PR_ADDED_CONFIGS = {
  ".commitlintrc.json": '{"rules":{}}\n',
  "package.yaml": "commitlint:\n  rules: {}\n",
  "packages/a/package.json5": "{commitlint: {rules: {}}}\n",
  "commitlint.config.mjs": "export default { rules: {} };\n",
  ".config/config.json": '{"cosmiconfig":{"searchPlaces":["x.json"]}}\n',
  "knip.json": '{"ignore":["**"]}\n',
  ".knip.jsonc": '{"ignore":["**"]}\n',
  "packages/a/knip.config.ts": "export default { ignore: ['**'] };\n",
  "packages/a/.oxlintrc.json": '{"rules":{}}\n',
  "packages/a/oxlint.config.ts": "export default {};\n",
  "oxfmt.config.ts": "export default {};\n",
  ".github/actionlint.yaml": "self-hosted-runner:\n  labels: [x]\n",
  ".shellcheckrc": "disable=all\n",
  ".prettierignore": "**\n",
  ".eslintignore": "**\n",
  ".oxlintignore": "**\n",
  ".editorconfig": "root = true\n",
  "packages/a/.squawk.toml": "excluded_rules = []\n",
  "zizmor.yml": "rules: {}\n",
  "packages/a/vitest.config.mts": "export default { test: { include: [] } };\n",
  ".new-tool.toml": "anything = true\n",
};

function overlayRepo() {
  const repo = fixtureRepo();
  const { dir, git } = repo;
  const write = (path, text) => {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git("checkout", "-q", "main");
  write(".commitlintrc.yaml", "rules:\n  header-max-length: [2, always, 100]\n");
  write("mise.toml", '[tools]\nnode = "24"\n');
  git("add", "-A");
  git("commit", "-qm", "main configs");
  const base = git("rev-parse", "HEAD");
  git("checkout", "-qb", "pr-configs");
  for (const [path, text] of Object.entries(PR_ADDED_CONFIGS)) write(path, text);
  write("mise.toml", '[tools]\nnode = "22"\n');
  write("README.md", "# changed\n");
  write("docs/guide.md", "a guide\n");
  write("packages/a/src/b.ts", "export const b = 1;\n");
  git("add", "-A");
  git("commit", "-qm", "pr adds configs");
  return { ...repo, base, sha: git("rev-parse", "HEAD") };
}

test("buildTree: a definition file the PR adds and main lacks is removed, at any depth and at the root", () => {
  const { dir, git, base, sha } = overlayRepo();
  try {
    const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
    const paths = git("ls-tree", "-r", "--name-only", tree).split("\n");
    for (const path of Object.keys(PR_ADDED_CONFIGS))
      assert.equal(paths.includes(path), false, `${path} reached the tested tree`);
    const show = (path) => git("cat-file", "blob", `${tree}:${path}`);
    // main's own definitions stay, and a root file main has keeps main's copy
    assert.match(show(".commitlintrc.yaml"), /header-max-length/);
    assert.match(show("mise.toml"), /node = "24"/);
    // documentation, source and new docs are the PR's
    assert.equal(show("README.md"), "# changed");
    assert.equal(show("docs/guide.md"), "a guide");
    assert.equal(show("packages/a/src/b.ts"), "export const b = 1;");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * A PR that adds a new workspace member with its own configs (a directory main does not have at all), next to a
 * config in a directory main has: the new member keeps its configs, the existing directory loses the PR's.
 */
function newMemberRepo() {
  const repo = overlayRepo();
  const { dir, git } = repo;
  const write = (path, text) => {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git("checkout", "-qb", "pr-new-member", repo.base);
  write("packages/new/package.json", '{"name":"new","private":true}\n');
  // a test file only this config's `include` reaches, so a run that finds it used the config
  write(
    "packages/new/vitest.config.mjs",
    "export default { test: { globals: true, include: ['src/**/*.check.mjs'] } };\n",
  );
  write("packages/new/src/new.check.mjs", "test('new member', () => expect(1 + 1).toBe(2));\n");
  write("packages/new/.commitlintrc.json", '{"rules":{}}\n');
  write("packages/new/.oxlintrc.json", '{"rules":{}}\n');
  write("packages/a/knip.json", '{"ignore":["**"]}\n');
  write("tools/scripts/added.mjs", "export const x = 1;\n");
  git("add", "-A");
  git("commit", "-qm", "pr adds a member");
  return { ...repo, sha: git("rev-parse", "HEAD") };
}

test("buildTree: a new member's own definition files stay (it runs with them); one in a directory main has goes", () => {
  const { dir, git, base, sha } = newMemberRepo();
  try {
    const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
    const paths = git("ls-tree", "-r", "--name-only", tree).split("\n");
    for (const path of [
      "packages/new/vitest.config.mjs",
      "packages/new/src/new.check.mjs",
      "packages/new/.commitlintrc.json",
      "packages/new/.oxlintrc.json",
    ])
      assert.ok(paths.includes(path), `${path} left the tested tree`);
    for (const path of ["packages/a/knip.json", "tools/scripts/added.mjs"])
      assert.equal(paths.includes(path), false, `${path} reached the tested tree`);
    // main's own configs are untouched for every file outside the new member
    assert.match(git("cat-file", "blob", `${tree}:.commitlintrc.yaml`), /header-max-length/);
    assert.match(
      git("cat-file", "blob", `${tree}:packages/a/vitest.config.ts`),
      /include: \['src\/\*\*'\]/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** The real vitest CLI of this checkout, when it has one installed (box 1 does; a bare clone does not). */
const VITEST = (() => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  return globSync("node_modules/.pnpm/vitest@*/node_modules/vitest/vitest.mjs", { cwd: root })
    .toSorted()
    .map((bin) => join(root, bin))[0];
})();

test(
  "buildTree: the new member's tests run with its own vitest config in the tested tree",
  { skip: VITEST ? false : "vitest is not installed in this checkout" },
  () => {
    const { dir, base, sha } = newMemberRepo();
    const out = mkdtempSync(join(tmpdir(), "stackra-tested-"));
    try {
      const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
      const r = spawnSync("sh", ["-c", `git -C "${dir}" archive ${tree} | tar -x -C "${out}"`]);
      assert.equal(r.status, 0);
      const run = spawnSync(
        process.execPath,
        [VITEST, "run", "--root", join(out, "packages/new")],
        {
          encoding: "utf8",
          env: { ...process.env, CI: "1", NO_COLOR: "1" },
        },
      );
      // only the member's config includes *.check.mjs: one test found and passed proves it ran with that config
      assert.equal(run.status, 0, run.stdout + run.stderr);
      assert.match(run.stdout, /Tests\s+1 passed/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(out, { recursive: true, force: true });
    }
  },
);

/** The real `@commitlint/load` the gate runs, when this checkout has it installed (box 1 does; a bare clone not). */
async function commitlintLoad() {
  try {
    const root = fileURLToPath(new URL("../../../", import.meta.url));
    const cli = createRequire(join(root, "package.json")).resolve("@commitlint/cli/package.json");
    const load = createRequire(cli).resolve("@commitlint/load");
    return (await import(pathToFileURL(load).href)).default;
  } catch {
    return null;
  }
}
const COMMITLINT = await commitlintLoad();

test(
  "buildTree: the real @commitlint/load over the tested tree reads main's rules, not a PR's .commitlintrc.json or package.yaml",
  { skip: COMMITLINT ? false : "@commitlint/load is not installed in this checkout" },
  async () => {
    const { dir, base, sha } = overlayRepo();
    const out = mkdtempSync(join(tmpdir(), "stackra-tested-"));
    try {
      // the attack works on the PR's own tree: its package.yaml wins over main's .commitlintrc.yaml
      const unsafe = spawnSync("sh", ["-c", `git -C "${dir}" archive ${sha} | tar -x -C "${out}"`]);
      assert.equal(unsafe.status, 0);
      assert.deepEqual((await COMMITLINT({}, { cwd: out })).rules, {});
      rmSync(out, { recursive: true, force: true });
      mkdirSync(out);
      const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
      const r = spawnSync("sh", ["-c", `git -C "${dir}" archive ${tree} | tar -x -C "${out}"`]);
      assert.equal(r.status, 0);
      const config = await COMMITLINT({}, { cwd: out });
      assert.deepEqual(config.rules, { "header-max-length": [2, "always", 100] });
      // a `.commitlintrc.json` in a new member stays in its directory; the gate's commitlint runs at the root
      rmSync(out, { recursive: true, force: true });
      mkdirSync(out);
      const member = newMemberRepo();
      try {
        const memberTree = buildTree(
          member.dir,
          member.base,
          member.sha,
          join(member.dir, "scratch-index"),
        );
        const x = spawnSync("sh", [
          "-c",
          `git -C "${member.dir}" archive ${memberTree} | tar -x -C "${out}"`,
        ]);
        assert.equal(x.status, 0);
        assert.deepEqual((await COMMITLINT({}, { cwd: out })).rules, {
          "header-max-length": [2, "always", 100],
        });
      } finally {
        rmSync(member.dir, { recursive: true, force: true });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(out, { recursive: true, force: true });
    }
  },
);

test("buildTree: a replace ref in the mirror never swaps the tested tree", () => {
  const { dir, git, base, sha, evil } = fixtureRepo();
  try {
    git("replace", sha, evil);
    assert.match(git("cat-file", "-p", `${sha}:packages/a/src/a.ts`), /evil/);
    const tree = buildTree(dir, base, sha, join(dir, "scratch-index"));
    assert.equal(git("cat-file", "blob", `${tree}:packages/a/src/a.ts`), "export const a = 2;");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildTree: a PR that conflicts with main is refused as a conflict", () => {
  const { dir, git, base, sha } = fixtureRepo();
  try {
    git("checkout", "-q", "main");
    writeFileSync(join(dir, "packages/a/src/a.ts"), "export const a = 3;\n");
    git("commit", "-qam", "main moves");
    const newBase = git("rev-parse", "HEAD");
    assert.notEqual(newBase, base);
    assert.throws(
      () => buildTree(dir, newBase, sha, join(dir, "scratch-index")),
      (error) => error.conflict === true,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("archive: a PR's .gitattributes export-ignore never drops a file from the tested tree", () => {
  const { dir, git, base, sha } = fixtureRepo();
  try {
    git("checkout", "-q", "pr");
    writeFileSync(
      join(dir, ".gitattributes"),
      "turbo.jsonc export-ignore\npackages/a/src/** export-ignore\n",
    );
    git("add", "-A");
    git("commit", "-qm", "hide");
    const hidden = git("rev-parse", "HEAD");
    const tree = buildTree(dir, base, hidden, join(dir, "scratch-index"));
    const before = join(dir, "before.tar");
    git("archive", "--format=tar", "-o", before, tree);
    // without the protection, git honours the tree's own attributes (overlaid from main here, so use the PR's)
    const prTree = git("rev-parse", `${hidden}^{tree}`);
    const leaky = join(dir, "leaky.tar");
    git("archive", "--format=tar", "-o", leaky, prTree);
    assert.equal(tarList(leaky).includes("turbo.jsonc"), false);
    neutraliseAttributes(dir);
    const sealed = join(dir, "sealed.tar");
    git("archive", "--format=tar", "-o", sealed, prTree);
    assert.equal(tarList(sealed).includes("turbo.jsonc"), true);
    assert.equal(tarList(sealed).includes("packages/a/src/a.ts"), true);
    assert.equal(sha.length, 40);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ledgerEntry and formatDuration: the result, the posted flag and the link", () => {
  assert.equal(formatDuration(754_000), "12m 34s");
  const { json, md } = ledgerEntry({
    repo: "figentra/stackra",
    sha: SHA,
    pr: "7",
    conclusion: "failure",
    phase: "verify",
    durationMs: 61_000,
    box: "box1",
    at: "2026-11-24T15:00:00.000Z",
    link: "https://github.com/figentra/stackra/runs/1",
    posted: false,
  });
  assert.equal(json.posted, false);
  assert.equal(json.pr, 7);
  assert.match(md, /\| stackra\/verify: failure, not posted \| 1m 1s \|/);
  assert.equal(json.check, "stackra/verify");
  assert.equal(json.command, "bash /in/gate.sh");
  const mobile = ledgerEntry({
    kind: "mobile",
    repo: "figentra/stackra",
    sha: SHA,
    conclusion: "success",
    durationMs: 1,
    box: "b",
    at: "t",
    posted: true,
  });
  assert.equal(mobile.json.check, "stackra/verify-mobile");
  assert.match(mobile.md, /\| stackra\/verify-mobile: success \|/);
});

test("licensed builds: main's versions from the lockfile; the install copies the prebuilt output, never runs it", () => {
  const lock = [
    "packages:",
    "  uniwind-pro@1.9.0:",
    "    resolution: {integrity: sha512-x}",
    "  uniwind@1.12.1:",
    "snapshots:",
    "  uniwind-pro@1.9.0(@expo/metro-config@57.0.13)(metro@0.87.1):",
    "  uniwind-pro-extra@2.0.0:",
  ].join("\n");
  assert.deepEqual(lockedVersions(lock, "uniwind-pro"), ["1.9.0"]);
  const cmd = installCommand(["esbuild", "uniwind-pro", "sharp"]);
  assert.match(cmd, /--ignore-scripts --ignore-pnpmfile && pnpm rebuild esbuild sharp && /);
  assert.doesNotMatch(cmd, /pnpm rebuild[^&]*uniwind-pro/);
  assert.match(cmd, /node_modules\/\.pnpm\/uniwind-pro@\*\/node_modules\/uniwind-pro/);
  assert.match(
    cmd,
    new RegExp(`\\[ -d "/prebuilt/uniwind-pro@\\$v" \\] \\|\\| exit ${NEEDS_STORE_REBUILD_EXIT}`),
  );
  assert.match(cmd, /cp -a "\/prebuilt\/uniwind-pro@\$v\/\." "\$d\/"/);
  assert.equal(installCommand(["esbuild"]).includes("prebuilt"), false);
});

test("licensed image: a secret mount and a bind-mounted script on top of the store image; no token in ENV, ARG or a layer", () => {
  const dockerfile = licensedDockerfile("stackra-verify-store:abc");
  assert.match(dockerfile, /^FROM stackra-verify-store:abc$/m);
  assert.match(
    dockerfile,
    /RUN --mount=type=secret,id=licence,required=true --mount=type=tmpfs,target=\/scan --mount=type=bind,source=licensed\.sh,target=\/licensed\.sh sh \/licensed\.sh/,
  );
  assert.doesNotMatch(dockerfile, /^(?:ARG|ENV)/m);
  assert.doesNotMatch(dockerfile, /UNIWIND_AUTH_TOKEN/);
  assert.equal(
    storeDockerfile({ baseImage: PINNED, pnpmVersion: "12.16.1" }).includes("secret"),
    false,
  );
});

test("licensed stage script: publisher tarball checked against the lockfile integrity, only changed files kept, token never persisted", () => {
  const integrity = `sha512-${"A".repeat(86)}==`;
  const script = licensedScript([{ name: "uniwind-pro", version: "1.9.0", integrity }]);
  assert.match(script, /npm pack uniwind-pro@1\.9\.0/);
  assert.match(
    script,
    new RegExp(`\\[ "\\$got" = "${integrity.replaceAll("+", "\\+")}" \\] \\|\\| \\{`),
  );
  assert.match(script, /pnpm add "\$f" --store-dir \/store --ignore-scripts/);
  assert.match(script, /UNIWIND_AUTH_TOKEN="\$\(cat \/scan\/token\)"/);
  assert.match(script, /redact < /);
  assert.match(script, /comm -13 .*\.before .*\.after/);
  assert.match(
    script,
    /find \/ \\\( -path \/proc -o -path \/sys -o -path \/dev -o -path \/run\/secrets -o -path \/scan \\\) -prune .* grep -lF -f \/scan\/patterns/,
  );
  assert.match(
    script,
    /\[ -z "\$hits" \] \|\| \{ echo "the licence token was persisted"; exit 1; \}$/,
  );
  // no value on a command line: grep reads patterns from a file, awk from a file, never -e "$T" or -v t=
  assert.doesNotMatch(script, /-e "\$|awk -v|\$T"|echo "\$/);
  assert.doesNotMatch(script, /--exclude-dir/);
  assert.equal(spawnSync("sh", ["-n"], { input: script }).status, 0);
  for (const bad of [
    { name: "x; rm -rf /", version: "1.0.0", integrity },
    { name: "uniwind-pro", version: "1.0.0$(id)", integrity },
    { name: "uniwind-pro", version: "1.0.0", integrity: "sha1-abc" },
    { name: "uniwind-pro", version: "1.0.0" },
  ])
    assert.throws(() => licensedScript([bad]), /not a package/);
  const lock = [
    "packages:",
    "",
    "  uniwind-pro@1.9.0:",
    `    resolution: {integrity: ${integrity}}`,
    "",
    "  uniwind@1.12.1:",
    "    resolution: {integrity: sha512-x}",
  ].join("\n");
  assert.deepEqual(lockedPackages(lock, "uniwind-pro"), [
    { name: "uniwind-pro", version: "1.9.0", integrity },
  ]);
});

test("token scan: finds the token across chunk boundaries; nothing found stays not found", () => {
  const token = `uw-${"q".repeat(8)}-${"z".repeat(8)}`;
  const split = needleScanner(token);
  split.push(`....layer bytes ... ${token.slice(0, 12)}`);
  split.push(`${token.slice(12)} more bytes`);
  assert.equal(split.found, true);
  const clean = needleScanner(token);
  clean.push("UNIWIND_AUTH_TOKEN is read by the package's own code");
  clean.push(Buffer.alloc(100_000, 1));
  assert.equal(clean.found, false);
});

test("runJob: a licensed build missing from the run image is the service's error, never the PR's pass, fail or neutral", async () => {
  const r = await runJob(
    JOB,
    fakeDeps({ exits: { install: NEEDS_STORE_REBUILD_EXIT, verify: 0 } }).deps,
  );
  assert.equal(r.post, false);
  assert.match(r.error, /licensed build is missing/);
});

test("hostProblems: a licence token file that is not 0400 and ours refuses", () => {
  const withLicence = { ...S, licenceFile: "/home/svc/licence" };
  assert.deepEqual(hostProblems(withLicence, 0o400, 0o400), []);
  assert.match(hostProblems(withLicence, 0o400, 0o644).join(), /licence token file/);
  assert.match(hostProblems(withLicence, 0o400, null).join(), /licence token file/);
});

test("proxy: an address literal is refused even when it is on the allowlist", async () => {
  const { child, port } = await startProxy(["127.0.0.1"]);
  try {
    assert.match(await askProxy(port, "127.0.0.1:443"), /^HTTP\/1\.1 403/);
  } finally {
    child.kill();
  }
});

test("allowedBuilds: a key that is not an npm package name never reaches the shell", () => {
  assert.deepEqual(
    allowedBuilds(
      "allowBuilds:\n  ../etc: true\n  .hidden: true\n  Upper: true\n  esbuild: true\n",
    ),
    ["esbuild"],
  );
});

test("outcome: an unsafe host stops the service; stops and moved heads skip; errors and results are told apart", () => {
  assert.equal(outcome({ post: false, unsafe: true, error: "x" }), "stop");
  assert.equal(outcome({ post: false, stopped: true }), "skip");
  assert.equal(outcome({ post: false, moved: true }), "skip");
  assert.equal(outcome({ post: false, error: "x" }), "error");
  assert.equal(outcome({ post: true, conclusion: "failure" }), "post");
});

test("keepIdsFrom: the base and every recorded store and licensed image are kept", () => {
  const state = { stores: { a: { id: "sha256:s" } }, licensed: { b: { id: "sha256:l" } } };
  assert.deepEqual(keepIdsFrom(state, "sha256:base"), ["sha256:s", "sha256:l", "sha256:base"]);
  assert.deepEqual(keepIdsFrom({}, ""), []);
});

test("ownedMode: a secret file someone else owns counts as unreadable", () => {
  assert.equal(ownedMode({ uid: 1001, mode: 33_024 }, 1001), 0o400);
  assert.equal(ownedMode({ uid: 0, mode: 33_024 }, 1001), null);
  assert.equal(ownedMode(null, 1001), null);
});

test("preflight: the licence file in the forbidden list; a missing or overlapping subuid range refuses", () => {
  const withLicence = { ...S, licenceFile: "/home/svc/licence" };
  assert.match(
    preflightProblems(withLicence, io({ canRead: (p) => p === "/home/svc/licence" })).join(),
    /can read \/home\/svc\/licence/,
  );
  assert.match(subuidOverlap("build:100000:65536\n", "stackra-verify"), /no \/etc\/subuid range/);
  assert.match(
    subuidOverlap("build:100000:65536\nstackra-verify:150000:65536\n", "stackra-verify"),
    /overlaps build/,
  );
  assert.equal(
    subuidOverlap("build:100000:65536\nstackra-verify:300000:65536\n", "stackra-verify"),
    null,
  );
  assert.match(preflightProblems(S, io({ subuid: () => "" })).join(), /subuid/);
});

test("probeVerdict: a probe that did not run is retried once; still not run is unsafe (null)", () => {
  assert.deepEqual(probeVerdict([{ code: 0, stdout: "" }]), []);
  assert.deepEqual(probeVerdict([{ code: 9, stdout: "reachable: 169.254.169.254:80\n" }]), [
    "169.254.169.254:80",
  ]);
  let retried = 0;
  const again = () => {
    retried++;
    return { code: 0, stdout: "" };
  };
  assert.deepEqual(probeVerdict([{ code: 125, stdout: "" }, again]), []);
  assert.equal(retried, 1);
  assert.equal(probeVerdict([{ code: 125, stdout: "" }, () => ({ code: 125, stdout: "" })]), null);
});

test("egress probe: the internal network's gateway is probed; the embedded DNS address is not a target", () => {
  const targets = probeTargets([], ["172.30.0.1"]);
  assert.equal(targets.includes("127.0.0.11:53"), false);
  for (const t of ["172.30.0.1:53", "172.30.0.1:5432", "172.30.0.1:2375"])
    assert.ok(targets.includes(t), t);
});

test("fetchRefs: a merge-queue job fetches the queue's refs, a PR its head, main always", () => {
  assert.deepEqual(fetchRefs({ sha: SHA }), ["+refs/heads/main:refs/heads/main"]);
  assert.ok(fetchRefs({ sha: SHA, pr: "7" }).includes("+refs/pull/7/head:refs/verify/pr-7"));
  assert.ok(
    fetchRefs({ sha: SHA, queue: true }).includes(
      "+refs/heads/gh-readonly-queue/*:refs/verify/queue/*",
    ),
  );
});

test("needsRun: a fresh green against an older main stands (no livelock); a stale one runs again", () => {
  const run = (completedAt) => ({
    name: "stackra/verify",
    head_sha: SHA,
    status: "completed",
    conclusion: "success",
    app: { id: Number(APP_ID) },
    external_id: `base:${"d".repeat(40)}`,
    completed_at: completedAt,
  });
  assert.equal(
    needsRun(
      {
        checkRuns: [run(new Date(NOW - 60_000).toISOString())],
        sha: SHA,
        appId: APP_ID,
        base: BASE,
      },
      NOW,
    ),
    false,
  );
  assert.equal(
    needsRun(
      {
        checkRuns: [run(new Date(NOW - FRESH_MS - 60_000).toISOString())],
        sha: SHA,
        appId: APP_ID,
        base: BASE,
      },
      NOW,
    ),
    true,
  );
});

test("scrub: a registered secret goes from every output in every encoding", () => {
  const token = `lic-${"k".repeat(12)}-${"m".repeat(12)}`;
  registerSecret(token);
  const out = scrub(
    `url https://cdn/ci/1.9.0/${token} b64 ${Buffer.from(token).toString("base64")} enc ${encodeURIComponent(token)}`,
  );
  assert.equal(out.includes(token), false);
  assert.equal(out.includes(Buffer.from(token).toString("base64")), false);
  assert.match(out, /\[redacted\]/);
});

test("imageCarries: the token or its name in history or config, or the token (plain or base64) in the filesystem, refuses", async () => {
  const token = `lic-${"p".repeat(12)}-${"q".repeat(12)}`;
  assert.equal(await imageCarries(imageReader(), "img", token), false);
  assert.equal(
    await imageCarries(imageReader({ history: `RUN echo ${token}` }), "img", token),
    true,
  );
  assert.equal(
    await imageCarries(imageReader({ config: '{"Env":["UNIWIND_AUTH_TOKEN=x"]}' }), "img", token),
    true,
  );
  assert.equal(
    await imageCarries(
      imageReader({ files: ["a", `x${token.slice(0, 9)}`, `${token.slice(9)}y`] }),
      "img",
      token,
    ),
    true,
  );
  assert.equal(
    await imageCarries(
      imageReader({ files: [Buffer.from(token).toString("base64")] }),
      "img",
      token,
    ),
    true,
  );
  assert.equal(await imageCarries(imageReader({ exported: false }), "img", token), true);
});

test("egress probe script: an external name that resolves is a DNS leak; one that does not is sealed", async () => {
  const leak = await runProbe([], null, "localhost");
  assert.equal(leak.status, 9);
  assert.match(leak.stdout, /dns->localhost=/);
  assert.equal((await runProbe([], null, "stackra-verify.invalid")).status, 0);
});

test("secretPatterns: the token's base64 core is found at every alignment inside a longer base64 run", () => {
  for (const token of [`lic-${"r".repeat(13)}`, `${"\u00ff".repeat(4)}+/?${"s".repeat(9)}`]) {
    const cores = secretPatterns(token).slice(1);
    for (let pre = 0; pre < 6; pre++)
      for (let suf = 0; suf < 4; suf++) {
        const run = Buffer.concat([Buffer.alloc(pre, 7), Buffer.from(token), Buffer.alloc(suf, 9)]);
        for (const encoded of [run.toString("base64"), run.toString("base64url")])
          assert.ok(
            cores.some((core) => encoded.includes(core)),
            `${pre}/${suf}`,
          );
      }
  }
});

test("registerSecret: base64url, URL-encoded (upper and lower hex) and form-encoded forms are scrubbed too", () => {
  const token = `t0k+en/with?&= chars-${"w".repeat(8)}`;
  registerSecret(token);
  const forms = [
    Buffer.from(token).toString("base64url"),
    encodeURIComponent(token),
    encodeURIComponent(token).replaceAll(/%[0-9A-F]{2}/g, (m) => m.toLowerCase()),
    new URLSearchParams({ v: token }).toString().slice(2),
  ];
  for (const form of forms) assert.equal(scrub(`x ${form} y`).includes(form), false, form);
});

test("stopIfUnsafe: an unsafe host calls stop and throws; anything else does neither", () => {
  let stopped = 0;
  const stop = () => stopped++;
  assert.throws(
    () => stopIfUnsafe({ post: false, unsafe: true, error: "leak" }, stop),
    /stopping: leak/,
  );
  assert.equal(stopped, 1);
  stopIfUnsafe({ post: false, error: "x" }, stop);
  stopIfUnsafe({ post: true, conclusion: "success" }, stop);
  assert.equal(stopped, 1);
});

test("secretModes: a key or licence someone else owns, or one that cannot be read, counts as null", () => {
  const files = { "/k": { uid: 7, mode: 33_024 }, "/l": { uid: 8, mode: 33_024 } };
  const stat = (path) => {
    if (!files[path]) throw new Error("ENOENT");
    return files[path];
  };
  assert.deepEqual(secretModes({ keyFile: "/k", licenceFile: "/l" }, stat, 7), {
    keyMode: 0o400,
    licenceMode: null,
  });
  assert.deepEqual(secretModes({ keyFile: "/missing", licenceFile: null }, stat, 7), {
    keyMode: null,
    licenceMode: 0o400,
  });
});

test("pruneLicensed: licensed images on an old store, or too old, leave the record; the cap holds", () => {
  const now = NOW;
  const licensed = {
    a: { id: "sha256:a", storeId: "sha256:store2", builtAt: now - 1000 },
    b: { id: "sha256:b", storeId: "sha256:store1", builtAt: now - 1000 },
    c: { id: "sha256:c", storeId: "sha256:store2", builtAt: now - STORE_MAX_AGE_MS - 1 },
  };
  assert.deepEqual(Object.keys(pruneLicensed(licensed, "sha256:store2", now)), ["a"]);
  assert.equal(MAX_LICENSED_PER_TREE, 3);
});

test("isFresh: a run in the last day is fresh; one from the future or unreadable never is", () => {
  assert.equal(isFresh(new Date(NOW - 60_000).toISOString(), NOW), true);
  assert.equal(isFresh(new Date(NOW - FRESH_MS - 1).toISOString(), NOW), false);
  assert.equal(isFresh(new Date(NOW + 3_600_000).toISOString(), NOW), false);
  assert.equal(isFresh(undefined, NOW), false);
});

test("preflight: a bridge network that reaches instance metadata (missing REJECT rules) refuses", () => {
  assert.match(
    preflightProblems(S, io({ bridgeProbe: () => ["169.254.169.254:80"] })).join(),
    /bridge network reaches 169\.254\.169\.254:80/,
  );
  assert.match(
    preflightProblems(S, io({ bridgeProbe: () => null })).join(),
    /bridge probe did not run/,
  );
  assert.deepEqual(preflightProblems(S, io({ bridgeProbe: () => [] })), []);
});

test("persistence check: a token in a later batch of files is found (the verdict is the list, not xargs' status)", () => {
  const dir = mkdtempSync(join(tmpdir(), "stackra-persist-"));
  try {
    const token = `lic-${"t".repeat(14)}`;
    writeFileSync(join(dir, "patterns"), `${token}\n`);
    mkdirSync(join(dir, "root"));
    for (let i = 0; i < 3000; i++)
      writeFileSync(join(dir, "root", `f${String(i).padStart(4, "0")}`), "clean\n");
    const check = persistenceCheck(join(dir, "root"), join(dir, "patterns"));
    assert.equal(spawnSync("sh", ["-c", check], { encoding: "utf8" }).status, 0);
    writeFileSync(join(dir, "root", "f2999"), `x ${token} y\n`);
    const found = spawnSync("sh", ["-c", check], { encoding: "utf8" });
    assert.equal(found.status, 1);
    assert.match(found.stdout, /the licence token was persisted/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("licensed stage: the script is mounted outside /tmp, which the stage empties", () => {
  const script = licensedScript([
    { name: "uniwind-pro", version: "1.9.0", integrity: `sha512-${"A".repeat(86)}==` },
  ]);
  assert.match(script, /rm -rf \/lic \/tmp\/\*/);
  assert.doesNotMatch(licensedDockerfile("s"), /target=\/tmp\//);
  assert.match(
    script,
    /pnpm add "\$f" --store-dir \/store --ignore-scripts --config\.minimum-release-age=1440/,
  );
});

test("licensedPackagesFor: more than three licensed versions in one tree is refused", () => {
  assert.equal(
    licensedPackagesFor(lockWith(["1.9.0", "1.9.1", "1.9.2"]), ["uniwind-pro"]).length,
    3,
  );
  assert.throws(
    () => licensedPackagesFor(lockWith(["1.9.0", "1.9.1", "1.9.2", "1.9.3"]), ["uniwind-pro"]),
    /at most 3/,
  );
  assert.deepEqual(licensedPackagesFor(lockWith(["1.9.0"]), ["esbuild"]), []);
});

test("licenceSecret: the BuildKit secret carries the token and every base64 core the in-build scan needs", () => {
  const token = `lic-${"u".repeat(14)}`;
  const lines = licenceSecret(token).split("\n");
  assert.equal(lines[0], token);
  for (const core of secretPatterns(token).slice(1)) assert.ok(lines.includes(core), core);
  assert.ok(lines.length >= 4);
});

test("refsToDelete: a PR job drops its ref; a queue job drops every queue ref it fetched", () => {
  assert.deepEqual(refsToDelete({ sha: SHA, pr: "7" }), ["refs/verify/pr-7"]);
  assert.deepEqual(
    refsToDelete(
      { sha: SHA, queue: true },
      "refs/verify/queue/main/pr-7-abc\nrefs/verify/queue/main/pr-8-def\nrefs/heads/main\n",
    ),
    ["refs/verify/queue/main/pr-7-abc", "refs/verify/queue/main/pr-8-def"],
  );
  assert.deepEqual(refsToDelete({ sha: SHA }, "refs/verify/queue/x"), []);
});

test("runJob: an unsafe host stops the service from inside the run, before any PR code", async () => {
  const leaking = fakeDeps({ leaks: ["169.254.169.254:80"] });
  await runJob(JOB, leaking.deps);
  assert.equal(leaking.calls.stopped, 1);
  assert.equal(leaking.calls.runs.length, 0);
  const sealed = fakeDeps({});
  await runJob(JOB, sealed.deps);
  assert.equal(sealed.calls.stopped, undefined);
});

test("install and probe containers resolve no external name (a non-answering resolver)", () => {
  const install = installArgs(S, {
    name: "i",
    image: "s",
    tarPath: TAR,
    envFile: ENV,
    network: "n",
  });
  const probe = probeArgs(S, { name: "p", image: "s", envFile: ENV, targets: [], network: "n" });
  for (const argv of [install, probe]) assert.equal(argv[argv.indexOf("--dns") + 1], "127.0.0.1");
});

// ---- the Quality Gate (main's ci.yml) -----------------------------------------------------------------------------

const CI_YML = new URL("../../../.github/workflows/ci.yml", import.meta.url);

/** ci.yml's jobs → steps ({ name, line, run, if, env names }), read the way GitHub reads the block scalars. */
function ciJobs(text) {
  const jobs = {};
  let job;
  let step;
  let block = null;
  let inEnv = false;
  const close = () => {
    if (block && step)
      step.run = (
        block.folded
          ? block.lines
              .map((l) => l.trim())
              .filter(Boolean)
              .join(" ")
          : block.lines.join("\n")
      ).trimEnd();
    block = null;
  };
  text.split("\n").forEach((line, index) => {
    if (block) {
      if (line.trim() === "" || line.startsWith(" ".repeat(10))) {
        block.lines.push(line.slice(10));
        return;
      }
      close();
    }
    let m;
    if ((m = /^ {2}([\w-]+):\s*$/.exec(line))) {
      jobs[m[1]] = job = [];
      step = undefined;
      return;
    }
    if (!job) return;
    if ((m = /^ {6}- name: (.+)$/.exec(line))) {
      step = { name: m[1].trim(), line: index + 1, env: [], run: null, if: null };
      job.push(step);
      inEnv = false;
      return;
    }
    if (!step) return;
    if ((m = /^ {8}run: ([|>])-?\s*$/.exec(line))) block = { lines: [], folded: m[1] === ">" };
    else if ((m = /^ {8}run: (.+)$/.exec(line))) step.run = m[1].trim();
    else if ((m = /^ {8}if: (.+)$/.exec(line))) step.if = m[1].trim();
    else if (/^ {8}env:\s*$/.test(line)) {
      inEnv = true;
      return;
    } else if (inEnv && (m = /^ {10}([A-Z_][A-Z0-9_]*):/.exec(line))) {
      step.env.push(m[1]);
      return;
    }
    if (/^ {8}\S/.test(line)) inEnv = false;
  });
  close();
  return jobs;
}
const norm = (text) =>
  String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

test("gate mirrors main's ci.yml: every dependency-scan, gate and mobile step, in order, same commands, filters, env and conditions", () => {
  const jobs = ciJobs(readFileSync(CI_YML, "utf8"));
  const notMirrored = {
    "dependency-scan": ["Toolchain (mise)", "Put osv-scanner on PATH", "Checkout"],
    gate: ["Checkout", "Toolchain (mise)", "Turborepo remote cache (sops)", "Install dependencies"],
  };
  for (const job of ["dependency-scan", "gate"])
    assert.deepEqual(
      GATE_STEPS.filter((s) => s.job === job).map((s) => s.ci),
      jobs[job].map((s) => s.name).filter((n) => !notMirrored[job].includes(n)),
      job,
    );
  assert.deepEqual(
    GATE_STEPS.filter((s) => !s.job).map((s) => s.id),
    ["licence-policy", "test"],
  );
  for (const step of [...GATE_STEPS, ...MOBILE_STEPS].filter((s) => s.job)) {
    const ci = jobs[step.job].find((s) => s.name === step.ci);
    assert.ok(ci, `${step.id}: no ci.yml step "${step.ci}"`);
    assert.equal(ci.line, step.line, `${step.id}: ci.yml line`);
    let expected = ci.run;
    for (const [from, to] of step.ciReplace ?? []) {
      assert.ok(expected.includes(from), `${step.id}: ci.yml no longer has ${from}`);
      expected = expected.replaceAll(from, to);
    }
    assert.equal(norm(step.run), norm(expected), step.id);
    for (const name of ci.env.filter((n) => !(step.dropEnv ?? []).includes(n)))
      assert.ok(name in (step.env ?? {}), `${step.id}: ci.yml env ${name}`);
    assert.equal(Boolean(ci.if), Boolean(step.when), `${step.id}: if`);
    if (ci.if) assert.equal(ci.if, `github.event_name == '${step.when}'`);
  }
  const install = jobs.gate.find((s) => s.name === "Install dependencies").run;
  assert.deepEqual(
    [...install.matchAll(/--filter='([^']+)'/g)].map((m) => m[1]),
    GATE_FILTERS,
  );
  assert.match(
    installCommand(["esbuild"], [], GATE_FILTERS),
    /--ignore-pnpmfile --filter='!@figentra\/mobile' --filter='!@figentra\/playground' && pnpm rebuild esbuild$/,
  );
  assert.throws(() => installCommand([], [], ["x; rm -rf /"]), /not a pnpm filter/);
});

/** The first bash on PATH that is 4 or later (ci.yml's `mapfile`); the verify image and CI have bash 5. */
const BASH = (process.env.PATH ?? "")
  .split(":")
  .map((dir) => join(dir, "bash"))
  .find(
    (path) =>
      Number(
        spawnSync(path, ["-c", "echo ${BASH_VERSINFO[0]}"], { encoding: "utf8" }).stdout?.trim(),
      ) >= 4,
  );
const needsBash = BASH
  ? {}
  : { skip: "needs bash 4 or later on PATH (the verify image has bash 5)" };

/** Commands the stubs stand in for: each prints `CALL: <argv>` and the env the gate sets, and fails on FAIL. */
const STUB = [
  "#!/bin/sh",
  'line="$(basename "$0")${*:+ $*}"',
  // On stderr, which the step merges into its section, so a call whose stdout goes to a file is still seen.
  'echo >&2 "CALL: $line|TURBO_SCM_BASE=${TURBO_SCM_BASE-}|SPEC_GATE_REQUIRE_READY=${SPEC_GATE_REQUIRE_READY-}|STACKRA_BRANCH=${STACKRA_BRANCH-}|NODE_OPTIONS=${NODE_OPTIONS-}|OSV=${OSV_SCANNER_LOCAL_DB_CACHE_DIRECTORY-}"',
  'case "$line" in $FAIL) echo "stub failure"; exit 1 ;; esac',
  "",
].join("\n");
/** The node scripts the gate runs from the tree or the run (linear.mjs, the licence check), recorded the same way. */
const NODE_STUB = (name) =>
  [
    `const line = ["${name}", ...process.argv.slice(2)].join(" ");`,
    'const e = (k) => process.env[k] ?? "";',
    'console.error(`CALL: ${line}|PR_TITLE=${e("PR_TITLE")}|PR_BRANCH=${e("PR_BRANCH")}|PR_LABELS=${e("PR_LABELS")}|BASE_SHA=${e("BASE_SHA")}|HEAD_SHA=${e("HEAD_SHA")}`);',
    'const glob = new RegExp(`^${process.env.FAIL.split("*").map((p) => p.replaceAll(/[.+?^${}()|[\\]\\\\]/g, "\\\\$&")).join(".*")}$`);',
    "if (glob.test(line)) process.exit(1);",
    "",
  ].join("\n");

const PR_FACTS = {
  event: "pull_request",
  title: "feat(ci): the gate (STA-2761)",
  branch: "figentra/sta-2761-gate",
  labels: ["risk:R3", "chore-lane"],
  draft: false,
  base: BASE,
  head: SHA,
};

/** A tree to run the gate script in: a git repository with two compiled migrations, stub tools and PR facts. */
function gateFixture(facts = PR_FACTS) {
  const dir = mkdtempSync(join(tmpdir(), "stackra-gate-"));
  const work = join(dir, "work");
  const input = join(dir, "in");
  const bin = join(dir, "bin");
  for (const d of [work, input, bin, join(work, "tools/scripts"), join(work, "x")])
    mkdirSync(d, { recursive: true });
  mkdirSync(join(work, "services/a/.stackra/migrations"), { recursive: true });
  writeFileSync(
    join(work, "services/a/.stackra/migrations/0001.up.sql"),
    "create table a (id int);\n",
  );
  writeFileSync(
    join(work, "services/a/.stackra/migrations/0002.up.sql"),
    "-- stackra:transactional=false\ncreate index concurrently a_id on a (id);\n",
  );
  writeFileSync(join(work, "x/stackra.manifest.json"), "{}\n");
  writeFileSync(join(work, "tools/scripts/linear.mjs"), NODE_STUB("linear"));
  writeFileSync(join(input, "licence-check.mjs"), NODE_STUB("licence-check"));
  writeFileSync(join(input, "facts.json"), JSON.stringify(facts));
  for (const tool of ["pnpm", "actionlint", "zizmor", "osv-scanner", "squawk"]) {
    writeFileSync(join(bin, tool), STUB);
    chmodSync(join(bin, tool), 0o755);
  }
  const git = (...args) =>
    spawnSync(
      "git",
      ["-c", "user.name=t", "-c", "user.email=t@t.invalid", "-c", "commit.gpgsign=false", ...args],
      { cwd: work, encoding: "utf8" },
    );
  git("init", "-q");
  git("add", "-A");
  git("commit", "-qm", "fixture");
  return { dir, work, input, bin };
}

/** Runs the gate script in a fixture; `fail` is a shell glob of the stub call to fail. */
function runGate(fixture, fail = "__never__", script = gateScript) {
  const path = join(fixture.dir, "gate.sh");
  writeFileSync(path, script({ inDir: fixture.input, workDir: fixture.work }));
  const r = spawnSync(BASH, [path], {
    encoding: "utf8",
    env: {
      PATH: [fixture.bin, dirname(process.execPath), "/usr/bin", "/bin"].join(":"),
      HOME: fixture.dir,
      TMPDIR: fixture.dir,
      FAIL: fail,
    },
  });
  const sections = Object.fromEntries(stepSections(r.stdout).map((x) => [x.id, x]));
  const calls = (id) =>
    (sections[id]?.lines ?? [])
      .filter((l) => l.startsWith("CALL: "))
      .map((l) => {
        const [call, ...env] = l.slice(6).split("|");
        return { call, env: Object.fromEntries(env.map((kv) => kv.split(/=(.*)/s).slice(0, 2))) };
      });
  return { status: r.status, stdout: r.stdout, sections, calls };
}

const X = "--filter=!@figentra/mobile --filter=!@figentra/playground";
const SQUAWK =
  "squawk --pg-version=18.0 --exclude=prefer-robust-stmts --exclude=prefer-text-field --exclude=ban-char-field " +
  "--exclude=prefer-bigint-over-int --exclude=require-lock-timeout --exclude=require-statement-timeout";
/**
 * Each step on a pull request: the calls it makes (ci.yml's commands after the shell's quoting), the env it sets,
 * and the stub call that fails it (`fail`; the manifests step fails on a stale committed manifest instead).
 */
const STEP_CASES = {
  "dependency-scan": {
    calls: ["osv-scanner scan source --offline --lockfile=pnpm-lock.yaml"],
    env: { OSV: "/osv" },
    fail: "osv-scanner *",
  },
  "workflow-lint": {
    calls: ["actionlint", "zizmor --offline --config .github/zizmor.yml .github/workflows"],
    fail: "zizmor *",
  },
  "linear-key-check": {
    calls: ["linear check-pr", `pnpm exec commitlint --from ${BASE} --to ${SHA}`],
    env: { NODE_OPTIONS: "--conditions=@stackra/source" },
    fail: "linear *",
  },
  "licence-policy": {
    calls: [
      `pnpm licenses list --json --offline --recursive ${X}`,
      "pnpm list --recursive --json --depth Infinity --offline",
      "licence-check <tmp>/in/licences.json <tmp>/stackra-licences.json . <tmp>/stackra-pnpm-list.json gate",
    ],
    fail: "licence-check *",
  },
  "format-check": { calls: ["pnpm format:check"], fail: "pnpm format:check" },
  lint: { calls: [`pnpm exec turbo run lint ${X}`, "pnpm lint:root"], fail: "pnpm lint:root" },
  typecheck: {
    calls: [
      `pnpm exec turbo run typecheck --affected ${X} --continue=dependencies-successful --concurrency=2`,
    ],
    env: { TURBO_SCM_BASE: "HEAD~1" },
    fail: "pnpm exec turbo run typecheck *",
  },
  build: {
    calls: [`pnpm exec turbo run build --filter=...[HEAD~1] --filter=@stackra/cli... ${X}`],
    fail: "*@stackra/cli...*",
  },
  "service-gen": {
    calls: ["pnpm exec turbo run gen --filter=./services/*"],
    fail: "pnpm exec turbo run gen --filter=./services/*",
  },
  "manifests-match-gen": { calls: [], stale: true },
  "migration-lint": {
    calls: [
      `${SQUAWK} --assume-in-transaction ./services/a/.stackra/migrations/0001.up.sql`,
      `${SQUAWK} ./services/a/.stackra/migrations/0002.up.sql`,
    ],
    fail: "squawk *",
  },
  validate: {
    calls: ["pnpm validate"],
    env: { SPEC_GATE_REQUIRE_READY: "1", STACKRA_BRANCH: PR_FACTS.branch },
    fail: "pnpm validate",
  },
  "env-names": {
    calls: [
      "pnpm exec turbo run build --filter=@stackra/runway --output-logs=errors-only",
      "pnpm runway env check",
    ],
    fail: "pnpm runway env check",
  },
  boundaries: { calls: ["pnpm boundaries"], fail: "pnpm boundaries" },
  knip: {
    calls: [
      "pnpm exec turbo run build --filter=@stackra/vitest-config --output-logs=errors-only",
      `pnpm exec turbo run gen ${X} --output-logs=errors-only`,
      "pnpm knip",
    ],
    fail: "pnpm knip",
  },
  "secrets-scan": { calls: ["pnpm secrets:scan"], fail: "pnpm secrets:scan" },
  test: {
    calls: [`pnpm exec turbo run test ${X} --continue=dependencies-successful`],
    fail: "pnpm exec turbo run test *",
  },
};

test("gate script: the step cases cover every step, in GATE_STEPS order", () => {
  assert.deepEqual(
    Object.keys(STEP_CASES),
    GATE_STEPS.map((s) => s.id),
  );
});

let passing;
const passingRun = () => {
  passing ??= (() => {
    const fixture = gateFixture();
    return { fixture, ...runGate(fixture) };
  })();
  return passing;
};

for (const [id, expected] of Object.entries(STEP_CASES)) {
  test(
    `gate step ${id}: runs ci.yml's commands with its env, in its own section, and passes`,
    needsBash,
    () => {
      const run = passingRun();
      assert.equal(run.status, 0, run.stdout);
      assert.equal(run.sections[id]?.result, "pass", run.stdout);
      const calls = run.calls(id);
      assert.deepEqual(
        calls.map((c) => c.call.replaceAll(run.fixture.dir, "<tmp>")),
        expected.calls,
      );
      for (const [key, value] of Object.entries(expected.env ?? {}))
        for (const c of calls.filter((x) => key in x.env)) assert.equal(c.env[key], value, key);
      if (id === "linear-key-check")
        assert.deepEqual(calls[0].env, {
          PR_TITLE: PR_FACTS.title,
          PR_BRANCH: PR_FACTS.branch,
          PR_LABELS: "risk:R3,chore-lane",
          BASE_SHA: BASE,
          HEAD_SHA: SHA,
        });
    },
  );

  test(
    `gate step ${id}: its failure is named, every later step still runs, and the gate exits 1`,
    needsBash,
    () => {
      const fixture = gateFixture();
      if (expected.stale)
        writeFileSync(join(fixture.work, "x/stackra.manifest.json"), '{"stale":1}\n');
      const run = runGate(fixture, expected.fail ?? "__never__");
      assert.equal(run.status, 1, run.stdout);
      assert.equal(run.sections[id]?.result, "FAIL", run.stdout);
      for (const other of GATE_STEPS.map((s) => s.id).filter((x) => x !== id))
        assert.equal(run.sections[other]?.result, "pass", `${other} after ${id} failed`);
      assert.match(run.stdout, new RegExp(`^== failed: ${id}$`, "m"));
    },
  );
}

test(
  "gate script: on a push to main the Linear check is skipped and typecheck and build cover every gate member",
  needsBash,
  () => {
    const run = runGate(gateFixture({ event: "push", base: BASE, head: BASE }));
    assert.equal(run.status, 0, run.stdout);
    assert.equal(run.sections["linear-key-check"].result, "skip");
    assert.deepEqual(run.calls("linear-key-check"), []);
    assert.equal(
      run.calls("typecheck")[0].call,
      `pnpm exec turbo run typecheck ${X} --continue=dependencies-successful --concurrency=2`,
    );
    assert.equal(run.calls("build")[0].call, `pnpm exec turbo run build ${X}`);
    assert.deepEqual(
      {
        ready: run.calls("validate")[0].env.SPEC_GATE_REQUIRE_READY,
        branch: run.calls("validate")[0].env.STACKRA_BRANCH,
      },
      { ready: "", branch: "" },
    );
  },
);

test(
  "gate script: a draft PR does not require a ready spec; renovate and changeset-release skip commitlint",
  needsBash,
  () => {
    const draft = runGate(gateFixture({ ...PR_FACTS, draft: true }));
    assert.equal(draft.calls("validate")[0].env.SPEC_GATE_REQUIRE_READY, "");
    for (const branch of ["renovate/zod-4.x", "changeset-release/main"]) {
      const run = runGate(gateFixture({ ...PR_FACTS, branch }));
      assert.equal(run.sections["linear-key-check"].result, "pass");
      assert.deepEqual(
        run.calls("linear-key-check").map((c) => c.call),
        ["linear check-pr"],
      );
    }
  },
);

test("gate script: without readable PR facts no step runs and the gate fails", needsBash, () => {
  const fixture = gateFixture();
  rmSync(join(fixture.input, "facts.json"));
  const run = runGate(fixture);
  assert.equal(run.status, 1);
  assert.equal(stepSections(run.stdout).length, 0);
  assert.match(run.stdout, /PR facts file is unreadable/);
});

test("gate script: a hostile PR title or branch is data, never shell", needsBash, () => {
  const title = '$(touch pwned) `touch pwned2` "; touch pwned3; "';
  const fixture = gateFixture({ ...PR_FACTS, title, branch: "figentra/x;touch pwned4" });
  const run = runGate(fixture);
  assert.equal(run.status, 0, run.stdout);
  for (const f of ["pwned", "pwned2", "pwned3", "pwned4"])
    assert.equal(spawnSync("test", ["-e", join(fixture.work, f)]).status, 1, f);
  assert.equal(run.calls("linear-key-check")[0].env.PR_TITLE, title);
});

test(
  "mobile script: the licence step over the mobile install, then ci.yml's mobile job step, with no PR facts needed",
  needsBash,
  () => {
    const fixture = gateFixture();
    rmSync(join(fixture.input, "facts.json"));
    const run = runGate(fixture, "__never__", mobileScript);
    assert.equal(run.status, 0, run.stdout);
    assert.deepEqual(
      MOBILE_STEPS.map((s) => s.id),
      ["licence-policy", "mobile-apps"],
    );
    // the full install, unfiltered: the mobile-only packages and the mobile-scoped exceptions are checked here
    assert.deepEqual(
      run.calls("licence-policy").map((c) => c.call.replaceAll(fixture.dir, "<tmp>")),
      [
        "pnpm licenses list --json --offline --recursive",
        "pnpm list --recursive --json --depth Infinity --offline",
        "licence-check <tmp>/in/licences.json <tmp>/stackra-licences.json . <tmp>/stackra-pnpm-list.json mobile",
      ],
    );
    const red = runGate(fixture, "licence-check *", mobileScript);
    assert.equal(red.status, 1);
    assert.equal(red.sections["licence-policy"].result, "FAIL");
    // the mobile apps' step still runs and reports
    assert.equal(red.sections["mobile-apps"].result, "pass");
    assert.deepEqual(
      run.calls("mobile-apps").map((c) => c.call),
      [
        "pnpm exec turbo run lint typecheck build --filter=@figentra/mobile --filter=@figentra/playground --continue=dependencies-successful",
      ],
    );
    const failed = runGate(fixture, "pnpm exec turbo run lint *", mobileScript);
    assert.equal(failed.status, 1);
    assert.equal(failed.sections["mobile-apps"].result, "FAIL");
  },
);

/** git in `cwd` with a fixed identity; asserts success and returns trimmed stdout. */
function gitIn(cwd, ...args) {
  const r = spawnSync(
    "git",
    ["-c", "user.name=t", "-c", "user.email=t@t.invalid", "-c", "commit.gpgsign=false", ...args],
    { cwd, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

test("gate prepare: the tested tree is a merge onto main with main's and the PR's history from the bundle", () => {
  const dir = mkdtempSync(join(tmpdir(), "stackra-prepare-"));
  const repo = join(dir, "mirror");
  const input = join(dir, "in");
  const work = join(dir, "work");
  for (const d of [repo, input, work]) mkdirSync(d, { recursive: true });
  const git = gitIn;
  git(repo, "init", "-q");
  writeFileSync(join(repo, "a.txt"), "main\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "main one");
  const base = git(repo, "rev-parse", "HEAD");
  git(repo, "checkout", "-qb", "pr");
  writeFileSync(join(repo, "b.txt"), "pr\n");
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "feat: pr one");
  const head = git(repo, "rev-parse", "HEAD");
  git(repo, "update-ref", "refs/stackra/base", base);
  git(repo, "update-ref", "refs/stackra/head", head);
  git(
    repo,
    "bundle",
    "create",
    "-q",
    join(input, "history.bundle"),
    "refs/stackra/base",
    "refs/stackra/head",
  );
  git(repo, "archive", "--format=tar", "-o", join(input, "src.tar"), head);
  const r = spawnSync("sh", ["-c", gatePrepare(input, work)], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(git(work, "rev-parse", "HEAD~1"), base);
  assert.equal(git(work, "rev-parse", "HEAD^2"), head);
  assert.equal(git(work, "log", "--format=%s", `${base}..${head}`), "feat: pr one");
  assert.equal(git(work, "status", "--porcelain"), "");
  assert.equal(readFileSync(join(work, "b.txt"), "utf8"), "pr\n");
  // main itself: one parent, no PR ref
  const mainOnly = join(dir, "main-in");
  mkdirSync(mainOnly);
  git(repo, "update-ref", "-d", "refs/stackra/head");
  git(repo, "bundle", "create", "-q", join(mainOnly, "history.bundle"), "refs/stackra/base");
  git(repo, "archive", "--format=tar", "-o", join(mainOnly, "src.tar"), base);
  const work2 = join(dir, "work2");
  mkdirSync(work2);
  assert.equal(spawnSync("sh", ["-c", gatePrepare(mainOnly, work2)]).status, 0);
  assert.equal(git(work2, "rev-parse", "HEAD~1"), base);
  assert.equal(spawnSync("git", ["-C", work2, "rev-parse", "-q", "--verify", "HEAD^2"]).status, 1);
});

test("spdxAllowed: AND needs every part, OR one; WITH must be listed whole; anything unparsable is refused", () => {
  const allowed = new Set([
    "MIT",
    "Apache-2.0",
    "BSD-3-Clause",
    "GPL-2.0-only WITH Classpath-exception-2.0",
  ]);
  for (const ok of [
    "MIT",
    "(MIT OR GPL-3.0-or-later)",
    "MIT AND BSD-3-Clause",
    "(BSD-3-Clause AND Apache-2.0)",
    "GPL-3.0-only OR (MIT AND Apache-2.0)",
    "mit or Apache-2.0".replace("mit", "MIT"),
    "GPL-2.0-only WITH Classpath-exception-2.0",
  ])
    assert.equal(spdxAllowed(ok, allowed), true, ok);
  for (const bad of [
    "GPL-3.0-only",
    "MIT AND GPL-2.0-or-later",
    "Apache-2.0 AND GPL-2.0-or-later",
    "MIT/X11",
    "Unknown",
    "",
    undefined,
    "(MIT",
    "MIT OR",
    "AND MIT",
    "GPL-2.0-only WITH Other-exception",
    "MIT Apache-2.0",
  ])
    assert.equal(spdxAllowed(bad, allowed), false, String(bad));
});

/** A policy shaped like tools/policy/licences.json, small enough to read in a test. */
const POLICY = Object.freeze({
  allow: ["MIT", "ISC", "GPL-3.0-only"],
  deny: [
    "^GPL",
    "^LGPL",
    "^AGPL",
    "^CC-.*-(NC|ND)(-|$)",
    "^(Unknown|UNKNOWN|UNLICENSED|SEE LICENSE IN .*)$",
  ],
  exceptions: [
    { name: "uniwind-pro", licence: "UNLICENSED", reason: "held", scope: "mobile" },
    { name: "chainsaw", licence: "MIT/X11", reason: "MIT", scope: "runtime", versions: ["0.1.0"] },
    {
      name: "pg-gis",
      licence: "Apache-2.0 AND GPL-2.0-or-later",
      reason: "tests",
      scope: "dev-only",
    },
  ],
});
const pkg = (name, license, versions = ["1.0.0"]) => ({ [license]: [{ name, versions, license }] });
const violations = (listing, policy = POLICY) => licenceViolations(listing, policy);

test("licence policy: an unknown licence fails; an allowed one passes; nothing passes vacuously", () => {
  assert.deepEqual(violations({ ...pkg("a", "MIT"), ...pkg("b", "ISC", ["2.0.0"]) }), []);
  assert.deepEqual(violations({ ...pkg("a", "MIT"), ...pkg("x", "WTFPL", ["1", "2"]) }), [
    "x@1,2: WTFPL",
  ]);
  assert.deepEqual(violations(pkg("u", "Unknown")), ["u@1.0.0: Unknown"]);
  assert.deepEqual(violations({}), ["the licence listing names no package"]);
  assert.deepEqual(violations(null), ["the licence listing names no package"]);
  assert.deepEqual(violations({ MIT: [] }), ["the licence listing names no package"]);
});

test("licence policy: a denied family fails even when `allow` lists it; OR passes beside an allowed licence, AND does not", () => {
  // GPL-3.0-only is on POLICY.allow, and ^GPL denies it.
  assert.deepEqual(violations(pkg("g", "GPL-3.0-only")), ["g@1.0.0: GPL-3.0-only"]);
  assert.deepEqual(violations(pkg("l", "lgpl-2.1-or-later")), ["l@1.0.0: lgpl-2.1-or-later"]);
  assert.deepEqual(violations(pkg("n", "CC-BY-NC-4.0")), ["n@1.0.0: CC-BY-NC-4.0"]);
  assert.deepEqual(violations(pkg("s", "SEE LICENSE IN LICENSE.md")), [
    "s@1.0.0: SEE LICENSE IN LICENSE.md",
  ]);
  assert.deepEqual(violations(pkg("o", "MIT OR GPL-2.0")), []);
  assert.deepEqual(violations(pkg("o", "(GPL-2.0 OR MIT)")), []);
  assert.deepEqual(violations(pkg("a", "MIT AND GPL-2.0")), ["a@1.0.0: MIT AND GPL-2.0"]);
  assert.deepEqual(violations(pkg("a", "GPL-2.0 OR LGPL-3.0")), ["a@1.0.0: GPL-2.0 OR LGPL-3.0"]);
});

test("licence policy: an exception holds only for its exact name, licence string and pinned versions", () => {
  assert.deepEqual(violations(pkg("uniwind-pro", "UNLICENSED", ["1.9.0", "2.0.0"])), []);
  assert.deepEqual(violations(pkg("pg-gis", "Apache-2.0 AND GPL-2.0-or-later", ["0.2.15"])), []);
  assert.deepEqual(violations(pkg("chainsaw", "MIT/X11", ["0.1.0"])), []);
  // another package under the same string; the same package under another string
  assert.deepEqual(violations(pkg("evil", "UNLICENSED")), ["evil@1.0.0: UNLICENSED"]);
  assert.deepEqual(violations(pkg("uniwind-pro", "Unknown")), ["uniwind-pro@1.0.0: Unknown"]);
  assert.deepEqual(violations(pkg("pg-gis", "Apache-2.0 AND GPL-3.0-or-later")), [
    "pg-gis@1.0.0: Apache-2.0 AND GPL-3.0-or-later",
  ]);
  assert.deepEqual(violations(pkg("chainsaw", "MIT / X11", ["0.1.0"])), [
    "chainsaw@0.1.0: MIT / X11",
  ]);
  // a pinned exception: a new version, a second version beside the pinned one, or no version at all
  assert.deepEqual(violations(pkg("chainsaw", "MIT/X11", ["0.1.1"])), ["chainsaw@0.1.1: MIT/X11"]);
  assert.deepEqual(violations(pkg("chainsaw", "MIT/X11", ["0.1.0", "0.2.0"])), [
    "chainsaw@0.1.0,0.2.0: MIT/X11",
  ]);
  assert.deepEqual(violations({ "MIT/X11": [{ name: "chainsaw", license: "MIT/X11" }] }), [
    "chainsaw@: MIT/X11",
  ]);
});

test("licence policy: a malformed exception is a violation and holds for nothing; so is a missing or broken deny list", () => {
  const withExceptions = (...exceptions) => ({ ...POLICY, exceptions });
  const good = { name: "chainsaw", licence: "MIT/X11", reason: "MIT", scope: "runtime" };
  const listing = pkg("chainsaw", "MIT/X11", ["0.1.0"]);
  const { scope: _scope, ...noScope } = good;
  assert.deepEqual(violations(listing, withExceptions(noScope)), [
    "chainsaw@0.1.0: MIT/X11",
    "licence exception 1 (chainsaw) has no `scope` of dev-only, runtime, tool, mobile",
  ]);
  for (const [bad, problem] of [
    [{ ...good, scope: "prod" }, "has no `scope` of dev-only, runtime, tool, mobile"],
    [{ ...good, reason: " " }, "has no `reason`"],
    [{ ...good, licence: undefined }, "has no `licence`"],
    [{ ...good, versions: [] }, "has a `versions` that is not a list of versions"],
    [{ ...good, versions: "0.1.0" }, "has a `versions` that is not a list of versions"],
    [{ ...good, version: ["0.1.0"] }, "has an unknown field `version`"],
  ])
    assert.deepEqual(violations(listing, withExceptions(bad)), [
      "chainsaw@0.1.0: MIT/X11",
      `licence exception 1 (chainsaw) ${problem}`,
    ]);
  assert.deepEqual(violations(listing, withExceptions(null, good)), [
    "licence exception 1 is not an object",
  ]);
  assert.deepEqual(violations(pkg("a", "MIT"), { ...POLICY, exceptions: {} }), [
    "the licence policy's `exceptions` is not a list",
  ]);
  assert.deepEqual(violations(listing, { ...POLICY, deny: undefined }), [
    "the licence policy has no `deny` list",
  ]);
  assert.deepEqual(violations(listing, { ...POLICY, deny: [] }), [
    "the licence policy has no `deny` list",
  ]);
  assert.match(
    violations(listing, { ...POLICY, deny: ["^GPL", "(unclosed"] })[0],
    /does not parse/,
  );
  assert.match(violations(listing, { ...POLICY, deny: [""] })[0], /does not parse/);
  assert.deepEqual(violations(listing, { ...POLICY, allow: [] }), [
    "the licence policy has no `allow` list",
  ]);
});

test("workspaceManifest: packages, the default and named catalogs, and overrides, from pnpm's block style", () => {
  const yaml = [
    "# a comment",
    "packages:",
    "  - apps/*",
    '  - "packages/*/*" # quoted',
    "- services/*",
    "  - '!**/fixtures/**'",
    "catalogMode: strict",
    "catalog:",
    '  "@types/node": 26.6.4',
    "  zod: 4.6.7 # trailing",
    "catalogs:",
    "  # Uniwind Pro",
    "  uniwind-pro:",
    "    uniwind: npm:uniwind-pro@1.9.0",
    "  quality:",
    "    oxlint: 1.86.0",
    "    'it''s': 1",
    "overrides:",
    '  "x@1>y": npm:uniwind-pro@1.9.0',
    "allowBuilds:",
    "  uniwind: true",
  ].join("\n");
  const w = workspaceManifest(yaml);
  assert.deepEqual(w.packages, ["apps/*", "packages/*/*", "services/*", "!**/fixtures/**"]);
  assert.deepEqual({ ...w.catalogs.default }, { "@types/node": "26.6.4", zod: "4.6.7" });
  assert.deepEqual({ ...w.catalogs["uniwind-pro"] }, { uniwind: "npm:uniwind-pro@1.9.0" });
  assert.deepEqual({ ...w.catalogs.quality }, { oxlint: "1.86.0", "it's": "1" });
  assert.deepEqual({ ...w.overrides }, { "x@1>y": "npm:uniwind-pro@1.9.0" });
  assert.deepEqual(workspaceManifest("").packages, []);
  // main's own file: the two Uniwind Pro members' alias and the PostGIS entry
  const main = workspaceManifest(
    readFileSync(new URL("../../../pnpm-workspace.yaml", import.meta.url), "utf8"),
  );
  assert.ok(main.packages.includes("apps/*"));
  assert.match(main.catalogs["uniwind-pro"].uniwind, /^npm:uniwind-pro@/);
  assert.ok(main.catalogs.default["@electric-sql/pglite-postgis"]);
});

/** A workspace member for exceptionScopeViolations. */
const member = (dir, manifest) => ({ dir, manifest: { name: `@t/${dir}`, ...manifest } });
const WORKSPACE = workspaceManifest(
  [
    "packages:",
    "  - apps/*",
    "  - packages/*/*",
    "catalog:",
    "  pg-gis: 0.2.15",
    "  gis-alias: npm:pg-gis@0.2.15",
    "catalogs:",
    "  uniwind-pro:",
    "    uniwind: npm:uniwind-pro@1.9.0",
    "  quality:",
    "    uniwind: 1.12.1",
  ].join("\n"),
);
const scopeViolations = (members, workspace = WORKSPACE) =>
  exceptionScopeViolations(
    [member(".", { name: "root", private: true }), ...members],
    workspace,
    POLICY,
    MOBILE_MEMBERS,
  );

/** The member main keeps PostGIS for PGlite in, with `manifest`. */
const db = (manifest) => [member("packages/data/database", manifest)];

test("licence scopes: a dev-only package fails in a publishable member's dependencies or non-optional peer, nowhere else", () => {
  // where main has it: devDependencies of a publishable package
  assert.deepEqual(
    scopeViolations(db({ private: false, devDependencies: { "pg-gis": "catalog:" } })),
    [],
  );
  assert.deepEqual(
    scopeViolations(
      db({
        peerDependencies: { "pg-gis": "catalog:" },
        peerDependenciesMeta: { "pg-gis": { optional: true } },
      }),
    ),
    [],
  );
  // a private member may ship it in dependencies: it is never published
  assert.deepEqual(
    scopeViolations(db({ private: true, dependencies: { "pg-gis": "catalog:" } })),
    [],
  );
  const where = "packages/data/database (@t/packages/data/database): pg-gis (scope dev-only) is in";
  const tail = "of a publishable package; only devDependencies or an optional peer";
  assert.deepEqual(scopeViolations(db({ dependencies: { "pg-gis": "catalog:" } })), [
    `${where} dependencies ${tail}`,
  ]);
  assert.deepEqual(scopeViolations(db({ peerDependencies: { "pg-gis": "^0.2.0" } })), [
    `${where} non-optional peerDependencies ${tail}`,
  ]);
  assert.deepEqual(
    scopeViolations(
      db({
        peerDependencies: { "pg-gis": "^0.2.0" },
        peerDependenciesMeta: { "pg-gis": { optional: false } },
      }),
    ),
    [`${where} non-optional peerDependencies ${tail}`],
  );
  assert.deepEqual(scopeViolations(db({ optionalDependencies: { "pg-gis": "0.2.15" } })), [
    `${where} optionalDependencies ${tail}`,
  ]);
  // under another name: an npm alias, directly or through a catalog entry
  assert.deepEqual(scopeViolations(db({ dependencies: { gis: "npm:pg-gis@0.2.15" } })), [
    `${where} dependencies ${tail}`,
  ]);
  assert.deepEqual(scopeViolations(db({ dependencies: { "gis-alias": "catalog:default" } })), [
    `${where} dependencies ${tail}`,
  ]);
});

test("licence scopes: a mobile package may be a dependency of apps/mobile and apps/playground only", () => {
  const pro = { uniwind: "catalog:uniwind-pro" };
  const mobileMembers = [
    member("apps/mobile", { name: "@figentra/mobile", private: true, dependencies: pro }),
    member("apps/playground", {
      name: "@figentra/playground",
      private: true,
      devDependencies: pro,
    }),
  ];
  assert.deepEqual(scopeViolations(mobileMembers), []);
  // the free `uniwind` from another catalog is not Uniwind Pro
  assert.deepEqual(
    scopeViolations([
      member("packages/ui/ui", { devDependencies: { uniwind: "catalog:quality" } }),
    ]),
    [],
  );
  const only = "only apps/mobile and apps/playground may use it";
  for (const kind of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ])
    assert.deepEqual(
      scopeViolations([...mobileMembers, member("packages/ui/ui", { private: true, [kind]: pro })]),
      [`packages/ui/ui (@t/packages/ui/ui): uniwind-pro (scope mobile) is in ${kind}; ${only}`],
    );
  assert.deepEqual(
    scopeViolations([member("apps/web", { dependencies: { "uniwind-pro": "1.9.0" } })]),
    [`apps/web (@t/apps/web): uniwind-pro (scope mobile) is in dependencies; ${only}`],
  );
  // the right name in another directory, or the right directory under another name
  assert.deepEqual(
    scopeViolations([member("apps/fake", { name: "@figentra/mobile", dependencies: pro })]),
    [`apps/fake (@figentra/mobile): uniwind-pro (scope mobile) is in dependencies; ${only}`],
  );
  assert.deepEqual(
    scopeViolations([member("apps/mobile", { name: "@figentra/other", dependencies: pro })]),
    [`apps/mobile (@figentra/other): uniwind-pro (scope mobile) is in dependencies; ${only}`],
  );
  // an override that aliases it in for everyone
  assert.deepEqual(
    scopeViolations([], {
      ...WORKSPACE,
      overrides: { uniwind: "npm:uniwind-pro@1.9.0" },
    }),
    [`pnpm-workspace.yaml overrides: uniwind is aliased to uniwind-pro (scope mobile); ${only}`],
  );
  assert.deepEqual(
    exceptionScopeViolations(
      [member(".", { private: true, pnpm: { overrides: { uniwind: "npm:uniwind-pro@1" } } })],
      WORKSPACE,
      POLICY,
      MOBILE_MEMBERS,
    ),
    [`package.json pnpm.overrides: uniwind is aliased to uniwind-pro (scope mobile); ${only}`],
  );
  // nothing passes vacuously
  assert.deepEqual(exceptionScopeViolations([], WORKSPACE, POLICY, MOBILE_MEMBERS), [
    "the workspace has no member",
  ]);
  assert.deepEqual(scopeViolations([], { ...WORKSPACE, packages: [] }), [
    "pnpm-workspace.yaml names no `packages`",
  ]);
  assert.deepEqual(scopeViolations([{ dir: "apps/broken", unreadable: "Unexpected token" }]), [
    "apps/broken/package.json is unreadable: Unexpected token",
  ]);
  assert.deepEqual(
    MOBILE_MEMBERS.map((m) => `!${m.name}`),
    GATE_FILTERS,
  );
});

/** The lockfile of the generated check's workspace: the root, the mobile app and the database member. */
const CLI_LOCK = [
  "lockfileVersion: '9.0'",
  "",
  "importers:",
  "",
  "  .: {}",
  "",
  "  apps/mobile:",
  "    dependencies:",
  "      uniwind:",
  "        specifier: catalog:uniwind-pro",
  "        version: uniwind-pro@1.9.0",
  "",
  "  packages/data/database:",
  "    devDependencies:",
  "      '@electric-sql/pglite-postgis':",
  "        specifier: 0.2.15",
  "        version: 0.2.15",
  "",
  "snapshots:",
  "",
  "  '@electric-sql/pglite-postgis@0.2.15': {}",
  "",
  "  uniwind-pro@1.9.0: {}",
  "",
].join("\n");

/**
 * A pnpm 12 lockfile in its real layout (a package-manager document first, then the workspace's): the publishable
 * `packages/lib/a` reaches pg-gis only through its devDependencies, an optional peer of `maps`, and a workspace link
 * to `packages/lib/util`, whose devDependencies a consumer never installs; the private member ships it; `cycle` and
 * `loop` depend on each other.
 */
const LOCK = [
  "---",
  "lockfileVersion: '9.0'",
  "",
  "importers:",
  "",
  "  .:",
  "    packageManagerDependencies:",
  "      pnpm:",
  "        specifier: 12.16.1",
  "        version: 12.16.1",
  "",
  "snapshots:",
  "",
  "  pnpm@12.16.1: {}",
  "",
  "---",
  "lockfileVersion: '9.0'",
  "",
  "settings:",
  "  autoInstallPeers: true",
  "",
  "importers:",
  "",
  "  .:",
  "    devDependencies:",
  "      gis-tests:",
  "        specifier: 1.0.0",
  "        version: 1.0.0",
  "",
  "  apps/mobile:",
  "    dependencies:",
  "      uniwind:",
  "        specifier: catalog:uniwind-pro",
  "        version: uniwind-pro@1.9.0(react@19.3.0)",
  "",
  "  packages/lib/a:",
  "    dependencies:",
  "      cycle:",
  "        specifier: 'catalog:'",
  "        version: 1.0.0",
  "      maps:",
  "        specifier: ^2.0.0",
  "        version: 2.0.0(pg-gis@0.2.15)",
  "      '@t/util':",
  "        specifier: workspace:*",
  "        version: link:../util",
  "    devDependencies:",
  "      gis-tests:",
  "        specifier: 1.0.0",
  "        version: 1.0.0",
  "",
  "  packages/lib/util:",
  "    devDependencies:",
  "      gis-tests:",
  "        specifier: 1.0.0",
  "        version: 1.0.0",
  "",
  "  packages/lib/private:",
  "    dependencies:",
  "      gis-tests:",
  "        specifier: 1.0.0",
  "        version: 1.0.0",
  "",
  "packages:",
  "",
  "  '@electric-sql/pglite@0.5.15':",
  "    resolution: {integrity: sha512-AAAA}",
  "",
  "  maps@2.0.0:",
  "    resolution: {integrity: sha512-BBBB}",
  "    peerDependencies:",
  "      pg-gis: '>=0.2'",
  "    peerDependenciesMeta:",
  "      pg-gis:",
  "        optional: true",
  "",
  "snapshots:",
  "",
  "  cycle@1.0.0:",
  "    dependencies:",
  "      loop: 1.0.0",
  "",
  "  loop@1.0.0:",
  "    dependencies:",
  "      cycle: 1.0.0",
  "    optionalDependencies:",
  "      '@scope/native': 3.0.0",
  "    transitivePeerDependencies:",
  "      - supports-color",
  "",
  "  '@scope/native@3.0.0':",
  "    optional: true",
  "",
  "  maps@2.0.0(pg-gis@0.2.15):",
  "    dependencies:",
  "      pg-gis: 0.2.15",
  "",
  "  gis-tests@1.0.0:",
  "    dependencies:",
  "      pg-gis: 0.2.15",
  "",
  "  pg-gis@0.2.15: {}",
  "",
  "  uniwind-pro@1.9.0(react@19.3.0): {}",
  "",
].join("\n");
const LOCK_MEMBERS = [
  member(".", { name: "root", private: true }),
  member("apps/mobile", { name: "@figentra/mobile", private: true }),
  member("packages/lib/a", {}),
  member("packages/lib/util", {}),
  member("packages/lib/private", { private: true }),
];
const closure = (lock, members = LOCK_MEMBERS, policy = POLICY) =>
  lockfileScopeViolations(lockfileGraph(lock), members, policy, MOBILE_MEMBERS);
/** LOCK with `lines` added under the first line that is exactly `under`. */
const withEdge = (under, ...lines) => {
  const all = LOCK.split("\n");
  const index = all.indexOf(under);
  assert.notEqual(index, -1, under);
  all.splice(index + 1, 0, ...lines);
  return all.join("\n");
};

test("lockfileGraph: importers, snapshots (dependencies and optionalDependencies) and optional peers, every document", () => {
  const graph = lockfileGraph(LOCK);
  assert.deepEqual(Object.keys(graph.importers), [
    ".",
    "apps/mobile",
    "packages/lib/a",
    "packages/lib/util",
    "packages/lib/private",
  ]);
  assert.deepEqual(
    { ...graph.importers["packages/lib/a"].dependencies },
    {
      cycle: "1.0.0",
      maps: "2.0.0(pg-gis@0.2.15)",
      "@t/util": "link:../util",
    },
  );
  assert.deepEqual(
    { ...graph.importers["packages/lib/a"].devDependencies },
    { "gis-tests": "1.0.0" },
  );
  assert.equal(
    graph.importers["apps/mobile"].dependencies.uniwind,
    "uniwind-pro@1.9.0(react@19.3.0)",
  );
  assert.deepEqual(
    { ...graph.snapshots["loop@1.0.0"] },
    { cycle: "1.0.0", "@scope/native": "3.0.0" },
  );
  assert.deepEqual({ ...graph.snapshots["pg-gis@0.2.15"] }, {});
  assert.ok("pnpm@12.16.1" in graph.snapshots);
  assert.deepEqual([...graph.optionalPeers["maps@2.0.0"]], ["pg-gis"]);
  assert.equal(graph.importers["."].packageManagerDependencies, undefined);
});

test("licence closures: devDependencies, an optional peer, a private member and a cycle keep a dev-only package out", () => {
  assert.deepEqual(closure(LOCK), []);
  // the same package as a `tool`: the same rule
  const asTool = {
    ...POLICY,
    exceptions: POLICY.exceptions.map((e) => ({
      ...e,
      scope: e.scope === "dev-only" ? "tool" : e.scope,
    })),
  };
  assert.deepEqual(closure(LOCK, LOCK_MEMBERS, asTool), []);
});

test("licence closures: a dev-only or tool package a publishable member ships transitively fails, with its path", () => {
  const where = "packages/lib/a (@t/packages/lib/a): pg-gis";
  // a runtime dependency two steps down
  assert.deepEqual(closure(withEdge("      loop: 1.0.0", "      gis-tests: 1.0.0")), [
    `${where} (scope dev-only) ships with a publishable package: packages/lib/a → cycle@1.0.0 → gis-tests@1.0.0 → pg-gis@0.2.15`,
  ]);
  // through an optional dependency of a dependency
  assert.deepEqual(
    closure(withEdge("  '@scope/native@3.0.0':", "    dependencies:", "      pg-gis: 0.2.15")),
    [
      `${where} (scope dev-only) ships with a publishable package: packages/lib/a → cycle@1.0.0 → loop@1.0.0 → @scope/native@3.0.0 → pg-gis@0.2.15`,
    ],
  );
  // through a workspace link to a member that ships it at runtime
  const linked = LOCK.replace(
    "  packages/lib/util:\n    devDependencies:",
    "  packages/lib/util:\n    dependencies:",
  );
  assert.notEqual(linked, LOCK);
  assert.deepEqual(closure(linked), [
    `${where} (scope dev-only) ships with a publishable package: packages/lib/a → packages/lib/util → gis-tests@1.0.0 → pg-gis@0.2.15`,
    "packages/lib/util (@t/packages/lib/util): pg-gis (scope dev-only) ships with a publishable package: packages/lib/util → gis-tests@1.0.0 → pg-gis@0.2.15",
  ]);
  // the private member that ships it is never published
  const shipped = LOCK_MEMBERS.map((m) =>
    m.dir === "packages/lib/private" ? member(m.dir, {}) : m,
  );
  assert.deepEqual(closure(LOCK, shipped), [
    "packages/lib/private (@t/packages/lib/private): pg-gis (scope dev-only) ships with a publishable package: packages/lib/private → gis-tests@1.0.0 → pg-gis@0.2.15",
  ]);
  // a peer the package does not mark optional counts
  assert.deepEqual(closure(LOCK.replace("      pg-gis:\n        optional: true\n", "")), [
    `${where} (scope dev-only) ships with a publishable package: packages/lib/a → maps@2.0.0 → pg-gis@0.2.15`,
  ]);
  // the member's own non-optional peer, resolved where the importer lists it
  const peer = LOCK_MEMBERS.map((m) =>
    m.dir === "packages/lib/a" ? member(m.dir, { peerDependencies: { "gis-tests": "1" } }) : m,
  );
  assert.deepEqual(closure(LOCK, peer), [
    `${where} (scope dev-only) ships with a publishable package: packages/lib/a → gis-tests@1.0.0 → pg-gis@0.2.15`,
  ]);
  const optionalPeer = LOCK_MEMBERS.map((m) =>
    m.dir === "packages/lib/a"
      ? member(m.dir, {
          peerDependencies: { "gis-tests": "1" },
          peerDependenciesMeta: { "gis-tests": { optional: true } },
        })
      : m,
  );
  assert.deepEqual(closure(LOCK, optionalPeer), []);
  const asTool = {
    ...POLICY,
    exceptions: POLICY.exceptions.map((e) => ({
      ...e,
      scope: e.scope === "dev-only" ? "tool" : e.scope,
    })),
  };
  assert.match(
    closure(LOCK, peer, asTool)[0],
    /pg-gis \(scope tool\) ships with a publishable package/,
  );
});

test("licence closures: a mobile package anywhere in another member's closure fails, devDependencies included", () => {
  const only = "only apps/mobile and apps/playground may";
  const viaDev = withEdge(
    "  gis-tests@1.0.0:",
    "    optionalDependencies:",
    "      styling: uniwind-pro@1.9.0(react@19.3.0)",
  );
  assert.deepEqual(closure(viaDev), [
    `. (root): uniwind-pro (scope mobile) is installed: . → gis-tests@1.0.0 → uniwind-pro@1.9.0; ${only}`,
    `packages/lib/a (@t/packages/lib/a): uniwind-pro (scope mobile) is installed: packages/lib/a → gis-tests@1.0.0 → uniwind-pro@1.9.0; ${only}`,
    `packages/lib/private (@t/packages/lib/private): uniwind-pro (scope mobile) is installed: packages/lib/private → gis-tests@1.0.0 → uniwind-pro@1.9.0; ${only}`,
    `packages/lib/util (@t/packages/lib/util): uniwind-pro (scope mobile) is installed: packages/lib/util → gis-tests@1.0.0 → uniwind-pro@1.9.0; ${only}`,
  ]);
  // the mobile app itself may, and only under its own directory and name
  const renamed = LOCK_MEMBERS.map((m) =>
    m.dir === "apps/mobile" ? member(m.dir, { name: "@t/other", private: true }) : m,
  );
  assert.deepEqual(closure(LOCK, renamed), [
    `apps/mobile (@t/other): uniwind-pro (scope mobile) is installed: apps/mobile → uniwind-pro@1.9.0; ${only}`,
  ]);
});

test("licence closures: a package or link the walk reaches without a lockfile entry fails closed, with its path", () => {
  // pnpm writes a snapshot for every package, `{}` included: a missing one means the reader misread the file.
  const noSnapshot = LOCK.replace("  pg-gis@0.2.15: {}\n", "");
  assert.notEqual(noSnapshot, LOCK);
  assert.deepEqual(closure(noSnapshot), [
    "pnpm-lock.yaml has no snapshot for pg-gis@0.2.15 (reached via . → gis-tests@1.0.0 → pg-gis@0.2.15)",
  ]);
  const noLoop = LOCK.replace(
    "  loop@1.0.0:\n    dependencies:\n      cycle: 1.0.0\n",
    "  other@1.0.0:\n    dependencies:\n      cycle: 1.0.0\n",
  );
  assert.notEqual(noLoop, LOCK);
  assert.deepEqual(closure(noLoop), [
    "pnpm-lock.yaml has no snapshot for loop@1.0.0 (reached via packages/lib/a → cycle@1.0.0 → loop@1.0.0)",
  ]);
  const noImporter = LOCK.replace(
    "  packages/lib/util:\n    devDependencies:",
    "  packages/lib/utility:\n    devDependencies:",
  );
  assert.notEqual(noImporter, LOCK);
  const lines = closure(
    noImporter,
    LOCK_MEMBERS.filter((m) => m.dir !== "packages/lib/util"),
  );
  assert.deepEqual(lines, [
    "pnpm-lock.yaml has no importer for packages/lib/util (reached via packages/lib/a → packages/lib/util)",
  ]);
});

test("licence closures: a lockfile without importers, or without a member, is itself a violation", () => {
  assert.deepEqual(closure(""), ["pnpm-lock.yaml lists no importers"]);
  assert.deepEqual(closure(LOCK, [...LOCK_MEMBERS, member("packages/lib/new", {})]), [
    "packages/lib/new (@t/packages/lib/new) is not in pnpm-lock.yaml",
  ]);
});

test("lockfileGraph fails closed: each hostile layout pnpm would install is a problem, never a smaller graph", () => {
  // each variant hides the pg-gis edge from a line reader that keys off exact indentation (review of #1043, MEDIUM A)
  const variants = {
    "a comment between a snapshot key and its dependencies": [
      "  gis-tests@1.0.0:\n    dependencies:",
      "  gis-tests@1.0.0:\n  # note:\n    dependencies:",
    ],
    "a flow mapping of snapshot dependencies": [
      "  gis-tests@1.0.0:\n    dependencies:\n      pg-gis: 0.2.15",
      "  gis-tests@1.0.0:\n    dependencies: {pg-gis: 0.2.15, uniwind-pro: 1.9.0}",
    ],
    "snapshot dependencies at a 7-space indent": [
      "  gis-tests@1.0.0:\n    dependencies:\n      pg-gis: 0.2.15",
      "  gis-tests@1.0.0:\n    dependencies:\n       pg-gis: 0.2.15",
    ],
    "a comment inside an importer": [
      "  packages/lib/a:\n    dependencies:",
      "  packages/lib/a:\n    # dependencies: {}\n    dependencies:",
    ],
    "a flow mapping for an importer dependency": [
      "      maps:\n        specifier: ^2.0.0\n        version: 2.0.0(pg-gis@0.2.15)",
      "      maps: {specifier: ^2.0.0, version: 2.0.0(pg-gis@0.2.15)}",
    ],
    "an anchor": ["      pg-gis: 0.2.15", "      pg-gis: &v 0.2.15"],
    "an alias": ["      cycle: 1.0.0\n", "      cycle: *v\n"],
    "a tag": ["      loop: 1.0.0", "      loop: !!str 1.0.0"],
    "a block scalar": ["      loop: 1.0.0", "      loop: >-\n        1.0.0"],
    "a trailing comment": ["      loop: 1.0.0", "      loop: 1.0.0 # was 2"],
    "a key under a scalar": ["  pg-gis@0.2.15: {}", "  pg-gis@0.2.15: {}\n    dependencies:"],
    "a tab": ["      loop: 1.0.0", "\t      loop: 1.0.0"],
    "an unknown snapshot field": [
      "  pg-gis@0.2.15: {}",
      "  pg-gis@0.2.15:\n    requires:\n      x: 1",
    ],
  };
  assert.deepEqual(lockfileGraph(LOCK).problems, []);
  for (const [name, [from, to]] of Object.entries(variants)) {
    assert.ok(LOCK.includes(from), name);
    const hostile = LOCK.replace(from, to);
    const problems = lockfileGraph(hostile).problems;
    assert.ok(problems.length > 0, name);
    assert.match(problems[0], /^pnpm-lock\.yaml line \d+: /, name);
    // and the problem reaches the verdict
    assert.ok(
      closure(hostile).some((l) => l.startsWith("pnpm-lock.yaml line ")),
      name,
    );
  }
});

test("workspaceManifest fails closed: flow style, anchors, aliases, tags, block scalars and a second document", () => {
  const ok = workspaceManifest("packages:\n  - apps/*\ncatalog:\n  zod: 4.6.7 # a comment\n");
  assert.deepEqual(ok.problems, []);
  for (const yaml of [
    'packages:\n  - apps/*\ncatalog: {uw: "npm:uniwind-pro@1.9.0"}\n',
    "packages: [apps/*]\n",
    "packages:\n  - &p packages/*\n",
    "packages:\n  - !!str packages/*\n",
    "packages:\n  - >-\n    packages/*\n",
    "packages:\n  - apps/*\ncatalog:\n  base: &b 1.0.0\n  copy: *b\n",
    "packages:\n  - apps/*\noverrides:\n  <<: *base\n",
    "packages:\n  - apps/*\ncatalogs:\n  mobile: {uniwind: npm:uniwind-pro@1.9.0}\n",
    "packages:\n  - apps/*\ncatalog:\n  x: |\n    1.0.0\n",
    "packages:\n  - apps/*\n---\npackages:\n  - evil/*\n",
    "packages:\n  - apps/*\ncatalog:\n  ? complex\n  : 1\n",
  ]) {
    const w = workspaceManifest(yaml);
    assert.ok(w.problems.length > 0, yaml);
    assert.match(w.problems[0], /^pnpm-workspace\.yaml line \d+: /, yaml);
    // the problems are violations of the scope check
    assert.ok(
      exceptionScopeViolations(LOCK_MEMBERS, w, POLICY, MOBILE_MEMBERS).includes(w.problems[0]),
      yaml,
    );
  }
  // linear: a long line without a colon does not backtrack
  const started = performance.now();
  workspaceManifest(`catalog:\n  ${"a".repeat(200_000)}\n`);
  assert.ok(performance.now() - started < 1000);
});

test("licence scopes: an alias the YAML reader cannot see is still resolved from the lockfile's importer", () => {
  // `catalog: {uw: …}` is flow style: the reader reports it and learns no catalog, but pnpm resolved the alias
  const workspace = workspaceManifest(
    'packages:\n  - packages/*/*\ncatalog: {uw: "npm:uniwind-pro@1.9.0"}\n',
  );
  const lock = withEdge(
    "  packages/lib/a:",
    "    devDependencies:",
    "      uw:",
    "        specifier: 'catalog:'",
    "        version: uniwind-pro@1.9.0(react@19.3.0)",
  ).replace(
    "    devDependencies:\n      gis-tests:\n        specifier: 1.0.0\n        version: 1.0.0\n\n  packages/lib/util",
    "\n  packages/lib/util",
  );
  const graph = lockfileGraph(lock);
  const members = LOCK_MEMBERS.map((m) =>
    m.dir === "packages/lib/a" ? member(m.dir, { devDependencies: { uw: "catalog:" } }) : m,
  );
  const lines = exceptionScopeViolations(members, workspace, POLICY, MOBILE_MEMBERS, graph);
  assert.ok(
    lines.includes(
      "packages/lib/a (@t/packages/lib/a): uniwind-pro (scope mobile) is in devDependencies; only apps/mobile and apps/playground may use it",
    ),
    lines.join("\n"),
  );
  assert.ok(
    lines.some((l) => /pnpm-workspace\.yaml line 3: `catalog` is not a block mapping/.test(l)),
  );
});

test("memberSetProblems: the lockfile's importers and the workspace globs must name the same members", () => {
  assert.deepEqual(memberSetProblems([".", "apps/a"], ["apps/a", "."]), []);
  assert.deepEqual(memberSetProblems([".", "apps/a", "apps/b"], [".", "apps/a", "tools/x"]), [
    "apps/b is a workspace member pnpm-lock.yaml does not list",
    "pnpm-lock.yaml lists tools/x, which no pnpm-workspace.yaml glob matches",
  ]);
});

/** pnpm list's view of LOCK's workspace (root `/w`): deduped subtrees and a workspace link, as pnpm prints them. */
const PNPM_ROOT = "/w";
const pnpmNode = (from, version, deps, extra = {}) => ({
  from,
  version,
  path: `/w/node_modules/.pnpm/${from}@${version}/node_modules/${from}`,
  ...(deps ? { dependencies: deps } : {}),
  ...extra,
});
const PNPM_LIST = () => {
  const pg = pnpmNode("pg-gis", "0.2.15");
  const gisTests = pnpmNode("gis-tests", "1.0.0", { "pg-gis": pg });
  return [
    { name: "root", path: "/w", private: true, devDependencies: { "gis-tests": gisTests } },
    {
      name: "@figentra/mobile",
      path: "/w/apps/mobile",
      private: true,
      dependencies: { uniwind: pnpmNode("uniwind-pro", "1.9.0", {}) },
    },
    {
      name: "@t/packages/lib/a",
      path: "/w/packages/lib/a",
      dependencies: {
        cycle: pnpmNode("cycle", "1.0.0", {
          loop: pnpmNode("loop", "1.0.0", {
            cycle: pnpmNode("cycle", "1.0.0", null, { deduped: true }),
          }),
        }),
        // pnpm lists a resolved optional peer as a child; maps@2.0.0 marks pg-gis optional
        maps: pnpmNode("maps", "2.0.0", {
          "pg-gis": pnpmNode("pg-gis", "0.2.15", null, { deduped: true }),
        }),
        "@t/util": {
          from: "@t/util",
          version: "link:../util",
          path: "/w/packages/lib/util",
          deduped: true,
        },
      },
      devDependencies: { "gis-tests": pnpmNode("gis-tests", "1.0.0", null, { deduped: true }) },
    },
    {
      name: "@t/packages/lib/util",
      path: "/w/packages/lib/util",
      devDependencies: { "gis-tests": pnpmNode("gis-tests", "1.0.0", null, { deduped: true }) },
    },
    {
      name: "@t/packages/lib/private",
      path: "/w/packages/lib/private",
      private: true,
      dependencies: { "gis-tests": pnpmNode("gis-tests", "1.0.0", null, { deduped: true }) },
    },
  ];
};
const optionalPeers = () => lockfileGraph(LOCK).optionalPeers;

test("pnpmFindings: pnpm's own tree, deduped copies and workspace links expanded, agrees with the lockfile reader", () => {
  const pnpm = pnpmFindings(
    PNPM_LIST(),
    PNPM_ROOT,
    LOCK_MEMBERS,
    POLICY,
    MOBILE_MEMBERS,
    optionalPeers(),
  );
  assert.deepEqual(pnpm.problems, []);
  assert.deepEqual([...pnpm.found.keys()], []);
  const reader = lockfileFindings(lockfileGraph(LOCK), LOCK_MEMBERS, POLICY, MOBILE_MEMBERS);
  assert.deepEqual(closureViolations(reader, pnpm, MOBILE_MEMBERS), []);
  // the util member ships gis-tests at runtime: found through the link, by both
  const list = PNPM_LIST();
  list[3].dependencies = list[3].devDependencies;
  delete list[3].devDependencies;
  const linked = LOCK.replace(
    "  packages/lib/util:\n    devDependencies:",
    "  packages/lib/util:\n    dependencies:",
  );
  const both = closureViolations(
    lockfileFindings(lockfileGraph(linked), LOCK_MEMBERS, POLICY, MOBILE_MEMBERS),
    pnpmFindings(list, PNPM_ROOT, LOCK_MEMBERS, POLICY, MOBILE_MEMBERS, optionalPeers()),
    MOBILE_MEMBERS,
  );
  assert.deepEqual(both, [
    "packages/lib/a (@t/packages/lib/a): pg-gis (scope dev-only) ships with a publishable package: packages/lib/a → packages/lib/util → gis-tests@1.0.0 → pg-gis@0.2.15",
    "packages/lib/util (@t/packages/lib/util): pg-gis (scope dev-only) ships with a publishable package: packages/lib/util → gis-tests@1.0.0 → pg-gis@0.2.15",
  ]);
  // an alias is named as pnpm installed it
  const aliased = PNPM_LIST();
  aliased[3].devDependencies.styling = pnpmNode("uniwind-pro", "1.9.0", {});
  const found = pnpmFindings(
    aliased,
    PNPM_ROOT,
    LOCK_MEMBERS,
    POLICY,
    MOBILE_MEMBERS,
    optionalPeers(),
  );
  assert.equal(
    found.found.get("packages/lib/util\tuniwind-pro").path,
    "packages/lib/util → styling (uniwind-pro)@1.9.0",
  );
  // fail closed: a deduped package pnpm never printed, a project that is not a member, an empty list
  const broken = PNPM_LIST();
  broken[2].dependencies.cycle = pnpmNode("ghost", "9.9.9", null, { deduped: true });
  broken.push({ name: "stranger", path: "/elsewhere" });
  const problems = pnpmFindings(
    broken,
    PNPM_ROOT,
    LOCK_MEMBERS,
    POLICY,
    MOBILE_MEMBERS,
    {},
  ).problems;
  assert.ok(
    problems.some((p) => /dedupes \/w\/node_modules\/\.pnpm\/ghost@9\.9\.9/.test(p)),
    problems.join("\n"),
  );
  assert.ok(problems.includes("pnpm list names /elsewhere, which is not a workspace member"));
  assert.deepEqual(pnpmFindings([], PNPM_ROOT, LOCK_MEMBERS, POLICY, MOBILE_MEMBERS).problems, [
    "pnpm list names no project",
  ]);
});

/** One finding, as lockfileFindings and pnpmFindings key it. */
const hit = (path) => ({
  where: "packages/lib/a (@t/a)",
  name: "pg-gis",
  scope: "dev-only",
  path,
});

test("closureViolations: when pnpm and the lockfile reader disagree, the violation names both answers", () => {
  const reader = { found: new Map(), problems: [] };
  const pnpm = {
    found: new Map([["packages/lib/a\tpg-gis", hit("packages/lib/a → x@1.0.0 → pg-gis@0.2.15")]]),
    problems: [],
  };
  assert.deepEqual(closureViolations(reader, pnpm, MOBILE_MEMBERS), [
    "packages/lib/a (@t/a): pg-gis (scope dev-only): pnpm finds packages/lib/a → x@1.0.0 → pg-gis@0.2.15; the lockfile reader finds nothing",
  ]);
  assert.deepEqual(closureViolations(pnpm, { found: new Map(), problems: [] }, MOBILE_MEMBERS), [
    "packages/lib/a (@t/a): pg-gis (scope dev-only): pnpm finds nothing; the lockfile reader finds packages/lib/a → x@1.0.0 → pg-gis@0.2.15",
  ]);
});

test("installedMobile: a Uniwind Pro directory in the gate's install fails, naming what pnpm says pulled it in", () => {
  assert.deepEqual(installedMobile(["zod@4.6.7", "uniwind@1.12.1"], POLICY, MOBILE_MEMBERS), []);
  const pnpm = {
    found: new Map([
      [
        "packages/ui/ui\tuniwind-pro",
        { name: "uniwind-pro", path: "packages/ui/ui → uniwind (uniwind-pro)@1.9.0" },
      ],
    ]),
    problems: [],
  };
  assert.deepEqual(installedMobile(["uniwind-pro@1.9.0_abc"], POLICY, MOBILE_MEMBERS, pnpm), [
    "node_modules/.pnpm/uniwind-pro@1.9.0_abc: uniwind-pro (scope mobile) is in the gate's install, which leaves out apps/mobile and apps/playground; pulled in by packages/ui/ui → uniwind (uniwind-pro)@1.9.0",
  ]);
  assert.match(
    installedMobile(["uniwind-pro@1.9.0_abc"], POLICY, MOBILE_MEMBERS)[0],
    /no member's pnpm tree names it/,
  );
});

test("licence scopes: main's manifests keep each shipped exception in its scope", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const policy = JSON.parse(
    readFileSync(new URL("../../policy/licences.json", import.meta.url), "utf8"),
  );
  const workspace = workspaceManifest(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"));
  const members = workspaceMembers(root, workspace.packages);
  assert.ok(members.length > 20, `${members.length} members`);
  assert.ok(members.some((m) => m.dir === "packages/data/database"));
  assert.ok(!members.some((m) => m.dir.split("/").includes("node_modules")));
  assert.deepEqual(exceptionScopeViolations(members, workspace, policy, MOBILE_MEMBERS), []);
  const graph = lockfileGraph(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"));
  assert.deepEqual(lockfileScopeViolations(graph, members, policy, MOBILE_MEMBERS), []);
  // where the dev-only and mobile packages sit today
  const database = members.find((m) => m.dir === "packages/data/database").manifest;
  assert.notEqual(database.private, true);
  assert.ok(database.devDependencies["@electric-sql/pglite-postgis"]);
  for (const m of MOBILE_MEMBERS) {
    const manifest = members.find((x) => x.dir === m.dir).manifest;
    assert.equal(manifest.name, m.name);
    assert.equal(manifest.dependencies.uniwind, "catalog:uniwind-pro");
  }
});

test("licence policy: tools/policy/licences.json is the CTO's approved ruling, every exception scoped", () => {
  const policy = JSON.parse(
    readFileSync(new URL("../../policy/licences.json", import.meta.url), "utf8"),
  );
  assert.equal(policy.status, "approved");
  assert.match(policy.$comment, /Idris \(CTO\) ruling 2026-11-24/);
  assert.doesNotMatch(JSON.stringify(policy), /PROPOSAL/i);
  assert.deepEqual(policy.allow, [
    "MIT",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
    "0BSD",
    "MIT-0",
    "BlueOak-1.0.0",
    "CC0-1.0",
    "Unlicense",
    "Zlib",
    "Python-2.0",
    "MPL-2.0",
    "CC-BY-3.0",
    "CC-BY-4.0",
  ]);
  for (const e of policy.exceptions) {
    assert.ok(["dev-only", "runtime", "tool", "mobile"].includes(e.scope), e.name);
    assert.ok(e.reason.length > 10, e.name);
  }
  // the Sentry CLI ships with @stackra/vite-plugin (a publishable package): runtime, its path in the reason
  for (const e of policy.exceptions.filter((x) => x.name.startsWith("@sentry/")))
    assert.match(e.reason, /@stackra\/vite-plugin → @sentry\/vite-plugin@5\.4\.1 → /, e.name);
  assert.deepEqual(
    policy.exceptions.map((e) => [e.name, e.licence, e.scope, e.versions ?? null]),
    [
      ["@electric-sql/pglite-postgis", "Apache-2.0 AND GPL-2.0-or-later", "dev-only", null],
      ["@img/sharp-libvips-linux-x64", "LGPL-3.0-or-later", "runtime", null],
      ["@sentry/cli", "FSL-1.1-MIT", "runtime", null],
      ["@sentry/cli-linux-x64", "FSL-1.1-MIT", "runtime", null],
      ["@zowe/secrets-for-zowe-sdk", "EPL-2.0", "runtime", null],
      ["chainsaw", "MIT/X11", "runtime", ["0.1.0"]],
      ["uniwind-pro", "UNLICENSED", "mobile", null],
    ],
  );
  // a shipped policy that faults on its own shape fails here, not first on a PR
  assert.deepEqual(licenceViolations(pkg("a", "MIT"), policy), []);
  assert.deepEqual(licenceViolations(pkg("buffers", "Unknown", ["0.1.1"]), policy), [
    "buffers@0.1.1: Unknown",
  ]);
});

test("licence policy: the check the gate runs is the tested functions' own source, over a real workspace", () => {
  const dir = mkdtempSync(join(tmpdir(), "stackra-licence-"));
  const check = join(dir, "licence-check.mjs");
  writeFileSync(check, licenceCheckSource());
  const policy = JSON.parse(
    readFileSync(new URL("../../policy/licences.json", import.meta.url), "utf8"),
  );
  writeFileSync(join(dir, "policy.json"), JSON.stringify(policy));
  const ws = realpathSync(mkdtempSync(join(tmpdir(), "stackra-ws-")));
  const manifest = (path, value) => {
    mkdirSync(join(ws, path), { recursive: true });
    writeFileSync(join(ws, path, "package.json"), JSON.stringify(value));
  };
  writeFileSync(
    join(ws, "pnpm-workspace.yaml"),
    [
      "packages:",
      "  - apps/*",
      "  - packages/*/*",
      "catalogs:",
      "  uniwind-pro:",
      "    uniwind: npm:uniwind-pro@1.9.0",
    ].join("\n"),
  );
  manifest(".", { name: "root", private: true });
  manifest("apps/mobile", {
    name: "@figentra/mobile",
    private: true,
    dependencies: { uniwind: "catalog:uniwind-pro" },
  });
  manifest("packages/data/database", {
    name: "@t/database",
    devDependencies: { "@electric-sql/pglite-postgis": "0.2.15" },
  });
  manifest("packages/data/database/node_modules/x", {
    name: "x",
    dependencies: { "uniwind-pro": "1" },
  });
  mkdirSync(join(ws, "node_modules/.pnpm"), { recursive: true });
  writeFileSync(join(ws, "pnpm-lock.yaml"), CLI_LOCK);
  const postgis = {
    from: "@electric-sql/pglite-postgis",
    version: "0.2.15",
    path: `${ws}/node_modules/.pnpm/@electric-sql+pglite-postgis@0.2.15/node_modules/@electric-sql/pglite-postgis`,
  };
  // pnpm's view after the gate's install: the mobile app is left out, so it has no tree
  const pnpmList = (
    database = { devDependencies: { "@electric-sql/pglite-postgis": postgis } },
  ) => [
    { name: "root", path: ws, private: true },
    { name: "@figentra/mobile", path: `${ws}/apps/mobile`, private: true },
    { name: "@t/database", path: `${ws}/packages/data/database`, private: false, ...database },
  ];
  const run = (extra = {}, { root = ws, list = pnpmList(), install = "gate" } = {}) => {
    writeFileSync(
      join(dir, "listing.json"),
      JSON.stringify({
        MIT: [{ name: "a", versions: ["1"], license: "MIT" }],
        "MIT/X11": [{ name: "chainsaw", versions: ["0.1.0"], license: "MIT/X11" }],
        ...extra,
      }),
    );
    writeFileSync(join(dir, "pnpm-list.json"), JSON.stringify(list));
    const args = [check, join(dir, "policy.json"), join(dir, "listing.json")];
    return spawnSync(
      process.execPath,
      root ? [...args, root, join(dir, "pnpm-list.json"), install] : args,
      { encoding: "utf8" },
    );
  };
  const ok = run();
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /^2 packages, every licence allowed .*; 3 workspace members keep/);
  assert.equal(ok.stderr, "");
  const bad = run({ "AGPL-3.0-only": [{ name: "x", versions: ["1"], license: "AGPL-3.0-only" }] });
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /x@1: AGPL-3\.0-only/);
  // a member the lockfile lists is checked by its own package.json too
  manifest("packages/ui/ui", {
    name: "@t/ui",
    devDependencies: { uniwind: "catalog:uniwind-pro" },
  });
  const uiLock = `${CLI_LOCK.trimEnd()}\n`.replace(
    "snapshots:",
    "  packages/ui/ui:\n    devDependencies:\n      uniwind:\n        specifier: catalog:uniwind-pro\n        version: uniwind-pro@1.9.0\n\nsnapshots:",
  );
  writeFileSync(join(ws, "pnpm-lock.yaml"), uiLock);
  const scoped = run(
    {},
    { list: [...pnpmList(), { name: "@t/ui", path: `${ws}/packages/ui/ui` }] },
  );
  assert.equal(scoped.status, 1);
  assert.match(
    scoped.stdout,
    /packages\/ui\/ui \(@t\/ui\): uniwind-pro \(scope mobile\) is in devDependencies/,
  );
  // pnpm's view, without the package, disagrees with the lockfile reader: both answers are named
  assert.match(
    scoped.stdout,
    /packages\/ui\/ui \(@t\/ui\): uniwind-pro \(scope mobile\): pnpm finds nothing; the lockfile reader finds packages\/ui\/ui → uniwind-pro@1\.9\.0$/m,
  );
  // a member the lockfile does not list is a violation, whatever it holds
  writeFileSync(join(ws, "pnpm-lock.yaml"), CLI_LOCK);
  const unlisted = run();
  assert.equal(unlisted.status, 1);
  assert.match(
    unlisted.stdout,
    /packages\/ui\/ui is a workspace member pnpm-lock\.yaml does not list/,
  );
  rmSync(join(ws, "packages/ui"), { recursive: true });
  // the lockfile and pnpm agree that the database ships PostGIS: one plain violation
  writeFileSync(join(ws, "pnpm-lock.yaml"), CLI_LOCK.replace("devDependencies:", "dependencies:"));
  const shipped = run(
    {},
    { list: pnpmList({ dependencies: { "@electric-sql/pglite-postgis": postgis } }) },
  );
  assert.equal(shipped.status, 1);
  assert.match(
    shipped.stdout,
    /ships with a publishable package: packages\/data\/database → @electric-sql\/pglite-postgis@0\.2\.15$/m,
  );
  assert.doesNotMatch(shipped.stdout, /pnpm finds/);
  // a hostile lockfile hides the edge from the reader; pnpm's view still has it, and the disagreement names both
  const hidden = CLI_LOCK.replace("devDependencies:", "dependencies: {}\n  # note:");
  writeFileSync(join(ws, "pnpm-lock.yaml"), hidden);
  const hostile = run(
    {},
    { list: pnpmList({ dependencies: { "@electric-sql/pglite-postgis": postgis } }) },
  );
  assert.equal(hostile.status, 1);
  assert.match(hostile.stdout, /pnpm-lock\.yaml line \d+: a comment: # note:/);
  assert.match(
    hostile.stdout,
    /pnpm finds packages\/data\/database → @electric-sql\/pglite-postgis@0\.2\.15; the lockfile reader finds nothing/,
  );
  writeFileSync(join(ws, "pnpm-lock.yaml"), CLI_LOCK);
  // Uniwind Pro in the gate's install at all: something other than the mobile apps pulled it in
  mkdirSync(join(ws, "node_modules/.pnpm/uniwind-pro@1.9.0_abc"));
  const installed = run();
  assert.equal(installed.status, 1);
  assert.match(
    installed.stdout,
    /node_modules\/\.pnpm\/uniwind-pro@1\.9\.0_abc: uniwind-pro \(scope mobile\) is in the gate's install/,
  );
  rmSync(join(ws, "node_modules/.pnpm/uniwind-pro@1.9.0_abc"), { recursive: true });
  rmSync(join(ws, "pnpm-lock.yaml"));
  const noLock = run();
  assert.equal(noLock.status, 1);
  assert.match(noLock.stdout, /pnpm-lock\.yaml'?/);
  assert.match(noLock.stdout, /ENOENT/);
  writeFileSync(join(ws, "pnpm-lock.yaml"), CLI_LOCK);
  assert.equal(run().status, 0);
  const noRoot = run({}, { root: null });
  assert.equal(noRoot.status, 1);
  assert.match(noRoot.stdout, /usage: licence-check/);
  const noWorkspace = run({}, { root: join(dir, "nowhere") });
  assert.equal(noWorkspace.status, 1);
  assert.match(noWorkspace.stdout, /ENOENT/);
  const missing = spawnSync(
    process.execPath,
    [
      check,
      join(dir, "none.json"),
      join(dir, "listing.json"),
      ws,
      join(dir, "pnpm-list.json"),
      "gate",
    ],
    { encoding: "utf8" },
  );
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /none\.json/);
  assert.match(run({}, { install: "full" }).stdout, /usage: licence-check .* gate\|mobile/);
  // stackra/verify-mobile (CTO ruling, round 4): the full install lists what only the mobile apps pull in. Its
  // mobile-scoped exceptions pass there, and a mobile-only package under an unlisted licence fails verify-mobile
  // while the gate, whose filtered listing never sees it, stays green.
  const mobileInstall = {
    UNLICENSED: [{ name: "uniwind-pro", versions: ["1.9.0"], license: "UNLICENSED" }],
    "EPL-2.0": [{ name: "@zowe/secrets-for-zowe-sdk", versions: ["8.29.4"], license: "EPL-2.0" }],
  };
  mkdirSync(join(ws, "node_modules/.pnpm/uniwind-pro@1.9.0_abc"));
  const mobileOk = run(mobileInstall, { install: "mobile" });
  assert.equal(mobileOk.status, 0, mobileOk.stdout);
  const mobileOnly = {
    WTFPL: [{ name: "mobile-only-lib", versions: ["2.0.0"], license: "WTFPL" }],
  };
  const mobileRed = run({ ...mobileInstall, ...mobileOnly }, { install: "mobile" });
  assert.equal(mobileRed.status, 1);
  assert.match(mobileRed.stdout, /mobile-only-lib@2\.0\.0: WTFPL/);
  rmSync(join(ws, "node_modules/.pnpm/uniwind-pro@1.9.0_abc"), { recursive: true });
  assert.equal(run({}, { install: "gate" }).status, 0);
  rmSync(ws, { recursive: true, force: true });
  rmSync(dir, { recursive: true, force: true });
});

test("stepSections: each step's lines and result, for display; an unfinished step says so", () => {
  const log = [
    "install noise",
    "== step: lint",
    "ok",
    "== result: lint pass",
    "== step: typecheck",
    "error TS1",
    "== result: lint pass",
    "== result: typecheck FAIL",
    "== step: build",
    "killed",
  ].join("\n");
  assert.deepEqual(stepSections(log), [
    { id: "lint", result: "pass", lines: ["ok"] },
    { id: "typecheck", result: "FAIL", lines: ["error TS1", "== result: lint pass"] },
    { id: "build", result: "unfinished", lines: ["killed"] },
  ]);
});

// ---- the gate's wiring: tools, OSV database, kinds, mounts, output ----------------------------------------------

test("tools: main's mise.toml pins (squawk as ci.yml), shellcheck for actionlint; each download needs its sha256 setting", () => {
  const mise = readFileSync(new URL("../../../mise.toml", import.meta.url), "utf8");
  const pin = (key) => new RegExp(`^"?${key}"? = "([^"]+)"`, "m").exec(mise)?.[1];
  const version = Object.fromEntries(TOOLS.map((t) => [t.name, t.version]));
  assert.equal(version.actionlint, pin("aqua:rhysd/actionlint"));
  assert.equal(version.zizmor, pin("aqua:zizmorcore/zizmor"));
  assert.equal(version["osv-scanner"], pin("aqua:google/osv-scanner"));
  assert.equal(version.gitleaks, pin("gitleaks"));
  assert.equal(version.shfmt, pin("shfmt"));
  assert.match(
    readFileSync(CI_YML, "utf8"),
    new RegExp(`squawk@${version.squawk.replaceAll(".", "\\.")} `),
  );
  assert.equal(version.shellcheck, "0.11.0");
  for (const tool of TOOLS) {
    assert.match(
      tool.url,
      new RegExp(
        `^https://github\\.com/.*/releases/download/v?${tool.version.replaceAll(".", "\\.")}/`,
      ),
    );
    assert.match(tool.url, /linux|x86_64-unknown-linux/);
  }
  assert.equal(toolShaSetting({ name: "osv-scanner" }), "STACKRA_VERIFY_SHA256_OSV_SCANNER");
  const sha = "f".repeat(64);
  const fromEnv = settings({ STACKRA_VERIFY_SHA256_SQUAWK: ` ${sha.toUpperCase()} ` });
  assert.equal(fromEnv.toolSha256.squawk, sha);
  assert.equal(fromEnv.toolSha256.actionlint, null);
  assert.match(
    hostProblems({ ...S, toolSha256: { ...S.toolSha256, zizmor: null } }, 0o400).join(),
    /STACKRA_VERIFY_SHA256_ZIZMOR must be the sha256/,
  );
  assert.match(
    hostProblems({ ...S, toolSha256: { ...S.toolSha256, gitleaks: "abc" } }, 0o400).join(),
    /STACKRA_VERIFY_SHA256_GITLEAKS/,
  );
});

test("store image: the tools come from the checked downloads through a bind mount, are on PATH, and change the tag", () => {
  const dockerfile = storeDockerfile({ baseImage: PINNED, pnpmVersion: "12.16.1" });
  assert.match(
    dockerfile,
    /^RUN --mount=type=bind,source=tools,target=\/tools sh \/tools\/install\.sh$/m,
  );
  assert.match(dockerfile, /^ENV PATH=\/opt\/stackra-verify\/bin:\$PATH$/m);
  assert.match(dockerfile, /bash --version/);
  assert.doesNotMatch(dockerfile, /curl|wget|ADD /);
  const script = toolInstallScript();
  assert.match(
    script,
    /tar -xf \/tools\/shellcheck-0\.11\.0\.tar\.xz -C \/tmp\/stackra-tools shellcheck-v0\.11\.0\/shellcheck/,
  );
  assert.match(
    script,
    /install -m 0755 \/tools\/squawk-2\.71\.0 \/opt\/stackra-verify\/bin\/squawk/,
  );
  for (const tool of TOOLS) assert.ok(script.includes(tool.check), tool.name);
  assert.equal(toolFile(TOOLS[0]), "actionlint-1.7.12.tar.gz");
  const lock = Buffer.from("lock");
  assert.notEqual(
    storeTag(lock, PINNED, toolsFingerprint(S)),
    storeTag(
      lock,
      PINNED,
      toolsFingerprint({ ...S, toolSha256: { ...S.toolSha256, squawk: "e".repeat(64) } }),
    ),
  );
});

test("downloadVerified: a download whose sha256 differs from its setting leaves no file; a match is kept", async () => {
  const dir = mkdtempSync(join(tmpdir(), "stackra-download-"));
  const bytes = Buffer.from("a pinned release asset");
  const sha = createHash("sha256").update(bytes).digest("hex");
  const fetcher = async () => new Response(bytes);
  const dest = join(dir, "tool");
  assert.equal(await downloadVerified("https://example.test/t", sha, dest, fetcher), sha);
  assert.deepEqual(readFileSync(dest), bytes);
  const bad = join(dir, "bad");
  await assert.rejects(
    downloadVerified("https://example.test/t", "0".repeat(64), bad, fetcher),
    /sha256 is/,
  );
  assert.equal(spawnSync("test", ["-e", bad]).status, 1);
  assert.equal(spawnSync("test", ["-e", `${bad}.part`]).status, 1);
  await assert.rejects(
    downloadVerified(
      "https://example.test/t",
      sha,
      join(dir, "x"),
      async () => new Response("", { status: 404 }),
    ),
    /HTTP 404/,
  );
});

test("OSV database: missing, future-dated or older than the maximum is refused (an error, never a green scan)", () => {
  const H = 3_600_000;
  assert.match(osvDbProblem(null, NOW, 24 * H), /missing/);
  assert.match(osvDbProblem(NOW + 60_000, NOW, 24 * H), /future/);
  assert.match(osvDbProblem(NOW - 25 * H, NOW, 24 * H), /25 h old \(at most 24 h\)/);
  assert.equal(osvDbProblem(NOW - 23 * H, NOW, 24 * H), null);
  assert.equal(
    osvDbPath("/work/stackra/verify/osv"),
    "/work/stackra/verify/osv/osv-scalibr/npm/all.zip",
  );
  assert.equal(settings({}).osvMaxAgeMs, 24 * H);
  assert.equal(settings({ STACKRA_VERIFY_HOME: "/h" }).osvDir, "/h/osv");
  assert.match(hostProblems({ ...S, osvMaxAgeMs: Number.NaN }, 0o400).join(), /OSV_MAX_AGE_H/);
});

test("kinds: the gate mounts its script, licence check, main's licence policy, PR facts, history and OSV database read-only, and nothing else", () => {
  const mounts = kindMounts("gate", { runDir: "/runs/x", osvDir: "/osv-db" });
  assert.deepEqual(mounts, [
    ["/runs/x/gate.sh", "/in/gate.sh"],
    ["/runs/x/licence-check.mjs", "/in/licence-check.mjs"],
    ["/runs/x/licences.json", "/in/licences.json"],
    ["/runs/x/facts.json", "/in/facts.json"],
    ["/runs/x/history.bundle", "/in/history.bundle"],
    ["/osv-db", "/osv"],
  ]);
  assert.deepEqual(kindMounts("mobile", { runDir: "/runs/x" }), [
    ["/runs/x/mobile.sh", "/in/mobile.sh"],
    ["/runs/x/licence-check.mjs", "/in/licence-check.mjs"],
    ["/runs/x/licences.json", "/in/licences.json"],
  ]);
  assert.throws(() => kindMounts("nope", { runDir: "/r" }), /not a verify kind/);
  const argv = verifyArgs(S, { name: "v", image: "run", envFile: ENV, tarPath: TAR, mounts });
  const volumes = argv.filter((_, i) => argv[i - 1] === "--volume");
  assert.equal(volumes.length, 7);
  for (const v of volumes) assert.match(v, /:ro$/, v);
  assert.equal(argv[argv.indexOf("--network") + 1], "none");
  assert.deepEqual(Object.keys(kindFiles("gate")), ["gate.sh", "licence-check.mjs"]);
  assert.equal(kindFiles("gate")["gate.sh"], gateScript());
  assert.deepEqual(Object.keys(kindFiles("mobile")), ["mobile.sh", "licence-check.mjs"]);
  assert.equal(kindFiles("mobile")["licence-check.mjs"], licenceCheckSource());
});

test("runJob gate: installs without the Uniwind Pro members and never lays in a licensed build; runs the gate script", async () => {
  const { deps, calls } = fakeDeps({ builds: ["esbuild", "uniwind-pro"], facts: async () => true });
  const r = await runJob({ ...JOB, kind: "gate" }, deps);
  assert.equal(r.conclusion, "success");
  const install = calls.runs[0].at(-1);
  assert.match(
    install,
    /--filter='!@figentra\/mobile' --filter='!@figentra\/playground' && pnpm rebuild esbuild$/,
  );
  assert.doesNotMatch(install, /uniwind-pro|prebuilt/);
  assert.match(calls.runs[1].at(-1), /; bash \/in\/gate\.sh$/);
  assert.ok(calls.runs[1].includes("/runs/x/gate.sh:/in/gate.sh:ro"));
});

test("runJob mobile: the full install with the licensed build; a licence failure fails verify-mobile only, as a result", async () => {
  const { deps, calls } = fakeDeps({ builds: ["esbuild", "uniwind-pro"] });
  const r = await runJob({ ...JOB, kind: "mobile" }, deps);
  assert.equal(r.conclusion, "success");
  assert.doesNotMatch(calls.runs[0].at(-1), /--filter=/);
  assert.match(
    calls.runs[0].at(-1),
    /pnpm rebuild esbuild && for d in node_modules\/\.pnpm\/uniwind-pro@\*/,
  );
  assert.match(calls.runs[1].at(-1), /commit -qm tested --no-verify; bash \/in\/mobile\.sh$/);
  const licence = Object.assign(new Error("could not build the licensed image"), { licence: true });
  const failed = await runJob({ ...JOB, kind: "mobile" }, fakeDeps({ storeError: licence }).deps);
  assert.equal(failed.post, true);
  assert.equal(failed.conclusion, "failure");
  assert.equal(failed.phase, "licence");
  // an unmarked store error stays an infrastructure error (retried), as before
  const infra = await runJob(JOB, fakeDeps({ storeError: new Error("docker is down") }).deps);
  assert.deepEqual([infra.post, infra.error], [false, "docker is down"]);
});

test("runJob gate: a PR head that moved before the facts were read posts nothing", async () => {
  const { deps, calls } = fakeDeps({ facts: async () => false });
  assert.deepEqual(await runJob(JOB, deps), { post: false, moved: true });
  assert.equal(calls.runs.length, 0);
});

test("verify-mobile: a mobile failure leaves stackra/verify green; both carry the same head SHA and external_id scheme", async () => {
  const outcomes = { gate: "success", mobile: "failure" };
  const posted = [];
  const results = await runKinds(JOB, PER_HEAD_KINDS, async (job) => {
    if (job.kind === "mobile") throw new Error("Uniwind Pro licence quota used up");
    const body = checkRunBody({
      kind: job.kind,
      sha: job.sha,
      base: job.base,
      conclusion: outcomes[job.kind],
      durationMs: 1,
      box: "b",
      log: "",
      startedAt: "t0",
      completedAt: "t1",
    });
    posted.push(body);
    return body;
  });
  assert.equal(results.gate.conclusion, "success");
  assert.equal(results.gate.name, "stackra/verify");
  assert.match(results.mobile.error, /quota/);
  assert.deepEqual(
    posted.map((b) => b.name),
    ["stackra/verify"],
  );
  // a failed mobile run, posted, is its own check run beside a green gate
  const gate = checkRunBody({
    kind: "gate",
    sha: SHA,
    base: BASE,
    conclusion: "success",
    durationMs: 1,
    box: "b",
    log: "",
    startedAt: "t0",
    completedAt: "t1",
  });
  const mobile = checkRunBody({
    kind: "mobile",
    sha: SHA,
    base: BASE,
    conclusion: "failure",
    phase: "licence",
    reason: "quota",
    durationMs: 1,
    box: "b",
    log: "",
    startedAt: "t0",
    completedAt: "t1",
  });
  assert.equal(mobile.name, "stackra/verify-mobile");
  assert.equal(mobile.head_sha, gate.head_sha);
  assert.equal(mobile.external_id, gate.external_id);
  assert.equal(gate.external_id, `base:${BASE}`);
  assert.match(mobile.output.title, /^the licensed build is unavailable \(quota\)/);
  // each check has its own error record and its own needs-run answer
  assert.equal(errorKey({ ...JOB, kind: "gate" }), `figentra/stackra@${SHA}`);
  assert.equal(errorKey({ ...JOB, kind: "mobile" }), `figentra/stackra@${SHA}#mobile`);
  const mobileRun = {
    name: "stackra/verify-mobile",
    head_sha: SHA,
    status: "completed",
    conclusion: "success",
    app: { id: Number(APP_ID) },
    external_id: `base:${BASE}`,
  };
  assert.equal(
    needsRun({ checkRuns: [mobileRun], sha: SHA, appId: APP_ID, base: BASE }, NOW),
    true,
  );
  assert.equal(
    needsRun(
      {
        checkRuns: [mobileRun],
        sha: SHA,
        appId: APP_ID,
        base: BASE,
        name: "stackra/verify-mobile",
      },
      NOW,
    ),
    false,
  );
});

test("check run text: a table of steps, each failing step's own output, then the log tail, inside the limit", () => {
  const log = [
    "install output",
    "== step: lint",
    "fine",
    "== result: lint pass",
    "== step: typecheck",
    "src/a.ts(1,1): error TS2322",
    "== result: typecheck FAIL",
    "== step: test",
    "x".repeat(200_000),
    "== result: test FAIL",
    "== failed: typecheck test",
  ].join("\n");
  const text = outputText(log);
  assert.ok(text.length <= OUTPUT_TEXT_MAX, String(text.length));
  assert.match(
    text,
    /\| lint \| pass \|\n\| typecheck \| \*\*FAIL\*\* \|\n\| test \| \*\*FAIL\*\* \|/,
  );
  assert.match(text, /### typecheck \(FAIL\)\n\n```text\nsrc\/a\.ts\(1,1\): error TS2322\n```/);
  assert.match(text, /### test \(FAIL\)/);
  assert.equal(text.match(/```/g).length % 2, 0);
  const body = checkRunBody({
    sha: SHA,
    base: BASE,
    conclusion: "failure",
    phase: "verify",
    durationMs: 1,
    box: "b",
    log,
    startedAt: "t0",
    completedAt: "t1",
  });
  assert.match(body.output.summary, /Failed steps \(from the log\): typecheck, test/);
  assert.equal(body.output.title, "Quality Gate failed in 0s");
});

test("PR facts and history: from GitHub's pull request, never the tree; main is a push with one ref", () => {
  const pull = {
    title: "feat: x (STA-1)",
    head: { ref: "figentra/sta-1-x", sha: SHA },
    labels: [{ name: "risk:R3" }],
    draft: false,
  };
  assert.deepEqual(prFacts(JOB, pull), {
    event: "pull_request",
    title: "feat: x (STA-1)",
    branch: "figentra/sta-1-x",
    labels: ["risk:R3"],
    draft: false,
    base: BASE,
    head: SHA,
  });
  assert.equal(prFacts({ ...JOB, pr: undefined }, null).event, "push");
  assert.deepEqual(historyRefs(JOB), [
    ["refs/stackra/base", BASE],
    ["refs/stackra/head", SHA],
  ]);
  assert.deepEqual(historyRefs({ ...JOB, sha: BASE }), [["refs/stackra/base", BASE]]);
});

test("cpus: a positive number goes to --cpus; a cpuset such as 0-7 is refused there and goes to --cpuset-cpus", () => {
  assert.deepEqual(hostProblems({ ...S, cpus: "8" }, 0o400), []);
  assert.deepEqual(hostProblems({ ...S, cpus: "1.5" }, 0o400), []);
  for (const bad of ["0-7", "0", "-1", "8 cpus", "", "0,1"])
    assert.match(
      hostProblems({ ...S, cpus: bad }, 0o400).join(),
      /STACKRA_VERIFY_CPUS is ".*": it must be a positive number.*STACKRA_VERIFY_CPUSET/,
      bad,
    );
  for (const ok of ["0-7", "0,2-4", "3"])
    assert.deepEqual(hostProblems({ ...S, cpuset: ok }, 0o400), [], ok);
  for (const bad of ["0-", "a-b", "0;7", "0-7,", " 0-7"])
    assert.match(
      hostProblems({ ...S, cpuset: bad }, 0o400).join(),
      /STACKRA_VERIFY_CPUSET is/,
      bad,
    );
  const set = settings({ STACKRA_VERIFY_CPUS: "8", STACKRA_VERIFY_CPUSET: "0-7" });
  assert.deepEqual([set.cpus, set.cpuset], ["8", "0-7"]);
  const argv = installArgs(
    { ...S, cpuset: "0-7" },
    { name: "i", image: "s", tarPath: TAR, envFile: ENV, network: "n" },
  );
  assert.equal(argv[argv.indexOf("--cpus") + 1], "8");
  assert.equal(argv[argv.indexOf("--cpuset-cpus") + 1], "0-7");
  assert.equal(
    installArgs(S, { name: "i", image: "s", tarPath: TAR, envFile: ENV, network: "n" }).includes(
      "--cpuset-cpus",
    ),
    false,
  );
});

test("preflight: deny by default under each protected root; allowlisted entries pass; a missing path never passes", () => {
  const box = {
    "/work": ["repos", "git", "lanes", "stackra", "tmp"],
    "/work/stackra": ["verify", "service", "verify-work", "verify-docker", "wt-main", "wt-train"],
  };
  const readable = new Set();
  const host = (over = {}) =>
    io({ list: (dir) => box[dir] ?? null, canRead: (p) => readable.has(p), ...over });
  assert.deepEqual(settings({}).protectedRoots, ["/work", "/work/stackra"]);
  assert.deepEqual(settings({}).allowPaths, [
    "/work/stackra/verify",
    "/work/stackra/service",
    "/work/stackra/verify-work",
    "/work/stackra/verify-docker",
  ]);
  assert.deepEqual(preflightProblems(S, host()), []);
  // an unlisted readable sibling fails, at either level
  for (const path of ["/work/repos", "/work/tmp", "/work/stackra/wt-main"]) {
    readable.add(path);
    assert.match(
      preflightProblems(S, host()).join(),
      new RegExp(`can read or traverse ${path} \\(deny by default`),
      path,
    );
    readable.delete(path);
  }
  // an allowlisted one passes (the code clone is 0755 by design); the roots themselves are checked as roots
  readable.add("/work/stackra/service");
  readable.add("/work/stackra/verify-docker");
  assert.deepEqual(preflightProblems(S, host()), []);
  // a root the verify user can list, or cannot traverse, refuses
  readable.add("/work/stackra");
  assert.match(
    preflightProblems(S, host()).join(),
    /can list \/work\/stackra: make it traverse-only/,
  );
  readable.delete("/work/stackra");
  assert.match(
    preflightProblems(S, host({ canTraverse: (p) => p !== "/work" })).join(),
    /cannot traverse \/work,/,
  );
  // vacuous: a missing root, a root this service cannot list, or a named path that does not exist never passes
  assert.match(
    preflightProblems(
      { ...S, protectedRoots: ["/work", "/work/academorix"] },
      host({ exists: (p) => p !== "/work/academorix" }),
    ).join(),
    /protected root \/work\/academorix does not exist/,
  );
  assert.match(
    preflightProblems(S, host({ list: () => null })).join(),
    /cannot list \/work, so its entries/,
  );
  assert.match(
    preflightProblems(S, host({ exists: (p) => p !== "/srv/secrets" }), ["/srv/secrets"]).join(),
    /\/srv\/secrets is named as unreadable but does not exist/,
  );
  assert.match(
    preflightProblems(S, host({ exists: (p) => p !== S.keyFile })).join(),
    /stackra-verify\.pem is named as unreadable but does not exist/,
  );
  // the settings take a list, trailing slashes trimmed
  assert.deepEqual(settings({ STACKRA_VERIFY_ALLOW_PATHS: "/a/, /b" }).allowPaths, ["/a", "/b"]);
});

test("preflight: an entry the verify user can traverse is reached, even when it cannot list it", () => {
  const box = { "/work": ["stackra", "lanes"], "/work/stackra": ["verify", "wt-train"] };
  const host = (traversable) =>
    io({
      list: (dir) => box[dir] ?? null,
      canTraverse: (p) => ["/work", "/work/stackra", ...traversable].includes(p),
    });
  assert.deepEqual(preflightProblems(S, host([])), []);
  for (const path of ["/work/lanes", "/work/stackra/wt-train"])
    assert.match(
      preflightProblems(S, host([path])).join(),
      new RegExp(`can read or traverse ${path} \\(deny by default`),
      path,
    );
  // an allowlisted entry may be traversed: the run inputs sit under it
  assert.deepEqual(preflightProblems(S, host(["/work/stackra/verify"])), []);
});

test("preflight: an empty or blank protected-root or allow list refuses; so does a verify user who reads nothing", () => {
  for (const value of ["", " ", " , ,"]) {
    const roots = settings({ STACKRA_VERIFY_PROTECTED_ROOTS: value }).protectedRoots;
    assert.deepEqual(roots, [], JSON.stringify(value));
    assert.match(
      preflightProblems({ ...S, protectedRoots: roots }, io()).join(),
      /STACKRA_VERIFY_PROTECTED_ROOTS names no directory/,
    );
    const allow = settings({ STACKRA_VERIFY_ALLOW_PATHS: value }).allowPaths;
    assert.match(
      preflightProblems({ ...S, allowPaths: allow }, io()).join(),
      /STACKRA_VERIFY_ALLOW_PATHS names no path/,
    );
  }
  // the positive control: with sudo broken every `test -r` fails, so every path would look unreadable
  assert.match(
    preflightProblems(S, io({ control: false })).join(),
    /cannot read \/work\/stackra\/verify\/docker\.env, which it must/,
  );
  assert.match(
    preflightProblems(S, io({ exists: (p) => p !== CONTROL })).join(),
    /cannot read \/work\/stackra\/verify\/docker\.env/,
  );
  // the same checks are the filesystem half the service repeats before each pass
  assert.deepEqual(filesystemProblems(S, io()), []);
  assert.match(filesystemProblems(S, io({ control: false })).join(), /which it must/);
});

test("servicePass: the filesystem checks run again before each pass; a new problem stops the service, nothing runs", async () => {
  const ran = [];
  const stopped = [];
  const pass = (problems) =>
    servicePass(["a/b", "c/d"], {
      recheck: () => problems,
      run: async (repo) => ran.push(repo),
      stop: (p) => stopped.push(p),
    });
  assert.equal(await pass([]), true);
  assert.deepEqual(ran, ["a/b", "c/d"]);
  assert.equal(await pass(["the verify user stackra-verify can read /work/new"]), false);
  assert.deepEqual(ran, ["a/b", "c/d"]);
  assert.deepEqual(stopped, [["the verify user stackra-verify can read /work/new"]]);
  assert.equal(FORBIDDEN_DEFAULTS.includes("/work/academorix"), false);
});

// ---- stackra/codeql -------------------------------------------------------------------------------------------------

test("codeql: each language's database and code-scanning suite from the pinned bundle, offline, then the results", () => {
  assert.deepEqual(PER_HEAD_KINDS, ["gate", "mobile"]);
  assert.equal(KINDS.codeql.check, "stackra/codeql");
  const script = codeqlScript();
  assert.match(
    script,
    /\/codeql\/codeql database create \/tmp\/stackra-codeql\/db-javascript-typescript --language=javascript-typescript --source-root=\/work/,
  );
  assert.match(
    script,
    /database analyze \/tmp\/stackra-codeql\/db-javascript-typescript codeql\/javascript-queries:codeql-suites\/javascript-code-scanning\.qls --format=sarif-latest/,
  );
  assert.match(
    script,
    /database analyze \/tmp\/stackra-codeql\/db-actions codeql\/actions-queries:codeql-suites\/actions-code-scanning\.qls/,
  );
  assert.match(script, /run_step codeql-results "" step_codeql_results/);
  assert.throws(() => codeqlScript(["cobol"]), /not a CodeQL language/);
  assert.deepEqual(kindMounts("codeql", { runDir: "/r", codeqlDir: "/h/codeql/abc/codeql" }), [
    ["/r/codeql.sh", "/in/codeql.sh"],
    ["/r/codeql-results.cjs", "/in/codeql-results.cjs"],
    ["/h/codeql/abc/codeql", "/codeql"],
  ]);
});

/** A SARIF document with these results and rules. */
const sarifOf = (results, rules = []) =>
  JSON.stringify({ runs: [{ tool: { driver: { rules } }, results }] });
const quiet = () => {};

test("codeql results: an error-level or high-severity result fails; notes and warnings are listed; no SARIF never passes", () => {
  const place = {
    locations: [
      { physicalLocation: { artifactLocation: { uri: "a.ts" }, region: { startLine: 3 } } },
    ],
  };
  const run = (text) => {
    const log = console.log;
    console.log = quiet;
    try {
      return codeqlResults(["x.sarif"], () => text);
    } finally {
      console.log = log;
    }
  };
  assert.equal(
    run(sarifOf([{ ruleId: "js/x", level: "note", message: { text: "n" }, ...place }])),
    0,
  );
  assert.equal(
    run(sarifOf([{ ruleId: "js/x", level: "error", message: { text: "e" }, ...place }])),
    1,
  );
  assert.equal(
    run(
      sarifOf(
        [{ ruleId: "js/sqli", message: { text: "w" }, ...place }],
        [
          {
            id: "js/sqli",
            properties: { "security-severity": "8.8" },
            defaultConfiguration: { level: "warning" },
          },
        ],
      ),
    ),
    1,
  );
  assert.equal(
    run(
      sarifOf(
        [{ ruleId: "js/low", message: { text: "w" } }],
        [{ id: "js/low", properties: { "security-severity": "4.0" } }],
      ),
    ),
    0,
  );
  assert.equal(run("not json"), 1);
  const log = console.log;
  console.log = quiet;
  try {
    assert.equal(codeqlResults([]), 1);
  } finally {
    console.log = log;
  }
  // the file the results step runs is this function's own source
  const dir = mkdtempSync(join(tmpdir(), "stackra-codeql-"));
  writeFileSync(join(dir, "codeql-results.cjs"), kindFiles("codeql")["codeql-results.cjs"]);
  writeFileSync(
    join(dir, "a.sarif"),
    sarifOf([{ ruleId: "js/x", level: "error", message: { text: "bad" }, ...place }]),
  );
  const r = spawnSync(process.execPath, [join(dir, "codeql-results.cjs"), join(dir, "a.sarif")], {
    encoding: "utf8",
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^FAIL error js\/x a\.ts:3 bad$/m);
});

test("codeql jobs: PRs labelled codeql or risk:R3 on demand, and main once a day from the set hour", () => {
  const jobs = [
    { repo: "figentra/stackra", sha: SHA, pr: "1", base: BASE, labels: ["codeql"] },
    { repo: "figentra/stackra", sha: SHA, pr: "2", base: BASE, labels: ["risk:R3"] },
    { repo: "figentra/stackra", sha: SHA, pr: "3", base: BASE, labels: ["design"] },
    { repo: "figentra/stackra", sha: "c".repeat(40), base: BASE, queue: true },
    { repo: "figentra/stackra", sha: BASE, base: BASE },
  ];
  assert.deepEqual(CODEQL_LABELS, ["codeql", "risk:R3"]);
  const jobsAt = (iso, lastNightly) =>
    codeqlJobs(jobs, { now: Date.parse(iso), hourUtc: 2, lastNightly });
  assert.deepEqual(
    jobsAt("2026-11-24T01:00:00Z").map((j) => j.pr ?? j.nightly),
    ["1", "2"],
  );
  const night = jobsAt("2026-11-24T02:30:00Z");
  assert.deepEqual(
    night.map((j) => j.pr ?? j.nightly),
    ["1", "2", "2026-11-24"],
  );
  assert.ok(night.every((j) => j.kind === "codeql"));
  assert.equal(night.at(-1).sha, BASE);
  assert.deepEqual(
    jobsAt("2026-11-24T23:00:00Z", "2026-11-24").map((j) => j.pr ?? j.nightly),
    ["1", "2"],
  );
  assert.equal(jobsAt("2026-11-25T03:00:00Z", "2026-11-24").at(-1).nightly, "2026-11-25");
  // jobsFrom carries the labels the on-demand rule reads
  const fromPulls = jobsFrom({
    repo: "figentra/stackra",
    pulls: [
      {
        number: 7,
        draft: false,
        labels: [{ name: "codeql" }],
        head: { sha: SHA, repo: { full_name: "figentra/stackra" } },
      },
    ],
    main: BASE,
  });
  assert.deepEqual(fromPulls[0].labels, ["codeql"]);
});

test("codeql settings: URL and sha256 together (https, 64 hex), known languages, a whole hour; unset means no CodeQL", () => {
  const sha = "d".repeat(64);
  assert.deepEqual(hostProblems(S, 0o400), []);
  assert.equal(settings({}).codeqlBundleUrl, null);
  const on = {
    ...S,
    codeqlBundleUrl: "https://example.test/codeql-bundle-linux64.tar.gz",
    codeqlBundleSha256: sha,
  };
  assert.deepEqual(hostProblems(on, 0o400), []);
  assert.match(hostProblems({ ...on, codeqlBundleSha256: null }, 0o400).join(), /set together/);
  assert.match(hostProblems({ ...on, codeqlBundleUrl: "http://x/y" }, 0o400).join(), /https URL/);
  assert.match(hostProblems({ ...on, codeqlBundleSha256: "abc" }, 0o400).join(), /64 hex/);
  assert.match(
    hostProblems({ ...on, codeqlLanguages: ["cobol"] }, 0o400).join(),
    /not a CodeQL language here: cobol/,
  );
  assert.match(hostProblems({ ...on, codeqlHourUtc: 24 }, 0o400).join(), /0 to 23/);
  const fromEnv = settings({
    STACKRA_VERIFY_CODEQL_BUNDLE_URL: on.codeqlBundleUrl,
    STACKRA_VERIFY_CODEQL_BUNDLE_SHA256: sha.toUpperCase(),
    STACKRA_VERIFY_CODEQL_LANGUAGES: "javascript-typescript",
    STACKRA_VERIFY_CODEQL_HOUR_UTC: "3",
  });
  assert.deepEqual(
    [fromEnv.codeqlBundleSha256, fromEnv.codeqlLanguages, fromEnv.codeqlHourUtc],
    [sha, ["javascript-typescript"], 3],
  );
});

test("runJob codeql: no install and no network; one container from the store image with the bundle read-only", async () => {
  const { deps, calls } = fakeDeps({});
  deps.verifyMounts = () =>
    kindMounts("codeql", { runDir: "/runs/x", codeqlDir: "/h/codeql/s/codeql" });
  const r = await runJob({ ...JOB, kind: "codeql" }, deps);
  assert.equal(r.conclusion, "success");
  assert.equal(calls.runs.length, 1);
  assert.equal(calls.network, undefined);
  const argv = calls.runs[0];
  assert.equal(argv[argv.indexOf("--network") + 1], "none");
  assert.ok(argv.includes("stackra-verify-store:abc"));
  assert.ok(argv.includes("/h/codeql/s/codeql:/codeql:ro"));
  assert.match(argv.at(-1), /commit -qm tested --no-verify; bash \/in\/codeql\.sh$/);
  const failed = await runJob(
    { ...JOB, kind: "codeql" },
    fakeDeps({ exits: { install: 0, verify: 1 } }).deps,
  );
  assert.equal(failed.conclusion, "failure");
  const body = checkRunBody({
    kind: "codeql",
    sha: SHA,
    base: BASE,
    conclusion: "failure",
    phase: "verify",
    durationMs: 1,
    box: "b",
    log: "",
    startedAt: "t0",
    completedAt: "t1",
  });
  assert.equal(body.name, "stackra/codeql");
  assert.equal(body.external_id, `base:${BASE}`);
  assert.equal(body.output.title, "CodeQL failed in 0s");
});

// ---- self-update (CTO ruling, round 4 of #1043, option a) -------------------------------------------------------

/** A 40-character stand-in blob id. */
const blob = (c) => c.repeat(40);

test("self-update plan: none when the service is main's; refused while a job runs, on local changes, on a non-fast-forward", () => {
  const one = (b) => ({ [SELF_PATH]: b, "tools/scripts/pr-merge.mjs": blob("p") });
  assert.deepEqual(
    selfUpdatePlan({ own: one(blob("a")), main: one(blob("a")), fastForward: true }),
    {
      action: "none",
    },
  );
  assert.deepEqual(
    selfUpdatePlan({ own: one(blob("a")), main: one(blob("b")), fastForward: true }),
    {
      action: "update",
    },
  );
  // any service file moving on main is an update, the imported modules included
  assert.deepEqual(
    selfUpdatePlan({
      own: one(blob("a")),
      main: { ...one(blob("a")), "tools/scripts/pr-merge.mjs": blob("q") },
      fastForward: true,
    }),
    { action: "update" },
  );
  assert.match(
    selfUpdatePlan({ busy: true, own: one(blob("a")), main: one(blob("b")), fastForward: true })
      .reason,
    /a job is running/,
  );
  assert.match(
    selfUpdatePlan({
      own: one(blob("a")),
      main: one(blob("b")),
      dirty: ["?? x.mjs"],
      fastForward: true,
    }).reason,
    /local changes \(\?\? x\.mjs\)/,
  );
  assert.match(
    selfUpdatePlan({ own: one(blob("a")), main: one(blob("b")), fastForward: false }).reason,
    /not a fast-forward/,
  );
  assert.match(
    selfUpdatePlan({ own: one(blob("a")), main: { [SELF_PATH]: blob("b") }, fastForward: true })
      .reason,
    /main has no tools\/scripts\/pr-merge\.mjs/,
  );
  assert.equal(selfCheckProblem({ status: 0, stdout: "passed" }), null);
  assert.match(
    selfCheckProblem({
      status: 1,
      stdout: "stackra-verify self-check failed:\n  - the self-check tests failed",
    }),
    /self-check failed \(exit 1\): - the self-check tests failed/,
  );
  assert.match(selfCheckProblem({ status: null }), /exit none/);
});

/** A service clone of an `origin` repository whose main can move: the clone runs SELF_PATH at v1. */
function serviceRepos() {
  const dir = mkdtempSync(join(tmpdir(), "stackra-self-"));
  const origin = join(dir, "origin");
  const clone = join(dir, "clone");
  const home = join(dir, "home");
  mkdirSync(origin);
  mkdirSync(home);
  const git = gitIn;
  git(origin, "init", "-q", "-b", "main");
  mkdirSync(join(origin, "tools/scripts"), { recursive: true });
  for (const file of SERVICE_FILES) writeFileSync(join(origin, file), `// ${file} v1\n`);
  writeFileSync(join(origin, SELF_PATH), "// v1\n");
  writeFileSync(join(origin, "README.md"), "service\n");
  git(origin, "add", "-A");
  git(origin, "commit", "-qm", "v1");
  git(dir, "clone", "-q", origin, clone);
  const ledger = [];
  const checked = [];
  const run = (over = {}) =>
    selfUpdate({
      clone,
      remote: origin,
      home,
      busy: false,
      own: Object.fromEntries(
        SERVICE_FILES.map((f) => [f, gitBlobId(readFileSync(join(clone, f)))]),
      ),
      ledger: (entry) => ledger.push(entry),
      runSelfCheck: (stage) => {
        checked.push(readFileSync(join(stage, SELF_PATH), "utf8"));
        return { status: 0, stdout: "stackra-verify self-check passed" };
      },
      ...over,
    });
  const advance = (text = "// v2\n") => {
    writeFileSync(join(origin, SELF_PATH), text);
    git(origin, "commit", "-qam", text.trim());
    return git(origin, "rev-parse", "HEAD");
  };
  return { dir, origin, clone, home, git, ledger, checked, run, advance };
}

test("self-update: main moved, so the clone fast-forwards after the new code's self-check, and the ledger records it", () => {
  const r = serviceRepos();
  try {
    assert.deepEqual(r.run().action, "none");
    assert.deepEqual(r.ledger, []);
    const old = r.git(r.clone, "rev-parse", `HEAD:${SELF_PATH}`);
    const main = r.advance();
    const result = r.run();
    assert.equal(result.action, "update");
    // the self-check ran on main's code, staged and then removed; the clone now is main
    assert.deepEqual(r.checked, ["// v2\n"]);
    assert.deepEqual(readdirSync(r.home), []);
    assert.equal(r.git(r.clone, "rev-parse", "HEAD"), main);
    assert.equal(readFileSync(join(r.clone, SELF_PATH), "utf8"), "// v2\n");
    assert.equal(r.ledger.length, 1);
    assert.equal(r.ledger[0].event, "self-update");
    assert.equal(r.ledger[0].main, main);
    assert.equal(r.ledger[0].oldBlob[SELF_PATH], old);
    assert.equal(r.ledger[0].newBlob[SELF_PATH], r.git(r.origin, "rev-parse", `HEAD:${SELF_PATH}`));
    assert.equal(
      r.ledger[0].oldBlob["tools/scripts/pr-merge.mjs"],
      r.ledger[0].newBlob["tools/scripts/pr-merge.mjs"],
    );
    // only main is fetched: no PR ref or tag reaches the clone
    assert.deepEqual(r.git(r.clone, "for-each-ref", "--format=%(refname)").split("\n").sort(), [
      "refs/heads/main",
      "refs/remotes/origin/HEAD",
      "refs/remotes/origin/main",
    ]);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test("self-update: refused on a non-fast-forward, on local changes, while a job runs, and when the self-check fails", () => {
  const r = serviceRepos();
  try {
    const before = r.git(r.clone, "rev-parse", "HEAD");
    r.advance();
    // a job is running: nothing is fetched or changed
    assert.match(r.run({ busy: true }).reason, /a job is running/);
    // local changes, tracked or untracked
    writeFileSync(join(r.clone, "README.md"), "edited\n");
    assert.match(r.run().reason, /local changes \( M README\.md\)/);
    r.git(r.clone, "checkout", "-q", "--", "README.md");
    writeFileSync(join(r.clone, "tools/scripts/extra.mjs"), "x\n");
    assert.match(r.run().reason, /local changes \(\?\? tools\/scripts\/extra\.mjs\)/);
    rmSync(join(r.clone, "tools/scripts/extra.mjs"));
    // the self-check of main's code fails: the clone stays on the old code
    const failed = r.run({
      runSelfCheck: () => ({
        status: 1,
        stdout: "stackra-verify self-check failed:\n  - the verify user cannot read docker.env",
      }),
    });
    assert.equal(failed.action, "refuse");
    assert.match(
      failed.reason,
      /self-check failed \(exit 1\): - the verify user cannot read docker\.env/,
    );
    assert.equal(r.git(r.clone, "rev-parse", "HEAD"), before);
    assert.deepEqual(readdirSync(r.home), []);
    // a local commit main does not have: not a fast-forward
    writeFileSync(join(r.clone, "README.md"), "local\n");
    r.git(r.clone, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qam", "local");
    const local = r.git(r.clone, "rev-parse", "HEAD");
    assert.match(r.run().reason, /not a fast-forward/);
    assert.equal(r.git(r.clone, "rev-parse", "HEAD"), local);
    // every refusal is in the ledger, with the blobs and main's commit once main was read
    assert.deepEqual(
      r.ledger.map((e) => [
        e.event,
        /job is running|local changes|self-check failed|fast-forward/.exec(e.reason)?.[0],
      ]),
      [
        ["self-update-refused", "job is running"],
        ["self-update-refused", "local changes"],
        ["self-update-refused", "local changes"],
        ["self-update-refused", "self-check failed"],
        ["self-update-refused", "fast-forward"],
      ],
    );
    for (const e of r.ledger.slice(1)) {
      assert.match(e.oldBlob[SELF_PATH], /^[0-9a-f]{40}$/);
      assert.match(e.newBlob[SELF_PATH], /^[0-9a-f]{40}$/);
      assert.match(e.main, /^[0-9a-f]{40}$/);
    }
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test("self-update: a refused update keeps the neutral path, naming the refusal", async () => {
  const own = "a".repeat(40);
  const main = "b".repeat(40);
  const reason = "the new code's self-check failed (exit 1): - the self-check tests failed";
  const message = definitionDrift({ [SELF_PATH]: own }, { [SELF_PATH]: main }, reason);
  assert.match(
    message,
    /blob a{40}, main has b{40}: update the service \(self-update refused: the new code's self-check failed/,
  );
  const { deps } = fakeDeps({});
  deps.archive = () => {
    throw Object.assign(new Error(message), { drift: true });
  };
  const r = await runJob(JOB, deps);
  assert.equal(r.conclusion, "neutral");
  assert.match(
    checkRunBody({ sha: SHA, base: BASE, ...r, durationMs: 1 }).output.title,
    /self-update refused/,
  );
});

test("self-check: the settings, the preflight's filesystem half and the self-check tests must all pass", () => {
  const ok = { status: 0, stdout: "ℹ pass 40\nℹ fail 0" };
  assert.deepEqual(
    selfCheck({ s: S, keyMode: 0o400, filesystem: () => [], runTests: () => ok }),
    [],
  );
  assert.match(
    selfCheck({
      s: { ...S, runAs: null },
      keyMode: 0o400,
      filesystem: () => [],
      runTests: () => ok,
    }).join(),
    /RUN_AS is not set/,
  );
  assert.deepEqual(
    selfCheck({
      s: S,
      keyMode: 0o400,
      filesystem: () => ["the verify user can read /x"],
      runTests: () => ok,
    }),
    ["the verify user can read /x"],
  );
  assert.match(
    selfCheck({
      s: S,
      keyMode: 0o400,
      filesystem: () => [],
      runTests: () => ({ status: 1, stdout: "✖ buildTree: x\nℹ pass 39\nℹ fail 1" }),
    }).join(),
    /self-check tests failed \(exit 1\): ✖ buildTree: x; ℹ pass 39; ℹ fail 1/,
  );
  // the subset is named tests the service depends on; none needs the network, Docker or node_modules
  for (const name of [
    "parseArgs: run needs a full SHA",
    "buildTree: the PR merged onto main",
    "gate mirrors main's ci.yml",
    "self-update: main moved",
  ])
    assert.ok(SELF_CHECK_TESTS.test(name), name);
  for (const name of [
    "proxy: refuses a non-allowlisted host",
    "egress probe script",
    "store image: digest-pinned",
    "codeql",
  ])
    assert.equal(SELF_CHECK_TESTS.test(name), false, name);
  assert.deepEqual(parseArgs(["self-check"]), { verb: "self-check" });
  assert.equal(parseArgs(["self-check", "--sha", SHA]), null);
  assert.equal(SELF_PATH, "tools/scripts/stackra-verify.mjs");
  assert.equal(settings({}).codeDir, CODE_DIR);
  assert.equal(readFileSync(join(CODE_DIR, SELF_PATH), "utf8").length > 0, true);
});

test("preflight: the service's code clone is the service user's own, and the verify user cannot write it", () => {
  assert.deepEqual(
    preflightProblems(S, io({ ownedByService: () => true, canWrite: () => false })),
    [],
  );
  assert.match(
    preflightProblems(S, io({ ownedByService: () => false })).join(),
    /code clone .* is not owned by the service user/,
  );
  assert.match(
    preflightProblems(S, io({ canWrite: (p) => p === S.codeDir })).join(),
    /can write the service's code clone/,
  );
});

/** flock(1) and sh, as box 1 has them (util-linux); a Mac has no flock. */
const FLOCK = spawnSync("sh", ["-c", "command -v flock"], { encoding: "utf8" }).status === 0;
const needsFlock = FLOCK ? {} : { skip: "needs flock(1) (util-linux)" };

test(
  "lockedShell: a restart keeps the one lock; the service's children never hold it; a held lock is refused",
  needsFlock,
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "stackra-lock-"));
    const lock = join(dir, "lock");
    const log = join(dir, "log");
    const script = join(dir, "service.mjs");
    try {
      // each run checks the lock is held by someone else (the shell), and that its own fd 9 is closed
      writeFileSync(
        script,
        [
          'import { appendFileSync, existsSync, writeFileSync } from "node:fs";',
          'import { spawnSync } from "node:child_process";',
          `const held = spawnSync("flock", ["-n", ${JSON.stringify(lock)}, "true"]).status !== 0;`,
          'const fd9 = spawnSync("sh", ["-c", "true >&9"]).status === 0;',
          `appendFileSync(${JSON.stringify(log)}, JSON.stringify({ held, fd9 }) + "\\n");`,
          `if (!existsSync(${JSON.stringify(join(dir, "restarted"))})) { writeFileSync(${JSON.stringify(join(dir, "restarted"))}, ""); process.exit(${RESTART_EXIT}); }`,
          "process.exit(3);",
        ].join("\n"),
      );
      const r = spawnSync("/bin/sh", lockedShell(lock, [process.execPath, script]), {
        encoding: "utf8",
      });
      assert.equal(r.status, 3, r.stderr);
      const runs = readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map((l) => JSON.parse(l));
      assert.deepEqual(runs, [
        { held: true, fd9: false },
        { held: true, fd9: false },
      ]);
      // released when the service ends for good
      assert.equal(spawnSync("flock", ["-n", lock, "true"]).status, 0);
      // another service holding the lock: refused with LOCK_HELD_EXIT, nothing started
      const holder = spawn("flock", [lock, "sleep", "30"]);
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
      try {
        rmSync(log);
        const busy = spawnSync("/bin/sh", lockedShell(lock, [process.execPath, script]));
        assert.equal(busy.status, LOCK_HELD_EXIT);
        assert.equal(spawnSync("test", ["-e", log]).status, 1);
      } finally {
        holder.kill();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test(
  "lockedShell: a stop signal reaches the service, which finishes before the lock is released",
  needsFlock,
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "stackra-lock-"));
    const lock = join(dir, "lock");
    const script = join(dir, "service.mjs");
    try {
      writeFileSync(
        script,
        [
          'import { writeFileSync } from "node:fs";',
          `process.on("SIGTERM", () => { writeFileSync(${JSON.stringify(join(dir, "stopped"))}, ""); setTimeout(() => process.exit(0), 200); });`,
          `writeFileSync(${JSON.stringify(join(dir, "started"))}, "");`,
          "setInterval(() => {}, 1000);",
        ].join("\n"),
      );
      const shell = spawn("/bin/sh", lockedShell(lock, [process.execPath, script]));
      const exited = new Promise((resolve) => {
        shell.on("close", resolve);
      });
      for (let i = 0; i < 100 && spawnSync("test", ["-e", join(dir, "started")]).status !== 0; i++)
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      shell.kill("SIGTERM");
      assert.equal(await exited, 0);
      assert.equal(spawnSync("test", ["-e", join(dir, "stopped")]).status, 0);
      assert.equal(spawnSync("flock", ["-n", lock, "true"]).status, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
