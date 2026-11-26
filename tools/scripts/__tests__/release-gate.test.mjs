/**
 * Stackra file contract:
 * Purpose: hold `release-gate.mjs` to its contract: entries are sorted to the Node, Vite and Metro smoke by their host
 *          subpath and contract runtime; publint and arethetypeswrong fail a broken tarball and pass a sound one; the
 *          pin check refuses a range, a private dependency and a pin to a version that is neither packed nor on the
 *          registry; the registry check fails a partial publish (the 0.33.1 case) and a dist-tag left behind; the
 *          baseline lets a known finding through and fails a stale row; the Node runner reports a broken entry; the
 *          consumer's tools stay on versions the lockfile holds; and the release workflow runs the gate before the
 *          publish and the registry check after it.
 * Boundary: writes throwaway packages and tarballs under the OS temp directory and removes them; the registry is a
 *           fake fetch, so no network is used.
 * Runtime: node
 * Governing contract: ADR 0177 (decision 4, PK4 release checks); ADR 0022 (tests live in tests folders); STA-2705.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  HOST_MODULE,
  REPO_ROOT,
  applyBaseline,
  attwFindings,
  consumerManifest,
  consumerTools,
  mapLimit,
  packageEntries,
  pinFindings,
  publintFindings,
  readBaseline,
  registryFindings,
  smokeTargets,
} from "../release-gate.mjs";

const TOOL = fileURLToPath(new URL("../release-gate.mjs", import.meta.url));
const RUNNERS = fileURLToPath(new URL("../release-gate/", import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), "release-gate-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

let counter = 0;
/** A folder holding `files` (path → content); returns its path. */
function folder(files) {
  counter += 1;
  const dir = join(scratch, `f${counter}`);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(
      join(dir, path),
      typeof content === "string" ? content : JSON.stringify(content, null, 2),
    );
  }
  return dir;
}

