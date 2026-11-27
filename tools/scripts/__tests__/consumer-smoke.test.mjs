/**
 * Stackra file contract:
 * Purpose: proves core's clean-consumer smoke (tools/scripts/consumer-smoke.mjs, STA-2874): it runs the documented
 *          `npx -y --@stackra:registry=<registry> @stackra/cli@<version> create demo --yes` at the release's own
 *          version with nothing but the tool folders, HOME, LANG and a git identity; it stops before `create` when the
 *          registry does not serve the CLI or the starter at that version; it gets Encore at the starter's own pin;
 *          and it fails on a failed create, an app pinned to another version, a missing tool, a stopped Docker and a
 *          HOME that is not clean.
 * Boundary: unit tier; a stand-in registry on 127.0.0.1 and stand-in `npx`, `pnpm`, `docker`, `encore` and `mise` first
 *           on PATH (real `node`, `git` and the shell tools after them). Nothing is installed and no network is used.
 * Runtime: node, bash, git
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0515; STA-2874.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";

import { catalogPins, encorePin, releaseVersion } from "../consumer-smoke.mjs";

const SCRIPT = join(import.meta.dirname, "..", "consumer-smoke.mjs");
const VERSION = "0.34.0";
const GIT = execFileSync("bash", ["-c", "command -v git"], { encoding: "utf8" }).trim();

/** A gzipped ustar archive of `entries` under `package/`, as npm packs one. */
function tgzOf(entries) {
  const blocks = [];
  for (const [path, body] of Object.entries(entries)) {
    const bytes = typeof body === "string" ? Buffer.from(body) : body;
    const header = Buffer.alloc(512);
    header.write(`package/${path}`, 0, 100);
    header.write("0000644\0", 100);
    header.write(`${bytes.length.toString(8).padStart(11, "0")}\0`, 124);
    header.write("0", 156);
    header.write("ustar\0", 257);
    header.fill(" ", 148, 156);
    let sum = 0;
    for (const byte of header) sum += byte;
    header.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
    blocks.push(header, bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

/** Writes an executable bash script. */
function tool(file, body) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(file, 0o755);
}

/**
 * A world for one smoke run: the stand-in registry and tools, a new HOME and the release file.
 * @param {{ served?: Record<string, boolean>, pin?: string, createExit?: number, encore?: boolean, mise?: boolean,
 *           docker?: number, release?: string, miseToml?: string }} [options]
 */
async function world(options = {}) {
  const {
    served = { "@stackra/cli": true, "@stackra/starter": true },
    pin = VERSION,
    createExit = 0,
    encore = true,
    mise = false,
    docker = 0,
    release = `@stackra/cli\t${VERSION}\n@stackra/starter\t${VERSION}\n@stackra/app\t${VERSION}\n`,
    miseToml = '[tools]\nnode = "24.22.0"\n"aqua:encoredev/encore" = "1.58.8"\n',
  } = options;
  const root = mkdtempSync(join(tmpdir(), "consumer-smoke-"));
  const bin = join(root, "bin");
  const home = join(root, "home");
  mkdirSync(home, { recursive: true });
  const starterTgz = tgzOf({
    "package.json": `{"name":"@stackra/starter","version":"${VERSION}"}`,
    "dist/template.tgz": tgzOf({ "mise.toml": miseToml, "stackra.starter.yaml": "version: 1\n" }),
  });
  const server = createServer((request, response) => {
    const url = request.url ?? "";
    const match = /^\/(@stackra%2f[a-z-]+)\/(.+)$/.exec(url);
    if (url === "/starter.tgz") return response.end(starterTgz);
    if (match && match[2] === VERSION && served[match[1].replace("%2f", "/")]) {
      response.setHeader("content-type", "application/json");
      return response.end(
        JSON.stringify({
          name: match[1].replace("%2f", "/"),
          version: VERSION,
          dist: { tarball: `http://127.0.0.1:${server.address().port}/starter.tgz` },
        }),
      );
    }
    response.statusCode = 404;
    response.end("{}");
  });
  await new Promise((done) => {
    server.listen(0, "127.0.0.1", done);
  });
  const registry = `http://127.0.0.1:${server.address().port}/`;
  // npx stands in for `stackra create`: it records how it was called and makes the app create would make.
  tool(
    join(bin, "npx"),
    [
      `printf '%s\\n' "$@" > "${root}/npx-args"`,
      `env | sort > "${root}/npx-env"`,
      `pwd > "${root}/npx-cwd"`,
      `[ ${createExit} -eq 0 ] || exit ${createExit}`,
      "mkdir -p demo/node_modules/@stackra/cli",
      `printf 'catalogs:\\n  stackra:\\n    "@stackra/cli": ${pin}\\n    "@stackra/app": ${pin}\\nminimumReleaseAgeExclude:\\n  - "@stackra/*"\\n' > demo/pnpm-workspace.yaml`,
      `printf '{"name":"@stackra/cli","version":"${pin}"}' > demo/node_modules/@stackra/cli/package.json`,
      "cd demo && git init -q && git add -A && git commit -q -m create",
    ].join("\n"),
  );
  tool(join(bin, "pnpm"), "exit 0");
  tool(join(bin, "docker"), `exit ${docker}`);
  if (encore) tool(join(bin, "encore"), "exit 0");
  if (mise) {
    tool(join(root, "mise-tools", "encore", "bin", "encore"), "exit 0");
    tool(
      join(bin, "mise"),
      [
        `echo "$*" >> "${root}/mise-calls"`,
        `[ "$1" = where ] && echo "${root}/mise-tools/encore"`,
        "exit 0",
      ].join("\n"),
    );
  }
  const releaseFile = join(root, "release.tsv");
  writeFileSync(releaseFile, release);
  return {
    root,
    home,
    registry,
    env: {
      PATH: [bin, dirname(process.execPath), dirname(GIT), "/usr/bin", "/bin"].join(":"),
      HOME: home,
      RUNWAY_REGISTRY: registry,
      RUNWAY_RELEASE: releaseFile,
    },
    read: (file) =>
      existsSync(join(root, file)) ? readFileSync(join(root, file), "utf8") : undefined,
    dispose() {
      server.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}

/** Runs the smoke in `w` (asynchronously: the stand-in registry answers from this process). */
async function smoke(w, env = w.env) {
  const child = spawn(process.execPath, [SCRIPT], { env, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const status = await new Promise((done) => {
    child.on("close", done);
  });
  return { status, output };
}

/** Runs `body` with a fresh world and disposes it. */
async function inWorld(options, body) {
  const w = await world(options);
  try {
    await body(w);
  } finally {
    w.dispose();
  }
}

test("releaseVersion takes the CLI and starter version of the release, which the fixed group keeps equal", () => {
  assert.equal(releaseVersion(`@stackra/cli\t1.2.3\n@stackra/starter\t1.2.3\n`), "1.2.3");
  assert.throws(
    () => releaseVersion(`@stackra/cli\t1.2.3\n`),
    /the release has no @stackra\/starter/,
  );
  assert.throws(
    () => releaseVersion(`@stackra/cli\t1.2.3\n@stackra/starter\t1.2.2\n`),
    /the fixed group keeps them equal/,
  );
});

test("encorePin reads the starter's mise pin, and catalogPins reads only catalogs.stackra", () => {
  assert.equal(encorePin('[tools]\n"aqua:encoredev/encore" = "1.58.8"\n'), "1.58.8");
  assert.equal(encorePin('[tools]\nnode = "24"\n'), undefined);
  assert.deepEqual(
    catalogPins(
      [
        "minimumReleaseAgeExclude:",
        '  - "@stackra/*"',
        "catalogs:",
        "  quality:",
        '    "@stackra/oxlint-config": 9.9.9',
        "  stackra:",
        "    # the framework",
        '    "@stackra/app": 0.34.0',
        "    '@stackra/cli': '0.34.0'",
        "overrides:",
        '  "@stackra/app": catalog:stackra',
      ].join("\n"),
    ),
    ["0.34.0", "0.34.0"],
  );
});

test("it runs the documented create at the release's version, as a clean consumer, and passes on a pinned, installed, committed app", async () => {
  await inWorld({}, async (w) => {
    const { status, output } = await smoke(w);
    assert.equal(status, 0, output);
    assert.deepEqual(w.read("npx-args").trim().split("\n"), [
      "-y",
      `--@stackra:registry=${w.registry}`,
      `@stackra/cli@${VERSION}`,
      "create",
      "demo",
      "--yes",
    ]);
    assert.equal(w.read("npx-cwd").trim(), join(w.home, "consumer"));
    const env = Object.fromEntries(
      w
        .read("npx-env")
        .trim()
        .split("\n")
        .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
    );
    assert.deepEqual(
      Object.keys(env)
        .filter((key) => !["_", "PWD", "SHLVL", "OLDPWD"].includes(key))
        .sort(),
      [
        "GIT_AUTHOR_EMAIL",
        "GIT_AUTHOR_NAME",
        "GIT_COMMITTER_EMAIL",
        "GIT_COMMITTER_NAME",
        "HOME",
        "LANG",
        "PATH",
      ],
    );
    assert.equal(env.HOME, w.home);
    // Only the tool folders (node, npx, pnpm, git, docker, encore), then the system's: none of the caller's PATH.
    const bin = join(w.root, "bin");
    assert.equal(
      env.PATH,
      [...new Set([dirname(process.execPath), bin, dirname(GIT), bin, "/usr/bin", "/bin"])].join(
        ":",
      ),
    );
    assert.match(
      output,
      /passed; .*demo is pinned to 0\.34\.0, installed, generated, checked and committed/,
    );
  });
});

test("it stops before create when the registry does not serve the starter, or the CLI, at the release's version", async () => {
  for (const name of ["@stackra/starter", "@stackra/cli"])
    await inWorld(
      {
        served: {
          "@stackra/cli": name !== "@stackra/cli",
          "@stackra/starter": name !== "@stackra/starter",
        },
      },
      async (w) => {
        const { status, output } = await smoke(w);
        assert.equal(status, 1, output);
        assert.match(output, new RegExp(`the registry does not serve ${name}@${VERSION}`));
        if (name === "@stackra/starter") assert.match(output, /fall back to latest's starter/);
        assert.equal(w.read("npx-args"), undefined, "create never ran");
      },
    );
});

test("a failed create fails the smoke", async () => {
  await inWorld({ createExit: 3 }, async (w) => {
    const { status, output } = await smoke(w);
    assert.equal(status, 1);
    assert.match(output, /stackra create exited 3/);
  });
});

test("an app pinned to another version fails the smoke", async () => {
  await inWorld({ pin: "0.33.1" }, async (w) => {
    const { status, output } = await smoke(w);
    assert.equal(status, 1);
    assert.match(output, /the app's catalog pins @stackra to 0\.33\.1, not 0\.34\.0/);
  });
});

test("without Encore on PATH it installs the starter's own pin with mise and hands create that folder", async () => {
  await inWorld({ encore: false, mise: true }, async (w) => {
    const { status, output } = await smoke(w);
    assert.equal(status, 0, output);
    assert.deepEqual(w.read("mise-calls").trim().split("\n"), [
      "install aqua:encoredev/encore@1.58.8",
      "where aqua:encoredev/encore@1.58.8",
    ]);
    assert.match(
      w.read("npx-env"),
      new RegExp(`PATH=.*${join(w.root, "mise-tools", "encore", "bin")}`),
    );
  });
});

test("it names what the machine lacks: Encore with no mise, a stopped Docker; and refuses a HOME that is not clean", async () => {
  await inWorld({ encore: false }, async (w) => {
    const { status, output } = await smoke(w);
    assert.equal(status, 1);
    assert.match(
      output,
      /mise is not there to install the starter's aqua:encoredev\/encore@1\.58\.8/,
    );
  });
  await inWorld({ docker: 1 }, async (w) => {
    const { status, output } = await smoke(w);
    assert.equal(status, 1);
    assert.match(output, /Docker is not running/);
  });
  await inWorld({}, async (w) => {
    writeFileSync(join(w.home, ".npmrc"), "registry=https://example.invalid/\n");
    const { status, output } = await smoke(w);
    assert.equal(status, 1);
    assert.match(output, /\.npmrc exists; a clean consumer has no npm settings/);
    assert.equal(w.read("npx-args"), undefined);
  });
});

test("it needs the registry, the release file and HOME", async () => {
  await inWorld({}, async (w) => {
    const { status, output } = await smoke(w, { ...w.env, RUNWAY_REGISTRY: "" });
    assert.equal(status, 2);
    assert.match(output, /set RUNWAY_REGISTRY/);
  });
});

test("release.yml reads release.npm.promoteLatestAfter from runway.yaml and hands runway-npm.yml this smoke", () => {
  const repo = join(import.meta.dirname, "..", "..", "..");
  const release = readFileSync(join(repo, ".github/workflows/release.yml"), "utf8");
  const runway = readFileSync(join(repo, "runway.yaml"), "utf8");
  assert.match(release, /sparse-checkout: \|\n\s+\.changeset\n\s+runway\.yaml\n/);
  assert.match(
    release,
    /yq '\.release\.npm\.promoteLatestAfter \/\/ "consumer-smoke"' runway\.yaml/,
  );
  assert.match(
    release,
    /promote-latest-after: \$\{\{ steps\.policy\.outputs\.promote-latest-after \}\}/,
  );
  assert.match(
    release,
    /promote-latest-after: \$\{\{ needs\.gate\.outputs\.promote-latest-after \}\}/,
  );
  assert.match(release, /consumer-smoke: node tools\/scripts\/consumer-smoke\.mjs\n/);
  assert.match(runway, /\nrelease:\n[\s\S]*?\n {2}npm:\n {4}promoteLatestAfter: consumer-smoke\n/);
});
