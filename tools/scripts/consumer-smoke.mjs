#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/consumer-smoke.mjs` (STA-2874), core's clean-consumer smoke: the command release.yml
 *          hands runway-npm.yml as `consumer-smoke`, run after a release is on the registry and before `latest` moves.
 *          It does what a new user does on a clean machine, from the registry alone, at the release's own version:
 *          the documented `npx -y --@stackra:registry=<registry> @stackra/cli@<version> create demo --yes` (fetch the
 *          starter, write, install, gen, type-check, test, first commit). Before that it checks that the registry
 *          serves `@stackra/cli` and `@stackra/starter` at that version (create would otherwise fall back to
 *          `latest`'s starter and prove nothing), and that the machine has what the customer guide lists: Node, pnpm,
 *          git, a running Docker and Encore (from PATH, or installed with mise at the version the starter's own
 *          mise.toml pins). After it, the app must be pinned to the release, installed and committed.
 * Boundary: reads RUNWAY_REGISTRY (the registry URL, ending in /), RUNWAY_RELEASE (a file of `<name> TAB <version>`
 *           lines) and HOME, which runway-npm.yml makes new and empty; works only under `$HOME/consumer`. Runs `create`
 *           with a PATH of the tool folders alone, HOME, LANG and a git identity: no npm or pnpm setting, token, CI
 *           variable or core checkout reaches it. Reads no secret. Exit 0 the app was made; 1 a check or a step
 *           failed (named); 2 a usage error.
 * Runtime: node (built-ins only)
 * Governing contract: ADR 0515 (decisions 3, 4 and 8: the starter, the pin, the steps); ADR 0453 (the registry);
 *                     STA-2874; the customer guide /customers/create ("What your machine needs").
 */
import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, mkdirSync, readFileSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

/** The packages a new user's first command reaches by name. */
export const CLI = "@stackra/cli";
export const STARTER = "@stackra/starter";

/** Where the published starter keeps the template (packages/developer/starter `ARCHIVE`). */
const NESTED = "dist/template.tgz";

/** The mise tool the starter pins Encore with. */
const ENCORE_TOOL = "aqua:encoredev/encore";

/** The app's folder name under `$HOME/consumer`. */
export const APP = "demo";

/**
 * The release's version of `@stackra/cli` and `@stackra/starter`, which the fixed group keeps equal.
 * @param {string} text - the RUNWAY_RELEASE file: `<name> TAB <version>` lines.
 * @returns {string} the version.
 * @throws {Error} when either package is missing or their versions differ.
 */
export function releaseVersion(text) {
  const versions = new Map(
    text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t")),
  );
  for (const name of [CLI, STARTER])
    if (!versions.get(name))
      throw new Error(
        `the release has no ${name}; stackra create needs the CLI and the starter of one version`,
      );
  if (versions.get(CLI) !== versions.get(STARTER))
    throw new Error(
      `the release has ${CLI}@${versions.get(CLI)} and ${STARTER}@${versions.get(STARTER)}; the fixed group keeps them equal`,
    );
  return String(versions.get(CLI));
}

/**
 * The Encore version a starter's mise.toml pins, or undefined.
 * @param {string} miseToml - the text of the starter's mise.toml.
 * @returns {string | undefined} the version.
 */
export function encorePin(miseToml) {
  return /^\s*"aqua:encoredev\/encore"\s*=\s*"([^"]+)"/m.exec(miseToml)?.[1];
}

/**
 * The versions the `stackra` catalog of a pnpm-workspace.yaml pins, one per entry (`catalogs.stackra` only).
 * @param {string} yaml - the text of the app's pnpm-workspace.yaml.
 * @returns {string[]} the pinned versions, in file order.
 */
export function catalogPins(yaml) {
  const pins = [];
  let inCatalogs = false;
  let inStackra = false;
  for (const line of yaml.split("\n")) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      inCatalogs = /^catalogs:\s*$/.test(line);
      inStackra = false;
    } else if (inCatalogs && indent === 2) inStackra = /^ {2}stackra:\s*$/.test(line);
    else if (inStackra) {
      const match = /^\s+["']?@stackra\/[^:"']+["']?:\s*["']?([^"'\s#]+)/.exec(line);
      if (match) pins.push(match[1]);
    }
  }
  return pins;
}

/**
 * The first executable called `name` on `path`, or undefined.
 * @param {string} name - the command.
 * @param {string} path - a PATH value.
 * @returns {string | undefined} its absolute path.
 */