/** The bytes of a tarball laid out as `pnpm pack` writes it (`package/...`). */
function tarball(files) {
  const dir = folder(
    Object.fromEntries(
      Object.entries(files).map(([path, content]) => [`package/${path}`, content]),
    ),
  );
  const file = `${dir}.tgz`;
  // COPYFILE_DISABLE: macOS tar would add AppleDouble `._*` entries that no `pnpm pack` tarball has.
  execFileSync("tar", ["-czf", file, "-C", dir, "package"], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
  return readFileSync(file);
}

/** A fake registry: `versions` maps "name@version" to its document, `tags` maps a name to its dist-tags. */
function fakeRegistry({ versions = {}, tags = {}, absentFirst = new Set() }) {
  const asked = new Map();
  return async (url) => {
    const path = decodeURIComponent(new URL(url).pathname.slice(1));
    const at = path.lastIndexOf("/");
    const scoped = path.startsWith("@");
    const isVersion = scoped ? path.split("/").length === 3 : path.split("/").length === 2;
    if (!isVersion) {
      return tags[path]
        ? new Response(JSON.stringify({ name: path, "dist-tags": tags[path] }), { status: 200 })
        : new Response("{}", { status: 404 });
    }
    const key = `${path.slice(0, at)}@${path.slice(at + 1)}`;
    asked.set(key, (asked.get(key) ?? 0) + 1);
    if (absentFirst.has(key) && asked.get(key) === 1) return new Response("{}", { status: 404 });
    return versions[key]
      ? new Response(JSON.stringify(versions[key]), { status: 200 })
      : new Response("{}", { status: 404 });
  };
}

/** A registry document for name@version with its pins. */
function doc(name, version, dependencies = {}) {
  return {
    name,
    version,
    dependencies,
    dist: { integrity: "sha512-x", tarball: `https://r/${name}-${version}.tgz` },
  };
}

// -------------------------------------------------------------------------------------------------------------
// entries and smoke targets
// -------------------------------------------------------------------------------------------------------------

test("entries take the host of their subpath, else the Runtime line of their source; data and plugins are skipped", () => {
  const dir = folder({
    "src/core/index.ts":
      "/**\n * Stackra file contract:\n * Runtime: isomorphic\n */\nexport {};\n",
    "src/node/index.ts": "/**\n * Runtime: node\n */\n",
    "src/native/index.ts": "/**\n * Runtime: isomorphic\n */\n",
    "src/testing/index.ts": "/**\n * Runtime: node\n */\n",
  });
  const manifest = {
    name: "@stackra/x",
    exports: {
      ".": {
        "@stackra/source": "./src/core/index.ts",
        types: "./dist/index.d.mts",
        default: "./dist/index.mjs",
      },
      "./node": { "@stackra/source": "./src/node/index.ts", default: "./dist/node.mjs" },
      "./native": { "@stackra/source": "./src/native/index.ts", default: "./dist/native.mjs" },
      "./testing": { "@stackra/source": "./src/testing/index.ts", default: "./dist/testing.mjs" },
      "./worker": { default: "./dist/worker.mjs" },
      "./assets/*": "./assets/*",
      "./schema": "./schema.json",
      "./app.plugin.js": "./app.plugin.js",
      "./package.json": "./package.json",
    },
  };
  assert.deepEqual(
    packageEntries(manifest, dir).map(({ spec, runtime, test: isTest }) => [spec, runtime, isTest]),
    [
      ["@stackra/x", "isomorphic", false],
      ["@stackra/x/node", "node", false],
      ["@stackra/x/native", "react-native", false],
      ["@stackra/x/testing", "node", true],
      ["@stackra/x/worker", "worker", false],
    ],
  );
  // Every entry of the testing package runs in a test runner, whatever its subpath.
  assert.equal(
    packageEntries({ name: "@stackra/testing", exports: { "./native": "./n.mjs" } }, dir)[0].test,
    true,
  );
});

test("smoke targets follow the package's declared runtimes and the entry's runtime", () => {
  const all = ["isomorphic", "node", "browser", "react-native"];
  assert.deepEqual(smokeTargets({ runtime: "isomorphic", test: false }, all), [
    "node",
    "vite",
    "metro",
  ]);
  assert.deepEqual(smokeTargets({ runtime: "isomorphic", test: false }, ["isomorphic", "node"]), [
    "node",
  ]);
  assert.deepEqual(smokeTargets({ runtime: "node", test: false }, all), ["node"]);
  assert.deepEqual(smokeTargets({ runtime: "browser", test: false }, all), ["vite"]);
  assert.deepEqual(smokeTargets({ runtime: "react-native", test: false }, all), ["metro"]);
  assert.deepEqual(smokeTargets({ runtime: "isomorphic", test: true }, all), ["node"]); // never bundled
  assert.deepEqual(smokeTargets({ runtime: "electron", test: false }, all), []);
  assert.deepEqual(smokeTargets({ runtime: "worker", test: false }, all), []);
});

// -------------------------------------------------------------------------------------------------------------
// publint and arethetypeswrong
// -------------------------------------------------------------------------------------------------------------

const SOUND = {
  "package.json": {
    name: "@t/sound",
    version: "1.0.0",
    type: "module",
    exports: { ".": { types: "./dist/index.d.mts", default: "./dist/index.mjs" } },
  },
  "dist/index.mjs": "export const a = 1;\n",
  "dist/index.d.mts": "export declare const a: number;\n",
};

test("publint passes a sound tarball and fails one whose exports name a file it lacks", async () => {
  assert.deepEqual(await publintFindings("@t/sound", tarball(SOUND)), []);
  const broken = tarball({
    ...SOUND,
    "package.json": {
      ...SOUND["package.json"],
      exports: { ".": { types: "./dist/index.d.mts", default: "./dist/gone.mjs" } },
    },
  });
  const found = await publintFindings("@t/broken", broken);
  assert.ok(found.length > 0);
  assert.ok(found.every((item) => item.check === "publint" && item.subject === "@t/broken"));
  assert.match(found.map((item) => item.message).join("\n"), /FILE_DOES_NOT_EXIST|gone\.mjs/);
});

test("arethetypeswrong passes an ESM package and fails types that resolve as CommonJS for ESM code", async () => {
  assert.deepEqual(await attwFindings("@t/sound", tarball(SOUND)), []);
  // No "type": "module": `index.d.ts` is read as CommonJS while the code is `.mjs` (FalseCJS).
  const falseCjs = tarball({
    "package.json": {
      name: "@t/false-cjs",
      version: "1.0.0",
      exports: { ".": { types: "./index.d.ts", default: "./index.mjs" } },
    },
    "index.mjs": "export const a = 1;\n",
    "index.d.ts": "export declare const a: number;\n",
  });
  const found = await attwFindings("@t/false-cjs", falseCjs);
  assert.ok(found.length > 0);
  assert.match(found[0].message, /FalseCJS/);
  // A data-only package (JSON presets) has no types to check.
  const data = tarball({
    "package.json": { name: "@t/data", version: "1.0.0", exports: { ".": "./base.json" } },
    "base.json": "{}",
  });
  assert.deepEqual(await attwFindings("@t/data", data), []);
});

// -------------------------------------------------------------------------------------------------------------
// pins
// -------------------------------------------------------------------------------------------------------------

/** An index of packed packages at `version` plus a private one. */
function pinIndex(version = "1.0.1", extra = []) {
  return {
    groups: [["@t/*"]],
    workspace: [
      { name: "@t/app", version, private: false },
      { name: "@t/csp", version, private: false },
      { name: "@t/old", version: "0.9.0", private: false },
      { name: "@t/secret", version: "0.0.0", private: true },
    ],
    packages: [{ name: "@t/app", version }, { name: "@t/csp", version }, ...extra],
  };
}

test("pins pass when every workspace dependency is an exact version this release packs", async () => {
  const manifests = new Map([
    ["@t/app", { dependencies: { "@t/csp": "1.0.1", react: "^19.0.0" } }],
    ["@t/csp", {}],
  ]);
  assert.deepEqual(await pinFindings(pinIndex(), manifests), []);
});

test("pins fail a range, a private package and a version neither packed nor on the registry", async () => {
  const manifests = new Map([
    [
      "@t/app",
      {
        dependencies: { "@t/csp": "^1.0.1", "@t/secret": "0.0.0" },
        peerDependencies: { "@t/old": "0.9.0" },
      },
    ],
    ["@t/csp", { optionalDependencies: { "@t/app": "1.0.0" } }],
  ]);
  const messages = (await pinFindings(pinIndex(), manifests)).map(
    (item) => `${item.subject}: ${item.message}`,
  );
  assert.ok(
    messages.some((line) =>
      /@t\/app: dependencies\.@t\/csp is "\^1\.0\.1", not an exact version/.test(line),
    ),
  );
  assert.ok(
    messages.some((line) =>
      /@t\/app: dependencies\.@t\/secret is a private workspace package/.test(line),
    ),
  );
  assert.ok(
    messages.some((line) =>
      /@t\/app@1\.0\.0: pinned by @t\/csp \(optionalDependencies\)/.test(line),
    ),
  );
  // With a registry, a pin to a version that is already published passes and an absent one fails.
  const fetchImpl = fakeRegistry({ versions: { "@t/old@0.9.0": doc("@t/old", "0.9.0") } });
  const withRegistry = await pinFindings(pinIndex(), manifests, {
    registry: "https://r.example/",
    fetchImpl,
  });
  assert.ok(!withRegistry.some((item) => item.subject === "@t/old@0.9.0"));
  assert.ok(
    withRegistry.some(
      (item) => item.subject === "@t/app@1.0.0" && /not on the registry/.test(item.message),
    ),
  );
});

test("pins fail a fixed group packed at two versions", async () => {
  const index = pinIndex("1.0.1", [{ name: "@t/old", version: "0.9.0" }]);
  const found = await pinFindings(index, new Map());
  assert.equal(found.length, 1);
  assert.match(found[0].message, /fixed group packs 2 versions/);
});

// -------------------------------------------------------------------------------------------------------------
// registry completeness
// -------------------------------------------------------------------------------------------------------------

const WORKSPACE = [
  { name: "@t/app", version: "1.0.1", private: false },
  { name: "@t/csp", version: "1.0.1", private: false },
  { name: "@t/identity", version: "1.0.1", private: false },
  { name: "@t/internal", version: "0.0.0", private: true },
];
const SETTLE = { tries: 3, delayMs: 0 };
const TAGS = {
  "@t/app": { latest: "1.0.1" },
  "@t/csp": { latest: "1.0.1" },
  "@t/identity": { latest: "1.0.1" },
};
const COMPLETE = {
  "@t/app@1.0.1": doc("@t/app", "1.0.1", { "@t/csp": "1.0.1", "@t/identity": "1.0.1" }),
  "@t/csp@1.0.1": doc("@t/csp", "1.0.1"),
  "@t/identity@1.0.1": doc("@t/identity", "1.0.1"),
};

test("registry passes a complete release, and settles a version the store shows a moment late", async () => {
  const fetchImpl = fakeRegistry({
    versions: COMPLETE,
    tags: TAGS,
    absentFirst: new Set(["@t/csp@1.0.1"]),
  });
  const found = await registryFindings({
    workspace: WORKSPACE,
    registry: "https://r.example/",
    fetchImpl,
    settle: SETTLE,
  });
  assert.deepEqual(found, []);
});

test("registry fails a partial publish: the missing packages and every pin to them (the 0.33.1 case)", async () => {
  const { "@t/csp@1.0.1": _csp, "@t/identity@1.0.1": _identity, ...partial } = COMPLETE;
  const fetchImpl = fakeRegistry({ versions: partial, tags: { "@t/app": { latest: "1.0.1" } } });
  const found = await registryFindings({
    workspace: WORKSPACE,
    registry: "https://r.example/",
    fetchImpl,
    settle: SETTLE,
  });
  const lines = found.map((item) => `${item.subject}: ${item.message}`);
  assert.ok(lines.includes("@t/csp@1.0.1: is not on the registry"));
  assert.ok(lines.includes("@t/identity@1.0.1: is not on the registry"));
  assert.ok(
    lines.some((line) =>
      line.startsWith(
        "@t/app@1.0.1: dependencies.@t/csp pins @t/csp@1.0.1, which is not on the registry",
      ),
    ),
  );
  assert.ok(lines.some((line) => line.startsWith("@t/app@1.0.1: dependencies.@t/identity pins")));
  assert.ok(
    !lines.some((line) => line.startsWith("@t/internal")),
    "a private package is never expected",
  );
});

test("registry fails a dist-tag left on the previous release, and skips the tag check when told to", async () => {
  const fetchImpl = fakeRegistry({
    versions: COMPLETE,
    tags: { ...TAGS, "@t/csp": { latest: "1.0.0" } },
  });
  const found = await registryFindings({
    workspace: WORKSPACE,
    registry: "https://r.example/",
    fetchImpl,
    settle: SETTLE,
  });
  assert.deepEqual(
    found.map((item) => `${item.subject}: ${item.message}`),
    ["@t/csp@1.0.1: dist-tag latest is 1.0.0, not 1.0.1"],
  );
  const untagged = await registryFindings({
    workspace: WORKSPACE,
    registry: "https://r.example/",
    fetchImpl,
    settle: SETTLE,
    distTag: "",
  });
  assert.deepEqual(untagged, []);
});

test("registry reads never have more than the limit in flight (a burst of 119 dropped connections)", async () => {
  const inner = fakeRegistry({ versions: COMPLETE, tags: TAGS });
  let inFlight = 0;
  let peak = 0;
  const fetchImpl = async (url) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((done) => {
      setTimeout(done, 5);
    });
    inFlight -= 1;
    return inner(url);
  };
  const many = Array.from({ length: 30 }, (_, i) => ({
    name: `@t/p${i}`,
    version: "1.0.1",
    private: false,
  }));
  await registryFindings({
    workspace: many,
    registry: "https://r.example/",
    fetchImpl,
    settle: { tries: 1, delayMs: 0 },
    distTag: "",
    concurrency: 4,
  });
  assert.ok(peak <= 4, `peak ${peak} requests in flight`);
  assert.ok(peak >= 2, "reads still run in parallel");
  assert.deepEqual(await mapLimit([3, 1, 2], 2, async (n) => n * 2), [6, 2, 4]);
});

