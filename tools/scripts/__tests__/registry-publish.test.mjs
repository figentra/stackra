/**
 * Stackra file contract:
 * Purpose: run the publish plan and the publish script that `runway-npm.yml` writes (its "Registry" step) against a
 *          fixture workspace, so a release publishes dependencies first, publishes the tarball it packed and checked, and
 *          a run that stops half way, or ends early, is loud and leaves a set that installs. 0.33.1 published 99 of 119
 *          packages in path order and left 22 of them pinning a version of an unpublished package (@stackra/consent ->
 *          @stackra/iam). A version already on the registry counts only with the content packed here (its `dist.integrity`);
 *          the registry's answers are read three ways (present, absent, unavailable). Every version goes out under the
 *          holding tag and `latest` moves only after the dependency closure holds on the registry (STA-2778: 0.33.1 left
 *          @stackra/cli on `latest` pinning eight versions that answered 404), and with `promote-latest-after:
 *          consumer-smoke` only after the caller's clean-consumer command passed (STA-2874): the release job then moves
 *          no tag and leaves the moves for the `consumer-smoke` job (its script, `registry-smoke.sh`) and the `promote`
 *          job (`registry-promote.sh`), and the smoke never runs in the job that holds the OIDC request token or the App
 *          token. The fixture runs `immediate` unless a test asks for the smoke, so the tests before STA-2874 keep their
 *          meaning.
 * Boundary: the scripts are cut out of the workflow text and run as written; `curl` is a stand-in registry (status
 *           codes, version documents with an integrity, packuments with their dist-tags, dist-tag writes, timeouts) and
 *           `pnpm publish` records the tarball and the tag it was given.
 *           Every other `pnpm` command is the real one. The children the script starts (curl, pnpm, node, git) read the
 *           script's standard input greedily, the way a command that prompts would.
 * Runtime: node, bash, jq, pnpm
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0453 decision 7 (versions are immutable); ADR 0468.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const WORKFLOW = readFileSync(".github/workflows/runway-npm.yml", "utf8");
const REGISTRY = "https://registry.test/";

/** The body of the heredoc `cat > "$RUNNER_TEMP/<file>" <<'<tag>'`, without the workflow's indentation. */
function heredoc(file, tag) {
  const start = WORKFLOW.indexOf(`cat > "$RUNNER_TEMP/${file}" <<'${tag}'\n`);
  assert.notEqual(start, -1, `runway-npm.yml no longer writes ${file}`);
  const lines = WORKFLOW.slice(WORKFLOW.indexOf("\n", start) + 1).split("\n");
  const body = lines.slice(
    0,
    lines.findIndex((line) => line.trim() === tag),
  );
  const indent = /^ */.exec(body[0])[0].length;
  return `${body.map((line) => line.slice(indent)).join("\n")}\n`;
}

const PLAN_SCRIPT = heredoc("registry-plan.mjs", "MJS");
const PUBLISH_SCRIPT = heredoc("registry-publish.sh", "SH");
const SMOKE_SCRIPT = heredoc("registry-smoke.sh", "SH");
const PROMOTE_SCRIPT = heredoc("registry-promote.sh", "SH");

