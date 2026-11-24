/**
 * Stackra file contract:
 * Purpose: run the publish plan and the publish script that `runway-npm.yml` writes (its "Registry" step) against a
 *          fixture workspace, so a release publishes dependencies first and a run that stops half way, or ends early,
 *          is loud and leaves a set that installs. 0.33.1 published 99 of 119 packages in path order and left 22 of them
 *          pinning a version of an unpublished package (@stackra/consent -> @stackra/iam).
 * Boundary: the two scripts are cut out of the workflow text and run as written; `curl` is a stand-in registry and
 *           `pnpm publish` records what it was asked to publish. Every other `pnpm` command is the real one.
 * Runtime: node, bash, jq, pnpm
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0453 decision 7 (versions are immutable); ADR 0468.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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

/** The directories of the real `node` and `pnpm`, which a shim directory must not hide from the scripts. */
function realToolDirs() {
  let pnpm;
  try {
    pnpm = execFileSync("mise", ["which", "pnpm"], { encoding: "utf8" }).trim();
  } catch {
    pnpm = execFileSync("which", ["pnpm"], { encoding: "utf8" }).trim();
  }
  return [dirname(process.execPath), dirname(pnpm)];
}

const CURL_SHIM = `#!/usr/bin/env bash
# The registry's answers: the ID token, the token exchange, and "is name@version there" by a file per version.
url="\${!#}"
case "$url" in
  "\${ACTIONS_ID_TOKEN_REQUEST_URL%%\\?*}"*) echo '{"value":"id-token"}' ;;
  *oidc/token/exchange*) echo '{"token":"publish-token"}' ;;
  *) key="\${url#"$REGISTRY"}"; key="\${key//\\//@}"
     if [ -e "$STATE/registry/$key" ]; then exit 0
     elif [ -e "$STATE/lagging/$key" ]; then
       # a version the store accepted but does not show yet: it appears once its count of answers has run out
       n="$(cat "$STATE/lagging/$key")"
       if [ "$n" -gt 0 ]; then echo $(( n - 1 )) > "$STATE/lagging/$key"; exit 22; fi
       touch "$STATE/registry/$key"; exit 0
     else exit 22; fi ;;
esac
`;

const PNPM_SHIM = `#!/usr/bin/env bash
# \`pnpm publish\` records itself and puts the version on the stand-in registry; everything else is the real pnpm.
if [ "$1" = publish ]; then
  cat > /dev/null # a greedy reader on stdin, as the loop's input would suffer from
  name="$(node -p "require('./package.json').name")"
  version="$(node -p "require('./package.json').version")"
  [ "$NODE_AUTH_TOKEN" = publish-token ] || { echo "no publish token for $name" >&2; exit 3; }
  echo "$name" >> "$STATE/published.log"
  failures="$STATE/fail/\${name//\\//_}"
  if [ -e "$failures" ] && [ "$(cat "$failures")" -gt 0 ]; then
    echo $(( $(cat "$failures") - 1 )) > "$failures"
    [ -e "$failures.registers" ] && touch "$STATE/registry/\${name/\\//%2f}@$version"
    exit 1
  fi
  regkey="\${name/\\//%2f}@$version"
  if [ -e "$STATE/lag/\${name//\\//_}" ]; then cp "$STATE/lag/\${name//\\//_}" "$STATE/lagging/$regkey"
  elif [ ! -e "$STATE/hide/\${name//\\//_}" ]; then touch "$STATE/registry/$regkey"; fi
  exit 0
fi
exec "$REAL_PNPM" "$@"
`;

/**
 * A workspace of packages, `{ name, deps, private }`, with the two scripts and the shims, ready to run.
 *
 * @example
 * const run = fixture([{ name: "a", deps: ["b"] }, { name: "b" }]);
 */