test("registry checks an earlier release with --version, every public package at that version", async () => {
  const fetchImpl = fakeRegistry({
    versions: {
      ...COMPLETE,
      "@t/app@1.0.0": doc("@t/app", "1.0.0"),
      "@t/csp@1.0.0": doc("@t/csp", "1.0.0"),
    },
    tags: TAGS,
  });
  const found = await registryFindings({
    workspace: WORKSPACE,
    version: "1.0.0",
    fetchImpl,
    settle: SETTLE,
    distTag: "",
  });
  assert.deepEqual(
    found.map((item) => `${item.subject}: ${item.message}`),
    ["@t/identity@1.0.0: is not on the registry"],
  );
});

// -------------------------------------------------------------------------------------------------------------
// baseline
// -------------------------------------------------------------------------------------------------------------

test("the baseline lets a known finding through and fails a row whose finding is gone", () => {
  const findings = [
    { check: "smoke:metro", subject: "@t/panel", message: "Invalid call" },
    { check: "attw", subject: "@t/x", message: "FalseCJS" },
  ];
  const baseline = {
    "smoke:metro": { "@t/panel": "STA-1: why", "@t/fixed": "STA-2: why" },
    registry: { "@t/y": "STA-3" },
  };
  const { failures, known } = applyBaseline(findings, baseline, ["smoke:metro", "attw"]);
  assert.deepEqual(
    known.map((item) => item.subject),
    ["@t/panel"],
  );
  assert.deepEqual(
    failures.map((item) => `${item.check} ${item.subject}`),
    ["attw @t/x", "smoke:metro @t/fixed"], // the registry row is not judged: that check did not run
  );
  assert.match(failures[1].message, /remove it from release-gate\.baseline\.yaml/);
});