/** A job of runway-npm.yml, from its id line to the next job's. */
function job(id) {
  const start = WORKFLOW.indexOf(`\n  ${id}:\n`);
  assert.notEqual(start, -1, `runway-npm.yml has no job ${id}`);
  const rest = WORKFLOW.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][a-z-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

/** The sha512 integrity of a file, as a registry writes `dist.integrity`. */
const integrityOf = (file) =>
  `sha512-${createHash("sha512").update(readFileSync(file)).digest("base64")}`;

/** The real `pnpm` binary and the directories of the real `node`, `pnpm` and `git`, which the shims must not hide. */
function realTools() {
  let pnpm;
  try {
    pnpm = execFileSync("mise", ["which", "pnpm"], { encoding: "utf8" }).trim();
  } catch {
    pnpm = execFileSync("which", ["pnpm"], { encoding: "utf8" }).trim();
  }
  const git = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  return { pnpm, git, dirs: [dirname(process.execPath), dirname(pnpm), dirname(git)] };
}

/** A shim: a node script under an absolute shebang, so a shim named `node` cannot start itself. */
const shim = (body) => `#!${process.execPath}
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { spawnSync, execFileSync } = require("node:child_process");
const state = process.env.STATE;
const args = process.argv.slice(2);
/** Reads all of standard input, as a command that prompts or streams would, and says so in drained.log. */
const drain = () => {
  let text = "";
  try { text = fs.readFileSync(0, "utf8"); } catch {}
  if (text !== "") fs.appendFileSync(path.join(state, "drained.log"), path.basename(process.argv[1]) + " " + text.length + "\\n");
  return text;
};
const integrityOf = (file) => "sha512-" + createHash("sha512").update(fs.readFileSync(file)).digest("base64");
${body}
`;

/** The registry: the ID token, the token exchange, and a version document by a file per version. */
const CURL_SHIM = shim(`
fs.appendFileSync(path.join(state, "curl-argv.log"), args.join(" ") + "\\n");
let out, format, fromStdin = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "-o") out = args[++i];
  else if (args[i] === "-w") format = args[++i];
  else if (args[i] === "--config") fromStdin = args[++i] === "-";
}
const config = drain();
const url = args.at(-1);
const reply = (code, body = "") => {
  if (out) fs.writeFileSync(out, body);
  else process.stdout.write(body);
  if (format) process.stdout.write(format.replace("%{http_code}", String(code)));
  process.exit(code >= 400 && args.includes("-f") ? 22 : 0);
};
if (url.startsWith(process.env.ACTIONS_ID_TOKEN_REQUEST_URL.split("?")[0])) {
  if (!fromStdin || !config.includes("bearer request-token")) reply(401);
  reply(200, JSON.stringify({ value: "id-token" }));
}
if (url.includes("oidc/token/exchange")) {
  if (!fromStdin || !config.includes("Bearer id-token")) reply(401);
  reply(200, JSON.stringify({ token: "publish-token" }));
}
const method = args.includes("-X") ? args[args.indexOf("-X") + 1] : "GET";
const tagWrite = /\\/-\\/package\\/([^/]+)\\/dist-tags\\/([^/]+)$/.exec(url);
if (tagWrite !== null) {
  // The Worker's writeDistTag: a publish token, PUT a JSON string version that exists, or DELETE.
  if (!fromStdin || !config.includes("Bearer publish-token")) reply(401);
  const [, encoded, tag] = tagWrite;
  const failures = path.join(state, "tagfail", encoded.replace("%2f", "_"));
  if (fs.existsSync(failures) && Number(fs.readFileSync(failures, "utf8")) > 0) {
    fs.writeFileSync(failures, String(Number(fs.readFileSync(failures, "utf8")) - 1));
    reply(500);
  }
  const file = path.join(state, "tags", encoded + ".json");
  const tags = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  let line = method + " " + encoded.replace("%2f", "/") + " " + tag;
  if (method === "PUT") {
    const version = JSON.parse(args[args.indexOf("--data") + 1]);
    if (!fs.existsSync(path.join(state, "registry", encoded + "@" + version))) reply(404);
    tags[tag] = version;
    line += " " + version;
  } else if (method === "DELETE") delete tags[tag];
  else reply(405);
  fs.writeFileSync(file, JSON.stringify(tags));
  fs.appendFileSync(path.join(state, "dist-tags.log"), line + "\\n");
  fs.appendFileSync(path.join(state, "events.log"), line + "\\n");
  reply(201, JSON.stringify({ ok: true }));
}
const key = url.slice(process.env.REGISTRY.length).replaceAll("/", "@");
const net = path.join(state, "net", key);
if (fs.existsSync(net)) {
  const mode = fs.readFileSync(net, "utf8");
  if (mode === "timeout") process.exit(28);
  if (mode.startsWith("seq:")) {
    // The answers of successive attempts; curl's --retry N asks again after a 408, 429 or 5xx, up to N more times.
    const codes = mode.slice(4).split(",").map(Number);
    const retries = args.includes("--retry") ? Number(args[args.indexOf("--retry") + 1]) : 0;
    let code = codes[0];
    for (let attempt = 1; attempt <= retries && [408, 429, 500, 502, 503, 504].includes(code); attempt++)
      code = codes[Math.min(attempt, codes.length - 1)];
    if (code !== 200) reply(code);
  } else reply(Number(mode.replace("http:", "")));
}
if (/^@[^@]+$/.test(key)) {
  // A packument: every version held, and the dist-tags. A vanishing package answers 404 once its reads are spent.
  const vanish = path.join(state, "vanish", key);
  if (fs.existsSync(vanish)) {
    const left = Number(fs.readFileSync(vanish, "utf8"));
    if (left <= 0) reply(404);
    fs.writeFileSync(vanish, String(left - 1));
  }
  fs.appendFileSync(path.join(state, "packuments.log"), key.replace("%2f", "/") + "\\n");
  const prefix = key + "@";
  const versions = Object.fromEntries(
    fs.readdirSync(path.join(state, "registry"))
      .filter((file) => file.startsWith(prefix))
      .map((file) => {
        const version = file.slice(prefix.length);
        const integrity = fs.readFileSync(path.join(state, "registry", file), "utf8");
        return [version, { name: key.replace("%2f", "/"), version, dist: { integrity } }];
      }),
  );
  const tagsFile = path.join(state, "tags", key + ".json");
  const tags = fs.existsSync(tagsFile) ? JSON.parse(fs.readFileSync(tagsFile, "utf8")) : {};
  if (Object.keys(versions).length === 0) reply(404);
  reply(200, JSON.stringify({ name: key.replace("%2f", "/"), "dist-tags": tags, versions }));
}
const document = (integrity) => {
  const at = key.lastIndexOf("@");
  return JSON.stringify({ name: key.slice(0, at).replace("%2f", "/"), version: key.slice(at + 1), dist: { integrity } });
};
const held = path.join(state, "registry", key);
const lagging = path.join(state, "lagging", key);
if (fs.existsSync(held)) reply(200, document(fs.readFileSync(held, "utf8")));
if (fs.existsSync(lagging)) {
  const [count, integrity] = fs.readFileSync(lagging, "utf8").split(" ");
  if (Number(count) > 0) { fs.writeFileSync(lagging, String(Number(count) - 1) + " " + integrity); reply(404); }
  fs.writeFileSync(held, integrity);
  reply(200, document(integrity));
}
reply(404);
`);

/** `pnpm publish <tarball>` records itself and puts the version on the registry; `ls` can report one more public package. */
const PNPM_SHIM = shim(`
const real = () => spawnSync(process.env.REAL_PNPM, args, { stdio: "inherit" }).status ?? 1;
if (args[0] === "publish") {
  drain();
  const tarball = args.find((a) => a.endsWith(".tgz"));
  const manifest = JSON.parse(execFileSync("tar", ["-xzOf", tarball, "package/package.json"], { encoding: "utf8" }));
  if (process.env.NODE_AUTH_TOKEN !== "publish-token") { console.error("no publish token for " + manifest.name); process.exit(3); }
  fs.appendFileSync(path.join(state, "published.log"), manifest.name + "\\n");
  fs.appendFileSync(path.join(state, "published-tarballs.log"), tarball + "\\n");
  const tag = args.includes("--tag") ? args[args.indexOf("--tag") + 1] : "latest";
  fs.appendFileSync(path.join(state, "published-tags.log"), manifest.name + " " + tag + "\\n");
  fs.appendFileSync(path.join(state, "events.log"), "publish " + manifest.name + "\\n");
  const tagsFile = path.join(state, "tags", manifest.name.replace("/", "%2f") + ".json");
  const offer = () => {
    const tags = fs.existsSync(tagsFile) ? JSON.parse(fs.readFileSync(tagsFile, "utf8")) : {};
    tags[tag] = manifest.version;
    fs.writeFileSync(tagsFile, JSON.stringify(tags));
  };
  const plain = manifest.name.replace("/", "_");
  const key = manifest.name.replace("/", "%2f") + "@" + manifest.version;
  const held = path.join(state, "registry", key);
  const failures = path.join(state, "fail", plain);
  if (fs.existsSync(failures) && Number(fs.readFileSync(failures, "utf8")) > 0) {
    fs.writeFileSync(failures, String(Number(fs.readFileSync(failures, "utf8")) - 1));
    if (fs.existsSync(failures + ".registers")) {
      const content = fs.readFileSync(failures + ".registers", "utf8") === "wrong" ? "sha512-OTHER" : integrityOf(tarball);
      const lag = path.join(state, "lag", plain);
      if (fs.existsSync(lag)) fs.writeFileSync(path.join(state, "lagging", key), fs.readFileSync(lag, "utf8") + " " + content);
      else fs.writeFileSync(held, content);
      offer();
    }
    process.exit(1);
  }
  if (fs.existsSync(path.join(state, "lag", plain)))
    fs.writeFileSync(path.join(state, "lagging", key), fs.readFileSync(path.join(state, "lag", plain), "utf8") + " " + integrityOf(tarball));
  else if (fs.existsSync(path.join(state, "tamper", plain))) fs.writeFileSync(held, "sha512-TAMPERED");
  else if (!fs.existsSync(path.join(state, "hide", plain))) fs.writeFileSync(held, integrityOf(tarball));
  if (!fs.existsSync(path.join(state, "hide", plain))) offer();
  process.exit(0);
}
if (args[0] === "pack") { drain(); process.exit(real()); }
if (args.includes("ls") && process.env.LS_EMPTY) {
  if (process.env.LS_EMPTY === "list") process.stdout.write("[]");
  process.exit(0);
}
if (args.includes("ls") && process.env.LS_EXTRA) {
  const result = spawnSync(process.env.REAL_PNPM, args, { encoding: "utf8" });
  const list = JSON.parse(result.stdout);
  list.push({ name: "@t/phantom", version: "1.0.0", path: "/nowhere" });
  process.stdout.write(JSON.stringify(list));
  process.exit(result.status ?? 1);
}
process.exit(real());
`);

/** `node` and `git` that read standard input first (`node` for \`--verify\`, \`git\` for tags), then run the real command. */
const NODE_SHIM = shim(`
if (args.includes("--verify")) drain();
process.exit(spawnSync(process.env.REAL_NODE, args, { stdio: "inherit" }).status ?? 1);
`);
const GIT_SHIM = shim(`
if (args.includes("tag") || args.includes("rev-parse")) drain();
process.exit(spawnSync(process.env.REAL_GIT, args, { stdio: "inherit" }).status ?? 1);
`);

/** The non-empty lines of a file, or none when it is not there. */
const linesOf = (file) =>
  existsSync(file) ? readFileSync(file, "utf8").trim().split("\n").filter(Boolean) : [];

/** A package's name as the fixture's state files spell it. */
const plainName = (name) => `@t_${name}`;

/**
 * A workspace of packages, `{ name, version, deps, devDeps, ranges, peers, isPrivate, prepack, main }`, with the two
 * scripts and the shims, ready to run. `ranges` and `peers` add dependencies and peer dependencies as written.
 *
 * @example
 * const run = fixture([{ name: "a", deps: ["b"] }, { name: "b" }]);
 */
function fixture(packages) {
  const root = mkdtempSync(join(tmpdir(), "registry-publish-"));
  const state = join(root, "state");
  const bin = join(root, "bin");
  for (const dir of [
    "registry",
    "fail",
    "hide",
    "lag",
    "lagging",
    "tamper",
    "net",
    "tags",
    "tagfail",
    "vanish",
  ])
    mkdirSync(join(state, dir), { recursive: true });
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "fixture-root", private: true }),
  );
  writeFileSync(join(root, "pnpm-workspace.yaml"), 'packages:\n  - "pkgs/*"\n');
  for (const {
    name,
    version = "1.0.0",
    deps = [],
    devDeps = [],
    ranges = {},
    peers,
    isPrivate = false,
    prepack,
    main,
  } of packages) {
    mkdirSync(join(root, "pkgs", name), { recursive: true });
    writeFileSync(
      join(root, "pkgs", name, "package.json"),
      JSON.stringify({
        name: `@t/${name}`,
        version,
        ...(isPrivate ? { private: true } : {}),
        ...(prepack === undefined ? {} : { scripts: { prepack } }),
        ...(main === undefined ? {} : { main }),
        dependencies: {
          ...Object.fromEntries(deps.map((dep) => [`@t/${dep}`, "workspace:*"])),
          ...ranges,
        },
        devDependencies: Object.fromEntries(devDeps.map((dep) => [`@t/${dep}`, "workspace:*"])),
        ...(peers === undefined ? {} : { peerDependencies: peers }),
      }),
    );
    writeFileSync(join(root, "pkgs", name, "LICENSE"), "MIT\n");
  }
  for (const [file, text] of [
    ["curl", CURL_SHIM],
    ["pnpm", PNPM_SHIM],
    ["node", NODE_SHIM],
    ["git", GIT_SHIM],
  ]) {
    writeFileSync(join(bin, file), text);
    chmodSync(join(bin, file), 0o755);
  }
  writeFileSync(join(root, "registry-plan.mjs"), PLAN_SCRIPT);
  writeFileSync(join(root, "registry-publish.sh"), PUBLISH_SCRIPT);
  writeFileSync(join(root, "registry-smoke.sh"), SMOKE_SCRIPT);
  writeFileSync(join(root, "registry-promote.sh"), PROMOTE_SCRIPT);
  const tools = realTools();
  const git = (...args) => execFileSync(tools.git, args, { cwd: root, stdio: "ignore" });
  git("init", "-q");
  git(
    "-c",
    "user.name=t",
    "-c",
    "user.email=t@t",
    "commit",
    "-q",
    "--allow-empty",
    "-m",
    "fixture",
  );
  const env = {
    ...process.env,
    PATH: [bin, ...tools.dirs, process.env.PATH].join(":"),
    REAL_PNPM: tools.pnpm,
    REAL_NODE: process.execPath,
    REAL_GIT: tools.git,
    REGISTRY,
    STATE: state,
    RUNNER_TEMP: root,
    CHANGESETS_OUTPUT: join(root, "changesets-output.ndjson"),
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token",
    ACTIONS_ID_TOKEN_REQUEST_URL: "https://actions.test/token?api=1",
    PUBLISH_RETRY_DELAY: "0",
    PROMOTE_LATEST_AFTER: "immediate",
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@t",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@t",
  };
  return {
    root,
    state,
    /** Mark a package so its next `count` publishes fail, optionally after reaching the registry (`wrong`: with other content). */
    failPublish(name, count, { registers = false, wrong = false } = {}) {
      writeFileSync(join(state, "fail", plainName(name)), String(count));
      if (registers)
        writeFileSync(
          join(state, "fail", `${plainName(name)}.registers`),
          wrong ? "wrong" : "right",
        );
    },
    /** Mark a package so its publish succeeds but the registry never shows it. */
    hide(name) {
      writeFileSync(join(state, "hide", plainName(name)), "");
    },
    /** Mark a package so its publish succeeds but the registry then holds other content under that version. */
    tamper(name) {
      writeFileSync(join(state, "tamper", plainName(name)), "");
    },
    /** Mark a package whose version the registry shows only after it answered 404 to `count` checks. */
    lag(name, count) {
      writeFileSync(join(state, "lag", plainName(name)), String(count));
    },
    /** Put a version of a package outside the workspace on the registry (other content: it is never this run's). */
    onRegistry(name, version) {
      writeFileSync(join(state, "registry", `@t%2f${name}@${version}`), "sha512-ELSEWHERE");
    },
    /** Set a package's dist-tags on the registry. */
    setTags(name, tags) {
      writeFileSync(join(state, "tags", `@t%2f${name}.json`), JSON.stringify(tags));
    },
    /** A package's dist-tags on the registry. */
    tagsOf(name) {
      const file = join(state, "tags", `@t%2f${name}.json`);
      return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
    },
    /** Make the next `count` dist-tag writes for a package fail with a 500. */
    failTag(name, count) {
      writeFileSync(join(state, "tagfail", `@t_${name}`), String(count));
    },
    /** Make a package's packument answer 404 once it has been read `reads` times. */
    vanish(name, reads) {
      writeFileSync(join(state, "vanish", `@t%2f${name}`), String(reads));
    },
    /** Make the registry answer every read of a package's packument with `http:<code>` or `timeout`. */
    answerPackument(name, how) {
      writeFileSync(join(state, "net", `@t%2f${name}`), how);
    },
    /** Make the registry answer every check of a version with `http:<code>` or `timeout`. */
    answer(name, how) {
      writeFileSync(join(state, "net", `@t%2f${name}@1.0.0`), how);
    },
    /** Drop the git tags, as a failed run does: the action pushes tags only after a script that succeeded. */
    forgetTags() {
      for (const tag of execFileSync(tools.git, ["tag", "-l"], { cwd: root, encoding: "utf8" })
        .split("\n")
        .filter(Boolean))
        execFileSync(tools.git, ["tag", "-d", tag], { cwd: root, stdio: "ignore" });
    },
    /** Tag a version, as an earlier release run that got as far as pushing its tags did. */
    tag(name) {
      execFileSync(
        tools.git,
        ["-c", "user.name=t", "-c", "user.email=t@t", "tag", `@t/${name}@1.0.0`],
        { cwd: root, stdio: "ignore" },
      );
    },
    /** Put a version on the registry as it is when published from this tree (`integrity` overrides the content). */
    preload(name, integrity) {
      const dir = mkdtempSync(join(root, "preload-"));
      execFileSync(tools.pnpm, ["pack", "--pack-destination", dir], {
        cwd: join(root, "pkgs", name),
        stdio: "ignore",
      });
      const [tarball] = execFileSync("ls", [dir], { encoding: "utf8" }).trim().split("\n");
      writeFileSync(
        join(state, "registry", `@t%2f${name}@1.0.0`),
        integrity ?? integrityOf(join(dir, tarball)),
      );
    },
    /** The release job's promotion plan (STA-2874): its folder, the moves and their sha256, or null when none. */
    promotion() {
      const dir = join(root, "registry-promotion");
      if (!existsSync(join(dir, "moves.tsv"))) return null;
      const moves = readFileSync(join(dir, "moves.tsv"));
      return {
        dir,
        moves: moves.toString("utf8").trim().split("\n"),
        release: readFileSync(join(dir, "release.tsv"), "utf8").trim().split("\n"),
        sha256: createHash("sha256").update(moves).digest("hex"),
      };
    },
    /**
     * Run a script; `extraEnv` adds to its environment and `input` is its standard input. `script` is the release job's
     * `registry-publish.sh` unless named: `registry-smoke.sh` (the consumer-smoke job) or `registry-promote.sh` (promote).
     */
    run({
      extraEnv = {},
      input = "standard input that no child of the script may swallow\n",
      script = "registry-publish.sh",
    } = {}) {
      const result = spawnSync("bash", [join(root, script)], {
        cwd: root,
        env: { ...env, ...extraEnv },
        encoding: "utf8",
        input,
      });
      return {
        ...result,
        output: `${result.stdout}${result.stderr}`,
        published: linesOf(join(state, "published.log")),
        tarballs: linesOf(join(state, "published-tarballs.log")),
        drained: linesOf(join(state, "drained.log")),
        argv: linesOf(join(state, "curl-argv.log")),
        tags: execFileSync(tools.git, ["tag", "-l"], { cwd: root, encoding: "utf8" })
          .trim()
          .split("\n")
          .filter(Boolean),
        events: linesOf(env.CHANGESETS_OUTPUT),
        distTags: linesOf(join(state, "dist-tags.log")),
        publishTags: linesOf(join(state, "published-tags.log")),
        order: linesOf(join(state, "events.log")),
      };
    },
    dispose() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/** Path order, which a package-by-package loop over `pnpm -r ls` follows: a before b before c. */
const CHAIN = [
  { name: "a", deps: ["b"] },
  { name: "b", deps: ["c"] },
  { name: "c" },
  { name: "z" },
];

/** Run `body` on a fresh fixture and dispose it. */
function withFixture(packages, body) {
  const run = fixture(packages);
  try {
    body(run);
  } finally {
    run.dispose();
  }
}

/** Run the plan script on manifest lines and return its exit status, output and the plan it wrote. */
function plan(rows) {
  const dir = mkdtempSync(join(tmpdir(), "registry-plan-"));
  try {
    writeFileSync(join(dir, "plan.mjs"), PLAN_SCRIPT);
    const out = join(dir, "plan.tsv");
    const result = spawnSync("node", [join(dir, "plan.mjs"), "--plan", out], {
      input: rows
        .map((row) => JSON.stringify({ version: "1.0.0", dir: "/x", deps: [], ...row }))
        .join("\n"),
      encoding: "utf8",
    });
    return {
      status: result.status,
      stdout: result.stdout,
      text: existsSync(out) ? readFileSync(out, "utf8") : null,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("the plan keeps public packages in the order it is given and drops private ones", () => {
  const result = plan([{ name: "c" }, { name: "p", private: true }, { name: "b", deps: ["c"] }]);
  assert.equal(result.status, 0);
  assert.deepEqual(
    result.text
      .trim()
      .split("\n")
      .map((line) => line.split("\t")[0]),
    ["c", "b"],
  );
});

test("the plan refuses a package that comes before its dependency", () => {
  const result = plan([{ name: "b", deps: ["c"] }, { name: "c" }]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /::error title=Publish plan::b comes before its dependency c/);
  assert.equal(result.text, null);
});

test("the plan refuses a public package that depends on a private one", () => {
  const result = plan([
    { name: "p", private: true },
    { name: "a", deps: ["p"] },
  ]);
  assert.equal(result.status, 1);
  assert.match(
    result.stdout,
    /a depends on the private workspace package p, which is never published/,
  );
});

test("the manifest mode lists dependencies, optional and peer ones once each", () => {
  const dir = mkdtempSync(join(tmpdir(), "registry-manifest-"));
  try {
    writeFileSync(join(dir, "plan.mjs"), PLAN_SCRIPT);
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        name: "m",
        version: "2.0.0",
        dependencies: { x: "1" },
        optionalDependencies: { y: "1" },
        peerDependencies: { x: "1", z: "1" },
        devDependencies: { dev: "1" },
      }),
    );
    const manifest = JSON.parse(
      execFileSync("node", ["plan.mjs", "--manifest"], { cwd: dir, encoding: "utf8" }),
    );
    assert.deepEqual(manifest.deps.sort(), ["x", "y", "z"]);
    assert.equal(manifest.private, false);
    assert.equal(manifest.version, "2.0.0");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a release publishes dependencies first, the tarballs it checked, and tags each", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.ok(result.published.indexOf("@t/c") < result.published.indexOf("@t/b"));
    assert.ok(result.published.indexOf("@t/b") < result.published.indexOf("@t/a"));
    assert.equal(result.published.length, 4);
    // The tarball published is the one the pre-flight packed, not a second pack.
    for (const tarball of result.tarballs)
      assert.ok(tarball.startsWith(join(run.root, "registry-packs")), tarball);
    assert.deepEqual(result.tags.sort(), ["@t/a@1.0.0", "@t/b@1.0.0", "@t/c@1.0.0", "@t/z@1.0.0"]);
    assert.equal(result.events.length, 4);
    assert.match(result.output, /Preflight: 4 packages packed and checked/);
    assert.match(
      result.output,
      /All 4 packages are on the registry \(4 published, 0 already there\)/,
    );
  });
});

