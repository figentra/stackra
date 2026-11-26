#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the release gate of ADR 0177 decision 4 (PK4): what a consumer receives is checked before it is published,
 *   and what the registry holds is checked after. Five commands:
 *   - `pack --out <dir>` packs every public workspace package with `pnpm pack` (so `.pnpmfile.mjs` beforePacking runs,
 *     as for the publish) and writes `<dir>/index.json`: name, version, tarball, declared runtimes and, per export
 *     subpath, the runtime its code runs on (a host subpath such as `./native`, else the `Runtime:` line of the
 *     entry's source file contract, ADR 0007).
 *   - `check --packs <dir>` runs publint (errors and warnings fail), arethetypeswrong under the ESM-only profile
 *     (every problem but the node10 and node16-cjs resolutions fails; a package with no JavaScript entry has nothing
 *     to type) and the pin check: every dependency on a workspace package is an exact version, of a package that is
 *     published, at the version this release packs (or, with `--registry`, one already on the registry), and every
 *     package of a changesets `fixed` group packs at one version (ADR 0177 PK5).
 *   - `smoke --packs <dir>` installs every tarball into a throwaway consumer outside the repository (pnpm, scripts
 *     off, a one-day minimum release age) with the peers a full app has, then imports each Node entry in its own
 *     Node process, builds each browser entry with Vite and builds the module graph of each React Native entry with
 *     Metro under babel-preset-expo. React Native, Expo and Electron host modules resolve to empty modules in Metro
 *     and are never installed on purpose: the smoke checks Stackra's packages, not the hosts.
 *   - `registry [--version <v>] [--dist-tag latest]` runs after a publish: every public workspace package is on the
 *     registry at the release version (its workspace version, or `--version` for an earlier release), every workspace dependency each published version pins resolves there, and
 *     the dist-tag points at the release. A partial publish (0.33.1 stopped at 99 of 119 and left @stackra/app
 *     pinning csp, identity and settings at a version that answers 404) fails here.
 *   - `all --out <dir>` is pack, check and smoke in one run (`pnpm release:check`).
 *   A finding named in `release-gate.baseline.yaml` (with the issue that fixes it) is reported but does not fail;
 *   a baselined finding that no longer occurs fails, so the baseline only shrinks.
 * Boundary: reads the workspace and the registry; writes only `--out` / `--packs` and the consumer folder
 *   (`--work`, default a new folder under the OS temp directory). Never publishes, tags or changes a dist-tag.
 * Runtime: node
 * Secrets: none. Registry reads are anonymous; no token is read, passed or printed.
 * Governing contract: ADR 0177 (decision 4, PK4 release checks; decision 5, one fixed version); ADR 0453 (decision 7,
 *   versions are immutable on the Stackra registry); ADR 0006 (exports); ADR 0007 (the `Runtime:` contract line);
 *   ADR 0004 (delivery-surface subpaths); STA-2705.
 * Exit: 0 clean, 1 a finding, 2 usage.
 */
import { execFile, execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The repository root (this file is tools/scripts/release-gate.mjs). */
export const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
/** The runner scripts and the consumer's tool pins. */
const GATE_DIR = fileURLToPath(new URL("./release-gate/", import.meta.url));
/** Known findings, each with the issue that fixes it. */
export const BASELINE_FILE = fileURLToPath(
  new URL("./release-gate.baseline.yaml", import.meta.url),
);
/** The Stackra registry (ADR 0453); the release workflow passes the same URL to runway-npm.yml. */
export const DEFAULT_REGISTRY = "https://npm.stackra.figentra.com/";

/** The dependency fields a consumer's install reads; devDependencies are not installed from a tarball. */
const CONSUMER_FIELDS = ["dependencies", "optionalDependencies", "peerDependencies"];
/** An exact semver version (with an optional prerelease), the only spec a fixed-group pin may have. */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
/**
 * arethetypeswrong resolutions an ESM-only package is not expected to satisfy: node10 (no `exports` support) and a
 * CommonJS `require` under node16 (every Stackra entry is `.mjs`). The CLI's `--profile esm-only` ignores the same.
 */
export const ESM_ONLY_IGNORED_RESOLUTIONS = ["node10", "node16-cjs"];
/**
 * A subpath that names its host (ADR 0004 delivery surfaces): the entry runs there whatever its contract line says
 * (a barrel's own file is often plain TypeScript while what it re-exports needs the host).
 */
export const HOST_SUBPATHS = {
  native: "react-native",
  desktop: "electron",
  worker: "worker",
  edge: "worker",
  sw: "worker",
  "service-worker": "worker",
};
/** Subpaths a test runner loads in Node; never bundled for a browser or a device. */
export const TEST_SUBPATHS = new Set(["testing", "e2e", "int", "coverage"]);
/** Packages whose every entry runs inside a test runner (ADR 0269: @stackra/testing's entries), never in a bundle. */
export const TEST_PACKAGES = new Set(["@stackra/testing"]);
/**
 * Host modules: React Native, Expo and Electron and the libraries that only run inside them. The smoke consumer does
 * not install them on purpose (a required peer pnpm installs anyway is fine) and Metro resolves them to empty modules.
 */
export const HOST_MODULE =
  /^(?:react-native(?:$|[-/])|@react-native(?:-community)?\/|expo(?:$|[-/])|@expo\/|electron$|heroui-native(?:$|\/)|uniwind(?:$|\/)|lucide-react-native(?:$|\/)|@shopify\/react-native-skia(?:$|\/)|victory-native(?:$|\/)|@10play\/|@react-navigation\/|@testing-library\/react-native(?:$|\/))/;
/** An Expo config plugin (`./app.plugin.js`) is loaded by Expo's CLI, never imported with types. */
const EXPO_CONFIG_PLUGIN = "./app.plugin.js";

// ---------------------------------------------------------------------------------------------------------------
// Workspace and packing
// ---------------------------------------------------------------------------------------------------------------

/** Every workspace package: name, version, folder, whether it is private, and its package.json. */
export function listWorkspace(root = REPO_ROOT) {
  const out = execFileSync("pnpm", ["-r", "ls", "--depth", "-1", "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  return JSON.parse(out)
    .filter((row) => resolve(row.path) !== resolve(root)) // the root is no package
    .map((row) => {
      const manifest = JSON.parse(readFileSync(join(row.path, "package.json"), "utf8"));
      return {
        name: manifest.name,
        version: manifest.version,
        dir: row.path,
        private: manifest.private === true,
        manifest,
      };
    });
}

/** The changesets `fixed` groups (`.changeset/config.json`), as arrays of name globs. */
export function fixedGroups(root = REPO_ROOT) {
  const file = join(root, ".changeset", "config.json");
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")).fixed ?? [];
}

/** Whether `name` matches a changesets glob (`@scope/*` or an exact name). */
export function matchesGlob(name, glob) {
  const pattern = glob.replaceAll(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${pattern}$`).test(name);
}

/** The `Runtime:` value of a source file's contract header (ADR 0007), or undefined. */
export function contractRuntime(file) {
  if (!existsSync(file)) return undefined;
  const head = readFileSync(file, "utf8").slice(0, 6000);
  return /^\s*\*?\s*Runtime:[ \t]*([a-z-]+)/m.exec(head)?.[1];
}

/** The file an export value resolves to for a consumer (`default`, then `import`), or undefined. */
export function exportTarget(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(exportTarget).find(Boolean);
  if (value === null || typeof value !== "object") return undefined;
  for (const key of ["import", "default"]) if (key in value) return exportTarget(value[key]);
  return undefined;
}

/**
 * The JavaScript entries of a package (wildcard and non-JS subpaths have no single module to load) with the runtime
 * each runs on: the host a subpath names, else the `Runtime:` line of the source file behind `@stackra/source`.
 */
export function packageEntries(manifest, dir) {
  const exports = manifest.exports;
  if (exports === undefined || exports === null) return [];
  const table =
    typeof exports === "string" || !Object.keys(exports).some((key) => key.startsWith("."))
      ? { ".": exports }
      : exports;
  const entries = [];
  for (const [subpath, value] of Object.entries(table)) {
    if (subpath.includes("*")) continue;
    const target = exportTarget(value);
    if (typeof target !== "string" || !/\.(?:mjs|cjs|js)$/.test(target)) continue;
    if (subpath === EXPO_CONFIG_PLUGIN) continue; // loaded by Expo's CLI, never imported by an app
    const segments = subpath.split("/").slice(1);
    const host = HOST_SUBPATHS[segments[0]];
    const source =
      value !== null && typeof value === "object" && typeof value["@stackra/source"] === "string"
        ? value["@stackra/source"]
        : undefined;
    const runtime = host ?? (source ? contractRuntime(join(dir, source)) : undefined) ?? "unknown";
    entries.push({
      spec: manifest.name + subpath.slice(1),
      subpath,
      runtime,
      test: TEST_PACKAGES.has(manifest.name) || TEST_SUBPATHS.has(segments[0] ?? ""),
    });
  }
  return entries;
}

/**
 * Which smoke runs load an entry. Node: a package that runs on Node or anywhere, an entry for Node or anywhere (test
 * entries included). Vite: a package that declares the browser, an entry for the browser or anywhere. Metro: a
 * package that declares React Native, an entry for React Native or anywhere. Test entries are never bundled.
 */
export function smokeTargets(entry, runtimes) {
  const targets = [];
  const declared = new Set(runtimes ?? []);
  if (
    (declared.has("node") || declared.has("isomorphic")) &&
    ["node", "isomorphic"].includes(entry.runtime)
  )
    targets.push("node");
  if (!entry.test && declared.has("browser") && ["browser", "isomorphic"].includes(entry.runtime))
    targets.push("vite");
  if (
    !entry.test &&
    declared.has("react-native") &&
    ["react-native", "isomorphic"].includes(entry.runtime)
  )
    targets.push("metro");
  return targets;
}

/** Packs every public workspace package into `out` and writes `out/index.json`. */
export function packAll({ root = REPO_ROOT, out }) {
  mkdirSync(out, { recursive: true });
  const packages = listWorkspace(root);
  const index = { root, groups: fixedGroups(root), workspace: [], packages: [] };
  for (const pkg of packages) {
    index.workspace.push({ name: pkg.name, version: pkg.version, private: pkg.private });
    if (pkg.private) continue;
    const before = new Set(readdirSync(out));
    execFileSync("pnpm", ["pack", "--pack-destination", out], {
      cwd: pkg.dir,
      stdio: ["ignore", "ignore", "inherit"],
    });
    const made = readdirSync(out).filter((file) => file.endsWith(".tgz") && !before.has(file));
    if (made.length !== 1) throw new Error(`${pkg.name}: pnpm pack made ${made.length} tarballs`);
    index.packages.push({
      name: pkg.name,
      version: pkg.version,
      tarball: made[0],
      runtimes: pkg.manifest.stackra?.runtimes ?? [],
      entries: packageEntries(pkg.manifest, pkg.dir),
    });
  }
  writeFileSync(join(out, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

/** Reads `dir/index.json` written by `pack`. */
export function readIndex(dir) {
  const file = join(dir, "index.json");
  if (!existsSync(file))
    throw new Error(`${file} is missing: run \`release-gate.mjs pack --out ${dir}\` first`);
  return JSON.parse(readFileSync(file, "utf8"));
}

/** The package.json inside a tarball. */
export function tarballManifest(tarball) {
  return JSON.parse(
    execFileSync("tar", ["-xzOf", tarball, "package/package.json"], { encoding: "utf8" }),
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Findings and the baseline
// ---------------------------------------------------------------------------------------------------------------

/** One finding: which check, about what (a package name or an entry), and what is wrong. */
function finding(check, subject, message) {
  return { check, subject, message };
}

/** The baseline: `{ check: { subject: "<issue key>: <why>" } }`, read from YAML. */
export async function readBaseline(file = BASELINE_FILE) {
  if (!existsSync(file)) return {};
  const { parse } = await import("yaml");
  return parse(readFileSync(file, "utf8"))?.known ?? {};
}

/**
 * Splits findings into failures and baselined ones; a baseline row of a check that ran whose finding is gone is
 * stale, and fails, so the baseline is shrunk the day the fix lands.
 */
export function applyBaseline(findings, baseline, checksRun) {
  const failures = [];
  const known = [];
  const seen = new Set();
  for (const item of findings) {
    const reason = baseline[item.check]?.[item.subject];
    if (reason) {
      known.push({ ...item, reason });
      seen.add(`${item.check}\u0000${item.subject}`);
    } else failures.push(item);
  }
  for (const check of checksRun) {
    for (const [subject, reason] of Object.entries(baseline[check] ?? {})) {
      if (!seen.has(`${check}\u0000${subject}`))
        failures.push(
          finding(
            check,
            subject,
            `passes now; remove it from release-gate.baseline.yaml (it named ${reason})`,
          ),
        );
    }
  }
  return { failures, known };
}

/** Prints findings, as GitHub annotations on Actions; returns the exit code. */
function report({ failures, known }, label) {
  const github = process.env.GITHUB_ACTIONS === "true";
  for (const item of known)
    console.log(`known  ${item.check} ${item.subject}: ${item.message} (${item.reason})`);
  for (const item of failures) {
    const line = `${item.subject}: ${item.message}`.replaceAll(/\r?\n/g, " ");
    console.log(
      github
        ? `::error title=Release gate (${item.check})::${line}`
        : `FAIL   ${item.check} ${line}`,
    );
  }
  console.log(`${label}: ${failures.length} failing, ${known.length} known`);
  return failures.length === 0 ? 0 : 1;
}

// ---------------------------------------------------------------------------------------------------------------
// check: publint, arethetypeswrong, pins
// ---------------------------------------------------------------------------------------------------------------

/** The tarball bytes as the ArrayBuffer publint reads. */
function arrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Text without ANSI colour codes (publint's formatter colours its output). */
function stripAnsi(text) {
  return text.replaceAll(new RegExp(`${String.fromCodePoint(27)}\\[[0-9;]*m`, "g"), "");
}

/** Waits `ms` milliseconds. */
function sleep(ms) {
  return new Promise((done) => {
    setTimeout(done, ms);
  });
}

/** publint findings of one tarball: errors and warnings (strict mode); suggestions are left to the author. */
export async function publintFindings(name, bytes) {
  const { publint } = await import("publint");
  const { formatMessage } = await import("publint/utils");
  const { messages, pkg } = await publint({
    pack: { tarball: arrayBuffer(bytes) },
    level: "warning",
    strict: true,
  });
  return messages.map((message) =>
    finding(
      "publint",
      name,
      `${message.type} ${message.code}: ${stripAnsi(formatMessage(message, pkg) ?? message.code)}`,
    ),
  );
}

/** arethetypeswrong findings of one tarball under the ESM-only profile. */
export async function attwFindings(name, bytes) {
  const { checkPackage, createPackageFromTarballData } = await import("@arethetypeswrong/core");
  const { problemAffectsResolutionKind, problemKindInfo } =
    await import("@arethetypeswrong/core/problems");
  const analysis = await checkPackage(createPackageFromTarballData(new Uint8Array(bytes)));
  if (analysis.types === false) return []; // no JavaScript entry declares types: nothing to resolve
  const kinds = ["node16-esm", "bundler"];
  const out = new Map();
  for (const problem of analysis.problems) {
    if ("entrypoint" in problem && problem.entrypoint === EXPO_CONFIG_PLUGIN) continue;
    const hit = kinds.filter((kind) => problemAffectsResolutionKind(problem, kind, analysis));
    if (hit.length === 0) continue;
    const where = "entrypoint" in problem ? ` at ${problem.entrypoint}` : "";
    const message = `${problem.kind}${where} (${hit.join(", ")}): ${problemKindInfo[problem.kind]?.shortDescription ?? ""}`;
    out.set(message, finding("attw", name, message));
  }
  return [...out.values()];
}

/**
 * Runs `work` over `items` with at most `limit` calls in flight, in order of the items. The registry answers a burst
 * of 119 parallel reads with dropped connections ("fetch failed"), so every registry read goes through this.
 */
export async function mapLimit(items, limit, work) {
  const results = Array.from({ length: items.length });
  let next = 0;
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const at = next;
      next += 1;
      results[at] = await work(items[at], at);
    }
  });
  await Promise.all(lanes);
  return results;
}

/** Registry reads in flight at once (see mapLimit). */
export const REGISTRY_CONCURRENCY = 8;

/** Whether name@version is on the registry (200), absent (404), or the registry did not answer. */
export async function registryVersion(registry, name, version, { fetchImpl = fetch } = {}) {
  const url = `${registry}${name.replace("/", "%2f")}/${encodeURIComponent(version)}`;
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(20_000) });
      if (response.status === 404) return { state: "absent" };
      if (response.ok) return { state: "present", doc: await response.json() };
      if (response.status < 500 && response.status !== 429 && response.status !== 408)
        return { state: "unavailable", detail: `HTTP ${response.status}` };
      if (attempt >= 3) return { state: "unavailable", detail: `HTTP ${response.status}` };
    } catch (error) {
      if (attempt >= 3) return { state: "unavailable", detail: String(error?.message ?? error) };
    }
    await sleep(1000 * attempt);
  }
}

