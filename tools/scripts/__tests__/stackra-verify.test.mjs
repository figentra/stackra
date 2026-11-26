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
  symlinkSync,
  readlinkSync,
  existsSync,
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
  GATE_REPOS,
  ungatedRepos,
  dockerAs,
  dockerEnvFile,
  ERROR_RETRY_MS,
  exitFromInspect,
  formatDuration,
  hostProblems,
  imagesToRemove,
  installArgs,
  installCommand,
  LICENSED_BUILDS,
  INSTALL_COMMAND,
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
  ledgerNews,
  SWITCH_STARTED,
  SWITCH_PREVIOUS,
  globMatches,
  recordedRun,
  serviceProblemConclusion,
  SERVICE_PROBLEM,
  SERVICE_INSTALL,
  stepScript,
  sharedStepSwaps,
  containerLimits,
  serviceYaml,
  yamlProblem,
  forbiddenPaths,
  dependencySpecProblems,
  OSV_DB_MIN_BYTES,
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
  judgeGuard,
  judgeGuardSource,
  judgeNodeSource,
  judgeEnv,
  judgeViewScript,
  JUDGE_GEN,
  JUDGE_MOUNT,
  noexecVolumeArgs,
  JUDGE_NODE,
  IMAGE_NODE,
  plantedCheck,
  PLANTED_EXIT,
  PLANTED_LINE,
  judgeTurboSource,
  MIGRATION_LINT_REQUIRES_COMPILED,
  MIGRATION_PENDING,
  migrationLintRun,
  migrationLintCiReplace,
  lockfileResolutionProblems,
  judgeBuildRoots,
  prepareScript,
  installCommands,
  nodeModulesPlan,
  PNPM_DOT_ENTRIES,
  VIEW_REFUSED_EXIT,
  viewOf,
  OVERLAY_FIELDS,
  MIGRATION_PENDING_PER_MEMBER,
  UNTRACKED_SQL,
  judgeDockerfile,
  judgeTag,
  stepArgs,
} from "../stackra-verify.mjs";
import {
  VERIFY_APP,
  isVerifyOverlay,
  GATE_TOOL_BINS,
  NOT_PACKAGE_COMMANDS,
  isGateToolPackage,
  SHARED_STEP_LOADERS,
  JUDGE_ROOTS,
} from "../pr-merge.mjs";

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