test("no token is on a command line: the ID and publish tokens reach curl through its config", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.ok(result.argv.some((line) => line.includes("--config -")));
    for (const secret of ["request-token", "id-token", "publish-token"])
      assert.ok(
        !result.argv.some((line) => line.includes(secret)),
        `${secret} is on a curl command line`,
      );
  });
});

test("children that read standard input cannot cost the run a package", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.equal(result.published.length, 4);
    // The shims really read what the script's standard input held.
    assert.ok(result.drained.length > 0, "no child read standard input");
  });
});

test("a loop fed from standard input is cut short by the same greedy readers (the control)", () => {
  withFixture(CHAIN, (run) => {
    const naive = `set -e
printf 'a\\nb\\nc\\n' | while IFS= read -r item; do git rev-parse HEAD > /dev/null; echo "saw $item"; done
`;
    writeFileSync(join(run.root, "naive.sh"), naive);
    const result = spawnSync("bash", [join(run.root, "naive.sh")], {
      cwd: run.root,
      env: {
        ...process.env,
        PATH: `${join(run.root, "bin")}:${process.env.PATH}`,
        STATE: run.state,
        REAL_GIT: execFileSync("which", ["git"], { encoding: "utf8" }).trim(),
        REAL_NODE: process.execPath,
      },
      encoding: "utf8",
    });
    assert.equal(result.stdout.trim(), "saw a");
  });
});

test("a version already on the registry with the same content is skipped, never republished; an existing tag is kept", () => {
  withFixture(CHAIN, (run) => {
    run.preload("c");
    run.tag("c");
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.ok(!result.published.includes("@t/c"));
    assert.match(result.output, /skip @t\/c@1\.0\.0: already on the registry, same content/);
    assert.match(result.output, /\(3 published, 1 already there\)/);
    assert.equal(result.events.length, 3);
    assert.ok(!result.events.some((event) => event.includes("@t/c@1.0.0")));
  });
});

test("a skipped version with the same content and no tag is tagged", () => {
  withFixture(CHAIN, (run) => {
    run.preload("c");
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.ok(result.tags.includes("@t/c@1.0.0"));
    assert.equal(result.events.length, 4);
  });
});

test("a version on the registry with other content stops the run before anything is published, and is not tagged", () => {
  withFixture(CHAIN, (run) => {
    run.preload("c", "sha512-NOT-THE-TARBALL");
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Registry check failed::@t\/c@1\.0\.0: mismatch: the registry holds @t\/c@1\.0\.0 with sha512-NOT-THE-TARBALL, this run packed sha512-/,
    );
    assert.deepEqual(result.published, []);
    assert.deepEqual(result.tags, []);
    assert.deepEqual(result.events, []);
    assert.match(result.output, /Not published \(4\):/);
  });
});