/**
 * The pin check over the packed set. Every dependency a consumer installs that names a workspace package must be an
 * exact version of a public package, at the version packed here, or (with a registry) one already published; every
 * package of a fixed group packs at one version.
 */
export async function pinFindings(index, manifests, { registry, fetchImpl } = {}) {
  const findings = [];
  const workspace = new Map(index.workspace.map((row) => [row.name, row]));
  const packed = new Map(index.packages.map((row) => [row.name, row.version]));
  for (const group of index.groups ?? []) {
    const members = index.packages.filter((row) =>
      group.some((glob) => matchesGlob(row.name, glob)),
    );
    const versions = new Set(members.map((row) => row.version));
    if (versions.size > 1)
      findings.push(
        finding(
          "pins",
          group.join(" "),
          `the fixed group packs ${versions.size} versions (${[...versions].join(", ")}); one release is one version`,
        ),
      );
  }
  const outside = new Map();
  for (const [name, manifest] of manifests) {
    for (const field of CONSUMER_FIELDS) {
      for (const [dep, spec] of Object.entries(manifest[field] ?? {})) {
        const row = workspace.get(dep);
        if (!row) continue;
        if (row.private) {
          findings.push(
            finding(
              "pins",
              name,
              `${field}.${dep} is a private workspace package, never published`,
            ),
          );
          continue;
        }
        if (!EXACT_VERSION.test(spec)) {
          findings.push(
            finding("pins", name, `${field}.${dep} is "${spec}", not an exact version`),
          );
          continue;
        }
        if (packed.get(dep) === spec) continue;
        const key = `${dep}@${spec}`;
        if (!outside.has(key)) outside.set(key, []);
        outside.get(key).push(`${name} (${field})`);
      }
    }
  }
  for (const [key, users] of outside) {
    const at = key.lastIndexOf("@");
    const dep = key.slice(0, at);
    const version = key.slice(at + 1);
    if (!registry) {
      findings.push(
        finding(
          "pins",
          key,
          `pinned by ${users.join(", ")} but this release packs ${dep}@${packed.get(dep)}`,
        ),
      );
      continue;
    }
    const { state, detail } = await registryVersion(registry, dep, version, { fetchImpl });
    if (state !== "present")
      findings.push(
        finding(
          "pins",
          key,
          `pinned by ${users.join(", ")}, not packed here and ${state === "absent" ? "not on the registry" : `the registry did not answer (${detail})`}`,
        ),
      );
  }
  return findings;
}