test("parseArgs: the gate is defined for this repository only; the template and any other -R are refused (CTO read of #1043)", () => {
  assert.deepEqual(GATE_REPOS, [DEFAULT_REPO]);
  assert.deepEqual(ungatedRepos(parseArgs(["daemon"]).repos), []);
  assert.deepEqual(
    ungatedRepos(
      parseArgs(["daemon", "-R", DEFAULT_REPO, "-R", "stackra-inc/stackra-template"]).repos,
    ),
    ["stackra-inc/stackra-template"],
  );
  assert.deepEqual(ungatedRepos(["a/b", DEFAULT_REPO, "c/d"]), ["a/b", "c/d"]);
  // the runbook's unit names this repository alone
  const runbook = readFileSync(new URL("../stackra-verify.mjs", import.meta.url), "utf8");
  const exec = /ExecStart=.*stackra-verify\.mjs daemon(.*)$/m.exec(runbook)?.[1] ?? "";
  assert.deepEqual(
    [...exec.matchAll(/-R (\S+)/g)].map((m) => m[1]),
    [DEFAULT_REPO],
  );
  assert.doesNotMatch(runbook, /-R \S*stackra-template/);
});

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
    /pnpm install --frozen-lockfile --store-dir \/store --ignore-scripts --ignore-pnpmfile && pnpm rebuild --ignore-pnpmfile esbuild @shopify\/react-native-skia$/,
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
    /^set -e; tar -xf \/in\/src\.tar -C \/work; cd \/work; pt=\$\(mktemp -d "\$\{TMPDIR:-\/tmp\}\/stackra-planted\.XXXXXX"\)\nplanted\(\) \{[\s\S]*; exit 3; fi\nrm -rf -- "\$pt"; rm -rf \.git; git init -q; git fetch -q --no-tags \/in\/history\.bundle .*; git update-ref HEAD "\$commit"; git reset -q; bash \/in\/gate\.sh$/,
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
    /^set -e; tar -xf \/in\/src\.tar -C \/work; cd \/work; pt=\$\(mktemp -d "\$\{TMPDIR:-\/tmp\}\/stackra-planted\.XXXXXX"\)\nplanted\(\) \{[\s\S]*; exit 3; fi\nrm -rf -- "\$pt"; rm -rf \.git; git init -q; git add -A; .* commit -qm tested --no-verify; bash \/in\/mobile\.sh$/,
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
  assert.equal(
    GATE_STEPS.find((step) => step.id === "dependency-scan").run,
    "osv-scanner scan source --offline --lockfile=pnpm-lock.yaml",
  );
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
  assert.match(dockerfile, /pnpm fetch --store-dir \/store --ignore-pnpmfile/);
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
  // after MAX_ERROR_ATTEMPTS the service problem is posted, and the head is tried again after the delay (M2)
  assert.equal(
    needsRun(
      { checkRuns: [], sha: SHA, appId: APP_ID, errors: { count: MAX_ERROR_ATTEMPTS, at: old.at } },
      NOW,
    ),
    true,
  );
  assert.equal(
    needsRun(
      {
        checkRuns: [],
        sha: SHA,
        appId: APP_ID,
        errors: { count: MAX_ERROR_ATTEMPTS, at: recent.at },
      },
      NOW,
    ),
    false,
  );
  // a service problem, or a neutral from an older service, never stands
  for (const run of [
    { ...ours, output: { title: `${SERVICE_PROBLEM} (not the PR's fault): docker` } },
    { ...ours, conclusion: "neutral" },
  ])
    assert.equal(needsRun({ checkRuns: [run], sha: SHA, appId: APP_ID, base: BASE }, NOW), true);
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

/**
 * A container's role from its name: `install`, the service's own (`base`, `view`, `shared`), or a step's id, whose
 * exit is `exits[<id>]` and otherwise `exits.verify` (every step container).
 */
const roleOf = (name) => {
  const m = /-(install|rebuild|verify|base|view|shared|pr|step-([a-z0-9-]+))$/.exec(name);
  return m[2] ?? m[1];
};
const OWN = new Set(["rebuild", "base", "view", "shared", "pr"]);

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
    judgeEnvFile: "/runs/x/judge.env",
    judgeImage: async () => "stackra-verify-judge:abc",
    judgeEvalEnvFile: "/runs/x/judge-eval.env",
    workVolume: async (image, name) => {
      (calls.volumes ??= []).push([image, name]);
      return name;
    },
    guardedNode: "/runs/x/bin/node",
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
      const role = roleOf(name);
      const group = role === "install" || OWN.has(role) ? role : "verify";
      if (stop === role || stop === group) stopping = true;
      if (hang === role || hang === group)
        return new Promise((resolve) => {
          deps.release = resolve;
        });
      return Promise.resolve({ code: 0 });
    },
    exitCodeOf: (name) => {
      const role = roleOf(name);
      if (role in exits) return exits[role];
      return OWN.has(role) ? 0 : exits.verify;
    },
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
  // the install and its rebuild on the run's network; everything after on none
  for (const run of calls.runs.slice(0, 2))
    assert.equal(run[run.indexOf("--network") + 1], calls.network);
  for (const run of calls.runs.slice(2)) assert.equal(run[run.indexOf("--network") + 1], "none");
  assert.equal(calls.cleanUp.length, 1);
  // install, verify, proxy; then rebuild, base, view, shared, pr and one per step
  assert.equal(calls.cleanUp[0].names.length, 8 + GATE_STEPS.length);
  const run = calls.cleanUp[0].images[0];
  assert.match(run, /^stackra-verify-run:0123456789ab-[a-z0-9]+$/);
  assert.deepEqual(
    calls.cleanUp[0].images.map((i) => i.replace(run, "stackra-verify-run:<id>")),
    [
      "stackra-verify-run:<id>",
      "stackra-verify-run:<id>-installed",
      "stackra-verify-run:<id>-base",
      "stackra-verify-run:<id>-view",
      "stackra-verify-run:<id>-shared",
      "stackra-verify-run:<id>-pr",
      "stackra-verify-run:<id>-built",
    ],
  );
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

test("definitionDrift: a service whose loaded files are not main's blobs posts a service problem, naming each one", async () => {
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
  assert.equal(r.conclusion, "failure");
  assert.equal(r.phase, "service");
  assert.equal(calls.runs.length, 0);
  const body = checkRunBody({ sha: SHA, base: BASE, ...r, durationMs: 1000 });
  assert.equal(body.conclusion, "failure");
  assert.match(body.output.title, /^stackra\/verify service problem \(not the PR's fault\): /);
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
    assert.match(calls.kill[0], /^sv-0123456789ab-.*-step-licence-policy$/);
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
      "packages/new/package.json",
      "packages/new/vitest.config.ts",
      "packages/new/src/new.test.ts",
      "packages/new/.config/config.json",
      "packages/new/sub/vitest.config.ts",
      "packages/a/src/newdir/.oxlintrc.json",
      "newtop/pnpm-workspace.yaml",
      "newtop/package.json",
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
    ["packages/*"],
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
    "packages/new/sub/vitest.config.ts",
    "packages/a/src/newdir/.oxlintrc.json",
    "newtop/pnpm-workspace.yaml",
    "packages/a/.config/config.json",
    "tools/scripts/new.mjs",
    "tools/scripts/newdir/x.mjs",
    "packages/tooling/new-preset/index.js",
  ]);
  // review round 5, L2: only a new workspace member's own directory is exempt (a package.json main lacks, at a glob)
  assert.equal(globMatches("packages/*", "packages/new"), true);
  assert.equal(globMatches("packages/*/*", "packages/new"), false);
  assert.equal(globMatches("!packages/*", "packages/new"), false);
  // a new member's own configs stay in the tested tree (CTO ruling, round 4): main has no packages/new at all
});

/**
 * The daemon's shape of a fixture repository: a BARE mirror (as archiveJob clones it), refreshed from the work
 * repository's branches and replace refs, kept inside its .git so it goes with it. The work repository borrows the
 * mirror's objects (alternates), so a test reads the trees buildTree writes there (review MEDIUM-1).
 */
function mirrorOf(dir) {
  const mirror = join(dir, ".git", "stackra-mirror");
  const run = (...args) => {
    const r = spawnSync("git", args, {
      encoding: "utf8",
      env: { PATH: process.env.PATH, HOME: dir },
    });
    if (r.status !== 0) throw new Error(r.stderr);
  };
  if (spawnSync("test", ["-d", mirror]).status !== 0) run("clone", "-q", "--bare", dir, mirror);
  run(
    "-C",
    mirror,
    "fetch",
    "-q",
    "--no-tags",
    dir,
    "+refs/heads/*:refs/heads/*",
    "+refs/replace/*:refs/replace/*",
  );
  assert.equal(
    spawnSync("git", ["-C", mirror, "rev-parse", "--is-bare-repository"], {
      encoding: "utf8",
    }).stdout.trim(),
    "true",
  );
  writeFileSync(join(dir, ".git", "objects", "info", "alternates"), `${join(mirror, "objects")}\n`);
  return mirror;
}

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
  write("pnpm-workspace.yaml", "packages:\n  - packages/*\n");
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
    const tree = buildTree(mirrorOf(dir), base, sha, join(dir, "scratch-index"));
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
    const tree = buildTree(mirrorOf(dir), base, sha, join(dir, "scratch-index"));
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
    const tree = buildTree(mirrorOf(dir), base, sha, join(dir, "scratch-index"));
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
      const tree = buildTree(mirrorOf(dir), base, sha, join(dir, "scratch-index"));
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
      const tree = buildTree(mirrorOf(dir), base, sha, join(dir, "scratch-index"));
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
          mirrorOf(member.dir),
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
    const tree = buildTree(mirrorOf(dir), base, sha, join(dir, "scratch-index"));
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
      () => buildTree(mirrorOf(dir), newBase, sha, join(dir, "scratch-index")),
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
    const tree = buildTree(mirrorOf(dir), base, hidden, join(dir, "scratch-index"));
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
  assert.match(
    cmd,
    /--ignore-scripts --ignore-pnpmfile && pnpm rebuild --ignore-pnpmfile esbuild sharp && /,
  );
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
    fakeDeps({ exits: { install: 0, rebuild: NEEDS_STORE_REBUILD_EXIT, verify: 0 } }).deps,
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

/** A green stackra/verify from our App against an older main, finished at `completedAt`. */
const olderMainRun = (completedAt) => ({
  name: "stackra/verify",
  head_sha: SHA,
  status: "completed",
  conclusion: "success",
  app: { id: Number(APP_ID) },
  external_id: `base:${"d".repeat(40)}`,
  completed_at: completedAt,
});

test("needsRun: with a merge queue a fresh green against an older main stands (no livelock); without one it runs again", () => {
  const recent = olderMainRun(new Date(NOW - 60_000).toISOString());
  const stale = olderMainRun(new Date(NOW - FRESH_MS - 60_000).toISOString());
  const needs = (checkRun, queue) =>
    needsRun({ checkRuns: [checkRun], sha: SHA, appId: APP_ID, base: BASE, queue }, NOW);
  assert.equal(needs(recent, true), false);
  assert.equal(needs(stale, true), true);
  // no merge queue (CTO read of #1043): pr-merge counts only a run against current main, so main moving re-verifies
  assert.equal(needs(recent, false), true);
  assert.equal(needs(recent, undefined), true);
  assert.equal(needs(stale, false), true);
  // against current main it stands either way
  assert.equal(needs({ ...recent, external_id: `base:${BASE}` }, false), false);
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
    // the mobile job's own setup: the token, its download cache and the install are the service's (mobileScript)
    mobile: [
      "Checkout",
      "Toolchain (mise)",
      "Uniwind Pro token (sops)",
      "Uniwind Pro cache directory",
      "Uniwind Pro download cache (restore)",
      "Uniwind Pro cache token (GitHub App)",
      "Uniwind Pro cache from figentra/ci-cache",
      "Install dependencies",
      "Uniwind Pro download cache (filled?)",
      "Uniwind Pro download cache (save)",
    ],
  };
  // review of the box 1 proofs (field mutant): every job a step names is enumerated, mobile's included
  assert.deepEqual(
    [...new Set([...GATE_STEPS, ...MOBILE_STEPS].map((s) => s.job).filter(Boolean))].toSorted(),
    Object.keys(notMirrored).toSorted(),
  );
  for (const job of Object.keys(notMirrored))
    assert.deepEqual(
      [...GATE_STEPS, ...MOBILE_STEPS].filter((s) => s.job === job).map((s) => s.ci),
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
    /--ignore-pnpmfile --filter='!@figentra\/mobile' --filter='!@figentra\/playground' && pnpm rebuild --ignore-pnpmfile --filter='!@figentra\/mobile' --filter='!@figentra\/playground' esbuild$/,
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
  writeFileSync(join(work, "services/a/package.json"), '{"scripts":{"gen":"stackra gen"}}\n');
  writeFileSync(join(work, "tools/scripts/linear.mjs"), NODE_STUB("linear"));
  // main's CLI as the judge image has it (the script's /judge is this fixture's judge directory)
  mkdirSync(join(dir, "judge/packages/developer/cli/dist"), { recursive: true });
  writeFileSync(join(dir, "judge/packages/developer/cli/dist/stackra.mjs"), NODE_STUB("stackra"));
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
  return { dir, work, input, bin, git };
}

/** Runs the gate script in a fixture; `fail` is a shell glob of the stub call to fail. */
function runGate(fixture, fail = "__never__", script = gateScript, args = []) {
  const path = join(fixture.dir, "gate.sh");
  writeFileSync(
    path,
    script({ inDir: fixture.input, workDir: fixture.work }).replaceAll(
      `${JUDGE_MOUNT}/`,
      `${fixture.dir}/judge/`,
    ),
  );
  const r = spawnSync(BASH, [path, ...args], {
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
  "licence-policy": {
    calls: [
      `pnpm licenses list --json --offline --ignore-pnpmfile --recursive ${X}`,
      "pnpm list --recursive --json --depth Infinity --offline --ignore-pnpmfile",
      "licence-check <tmp>/in/licences.json <tmp>/stackra-licences.json . <tmp>/stackra-pnpm-list.json gate",
    ],
    fail: "licence-check *",
  },
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
  // main's gen (the judge image's CLI): the workspace gen, then each service with a gen script
  "manifests-match-gen": { calls: ["stackra gen", "stackra gen"], stale: true },
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
  "env-names": { calls: ["pnpm runway env check"], fail: "pnpm runway env check" },
  boundaries: { calls: ["pnpm boundaries"], fail: "pnpm boundaries" },
  knip: { calls: ["pnpm knip"], fail: "pnpm knip" },
  "secrets-scan": { calls: ["pnpm secrets:scan"], fail: "pnpm secrets:scan" },
  test: {
    calls: [`pnpm exec turbo run test ${X} --continue=dependencies-successful`],
    fail: "pnpm exec turbo run test *",
  },
};

test(
  "gate script --step: one step only, in its own section; --swap lays in main's config modules only; anything else refused",
  needsBash,
  () => {
    const fixture = gateFixture();
    const one = runGate(fixture, "__never__", gateScript, ["--step", "lint"]);
    assert.equal(one.status, 0, one.stdout);
    assert.deepEqual(Object.keys(one.sections), ["lint"]);
    assert.match(one.stdout, /^== passed: every step$/m);
    const red = runGate(fixture, "pnpm lint:root", gateScript, ["--step", "lint"]);
    assert.equal(red.status, 1);
    assert.match(red.stdout, /^== failed: lint$/m);
    for (const args of [["--step", "nope"], ["--step"], ["--bogus"]]) {
      const refused = runGate(fixture, "__never__", gateScript, args);
      assert.equal(refused.status, 2, args.join(" "));
      assert.deepEqual(Object.keys(refused.sections), []);
    }
    // --swap: main's copy in, the PR's own loader out, no step run
    writeFileSync(join(fixture.input, "shared-definitions"), "x/vitest.config.ts\0");
    writeFileSync(join(fixture.work, "x/vitest.config.ts"), "process.exit(0)\n");
    writeFileSync(join(fixture.input, "shared-main.tar"), "");
    const swap = runGate(fixture, "__never__", gateScript, ["--swap"]);
    assert.equal(swap.status, 0, swap.stdout);
    assert.deepEqual(Object.keys(swap.sections), []);
    assert.equal(readdirSync(join(fixture.work, "x")).includes("vitest.config.ts"), false);
    rmSync(fixture.dir, { recursive: true, force: true });
  },
);

test(
  "gate script --step: migration-lint lints the migration SQL in the tree it is given, nothing else; manifests-match-gen leaves nothing for it",
  needsBash,
  () => {
    const fixture = gateFixture();
    const lint = runGate(fixture, "__never__", gateScript, ["--step", "migration-lint"]);
    assert.equal(lint.status, 0, lint.stdout);
    assert.deepEqual(
      lint.calls("migration-lint").map((c) => c.call),
      STEP_CASES["migration-lint"].calls,
    );
    // compiled SQL the tree tracks but no longer has is stale: manifests-match-gen names it (proof 1, box 1)
    rmSync(join(fixture.work, "services/a/.stackra"), { recursive: true, force: true });
    const stale = runGate(fixture, "__never__", gateScript, ["--step", "manifests-match-gen"]);
    assert.equal(stale.status, 1, stale.stdout);
    assert.match(stale.stdout, /services\/a\/\.stackra\/migrations\/0001\.up\.sql/);
    assert.match(stale.stdout, /::error title=Stale manifests::commit the compiled migration SQL/);
    // what main's gen writes in its own container is never what squawk reads: in a tree that has no compiled SQL
    // (the removal committed, as every tested tree is), gen leaves nothing behind and nothing is linted
    assert.equal(fixture.git("rm", "-rq", "--cached", "services/a/.stackra").status, 0);
    assert.equal(fixture.git("commit", "-qm", "no compiled SQL").status, 0);
    const gen = runGate(fixture, "__never__", gateScript, ["--step", "manifests-match-gen"]);
    assert.equal(gen.status, 0, gen.stdout);
    const none = runGate(fixture, "__never__", gateScript, ["--step", "migration-lint"]);
    assert.equal(none.status, 0, none.stdout);
    assert.deepEqual(none.calls("migration-lint"), []);
    assert.match(none.stdout, /no compiled migrations/);
    rmSync(fixture.dir, { recursive: true, force: true });
  },
);

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
        "pnpm licenses list --json --offline --ignore-pnpmfile --recursive",
        "pnpm list --recursive --json --depth Infinity --offline --ignore-pnpmfile",
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

test("kinds: the gate mounts its script, licence check, main's licence policy, PR facts, history, OSV database and judge parts read-only, and nothing else", () => {
  const mounts = kindMounts("gate", { runDir: "/runs/x", osvDir: "/osv-db" });
  assert.deepEqual(mounts, [
    ["/runs/x/gate.sh", "/in/gate.sh"],
    ["/runs/x/licence-check.mjs", "/in/licence-check.mjs"],
    ["/runs/x/licences.json", "/in/licences.json"],
    ["/runs/x/shared-definitions", "/in/shared-definitions"],
    ["/runs/x/shared-main.tar", "/in/shared-main.tar"],
    ["/runs/x/facts.json", "/in/facts.json"],
    ["/runs/x/history.bundle", "/in/history.bundle"],
    ["/osv-db", "/osv"],
    ["/runs/x/judge-guard.mjs", "/in/judge-guard.mjs"],
    ["/runs/x/bin", "/in/bin"],
    ["/runs/x/main-paths", "/in/main-paths"],
    ["/runs/x/judge-view.sh", "/in/judge-view.sh"],
    ["/runs/x/prepare.sh", "/in/prepare.sh"],
    ["/runs/x/importers", "/in/importers"],
    ["/runs/x/node-modules.tsv", "/in/node-modules.tsv"],
  ]);
  assert.deepEqual(kindMounts("mobile", { runDir: "/runs/x" }), [
    ["/runs/x/mobile.sh", "/in/mobile.sh"],
    ["/runs/x/licence-check.mjs", "/in/licence-check.mjs"],
    ["/runs/x/licences.json", "/in/licences.json"],
    ["/runs/x/judge-guard.mjs", "/in/judge-guard.mjs"],
    ["/runs/x/bin", "/in/bin"],
    ["/runs/x/main-paths", "/in/main-paths"],
    ["/runs/x/judge-view.sh", "/in/judge-view.sh"],
    ["/runs/x/prepare.sh", "/in/prepare.sh"],
    ["/runs/x/importers", "/in/importers"],
    ["/runs/x/node-modules.tsv", "/in/node-modules.tsv"],
  ]);
  assert.throws(() => kindMounts("nope", { runDir: "/r" }), /not a verify kind/);
  const argv = verifyArgs(S, { name: "v", image: "run", envFile: ENV, tarPath: TAR, mounts });
  const volumes = argv.filter((_, i) => argv[i - 1] === "--volume");
  assert.equal(volumes.length, 16);
  for (const v of volumes) assert.match(v, /:ro$/, v);
  assert.equal(argv[argv.indexOf("--network") + 1], "none");
  const judgeFiles = ["judge-guard.mjs", "bin/node", "bin/turbo", "judge-view.sh"];
  assert.deepEqual(Object.keys(kindFiles("gate")), [
    "gate.sh",
    "licence-check.mjs",
    "prepare.sh",
    ...judgeFiles,
  ]);
  assert.equal(kindFiles("gate")["prepare.sh"], prepareScript("gate"));
  assert.match(
    prepareScript("gate"),
    /^#!\/usr\/bin\/env bash\n[^\n]*\nset -o pipefail\nset -e; tar -xf/,
  );
  assert.equal(kindFiles("gate")["gate.sh"], gateScript());
  assert.deepEqual(Object.keys(kindFiles("mobile")), [
    "mobile.sh",
    "licence-check.mjs",
    "prepare.sh",
    ...judgeFiles,
  ]);
  assert.equal(kindFiles("mobile")["licence-check.mjs"], licenceCheckSource());
});

test("runJob gate: installs without the Uniwind Pro members and never lays in a licensed build; runs the gate script", async () => {
  const { deps, calls } = fakeDeps({ builds: ["esbuild", "uniwind-pro"], facts: async () => true });
  const r = await runJob({ ...JOB, kind: "gate" }, deps);
  assert.equal(r.conclusion, "success");
  // the scripts-off install, then (from its committed image) main's allowed builds (round 7, M2)
  const install = calls.runs[0].at(-1);
  assert.match(install, /--filter='!@figentra\/mobile' --filter='!@figentra\/playground'$/);
  assert.equal(
    calls.runs[1].at(-1),
    "set -e; cd /work; pnpm rebuild --ignore-pnpmfile --filter='!@figentra/mobile' --filter='!@figentra/playground' esbuild",
  );
  for (const run of calls.runs.slice(0, 2)) assert.doesNotMatch(run.at(-1), /uniwind-pro|prebuilt/);
  assert.equal(calls.runs[2].at(-1), "bash /in/prepare.sh");
  const steps = calls.runs.filter((run) => / --step /.test(run.at(-1)));
  assert.deepEqual(
    steps.map((run) => run.at(-1)),
    GATE_STEPS.map((step) => `bash /in/gate.sh --step ${step.id}`),
  );
  for (const run of steps) assert.ok(run.includes("/runs/x/gate.sh:/in/gate.sh:ro"));
});

test("runJob mobile: the full install with the licensed build; a licence failure fails verify-mobile only, as a result", async () => {
  const { deps, calls } = fakeDeps({ builds: ["esbuild", "uniwind-pro"] });
  const r = await runJob({ ...JOB, kind: "mobile" }, deps);
  assert.equal(r.conclusion, "success");
  assert.doesNotMatch(calls.runs[0].at(-1), /--filter=|rebuild/);
  assert.match(
    calls.runs[1].at(-1),
    /^set -e; cd \/work; pnpm rebuild --ignore-pnpmfile esbuild && for d in node_modules\/\.pnpm\/uniwind-pro@\*/,
  );
  assert.equal(calls.runs[2].at(-1), "bash /in/prepare.sh");
  assert.deepEqual(
    calls.runs.slice(3).map((run) => run.at(-1)),
    ["bash /in/mobile.sh --step licence-policy", "bash /in/mobile.sh --step mobile-apps"],
  );
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

test("self-update: a refused update posts a service problem, naming the refusal", async () => {
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
  assert.equal(r.conclusion, "failure");
  assert.equal(r.phase, "service");
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

// ---- round 4: what the tested tree may carry (review HIGH-1, HIGH-2; CTO rulings 2a-2c) ------------------------

/** The real `yaml` the daemon parses with, when this checkout has it installed (box 1's clone does). */
const YAML = (() => {
  try {
    return serviceYaml();
  } catch {
    return null;
  }
})();
const needsYaml = YAML ? {} : { skip: "the root's yaml is not installed in this checkout" };

/** A fixture whose main has a pnpm-workspace.yaml and a .gitignore; `pr(files)` commits a PR branch onto main. */
function treeRepo() {
  const repo = fixtureRepo();
  const { dir, git } = repo;
  const write = (path, text) => {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  git("checkout", "-q", "main");
  write(".gitignore", "node_modules/\n.turbo/\ndist/\n*.log\n");
  write(
    "pnpm-workspace.yaml",
    [
      "# the workspace",
      "packages:",
      "  - packages/*",
      "",
      "# shared versions",
      "catalog:",
      "  vitest: 5.0.5",
      "  turbo: 2.11.9",
      "",
      "overrides:",
      "  undici: 8.12.2",
      "",
      "# builds main allows",
      "allowBuilds:",
      "  esbuild: true",
      "",
    ].join("\n"),
  );
  write(
    "pnpm-lock.yaml",
    "lockfileVersion: '9.0'\n\nimporters:\n\n  .: {}\n\n  packages/a: {}\n\n  packages/b: {}\n",
  );
  git("add", "-A");
  git("commit", "-qm", "main workspace");
  const base = git("rev-parse", "HEAD");
  let n = 0;
  const pr = (files) => {
    git("checkout", "-q", "-b", `pr-${++n}`, base);
    for (const [path, text] of Object.entries(files)) write(path, text);
    git("add", "-A", "-f");
    git("commit", "-qm", `pr ${n}`);
    const sha = git("rev-parse", "HEAD");
    git("checkout", "-q", "main");
    return sha;
  };
  const build = (sha) => buildTree(mirrorOf(dir), base, sha, join(dir, `index-${sha}`), YAML);
  return { ...repo, base, pr, build };
}

test("buildTree refuses a committed tool binary or turbo cache, and anything main's .gitignore ignores, naming each", () => {
  const repo = treeRepo();
  try {
    for (const path of [
      "node_modules/.bin/node",
      "node_modules/.bin/gitleaks",
      "packages/a/node_modules/.bin/oxlint",
      ".turbo/cache/abc.tar.zst",
      "packages/a/.turbo/cache/x-meta.json",
      "dist/out.js",
      "packages/a/debug.log",
    ]) {
      const sha = repo.pr({ [path]: "#!/bin/sh\nexit 0\n" });
      assert.throws(
        () => repo.build(sha),
        (error) => error.refused === true && error.message.includes(path),
        path,
      );
    }
    // a source file is fine
    assert.match(
      repo.build(repo.pr({ "packages/a/src/b.ts": "export const b = 1;\n" })),
      /^[0-9a-f]{40}$/,
    );
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("forbiddenPaths: node_modules and .turbo at any depth, and what main ignores", () => {
  assert.deepEqual(
    forbiddenPaths(
      ["src/a.ts", "node_modules/.bin/node", "a/b/.turbo/x", "dist/x.js", "docs/node_modules.md"],
      new Set(["dist/x.js"]),
    ).map((p) => p.split(" ")[0]),
    ["node_modules/.bin/node", "a/b/.turbo/x", "dist/x.js"],
  );
});

test(
  "buildTree: pnpm-workspace.yaml keeps main's settings; only packages, catalog, catalogs and overrides are the PR's",
  needsYaml,
  () => {
    const repo = treeRepo();
    try {
      // settings pnpm reads for every command: refused, each named
      for (const [text, key] of [
        ["scriptShell: ./docs/fake.sh\n", "scriptShell"],
        ["pnpmfile: docs/hook.cjs\n", "pnpmfile"],
        ["allowBuilds:\n  esbuild: true\n  evil: true\n", "allowBuilds"],
      ]) {
        const main = readFileSync(join(repo.dir, "pnpm-workspace.yaml"), "utf8");
        const next =
          key === "allowBuilds"
            ? main.replace("allowBuilds:\n  esbuild: true\n", text)
            : `${main}${text}`;
        const sha = repo.pr({ "pnpm-workspace.yaml": next });
        assert.throws(
          () => repo.build(sha),
          (error) => error.refused && error.message.includes(`pnpm-workspace.yaml \`${key}\``),
          key,
        );
      }
      // anchors, aliases, tags and merge keys: refused anywhere
      for (const [text, what] of [
        ["catalog:\n  vitest: &v 5.0.5\n  turbo: *v\n", "anchor"],
        ["catalog:\n  vitest: !!str 5.0.5\n", "tag"],
        ["base: &b\n  vitest: 5.0.5\ncatalog:\n  <<: *b\n", "alias"],
      ]) {
        const sha = repo.pr({ "pnpm-workspace.yaml": `packages:\n  - packages/*\n${text}` });
        assert.throws(
          () => repo.build(sha),
          (error) => error.refused && error.message.includes(what),
          what,
        );
      }
      // a vitest bump in the catalog runs: the tested file is main's, with the PR's catalog spliced in
      const main = readFileSync(join(repo.dir, "pnpm-workspace.yaml"), "utf8");
      const bump = main.replace(
        "# shared versions\ncatalog:\n  vitest: 5.0.5",
        "# bumped\ncatalog:\n  vitest: 5.0.6",
      );
      const tree = repo.build(repo.pr({ "pnpm-workspace.yaml": bump }));
      const tested = repo.git("cat-file", "blob", `${tree}:pnpm-workspace.yaml`);
      assert.match(tested, /vitest: 5\.0\.6/);
      assert.match(tested, /# builds main allows\nallowBuilds:\n {2}esbuild: true/);
      assert.deepEqual(YAML.parse(tested).allowBuilds, { esbuild: true });
      // a nested pnpm-workspace.yaml is main's (pnpm reads its settings too): removed in a directory main has
      const nested = repo.build(
        repo.pr({ "packages/a/pnpm-workspace.yaml": "scriptShell: ./fake.sh\n" }),
      );
      assert.equal(
        repo
          .git("ls-tree", "-r", "--name-only", nested)
          .split("\n")
          .includes("packages/a/pnpm-workspace.yaml"),
        false,
      );
    } finally {
      rmSync(repo.dir, { recursive: true, force: true });
    }
  },
);

test(
  "buildTree: every dependency spec resolves from the registry, and no gate tool is renamed (CTO ruling 2a, 2b)",
  needsYaml,
  () => {
    const repo = treeRepo();
    try {
      const main = readFileSync(join(repo.dir, "pnpm-workspace.yaml"), "utf8");
      for (const [files, why] of [
        [
          { "pnpm-workspace.yaml": main.replace("turbo: 2.11.9", "turbo: npm:fake-turbo@1.0.0") },
          "renames the gate tool turbo to fake-turbo",
        ],
        [
          {
            "pnpm-workspace.yaml": main.replace(
              "undici: 8.12.2",
              "undici: 8.12.2\n  vitest: link:./docs/x",
            ),
          },
          'vitest "link:./docs/x" is not a registry spec',
        ],
        [
          {
            "packages/a/package.json":
              '{"name":"a","devDependencies":{"tsx":"file:../../docs/tsx"}}\n',
          },
          'tsx "file:../../docs/tsx" is not a registry spec',
        ],
        [
          { "packages/a/package.json": '{"name":"a","dependencies":{"x":"github:evil/x"}}\n' },
          "is not a registry spec",
        ],
        [
          { "packages/a/package.json": '{"name":"a","dependencies":{"knip":"npm:not-knip@1"}}\n' },
          "renames the gate tool knip to not-knip",
        ],
        [
          { "packages/a/package.json": '{"name":"a","dependencies":{"stranger":"workspace:*"}}\n' },
          "not a member",
        ],
      ]) {
        const sha = repo.pr(files);
        assert.throws(
          () => repo.build(sha),
          (error) => error.refused && error.message.includes(why),
          why,
        );
      }
      // registry ranges, tags, catalog references, aliases that keep the name, and workspace links between members
      const ok = repo.pr({
        "packages/a/package.json":
          '{"name":"a","dependencies":{"b":"workspace:*","zod":"^4","x":"latest","vitest":"catalog:","y":"npm:@scope/y@1.2.3"}}\n',
        "packages/b/package.json": '{"name":"b","devDependencies":{"turbo":"npm:turbo@2.11.9"}}\n',
      });
      assert.match(repo.build(ok), /^[0-9a-f]{40}$/);
    } finally {
      rmSync(repo.dir, { recursive: true, force: true });
    }
  },
);

/** dependencySpecProblems for two `$` overrides against a root package.json's devDependencies. */
const rootOverrides = (deps) =>
  dependencySpecProblems({
    workspace: { overrides: { knip: "$knipx", c: "$c" } },
    rootManifest: { devDependencies: deps },
  });

/** dependencySpecProblems over one workspace, its manifests and member names. */
const specProblems = (workspace, manifests = [], members = []) =>
  dependencySpecProblems({ workspace, manifests, memberNames: new Set(members) });

test("dependencySpecProblems: the spec grammar, without a repository", () => {
  const problems = specProblems;
  assert.deepEqual(
    problems({ catalog: { a: "^1", b: "1.2.3", c: "latest", d: ">=1 <2", e: "npm:e@1" } }),
    [],
  );
  assert.deepEqual(problems({ overrides: { "a@1>b": "-", "d>vitest": "5.0.6" } }), []);
  // review round 5, L3: a `$name` override is checked as the root's spec for `name`
  const root = rootOverrides;
  assert.deepEqual(root({ knipx: "6.41.0", c: "^1" }), []);
  assert.match(
    root({ knipx: "npm:evil-knip@1.0.0", c: "^1" })[0],
    /renames the gate tool knip to evil-knip/,
  );
  assert.match(root({ c: "^1" })[0], /knip "\$knipx" names no root dependency/);
  assert.match(root({ knipx: "link:./x", c: "^1" })[0], /is not a registry spec/);
  // and a gate tool is never a workspace link, even to a member
  assert.match(
    specProblems(
      {},
      [{ path: "p/package.json", json: { devDependencies: { vitest: "workspace:*" } } }],
      ["vitest"],
    )[0],
    /links a gate tool to a workspace member/,
  );
  for (const spec of [
    "link:../x",
    "file:x.tgz",
    "portal:x",
    "git+https://x/y.git",
    "https://x/y.tgz",
    "github:a/b",
    "a/b",
    "./x",
    "../x",
    "jsr:@a/b",
  ])
    assert.equal(problems({ catalog: { x: spec } }).length, 1, spec);
  assert.match(
    problems({ overrides: { "foo@1>vitest": "npm:other@1" } })[0],
    /renames the gate tool vitest/,
  );
  assert.match(
    problems({ catalogs: { c: { "@vitest/coverage-v8": "npm:fake@1" } } })[0],
    /renames the gate tool @vitest\/coverage-v8/,
  );
  assert.deepEqual(
    problems({}, [{ path: "p/package.json", json: { dependencies: { a: "workspace:^" } } }], ["a"]),
    [],
  );
});

test("proof B2: a gate tool that is main's own member (@stackra/cli) keeps its workspace: link; no other gate tool does", () => {
  const manifests = [
    {
      path: "apps/docs/package.json",
      json: { devDependencies: { "@stackra/cli": "workspace:*" } },
    },
  ];
  const problems = (gateMembers) =>
    dependencySpecProblems({
      manifests,
      memberNames: new Set(["@stackra/cli"]),
      gateMembers: new Set(gateMembers),
    });
  assert.deepEqual(problems(["@stackra/cli"]), []);
  assert.match(
    problems([])[0],
    /@stackra\/cli "workspace:\*" links a gate tool to a workspace member/,
  );
  // an override still never links one
  assert.match(
    dependencySpecProblems({
      workspace: { overrides: { "@stackra/cli": "workspace:*" } },
      memberNames: new Set(["@stackra/cli"]),
      gateMembers: new Set(["@stackra/cli"]),
    })[0],
    /is a workspace: spec for a package that is not a member/,
  );
});

/** A lockfile where packages/<from> links `to.name` from packages/<to.dir> (workspace:*), beside an empty member. */
const memberLinkLock = (from, to) =>
  [
    "lockfileVersion: '9.0'",
    "",
    "importers:",
    "",
    "  .: {}",
    "",
    `  packages/${from}:`,
    "    devDependencies:",
    `      '${to.name}':`,
    "        specifier: workspace:*",
    `        version: link:../${to.dir}`,
    "",
    `  packages/${from === "a" ? "b" : "a"}: {}`,
    "",
  ].join("\n");

test("proof B2: buildTree accepts main's own workspace link to its gate-tool member, and refuses that name anywhere else", () => {
  const repo = treeRepo();
  const { dir, git } = repo;
  const write = (path, text) => {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  try {
    git("checkout", "-q", "main");
    write("packages/a/package.json", '{"name":"@stackra/cli","bin":{"stackra":"x.mjs"}}\n');
    write(
      "packages/b/package.json",
      '{"name":"b","devDependencies":{"@stackra/cli":"workspace:*"}}\n',
    );
    write("pnpm-lock.yaml", memberLinkLock("b", { name: "@stackra/cli", dir: "a" }));
    git("add", "-A");
    git("commit", "-qm", "main links its CLI");
    const base = git("rev-parse", "HEAD");
    let n = 0;
    const build = (files) => {
      git("checkout", "-q", "-b", `b2-${++n}`, base);
      for (const [path, text] of Object.entries(files)) write(path, text);
      git("add", "-A");
      git("commit", "-qm", `b2 ${n}`, "--allow-empty");
      const sha = git("rev-parse", "HEAD");
      git("checkout", "-q", "main");
      return buildTree(mirrorOf(dir), base, sha, join(dir, `index-b2-${n}`), YAML);
    };
    // main's own tree, and a PR that changes a source beside it
    assert.match(build({}), /^[0-9a-f]{40}$/);
    assert.match(build({ "packages/b/src/x.ts": "export const x = 1;\n" }), /^[0-9a-f]{40}$/);
    // the gate tool's name moved to another member, or another gate tool made a member: refused
    for (const [files, key] of [
      [
        {
          "packages/a/package.json":
            '{"name":"a","devDependencies":{"@stackra/cli":"workspace:*"}}\n',
          "packages/b/package.json": '{"name":"@stackra/cli"}\n',
          "pnpm-lock.yaml": memberLinkLock("a", { name: "@stackra/cli", dir: "b" }),
        },
        "@stackra/cli",
      ],
      [
        {
          "packages/a/package.json": '{"name":"vitest"}\n',
          "packages/b/package.json": '{"name":"b","devDependencies":{"vitest":"workspace:*"}}\n',
          "pnpm-lock.yaml": memberLinkLock("b", { name: "vitest", dir: "a" }),
        },
        "vitest",
      ],
    ])
      assert.throws(
        () => build(files),
        (error) =>
          error.refused === true &&
          error.message.includes(`${key} "workspace:*" links a gate tool to a workspace member`),
        key,
      );
    // re-review of the box 1 proofs: a gate tool the lockfile alone aliases (the spec unchanged) refuses the tree,
    // never a service error
    const evilLock = (version) =>
      memberLinkLock("b", { name: "@stackra/cli", dir: "a" }).replace(
        "        version: link:../a\n",
        `        version: link:../a\n      turbo:\n        specifier: 'catalog:'\n        version: ${version}\n`,
      );
    const withTurbo = {
      "packages/b/package.json":
        '{"name":"b","devDependencies":{"@stackra/cli":"workspace:*","turbo":"catalog:"}}\n',
    };
    assert.throws(
      () => build({ ...withTurbo, "pnpm-lock.yaml": evilLock("evil-turbo@1.0.0") }),
      (error) =>
        error.refused === true &&
        error.message.includes(
          "pnpm-lock.yaml: an alias only the lockfile makes: packages/b turbo locked as evil-turbo",
        ),
    );
    assert.match(build({ ...withTurbo, "pnpm-lock.yaml": evilLock("2.11.9") }), /^[0-9a-f]{40}$/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("serviceYaml: the daemon's parser is main's installed yaml; a missing or different one is a host problem", () => {
  const dir = mkdtempSync(join(tmpdir(), "stackra-yaml-"));
  try {
    writeFileSync(join(dir, "package.json"), "{}\n");
    assert.match(yamlProblem(dir), /has no `yaml` installed/);
    mkdirSync(join(dir, "node_modules/yaml"), { recursive: true });
    writeFileSync(
      join(dir, "node_modules/yaml/package.json"),
      '{"name":"yaml","version":"2.0.0","main":"x.js"}\n',
    );
    writeFileSync(join(dir, "node_modules/yaml/x.js"), "module.exports = {};\n");
    writeFileSync(
      join(dir, "pnpm-lock.yaml"),
      "lockfileVersion: '9.0'\n\nimporters:\n\n  .:\n    devDependencies:\n      yaml:\n        specifier: 'catalog:'\n        version: 2.9.1\n",
    );
    assert.match(yamlProblem(dir), /yaml 2\.0\.0 installed, main locks 2\.9\.1/);
    writeFileSync(
      join(dir, "node_modules/yaml/package.json"),
      '{"name":"yaml","version":"2.9.1","main":"x.js"}\n',
    );
    assert.equal(yamlProblem(dir), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (YAML) assert.equal(yamlProblem(), null);
});

/**
 * The executables the gate's steps run: their commands, the root scripts they call (`pnpm <script>`) and the member
 * scripts their `turbo run` tasks reach under the step's filters. Shell syntax is skipped by shape.
 */
function gateCommands(steps, root) {
  const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const members = globSync(
    [
      "apps/*/package.json",
      "packages/*/*/package.json",
      "services/*/package.json",
      "workers/*/package.json",
    ],
    { cwd: root },
  ).map((f) => ({
    dir: f.slice(0, -"/package.json".length),
    json: JSON.parse(readFileSync(join(root, f), "utf8")),
  }));
  const found = new Map();
  const seen = new Set();
  const expand = (text, scripts, where, filters = String(text)) => {
    const exclude = new Set([...filters.matchAll(/--filter='?!([^'\s]+)/g)].map((m) => m[1]));
    const only = [...filters.matchAll(/--filter='?\.\/([^'\s*]+)/g)].map((m) => m[1]);
    const named = [...filters.matchAll(/--filter='?(@?[a-z][^'\s!.[]*)'?(?=\s|$)/g)].map(
      (m) => m[1],
    );
    const wide = /--filter='?\.\.\.|\.\.\.'?(?=\s|$)/.test(filters);
    const clean = String(text)
      .split("\n")
      .filter((l) => !l.trim().startsWith("#"))
      .join("\n")
      .replaceAll(/"(?:[^"\\]|\\.)*"|'[^']*'/g, "''");
    for (const segment of clean.split(/\n|&&|\|\||;|\||\$\(|<\(|\(|\)|\{|\}/)) {
      const words = segment.trim().split(/\s+/).filter(Boolean);
      while (words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])) words.shift();
      while (["xargs", "timeout", "nice", "exec"].includes(words[0])) {
        words.shift();
        while (words[0]?.startsWith("-")) words.shift();
      }
      if (words[0] === "pnpm" && words[1] === "exec") words.splice(0, 2);
      const cmd = words[0];
      if (!cmd || !/^[a-z][a-z0-9._-]*$/.test(cmd)) continue;
      if (cmd === "pnpm" && scripts[words[1]] !== undefined) {
        const key = `${where}\t${words[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          expand(scripts[words[1]], scripts, where);
        }
        continue;
      }
      if (cmd === "turbo" && words[1] === "run")
        for (const task of words.slice(2).filter((w) => !w.startsWith("-")))
          for (const m of members) {
            if (exclude.has(m.json.name)) continue;
            if (only.length && !only.some((p) => m.dir.startsWith(p))) continue;
            if (!wide && named.length && !named.includes(m.json.name)) continue;
            if (m.json.scripts?.[task] === undefined) continue;
            const key = `${m.dir}\t${task}`;
            if (!seen.has(key)) {
              seen.add(key);
              expand(m.json.scripts[task], m.json.scripts ?? {}, m.dir);
            }
          }
      if (!found.has(cmd)) found.set(cmd, `${where}: ${segment.trim().slice(0, 80)}`);
    }
  };
  for (const step of steps) expand(step.run, rootPkg.scripts ?? {}, `step ${step.id}`);
  return found;
}

/**
 * The tools the stackra CLI starts itself (review L4): every command resolveTool picks for a member task (`at("vite",
 * …)`) and every bin it runs by path (`join(root, "node_modules", ".bin", "jscpd")`), read from the CLI's source.
 */
function cliSpawned(root) {
  const found = new Set();
  for (const file of globSync("packages/developer/cli/src/**/*.ts", { cwd: root })) {
    if (file.includes("__tests__")) continue;
    const text = readFileSync(join(root, file), "utf8");
    for (const m of text.matchAll(/\bat\("([a-z][\w.-]*)"/g)) found.add(m[1]);
    for (const m of text.matchAll(/"node_modules",\s*"\.bin",\s*"([a-z][\w.-]*)"/g))
      found.add(m[1]);
  }
  return found;
}

test("GATE_TOOL_PACKAGES: derived from what the gate's steps run; a command without its package fails here (ruling 2c)", () => {
  const commands = gateCommands(GATE_STEPS, CODE_DIR);
  // the gate runs the stackra CLI (by its bin, or by path in validate), so the tools it starts count too
  const rootScripts = JSON.stringify(
    JSON.parse(readFileSync(join(CODE_DIR, "package.json"), "utf8")).scripts,
  );
  assert.ok(
    commands.has("stackra") || rootScripts.includes("packages/developer/cli/dist/stackra.mjs"),
  );
  const spawned = cliSpawned(CODE_DIR);
  for (const bin of ["jscpd", "vite", "vitest", "tsdown", "oxlint", "tsc"])
    assert.ok(spawned.has(bin), `${bin} is no longer started by the CLI`);
  for (const cmd of spawned)
    if (!commands.has(cmd)) commands.set(cmd, "started by the stackra CLI");
  for (const [cmd, where] of commands)
    assert.ok(
      cmd in GATE_TOOL_BINS || NOT_PACKAGE_COMMANDS.includes(cmd),
      `${cmd} (${where}) has no package in GATE_TOOL_BINS`,
    );
  for (const bin of ["turbo", "vitest", "tsc", "oxlint", "oxfmt", "knip", "commitlint"])
    assert.ok(commands.has(bin), `${bin} is no longer run by a step`);
  for (const name of [
    "turbo",
    "vitest",
    "@vitest/coverage-v8",
    "typescript",
    "@commitlint/cli",
    "@commitlint/load",
    "tsx",
  ])
    assert.equal(isGateToolPackage(name), true, name);
  assert.equal(isGateToolPackage("zod"), false);
  // the derivation itself catches a new command: a step that runs `eslint` would fail the first assertion
  const extra = gateCommands([...GATE_STEPS, { id: "x", run: "pnpm exec eslint ." }], CODE_DIR);
  assert.ok(
    extra.has("eslint") &&
      !("eslint" in GATE_TOOL_BINS) &&
      !NOT_PACKAGE_COMMANDS.includes("eslint"),
  );
});

test("the gate container's HOME, XDG cache and turbo cache are fresh tmpfs paths; the licence step is first", () => {
  const env = Object.fromEntries(
    CONTAINER_ENV.trim()
      .split("\n")
      .map((l) => l.split(/=(.*)/s).slice(0, 2)),
  );
  assert.equal(env.HOME, "/home/run");
  assert.equal(env.XDG_CACHE_HOME, "/home/run/.cache");
  assert.equal(env.TURBO_CACHE_DIR, "/tmp/turbo-cache");
  const limits = containerLimits(S, ENV);
  const tmpfs = limits.filter((_, i) => limits[i - 1] === "--tmpfs").map((t) => t.split(":")[0]);
  for (const path of [env.HOME, env.XDG_CACHE_HOME, env.TURBO_CACHE_DIR])
    assert.ok(
      tmpfs.some((t) => path === t || path.startsWith(`${t}/`)),
      path,
    );
  assert.equal(GATE_STEPS[0].id, "licence-policy");
  assert.match(GATE_STEPS[0].run, /--ignore-pnpmfile/);
  assert.equal(
    GATE_STEPS[0].run
      .split("\n")
      .filter((l) => l.startsWith("pnpm ") && !l.includes("--ignore-pnpmfile")).length,
    0,
  );
});

test("runJob: a refused tree is the PR's failure, each problem named in the check run", async () => {
  const { deps, calls } = fakeDeps({});
  deps.archive = () => {
    throw treeRefusalFor([
      "node_modules/.bin/node is a tool or cache path main ignores and the tested tree never carries",
    ]);
  };
  const r = await runJob(JOB, deps);
  assert.equal(r.conclusion, "failure");
  assert.equal(r.phase, "tree");
  assert.equal(calls.runs.length, 0);
  assert.match(
    checkRunBody({ sha: SHA, base: BASE, ...r, durationMs: 1 }).output.title,
    /^the PR's tree is refused \(node_modules\/\.bin\/node is a tool/,
  );
});

/** A refusal shaped as buildTree throws it. */
const treeRefusalFor = (problems) =>
  Object.assign(new Error(`the tested tree is refused: ${problems.join("; ")}`), {
    refused: true,
    problems,
  });

test("readers: YAML double-quoted escapes decode (\\x61 is a); an escape YAML lacks is a problem", () => {
  const w = workspaceManifest('packages:\n  - "pkg\\x73/*"\ncatalog:\n  "\\u0061": 1\n');
  assert.deepEqual(w.packages, ["pkgs/*"]);
  assert.deepEqual({ ...w.catalogs.default }, { a: "1" });
  assert.match(workspaceManifest('packages:\n  - "a\\qb"\n').problems[0], /escape \\q/);
  assert.match(lockfileGraph('importers:\n\n  "a\\qb":\n').problems[0], /escape \\q/);
  assert.deepEqual(
    Object.keys(lockfileGraph('importers:\n\n  "\\x2e":\n    dependencies: {}\n').importers),
    ["."],
  );
});

test("pnpmFindings: a lockfile member pnpm list does not name is a problem (both sets must match)", () => {
  const list = PNPM_LIST().filter((p) => p.path !== "/w/packages/lib/util");
  const problems = pnpmFindings(list, PNPM_ROOT, LOCK_MEMBERS, POLICY, MOBILE_MEMBERS, {}).problems;
  assert.ok(
    problems.includes("packages/lib/util is a workspace member pnpm list does not name"),
    problems.join("\n"),
  );
});

test("OSV canary: a new store image or osv-scanner version runs it again; an in-place database under 1 MiB is refused", () => {
  const now = Date.parse("2026-11-24T12:00:00Z");
  const database = { mtimeMs: 1000, size: 5, image: "sha256:a", scanner: "2.7.0" };
  const last = { ...database, at: now - 60_000 };
  assert.equal(osvCanaryDue(last, database, now), false);
  assert.equal(osvCanaryDue(last, { ...database, image: "sha256:b" }, now), true);
  assert.equal(osvCanaryDue(last, { ...database, scanner: "2.8.0" }, now), true);
  assert.match(
    osvDbProblem(now - 60_000, now, 86_400_000, 1024),
    /1024 bytes \(at least 1048576\)/,
  );
  assert.equal(osvDbProblem(now - 60_000, now, 86_400_000, OSV_DB_MIN_BYTES), null);
});

// ---- round 5, C1: shared-process steps never run a config module that is not main's ------------------------------

/** A tree entry for sharedStepSwaps. */
const e = (path, object) => ({ path, object });

test("sharedStepSwaps: every tested-tree loader file that is not main's copy; main's copy for those main has", () => {
  const swaps = sharedStepSwaps(
    [
      e("knip.jsonc", "k"),
      e("packages/a/vitest.config.ts", "same"),
      e("packages/a/postcss.config.js", "pr"),
      e("packages/a/src/index.ts", "pr"),
      e("packages/new/vitest.config.mts", "new"),
      e("packages/new/.storybook/main.ts", "new"),
      e("packages/b/jest.config.js", "new"),
    ],
    [
      e("knip.jsonc", "k"),
      e("packages/a/vitest.config.ts", "same"),
      e("packages/a/postcss.config.js", "main"),
    ],
  );
  assert.deepEqual(swaps, {
    paths: [
      "packages/a/postcss.config.js",
      "packages/b/jest.config.js",
      "packages/new/.storybook/main.ts",
      "packages/new/vitest.config.mts",
    ],
    main: ["packages/a/postcss.config.js"],
  });
});

test("buildTree: a new member keeps its vitest config for its own tests, and the shared steps get it listed to set aside", () => {
  const { dir, base, sha } = newMemberRepo();
  try {
    const out = {};
    const tree = buildTree(mirrorOf(dir), base, sha, join(dir, "scratch-index"), null, out);
    assert.match(tree, /^[0-9a-f]{40}$/);
    assert.ok(
      out.shared.paths.includes("packages/new/vitest.config.mjs"),
      out.shared.paths.join(","),
    );
    assert.deepEqual(out.shared.main, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test(
  "gate script: a shared step runs with main's config modules laid in, and the PR's are back for the next step",
  needsBash,
  () => {
    const fixture = gateFixture();
    const { work, input, bin } = fixture;
    mkdirSync(join(work, "packages/new"), { recursive: true });
    mkdirSync(join(work, "packages/a"), { recursive: true });
    writeFileSync(join(work, "packages/new/vitest.config.ts"), "process.exit(0);\n");
    writeFileSync(join(work, "packages/a/postcss.config.js"), "// the PR's\n");
    writeFileSync(
      join(input, "shared-definitions"),
      "packages/new/vitest.config.ts\0packages/a/postcss.config.js\0",
    );
    // main's copy of the one main has
    const main = join(fixture.dir, "main");
    mkdirSync(join(main, "packages/a"), { recursive: true });
    writeFileSync(join(main, "packages/a/postcss.config.js"), "// main's\n");
    spawnSync("tar", [
      "-cf",
      join(input, "shared-main.tar"),
      "-C",
      main,
      "packages/a/postcss.config.js",
    ]);
    // pnpm reports what each step sees
    writeFileSync(
      join(bin, "pnpm"),
      [
        "#!/bin/sh",
        'echo >&2 "CALL: pnpm $*"',
        'echo >&2 "SEES: $( [ -e packages/new/vitest.config.ts ] && echo new-config || echo no-new-config ) $(cat packages/a/postcss.config.js)"',
        "",
      ].join("\n"),
    );
    chmodSync(join(bin, "pnpm"), 0o755);
    const run = runGate(fixture);
    const sees = (id) => run.sections[id].lines.filter((l) => l.startsWith("SEES: "));
    for (const id of ["format-check", "knip"]) {
      assert.equal(run.sections[id].result, "pass", run.stdout);
      for (const line of sees(id)) assert.equal(line, "SEES: no-new-config // main's", id);
    }
    // the per-package steps (lint, test) run the PR's own files
    for (const id of ["lint", "test"])
      for (const line of sees(id)) assert.equal(line, "SEES: new-config // the PR's", id);
    assert.equal(readFileSync(join(work, "packages/a/postcss.config.js"), "utf8"), "// the PR's\n");
    assert.deepEqual(
      GATE_STEPS.filter((s) => s.shared).map((s) => s.id),
      ["format-check", "knip"],
    );
  },
);

/** The installed knip of this checkout (box 1 has it under node_modules/.pnpm), or null. */
const KNIP = (() => {
  const root = CODE_DIR;
  const dist = globSync("node_modules/.pnpm/knip@*/node_modules/knip/dist", {
    cwd: root,
  }).toSorted()[0];
  return dist ? join(root, dist) : null;
})();
const needsKnip = KNIP ? {} : { skip: "knip is not installed in this checkout" };

/** Every concrete file name a knip config pattern stands for: braces expanded, `?(.)` both ways, globs filled. */
function patternNames(pattern) {
  const m = /\{([^{}]*)\}|\?\(([^()]*)\)/.exec(pattern);
  if (!m) return [pattern.replaceAll("**", "a/b").replaceAll("*", "x")];
  const alternatives = m[1] !== undefined ? m[1].split(",") : ["", m[2]];
  return alternatives.flatMap((alt) =>
    patternNames(pattern.slice(0, m.index) + alt + pattern.slice(m.index + m[0].length)),
  );
}

test(
  "C1: every config module the installed knip can execute is a shared-step loader; those it enables here are main's",
  needsKnip,
  async () => {
    const { Plugins } = await import(pathToFileURL(join(KNIP, "plugins/index.js")).href);
    const executable = /\.[cm]?[jt]sx?$/;
    const manifests = [
      "package.json",
      ...globSync(
        [
          "apps/*/package.json",
          "packages/*/*/package.json",
          "services/*/package.json",
          "workers/*/package.json",
        ],
        { cwd: CODE_DIR },
      ),
    ].map((f) => JSON.parse(readFileSync(join(CODE_DIR, f), "utf8")));
    const deps = new Set(
      manifests.flatMap((m) =>
        ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].flatMap(
          (k) => Object.keys(m[k] ?? {}),
        ),
      ),
    );
    let all = 0;
    const enabledNames = [];
    for (const [name, plugin] of Object.entries(Plugins)) {
      const names = (Array.isArray(plugin.config) ? plugin.config : [])
        .flatMap(patternNames)
        .filter((n) => executable.test(n));
      all += names.length;
      for (const n of names)
        assert.ok(
          SHARED_STEP_LOADERS.test(`packages/new/${n}`),
          `knip ${name} executes ${n}, which SHARED_STEP_LOADERS misses`,
        );
      let enabled;
      try {
        enabled = await plugin.isEnabled({
          dependencies: deps,
          manifest: manifests[0],
          config: {},
          cwd: CODE_DIR,
        });
      } catch {
        enabled = false;
      }
      if (enabled) enabledNames.push(...names.map((n) => [name, n]));
    }
    assert.ok(all > 500, `${all} names`);
    for (const [name, n] of enabledNames)
      assert.ok(
        isVerifyOverlay(`packages/a/${n}`),
        `knip ${name} executes ${n} here, which VERIFY_OVERLAY misses`,
      );
    // oxfmt (format-check) executes a nested oxfmt.config too
    for (const n of ["oxfmt.config.ts", "oxfmt.config.mts"]) {
      assert.ok(SHARED_STEP_LOADERS.test(`packages/new/${n}`), n);
      assert.ok(isVerifyOverlay(`packages/a/${n}`), n);
    }
  },
);

test(
  "C1, real knip: a new member's vitest.config that exits 0 never turns the shared knip step green; its own tests use it",
  { ...needsKnip, ...needsBash },
  () => {
    const dir = mkdtempSync(join(tmpdir(), "stackra-c1-"));
    const work = join(dir, "work");
    const input = join(dir, "in");
    try {
      const write = (path, text) => {
        mkdirSync(join(work, path, ".."), { recursive: true });
        writeFileSync(join(work, path), text);
      };
      mkdirSync(input, { recursive: true });
      write("package.json", '{"name":"root","private":true,"workspaces":["packages/*"]}\n');
      write("pnpm-workspace.yaml", "packages:\n  - packages/*\n");
      write(
        "knip.json",
        '{"workspaces":{"packages/*":{"entry":["src/index.js"],"project":["src/**/*.js"]}}}\n',
      );
      // a real finding elsewhere: an unused file in an existing member
      write("packages/a/package.json", '{"name":"a","private":true,"main":"src/index.js"}\n');
      write("packages/a/src/index.js", "export const a = 1;\n");
      write("packages/a/src/unused.js", "export const unused = 2;\n");
      // the new member: its vitest.config.mjs ends any knip process green, and narrows its own tests to *.check.mjs
      write(
        "packages/new/package.json",
        '{"name":"new","private":true,"main":"src/index.js","devDependencies":{"vitest":"5"}}\n',
      );
      write("packages/new/src/index.js", "export const b = 1;\n");
      write("packages/new/src/new.check.mjs", "test('new member', () => expect(1 + 1).toBe(2));\n");
      write(
        "packages/new/vitest.config.mjs",
        [
          "if (process.argv.some((a) => a.includes('knip'))) process.exit(0);",
          "export default { test: { globals: true, include: ['src/**/*.check.mjs'] } };",
          "",
        ].join("\n"),
      );
      const knip = join(dirname(KNIP), "bin/knip.js");
      const step = { id: "knip", run: `node "${knip}" --no-progress`, shared: true };
      const script = (shared) =>
        stepScript([{ ...step, shared }], { inDir: input, workDir: work, facts: false });
      const run = (shared) => {
        writeFileSync(join(dir, "gate.sh"), script(shared));
        return spawnSync(BASH, [join(dir, "gate.sh")], {
          encoding: "utf8",
          env: { ...process.env, TMPDIR: dir },
        });
      };
      writeFileSync(join(input, "shared-definitions"), "packages/new/vitest.config.mjs\0");
      writeFileSync(join(input, "shared-main.tar"), "");
      // without the swap the attack works: the config exits 0 inside knip and the step is green
      const attacked = run(false);
      assert.equal(attacked.status, 0, attacked.stdout);
      // with it (the gate's knip step), main's rules hold: knip runs and reports the unused file
      const guarded = run(true);
      assert.equal(guarded.status, 1, guarded.stdout);
      assert.match(guarded.stdout, /unused\.js/);
      assert.equal(
        readFileSync(join(work, "packages/new/vitest.config.mjs"), "utf8").includes(
          "process.exit(0)",
        ),
        true,
      );
      // and the member's own tests (a per-package step) run with that config: one test, found by its include only
      if (VITEST) {
        const own = spawnSync(
          process.execPath,
          [VITEST, "run", "--root", join(work, "packages/new")],
          {
            encoding: "utf8",
            env: { ...process.env, CI: "1", NO_COLOR: "1" },
          },
        );
        assert.equal(own.status, 0, own.stdout + own.stderr);
        assert.match(own.stdout, /Tests\s+1 passed/);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test("N1: a self-check that refuses on the clone's root deps names the operator's command, through to the check run", async () => {
  const dir = mkdtempSync(join(tmpdir(), "stackra-n1-"));
  try {
    writeFileSync(join(dir, "package.json"), "{}\n");
    const problem = yamlProblem(dir);
    assert.ok(problem.includes(`run \`${SERVICE_INSTALL}\` in ${dir}`), problem);
    assert.equal(SERVICE_INSTALL, "pnpm install --frozen-lockfile --ignore-scripts --filter .");
    // the staged self-check prints its problems; the refusal keeps the first one whole
    const refused = selfCheckProblem({
      status: 1,
      stdout: `stackra-verify self-check failed:\n  - ${problem}\n  - the self-check tests failed (exit 1): ℹ fail 3`,
    });
    assert.ok(refused.includes(SERVICE_INSTALL), refused);
    const message = definitionDrift(
      { [SELF_PATH]: "a".repeat(40) },
      { [SELF_PATH]: "b".repeat(40) },
      refused,
    );
    assert.ok(message.includes(SERVICE_INSTALL), message);
    const body = checkRunBody({
      sha: SHA,
      base: BASE,
      conclusion: "failure",
      phase: "service",
      reason: message,
      durationMs: 1,
    });
    assert.ok(body.output.summary.includes(`- Reason: ${message}`));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("M2: stackra/verify never posts neutral; a service problem is a failure that says so, on the gate only", () => {
  assert.throws(
    () =>
      checkRunBody({
        kind: "gate",
        sha: SHA,
        base: BASE,
        conclusion: "neutral",
        reason: "x",
        durationMs: 1,
      }),
    /never posts neutral/,
  );
  assert.equal(serviceProblemConclusion("gate"), "failure");
  // the two checks that are never required keep "could not run"
  for (const kind of ["mobile", "codeql"]) {
    assert.equal(serviceProblemConclusion(kind), "neutral");
    const body = checkRunBody({
      kind,
      sha: SHA,
      base: BASE,
      conclusion: "neutral",
      phase: "service",
      reason: "docker",
      durationMs: 1,
    });
    assert.equal(body.conclusion, "neutral");
  }
  const body = checkRunBody({
    sha: SHA,
    base: BASE,
    conclusion: "failure",
    phase: "service",
    reason: "the store image could not be pulled",
    durationMs: 1,
  });
  assert.equal(body.conclusion, "failure");
  assert.match(
    body.output.title,
    /^stackra\/verify service problem \(not the PR's fault\): the store image could not be pulled/,
  );
  assert.ok(body.output.summary.includes("- Reason: the store image could not be pulled"));
  const posted = {
    name: "stackra/verify",
    head_sha: SHA,
    app: { id: 1 },
    status: "completed",
    conclusion: "failure",
    output: { title: body.output.title },
  };
  assert.equal(recordedRun([posted], SHA, 1), undefined);
  const prFailure = { ...posted, output: { title: "Quality Gate failed in 1 s" } };
  assert.equal(recordedRun([prFailure], SHA, 1), prFailure);
});

test("M1: main's .gitignore never refuses a definition file or a path main tracks (main force-tracks vitest configs)", () => {
  const repo = treeRepo();
  try {
    const { dir, git } = repo;
    // like main: an ignore rule for generated vitest configs, and the configs tracked anyway
    writeFileSync(
      join(dir, ".gitignore"),
      "node_modules/\n.turbo/\ndist/\npackages/*/vitest.config.ts\n",
    );
    git("add", "-A", "-f");
    git("commit", "-qm", "main ignores generated vitest configs");
    assert.match(git("ls-files", "packages/a/vitest.config.ts"), /vitest\.config\.ts/);
    const base = git("rev-parse", "HEAD");
    const build = (files) => {
      git("checkout", "-q", "-b", `m1-${Object.keys(files)[0].replaceAll("/", "-")}`, base);
      for (const [path, text] of Object.entries(files)) {
        mkdirSync(join(dir, path, ".."), { recursive: true });
        writeFileSync(join(dir, path), text);
      }
      git("add", "-A", "-f");
      git("commit", "-qm", "pr");
      const sha = git("rev-parse", "HEAD");
      git("checkout", "-q", "main");
      return buildTree(mirrorOf(dir), base, sha, join(dir, `index-${sha}`), YAML);
    };
    // a new member's vitest.config.ts (ignored by name, a definition file): kept for the member, not refused
    const added = build({
      "packages/new/package.json": '{"name":"new"}\n',
      "packages/new/vitest.config.ts": "export default {};\n",
    });
    assert.ok(
      git("ls-tree", "-r", "--name-only", added)
        .split("\n")
        .includes("packages/new/vitest.config.ts"),
    );
    // an edit to a tracked one: not refused (main's copy wins, as for every definition file)
    const edited = build({ "packages/a/vitest.config.ts": "export default { test: {} };\n" });
    assert.match(
      git("cat-file", "blob", `${edited}:packages/a/vitest.config.ts`),
      /include: \['src\/\*\*'\]/,
    );
    // node_modules is refused whatever the rules say
    assert.throws(
      () => build({ "packages/a/node_modules/x.js": "x\n" }),
      (error) => error.refused,
    );
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test("L5: a gitlink the PR adds or changes is refused; main's own unchanged gitlink stays", () => {
  const repo = treeRepo();
  try {
    const { dir, git } = repo;
    const commit = git("rev-parse", "HEAD");
    git("update-index", "--add", "--cacheinfo", `160000,${commit},.notes`);
    git("commit", "-qm", "main has a gitlink");
    const base = git("rev-parse", "HEAD");
    let n = 0;
    const pr = (path, target) => {
      git("checkout", "-q", "-b", `l5-${++n}`, base);
      git("update-index", "--add", "--cacheinfo", `160000,${target},${path}`);
      writeFileSync(join(dir, "packages/a/src/l5.ts"), `export const x = "${path}";\n`);
      git("add", "packages/a/src/l5.ts");
      git("commit", "-qm", "pr");
      const sha = git("rev-parse", "HEAD");
      git("checkout", "-q", "main");
      return sha;
    };
    const build = (sha) => buildTree(mirrorOf(dir), base, sha, join(dir, `index-${sha}`), YAML);
    assert.match(build(pr(".notes", commit)), /^[0-9a-f]{40}$/);
    for (const [path, target] of [
      ["vendor/tool", commit],
      ["node_modules/.bin/node", commit],
      [".notes", git("rev-parse", "HEAD~2")],
    ])
      assert.throws(
        () => build(pr(path, target)),
        (error) => error.refused && error.message.includes(path),
        path,
      );
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

test(
  "L1: a stop during a run that would restart ends the service; it is not started again",
  needsFlock,
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "stackra-lock-"));
    const script = join(dir, "service.mjs");
    try {
      writeFileSync(
        script,
        [
          'import { appendFileSync, writeFileSync } from "node:fs";',
          `appendFileSync(${JSON.stringify(join(dir, "runs"))}, "run\\n");`,
          // a self-update finished just as the stop arrived: this run would ask for a restart
          `process.on("SIGTERM", () => process.exit(${RESTART_EXIT}));`,
          `writeFileSync(${JSON.stringify(join(dir, "started"))}, "");`,
          "setInterval(() => {}, 1000);",
        ].join("\n"),
      );
      const shell = spawn("/bin/sh", lockedShell(join(dir, "lock"), [process.execPath, script]));
      const exited = new Promise((resolve) => {
        shell.on("close", resolve);
      });
      for (let i = 0; i < 100 && spawnSync("test", ["-e", join(dir, "started")]).status !== 0; i++)
        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      shell.kill("SIGTERM");
      assert.equal(await exited, RESTART_EXIT);
      assert.equal(readFileSync(join(dir, "runs"), "utf8"), "run\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test(
  "L1: new code that ends before its first pass is rolled back to the previous HEAD, in the ledger, and the old code runs",
  needsFlock,
  () => {
    const dir = mkdtempSync(join(tmpdir(), "stackra-roll-"));
    const home = join(dir, "home");
    const clone = join(dir, "clone");
    try {
      mkdirSync(join(home, "ledger"), { recursive: true });
      mkdirSync(clone);
      gitIn(clone, "init", "-q", "-b", "main");
      writeFileSync(join(clone, "code.txt"), "old\n");
      gitIn(clone, "add", "-A");
      gitIn(clone, "commit", "-qm", "old");
      const old = gitIn(clone, "rev-parse", "HEAD");
      writeFileSync(join(clone, "code.txt"), "new\n");
      gitIn(clone, "commit", "-qam", "new");
      const fresh = gitIn(clone, "rev-parse", "HEAD");
      // the switch just happened: the daemon recorded the HEAD to go back to and cleared the started mark
      writeFileSync(join(home, SWITCH_PREVIOUS), `${old}\n`);
      // the service: the new code dies at start; the old code reaches its passes and stops
      const script = join(dir, "service.mjs");
      writeFileSync(
        script,
        [
          'import { readFileSync, writeFileSync, appendFileSync } from "node:fs";',
          `const code = readFileSync(${JSON.stringify(join(clone, "code.txt"))}, "utf8").trim();`,
          `appendFileSync(${JSON.stringify(join(dir, "runs"))}, code + "\\n");`,
          'if (code === "new") process.exit(3);',
          `writeFileSync(${JSON.stringify(join(home, SWITCH_STARTED))}, "");`,
          "process.exit(0);",
        ].join("\n"),
      );
      const r = spawnSync(
        "/bin/sh",
        lockedShell(join(dir, "lock"), [process.execPath, script], { home, clone }),
        {
          encoding: "utf8",
        },
      );
      assert.equal(r.status, 0, r.stderr);
      assert.equal(readFileSync(join(dir, "runs"), "utf8"), "new\nold\n");
      assert.equal(gitIn(clone, "rev-parse", "HEAD"), old);
      const ledger = readFileSync(join(home, "ledger/service.jsonl"), "utf8")
        .trim()
        .split("\n")
        .map((l) => JSON.parse(l));
      assert.equal(ledger.length, 1);
      assert.equal(ledger[0].event, "self-update-rolled-back");
      assert.equal(ledger[0].from, fresh);
      assert.equal(ledger[0].to, old);
      assert.equal(ledger[0].exit, 3);
      assert.equal(spawnSync("test", ["-e", join(home, SWITCH_PREVIOUS)]).status, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test("ledgerNews: a refusal is written once per episode; every switch is written", () => {
  const refused = { event: "self-update-refused", reason: "local changes", main: "m1" };
  assert.equal(ledgerNews(undefined, refused), true);
  assert.equal(ledgerNews({ refused: "local changes", main: "m1" }, refused), false);
  assert.equal(ledgerNews({ refused: "local changes", main: "m0" }, refused), true);
  assert.equal(ledgerNews({ refused: "a job is running", main: "m1" }, refused), true);
  assert.equal(
    ledgerNews({ refused: "x", main: "m1" }, { event: "self-update", main: "m1" }),
    true,
  );
});

/** Writes `files` ({ path: text }) under `base`, making directories. */
const putFiles = (base, files) => {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(base, path)), { recursive: true });
    writeFileSync(join(base, path), text);
  }
};
/** A module that prints `word`. */
const say = (word) => `console.log(${JSON.stringify(word)});\n`;
/** A docker run argv's container name and image. */
const nameOf = (run) => run[run.indexOf("--name") + 1];
const imageOf = (run) => run.at(-4);

/**
 * A tested tree and a judge image tree on disk, and `run(args, files)`: node with the judge guard for them. The guard
 * is judgeGuard's own source, as the generated file is.
 */
function guardFixture() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "sv-guard-")));
  const tree = join(dir, "work");
  const root = join(dir, "judge");
  putFiles(tree, {
    "main.mjs": 'import "pkg";\nimport "./helper.mjs";\n' + say("tree main"),
    // the oxlint plugin's way in (H2): a main file importing a computed URL of a file the PR changed
    "plugin.mjs": 'await import(new URL("./changed.mjs", import.meta.url).href);\n',
    "helper.mjs": say("tree helper"),
    "changed.mjs": say("PR changed"),
    "pr.mjs": 'process.stdout.write("PR RAN\\n"); process.exit(0);\n',
    "equal.mjs": say("generated"),
    "main.cjs": 'require("cpkg");\n' + say("tree cjs"),
    "node_modules/pkg/package.json": '{"name":"pkg","type":"module","exports":"./index.mjs"}',
    "node_modules/pkg/index.mjs": 'process.stdout.write("TREE PKG\\n"); process.exit(0);\n',
    "node_modules/cpkg/package.json": '{"name":"cpkg","main":"index.js"}',
    "node_modules/cpkg/index.js": 'process.stdout.write("TREE CPKG\\n"); process.exit(0);\n',
    "vm.mjs": [
      'import vm from "node:vm";',
      'import { readFileSync } from "node:fs";',
      "const file = process.argv[2];",
      'vm.runInThisContext(readFileSync(file, "utf8"), { filename: file });',
      "",
    ].join("\n"),
    "resolve.cjs": 'console.log(require.resolve("cpkg"));\n',
    // a judge tool starting a child from process.execPath with NODE_OPTIONS stripped (turbo's strict env does that)
    "spawn.mjs": [
      'import { spawnSync } from "node:child_process";',
      'const child = spawnSync(process.execPath, [process.argv[2]], { encoding: "utf8", env: { PATH: process.env.PATH } });',
      "console.log(JSON.stringify({ status: child.status, stdout: child.stdout, guarded: /never runs/.test(child.stderr) }));",
      "",
    ].join("\n"),
    "eval.mjs":
      'try { eval("1"); console.log("eval ran"); } catch (error) { console.log(error.name); }\n',
    "argv.mjs":
      "console.log(process.argv[0] === process.execPath ? 'argv0 is execPath' : process.argv[0]);\n",
    // native addons (round 6, M2): the tree's never loads; the judge image's copy at that path does
    "native.cjs": [
      "const [how, file] = process.argv.slice(2);",
      "try {",
      '  if (how === "dlopen") process.dlopen({ exports: {} }, file);',
      "  else require(file);",
      '  console.log("LOADED");',
      "} catch (error) {",
      '  console.log(error.message.split("\\n")[0]);',
      "}",
      "",
    ].join("\n"),
    "node_modules/natpkg/addon.node": "not an addon",
    "node_modules/judged/addon.node": "not an addon either",
  });
  putFiles(root, {
    "main.mjs": "",
    "main.cjs": "",
    "resolve.cjs": "",
    "changed.mjs": say("main's changed"),
    "node_modules/judged/addon.node": "main's bytes, not an addon",
    "equal.mjs": say("generated"),
    "dist/built.mjs": say("main's build"),
    "node_modules/pkg/package.json": '{"name":"pkg","type":"module","exports":"./index.mjs"}',
    "node_modules/pkg/index.mjs": say("judge pkg"),
    "node_modules/cpkg/package.json": '{"name":"cpkg","main":"index.js"}',
    "node_modules/cpkg/index.js": say("judge cpkg"),
  });
  const mainList = join(dir, "main-paths");
  writeFileSync(
    mainList,
    [
      "main.mjs",
      "helper.mjs",
      "main.cjs",
      "vm.mjs",
      "resolve.cjs",
      "plugin.mjs",
      "spawn.mjs",
      "eval.mjs",
      "argv.mjs",
      "native.cjs",
    ]
      .map((p) => `${p}\0`)
      .join(""),
  );
  const guard = join(dir, "guard.mjs");
  // the guarded node, as judgeNodeSource writes it: the real node, the guard first, no code from strings
  const execPath = join(dir, "node");
  writeFileSync(
    execPath,
    `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} --import ${JSON.stringify(guard)} --disallow-code-generation-from-strings "$@"\n`,
  );
  chmodSync(execPath, 0o755);
  writeFileSync(
    guard,
    `(${judgeGuard.toString()})(${JSON.stringify({ tree, root, mainList, execPath })});\n`,
  );
  const run = (...args) =>
    spawnSync(process.execPath, ["--import", guard, ...args], { cwd: tree, encoding: "utf8" });
  return { dir, tree, root, run, execPath };
}

test("judge guard: a judge runs main's files only; the tree's own code never runs, main's copy or build runs instead", () => {
  const g = guardFixture();
  try {
    // main's files run; a bare import from them resolves in main's install (the judge image), never the tree's
    const main = g.run(join(g.tree, "main.mjs"));
    assert.equal(main.status, 0, main.stderr);
    assert.equal(main.stdout, "judge pkg\ntree helper\ntree main\n");
    const cjs = g.run(join(g.tree, "main.cjs"));
    assert.equal(cjs.stdout, "judge cpkg\ntree cjs\n", cjs.stderr);
    const resolved = g.run(join(g.tree, "resolve.cjs"));
    assert.equal(
      resolved.stdout.trim(),
      join(g.root, "node_modules/cpkg/index.js"),
      resolved.stderr,
    );
    // a file the PR changed runs as main's copy; a file only the judge image has (a build output) runs from there
    assert.equal(g.run(join(g.tree, "changed.mjs")).stdout, "main's changed\n");
    assert.equal(g.run(join(g.tree, "plugin.mjs")).stdout, "main's changed\n");
    assert.equal(g.run(join(g.tree, "dist/built.mjs")).stdout, "main's build\n");
    // a file whose bytes are the judge image's (main's generated files laid in) runs
    assert.equal(g.run(join(g.tree, "equal.mjs")).stdout, "generated\n");
    // the PR's own code never runs, through import, require or node:vm (jiti's way in)
    const pr = g.run(join(g.tree, "pr.mjs"));
    assert.notEqual(pr.status, 0);
    assert.doesNotMatch(pr.stdout, /PR RAN/);
    assert.match(pr.stderr, /a judge never runs the tested tree's pr\.mjs \(it is not main's\)/);
    const viaVm = g.run(join(g.tree, "vm.mjs"), join(g.tree, "pr.mjs"));
    assert.notEqual(viaVm.status, 0);
    assert.doesNotMatch(viaVm.stdout, /PR RAN/);
    assert.match(viaVm.stderr, /never runs the tested tree's pr\.mjs/);
    const viaRequire = spawnSync(
      process.execPath,
      [
        "--import",
        join(g.dir, "guard.mjs"),
        "-e",
        `require(${JSON.stringify(join(g.tree, "node_modules/cpkg/index.js"))})`,
      ],
      { cwd: g.tree, encoding: "utf8" },
    );
    // the tree's copy of a package is main's when main's install has the same file at the same place
    assert.equal(viaRequire.stdout, "judge cpkg\n", viaRequire.stderr);
    // a child started from process.execPath with NODE_OPTIONS stripped is still guarded: execPath is the guarded node
    const spawned = g.run(join(g.tree, "spawn.mjs"), join(g.tree, "pr.mjs"));
    assert.equal(spawned.status, 0, spawned.stderr);
    const child = JSON.parse(spawned.stdout);
    assert.notEqual(child.status, 0);
    assert.doesNotMatch(child.stdout, /PR RAN/);
    assert.equal(child.guarded, true);
    // through the guarded node, code generation from strings is refused
    const viaNode = spawnSync(g.execPath, [join(g.tree, "eval.mjs")], {
      cwd: g.tree,
      encoding: "utf8",
    });
    assert.equal(viaNode.stdout, "EvalError\n", viaNode.stderr);
    // argv[0] is the guarded node too (round 6, L1)
    assert.equal(g.run(join(g.tree, "argv.mjs")).stdout, "argv0 is execPath\n");
    // the tree's native addon never loads, by dlopen or require; one the judge image has loads from there (M2)
    for (const how of ["dlopen", "require"]) {
      const addon = join(g.tree, "node_modules/natpkg/addon.node");
      const refused = g.run(join(g.tree, "native.cjs"), how, addon);
      assert.match(
        refused.stdout,
        /never loads the tested tree's addon node_modules\/natpkg\/addon\.node/,
        how,
      );
      const judged = g.run(
        join(g.tree, "native.cjs"),
        how,
        join(g.tree, "node_modules/judged/addon.node"),
      );
      assert.ok(
        judged.stdout.includes(join(g.root, "node_modules/judged/addon.node")),
        `${how}: ${judged.stdout}`,
      );
      assert.doesNotMatch(judged.stdout, /LOADED|never loads/, how);
    }
    // a guard for another tree applies too, even after the judge's own loaded (round 6, M1: validate's self-tests)
    const other = join(g.dir, "other");
    putFiles(other, { "pr.mjs": 'process.stdout.write("OTHER PR RAN\\n");\n' });
    const otherList = join(g.dir, "other-paths");
    writeFileSync(otherList, "");
    const otherGuard = join(g.dir, "other-guard.mjs");
    const otherConfig = { tree: other, root: join(g.dir, "nowhere"), mainList: otherList };
    writeFileSync(otherGuard, `(${judgeGuard.toString()})(${JSON.stringify(otherConfig)});\n`);
    const nested = spawnSync(
      process.execPath,
      ["--import", join(g.dir, "guard.mjs"), "--import", otherGuard, join(other, "pr.mjs")],
      { cwd: other, encoding: "utf8" },
    );
    assert.notEqual(nested.status, 0);
    assert.doesNotMatch(nested.stdout, /OTHER PR RAN/);
    assert.match(nested.stderr, /never runs the tested tree's pr\.mjs/);
    // once loaded, the guard stays: a second import does not reset it
    assert.match(judgeGuardSource(), /^\/\/ Generated by tools\/scripts\/stackra-verify\.mjs/);
    assert.match(
      judgeGuardSource(),
      /"tree":"\/work","root":"\/judge","mainList":"\/in\/main-paths"/,
    );
  } finally {
    rmSync(g.dir, { recursive: true, force: true });
  }
});

test("judge container setup: guarded node first on PATH, the guard and the eval ban in NODE_OPTIONS, turbo without a cache", () => {
  const wrapper = judgeNodeSource();
  assert.match(wrapper, /exec "\$node" --import \/in\/judge-guard\.mjs \$flags "\$@"/);
  assert.match(wrapper, /^flags=--disallow-code-generation-from-strings$/m);
  // the judge image's real node first; never the wrapper itself where it is mounted over the image's node
  assert.match(wrapper, new RegExp(`for node in ${JUDGE_NODE} ${IMAGE_NODE} /usr/bin/node; do`));
  assert.match(wrapper, /\[ ! "\$node" -ef "\$0" \]/);
  assert.match(judgeGuardSource(), /"execPath":"\/in\/bin\/node"/);
  const env = Object.fromEntries(
    judgeEnv()
      .trim()
      .split("\n")
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
  assert.deepEqual(env.PATH.split(":").slice(0, 2), ["/in/bin", "/judge/node_modules/.bin"]);
  assert.equal(
    env.NODE_OPTIONS,
    "--import /in/judge-guard.mjs --disallow-code-generation-from-strings",
  );
  assert.equal(env.TURBO_CACHE, "local:,remote:");
  assert.equal(env.STACKRA_JUDGE_EVAL, undefined);
  const evalEnv = judgeEnv("/in", { evalAllowed: true });
  assert.match(evalEnv, /^NODE_OPTIONS=--import \/in\/judge-guard\.mjs$/m);
  assert.match(evalEnv, /^STACKRA_JUDGE_EVAL=1$/m);
  // the one step that may build code from strings, with its reason
  assert.deepEqual(
    [...GATE_STEPS, ...MOBILE_STEPS].filter((step) => step.evalAllowed).map((step) => step.id),
    ["linear-key-check"],
  );
  assert.match(GATE_STEPS.find((step) => step.evalAllowed).evalAllowed, /ajv/);
  assert.equal(JUDGE_MOUNT, "/judge");
  assert.match(JUDGE_GEN, /^node \/judge\/packages\/developer\/cli\/dist\/stackra\.mjs gen$/m);
  for (const m of JUDGE_GEN.matchAll(/\S*stackra\.mjs/g))
    assert.equal(m[0], "/judge/packages/developer/cli/dist/stackra.mjs");
});

/** The judging steps and the PR steps, as Idris's ruling (B) names them. */
const JUDGING = [
  "licence-policy",
  "dependency-scan",
  "workflow-lint",
  "linear-key-check",
  "format-check",
  "lint",
  "migration-lint",
  "validate",
  "env-names",
  "boundaries",
  "knip",
  "secrets-scan",
];
const PR_STEPS = ["typecheck", "build", "service-gen", "manifests-match-gen", "test"];

test("B: every gate step is a judge or a PR step, as ruled; judges never start from a PR step's image", () => {
  assert.deepEqual(
    GATE_STEPS.filter((s) => s.judge).map((s) => s.id),
    JUDGING,
  );
  assert.deepEqual(
    GATE_STEPS.filter((s) => !s.judge).map((s) => s.id),
    PR_STEPS,
  );
  // review of the box 1 proofs (field mutant): the image each step starts from, exactly
  assert.deepEqual(
    GATE_STEPS.map((s) => [s.id, s.from]),
    [
      ["licence-policy", undefined],
      ["dependency-scan", undefined],
      ["workflow-lint", undefined],
      ["linear-key-check", undefined],
      ["format-check", undefined],
      ["lint", undefined],
      ["typecheck", "base"],
      ["build", "base"],
      ["service-gen", "built"],
      ["manifests-match-gen", "built"],
      ["migration-lint", undefined],
      ["validate", undefined],
      ["env-names", undefined],
      ["boundaries", undefined],
      ["knip", undefined],
      ["secrets-scan", undefined],
      ["test", "built"],
    ],
  );
  for (const step of GATE_STEPS) {
    // a judge starts from a view; a PR step names the image it starts from, and only the build's is kept
    if (step.judge) assert.equal(step.from, undefined, step.id);
    else assert.ok(["base", "built"].includes(step.from), step.id);
    if (step.commit) assert.equal(step.id, "build");
  }
  // the built image is made by build, which runs before every step that starts from it
  const order = GATE_STEPS.map((s) => s.id);
  for (const step of GATE_STEPS.filter((s) => s.from === "built"))
    assert.ok(order.indexOf(step.id) > order.indexOf("build"), step.id);
  // no judge reads what a PR step wrote: nothing is collected from a PR step or handed to a judge (5b)
  for (const step of GATE_STEPS) {
    assert.equal(step.collect, undefined, step.id);
    assert.equal(step.input, undefined, step.id);
  }
  assert.deepEqual(
    MOBILE_STEPS.map((s) => [s.id, Boolean(s.judge), s.from]),
    [
      ["licence-policy", true, undefined],
      ["mobile-apps", false, "base"],
    ],
  );
});

test("B runJob: install, its rebuild, prepare, the views, then one container per step in ci.yml's order", async () => {
  const { deps, calls } = fakeDeps({ facts: async () => true });
  const r = await runJob({ ...JOB, kind: "gate" }, deps);
  assert.equal(r.conclusion, "success");
  const [install, rebuild, base, view, shared, pr, ...steps] = calls.runs;
  assert.match(nameOf(install), /-install$/);
  const id = nameOf(base).slice("sv-".length, -"-base".length);
  const run = `stackra-verify-run:${id}`;
  // the rebuild starts from the committed scripts-off install (round 7, M2)
  assert.equal(imageOf(rebuild), `${run}-installed`);
  assert.equal(imageOf(base), run);
  assert.equal(base.at(-1), "bash /in/prepare.sh");
  // main's view: the store image (no install ever ran in it), prepared, main's node_modules (round 7, R6-H1 c)
  assert.equal(imageOf(view), "stackra-verify-store:abc");
  assert.equal(view.at(-1), "bash /in/prepare.sh && bash /in/judge-view.sh main");
  const judgeMount = "type=image,source=stackra-verify-judge:abc,target=/judge,image-subpath=judge";
  assert.ok(view.includes(judgeMount));
  assert.equal(imageOf(shared), `${run}-view`);
  assert.equal(shared.at(-1), "bash /in/gate.sh --swap");
  // knip's view: the PR's install before any build script ran (round 8, L1), prepared and checked again, with main's
  // copies, bins and config modules
  assert.equal(imageOf(pr), `${run}-installed`);
  assert.equal(
    pr.at(-1),
    "bash /in/prepare.sh && bash /in/judge-view.sh pr && bash /in/gate.sh --swap",
  );
  assert.ok(pr.includes(judgeMount));
  assert.deepEqual(
    calls.docker
      .filter((a) => a[0] === "commit")
      .map((a) => [a[1].replace(`sv-${id}-`, ""), a[2].replace(run, "<run>")]),
    [
      ["install", "<run>-installed"],
      ["rebuild", "<run>"],
      ["base", "<run>-base"],
      ["view", "<run>-view"],
      ["shared", "<run>-shared"],
      ["pr", "<run>-pr"],
      ["step-build", "<run>-built"],
    ],
  );
  assert.deepEqual(
    steps.map((step) => step.at(-1).replace("bash /in/gate.sh --step ", "")),
    GATE_STEPS.map((s) => s.id),
  );
  const expectedView = { installed: "installed", view: "view", shared: "shared", pr: "pr" };
  for (const [i, step] of GATE_STEPS.entries()) {
    const argv = steps[i];
    const env = argv[argv.indexOf("--env-file") + 1];
    const mounted = argv.includes(judgeMount);
    const work = argv.find((a) => a.startsWith("type=volume,"));
    if (step.judge) {
      // fresh from its view, read-only, /work noexec, guarded (the only node), with main's judge image
      assert.ok(argv.includes("--read-only"), step.id);
      assert.equal(env, step.evalAllowed ? "/runs/x/judge-eval.env" : "/runs/x/judge.env", step.id);
      assert.match(
        work,
        /^type=volume,source=sv-[\w-]+-work-[0-3],target=\/work,volume-subpath=work$/,
        step.id,
      );
      assert.ok(argv.includes(`/runs/x/bin/node:${IMAGE_NODE}:ro`), step.id);
      assert.ok(mounted, step.id);
      assert.equal(imageOf(argv), `${run}-${expectedView[viewOf(step)]}`, step.id);
    } else {
      assert.equal(argv.includes("--read-only"), false, step.id);
      assert.equal(env, ENV, step.id);
      assert.equal(work, undefined, step.id);
      assert.equal(argv.includes(`/runs/x/bin/node:${IMAGE_NODE}:ro`), false, step.id);
      assert.equal(mounted, step.id === "manifests-match-gen", step.id);
      assert.equal(imageOf(argv), `${run}-${step.from}`, step.id);
    }
    assert.equal(argv[argv.indexOf("--network") + 1], "none", step.id);
  }
  // which judge sees which node_modules: licence-policy the install before any build script, knip the checked PR
  // install, every other judge main's (round 7)
  assert.deepEqual(
    GATE_STEPS.filter((step) => step.judge).map((step) => [step.id, viewOf(step)]),
    [
      ["licence-policy", "installed"],
      ["dependency-scan", "view"],
      ["workflow-lint", "view"],
      ["linear-key-check", "view"],
      ["format-check", "shared"],
      ["lint", "view"],
      ["migration-lint", "view"],
      ["validate", "view"],
      ["env-names", "view"],
      ["boundaries", "view"],
      ["knip", "pr"],
      ["secrets-scan", "view"],
    ],
  );
  // one noexec /work volume per view image, in the order first used
  assert.deepEqual(calls.volumes, [
    [`${run}-installed`, `sv-${id}-work-0`],
    [`${run}-view`, `sv-${id}-work-1`],
    [`${run}-shared`, `sv-${id}-work-2`],
    [`${run}-pr`, `sv-${id}-work-3`],
  ]);
});

test("B runJob: a failing step fails the run and every later step still runs; a step that never started is an error", async () => {
  const { deps, calls } = fakeDeps({ exits: { install: 0, verify: 0, lint: 1, build: 2 } });
  const r = await runJob(JOB, deps);
  assert.equal(r.conclusion, "failure");
  assert.equal(r.phase, "verify");
  assert.equal(calls.runs.filter((run) => / --step /.test(run.at(-1))).length, GATE_STEPS.length);
  // a failed build is still kept: the steps after it start from what it left, as in one job
  assert.ok(calls.docker.some((a) => a[0] === "commit" && a[2].endsWith("-built")));
  const unstarted = await runJob(
    JOB,
    fakeDeps({ exits: { install: 0, verify: 0, knip: null } }).deps,
  );
  assert.deepEqual([unstarted.post, unstarted.error], [false, "the knip container did not start"]);
  // the service's own containers must succeed: a failed prepare is an error, never the PR's result
  const prep = await runJob(JOB, fakeDeps({ exits: { install: 0, verify: 0, base: 1 } }).deps);
  assert.deepEqual([prep.post, prep.error], [false, "the base container failed (1)"]);
  // no judge image (the mobile kind): no view container, judges start from the prepared tree, unmounted
  const mobile = fakeDeps({});
  await runJob({ ...JOB, kind: "mobile" }, mobile.deps);
  const licence = mobile.calls.runs.find((run) => run.at(-1).endsWith(" --step licence-policy"));
  assert.ok(licence.includes("--read-only"));
  assert.equal(
    licence.some((a) => a.startsWith("type=image,")),
    false,
  );
  assert.ok(
    licence.some(
      (a) => a.startsWith("type=volume,") && a.endsWith(",target=/work,volume-subpath=work"),
    ),
  );
  assert.equal(licence.includes(`/runs/x/bin/node:${IMAGE_NODE}:ro`), false);
  // a view whose layers cannot be mounted noexec is a service error, never a judge without noexec
  const flat = fakeDeps({});
  flat.deps.workVolume = async () => {
    throw new Error(
      "the view image's layers are not overlay2 directories (overlayfs): /work cannot be mounted noexec",
    );
  };
  const refused = await runJob(JOB, flat.deps);
  assert.equal(refused.post, false);
  assert.match(refused.error, /cannot be mounted noexec/);
  assert.equal(
    flat.calls.runs.some((run) => / --step /.test(run.at(-1))),
    false,
  );
  assert.match(licence.at(-4), /-installed$/);
});

test("B judge image: main's tree, installed offline as the gate installs, the judges built, main's gen; tag from main's tree", () => {
  const dockerfile = judgeDockerfile({
    storeImage: "stackra-verify-store:abc",
    builds: ["esbuild", "uniwind-pro"],
    roots: ["packages/developer/cli", "packages/tooling/oxlint"],
  });
  const lines = dockerfile.trim().split("\n");
  assert.equal(lines[0], "FROM stackra-verify-store:abc");
  assert.ok(lines.includes("ADD tree.tar /judge/"));
  assert.ok(
    lines.includes(
      'RUN mkdir -p /judge/.stackra-node && cp "$(readlink -f "$(command -v node)")" /judge/.stackra-node/node && chown -R 1000:1000 /judge',
    ),
  );
  assert.equal(JUDGE_NODE, "/judge/.stackra-node/node");
  assert.match(
    dockerfile,
    /pnpm install --frozen-lockfile --store-dir \/store --ignore-scripts --ignore-pnpmfile --offline --filter='!@figentra\/mobile' --filter='!@figentra\/playground' && pnpm rebuild --ignore-pnpmfile --filter='!@figentra\/mobile' --filter='!@figentra\/playground' esbuild\n/,
  );
  assert.doesNotMatch(dockerfile, /uniwind-pro|prebuilt/);
  assert.match(
    dockerfile,
    /turbo run build --filter='\.\/packages\/developer\/cli\.\.\.' --filter='\.\/packages\/tooling\/oxlint\.\.\.'/,
  );
  assert.match(
    dockerfile,
    /RUN node packages\/developer\/cli\/dist\/stackra\.mjs gen && pnpm exec turbo run gen /,
  );
  assert.equal(lines.at(-1).startsWith("RUN "), true);
  assert.throws(
    () => judgeDockerfile({ storeImage: "s", builds: [], roots: ["../x"] }),
    /not a judge member/,
  );
  assert.throws(
    () => judgeDockerfile({ storeImage: "s", builds: [], roots: ["a b"] }),
    /not a judge member/,
  );
  const tag = judgeTag("t".repeat(40), "sha256:1", dockerfile);
  assert.match(tag, /^stackra-verify-judge:[0-9a-f]{16}$/);
  assert.equal(judgeTag("t".repeat(40), "sha256:1", dockerfile), tag);
  for (const other of [
    judgeTag("u".repeat(40), "sha256:1", dockerfile),
    judgeTag("t".repeat(40), "sha256:2", dockerfile),
    judgeTag("t".repeat(40), "sha256:1", `${dockerfile}#`),
  ])
    assert.notEqual(other, tag);
  // the clean-up keeps the recorded judge image
  assert.deepEqual(keepIdsFrom({ judges: { [tag]: { id: "sha256:j" } } }, "sha256:b"), [
    "sha256:j",
    "sha256:b",
  ]);
  // a judging container: read-only root, the judge image read-only at /judge
  const argv = stepArgs(S, {
    name: "n",
    image: "i",
    envFile: ENV,
    tarPath: TAR,
    command: "bash /in/gate.sh --step lint",
    readOnly: true,
    judgeImage: tag,
  });
  assert.ok(argv.includes("--read-only"));
  assert.ok(argv.includes(`type=image,source=${tag},target=/judge,image-subpath=judge`));
  assert.equal(argv[argv.indexOf("--network") + 1], "none");
  assert.deepEqual(argv.slice(-4), ["i", "sh", "-c", "bash /in/gate.sh --step lint"]);
  const guarded = stepArgs(S, {
    name: "n",
    image: "i",
    envFile: ENV,
    tarPath: TAR,
    command: "true",
    readOnly: true,
    workVolume: "sv-x-work-0",
    guardedNode: "/runs/x/bin/node",
  });
  assert.ok(guarded.includes("type=volume,source=sv-x-work-0,target=/work,volume-subpath=work"));
  // no `readonly` on the volume: a read-only remount could drop noexec; the overlay itself is read-only
  assert.equal(
    guarded.some((a) => a.startsWith("type=volume,") && a.includes("readonly")),
    false,
  );
  assert.ok(guarded.includes("/runs/x/bin/node:/usr/local/bin/node:ro"));
});

test("B noexec /work: the view's layers as a read-only overlay mounted noexec, nosuid, nodev; anything else refused", () => {
  const layers = {
    Name: "overlay2",
    Data: {
      UpperDir: "/d/overlay2/top/diff",
      LowerDir: "/d/overlay2/b/diff:/d/overlay2/c/diff",
      MergedDir: "/d/overlay2/top/merged",
      WorkDir: "/d/overlay2/top/work",
    },
  };
  assert.deepEqual(noexecVolumeArgs("sv-x-work-0", layers), [
    "volume",
    "create",
    "--driver",
    "local",
    "--opt",
    "type=overlay",
    "--opt",
    "device=overlay",
    "--opt",
    "o=lowerdir=/d/overlay2/top/diff:/d/overlay2/b/diff:/d/overlay2/c/diff,ro,noexec,nosuid,nodev",
    "sv-x-work-0",
  ]);
  for (const [driver, why] of [
    [{ Name: "overlayfs", Data: null }, /not overlay2 directories \(overlayfs\)/],
    [null, /not overlay2 directories \(none\)/],
    [{ Name: "overlay2", Data: { UpperDir: "/d/top/diff" } }, /has 1 layers/],
    [
      { Name: "overlay2", Data: { UpperDir: "/d/a,b/diff", LowerDir: "/d/c" } },
      /not a layer directory/,
    ],
    [
      { Name: "overlay2", Data: { UpperDir: "/d/../etc", LowerDir: "/d/c" } },
      /not a layer directory/,
    ],
    [
      { Name: "overlay2", Data: { UpperDir: `/${"x".repeat(4000)}`, LowerDir: "/d/c" } },
      /layers: \/work/,
    ],
  ])
    assert.throws(() => noexecVolumeArgs("v", driver), why);
});

test(
  "B judge view: main's generated files added where the tree has the member, never over a tree file; every .bin is main's",
  needsBash,
  () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), "sv-view-")));
    const root = join(dir, "judge");
    const tree = join(dir, "work");
    putFiles(root, {
      "packages/a/.stackra/vitest.config.mts": "main gen a\n",
      "packages/a/.stackra/migrations/0001.up.sql": "create table main ();\n",
      "packages/a/.stackra/app-manifest.json": "main manifest\n",
      "packages/gone/.stackra/vitest.config.mts": "main gen gone\n",
      "packages/developer/gen/__golden__/x/.stackra/y.golden": "golden\n",
      "node_modules/.bin/knip": "main knip\n",
      "packages/a/node_modules/.bin/oxlint": "main oxlint\n",
    });
    putFiles(tree, {
      "packages/a/src/index.ts": "export {};\n",
      "packages/a/.stackra/app-manifest.json": "PR manifest\n",
      "packages/new/package.json": "{}\n",
      "packages/developer/gen/__golden__/x/.stackra/keep": "tree\n",
      "node_modules/.bin/knip": "PR knip\n",
      "packages/a/node_modules/.bin/oxlint": "PR oxlint\n",
      "packages/new/node_modules/.bin/tsc": "PR tsc\n",
    });
    // the knip (pr) view: every member with a node_modules is a lockfile importer; no dependency is locked here
    const inDir = join(dir, "in");
    putFiles(inDir, { importers: ".\npackages/a\npackages/new\n", "node-modules.tsv": "" });
    const view = (...mode) =>
      spawnSync(BASH, ["-c", judgeViewScript(root, tree, inDir), "judge-view.sh", ...mode], {
        encoding: "utf8",
      });
    // a mode is required
    const usage = view();
    assert.equal(usage.status, 2, usage.stdout);
    assert.match(usage.stdout, /usage: judge-view\.sh main\|pr/);
    const r = view("pr");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const read = (p) => readFileSync(join(tree, p), "utf8");
    assert.equal(read("packages/a/.stackra/vitest.config.mts"), "main gen a\n");
    // never main's compiled migrations: migration-lint reads only the SQL the tree itself has
    assert.equal(existsSync(join(tree, "packages/a/.stackra/migrations")), false);
    assert.equal(read("packages/a/.stackra/app-manifest.json"), "PR manifest\n");
    assert.equal(existsSync(join(tree, "packages/gone")), false);
    assert.equal(
      existsSync(join(tree, "packages/developer/gen/__golden__/x/.stackra/y.golden")),
      false,
    );
    assert.equal(read("node_modules/.bin/knip"), "main knip\n");
    assert.equal(read("packages/a/node_modules/.bin/oxlint"), "main oxlint\n");
    assert.equal(existsSync(join(tree, "packages/new/node_modules/.bin")), false);
    rmSync(dir, { recursive: true, force: true });
  },
);

test("header: the step audit covers every gate step, names the one eval exception, and the swap waits for STA-2788", () => {
  const header = readFileSync(join(CODE_DIR, SELF_PATH), "utf8").split("\n*/")[0];
  const audit = header.slice(
    header.indexOf(" * Step audit (C1"),
    header.indexOf(" * Threat model"),
  );
  const rows = [...audit.matchAll(/^ \*   ([a-z][\w, -]*?)\s+\|/gm)]
    .flatMap((m) => m[1].split(",").map((id) => id.trim()))
    .filter((id) => id !== "step");
  assert.deepEqual(rows.toSorted(), GATE_STEPS.map((s) => s.id).toSorted());
  assert.match(audit, /^ \*   linear-key-check .*\| judge, eval allowed$/m);
  assert.match(audit, /ajv, which compiles each schema with `new Function`/);
  const goLive = header.slice(header.indexOf("Go-live, before the ruleset swap"));
  assert.match(goLive, /STA-2781/);
  assert.match(goLive, /The ruleset swap also waits until STA-2788 has merged/);
});

/** Any bash will do for the view and prepare scripts (no bash 4 feature); the gate script needs BASH (4 or later). */
const ANY_BASH = BASH ?? "/bin/bash";

test("round 6 H2: a prepare that finds planted files is the PR's tree failure, naming them; no step runs", async () => {
  const { deps, calls } = fakeDeps({ exits: { install: 0, verify: 0, base: PLANTED_EXIT } });
  deps.readLog = () => `noise\n${PLANTED_LINE}knip.json\n${PLANTED_LINE}.squawk.toml\n`;
  const r = await runJob(JOB, deps);
  assert.equal(r.post, true);
  assert.equal(r.conclusion, "failure");
  assert.equal(r.phase, "tree");
  assert.equal(
    r.reason,
    "the install wrote files the tested tree does not have: knip.json, .squawk.toml",
  );
  assert.equal(
    calls.runs.some((run) => / --step /.test(run.at(-1))),
    false,
  );
});

/** A lockfile with one package `key` resolved as `resolution`. */
const oneResolution = (resolution, key = "esbuild@0.25.0") =>
  `lockfileVersion: '9.0'\n\nimporters:\n\n  .: {}\n\npackages:\n\n  ${key}:\n    resolution: ${resolution}\n\nsnapshots:\n\n  ${key}: {}\n`;

test("round 6 H2: every lockfile resolution is a registry package under its own name; anything else is refused", () => {
  const sri = "sha512-YWJj";
  for (const ok of [
    `{integrity: ${sri}}`,
    `{integrity: ${sri}, tarball: https://registry.npmjs.org/esbuild/-/esbuild-0.25.0.tgz}`,
    `{integrity: ${sri}, tarball: https://npm.stackra.figentra.com/esbuild/-/esbuild-0.25.0.tgz}`,
  ])
    assert.deepEqual(lockfileResolutionProblems(oneResolution(ok)), [], ok);
  assert.deepEqual(
    lockfileResolutionProblems(
      oneResolution(
        `{integrity: ${sri}, tarball: https://registry.npmjs.org/@s/x/-/x-1.0.0.tgz}`,
        "'@s/x@1.0.0'",
      ),
    ),
    [],
  );
  for (const [bad, why] of [
    // another package's tarball on an allowed registry: what an allowed build would run is the PR's choice
    [
      `{integrity: ${sri}, tarball: https://registry.npmjs.org/evil/-/evil-1.0.0.tgz}`,
      /not esbuild@0\.25\.0 on a package registry/,
    ],
    [
      `{integrity: ${sri}, tarball: https://evil.example/esbuild/-/esbuild-0.25.0.tgz}`,
      /not esbuild@0\.25\.0 on a package registry/,
    ],
    [
      `{integrity: ${sri}, tarball: http://registry.npmjs.org/esbuild/-/esbuild-0.25.0.tgz}`,
      /not esbuild@0\.25\.0/,
    ],
    ["{directory: packages/evil, type: directory}", /not a registry package \(directory, type\)/],
    ["{type: git, repo: https://github.com/x/y, commit: abc}", /not a registry package/],
    [
      `{tarball: https://registry.npmjs.org/esbuild/-/esbuild-0.25.0.tgz}`,
      /not a registry package/,
    ],
    ["", /is not an \{integrity: …\} entry/],
  ])
    assert.match(lockfileResolutionProblems(oneResolution(bad)).join(), why, bad);
  // main's own lockfile has no such resolution
  assert.deepEqual(
    lockfileResolutionProblems(readFileSync(join(CODE_DIR, "pnpm-lock.yaml"), "utf8")),
    [],
  );
});

test("round 6 H2: buildTree refuses a lockfile that installs a tarball the PR chose", () => {
  const repo = treeRepo();
  try {
    const sha = repo.pr({
      "pnpm-lock.yaml":
        "lockfileVersion: '9.0'\n\nimporters:\n\n  .: {}\n\n  packages/a: {}\n\n  packages/b: {}\n\npackages:\n\n  esbuild@0.25.0:\n    resolution: {integrity: sha512-YWJj, tarball: https://registry.npmjs.org/evil/-/evil-1.0.0.tgz}\n\nsnapshots:\n\n  esbuild@0.25.0: {}\n",
    });
    assert.throws(
      () => repo.build(sha),
      (error) =>
        error.refused === true &&
        error.message.includes("esbuild@0.25.0's resolution is a tarball"),
    );
  } finally {
    rmSync(repo.dir, { recursive: true, force: true });
  }
});

/** A symlink at `from` under `base`, to `to`. */
const linkAt = (base, from, to) => {
  mkdirSync(dirname(join(base, from)), { recursive: true });
  symlinkSync(to, join(base, from));
};

test("round 6 H1: the guarded turbo is main's and never infers a local turbo", () => {
  assert.match(
    judgeTurboSource(),
    /^exec \/judge\/node_modules\/\.bin\/turbo --skip-infer "\$@"$/m,
  );
  assert.ok(Object.keys(kindFiles("gate")).includes("bin/turbo"));
});

test("round 6 H3: migration sources with nothing compiled fail migration-lint while STA-2788 is pending; off, ci.yml's pass", () => {
  assert.equal(MIGRATION_LINT_REQUIRES_COMPILED, true);
  const step = GATE_STEPS.find((s) => s.id === "migration-lint");
  assert.equal(step.run, migrationLintRun(true));
  assert.deepEqual(step.ciReplace, migrationLintCiReplace(true));
  assert.ok(migrationLintRun(true).includes(MIGRATION_PENDING));
  assert.equal(migrationLintRun(false).includes("STA-2788"), false);
  assert.equal(migrationLintCiReplace(false).length, 1);
  // the check itself (POSIX sh), in a tree with sources and none compiled, and in one with only fixtures
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "sv-pending-")));
  try {
    const check = (files) => {
      rmSync(join(dir, "t"), { recursive: true, force: true });
      putFiles(join(dir, "t"), files);
      return spawnSync(
        "sh",
        [
          "-c",
          `cd "${join(dir, "t")}"; check() {\n${MIGRATION_PENDING}\n}; check; echo nothing-pending`,
        ],
        {
          encoding: "utf8",
        },
      );
    };
    const pending = check({
      "services/a/src/node/database/migrations/0001-a.migration.ts": "x",
      "services/a/src/node/database/migrations/0002-b.migration.ts": "x",
    });
    assert.equal(pending.status, 1);
    assert.match(
      pending.stdout,
      /^::error title=STA-2788 pending::2 migration sources not linted/m,
    );
    const fixtures = check({
      "packages/developer/gen/__golden__/x/a.migration.ts": "x",
      "packages/a/__tests__/b.migration.ts": "x",
      "node_modules/@s/x/src/c.migration.ts": "x",
    });
    assert.equal(fixtures.status, 0, fixtures.stdout);
    assert.match(fixtures.stdout, /nothing-pending/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("round 6 L3: the gate never runs its judges without the judge image; mobile's licence judge does", async () => {
  const { deps, calls } = fakeDeps({});
  delete deps.judgeImage;
  const r = await runJob(JOB, deps);
  assert.deepEqual(
    [r.post, r.error],
    [false, "no judge image: the gate's judges never run with the tree's tools"],
  );
  assert.equal(
    calls.runs.some((run) => / --step /.test(run.at(-1))),
    false,
  );
  const mobile = fakeDeps({});
  delete mobile.deps.judgeImage;
  assert.equal((await runJob({ ...JOB, kind: "mobile" }, mobile.deps)).conclusion, "success");
});

test("round 6 L4: the judge image builds main's computed judge members; a lockfile without them is refused", () => {
  const lockText = readFileSync(join(CODE_DIR, "pnpm-lock.yaml"), "utf8");
  const roots = judgeBuildRoots(lockText);
  for (const root of JUDGE_ROOTS) assert.ok(roots.includes(root), root);
  assert.ok(roots.length > JUDGE_ROOTS.length);
  assert.throws(() => judgeBuildRoots("lockfileVersion: '9.0'\n"), /names no importer/);
  assert.throws(
    () => judgeBuildRoots("lockfileVersion: '9.0'\n\nimporters:\n\n  .: {}\n"),
    /has no importer packages\/developer\/cli/,
  );
});

/**
 * A tested tree and an install on disk, as prepare and the judge views see them (round 7): `tree` files go into
 * src.tar (no ./ prefix, as git archive writes); `install(work)` lays down what pnpm writes for the lockfile plan:
 * root deps turbo (registry) and @stackra/a (workspace), packages/a's zod (registry).
 */
function installFixture() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "sv-install-")));
  const tree = join(dir, "tree");
  putFiles(tree, {
    "knip.jsonc": "{}\n",
    "package.json": "{}\n",
    "packages/a/package.json": "{}\n",
    "packages/a/src/x.ts": "export {};\n",
  });
  const tar = join(dir, "src.tar");
  assert.equal(
    spawnSync("tar", ["-cf", tar, "-C", tree, "knip.jsonc", "package.json", "packages"]).status,
    0,
  );
  writeFileSync(join(dir, "importers"), ".\npackages/a\n");
  writeFileSync(
    join(dir, "node-modules.tsv"),
    nodeModulesPlan(
      {
        ".": { devDependencies: { turbo: "2.11.9", "@stackra/a": "link:packages/a" } },
        "packages/a": { dependencies: { zod: "4.0.0", zod3: "zod@3.25.0" } },
      },
      { specifiers: { "packages/a": { dependencies: { zod3: "npm:zod@3.25.0" } } } },
    )
      .entries.map((line) => `${line}\n`)
      .join(""),
  );
  const install = (work) => {
    putFiles(work, {
      "node_modules/.pnpm/turbo@2.11.9/node_modules/turbo/package.json": '{"where":"PR"}',
      "node_modules/.pnpm/zod@4.0.0/node_modules/zod/package.json": '{"where":"PR"}',
      "node_modules/.pnpm/zod@3.25.0/node_modules/zod/package.json": '{"where":"PR"}',
      "node_modules/.pnpm/@turbo+darwin-64@2.11.9/node_modules/@turbo/darwin-64/package.json": "{}",
      "node_modules/.modules.yaml": "x\n",
      "node_modules/.bin/turbo": "#!/bin/sh\n",
      "packages/a/node_modules/.bin/tsc": "#!/bin/sh\n",
    });
    linkAt(
      work,
      "node_modules/turbo",
      join(work, "node_modules/.pnpm/turbo@2.11.9/node_modules/turbo"),
    );
    linkAt(work, "node_modules/@stackra/a", join(work, "packages/a"));
    linkAt(
      work,
      "packages/a/node_modules/zod",
      join(work, "node_modules/.pnpm/zod@4.0.0/node_modules/zod"),
    );
    // an npm: alias (typescript6 on main): the link carries the alias, the store directory the package's own name
    linkAt(
      work,
      "packages/a/node_modules/zod3",
      join(work, "node_modules/.pnpm/zod@3.25.0/node_modules/zod"),
    );
  };
  /** A fresh work directory: the tree unpacked over `setup(work)`; then prepare's check in it (bash). */
  const prepare = (setup) => {
    const work = join(dir, "work");
    rmSync(work, { recursive: true, force: true });
    mkdirSync(work, { recursive: true });
    setup(work);
    assert.equal(spawnSync("tar", ["-xf", tar, "-C", work]).status, 0);
    const r = spawnSync(
      ANY_BASH,
      ["-c", `set -eo pipefail; cd "${work}"; ${plantedCheck(dir)}; echo clean`],
      {
        encoding: "utf8",
      },
    );
    return {
      ...r,
      work,
      planted: r.stdout
        .split("\n")
        .filter((l) => l.startsWith(PLANTED_LINE))
        .map((l) => l.slice(PLANTED_LINE.length)),
    };
  };
  return { dir, tree, install, prepare };
}

test("round 7 R6-H1: prepare accepts exactly what pnpm writes for the lockfile, and refuses every other node_modules shape", () => {
  const f = installFixture();
  try {
    const clean = f.prepare(f.install);
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    assert.match(clean.stdout, /^clean$/m);
    // The reviewer's lab: node_modules swapped for a link to a stash inside a member's node_modules
    const stash = f.prepare((work) => {
      putFiles(work, { "packages/a/node_modules/.stash/.bin/knip": "#!/bin/sh\nexit 0\n" });
      linkAt(work, "node_modules", join(work, "packages/a/node_modules/.stash"));
    });
    assert.equal(stash.status, PLANTED_EXIT, stash.stdout);
    assert.deepEqual(stash.planted.toSorted(), [
      "node_modules (a node_modules that is not a directory)",
      "packages/a/node_modules/.stash (not an entry pnpm writes)",
    ]);
    for (const [why, setup, expected] of [
      [
        "outside a member",
        (w) => putFiles(w, { "packages/a/src/node_modules/x/index.js": "" }),
        "packages/a/src/node_modules (a node_modules outside every workspace member)",
      ],
      [
        "a link out of the store",
        (w) => {
          rmSync(join(w, "node_modules/turbo"));
          linkAt(w, "node_modules/turbo", "/usr/bin");
        },
        "node_modules/turbo (not a link to node_modules/.pnpm/<id>/node_modules/turbo)",
      ],
      [
        // round 8 (NIT): the reviewer's nested path, one directory too deep under .pnpm
        "a nested .pnpm path",
        (w) => {
          putFiles(w, { "node_modules/.pnpm/evil/node_modules/zod/node_modules/zod/index.js": "" });
          rmSync(join(w, "node_modules/turbo"));
          linkAt(
            w,
            "node_modules/turbo",
            join(w, "node_modules/.pnpm/evil/node_modules/zod/node_modules/turbo"),
          );
          putFiles(w, { "node_modules/.pnpm/evil/node_modules/zod/node_modules/turbo/x": "" });
        },
        "node_modules/turbo (not a link to node_modules/.pnpm/<id>/node_modules/turbo)",
      ],
      [
        "an alias linked to a store directory of its own name",
        (w) => {
          rmSync(join(w, "packages/a/node_modules/zod3"));
          putFiles(w, { "node_modules/.pnpm/zod3@1.0.0/node_modules/zod3/index.js": "" });
          linkAt(
            w,
            "packages/a/node_modules/zod3",
            join(w, "node_modules/.pnpm/zod3@1.0.0/node_modules/zod3"),
          );
        },
        "packages/a/node_modules/zod3 (not a link to node_modules/.pnpm/<id>/node_modules/zod)",
      ],
      [
        "a dependency the lockfile does not name",
        (w) =>
          linkAt(w, "node_modules/evil", join(w, "node_modules/.pnpm/zod@4.0.0/node_modules/zod")),
        "node_modules/evil (not a dependency the lockfile names)",
      ],
      [
        "a real directory",
        (w) => putFiles(w, { "node_modules/real/index.js": "" }),
        "node_modules/real (not a link)",
      ],
      [
        "a workspace link to another place",
        (w) => {
          rmSync(join(w, "node_modules/@stackra/a"));
          linkAt(w, "node_modules/@stackra/a", join(w, "packages"));
        },
        "node_modules/@stackra/a (not a link to packages/a)",
      ],
      [
        "a dot entry pnpm does not write",
        (w) => putFiles(w, { "node_modules/.cache/x": "" }),
        "node_modules/.cache (not an entry pnpm writes)",
      ],
      [
        ".bin that is a link",
        (w) => {
          rmSync(join(w, "packages/a/node_modules/.bin"), { recursive: true });
          linkAt(w, "packages/a/node_modules/.bin", "/usr/bin");
        },
        "packages/a/node_modules/.bin (not a directory)",
      ],
      [
        "a scope that is a link",
        (w) => linkAt(w, "node_modules/@evil", "/usr"),
        "node_modules/@evil (a scope that is not a directory)",
      ],
      [
        "an untracked file outside node_modules",
        (w) => putFiles(w, { "knip.json": '{"ignore":["**"]}' }),
        "knip.json",
      ],
    ]) {
      const r = f.prepare((work) => {
        f.install(work);
        setup(work);
      });
      assert.equal(r.status, PLANTED_EXIT, `${why}: ${r.stdout}${r.stderr}`);
      assert.ok(r.planted.includes(expected), `${why}: ${r.planted.join(" | ")}`);
    }
    // what pnpm 12 writes besides links, to be confirmed against main's real install on box 1
    assert.deepEqual(PNPM_DOT_ENTRIES, [
      ".bin",
      ".pnpm",
      ".modules.yaml",
      ".pnpm-workspace-state-v1.json",
    ]);
    // a failing find or tar stops prepare (pipefail, set -e): a missing archive is an error, never "clean"
    const broken = spawnSync(
      ANY_BASH,
      [
        "-c",
        `set -eo pipefail; cd "${f.dir}"; ${plantedCheck(join(f.dir, "nowhere"))}; echo clean`,
      ],
      // its scratch directory, which the failed tar leaves behind, inside the fixture
      { encoding: "utf8", env: { ...process.env, TMPDIR: f.dir } },
    );
    assert.notEqual(broken.status, 0);
    assert.doesNotMatch(broken.stdout, /clean/);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test("round 7: the lockfile plan names each member's direct dependencies, registry or the member a link names", () => {
  assert.deepEqual(
    nodeModulesPlan(
      {
        ".": {
          dependencies: { turbo: "2.11.9(x@1)" },
          devDependencies: { "@stackra/a": "link:packages/a" },
        },
        "packages/b": {
          dependencies: { "@stackra/a": "link:../a" },
          optionalDependencies: { zod: "4.0.0" },
          devDependencies: { ts6: "typescript@6.0.3", "@x/y": "@scope/z@1.0.0(p@1)" },
        },
      },
      {
        specifiers: {
          "packages/b": {
            devDependencies: { ts6: "catalog:tooling", "@x/y": "npm:@scope/z@^1.0.0" },
          },
        },
        catalogs: { tooling: { ts6: "npm:typescript@6.0.3" } },
      },
    ),
    {
      importers: [".", "packages/b"],
      entries: [
        ".\t@stackra/a\tpackages/a",
        ".\tturbo\tregistry\tturbo",
        "packages/b\t@stackra/a\tpackages/a",
        "packages/b\t@x/y\tregistry\t@scope/z",
        "packages/b\tts6\tregistry\ttypescript",
        "packages/b\tzod\tregistry\tzod",
      ],
    },
  );
  assert.throws(
    () => nodeModulesPlan({ ".": { dependencies: { "x\ty": "1" } } }),
    /not a lockfile importer entry/,
  );
  assert.throws(() => nodeModulesPlan({ "a\nb": {} }), /not a lockfile importer entry/);
  // round 8 (NIT): an importer and a workspace link stay inside the workspace, in normal form
  for (const dir of ["../x", "/abs", "packages/../x", "packages//a", "packages/a/"])
    assert.throws(
      () => nodeModulesPlan({ [dir]: {}, ".": { dependencies: { y: "1" } } }),
      /not a workspace member directory/,
      dir,
    );
  assert.throws(
    () => nodeModulesPlan({ "packages/a": { dependencies: { b: "link:../../../out" } } }),
    /a link outside the workspace/,
  );
  assert.deepEqual(
    nodeModulesPlan({ "packages/a": { dependencies: { b: "link:../b" } } }).entries,
    ["packages/a\tb\tpackages/b"],
  );
  // lockfileGraph's shape only: a flat map, another section or a name two sections lock differently is refused
  assert.throws(
    () => nodeModulesPlan({ ".": { zod: "4.0.0" } }),
    /not a lockfile importer section/,
  );
  assert.throws(
    () =>
      nodeModulesPlan({
        ".": { dependencies: { zod: "4.0.0" }, devDependencies: { zod: "3.0.0" } },
      }),
    /locked twice, differently/,
  );
});

/** nodeModulesPlan's entries for a lockfile text, through lockfileGraph (which must read it cleanly). */
const planOf = (text) => {
  const graph = lockfileGraph(text);
  assert.deepEqual(graph.problems, []);
  return nodeModulesPlan(graph.importers, graph).entries;
};

test("re-review of the box 1 proofs: a locked alias stands only when the spec the lockfile records names it", () => {
  const lock = (spec, version, catalogs = CATALOGS) =>
    [
      "lockfileVersion: '9.0'",
      "",
      catalogs,
      "importers:",
      "",
      "  .:",
      "    devDependencies:",
      "      turbo:",
      `        specifier: ${spec}`,
      `        version: ${version}`,
      "      typescript6:",
      "        specifier: catalog:tooling",
      "        version: typescript@6.0.3",
      "",
    ].join("\n");
  const CATALOGS = [
    "catalogs:",
    "  build:",
    "    turbo:",
    "      specifier: 2.11.9",
    "      version: 2.11.9",
    "  default:",
    "    turbo:",
    "      specifier: 2.11.9",
    "      version: 2.11.9",
    "  tooling:",
    "    typescript6:",
    "      specifier: npm:typescript@6.0.3",
    "      version: 6.0.3",
    "",
  ].join("\n");
  // main's shape: the catalog's npm: spec names the package the lockfile installs
  assert.deepEqual(planOf(lock("2.11.9", "2.11.9")), [
    ".\tturbo\tregistry\tturbo",
    ".\ttypescript6\tregistry\ttypescript",
  ]);
  // a lockfile-only alias of a gate tool, the spec unchanged (a range, the default catalog, a named catalog)
  for (const spec of [
    "2.11.9",
    "^2.11.9",
    "'catalog:'",
    "catalog:build",
    "catalog:tooling",
    "catalog:none",
  ])
    assert.throws(
      () => planOf(lock(spec, "evil-turbo@1.0.0")),
      /an alias only the lockfile makes: \. turbo locked as evil-turbo, which its spec does not name/,
      spec,
    );
  // an npm: spec naming another package, or none
  for (const spec of ["npm:turbo@2.11.9", "npm:evil-turbo", "npm:other@1.0.0"])
    assert.throws(
      () => planOf(lock(spec, "evil-turbo@1.0.0")),
      /an alias only the lockfile makes/,
      spec,
    );
  // the alias a spec declares is planned as that package (the manifest checks judge the spec itself)
  assert.deepEqual(
    planOf(lock("npm:evil-turbo@1.0.0", "evil-turbo@1.0.0"))[0],
    ".\tturbo\tregistry\tevil-turbo",
  );
  // the catalog's entry is the one under the dependency's own name, never another entry's alias
  assert.throws(
    () => planOf(lock("catalog:tooling", "typescript@6.0.3")),
    /\. turbo locked as typescript, which its spec does not name/,
  );
  // no specifiers handed in: every alias is refused (fails closed)
  assert.throws(
    () => nodeModulesPlan({ ".": { devDependencies: { typescript6: "typescript@6.0.3" } } }),
    /an alias only the lockfile makes/,
  );
  // the catalogs section is read as strictly as the importers
  assert.match(
    lockfileGraph("catalogs:\n  build:\n    turbo:\n      integrity: x\n").problems[0],
    /a catalog entry field the reader does not know/,
  );
  assert.match(lockfileGraph("catalogs: {}\n").problems[0], /`catalogs` is not a block mapping/);
});

test("proof B1: the plan reads lockfileGraph's importers from main's real lockfile, aliases and workspace links included", () => {
  const graph = lockfileGraph(readFileSync(join(CODE_DIR, "pnpm-lock.yaml"), "utf8"));
  assert.deepEqual(graph.problems, []);
  const plan = nodeModulesPlan(graph.importers, graph);
  assert.deepEqual(plan.importers, Object.keys(graph.importers).toSorted());
  // main's own aliases come from its catalogs (catalog:tooling, catalog:mobile, catalog:uniwind-pro)
  assert.equal(graph.catalogs.tooling.typescript6, "npm:typescript@6.0.3");
  assert.equal(graph.catalogs["uniwind-pro"].uniwind, "npm:uniwind-pro@1.9.0");
  assert.ok(plan.importers.includes("packages/developer/cli"));
  const rows = plan.entries.map((line) => line.split("\t"));
  for (const row of rows) {
    assert.ok(row.length === 3 || (row.length === 4 && row[2] === "registry"), row.join(" "));
    assert.ok(row[2] === "registry" || plan.importers.includes(row[2]), row.join(" "));
  }
  // every importer dependency of every section has its row
  const count = Object.values(graph.importers).reduce(
    (n, sections) =>
      n + Object.values(sections).reduce((m, deps) => m + Object.keys(deps).length, 0),
    0,
  );
  assert.equal(rows.length, count);
  const row = (dir, name) => rows.find((r) => r[0] === dir && r[1] === name);
  // the aliases main locks (box 1, proof 3): typescript6 -> typescript, uniwind -> uniwind-pro
  const ts6 = rows.filter((r) => r[1] === "typescript6");
  assert.ok(ts6.length > 0);
  for (const r of ts6) assert.deepEqual(r.slice(2), ["registry", "typescript"]);
  for (const { dir } of MOBILE_MEMBERS)
    assert.deepEqual(row(dir, "uniwind")?.slice(2), ["registry", "uniwind-pro"], dir);
  assert.deepEqual(row("apps/docs", "@stackra/cli")?.slice(2), ["packages/developer/cli"]);
});

/** The judge image's side of a view test: main's node_modules for the root and packages/a. */
function mainInstall(root) {
  putFiles(root, {
    "node_modules/.pnpm/turbo@2.11.8/node_modules/turbo/package.json": '{"where":"main"}',
    "node_modules/.bin/turbo": "#!/bin/sh\n",
    "node_modules/.bin/knip": "#!/bin/sh\n",
    "packages/a/node_modules/.bin/tsc": "#!/bin/sh\n",
    "packages/a/.stackra/vitest.config.mts": "main gen a\n",
    "packages/a/.stackra/migrations/0001.up.sql": "create table main ();\n",
  });
  linkAt(
    root,
    "node_modules/turbo",
    join(root, "node_modules/.pnpm/turbo@2.11.8/node_modules/turbo"),
  );
}

test("round 7 R6-H1 c: the main view gives every member main's node_modules on a tree no install touched, and refuses one that has its own", () => {
  const f = installFixture();
  const root = join(f.dir, "judge");
  mainInstall(root);
  try {
    const work = join(f.dir, "work");
    mkdirSync(work, { recursive: true });
    assert.equal(spawnSync("tar", ["-xf", join(f.dir, "src.tar"), "-C", work]).status, 0);
    const view = () =>
      spawnSync(
        ANY_BASH,
        [
          "-c",
          `${judgeViewScript(root, work, f.dir).replace("#!/usr/bin/env bash\n", "")}`,
          "judge-view",
          "main",
        ],
        {
          encoding: "utf8",
        },
      );
    const r = view();
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(readlinkSync(join(work, "node_modules")), join(root, "node_modules"));
    assert.equal(
      readlinkSync(join(work, "packages/a/node_modules")),
      join(root, "packages/a/node_modules"),
    );
    assert.equal(
      readFileSync(join(work, "packages/a/.stackra/vitest.config.mts"), "utf8"),
      "main gen a\n",
    );
    assert.equal(existsSync(join(work, "packages/a/.stackra/migrations")), false);
    // a tree that brings its own node_modules is refused
    rmSync(join(work, "packages/a/node_modules"));
    putFiles(work, { "packages/a/node_modules/.bin/knip": "#!/bin/sh\nexit 0\n" });
    const refused = view();
    assert.equal(refused.status, VIEW_REFUSED_EXIT, refused.stdout);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test("round 7: knip's view keeps the PR's dependencies, makes main's copies main's, drops hoisted extras, and holds main's bins only", () => {
  const f = installFixture();
  const root = join(f.dir, "judge");
  mainInstall(root);
  try {
    const work = join(f.dir, "work");
    mkdirSync(work, { recursive: true });
    f.install(work);
    assert.equal(spawnSync("tar", ["-xf", join(f.dir, "src.tar"), "-C", work]).status, 0);
    // a hoisted platform package main's lockfile does not name for the root (round 7, L2)
    linkAt(
      work,
      "node_modules/@turbo/darwin-64",
      join(work, "node_modules/.pnpm/@turbo+darwin-64@2.11.9/node_modules/@turbo/darwin-64"),
    );
    const view = () =>
      spawnSync(
        ANY_BASH,
        [
          "-c",
          judgeViewScript(root, work, f.dir).replace("#!/usr/bin/env bash\n", ""),
          "judge-view",
          "pr",
        ],
        {
          encoding: "utf8",
        },
      );
    const r = view();
    // packages/a's .bin has no turbo, and may be the last node_modules visited (R6-M1: the view still succeeds)
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(readlinkSync(join(work, "node_modules/turbo")), join(root, "node_modules/turbo"));
    assert.match(
      readFileSync(join(work, "packages/a/node_modules/zod/package.json"), "utf8"),
      /"where":"PR"/,
    );
    assert.equal(realpathSync(join(work, "node_modules/@stackra/a")), join(work, "packages/a"));
    assert.equal(existsSync(join(work, "node_modules/@turbo/darwin-64")), false);
    assert.equal(
      readlinkSync(join(work, "node_modules/.bin/knip")),
      join(root, "node_modules/.bin/knip"),
    );
    // the guarded turbo (/in/bin/turbo in a judge; this test's input directory here)
    assert.equal(readlinkSync(join(work, "node_modules/.bin/turbo")), join(f.dir, "bin/turbo"));
    assert.equal(
      readlinkSync(join(work, "packages/a/node_modules/.bin/tsc")),
      join(root, "packages/a/node_modules/.bin/tsc"),
    );
    // anything it does not recognise stops the view (a service error, fail closed)
    for (const plant of [
      (w) => putFiles(w, { "node_modules/.cache/x": "" }),
      (w) => putFiles(w, { "node_modules/real/index.js": "" }),
      (w) => putFiles(w, { "packages/a/src/node_modules/x/y.js": "" }),
    ]) {
      plant(work);
      const refused = view();
      assert.equal(refused.status, VIEW_REFUSED_EXIT, refused.stdout);
      rmSync(join(work, "node_modules/.cache"), { recursive: true, force: true });
      rmSync(join(work, "node_modules/real"), { recursive: true, force: true });
      rmSync(join(work, "packages/a/src/node_modules"), { recursive: true, force: true });
    }
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test("round 7 M2: the install is two parts, scripts off first; licence-policy judges the image between them", () => {
  const parts = installCommands(["esbuild"], [], GATE_FILTERS);
  assert.equal(
    parts.install,
    "pnpm install --frozen-lockfile --store-dir /store --ignore-scripts --ignore-pnpmfile --filter='!@figentra/mobile' --filter='!@figentra/playground'",
  );
  assert.equal(
    parts.rebuild,
    "pnpm rebuild --ignore-pnpmfile --filter='!@figentra/mobile' --filter='!@figentra/playground' esbuild",
  );
  assert.equal(
    installCommand(["esbuild"], [], GATE_FILTERS),
    `${parts.install} && ${parts.rebuild}`,
  );
  assert.deepEqual(installCommands([], [], []), { install: INSTALL_COMMAND, rebuild: "" });
  assert.match(
    installCommands(["uniwind-pro"], LICENSED_BUILDS, []).rebuild,
    /^for d in node_modules\/\.pnpm\/uniwind-pro@\*/,
  );
  assert.deepEqual(
    GATE_STEPS.filter((step) => viewOf(step) === "installed").map((step) => step.id),
    ["licence-policy"],
  );
});

test("round 7 M2: with no allowed build there is no rebuild container; licence-policy and prepare start from the install", async () => {
  const { deps, calls } = fakeDeps({ builds: [] });
  const r = await runJob(JOB, deps);
  assert.equal(r.conclusion, "success");
  assert.equal(
    calls.runs.some((run) => run[run.indexOf("--name") + 1].endsWith("-rebuild")),
    false,
  );
  const [, base] = calls.runs;
  assert.match(imageOf(base), /-installed$/);
});

test("round 7 NIT: the install runs main's pnpm: packageManager and devEngines are main's in every package.json", () => {
  assert.ok(OVERLAY_FIELDS.includes("packageManager") && OVERLAY_FIELDS.includes("devEngines"));
  const main = JSON.stringify({
    name: "r",
    packageManager: "pnpm@12.16.1",
    devEngines: { packageManager: { name: "pnpm" } },
  });
  const pr = JSON.stringify({
    name: "r",
    packageManager: "pnpm@99.0.0",
    devEngines: { runtime: { name: "node" } },
    dependencies: { a: "1" },
  });
  const out = JSON.parse(withMainScripts(pr, main));
  assert.equal(out.packageManager, "pnpm@12.16.1");
  assert.deepEqual(out.devEngines, { packageManager: { name: "pnpm" } });
  assert.deepEqual(out.dependencies, { a: "1" });
  // a PR that adds one where main has none: it goes
  assert.equal(
    "packageManager" in
      JSON.parse(withMainScripts(JSON.stringify({ packageManager: "pnpm@1.0.0" }), "{}")),
    false,
  );
});

test("round 7: a judge's PATH puts the guarded node and main's tools first, and never names the tree", () => {
  const path = judgeEnv()
    .match(/^PATH=(.*)$/m)[1]
    .split(":");
  assert.deepEqual(path.slice(0, 2), ["/in/bin", "/judge/node_modules/.bin"]);
  assert.equal(
    path.some((dir) => dir.startsWith("/work")),
    false,
  );
});

test("round 8 L2: compiled SQL gen wrote that git does not track fails manifests-match-gen; ignored SQL stays invisible", () => {
  const step = GATE_STEPS.find((s) => s.id === "manifests-match-gen");
  assert.ok(
    step.run.indexOf(UNTRACKED_SQL) > step.run.indexOf("gen"),
    "after gen, before the diff",
  );
  assert.ok(step.run.indexOf(UNTRACKED_SQL) < step.run.indexOf("if ! git diff --quiet"));
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "sv-untracked-")));
  const git = (...args) =>
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t.invalid", ...args], {
      cwd: dir,
      encoding: "utf8",
    });
  const check = () =>
    spawnSync(
      ANY_BASH,
      ["-c", `cd "${dir}"; check() {\n${UNTRACKED_SQL}\n}; check; echo tracked`],
      {
        encoding: "utf8",
      },
    );
  try {
    git("init", "-q");
    putFiles(dir, {
      "services/a/.stackra/migrations/0001_a.up.sql": "create table a ();",
      "packages/p/src/node/database/compiled-migrations/p_0001_x.up.sql": "create table x ();",
      ".gitignore": "services/b/.stackra/\n",
    });
    git("add", "-A");
    git("commit", "-qm", "base");
    assert.equal(check().status, 0);
    // a new source's SQL gen wrote but nobody committed: in each committed place
    for (const file of [
      "services/a/.stackra/migrations/0002_b.up.sql",
      "services/a/stackra-encore/a/migrations/2_b.up.sql",
      "packages/p/src/node/database/compiled-migrations/p_0002_y.up.sql",
    ]) {
      putFiles(dir, { [file]: "create table y ();" });
      const r = check();
      assert.equal(r.status, 1, file);
      assert.match(
        r.stdout,
        /::error title=Stale manifests::commit the compiled migration SQL gen wrote above/,
      );
      assert.ok(r.stdout.includes(file), r.stdout);
      rmSync(join(dir, file));
    }
    // still gitignored (main before STA-2788): invisible, a no-op
    putFiles(dir, { "services/b/.stackra/migrations/0001_b.up.sql": "create table b ();" });
    assert.equal(check().status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("round 7 L3: once SQL is compiled, every member with migration sources must have its own; manifests-match-gen compares the SQL", () => {
  const step = GATE_STEPS.find((s) => s.id === "manifests-match-gen");
  assert.match(
    step.run,
    /git diff --quiet -- '\*stackra\.manifest\.json' '\*src\/node\/entities\.gen\.ts' '\*\/\.stackra\/migrations\/\*\.up\.sql'/,
  );
  assert.ok(migrationLintRun(true).includes(MIGRATION_PENDING_PER_MEMBER));
  assert.equal(migrationLintRun(false).includes(MIGRATION_PENDING_PER_MEMBER), false);
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "sv-member-")));
  try {
    const check = (files) => {
      rmSync(join(dir, "t"), { recursive: true, force: true });
      putFiles(join(dir, "t"), files);
      return spawnSync(
        ANY_BASH,
        [
          "-c",
          `cd "${join(dir, "t")}"; check() {\n${MIGRATION_PENDING_PER_MEMBER}\n}; check; echo all-compiled`,
        ],
        {
          encoding: "utf8",
        },
      );
    };
    const one = check({
      "services/a/package.json": "{}",
      "services/a/src/node/database/migrations/0001-a.migration.ts": "x",
      "services/a/.stackra/migrations/0001_a.up.sql": "create table a ();",
      "services/b/package.json": "{}",
      "services/b/src/node/database/migrations/0001-b.migration.ts": "x",
    });
    assert.equal(one.status, 1, one.stdout);
    assert.match(
      one.stdout,
      /^::error title=STA-2788 pending::migration sources with no compiled SQL in \.\/services\/b $/m,
    );
    const all = check({
      "services/a/package.json": "{}",
      "services/a/src/node/database/migrations/0001-a.migration.ts": "x",
      "services/a/.stackra/migrations/0001_a.up.sql": "create table a ();",
    });
    assert.equal(all.status, 0, all.stdout + all.stderr);
    assert.match(all.stdout, /all-compiled/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
