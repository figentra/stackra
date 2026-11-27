#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: keep internal content out of the public repository and its published tarballs (STA-2876). It reads every
 *          tracked file's path and text (or, with `--pack`, every file inside the given `.tgz` tarballs) and refuses
 *          two kinds of line: a denied term (an internal product, person, host or cloud account id) and a home folder
 *          with a real user name (`/Users/<name>/`, `/home/<name>/`). Secret-shaped strings are gitleaks' job
 *          (`.gitleaks.toml`: lefthook pre-commit and the Quality Gate's `pnpm secrets:scan`).
 * Boundary: read-only. The denied terms are stored only as SHA-256 hashes of their lower-case spelling (with their
 *           length, to skip most words unhashed), so this file does not publish what it forbids; `--hash <term>`
 *           prints the entry to add one. A word is checked whole (letters and digits), and a dotted host by each of
 *           its suffixes of two labels or more. One exemption, visible and tracked: the entries of
 *           `public-content.allow.yaml` (a repository `path`, one line of a file by its `lineSha256`, or a tarball's
 *           `package` name), each with its reason and the issue that removes it. No line is exempt by its wording: a
 *           spec approval line that names a person is a finding like any other (role-only approvals, STA-2905), and
 *           a line entry whose line is gone is reported, so the list only shrinks. `--hash-line <path>:<n>` prints
 *           the entry for one line.
 * Runtime: node
 * Governing contract: ADR 0291 (porting provenance: a port keeps its reference, not its source's private paths);
 *                     ADR 0453 (the registry ships what the tarball holds); STA-2876.
 * Usage: `guard-public-content.mjs` (tracked files), `--pack <file.tgz>…` (tarballs), `--hash <term>`,
 *        `--hash-line <path>:<n>`.
 * Exit: 0 clean, 1 findings (each printed as `path:line: reason`; line 0 is the path itself), 2 usage.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { parse as parseYaml } from "yaml";

/** SHA-256 of each denied term, lower case, with its length and what it is; never the term itself. */
export const DENIED = new Map([
  [
    "4fa92007b9d74eae84d5b60fc79abf801c2a202c3dcacd80bb76caa9caf32ae9",
    { length: 10, reason: "an internal product name" },
  ],
  [
    "82bfd5d79c5d89a7ba1b08f74d810136995bf1df127bb4628a52c4627abd8ca6",
    { length: 7, reason: "an internal product name" },
  ],
  [
    "b4fddab806d4f2543f1ba4326f3c1ea9bf4684d17f003ee1897a23ae840631a2",
    { length: 6, reason: "a team member's name or user name" },
  ],
  [
    "d908b42ccb44fe9f8c64ee851fa1d8872cdbeeef74d3e1141e3072c4ce25683b",
    { length: 6, reason: "a team member's name" },
  ],
  [
    "0a6e6d95821a32c68c98c65e8970fd18d7d91612ac53a02b82562baba54da825",
    { length: 5, reason: "a team member's name" },
  ],
  [
    "1842d7a9c4a12ab70ab90d8efdd090fb3d0ff5d2306d2ec55e1c4173a481b14d",
    { length: 14, reason: "an internal host or zone" },
  ],
  [
    "043e85b2d89404f78551a52f8f9ba8e0c5041fa262ec7b800b143b588bf697ac",
    { length: 12, reason: "an internal cloud account id" },
  ],
]);

/** The lengths of the denied terms (a word of another length is never hashed), recomputed when DENIED changes. */
let lengths = { size: -1, set: new Set() };
function deniedLengths() {
  if (lengths.size !== DENIED.size)
    lengths = {
      size: DENIED.size,
      set: new Set([...DENIED.values()].map((entry) => entry.length)),
    };
  return lengths.set;
}

/** User names that are not a person: placeholders in examples, CI runners and container service accounts. */
export const PLACEHOLDER_USERS = new Set([
  "a",
  "b",
  "dev",
  "libretranslate",
  "linuxbrew",
  "me",
  "name",
  "node",
  "runner",
  "someone",
  "ubuntu",
  "user",
  "username",
  "x",
  "you",
]);

/** A home folder with its user name: macOS `/Users/<name>/`, Linux `/home/<name>/`. */
const HOME_PATH = /(?:^|[^\w.-])\/(?:Users|home)\/([A-Za-z0-9._-]+)\//g;
/** A word: letters and digits. */
const WORD = /[a-z0-9]+/g;
/** A dotted host name, checked by each suffix of two labels or more. */
const HOST = /[a-z0-9-]+(?:\.[a-z0-9-]+)+/g;

const hashes = new Map();
/** The SHA-256 of `term`, lower case, as hex. */
export function hashTerm(term) {
  const key = term.toLowerCase();
  let hash = hashes.get(key);
  if (hash === undefined) {
    hash = createHash("sha256").update(key).digest("hex");
    hashes.set(key, hash);
  }
  return hash;
}

/** The SHA-256 of one line's exact text, as hex: what a line entry of the allow list (`lineSha256`) names. */
export function hashLine(line) {
  return createHash("sha256").update(line).digest("hex");
}

/** Why `candidate` (lower case) is denied, or undefined. */
function denied(candidate) {
  if (!deniedLengths().has(candidate.length)) return undefined;
  return DENIED.get(hashTerm(candidate))?.reason;
}

/**
 * The findings of one line: each denied word or host, and each home folder with a real user name.
 *
 * @example
 * lineFindings("see /Users/me/x"); // []
 */
export function lineFindings(line) {
  const found = [];
  const lower = line.toLowerCase();
  for (const [word] of lower.matchAll(WORD)) {
    const why = denied(word);
    if (why !== undefined) found.push(why);
  }
  for (const [host] of lower.matchAll(HOST)) {
    const labels = host.split(".");
    for (let i = 0; i < labels.length - 1; i += 1) {
      const why = denied(labels.slice(i).join("."));
      if (why !== undefined) found.push(why);
    }
  }
  for (const match of line.matchAll(HOME_PATH)) {
    const user = match[1] ?? "";
    if (!PLACEHOLDER_USERS.has(user.toLowerCase()) && !user.startsWith("<"))
      found.push("a personal home folder (/Users/<name>/ or /home/<name>/)");
  }
  return [...new Set(found)];
}

/** True when `path` matches the allow pattern `pattern` (`dir/**` or an exact path). */
export function allowedBy(path, pattern) {
  return pattern.endsWith("/**") ? path.startsWith(pattern.slice(0, -2)) : path === pattern;
}

/**
 * Every finding of one file, as `{ path, line, reason }`: its path (line 0), then each line of its text.
 *
 * @param allow - the allow list's entries: `{ path }` (`dir/**` or exact) exempts the whole file, unread;
 *                `{ path, lineSha256 }` (an exact path) exempts only the line of that file with that exact text.
 */
export function scanText(path, text, allow = []) {
  if (
    allow.some(
      (entry) =>
        entry.path !== undefined && entry.lineSha256 === undefined && allowedBy(path, entry.path),
    )
  )
    return [];
  const lines = new Set(
    allow
      .filter((entry) => entry.lineSha256 !== undefined && entry.path === path)
      .map((entry) => entry.lineSha256),
  );
  const findings = lineFindings(path).map((reason) => ({ path, line: 0, reason }));
  if (text.includes("\u0000")) return findings; // binary: its name only
  text.split("\n").forEach((line, index) => {
    const found = lineFindings(line);
    if (found.length === 0 || lines.has(hashLine(line))) return;
    for (const reason of found) findings.push({ path, line: index + 1, reason });
  });
  return findings;
}

/**
 * The line entries of the allow list whose line is no longer in their file, as findings (line 0): a rewritten or
 * removed line takes its entry with it, so the list only shrinks.
 *
 * @param read - the text of a repository path, or undefined when it is gone.
 */
export function staleLineEntries(allow, read) {
  return allow
    .filter((entry) => entry.lineSha256 !== undefined)
    .filter((entry) => {
      const text = entry.path === undefined ? undefined : read(entry.path);
      return (
        text === undefined || !text.split("\n").some((line) => hashLine(line) === entry.lineSha256)
      );
    })
    .map((entry) => ({
      path: entry.path ?? "(no path)",
      line: 0,
      reason: `an allow entry (${entry.issue}) for a line that is no longer there: remove it`,
    }));
}

/** The files inside a `.tgz` tarball, as `[path, text]` (ustar, as `npm pack` and `pnpm pack` write it). */
export function tarballFiles(bytes) {
  const tar = gunzipSync(bytes);
  const files = [];
  let offset = 0;
  let longName;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const field = (start, length) =>
      header
        .subarray(start, start + length)
        .toString("utf8")
        .replace(/\0.*$/s, "");
    const prefix = field(345, 155);
    const name = longName ?? (prefix === "" ? field(0, 100) : `${prefix}/${field(0, 100)}`);
    const size = Number.parseInt(field(124, 12).trim() || "0", 8);
    const type = field(156, 1);
    const body = tar.subarray(offset + 512, offset + 512 + size);
    longName = undefined;
    // GNU long name: the next entry's path is this entry's body.
    if (type === "L") longName = body.toString("utf8").replace(/\0.*$/s, "");
    else if (type === "0" || type === "") files.push([name, body.toString("utf8")]);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

/**
 * Every finding of one tarball's files, each path `<tarball>!<path inside>`. A tarball whose `package/package.json`
 * names a package the allow list exempts (`{ package, reason, issue }`) is not read.
 */
export function scanTarball(label, bytes, allow = []) {
  const files = tarballFiles(bytes);
  const manifest = files.find(([name]) => name === "package/package.json");
  let name;
  try {
    name = manifest === undefined ? undefined : JSON.parse(manifest[1]).name;
  } catch {
    name = undefined;
  }
  if (name !== undefined && allow.some((entry) => entry.package === name)) return [];
  return files.flatMap(([path, text]) => scanText(`${label}!${path}`, text));
}

/** The repository's tracked files, relative to `root`. */
function trackedFiles(root) {
  const out = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (out.status !== 0) throw new Error(`git ls-files failed: ${out.error ?? out.stderr}`);
  return out.stdout.split("\0").filter((file) => file !== "");
}

/** The allow list beside this script. */
export function readAllow() {
  const file = fileURLToPath(new URL("public-content.allow.yaml", import.meta.url));
  return parseYaml(readFileSync(file, "utf8")).allow;
}

const USAGE =
  "usage: guard-public-content.mjs [--pack <file.tgz>…] [--hash <term>] [--hash-line <path>:<n>]";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === "--hash") {
    if (args.length !== 2) {
      console.error(USAGE);
      process.exit(2);
    }
    console.log(JSON.stringify([hashTerm(args[1]), { length: args[1].length, reason: "…" }]));
    process.exit(0);
  }
  if (args[0] === "--hash-line") {
    const at = /^(.+):(\d+)$/.exec(args[1] ?? "");
    if (args.length !== 2 || at === null) {
      console.error(USAGE);
      process.exit(2);
    }
    const [, path, n] = at;
    const line = readFileSync(path, "utf8").split("\n")[Number(n) - 1];
    if (line === undefined) {
      console.error(`guard-public-content: ${path} has no line ${n}`);
      process.exit(2);
    }
    console.log(JSON.stringify({ path, lineSha256: hashLine(line), reason: "…", issue: "STA-…" }));
    process.exit(0);
  }
  const allow = readAllow();
  const findings = [];
  if (args[0] === "--pack") {
    if (args.length < 2) {
      console.error(USAGE);
      process.exit(2);
    }
    for (const tarball of args.slice(1))
      findings.push(...scanTarball(tarball, readFileSync(tarball), allow));
  } else if (args.length === 0) {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const read = (file) => {
      try {
        return readFileSync(join(root, file), "utf8");
      } catch {
        return undefined; // deleted in the working tree, or not a file: its path is still read
      }
    };
    for (const file of trackedFiles(root))
      findings.push(...scanText(file, read(file) ?? "", allow));
    findings.push(...staleLineEntries(allow, read));
  } else {
    console.error(USAGE);
    process.exit(2);
  }
  for (const { path, line, reason } of findings) console.error(`${path}:${line}: ${reason}`);
  if (findings.length > 0) {
    console.error(
      `guard-public-content: ${findings.length} line(s) carry internal content. Use a neutral example (acme, ` +
        "example.com, /Users/me) instead; an exemption goes in tools/scripts/public-content.allow.yaml with its issue.",
    );
    process.exit(1);
  }
  console.log("guard-public-content: no internal names, hosts or home folders");
}