test("an answer that is neither present nor absent (3xx, 5xx, a timeout) stops the run as unavailable", () => {
  for (const [how, why] of [
    ["http:302", /HTTP 302/],
    ["http:500", /HTTP 500/],
    ["http:503", /HTTP 503/],
    ["http:403", /HTTP 403/],
    ["timeout", /did not answer/],
  ])
    withFixture(CHAIN, (run) => {
      run.answer("c", how);
      const result = run.run();
      assert.equal(result.status, 1, how);
      assert.match(
        result.output,
        /::error title=Registry check failed::@t\/c@1\.0\.0: unavailable: /,
        how,
      );
      assert.match(result.output, why, how);
      assert.deepEqual(result.published, [], how);
      assert.deepEqual(result.events, [], how);
    });
});

test("a transient publish failure is retried and the run succeeds", () => {
  withFixture(CHAIN, (run) => {
    run.failPublish("b", 2);
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.equal(result.published.filter((name) => name === "@t/b").length, 3);
    assert.match(result.output, /retry @t\/b@1\.0\.0: attempt 3/);
  });
});

test("a publish that reached the registry with this content and then failed is not published twice", () => {
  withFixture(CHAIN, (run) => {
    run.failPublish("b", 1, { registers: true });
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.equal(result.published.filter((name) => name === "@t/b").length, 1);
  });
});

test("a failed publish after which the registry holds other content under the version stops the run", () => {
  withFixture(CHAIN, (run) => {
    run.failPublish("b", 1, { registers: true, wrong: true });
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(result.output, /::error title=Registry check failed::@t\/b@1\.0\.0: mismatch/);
    assert.equal(result.published.filter((name) => name === "@t/b").length, 1);
    assert.ok(!result.tags.includes("@t/b@1.0.0"));
  });
});

test("a package that keeps failing stops the run, lists what is and is not published, and tags and announces nothing for it", () => {
  withFixture(CHAIN, (run) => {
    run.failPublish("b", 99);
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish stopped::@t\/b@1\.0\.0 failed after 3 attempts/,
    );
    const published = /Published in this run \((\d+)\):\n((?: {2}\S+\n)+)/.exec(result.output);
    assert.ok(published, result.output);
    // c and z, which pins nothing, went out before b failed; a never started.
    assert.equal(published[1], "2");
    assert.ok(published[2].includes("@t/c@1.0.0") && published[2].includes("@t/z@1.0.0"));
    const notPublished = /Not published \((\d+)\):\n((?: {2}\S+\n?)+)/.exec(result.output);
    assert.ok(notPublished, result.output);
    assert.ok(notPublished[2].includes("@t/b@1.0.0") && notPublished[2].includes("@t/a@1.0.0"));
    assert.ok(!notPublished[2].includes("@t/c@1.0.0"));
    // What is published is closed under its dependencies; the failed package and its dependent have no tag, no event.
    assert.ok(result.published.includes("@t/c") && !result.published.includes("@t/a"));
    for (const name of ["@t/b", "@t/a"]) {
      assert.ok(!result.tags.includes(`${name}@1.0.0`), `${name} was tagged`);
      assert.ok(
        !result.events.some((event) => event.includes(`${name}@1.0.0`)),
        `${name} was announced`,
      );
    }
    assert.deepEqual(result.tags.sort(), ["@t/c@1.0.0", "@t/z@1.0.0"]);
  });
});

test("a failure at one package, then a re-run, completes the release without republishing", () => {
  withFixture(CHAIN, (run) => {
    run.failPublish("b", 99);
    const first = run.run();
    assert.equal(first.status, 1);
    assert.equal(first.published.filter((name) => name === "@t/c").length, 1);
    // The failed run pushed no tags; the registry keeps what it published.
    run.forgetTags();
    run.failPublish("b", 0);
    const second = run.run();
    assert.equal(second.status, 0, second.output);
    assert.match(second.output, /skip @t\/c@1\.0\.0: already on the registry, same content/);
    for (const name of ["@t/a", "@t/c", "@t/z"])
      assert.equal(second.published.filter((published) => published === name).length, 1, name);
    assert.equal(second.published.filter((published) => published === "@t/b").length, 3 + 1);
    // c and z, published by the first run and untagged, are tagged by the resumed one: all four get an event.
    assert.deepEqual(second.tags.sort(), ["@t/a@1.0.0", "@t/b@1.0.0", "@t/c@1.0.0", "@t/z@1.0.0"]);
    assert.equal(second.events.length, 4);
  });
});

test("a version the registry never shows after a publish fails the final pass, and lists it", () => {
  withFixture(CHAIN, (run) => {
    run.hide("z");
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish incomplete::@t\/z@1\.0\.0 is not on the registry/,
    );
    assert.match(result.output, /Published in this run \(4\)/);
  });
});

test("a version the registry holds with other content after the publish fails the final pass", () => {
  withFixture(CHAIN, (run) => {
    run.tamper("z");
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish incomplete::@t\/z@1\.0\.0 mismatch: the registry holds @t\/z@1\.0\.0 with sha512-TAMPERED/,
    );
  });
});

test("a version the registry shows a moment late does not fail the run; one still absent after three checks does", () => {
  withFixture(CHAIN, (run) => {
    run.lag("z", 2);
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /All 4 packages are on the registry/);
  });
  withFixture(CHAIN, (run) => {
    run.lag("z", 5);
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish incomplete::@t\/z@1\.0\.0 is not on the registry/,
    );
  });
});

test("a failed publish that reached the registry, shown a moment late, is found by asking again and not published twice", () => {
  withFixture(CHAIN, (run) => {
    run.failPublish("b", 1, { registers: true });
    run.lag("b", 2);
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.equal(result.published.filter((name) => name === "@t/b").length, 1);
    assert.ok(result.tags.includes("@t/b@1.0.0"));
  });
});

test("a package whose main points at a file the tarball lacks stops the run in the pre-flight, with nothing published", () => {
  withFixture(
    [
      { name: "a", deps: ["c"] },
      { name: "c", main: "./dist/index.mjs" },
    ],
    (run) => {
      const result = run.run();
      assert.equal(result.status, 1);
      assert.match(result.output, /@t\/c@1\.0\.0: the tarball lacks dist\/index\.mjs/);
      assert.match(
        result.output,
        /::error title=Preflight failed::cannot pack: @t\/c@1\.0\.0\. Nothing was published/,
      );
      assert.deepEqual(result.published, []);
      assert.deepEqual(result.events, []);
    },
  );
});

test("a plan with no public package stops the run", () => {
  withFixture([{ name: "p", isPrivate: true }], (run) => {
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish plan::the plan has 0 packages and the workspace has 0 public ones/,
    );
    assert.deepEqual(result.published, []);
  });
});

test("a plan shorter than the workspace's public packages stops the run", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run({ extraEnv: { LS_EXTRA: "1" } });
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish plan::the plan has 4 packages and the workspace has 5 public ones/,
    );
    assert.deepEqual(result.published, []);
  });
});

test("a dependency cycle stops the run before anything is packed or published", () => {
  withFixture(
    [
      { name: "a", deps: ["b"] },
      { name: "b", deps: ["a"] },
    ],
    (run) => {
      const result = run.run();
      assert.equal(result.status, 1);
      // pnpm refuses the cycle itself, and the pipeline's pipefail ends the run with no plan and nothing published.
      assert.match(result.output, /ERR_PNPM_TASK_CYCLE/);
      assert.deepEqual(result.published, []);
    },
  );
});

test("a cycle through devDependencies only also stops the run: pnpm refuses it, though consumers never install them", () => {
  withFixture(
    [
      { name: "a", devDeps: ["b"] },
      { name: "b", devDeps: ["a"] },
    ],
    (run) => {
      const result = run.run();
      assert.equal(result.status, 1);
      assert.match(result.output, /ERR_PNPM_TASK_CYCLE/);
      assert.deepEqual(result.published, []);
    },
  );
});

test("a public package on a private one stops the run before anything is published", () => {
  withFixture(
    [
      { name: "a", deps: ["p"] },
      { name: "p", isPrivate: true },
    ],
    (run) => {
      const result = run.run();
      assert.equal(result.status, 1);
      assert.match(result.output, /@t\/a depends on the private workspace package @t\/p/);
      assert.deepEqual(result.published, []);
    },
  );
});

test("the pre-flight packs every package, even one already on the registry, and stops with nothing published", () => {
  withFixture(
    [
      { name: "a", deps: ["b"] },
      { name: "b", deps: ["c"] },
      { name: "c", prepack: "exit 1" },
    ],
    (run) => {
      const result = run.run();
      assert.equal(result.status, 1);
      assert.match(
        result.output,
        /::error title=Preflight failed::cannot pack: @t\/c@1\.0\.0\. Nothing was published/,
      );
      assert.deepEqual(result.published, []);
      assert.deepEqual(result.events, []);
    },
  );
  withFixture([{ name: "a", deps: ["c"] }, { name: "c" }], (run) => {
    run.preload("c");
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /Preflight: 2 packages packed and checked/);
  });
});

/** A tarball with the given package.json and files, as `pnpm pack` writes one: everything under `package/`. */
function makeTarball(manifest, files = ["LICENSE"], contents = {}) {
  const dir = mkdtempSync(join(tmpdir(), "registry-tarball-"));
  mkdirSync(join(dir, "package"));
  writeFileSync(join(dir, "package", "package.json"), JSON.stringify(manifest));
  for (const file of files) {
    mkdirSync(dirname(join(dir, "package", file)), { recursive: true });
    writeFileSync(join(dir, "package", file), "x\n");
  }
  for (const [file, bytes] of Object.entries(contents))
    writeFileSync(join(dir, "package", file), bytes);
  execFileSync("tar", ["-czf", join(dir, "t.tgz"), "-C", dir, "package"]);
  return { dir, file: join(dir, "t.tgz") };
}

