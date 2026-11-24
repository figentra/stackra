/**
 * Stackra file contract:
 * Purpose: run the publish plan and the publish script that `runway-npm.yml` writes (its "Registry" step) against a
 *          fixture workspace, so a release publishes dependencies first, publishes the tarball it packed and checked, and
 *          a run that stops half way, or ends early, is loud and leaves a set that installs. 0.33.1 published 99 of 119
 *          packages in path order and left 22 of them pinning a version of an unpublished package (@stackra/consent ->
 *          @stackra/iam). A version already on the registry counts only with the content packed here (its `dist.integrity`);
 *          the registry's answers are read three ways (present, absent, unavailable).
 * Boundary: the two scripts are cut out of the workflow text and run as written; `curl` is a stand-in registry (status
 *           codes, version documents with an integrity, timeouts) and `pnpm publish` records the tarball it was given.
 *           Every other `pnpm` command is the real one. The children the script starts (curl, pnpm, node, git) read the
 *           script's standard input greedily, the way a command that prompts would.
 * Runtime: node, bash, jq, pnpm
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0453 decision 7 (versions are immutable); ADR 0468.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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
const key = url.slice(process.env.REGISTRY.length).replaceAll("/", "@");
const net = path.join(state, "net", key);
if (fs.existsSync(net)) {
  const mode = fs.readFileSync(net, "utf8");
  if (mode === "timeout") process.exit(28);
  reply(Number(mode.replace("http:", "")));
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
    }
    process.exit(1);
  }
  if (fs.existsSync(path.join(state, "lag", plain)))
    fs.writeFileSync(path.join(state, "lagging", key), fs.readFileSync(path.join(state, "lag", plain), "utf8") + " " + integrityOf(tarball));
  else if (fs.existsSync(path.join(state, "tamper", plain))) fs.writeFileSync(held, "sha512-TAMPERED");
  else if (!fs.existsSync(path.join(state, "hide", plain))) fs.writeFileSync(held, integrityOf(tarball));
  process.exit(0);
}
if (args[0] === "pack") { drain(); process.exit(real()); }
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
 * A workspace of packages, `{ name, deps, devDeps, isPrivate, prepack, main }`, with the two scripts and the shims, ready to run.
 *
 * @example
 * const run = fixture([{ name: "a", deps: ["b"] }, { name: "b" }]);
 */
function fixture(packages) {
  const root = mkdtempSync(join(tmpdir(), "registry-publish-"));
  const state = join(root, "state");
  const bin = join(root, "bin");
  for (const dir of ["registry", "fail", "hide", "lag", "lagging", "tamper", "net"])
    mkdirSync(join(state, dir), { recursive: true });
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "fixture-root", private: true }),
  );
  writeFileSync(join(root, "pnpm-workspace.yaml"), 'packages:\n  - "pkgs/*"\n');
  for (const { name, deps = [], devDeps = [], isPrivate = false, prepack, main } of packages) {
    mkdirSync(join(root, "pkgs", name), { recursive: true });
    writeFileSync(
      join(root, "pkgs", name, "package.json"),
      JSON.stringify({
        name: `@t/${name}`,
        version: "1.0.0",
        ...(isPrivate ? { private: true } : {}),
        ...(prepack === undefined ? {} : { scripts: { prepack } }),
        ...(main === undefined ? {} : { main }),
        dependencies: Object.fromEntries(deps.map((dep) => [`@t/${dep}`, "workspace:*"])),
        devDependencies: Object.fromEntries(devDeps.map((dep) => [`@t/${dep}`, "workspace:*"])),
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
    /** Run the script; `extraEnv` adds to its environment and `input` is its standard input. */
    run({
      extraEnv = {},
      input = "standard input that no child of the script may swallow\n",
    } = {}) {
      const result = spawnSync("bash", [join(root, "registry-publish.sh")], {
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
function makeTarball(manifest, files = ["LICENSE"]) {
  const dir = mkdtempSync(join(tmpdir(), "registry-tarball-"));
  mkdirSync(join(dir, "package"));
  writeFileSync(join(dir, "package", "package.json"), JSON.stringify(manifest));
  for (const file of files) {
    mkdirSync(dirname(join(dir, "package", file)), { recursive: true });
    writeFileSync(join(dir, "package", file), "x\n");
  }
  execFileSync("tar", ["-czf", join(dir, "t.tgz"), "-C", dir, "package"]);
  return { dir, file: join(dir, "t.tgz") };
}

/** Run the verify mode of the plan script on a tarball. */
function verify(manifest, files, expected = ["@t/a", "1.0.0"]) {
  const { dir, file } = makeTarball(manifest, files);
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

test("the dry run checks the same plan before it packs", () => {
  const dryRun = WORKFLOW.slice(WORKFLOW.indexOf("- name: Publish dry run"));
  assert.ok(
    dryRun.indexOf("registry-plan.mjs") !== -1 &&
      dryRun.indexOf("registry-plan.mjs") < dryRun.indexOf("publish --dry-run"),
  );
});