/** publint, arethetypeswrong and the pin check over a pack folder. */
export async function runCheck({ packs, registry, fetchImpl }) {
  const index = readIndex(packs);
  console.log(`check: ${index.packages.length} tarballs, digest ${packsDigest(packs)}`);
  const findings = [];
  const manifests = new Map();
  for (const row of index.packages) {
    const file = join(packs, row.tarball);
    const bytes = readFileSync(file);
    manifests.set(row.name, tarballManifest(file));
    findings.push(...(await publintFindings(row.name, bytes)));
    findings.push(...(await attwFindings(row.name, bytes)));
  }
  findings.push(...(await pinFindings(index, manifests, { registry, fetchImpl })));
  return findings;
}

// ---------------------------------------------------------------------------------------------------------------
// smoke: Node, Vite and Metro in a throwaway consumer
// ---------------------------------------------------------------------------------------------------------------

/** The consumer's tools, versions the repository's own lockfile already holds (see the test that checks it). */
export function consumerTools() {
  return JSON.parse(readFileSync(join(GATE_DIR, "consumer-tools.json"), "utf8")).tools;
}

/**
 * The smoke consumer's package.json and pnpm settings: every tarball (and an override, so a Stackra dependency never
 * resolves from a registry), every non-host peer the packages declare (an exact range wins over a looser one), and
 * the tools.
 */