test("every baseline row names the issue that fixes it", async () => {
  const baseline = await readBaseline();
  for (const [check, rows] of Object.entries(baseline))
    for (const [subject, reason] of Object.entries(rows))
      assert.match(reason, /^[A-Z]+-\d+: \S/, `${check} ${subject} names no issue`);
});

// -------------------------------------------------------------------------------------------------------------
// the smoke consumer and the Node runner
// -------------------------------------------------------------------------------------------------------------

test("the consumer installs every tarball over any registry, the non-host peers and the tools", () => {
  const index = {
    packages: [
      { name: "@t/app", tarball: "t-app-1.0.1.tgz" },
      { name: "@t/ui", tarball: "t-ui-1.0.1.tgz" },
    ],
  };
  const manifests = new Map([
    ["@t/app", { peerDependencies: { react: ">=19.2.0", expo: "57.0.30", "@t/ui": "1.0.1" } }],
    [
      "@t/ui",
      { peerDependencies: { react: "19.3.0", "react-native": "*", "@heroui/react": "^3.2.7" } },
    ],
  ]);
  const { pkg, workspace, npmrc } = consumerManifest(
    index,
    manifests,
    "/packs",
    "https://r.example/",
  );
  assert.equal(pkg.dependencies["@t/app"], "file:/packs/t-app-1.0.1.tgz");
  assert.equal(pkg.dependencies.react, "19.3.0", "an exact peer range wins");
  assert.equal(pkg.dependencies["@heroui/react"], "^3.2.7");
  assert.ok(
    !("expo" in pkg.dependencies) && !("react-native" in pkg.dependencies),
    "hosts are not installed on purpose",
  );
  for (const [name, version] of Object.entries(consumerTools()))
    assert.equal(pkg.dependencies[name], version);
  assert.match(workspace, /^ {2}"@t\/ui": "file:\/packs\/t-ui-1\.0\.1\.tgz"$/m);
  assert.match(workspace, /^ignoreScripts: true$/m);
  assert.match(workspace, /^minimumReleaseAge: 1440$/m);
  assert.match(npmrc, /^@stackra:registry=https:\/\/r\.example\/$/m);
});