export function which(name, path) {
  for (const dir of path.split(delimiter)) {
    if (dir === "") continue;
    const candidate = join(dir, name);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // not here
    }
  }
  return undefined;
}

/**
 * The files of a gzipped tar, by path without its first segment (npm's `package/`); regular files only.
 * @param {Uint8Array} tgz - the archive.
 * @returns {Map<string, Buffer>} the files.
 */
export function untar(tgz) {
  const tar = gunzipSync(tgz);
  const decoder = new TextDecoder();
  const files = new Map();
  let paxPath;
  for (let at = 0; at + 512 <= tar.length;) {
    const header = tar.subarray(at, at + 512);
    if (header.every((byte) => byte === 0)) break;
    const field = (offset, length) =>
      decoder.decode(header.subarray(offset, offset + length)).replace(/\0[\s\S]*$/, "");
    const size = Number.parseInt(field(124, 12).trim() || "0", 8);
    const type = field(156, 1) || "0";
    const prefix = field(345, 155);
    const body = tar.subarray(at + 512, at + 512 + size);
    at += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      paxPath = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(decoder.decode(body))?.[1];
      continue;
    }
    const name = paxPath ?? (prefix === "" ? field(0, 100) : `${prefix}/${field(0, 100)}`);
    paxPath = undefined;
    if (type === "0") files.set(name.split("/").slice(1).join("/"), Buffer.from(body));
  }
  return files;
}

/**
 * The registry's version document of name@version, or a named failure.
 * @param {string} registry - the registry URL, ending in /.
 * @param {string} name - the package.
 * @param {string} version - the version.
 * @returns {Promise<Record<string, unknown>>} the document.
 */
async function versionDocument(registry, name, version) {
  let response;
  try {
    response = await fetch(`${registry}${name.replace("/", "%2f")}/${version}`);
  } catch (error) {
    throw new Error(`the registry did not answer for ${name}@${version}: ${String(error)}`, {
      cause: error,
    });
  }
  if (response.status === 404)
    throw new Error(
      `the registry does not serve ${name}@${version}${name === STARTER ? "; stackra create would fall back to latest's starter and prove nothing" : ""}`,
    );
  if (!response.ok)
    throw new Error(`the registry answered HTTP ${response.status} for ${name}@${version}`);
  return await response.json();
}

/**
 * Runs a command with output streamed to ours; resolves with its exit status.
 * @param {string} command - the executable.
 * @param {readonly string[]} args - its arguments.
 * @param {{ cwd: string, env: Record<string, string> }} options - where and with what.
 * @returns {Promise<number>} the status (1 when it could not start or was killed).
 */
function run(command, args, options) {
  return new Promise((done) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", () => done(1));
    child.on("close", (status) => done(status ?? 1));
  });
}

/**
 * Encore's folder for the clean PATH: from PATH, or installed with mise at the starter's pin.
 * @param {{ path: string, registry: string, starter: Record<string, unknown>, env: Record<string, string> }} input
 * @returns {Promise<string>} the folder holding `encore`.
 */
