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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createConnection, createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
} from "../stackra-verify.mjs";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const BASE = "fedcba9876543210fedcba9876543210fedcba98";
const NOW = Date.parse("2026-11-24T15:00:00Z");
const PINNED = `node@sha256:${"a".repeat(64)}`;
const APP_ID = "4242";
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
/** The preflight's machine checks, all passing unless overridden. */
const io = (over = {}) => ({
  exists: () => true,
  canRead: () => false,
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

test("verify: the tested tree is unpacked again over /work and committed to a fresh repository before pnpm verify", () => {
  const check = verifyArgs(S, { name: "v", image: "run", envFile: ENV, tarPath: TAR });
  assert.match(
    check.at(-1),
    /^set -e; tar -xf \/in\/src\.tar -C \/work; cd \/work; rm -rf \.git; git init -q; git add -A; .* commit -qm tested --no-verify; pnpm verify$/,
  );
});

test("proxy: refuses a non-allowlisted host, an address literal and a port other than 443", async () => {
  const port = 30_000 + Math.floor(Math.random() * 20_000);
  const child = spawn(process.execPath, ["-e", proxyScript(["registry.npmjs.org"], port)], {
    stdio: "ignore",
  });
  try {
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    const ask = (target) =>
      new Promise((resolve) => {
        const s = createConnection(port, "127.0.0.1", () =>
          s.write(`CONNECT ${target} HTTP/1.1\r\nHost: ${target}\r\n\r\n`),
        );
        let buf = "";
        s.on("data", (d) => {
          buf += d;
          if (buf.includes("\r\n")) {
            s.destroy();
            resolve(buf.split("\r\n")[0]);
          }
        });
        s.on("error", () => resolve("error"));
      });
    for (const target of [
      "169.254.169.254:80",
      "169.254.169.254:443",
      "example.com:443",
      "registry.npmjs.org:80",
      "127.0.0.1:443",
    ])
      assert.match(await ask(target), /^HTTP\/1\.1 403/, target);
  } finally {
    child.kill();
  }
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
    app: { id: 4242 },
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
  assert.match(body.output.title, /^pnpm verify failed in 1m 1s$/);
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
}) {
  const calls = { kill: [], cleanUp: [], docker: [], runs: [] };
  let stopping = false;
  const deps = {
    settings: S,
    envFile: ENV,
    installEnvFile: "/runs/x/install.env",
    now: () => Date.now(),
    builds: () => ["esbuild"],
    archive: () => {
      if (conflict) throw Object.assign(new Error("conflict"), { conflict: true });
      return TAR;
    },
    storeImage: () => "stackra-verify-store:abc",
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
  const plan = overlayPlan(
    [
      "package.json",
      "packages/a/package.json",
      "packages/new/package.json",
      "src/a.ts",
      "turbo.jsonc",
      ".gitattributes",
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
  assert.match(md, /\| failure, not posted \| 1m 1s \|/);
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
  const port = 30_000 + Math.floor(Math.random() * 20_000);
  const child = spawn(process.execPath, ["-e", proxyScript(["127.0.0.1"], port)], {
    stdio: "ignore",
  });
  try {
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    const line = await new Promise((resolve) => {
      const socket = createConnection(port, "127.0.0.1", () =>
        socket.write("CONNECT 127.0.0.1:443 HTTP/1.1\r\n\r\n"),
      );
      let buf = "";
      socket.on("data", (d) => {
        buf += d;
        if (buf.includes("\r\n")) {
          socket.destroy();
          resolve(buf.split("\r\n")[0]);
        }
      });
      socket.on("error", () => resolve("error"));
    });
    assert.match(line, /^HTTP\/1\.1 403/);
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
    app: { id: 4242 },
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