/** Run the verify mode of the plan script on a tarball. */
function verify(manifest, files, expected = ["@t/a", "1.0.0"], contents = {}) {
  const { dir, file } = makeTarball(manifest, files, contents);
  try {
    writeFileSync(join(dir, "plan.mjs"), PLAN_SCRIPT);
    const result = spawnSync("node", [join(dir, "plan.mjs"), "--verify", file, ...expected], {
      encoding: "utf8",
    });
    return { status: result.status, stdout: result.stdout, integrity: integrityOf(file) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("verify passes a tarball that names its package, has no workspace protocol left and carries a LICENSE, and prints its integrity", () => {
  const good = { name: "@t/a", version: "1.0.0", dependencies: { "@t/b": "1.0.0" } };
  const result = verify(good);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), result.integrity);
  assert.match(result.stdout, /^sha512-[A-Za-z0-9+/]+=*\n$/);
});

test("verify refuses a wrong name or version, a leftover protocol and a missing LICENSE", () => {
  const good = { name: "@t/a", version: "1.0.0" };
  assert.match(verify({ ...good, name: "@t/x" }).stdout, /package\.json names @t\/x/);
  assert.match(verify({ ...good, version: "2.0.0" }).stdout, /package\.json says 2\.0\.0/);
  for (const [field, range] of [
    ["dependencies", "workspace:*"],
    ["peerDependencies", "catalog:frontend"],
    ["optionalDependencies", "link:../x"],
  ])
    assert.match(
      verify({ ...good, [field]: { "@t/b": range } }).stdout,
      new RegExp(`${field}\\.@t/b is still ${range}`),
    );
  const missing = verify(good, []);
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /no LICENSE file/);
});

test("verify refuses a tarball that lacks a file package.json points at: main, types, bin and every exports leaf", () => {
  const manifest = {
    name: "@t/a",
    version: "1.0.0",
    main: "./dist/index.mjs",
    types: "./dist/index.d.mts",
    bin: { tool: "./dist/tool.mjs" },
    exports: {
      ".": { types: "./dist/index.d.mts", default: "./dist/index.mjs" },
      "./node": { default: "./dist/node.mjs" },
    },
  };
  const everything = [
    "LICENSE",
    "dist/index.mjs",
    "dist/index.d.mts",
    "dist/tool.mjs",
    "dist/node.mjs",
  ];
  assert.equal(verify(manifest, everything).status, 0);
  // Nothing but package.json and LICENSE: what a pack of a package whose build was skipped looks like.
  const bare = verify(manifest, ["LICENSE"]);
  assert.equal(bare.status, 1);
  assert.match(
    bare.stdout,
    /the tarball lacks dist\/index\.mjs, dist\/index\.d\.mts, dist\/tool\.mjs, dist\/node\.mjs/,
  );
  // Only a `bin` target missing.
  const noBin = verify(
    manifest,
    everything.filter((file) => file !== "dist/tool.mjs"),
  );
  assert.equal(noBin.status, 1);
  assert.match(noBin.stdout, /the tarball lacks dist\/tool\.mjs/);
  // A string `bin`, wildcard export patterns and a blocked (null) condition are not entry points to find.
  assert.equal(
    verify(
      {
        name: "@t/a",
        version: "1.0.0",
        bin: "./cli.mjs",
        exports: { "./*": "./dist/*.mjs", "./x": null },
      },
      ["LICENSE", "cli.mjs"],
    ).status,
    0,
  );
});

test("the script keeps no descriptor open and counts lines without wc", () => {
  assert.doesNotMatch(PUBLISH_SCRIPT, /\bexec 3</);
  assert.doesNotMatch(PUBLISH_SCRIPT, /\bwc -l\b/);
  assert.doesNotMatch(PUBLISH_SCRIPT, /read -r -u 3/);
});

test("the dry run step runs the publish script read-only, and no longer calls pnpm publish", () => {
  const step = WORKFLOW.slice(WORKFLOW.indexOf("- name: Publish dry run"));
  const body = step.slice(0, step.indexOf("\n\n"));
  assert.match(body, /DRY_RUN: "true"/);
  assert.match(body, /bash "\$RUNNER_TEMP\/registry-publish\.sh"/);
  assert.doesNotMatch(body, /pnpm -r publish/);
});

test("every curl call is bounded and retried: the wrapper's flags are in the script and on every call", () => {
  assert.match(
    PUBLISH_SCRIPT,
    /curl\(\) \{ command curl -sS --connect-timeout 10 --max-time 20 --retry 3 --retry-delay 5 "\$@"; \}/,
  );
  withFixture(CHAIN, (run) => {
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.ok(result.argv.length > 8);
    for (const line of result.argv)
      for (const flag of ["--connect-timeout 10", "--max-time 20", "--retry 3"])
        assert.ok(line.includes(flag), `a curl call lacks ${flag}: ${line}`);
  });
});

test("a registry that answers 503 once and then 200 is read as present: the wrapper's retry covers it", () => {
  withFixture(CHAIN, (run) => {
    run.preload("c");
    run.answer("c", "seq:503,200");
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /skip @t\/c@1\.0\.0: already on the registry, same content/);
  });
});

test("a registry that keeps answering 503 is unavailable after the retries, not absent", () => {
  withFixture(CHAIN, (run) => {
    run.answer("c", "seq:503,503,503,503,503");
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(result.output, /@t\/c@1\.0\.0: unavailable: the registry answered HTTP 503/);
    assert.deepEqual(result.published, []);
  });
});

test("without the wrapper's --retry the same one-off 503 would stop the run (the control)", () => {
  withFixture(CHAIN, (run) => {
    run.preload("c");
    run.answer("c", "seq:503,200");
    const bare = PUBLISH_SCRIPT.replace(
      /curl\(\) \{ command curl [^}]*\}/,
      'curl() { command curl -sS "$@"; }',
    );
    assert.notEqual(bare, PUBLISH_SCRIPT);
    writeFileSync(join(run.root, "registry-publish.sh"), bare);
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(result.output, /unavailable: the registry answered HTTP 503/);
  });
});

test("a pnpm ls that prints nothing stops the run instead of skipping the count check; an empty list stops it too", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run({ extraEnv: { LS_EMPTY: "silent" } });
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish plan::pnpm did not report how many public packages the workspace has \(got ''\)/,
    );
    assert.deepEqual(result.published, []);
  });
  withFixture(CHAIN, (run) => {
    const result = run.run({ extraEnv: { LS_EMPTY: "list" } });
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish plan::the plan has 4 packages and the workspace has 0 public ones/,
    );
    assert.deepEqual(result.published, []);
  });
});

test("the dry run packs and checks every package, reads the registry, and publishes, tags and announces nothing", () => {
  withFixture(CHAIN, (run) => {
    run.preload("c");
    const result = run.run({ extraEnv: { DRY_RUN: "true", CHANGESETS_OUTPUT: "" } });
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /Preflight: 4 packages packed and checked/);
    assert.match(result.output, /would skip @t\/c@1\.0\.0: on the registry, same content/);
    for (const name of ["a", "b", "z"])
      assert.match(result.output, new RegExp(`would publish @t/${name}@1\\.0\\.0`));
    assert.match(
      result.output,
      /Dry run: 3 would be published, 1 already there; nothing was published, tagged or announced/,
    );
    assert.deepEqual(result.published, []);
    assert.deepEqual(result.tarballs, []);
    assert.deepEqual(result.tags, []);
    assert.deepEqual(result.events, []);
    // It never asked for a token: no ID-token or exchange call, only reads of version documents.
    assert.ok(
      !result.argv.some(
        (line) => line.includes("oidc/token/exchange") || line.includes("audience="),
      ),
    );
  });
});

test("the dry run stops on the same findings the publish would: other content, an unreadable registry, an unpackable package", () => {
  withFixture(CHAIN, (run) => {
    run.preload("c", "sha512-NOT-THE-TARBALL");
    const result = run.run({ extraEnv: { DRY_RUN: "true" } });
    assert.equal(result.status, 1);
    assert.match(result.output, /::error title=Dry run::@t\/c@1\.0\.0: mismatch:/);
    assert.deepEqual(result.published, []);
  });
  withFixture(CHAIN, (run) => {
    run.answer("b", "http:503");
    const result = run.run({ extraEnv: { DRY_RUN: "true" } });
    assert.equal(result.status, 1);
    assert.match(result.output, /::error title=Dry run::@t\/b@1\.0\.0: unavailable:/);
    assert.match(result.output, /would publish @t\/c@1\.0\.0/);
  });
  withFixture([{ name: "a", main: "./dist/index.mjs" }], (run) => {
    const result = run.run({ extraEnv: { DRY_RUN: "true" } });
    assert.equal(result.status, 1);
    assert.match(result.output, /::error title=Preflight failed::cannot pack: @t\/a@1\.0\.0/);
  });
});

test("verify refuses a tarball over the registry's size limits, which are the Worker's own", () => {
  const wrangler = readFileSync("workers/registry/wrangler.jsonc", "utf8");
  const limit = (name) => Number(new RegExp(`"${name}":\\s*(\\d+)`).exec(wrangler)[1]);
  assert.equal(limit("REGISTRY_MAX_TARBALL_BYTES"), 52_428_800);
  assert.equal(limit("REGISTRY_MAX_UNPACKED_BYTES"), 104_857_600);
  assert.match(PLAN_SCRIPT, /MAX_TARBALL_BYTES = 52428800;/);
  assert.match(PLAN_SCRIPT, /MAX_UNPACKED_BYTES = 104857600;/);
  const manifest = { name: "@t/a", version: "1.0.0" };
  // 105 MB of zeros compresses to a few kilobytes: over the unpacked limit, far under the tarball one.
  const unpacked = verify(manifest, ["LICENSE"], ["@t/a", "1.0.0"], {
    "big.bin": Buffer.alloc(105 * 1024 * 1024),
  });
  assert.equal(unpacked.status, 1);
  assert.match(unpacked.stdout, /the tarball unpacks to more than 104857600 bytes/);
  // 51 MiB of random bytes does not compress: over the tarball limit.
  const heavy = verify(manifest, ["LICENSE"], ["@t/a", "1.0.0"], {
    "big.bin": randomBytes(51 * 1024 * 1024),
  });
  assert.equal(heavy.status, 1);
  assert.match(heavy.stdout, /the tarball is over 52428800 bytes/);
});