export function consumerManifest(index, manifests, packsDir, registry) {
  const dependencies = {};
  const overrides = {};
  const peers = {};
  const packedNames = new Set(index.packages.map((row) => row.name));
  for (const row of index.packages) {
    const spec = `file:${join(packsDir, row.tarball)}`;
    dependencies[row.name] = spec;
    overrides[row.name] = spec;
  }
  for (const manifest of manifests.values()) {
    for (const [peer, range] of Object.entries(manifest.peerDependencies ?? {})) {
      if (packedNames.has(peer) || HOST_MODULE.test(peer)) continue;
      if (!peers[peer] || EXACT_VERSION.test(range)) peers[peer] = range;
    }
  }
  const pkg = {
    name: "stackra-release-smoke",
    private: true,
    type: "module",
    dependencies: { ...peers, ...consumerTools(), ...dependencies },
  };
  const workspace = [
    "# Written by tools/scripts/release-gate.mjs: a consumer of the packed tarballs, never published.",
    "autoInstallPeers: true",
    "strictPeerDependencies: false",
    "ignoreScripts: true",
    "minimumReleaseAge: 1440",
    "minimumReleaseAgeExclude:",
    '  - "@figentra-oss/*"',
    "overrides:",
    ...Object.entries(overrides).map(
      ([name, spec]) => `  ${JSON.stringify(name)}: ${JSON.stringify(spec)}`,
    ),
    "",
  ].join("\n");
  const npmrc = `@stackra:registry=${registry}\n@figentra-oss:registry=${registry}\n`;
  return { pkg, workspace, npmrc };
}