async function encoreFolder({ path, starter, env }) {
  const onPath = which("encore", path);
  if (onPath) return dirname(onPath);
  const dist = starter["dist"] ?? {};
  if (typeof dist.tarball !== "string") throw new Error(`${STARTER} has no dist.tarball`);
  const response = await fetch(dist.tarball);
  if (!response.ok)
    throw new Error(`the registry answered HTTP ${response.status} for the starter's tarball`);
  const nested = untar(new Uint8Array(await response.arrayBuffer())).get(NESTED);
  const miseToml = nested ? untar(nested).get("mise.toml")?.toString("utf8") : undefined;
  const version = miseToml ? encorePin(miseToml) : undefined;
  if (!version)
    throw new Error(
      "Encore is not on PATH and the starter's mise.toml pins no Encore version to install",
    );
  const mise = which("mise", path);
  if (!mise)
    throw new Error(
      `Encore is not on PATH and mise is not there to install the starter's ${ENCORE_TOOL}@${version}`,
    );
  const spec = `${ENCORE_TOOL}@${version}`;
  const install = spawnSync(mise, ["install", spec], {
    env,
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (install.status !== 0) throw new Error(`mise install ${spec} failed`);
  const where = spawnSync(mise, ["where", spec], { env, encoding: "utf8" });
  const folder = where.status === 0 ? where.stdout.trim() : "";
  const binary = [join(folder, "encore"), join(folder, "bin", "encore")].find((file) =>
    existsSync(file),
  );
  if (!binary) throw new Error(`mise installed ${spec} but no encore binary is under ${folder}`);
  return dirname(binary);
}

/**
 * The smoke.
 * @param {Record<string, string | undefined>} env - the environment (process.env).
 * @param {(line: string) => void} log - writes one line.
 * @returns {Promise<number>} the exit status.
 */
export async function main(env, log) {
  const registry = env["RUNWAY_REGISTRY"] ?? "";
  const releaseFile = env["RUNWAY_RELEASE"] ?? "";
  const home = env["HOME"] ?? "";
  const path = env["PATH"] ?? "";
  if (!/^https?:\/\/\S+\/$/.test(registry) || releaseFile === "" || home === "") {
    log(
      "consumer-smoke: set RUNWAY_REGISTRY (a URL ending in /), RUNWAY_RELEASE (a release file) and HOME",
    );
    return 2;
  }
  const fail = (message) => {
    log(`consumer-smoke: ${message}`);
    return 1;
  };
  try {
    const version = releaseVersion(readFileSync(releaseFile, "utf8"));
    await versionDocument(registry, CLI, version);
    const starter = await versionDocument(registry, STARTER, version);
    log(`consumer-smoke: ${CLI}@${version} and ${STARTER}@${version} are on ${registry}`);
    if (existsSync(join(home, ".npmrc")))
      return fail(`${home}/.npmrc exists; a clean consumer has no npm settings`);

    const tools = {};
    for (const name of ["node", "npx", "pnpm", "git", "docker"]) {
      const found = which(name, path);
      if (!found)
        return fail(`${name} is not on PATH; a new user's machine needs it (customer guide)`);
      tools[name] = found;
    }
    const docker = spawnSync(tools.docker, ["info"], {
      stdio: "ignore",
      env: { PATH: path, HOME: home },
    });
    if (docker.status !== 0)
      return fail("Docker is not running; Encore runs the app's Postgres in it");
    const encore = await encoreFolder({ path, registry, starter, env: { PATH: path, HOME: home } });

    const cleanPath = [
      ...new Set([
        ...Object.values(tools).map((file) => dirname(file)),
        encore,
        "/usr/bin",
        "/bin",
      ]),
    ].join(delimiter);
    const work = join(home, "consumer");
    mkdirSync(work, { recursive: true });
    const args = [
      "-y",
      `--@stackra:registry=${registry}`,
      `${CLI}@${version}`,
      "create",
      APP,
      "--yes",
    ];
    log(`consumer-smoke: npx ${args.join(" ")}  (in ${work})`);
    const status = await run(tools.npx, args, {
      cwd: work,
      env: {
        PATH: cleanPath,
        HOME: home,
        LANG: "C.UTF-8",
        GIT_AUTHOR_NAME: "consumer-smoke",
        GIT_AUTHOR_EMAIL: "consumer-smoke@example.invalid",
        GIT_COMMITTER_NAME: "consumer-smoke",
        GIT_COMMITTER_EMAIL: "consumer-smoke@example.invalid",
      },
    });
    if (status !== 0)
      return fail(`stackra create exited ${status} (the step above names what failed)`);

    const app = join(work, APP);
    const workspace = existsSync(join(app, "pnpm-workspace.yaml"))
      ? readFileSync(join(app, "pnpm-workspace.yaml"), "utf8")
      : "";
    const pins = catalogPins(workspace);
    if (pins.length === 0 || pins.some((pin) => pin !== version))
      return fail(
        `the app's catalog pins @stackra to ${[...new Set(pins)].join(", ") || "nothing"}, not ${version}`,
      );
    const installed = join(app, "node_modules", "@stackra", "cli", "package.json");
    const installedVersion = existsSync(installed)
      ? JSON.parse(readFileSync(installed, "utf8")).version
      : undefined;
    if (installedVersion !== version)
      return fail(`the app installed ${CLI}@${installedVersion ?? "nothing"}, not ${version}`);
    const head = spawnSync(tools.git, ["-C", app, "rev-parse", "--verify", "HEAD"], {
      stdio: "ignore",
    });
    if (head.status !== 0) return fail("the app has no first commit");
    log(
      `consumer-smoke: passed; ${app} is pinned to ${version}, installed, generated, checked and committed`,
    );
    return 0;
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  process.exitCode = await main(process.env, (line) => console.log(line));