test("the consumer's tools are versions the repository's lockfile already holds", () => {
  const lock = readFileSync(join(REPO_ROOT, "pnpm-lock.yaml"), "utf8");
  for (const [name, version] of Object.entries(consumerTools())) {
    const key = `${name}@${version}`;
    assert.ok(
      lock.includes(`\n  ${key}:\n`) || lock.includes(`\n  '${key}':\n`),
      `${key} is not in pnpm-lock.yaml`,
    );
  }
});

test("the Metro runner resolves the same host modules to empty ones as the gate leaves uninstalled", () => {
  const runner = readFileSync(join(RUNNERS, "metro-runner.cjs"), "utf8");
  assert.ok(
    runner.includes(HOST_MODULE.source),
    "metro-runner.cjs HOST_MODULE differs from release-gate.mjs",
  );
  for (const host of [
    "react-native",
    "react-native-svg",
    "expo",
    "expo-haptics",
    "@expo/ui",
    "electron",
    "heroui-native",
  ])
    assert.ok(HOST_MODULE.test(host), host);
  for (const library of ["react", "react-dom", "expose", "@heroui/react", "electron-store"])
    assert.ok(!HOST_MODULE.test(library), library);
});

test("the Node runner loads a sound entry and reports a broken one", () => {
  const consumer = folder({
    "node_modules/@t/good/package.json": {
      name: "@t/good",
      type: "module",
      exports: { ".": "./index.mjs" },
    },
    "node_modules/@t/good/index.mjs": "export const a = 1;\n",
    "node_modules/@t/broken/package.json": {
      name: "@t/broken",
      type: "module",
      exports: { ".": "./index.mjs" },
    },
    "node_modules/@t/broken/index.mjs": 'export { a } from "./gone.mjs";\n',
    "node_modules/@t/peer/package.json": {
      name: "@t/peer",
      type: "module",
      exports: { ".": "./index.mjs" },
    },
    "node_modules/@t/peer/index.mjs": 'import "not-installed-anywhere";\n',
    "specs.json": JSON.stringify(["@t/good", "@t/broken", "@t/peer", "@t/absent"]),
  });
  const result = spawnSync(
    process.execPath,
    [join(RUNNERS, "node-runner.mjs"), join(consumer, "specs.json")],
    {
      cwd: consumer,
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const rows = Object.fromEntries(
    result.stdout
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line))
      .map((row) => [row.spec, row]),
  );
  assert.equal(rows["@t/good"].ok, true);
  for (const spec of ["@t/broken", "@t/peer", "@t/absent"]) {
    assert.equal(rows[spec].ok, false, spec);
    assert.match(rows[spec].error, /ERR_MODULE_NOT_FOUND|Cannot find/, spec);
  }
});