/** Runs a command, streaming its output; rejects on a non-zero exit. */
function run(command, args, options) {
  return new Promise((done, fail) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", fail);
    child.on("exit", (code) =>
      code === 0 ? done() : fail(new Error(`${command} ${args.join(" ")} exited ${code}`)),
    );
  });
}

/** Runs a runner script in the consumer; it prints one JSON line per entry: `{ spec, ok, error }`. */
function runRunner(work, script, specs) {
  writeFileSync(join(work, `${script}.specs.json`), JSON.stringify(specs));
  return new Promise((done, fail) => {
    execFile(
      process.execPath,
      [join(work, script), join(work, `${script}.specs.json`)],
      { cwd: work, maxBuffer: 1 << 28, env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } },
      (error, stdout, stderr) => {
        const rows = stdout
          .split("\n")
          .filter((line) => line.startsWith("{"))
          .map((line) => JSON.parse(line));
        if (rows.length !== specs.length) {
          fail(
            new Error(
              `${script} reported ${rows.length} of ${specs.length} entries${error ? ` (${error.message})` : ""}\n${stderr.slice(-4000)}`,
            ),
          );
          return;
        }
        done(rows);
      },
    );
  });
}

/** The smoke runners each target uses (copied into the consumer, so they resolve vite and metro from there). */
const RUNNERS = { node: "node-runner.mjs", vite: "vite-runner.mjs", metro: "metro-runner.cjs" };