/** Run the plan script's `--closure` on hand-made tarballs and packuments: `{ packages: [{ name, version, deps, peers }], registry: { name: [versions] } }`. */
function closure({ packages, registry = {} }, mode = "plan") {
  const dir = mkdtempSync(join(tmpdir(), "registry-closure-"));
  try {
    writeFileSync(join(dir, "plan.mjs"), PLAN_SCRIPT);
    const docs = join(dir, "packuments");
    mkdirSync(docs);
    for (const [name, versions] of Object.entries(registry))
      writeFileSync(
        join(docs, `${name.replace("/", "%2f")}.json`),
        JSON.stringify({
          name,
          versions: Object.fromEntries(versions.map((version) => [version, {}])),
        }),
      );
    const packed = packages.map(({ name, version = "1.0.0", deps = {}, peers }, index) => {
      const root = join(dir, `p${index}`);
      mkdirSync(join(root, "package"), { recursive: true });
      writeFileSync(
        join(root, "package", "package.json"),
        JSON.stringify({
          name,
          version,
          dependencies: deps,
          ...(peers ? { peerDependencies: peers } : {}),
        }),
      );
      execFileSync("tar", ["-czf", join(root, "p.tgz"), "-C", root, "package"]);
      return `${name}\t${version}\tsha512-X\t${join(root, "p.tgz")}\n`;
    });
    writeFileSync(join(dir, "packed.tsv"), packed.join(""));
    const names = spawnSync(
      "node",
      [join(dir, "plan.mjs"), "--closure-names", join(dir, "packed.tsv"), mode],
      {
        encoding: "utf8",
      },
    );
    const result = spawnSync(
      "node",
      [join(dir, "plan.mjs"), "--closure", join(dir, "packed.tsv"), docs, mode],
      {
        encoding: "utf8",
      },
    );
    return {
      status: result.status,
      stdout: result.stdout,
      names: names.stdout.trim().split("\n").filter(Boolean),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("the closure reads ranges as npm does: exact, caret, tilde, comparators, x-ranges, hyphens, unions and prereleases", () => {
  const cases = [
    ["1.2.3", "1.2.3", true],
    ["1.2.3", "1.2.4", false],
    ["=1.2.3", "1.2.3", true],
    ["v1.2.3", "1.2.3", true],
    ["^1.2.3", "1.9.0", true],
    ["^1.2.3", "2.0.0", false],
    ["^1.2.3", "1.2.2", false],
    ["^0.2.3", "0.2.9", true],
    ["^0.2.3", "0.3.0", false],
    ["^0.0.3", "0.0.3", true],
    ["^0.0.3", "0.0.4", false],
    ["^0", "0.9.0", true],
    ["^0.0", "0.1.0", false],
    ["~1.2.3", "1.2.9", true],
    ["~1.2.3", "1.3.0", false],
    ["~1", "1.9.0", true],
    ["~1", "2.0.0", false],
    [">=0.11.0", "0.12.0", true],
    [">=0.11.0", "0.10.9", false],
    [">= 1.0.0 < 2", "1.5.0", true],
    [">= 1.0.0 < 2", "2.0.0", false],
    [">1.2", "1.2.9", false],
    [">1.2", "1.3.0", true],
    ["<=1.2", "1.2.9", true],
    ["<1.2", "1.2.0", false],
    ["1.x", "1.5.0", true],
    ["1.x", "2.0.0", false],
    ["1.2.*", "1.2.7", true],
    ["*", "0.0.1", true],
    ["", "3.0.0", true],
    ["1.2.3 - 1.4", "1.4.7", true],
    ["1.2.3 - 1.4", "1.5.0", false],
    ["1.2.3 - 1.4", "1.2.2", false],
    ["<1.0.0 || >=3", "3.1.0", true],
    ["<1.0.0 || >=3", "2.0.0", false],
    ["^1.0.0", "1.1.0-beta.1", false],
    ["*", "1.0.0-rc.1", false],
    ["^1.1.0-beta.0", "1.1.0-beta.1", true],
    ["^1.1.0-beta.2", "1.1.0-beta.10", true],
    ["^1.1.0-beta.2", "1.1.0-beta.1", false],
    ["1.1.0-next.0", "1.1.0-next.0", true],
  ];
  for (const [range, version, met] of cases) {
    const result = closure({
      packages: [{ name: "@t/a", deps: { "@t/ext": range } }],
      registry: { "@t/ext": [version] },
    });
    assert.equal(result.status === 0, met, `${range} against ${version}: ${result.stdout}`);
  }
});

test("the closure refuses a specifier it cannot read as a range, and follows an npm: alias into the plan's scopes", () => {
  for (const spec of [
    "github:t/ext",
    "file:../ext",
    "https://t.test/ext.tgz",
    "latest",
    "1.2.3.4",
  ]) {
    const result = closure({
      packages: [{ name: "@t/a", deps: { "@t/ext": spec } }],
      registry: { "@t/ext": ["1.2.3"] },
    });
    assert.equal(result.status, 1, spec);
    assert.match(
      result.stdout,
      /names @t\/ext as ".*" in dependencies, which is not a version range/,
    );
  }
  const alias = closure({ packages: [{ name: "@t/a", deps: { renamed: "npm:@t/gone@^1.0.0" } }] });
  assert.equal(alias.status, 1);
  assert.match(alias.stdout, /@t\/a@1\.0\.0 needs @t\/gone@\^1\.0\.0 \(dependencies\)/);
  // Another scope is not the release's business: its packages come from their own registry.
  const foreign = closure({
    packages: [{ name: "@t/a", deps: { "@other/x": "9.9.9", left: "1.0.0" } }],
  });
  assert.equal(foreign.status, 0, foreign.stdout);
});

test("before the publish a version of the release counts; before a dist-tag move only the registry does", () => {
  const release = {
    packages: [
      { name: "@t/cli", deps: { "@t/runway": "1.0.0" } },
      { name: "@t/runway", deps: { "@t/iam": "1.0.0" }, peers: { "@t/ext": ">=0.11.0" } },
      { name: "@t/iam" },
    ],
    registry: { "@t/ext": ["0.12.0"] },
  };
  const before = closure(release, "plan");
  assert.equal(before.status, 0, before.stdout);
  assert.match(
    before.stdout,
    /Closure: 3 dependencies of 3 packages, each met by this release or the registry/,
  );
  // Only what the release does not meet itself is read from the registry.
  assert.deepEqual(before.names, ["@t/ext"]);
  // The 0.33.1 shape: cli and runway on the registry, iam answering 404.
  const after = closure(
    { ...release, registry: { ...release.registry, "@t/cli": ["1.0.0"], "@t/runway": ["1.0.0"] } },
    "registry",
  );
  assert.equal(after.status, 1);
  assert.match(
    after.stdout,
    /::error title=Closure incomplete::@t\/iam@1\.0\.0 is not on the registry/,
  );
  assert.match(
    after.stdout,
    /::error title=Closure incomplete::@t\/runway@1\.0\.0 needs @t\/iam@1\.0\.0 \(dependencies\), and no such version is on the registry/,
  );
  assert.deepEqual(after.names, ["@t/cli", "@t/ext", "@t/iam", "@t/runway"]);
});

test("every version goes out under the holding tag and latest moves only after the last publish, once per package", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.deepEqual(
      result.publishTags.map((line) => line.split(" ")[1]),
      ["release-pending", "release-pending", "release-pending", "release-pending"],
    );
    const lastPublish = result.order.findLastIndex((line) => line.startsWith("publish "));
    const firstMove = result.order.findIndex((line) => line.startsWith("PUT "));
    assert.ok(lastPublish < firstMove, result.order.join("\n"));
    assert.deepEqual(result.distTags.filter((line) => line.startsWith("PUT ")).sort(), [
      "PUT @t/a latest 1.0.0",
      "PUT @t/b latest 1.0.0",
      "PUT @t/c latest 1.0.0",
      "PUT @t/z latest 1.0.0",
    ]);
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { latest: "1.0.0" });
    assert.match(
      result.output,
      /Closure: 2 dependencies of 4 packages, each met by this release or the registry/,
    );
    assert.match(result.output, /Closure: 2 dependencies of 4 packages, each met by the registry/);
    assert.match(
      result.output,
      /Dist-tags: 4 moved after the closure check; release-pending dropped where it was set/,
    );
  });
});

test("a dependency neither in the release nor on the registry stops the run before anything is published", () => {
  withFixture(
    [
      { name: "a", deps: ["b"] },
      { name: "b", ranges: { "@t/gone": "1.0.0" } },
    ],
    (run) => {
      const result = run.run();
      assert.equal(result.status, 1);
      assert.match(
        result.output,
        /::error title=Closure incomplete::@t\/b@1\.0\.0 needs @t\/gone@1\.0\.0 \(dependencies\), and no such version is in this release or on the registry/,
      );
      assert.match(result.output, /Nothing was published\./);
      assert.deepEqual(result.published, []);
      assert.deepEqual(result.distTags, []);
      assert.deepEqual(result.tags, []);
    },
  );
});

test("a dependency the registry serves outside the release is met by its range; one it cannot meet stops the run", () => {
  withFixture(
    [{ name: "a", ranges: { "@t/ext": "^2.1.0" }, peers: { "@t/peer": ">=0.11.0" } }],
    (run) => {
      run.onRegistry("ext", "2.3.0");
      run.onRegistry("peer", "0.12.0");
      const result = run.run();
      assert.equal(result.status, 0, result.output);
      assert.deepEqual(run.tagsOf("a"), { latest: "1.0.0" });
    },
  );
  withFixture([{ name: "a", ranges: { "@t/ext": "^2.1.0" } }], (run) => {
    run.onRegistry("ext", "3.0.0");
    run.onRegistry("ext", "2.1.0-beta.1");
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(result.output, /@t\/a@1\.0\.0 needs @t\/ext@\^2\.1\.0 \(dependencies\)/);
    assert.deepEqual(result.published, []);
  });
});

test("a packument the registry cannot serve stops the closure check as unavailable, not as missing", () => {
  withFixture([{ name: "a", ranges: { "@t/ext": "^2.1.0" } }], (run) => {
    run.onRegistry("ext", "2.3.0");
    run.answerPackument("ext", "http:503");
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Registry check failed::@t\/ext: unavailable: the registry answered 503/,
    );
    assert.deepEqual(result.published, []);
  });
});