function fixture(packages) {
  const root = mkdtempSync(join(tmpdir(), "registry-publish-"));
  const state = join(root, "state");
  const bin = join(root, "bin");
  for (const dir of [
    state,
    bin,
    join(state, "registry"),
    join(state, "fail"),
    join(state, "hide"),
    join(state, "lag"),
    join(state, "lagging"),
  ])
    mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "fixture-root", private: true }),
  );
  writeFileSync(join(root, "pnpm-workspace.yaml"), 'packages:\n  - "pkgs/*"\n');
  for (const { name, deps = [], isPrivate = false, prepack } of packages) {
    mkdirSync(join(root, "pkgs", name), { recursive: true });
    writeFileSync(
      join(root, "pkgs", name, "package.json"),
      JSON.stringify({
        name: `@t/${name}`,
        version: "1.0.0",
        ...(isPrivate ? { private: true } : {}),
        ...(prepack === undefined ? {} : { scripts: { prepack } }),
        dependencies: Object.fromEntries(deps.map((dep) => [`@t/${dep}`, "workspace:*"])),
      }),
    );
  }
  for (const { name } of packages) writeFileSync(join(root, "pkgs", name, "LICENSE"), "MIT\n");
  for (const [file, text] of [
    ["curl", CURL_SHIM],
    ["pnpm", PNPM_SHIM],
  ]) {
    writeFileSync(join(bin, file), text);
    chmodSync(join(bin, file), 0o755);
  }
  writeFileSync(join(root, "registry-plan.mjs"), PLAN_SCRIPT);
  writeFileSync(join(root, "registry-publish.sh"), PUBLISH_SCRIPT);
  const git = (...args) => execFileSync("git", args, { cwd: root, stdio: "ignore" });
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
  const [nodeDir, pnpmDir] = realToolDirs();
  const env = {
    ...process.env,
    PATH: [bin, nodeDir, pnpmDir, process.env.PATH].join(":"),
    REAL_PNPM: join(pnpmDir, "pnpm"),
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
    /** Mark a package so its next `count` publishes fail, optionally after reaching the registry. */
    failPublish(name, count, { registers = false } = {}) {
      writeFileSync(join(state, "fail", `@t_${name}`), String(count));
      if (registers) writeFileSync(join(state, "fail", `@t_${name}.registers`), "");
    },
    /** Mark a package so its publish succeeds but the registry never shows it. */
    hide(name) {
      writeFileSync(join(state, "hide", `@t_${name}`), "");
    },
    /** Drop the git tags, as a failed run does: the action pushes tags only after a script that succeeded. */
    forgetTags() {
      for (const tag of execFileSync("git", ["tag", "-l"], { cwd: root, encoding: "utf8" })
        .split("\n")
        .filter(Boolean))
        execFileSync("git", ["tag", "-d", tag], { cwd: root, stdio: "ignore" });
    },
    /** Tag a version, as an earlier release run that got as far as pushing its tags did. */
    tag(name) {
      execFileSync(
        "git",
        ["-c", "user.name=t", "-c", "user.email=t@t", "tag", `@t/${name}@1.0.0`],
        {
          cwd: root,
          stdio: "ignore",
        },
      );
    },
    /** Mark a package whose version the registry shows only after it answered 404 to `count` checks. */
    lag(name, count) {
      writeFileSync(join(state, "lag", `@t_${name}`), String(count));
    },
    /** Put a version on the stand-in registry before the run. */
    preload(name) {
      writeFileSync(join(state, "registry", `@t%2f${name}@1.0.0`), "");
    },
    run() {
      const result = spawnSync("bash", [join(root, "registry-publish.sh")], {
        cwd: root,
        env,
        encoding: "utf8",
      });
      const log = join(state, "published.log");
      return {
        ...result,
        output: `${result.stdout}${result.stderr}`,
        published: existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [],
        tags: execFileSync("git", ["tag", "-l"], { cwd: root, encoding: "utf8" })
          .trim()
          .split("\n")
          .filter(Boolean),
        events: existsSync(env.CHANGESETS_OUTPUT)
          ? readFileSync(env.CHANGESETS_OUTPUT, "utf8").trim().split("\n").filter(Boolean)
          : [],
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

test("a release publishes every package dependencies first, tags each and verifies the registry", () => {
  const run = fixture(CHAIN);
  try {
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.ok(result.published.indexOf("@t/c") < result.published.indexOf("@t/b"));
    assert.ok(result.published.indexOf("@t/b") < result.published.indexOf("@t/a"));
    assert.equal(result.published.length, 4);
    assert.deepEqual(result.tags.sort(), ["@t/a@1.0.0", "@t/b@1.0.0", "@t/c@1.0.0", "@t/z@1.0.0"]);
    assert.equal(result.events.length, 4);
    assert.match(
      result.output,
      /All 4 packages are on the registry \(4 published, 0 already there\)/,
    );
  } finally {
    run.dispose();
  }
});

test("a version already on the registry is skipped and never republished; an existing tag is kept", () => {
  const run = fixture(CHAIN);
  try {
    run.preload("c");
    run.tag("c");
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.ok(!result.published.includes("@t/c"));
    assert.match(result.output, /skip @t\/c@1\.0\.0: already on the registry/);
    assert.match(result.output, /\(3 published, 1 already there\)/);
    assert.equal(result.events.length, 3);
    assert.ok(!result.events.some((event) => event.includes("@t/c@1.0.0")));
  } finally {
    run.dispose();
  }
});

test("a transient publish failure is retried and the run succeeds", () => {
  const run = fixture(CHAIN);
  try {
    run.failPublish("b", 2);
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.equal(result.published.filter((name) => name === "@t/b").length, 3);
    assert.match(result.output, /retry @t\/b@1\.0\.0: attempt 3/);
  } finally {
    run.dispose();
  }
});

test("a publish that reached the registry and then failed is not published twice", () => {
  const run = fixture(CHAIN);
  try {
    run.failPublish("b", 1, { registers: true });
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.equal(result.published.filter((name) => name === "@t/b").length, 1);
  } finally {
    run.dispose();
  }
});

test("a package that keeps failing stops the run with a published set no package of which pins an unpublished one", () => {
  const run = fixture(CHAIN);
  try {
    run.failPublish("b", 99);
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish stopped::@t\/b@1\.0\.0 failed after 3 attempts/,
    );
    const publishedList = /Published in this run \((\d+)\):\n((?: {2}\S+\n)+)/.exec(result.output);
    assert.ok(publishedList, result.output);
    // c and z, which pins nothing, went out before b failed; a never started.
    assert.equal(publishedList[1], "2");
    assert.ok(publishedList[2].includes("@t/c@1.0.0") && publishedList[2].includes("@t/z@1.0.0"));
    const notPublished = /Not published \((\d+)\):\n((?: {2}\S+\n?)+)/.exec(result.output);
    assert.ok(notPublished, result.output);
    assert.ok(notPublished[2].includes("@t/b@1.0.0") && notPublished[2].includes("@t/a@1.0.0"));
    assert.ok(!notPublished[2].includes("@t/c@1.0.0"));
    const onRegistry = new Set(result.published.filter((name) => name !== "@t/b"));
    // c came first and is there; a, which pins b, was never attempted.
    assert.ok(onRegistry.has("@t/c"));
    assert.ok(!result.published.includes("@t/a"));
    for (const { name: member, deps = [] } of CHAIN.filter(({ name }) =>
      onRegistry.has(`@t/${name}`),
    ))
      for (const dep of deps)
        assert.ok(onRegistry.has(`@t/${dep}`), `${member} is published but ${dep} is not`);
  } finally {
    run.dispose();
  }
});

test("a loop that ends with a version missing from the registry fails the run", () => {
  const run = fixture(CHAIN);
  try {
    run.hide("z");
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish incomplete::@t\/z@1\.0\.0 is not on the registry/,
    );
  } finally {
    run.dispose();
  }
});

test("a version the registry shows a moment late does not fail the run", () => {
  const run = fixture(CHAIN);
  try {
    run.lag("z", 2);
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /All 4 packages are on the registry/);
  } finally {
    run.dispose();
  }
});