/** Installs the consumer and runs the Node, Vite and Metro smoke; returns findings per `smoke:<target>`. */
export async function runSmoke({
  packs,
  work,
  registry = DEFAULT_REGISTRY,
  targets = ["node", "vite", "metro"],
  storeDir,
}) {
  const index = readIndex(packs);
  const packsDir = resolve(packs);
  const manifests = new Map(
    index.packages.map((row) => [row.name, tarballManifest(join(packsDir, row.tarball))]),
  );
  mkdirSync(work, { recursive: true });
  const { pkg, workspace, npmrc } = consumerManifest(index, manifests, packsDir, registry);
  writeFileSync(join(work, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  writeFileSync(join(work, "pnpm-workspace.yaml"), workspace);
  writeFileSync(join(work, ".npmrc"), npmrc);
  writeFileSync(join(work, "babel.config.json"), '{ "presets": ["babel-preset-expo"] }\n');
  for (const file of Object.values(RUNNERS)) copyFileSync(join(GATE_DIR, file), join(work, file));
  const install = ["install", "--ignore-scripts", "--reporter=append-only"];
  if (storeDir) install.push("--store-dir", storeDir);
  // CI=true would make pnpm refuse an install without a lockfile (frozen); this consumer resolves fresh on purpose.
  await run("pnpm", install, { cwd: work, env: { ...process.env, CI: "" } });

  const findings = [];
  for (const target of targets) {
    const specs = index.packages.flatMap((row) =>
      row.entries
        .filter((entry) => smokeTargets(entry, row.runtimes).includes(target))
        .map((entry) => entry.spec),
    );
    const started = Date.now();
    const rows = specs.length === 0 ? [] : await runRunner(work, RUNNERS[target], specs);
    const failed = rows.filter((row) => !row.ok);
    for (const row of failed) findings.push(finding(`smoke:${target}`, row.spec, row.error));
    console.log(
      `smoke ${target}: ${rows.length - failed.length} of ${rows.length} entries load (${Math.round((Date.now() - started) / 1000)} s)`,
    );
  }
  return findings;
}

// ---------------------------------------------------------------------------------------------------------------
// registry: after a publish, the release is complete on the registry
// ---------------------------------------------------------------------------------------------------------------

/** The dist-tags of a package, or undefined when the registry does not answer them (three tries). */
async function distTags(registry, name, fetchImpl) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchImpl(`${registry}${name.replace("/", "%2f")}`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) return (await response.json())["dist-tags"] ?? {};
      if (response.status < 500 && response.status !== 429 && response.status !== 408)
        return undefined;
    } catch {
      // a dropped connection is asked again
    }
    if (attempt < 3) await sleep(1000 * attempt);
  }
  return undefined;
}