test("a gap the registry shows after the publish stops the run before any dist-tag moves", () => {
  withFixture([{ name: "a", ranges: { "@t/ext": "2.0.0" } }], (run) => {
    run.onRegistry("ext", "2.0.0");
    // Served to the pre-flight's read, gone by the read before the dist-tag move.
    run.vanish("ext", 1);
    const result = run.run();
    assert.equal(result.status, 1);
    assert.deepEqual(result.published, ["@t/a"]);
    assert.match(
      result.output,
      /::error title=Closure incomplete::@t\/a@1\.0\.0 needs @t\/ext@2\.0\.0 \(dependencies\), and no such version is on the registry/,
    );
    assert.match(result.output, /no dist-tag was moved/);
    assert.deepEqual(result.distTags, []);
    assert.deepEqual(run.tagsOf("a"), { "release-pending": "1.0.0" });
    assert.match(
      result.output,
      /Dist-tags moved \(0\); every other version stays under release-pending/,
    );
  });
});

test("a run that stops half way moves no dist-tag; the re-run moves latest for everything, the earlier run's versions too", () => {
  withFixture(CHAIN, (run) => {
    run.failPublish("a", 5);
    const first = run.run();
    assert.equal(first.status, 1);
    assert.ok(first.published.includes("@t/c"));
    assert.deepEqual(first.distTags, []);
    assert.deepEqual(run.tagsOf("c"), { "release-pending": "1.0.0" });
    assert.match(first.output, /latest has not moved/);
    run.forgetTags();
    run.failPublish("a", 0);
    const second = run.run();
    assert.equal(second.status, 0, second.output);
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { latest: "1.0.0" });
  });
});

test("latest never moves back, a prerelease gets the tag it names and never latest, and an untouched latest is left alone", () => {
  withFixture(
    [
      { name: "a", deps: ["n"] },
      { name: "n", version: "1.1.0-next.0" },
      { name: "old" },
      { name: "same" },
    ],
    (run) => {
      run.onRegistry("old", "2.0.0");
      run.setTags("old", { latest: "2.0.0" });
      run.preload("same");
      run.setTags("same", { latest: "1.0.0" });
      const result = run.run();
      assert.equal(result.status, 0, result.output);
      assert.deepEqual(run.tagsOf("n"), { next: "1.1.0-next.0" });
      assert.deepEqual(run.tagsOf("old"), { latest: "2.0.0" });
      assert.match(
        result.output,
        /::notice title=Dist-tag::@t\/old: latest stays at 2\.0\.0, newer than 1\.0\.0/,
      );
      assert.deepEqual(run.tagsOf("same"), { latest: "1.0.0" });
      assert.ok(
        !result.distTags.some((line) => line.includes("@t/same")),
        result.distTags.join("\n"),
      );
      assert.deepEqual(run.tagsOf("a"), { latest: "1.0.0" });
    },
  );
});

test("a dist-tag move that fails is retried; one that keeps failing stops the run, names it and lists the moves made", () => {
  withFixture(CHAIN, (run) => {
    run.failTag("a", 1);
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /retry dist-tag @t\/a@1\.0\.0: attempt 2/);
    assert.deepEqual(run.tagsOf("a"), { latest: "1.0.0" });
  });
  withFixture(CHAIN, (run) => {
    run.failTag("a", 9);
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Dist-tag not moved::@t\/a@1\.0\.0: latest after 3 attempts/,
    );
    assert.match(
      result.output,
      /Dist-tags moved \(\d\); every other version stays under release-pending:/,
    );
    // Its dependencies moved before it (plan order); it keeps the holding tag.
    for (const name of ["b", "c"]) assert.deepEqual(run.tagsOf(name), { latest: "1.0.0" });
    assert.deepEqual(run.tagsOf("a"), { "release-pending": "1.0.0" });
  });
});

test("the dist-tag moves carry the publish token in curl's config, never on its command line", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    const writes = result.argv.filter((line) => line.includes("/dist-tags/"));
    assert.equal(writes.length, 8);
    for (const line of writes) {
      assert.match(line, /--config -/);
      assert.ok(!line.includes("publish-token"), line);
    }
  });
});

test("the dry run walks the closure too and stops on a gap, with nothing published and no token asked for", () => {
  withFixture([{ name: "a", ranges: { "@t/gone": "1.0.0" } }], (run) => {
    const result = run.run({ extraEnv: { DRY_RUN: "true" } });
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Closure incomplete::@t\/a@1\.0\.0 needs @t\/gone@1\.0\.0/,
    );
    assert.deepEqual(result.published, []);
    assert.ok(!result.argv.some((line) => line.includes("oidc/token/exchange")));
  });
  withFixture(CHAIN, (run) => {
    const result = run.run({ extraEnv: { DRY_RUN: "true" } });
    assert.equal(result.status, 0, result.output);
    assert.match(
      result.output,
      /Closure: 2 dependencies of 4 packages, each met by this release or the registry/,
    );
    assert.deepEqual(result.distTags, []);
  });
});

/**
 * A consumer smoke for the fixture (STA-2874): a bash script that records what it was given (its environment, its
 * working folder, its HOME's contents and the release file) under `<root>/smoke-<n>`, appends `smoke` to the shims'
 * event log, and exits `status`. It names its paths literally: the script's environment does not reach it.
 */
function smoke(run, status = 0) {
  const script = join(run.root, "smoke.sh");
  writeFileSync(
    script,
    [
      "set -u",
      `n=$(ls -d "${run.root}"/smoke-* 2>/dev/null | wc -l)`,
      `out="${run.root}/smoke-$((n + 1))"`,
      'mkdir -p "$out"',
      'env | sort > "$out/env"',
      'pwd > "$out/cwd"',
      'ls -A "$HOME" > "$out/home"',
      'cat "$RUNWAY_RELEASE" > "$out/release"',
      `echo smoke >> "${run.state}/events.log"`,
      `exit ${status}`,
      "",
    ].join("\n"),
  );
  return `bash ${script}`;
}

/** What each smoke run recorded, oldest first. */
function smokeRuns(run) {
  const runs = [];
  for (let n = 1; existsSync(join(run.root, `smoke-${n}`)); n++) {
    const read = (file) => readFileSync(join(run.root, `smoke-${n}`, file), "utf8");
    runs.push({
      env: Object.fromEntries(
        read("env")
          .trim()
          .split("\n")
          .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
      ),
      cwd: read("cwd").trim(),
      home: read("home").trim(),
      release: read("release").trim().split("\n"),
    });
  }
  return runs;
}

/** The release job with the smoke: publish, and leave the moves for the consumer-smoke and promote jobs. */
const deferred = (run, command) =>
  run.run({ extraEnv: { PROMOTE_LATEST_AFTER: "consumer-smoke", CONSUMER_SMOKE: command } });

/** The consumer-smoke job's script, with the job's command, and anything `extraEnv` adds to the step's environment. */
const smokeJob = (run, command, extraEnv = {}) =>
  run.run({ script: "registry-smoke.sh", extraEnv: { CONSUMER_SMOKE: command, ...extraEnv } });

/** The promote job's script with the release job's sha256 output (or `sha256`). */
const promoteJob = (run, sha256 = run.promotion()?.sha256 ?? "") =>
  run.run({ script: "registry-promote.sh", extraEnv: { PROMOTION_SHA256: sha256 } });

test("with consumer-smoke, the release job moves no dist-tag, runs no smoke and leaves the moves for the next jobs", () => {
  withFixture(CHAIN, (run) => {
    const result = deferred(run, smoke(run));
    assert.equal(result.status, 0, result.output);
    assert.deepEqual([...result.published].sort(), ["@t/a", "@t/b", "@t/c", "@t/z"]);
    assert.deepEqual(result.distTags, [], "no dist-tag moves in the job that holds the tokens");
    assert.equal(smokeRuns(run).length, 0, "the smoke never runs in the release job");
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { "release-pending": "1.0.0" });
    const promotion = run.promotion();
    assert.deepEqual([...promotion.moves].sort(), [
      "@t/a\t1.0.0\tlatest\tdrop",
      "@t/b\t1.0.0\tlatest\tdrop",
      "@t/c\t1.0.0\tlatest\tdrop",
      "@t/z\t1.0.0\tlatest\tdrop",
    ]);
    assert.deepEqual([...promotion.release].sort(), [
      "@t/a\t1.0.0",
      "@t/b\t1.0.0",
      "@t/c\t1.0.0",
      "@t/z\t1.0.0",
    ]);
    assert.match(result.output, /4 moves wait for the consumer-smoke job/);
  });
});

test("the release job's script cannot start the smoke: it holds no env -i and never runs the command", () => {
  assert.doesNotMatch(PUBLISH_SCRIPT, /\$CONSUMER_SMOKE"/);
  assert.doesNotMatch(PUBLISH_SCRIPT, /\benv -i\b/);
  assert.match(SMOKE_SCRIPT, /bash -c "\$CONSUMER_SMOKE"/);
});

test("the smoke job runs the command as a clean consumer: only PATH, LANG, an empty new HOME, the release and registry", () => {
  withFixture(CHAIN, (run) => {
    const command = smoke(run);
    assert.equal(deferred(run, command).status, 0);
    const result = smokeJob(run, command, {
      GITHUB_TOKEN: "read-only-token",
      CI: "true",
      GITHUB_ACTIONS: "true",
    });
    assert.equal(result.status, 0, result.output);
    const [{ env, cwd, home, release }] = smokeRuns(run);
    assert.deepEqual(
      Object.keys(env)
        .filter((key) => !["_", "PWD", "SHLVL", "OLDPWD"].includes(key))
        .sort(),
      ["HOME", "LANG", "PATH", "RUNWAY_REGISTRY", "RUNWAY_RELEASE"],
    );
    assert.equal(env.RUNWAY_REGISTRY, REGISTRY);
    assert.notEqual(env.HOME, process.env.HOME);
    assert.equal(home, "", "HOME starts empty: no .npmrc, no cache, no store");
    assert.equal(cwd, run.root);
    assert.deepEqual(release.sort(), ["@t/a\t1.0.0", "@t/b\t1.0.0", "@t/c\t1.0.0", "@t/z\t1.0.0"]);
    assert.match(result.output, /Consumer smoke passed; the promote job moves the dist-tags/);
  });
});

test("after a passing smoke the promote job moves the release job's dist-tags: last publish < smoke < first move", () => {
  withFixture(CHAIN, (run) => {
    const command = smoke(run);
    assert.equal(deferred(run, command).status, 0);
    assert.equal(smokeJob(run, command).status, 0);
    const result = promoteJob(run);
    assert.equal(result.status, 0, result.output);
    const lastPublish = result.order.findLastIndex((line) => line.startsWith("publish "));
    const smokeAt = result.order.indexOf("smoke");
    const firstMove = result.order.findIndex((line) => line.startsWith("PUT "));
    assert.ok(lastPublish < smokeAt && smokeAt < firstMove, result.order.join("\n"));
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { latest: "1.0.0" });
    assert.match(
      result.output,
      /Dist-tags: 4 moved after the consumer smoke; release-pending dropped/,
    );
    for (const line of result.argv)
      assert.ok(!line.includes("publish-token") && !line.includes("request-token"), line);
  });
});