test("a version the registry still does not show after three checks fails the run", () => {
  const run = fixture(CHAIN);
  try {
    run.lag("z", 5);
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Publish incomplete::@t\/z@1\.0\.0 is not on the registry/,
    );
  } finally {
    run.dispose();
  }
});

test("a public package on a private one stops the run before anything is published", () => {
  const run = fixture([
    { name: "a", deps: ["p"] },
    { name: "p", isPrivate: true },
  ]);
  try {
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(result.output, /@t\/a depends on the private workspace package @t\/p/);
    assert.deepEqual(result.published, []);
  } finally {
    run.dispose();
  }
});

test("a failure at one package, then a re-run, completes the release without republishing", () => {
  const run = fixture(CHAIN);
  try {
    run.failPublish("b", 99);
    const first = run.run();
    assert.equal(first.status, 1);
    assert.deepEqual(
      first.published.filter((name) => name === "@t/c"),
      ["@t/c"],
    );
    // The failed run pushed no tags; the registry keeps what it published.
    run.forgetTags();
    run.failPublish("b", 0);
    const second = run.run();
    assert.equal(second.status, 0, second.output);
    assert.match(second.output, /skip @t\/c@1\.0\.0: already on the registry/);
    // Every package was published exactly once across the two runs.
    const everything = second.published;
    for (const name of ["@t/a", "@t/c", "@t/z"])
      assert.equal(everything.filter((published) => published === name).length, 1, name);
    assert.equal(everything.filter((published) => published === "@t/b").length, 3 + 1);
    // c, published by the first run and untagged, is tagged by the resumed one: all four releases get an event.
    assert.deepEqual(second.tags.sort(), ["@t/a@1.0.0", "@t/b@1.0.0", "@t/c@1.0.0", "@t/z@1.0.0"]);
    assert.equal(second.events.length, 4);
  } finally {
    run.dispose();
  }
});