/**
 * The completeness check: every public workspace package is on the registry at its workspace version, every
 * workspace dependency each of those versions pins is there too, and (unless `distTag` is empty) the dist-tag points
 * at the version. `version` checks every public package at that version instead of its workspace version (an earlier
 * release of the fixed group, or the one `latest` names).
 */
export async function registryFindings({
  workspace,
  registry = DEFAULT_REGISTRY,
  version,
  distTag = "latest",
  fetchImpl = fetch,
  settle = { tries: 3, delayMs: 15_000 },
  concurrency = REGISTRY_CONCURRENCY,
}) {
  const findings = [];
  const names = new Set(workspace.map((row) => row.name));
  const releasing = workspace
    .filter((row) => !row.private)
    .map((row) => ({ ...row, version: version ?? row.version }));
  if (releasing.length === 0)
    return [finding("registry", "workspace", "the workspace has no public package")];
  const docs = new Map();
  const lookup = async (name, at) => {
    const key = `${name}@${at}`;
    if (!docs.has(key)) {
      let result = await registryVersion(registry, name, at, { fetchImpl });
      // A store can answer 404 for a moment after a publish it accepted: an absent version is asked again.
      for (let attempt = 1; result.state === "absent" && attempt < settle.tries; attempt += 1) {
        await sleep(settle.delayMs);
        result = await registryVersion(registry, name, at, { fetchImpl });
      }
      docs.set(key, result);
    }
    return docs.get(key);
  };
  await mapLimit(releasing, concurrency, (row) => lookup(row.name, row.version));
  const missing = [];
  for (const row of releasing) {
    const { state, doc, detail } = docs.get(`${row.name}@${row.version}`);
    if (state === "absent") {
      missing.push(row.name);
      findings.push(finding("registry", `${row.name}@${row.version}`, "is not on the registry"));
      continue;
    }
    if (state !== "present") {
      findings.push(
        finding(
          "registry",
          `${row.name}@${row.version}`,
          `the registry did not answer (${detail})`,
        ),
      );
      continue;
    }
    if (
      doc.name !== row.name ||
      doc.version !== row.version ||
      !doc.dist?.integrity ||
      !doc.dist?.tarball
    )
      findings.push(
        finding(
          "registry",
          `${row.name}@${row.version}`,
          "the registry's document lacks the name, version or dist",
        ),
      );
    for (const field of CONSUMER_FIELDS) {
      for (const [dep, spec] of Object.entries(doc[field] ?? {})) {
        if (!names.has(dep)) continue;
        if (!EXACT_VERSION.test(spec)) {
          findings.push(
            finding(
              "registry",
              `${row.name}@${row.version}`,
              `${field}.${dep} is "${spec}", not exact`,
            ),
          );
          continue;
        }
        const pinned = await lookup(dep, spec);
        if (pinned.state !== "present")
          findings.push(
            finding(
              "registry",
              `${row.name}@${row.version}`,
              `${field}.${dep} pins ${dep}@${spec}, which ${pinned.state === "absent" ? "is not on the registry: an install fails" : `the registry did not answer (${pinned.detail})`}`,
            ),
          );
      }
    }
    if (distTag) {
      const tags = await distTags(registry, row.name, fetchImpl);
      if (tags === undefined)
        findings.push(
          finding(
            "registry",
            `${row.name}@${row.version}`,
            "the registry did not answer the dist-tags",
          ),
        );
      else if (tags[distTag] !== row.version)
        findings.push(
          finding(
            "registry",
            `${row.name}@${row.version}`,
            `dist-tag ${distTag} is ${tags[distTag] ?? "unset"}, not ${row.version}`,
          ),
        );
    }
  }
  if (missing.length > 0)
    console.log(
      `not on the registry (${missing.length} of ${releasing.length}): ${missing.join(" ")}`,
    );
  return findings;
}