// -------------------------------------------------------------------------------------------------------------
// CLI and the release workflow
// -------------------------------------------------------------------------------------------------------------

test("the CLI answers usage with exit 2", () => {
  for (const args of [
    [],
    ["pack"],
    ["smoke", "--packs", "x", "--targets", "jest"],
    ["nope"],
    ["check", "stray"],
  ]) {
    const result = spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8" });
    assert.equal(result.status, 2, `${args.join(" ")}: ${result.stderr}`);
    assert.match(result.stderr, /usage: node tools\/scripts\/release-gate\.mjs/);
  }
});

test("the release workflow gates the publish on the package checks and checks the registry after it", () => {
  const workflow = readFileSync(join(REPO_ROOT, ".github", "workflows", "release.yml"), "utf8");
  const job = (name) => {
    const start = workflow.indexOf(`\n  ${name}:\n`);
    assert.ok(start >= 0, `release.yml has no ${name} job`);
    const rest = workflow.slice(start + 1);
    const end = rest.slice(1).search(/\n {2}[a-z][a-z0-9-]*:\n/);
    return end < 0 ? rest : rest.slice(0, end + 1);
  };
  const checks = job("package-checks");
  assert.match(checks, /node tools\/scripts\/release-gate\.mjs all /);
  assert.match(checks, /permissions:\n\s+contents: read/);
  assert.doesNotMatch(
    checks,
    /id-token: write|environment:/,
    "the package checks hold no publish credential",
  );
  const release = job("release");
  assert.match(release, /needs: \[gate, package-checks\]/);
  assert.match(release, /needs\.package-checks\.result == 'success'/);
  const registry = job("registry-check");
  assert.match(registry, /needs: release/);
  assert.match(registry, /needs\.release\.outputs\.published == 'true'/);
  assert.match(registry, /node tools\/scripts\/release-gate\.mjs registry /);
});