test("a failed smoke fails its job with every version under release-pending; a re-run that passes lets promote move latest", () => {
  withFixture(CHAIN, (run) => {
    assert.equal(deferred(run, smoke(run, 1)).status, 0);
    const failed = smokeJob(run, smoke(run, 1));
    assert.equal(failed.status, 1);
    assert.match(
      failed.output,
      /Consumer smoke failed::a clean consumer could not use this release/,
    );
    assert.match(failed.output, /latest has not moved/);
    assert.deepEqual(failed.distTags, []);
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { "release-pending": "1.0.0" });
    // Re-run the failed jobs: the smoke again, then promote; nothing is published again.
    assert.equal(smokeJob(run, smoke(run)).status, 0);
    const promoted = promoteJob(run);
    assert.equal(promoted.status, 0, promoted.output);
    assert.equal(smokeRuns(run).length, 2);
    assert.equal(promoted.published.length, 4, "nothing is published twice");
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { latest: "1.0.0" });
  });
});

test("the promote job moves nothing when the plan is not the release job's, has no sha256, or holds a bad line", () => {
  withFixture(CHAIN, (run) => {
    assert.equal(deferred(run, smoke(run)).status, 0);
    const { dir, sha256 } = run.promotion();
    const moves = join(dir, "moves.tsv");
    const original = readFileSync(moves, "utf8");
    // Another plan under the artifact's name (a downgrade of latest): its sha256 is not the release job's output.
    writeFileSync(moves, original.replaceAll("1.0.0", "0.9.0"));
    const forged = promoteJob(run, sha256);
    assert.equal(forged.status, 1);
    assert.match(forged.output, /not the one the release job wrote/);
    writeFileSync(moves, original);
    for (const missing of ["", "not-a-digest"]) {
      const result = promoteJob(run, missing);
      assert.equal(result.status, 1);
      assert.match(result.output, /no sha256 from the release job/);
    }
    // A line that is not name, version, tag, drop stops before any tag moves, even with a matching digest.
    writeFileSync(moves, `${original}@t/a\t1.0.0\tlatest;rm\tdrop\n`);
    const bad = promoteJob(run, createHash("sha256").update(readFileSync(moves)).digest("hex"));
    assert.equal(bad.status, 1);
    assert.match(bad.output, /is not name, version, tag, drop/);
    assert.deepEqual(bad.distTags, []);
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { "release-pending": "1.0.0" });
  });
});

test("the smoke job stops without a release list or a command", () => {
  withFixture(CHAIN, (run) => {
    const none = smokeJob(run, smoke(run));
    assert.equal(none.status, 1);
    assert.match(none.output, /the release job left no release list/);
    assert.equal(deferred(run, smoke(run)).status, 0);
    const empty = smokeJob(run, "");
    assert.equal(empty.status, 1);
    assert.match(empty.output, /no consumer-smoke command is set/);
    assert.equal(smokeRuns(run).length, 0);
  });
});

test("the workflow runs the smoke in a job with no credential, and promotes in the release environment after it", () => {
  const smokeJobText = job("consumer-smoke");
  assert.match(smokeJobText, /needs: release\n/);
  assert.match(smokeJobText, /if: needs\.release\.outputs\.promotion-due == 'true'\n/);
  assert.match(smokeJobText, /permissions:\n {6}contents: read #/);
  assert.doesNotMatch(
    smokeJobText,
    /environment:|id-token|secrets\.|steps\.bot|app-id|private-key/,
  );
  assert.match(smokeJobText, /persist-credentials: false/);
  assert.match(smokeJobText, /cache: false/);
  assert.match(smokeJobText, /bash "\$RUNNER_TEMP\/registry-smoke\.sh"/);

  const promote = job("promote");
  assert.match(promote, /needs: \[release, consumer-smoke\]/);
  assert.match(
    promote,
    /if: needs\.release\.outputs\.promotion-due == 'true' && needs\.consumer-smoke\.result == 'success'\n/,
  );
  assert.match(promote, /environment: \$\{\{ inputs\.environment \}\}/);
  assert.match(promote, /permissions:\n {6}id-token: write #[^\n]*\n {4}steps:/);
  assert.doesNotMatch(promote, /actions\/checkout|mise-action|CONSUMER_SMOKE|secrets\./);
  assert.match(promote, /PROMOTION_SHA256: \$\{\{ needs\.release\.outputs\.promotion-sha256 \}\}/);

  const release = job("release");
  assert.match(release, /promotion-sha256: \$\{\{ steps\.promotion\.outputs\.sha256 \}\}/);
  assert.match(release, /sha256sum "\$dir\/moves\.tsv"/);
  assert.match(release, /name: registry-promotion\n/);
  assert.doesNotMatch(release, /registry-smoke\.sh/);
});

test("immediate moves the dist-tags once the closure holds and runs no smoke", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run({
      extraEnv: { PROMOTE_LATEST_AFTER: "immediate", CONSUMER_SMOKE: smoke(run, 1) },
    });
    assert.equal(result.status, 0, result.output);
    assert.equal(smokeRuns(run).length, 0);
    for (const name of ["a", "b", "c", "z"])
      assert.deepEqual(run.tagsOf(name), { latest: "1.0.0" });
  });
});

test("immediate leaves no promotion plan, so neither later job runs", () => {
  withFixture(CHAIN, (run) => {
    const result = run.run({ extraEnv: { PROMOTE_LATEST_AFTER: "immediate" } });
    assert.equal(result.status, 0, result.output);
    assert.equal(run.promotion(), null);
  });
});

test("a run with no dist-tag to move leaves no promotion plan, so no smoke runs", () => {
  withFixture(CHAIN, (run) => {
    const command = smoke(run);
    const first = deferred(run, command);
    assert.equal(first.status, 0, first.output);
    assert.equal(smokeJob(run, command).status, 0);
    assert.equal(promoteJob(run).status, 0);
    rmSync(run.promotion().dir, { recursive: true });
    const again = deferred(run, command);
    assert.equal(again.status, 0, again.output);
    assert.deepEqual(again.published, first.published, "nothing new was published");
    assert.equal(run.promotion(), null, "the second run had nothing to move");
    assert.match(again.output, /Dist-tags: 0 moved after the closure check/);
  });
});

test("consumer-smoke without a command, unset or empty, and an unknown mode stop the run before anything is packed or published", () => {
  for (const extraEnv of [
    { PROMOTE_LATEST_AFTER: "consumer-smoke" },
    { PROMOTE_LATEST_AFTER: "consumer-smoke", CONSUMER_SMOKE: "" },
    { PROMOTE_LATEST_AFTER: "", CONSUMER_SMOKE: "" },
    { PROMOTE_LATEST_AFTER: "later", CONSUMER_SMOKE: "true" },
  ])
    withFixture(CHAIN, (run) => {
      const result = run.run({ extraEnv });
      assert.equal(result.status, 1, JSON.stringify(extraEnv));
      assert.deepEqual(result.published, []);
      assert.doesNotMatch(result.output, /Preflight:/);
      assert.match(
        result.output,
        extraEnv.PROMOTE_LATEST_AFTER === "later"
          ? /promote-latest-after must be consumer-smoke or immediate, not 'later'/
          : /no consumer-smoke command is set/,
      );
    });
});

test("the dry run says when latest would move and runs no smoke", () => {
  withFixture(CHAIN, (run) => {
    const command = smoke(run);
    const result = run.run({
      extraEnv: {
        DRY_RUN: "true",
        PROMOTE_LATEST_AFTER: "consumer-smoke",
        CONSUMER_SMOKE: command,
      },
    });
    assert.equal(result.status, 0, result.output);
    assert.equal(smokeRuns(run).length, 0);
    assert.ok(
      result.output.includes(
        `Dry run: latest would move only after the consumer-smoke job passed: ${command}`,
      ),
      result.output,
    );
    const immediate = run.run({ extraEnv: { DRY_RUN: "true", PROMOTE_LATEST_AFTER: "immediate" } });
    assert.match(immediate.output, /latest would move once the closure held on the registry/);
  });
});

test("the workflow declares both inputs, consumer-smoke by default, and hands them to the script through the environment", () => {
  assert.match(
    WORKFLOW,
    /promote-latest-after:\n {8}description: >-[\s\S]*?type: string\n {8}default: consumer-smoke\n/,
  );
  assert.match(
    WORKFLOW,
    /consumer-smoke:\n {8}description: >-[\s\S]*?type: string\n {8}default: ""\n/,
  );
  assert.equal(
    WORKFLOW.match(/PROMOTE_LATEST_AFTER: \$\{\{ inputs\.promote-latest-after \}\}/g)?.length,
    2,
  );
  assert.equal(WORKFLOW.match(/CONSUMER_SMOKE: \$\{\{ inputs\.consumer-smoke \}\}/g)?.length, 3);
  for (const script of [PUBLISH_SCRIPT, SMOKE_SCRIPT, PROMOTE_SCRIPT])
    assert.doesNotMatch(script, /\$\{\{/);
});