test("the pre-flight packs every package before the first publish and stops with nothing published", () => {
  const run = fixture([
    { name: "a", deps: ["b"] },
    { name: "b", deps: ["c"] },
    { name: "c", prepack: "exit 1" },
  ]);
  try {
    const result = run.run();
    assert.equal(result.status, 1);
    assert.match(
      result.output,
      /::error title=Preflight failed::cannot pack: @t\/c@1\.0\.0\. Nothing was published/,
    );
    assert.deepEqual(result.published, []);
    assert.deepEqual(result.events, []);
  } finally {
    run.dispose();
  }
});

test("the pre-flight packs only what is not on the registry yet", () => {
  const run = fixture([
    { name: "a", deps: ["c"] },
    { name: "c", prepack: "exit 1" },
  ]);
  try {
    run.preload("c");
    const result = run.run();
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /Preflight: 1 packages packed and checked/);
  } finally {
    run.dispose();
  }
});

/** A tarball with the given package.json and files, as `pnpm pack` writes one: everything under `package/`. */
function tarball(manifest, files = ["LICENSE"]) {
  const dir = mkdtempSync(join(tmpdir(), "registry-tarball-"));
  mkdirSync(join(dir, "package"));
  writeFileSync(join(dir, "package", "package.json"), JSON.stringify(manifest));
  for (const file of files) writeFileSync(join(dir, "package", file), "x\n");
  execFileSync("tar", ["-czf", join(dir, "t.tgz"), "-C", dir, "package"]);
  return { dir, file: join(dir, "t.tgz") };
}

/** Run the verify mode of the plan script on a tarball. */
function verify(manifest, files, expected = ["@t/a", "1.0.0"]) {
  const { dir, file } = tarball(manifest, files);
  try {
    writeFileSync(join(dir, "plan.mjs"), PLAN_SCRIPT);
    const result = spawnSync("node", [join(dir, "plan.mjs"), "--verify", file, ...expected], {
      encoding: "utf8",
    });
    return { status: result.status, stdout: result.stdout };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("verify passes a tarball that names its package, has no workspace protocol left and carries a LICENSE", () => {
  const good = { name: "@t/a", version: "1.0.0", dependencies: { "@t/b": "1.0.0" } };
  assert.equal(verify(good).status, 0);
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

test("the dry run checks the same plan before it packs", () => {
  const dryRun = WORKFLOW.slice(WORKFLOW.indexOf("- name: Publish dry run"));
  assert.ok(
    dryRun.indexOf("registry-plan.mjs") !== -1 &&
      dryRun.indexOf("registry-plan.mjs") < dryRun.indexOf("publish --dry-run"),
  );
});
