#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: builds @stackra/starter (STA-2874): the stackra-template commit that package.json `stackra.template` pins,
 *          every tracked file of it, as `dist/template.tgz` (a gzipped tar whose entries sit under `package/`, the shape
 *          the CLI's `readTarball` reads). The archive is nested inside the npm tarball because `pnpm pack` would drop
 *          the template's `.npmrc` and drop or apply its `.gitignore` files; nested, every byte reaches `stackra create`.
 *          `--bump [--commit <sha>]` moves the pin to the template's `main` (or the commit given) and builds nothing.
 * Boundary: reads the pinned commit with git only (`git fetch --depth 1` of that one commit into a temporary bare
 *           repository, removed afterwards; the fetched id must equal the pin). Writes only `dist/template.tgz`, or,
 *           with `--bump`, package.json's `stackra.template.commit`. Refuses a symlink, a submodule, a commit without
 *           `stackra.starter.yaml`, and an archive that lacks a tracked file (an `export-ignore` attribute). The same
 *           commit packs to the same bytes: git archive stamps the commit time, and gzip adds no time of its own.
 * Runtime: node (built-ins only; `git` on PATH)
 * Governing contract: ADR 0515 (decision 3: the starter `stackra create` fetches at the CLI's version); ADR 0177
 *                     (PK5: the fixed @stackra/* version group); ADR 0453 (the registry); STA-2874.
 *
 * Usage: `node scripts/build-starter.mjs` (the package's `build`), `node scripts/build-starter.mjs --bump [--commit <sha>]`.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

/** Where the archive sits inside the package, and so inside the published tarball. */
const ARCHIVE = "dist/template.tgz";

/** The file every starter holds at its root: `stackra create` refuses a starter without it. */
const STARTER_MANIFEST = "stackra.starter.yaml";

/** A full commit id: a branch or tag name would let the starter's content change under one version. */
const COMMIT = /^[0-9a-f]{40}$/;

/** The package root (this file is `scripts/build-starter.mjs`). */
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Runs git and returns its standard output.
 * @param {readonly string[]} args - git's arguments.
 * @returns {Buffer} the output.
 */
const git = (args) =>
  execFileSync("git", args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 512 * 1024 * 1024 });

/**
 * The template pin of a package manifest, checked.
 * @param {unknown} manifest - the parsed package.json.
 * @returns {{ repository: string, commit: string }} the pin.
 * @throws {TypeError} when the repository is not an https:// or file:// git URL, or the commit is not a full id.
 * @example
 * readPin({ stackra: { template: { repository: "https://github.com/o/t.git", commit: "0".repeat(40) } } });
 */
function readPin(manifest) {
  const pin = manifest?.stackra?.template;
  if (typeof pin?.repository !== "string" || !/^(?:https|file):\/\/\S+$/.test(pin.repository))
    throw new TypeError("package.json stackra.template.repository must be an https:// git URL");
  if (typeof pin.commit !== "string" || !COMMIT.test(pin.commit))
    throw new TypeError(
      "package.json stackra.template.commit must be a full 40-character commit id, never a branch or tag",
    );
  return { repository: pin.repository, commit: pin.commit };
}

/**
 * Fetches one commit of `repository` into a new bare repository at `dir`, and checks that it is the commit asked for.
 * @param {string} repository - the git URL.
 * @param {string} commit - the full commit id.
 * @param {string} dir - an empty folder.
 * @throws {Error} when the fetch fails or answers another commit.
 */
function fetchCommit(repository, commit, dir) {
  git(["init", "-q", "--bare", dir]);
  try {
    git(["-C", dir, "fetch", "-q", "--depth", "1", "--no-tags", repository, commit]);
  } catch (error) {
    const detail = error instanceof Error && "stderr" in error ? String(error.stderr).trim() : "";
    throw new Error(`cannot fetch ${commit} from ${repository}${detail ? `: ${detail}` : ""}`, {
      cause: error,
    });
  }
  const fetched = git(["-C", dir, "rev-parse", "--verify", "FETCH_HEAD^{commit}"])
    .toString()
    .trim();
  if (fetched !== commit) throw new Error(`${repository} answered ${fetched} for ${commit}`);
}

/**
 * The regular files a tar holds, by path without its first segment (`package/`), from ustar and pax headers.
 * @param {Uint8Array} tar - the uncompressed tar.
 * @returns {string[]} the paths, in archive order.
 */
function tarFiles(tar) {
  const decoder = new TextDecoder();
  const files = [];
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
    if (type === "0") files.push(name.split("/").slice(1).join("/"));
  }
  return files;
}

/**
 * Every tracked file of `commit` as a gzipped tar under `package/`, checked against the commit's tree.
 * @param {string} dir - a repository that holds the commit.
 * @param {string} commit - the full commit id.
 * @returns {{ tgz: Buffer, files: number }} the archive and how many files it holds.
 * @throws {Error} on a symlink or submodule, a missing starter manifest, or a file the archive left out.
 */
function templateArchive(dir, commit) {
  const tracked = [];
  for (const line of git(["-C", dir, "ls-tree", "-r", "-z", "--full-tree", commit])
    .toString()
    .split("\0")) {
    if (line === "") continue;
    const tab = line.indexOf("\t");
    const [mode, type] = line.slice(0, tab).split(" ");
    const path = line.slice(tab + 1);
    if (type !== "blob" || (mode !== "100644" && mode !== "100755"))
      throw new Error(
        `${path} is a ${mode === "120000" ? "symlink" : type === "commit" ? "submodule" : `${type} ${mode}`}; stackra create writes regular files only`,
      );
    tracked.push(path);
  }
  if (!tracked.includes(STARTER_MANIFEST))
    throw new Error(`${commit} has no ${STARTER_MANIFEST}; it is not a starter`);
  const tar = git(["-C", dir, "archive", "--format=tar", "--prefix=package/", commit]);
  const archived = new Set(tarFiles(tar));
  const missing = tracked.filter((path) => !archived.has(path));
  if (missing.length > 0)
    throw new Error(
      `git archive left out ${missing.length} tracked files (an export-ignore attribute?): ${missing.slice(0, 5).join(", ")}`,
    );
  return { tgz: gzipSync(tar, { level: 9 }), files: tracked.length };
}

/**
 * The commit a repository's `main` points at.
 * @param {string} repository - the git URL.
 * @returns {string} the commit id.
 */
function mainCommit(repository) {
  const line = git(["ls-remote", repository, "refs/heads/main"]).toString().trim();
  const commit = line.split("\t")[0] ?? "";
  if (!COMMIT.test(commit)) throw new Error(`${repository} has no main branch`);
  return commit;
}

/**
 * Builds the starter, or with `--bump` moves its pin.
 * @param {readonly string[]} argv - the arguments after the script.
 * @param {{ root?: string, log?: (line: string) => void }} [options] - the package root and the output line writer.
 * @returns {number} the exit status.
 */
export function main(argv, { root = PACKAGE_ROOT, log = (line) => console.log(line) } = {}) {
  const manifestPath = join(root, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const pin = readPin(manifest);
  if (argv.includes("--bump")) {
    const at = argv.indexOf("--commit");
    const commit = at === -1 ? mainCommit(pin.repository) : (argv[at + 1] ?? "");
    if (!COMMIT.test(commit))
      throw new TypeError(`--commit needs a full commit id, not "${commit}"`);
    manifest.stackra.template.commit = commit;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    log(`stackra.template.commit: ${pin.commit} -> ${commit}`);
    return 0;
  }
  const work = mkdtempSync(join(tmpdir(), "stackra-starter-"));
  try {
    fetchCommit(pin.repository, pin.commit, work);
    const { tgz, files } = templateArchive(work, pin.commit);
    mkdirSync(dirname(join(root, ARCHIVE)), { recursive: true });
    writeFileSync(join(root, ARCHIVE), tgz);
    log(`wrote ${ARCHIVE}: ${files} files of ${pin.repository} at ${pin.commit}`);
    return 0;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/**
 * The files of a built archive, for a quick look: `node scripts/build-starter.mjs --list`.
 * @param {string} root - the package root.
 * @returns {string[]} the paths.
 */
function listArchive(root = PACKAGE_ROOT) {
  return tarFiles(gunzipSync(readFileSync(join(root, ARCHIVE))));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.includes("--list")) for (const path of listArchive()) console.log(path);
    else process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`@stackra/starter: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