// ---------------------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------------------

/** `--name value` options; a bare `--name` is `true`. */
export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith("--")) throw new Error(`unexpected argument ${arg}`);
    const key = arg.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) options[key] = true;
    else {
      options[key] = next;
      i += 1;
    }
  }
  return { command, options };
}

const USAGE = `usage: node tools/scripts/release-gate.mjs <command> [options]
  pack     --out <dir>                                   pack every public workspace package
  check    --packs <dir> [--registry <url>]              publint, arethetypeswrong, pins
  smoke    --packs <dir> [--work <dir>] [--targets node,vite,metro] [--registry <url>] [--store-dir <dir>]
  registry [--version <v>] [--dist-tag <tag>|--no-dist-tag] [--registry <url>]   after a publish (default: workspace versions)
  all      --out <dir> [smoke options]                   pack, check and smoke`;

/** A registry URL as the npm protocol wants it: https and a trailing slash. */
function registryUrl(value) {
  const url = typeof value === "string" ? value : DEFAULT_REGISTRY;
  if (!/^https?:\/\/.+\/$/.test(url))
    throw new Error(`--registry must be an http(s) URL ending in /, got ${url}`);
  return url;
}

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    return 2;
  }
  const { command, options } = parsed;
  const baseline = await readBaseline();
  const registry = registryUrl(options.registry);
  const targets =
    typeof options.targets === "string" ? options.targets.split(",") : ["node", "vite", "metro"];
  if (targets.some((target) => !(target in RUNNERS))) {
    console.error(`--targets takes node, vite and metro\n${USAGE}`);
    return 2;
  }
  const smokeWork = () =>
    typeof options.work === "string"
      ? resolve(options.work)
      : mkdtempSync(join(tmpdir(), "stackra-release-smoke-"));
  const storeDir = typeof options["store-dir"] === "string" ? options["store-dir"] : undefined;
  switch (command) {
    case "pack": {
      if (typeof options.out !== "string") break;
      const index = packAll({ out: resolve(options.out) });
      console.log(`packed ${index.packages.length} packages into ${options.out}`);
      return 0;
    }
    case "check": {
      if (typeof options.packs !== "string") break;
      const findings = await runCheck({
        packs: resolve(options.packs),
        registry: options.registry ? registry : undefined,
      });
      return report(applyBaseline(findings, baseline, ["publint", "attw", "pins"]), "check");
    }
    case "smoke": {
      if (typeof options.packs !== "string") break;
      const work = smokeWork();
      console.log(`smoke consumer: ${work}`);
      const findings = await runSmoke({
        packs: resolve(options.packs),
        work,
        registry,
        targets,
        storeDir,
      });
      return report(
        applyBaseline(
          findings,
          baseline,
          targets.map((target) => `smoke:${target}`),
        ),
        "smoke",
      );
    }
    case "all": {
      if (typeof options.out !== "string") break;
      const out = resolve(options.out);
      const index = packAll({ out });
      console.log(`packed ${index.packages.length} packages into ${out}`);
      const findings = await runCheck({
        packs: out,
        registry: options.registry ? registry : undefined,
      });
      const work = smokeWork();
      console.log(`smoke consumer: ${work}`);
      findings.push(...(await runSmoke({ packs: out, work, registry, targets, storeDir })));
      const checks = ["publint", "attw", "pins", ...targets.map((target) => `smoke:${target}`)];
      return report(applyBaseline(findings, baseline, checks), "release gate");
    }
    case "registry": {
      const workspace = listWorkspace();
      const version = typeof options.version === "string" ? options.version : undefined;
      const distTag = options["no-dist-tag"]
        ? ""
        : typeof options["dist-tag"] === "string"
          ? options["dist-tag"]
          : "latest";
      const findings = await registryFindings({ workspace, registry, version, distTag });
      return report(applyBaseline(findings, baseline, ["registry"]), "registry");
    }
    default: {
      break;
    }
  }
  console.error(USAGE);
  return 2;
}

/** A content hash of a folder's tarballs, printed so a run names what it checked. */
export function packsDigest(dir) {
  const hash = createHash("sha256");
  for (const file of readdirSync(dir)
    .filter((name) => name.endsWith(".tgz"))
    .toSorted())
    hash.update(file).update(readFileSync(join(dir, file)));
  return hash.digest("hex").slice(0, 16);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error?.stack ?? String(error));
      process.exit(1);
    },
  );
}
