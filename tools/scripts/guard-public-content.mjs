#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: keep internal content out of the public repository and its published tarballs (STA-2876, STA-2911). It reads
 *          every tracked file's path and text (with `--files`, only the files given, as the pre-commit hook does; with
 *          `--pack`, every file inside the given `.tgz` tarballs) and refuses two kinds of line: a denied term (an
 *          internal product, person, host or cloud account id) and a home folder with a real user name
 *          (`/Users/<name>/`, `/home/<name>/`). Secret-shaped strings are gitleaks' job (`.gitleaks.toml`: lefthook
 *          pre-commit and the Quality Gate's `pnpm secrets:scan`).
 * Boundary: read-only. What is denied and what is exempt comes from one policy file, `public-content.policy.yaml`
 *           beside this script (`--policy <file>` names another): the recommended deny list below is the default, and
 *           the policy `deny`s more terms, `waive`s a recommended one (with its reason and the issue that decided it),
 *           and `allow`s a repository `path`, one line of a file by its `lineSha256`, or a tarball's `package` (each
 *           with its reason and the issue that removes it). An invalid policy stops every scan (exit 2), so a typo
 *           never turns the guard off. Denied terms are stored only as SHA-256 hashes of their lower-case spelling
 *           (with their length, to skip most words unhashed), so neither this file nor a policy publishes what it
 *           forbids; `--hash <term>` prints the `deny` entry to add one, `--recommended` the default list. A word is
 *           checked whole (letters and digits), and a dotted host by each of its suffixes of two labels or more. No
 *           line is exempt by its wording: a spec approval line passes because its format names a role and a date,
 *           never a person ("Approved by CTO <date>", STA-2905); one that names a person is a finding like any other.
 *           A line entry whose line is gone is reported, so the allow list only shrinks. `--hash-line <path>:<n>`
 *           prints the entry for one line.
 * Runtime: node
 * Governing contract: ADR 0291 (porting provenance: a port keeps its reference, not its source's private paths);
 *                     ADR 0453 (the registry ships what the tarball holds); STA-2876; STA-2911 (the policy file).
 * Usage: `guard-public-content.mjs [--policy <file>]` (tracked files), `… --files <path>…` (those files),
 *        `… --pack <file.tgz>…` (tarballs), `--hash <term>`, `--hash-line <path>:<n>`, `--recommended`.
 * Exit: 0 clean, 1 findings (each printed as `path:line: reason`; line 0 is the path itself), 2 usage or an invalid
 *       policy (each problem printed as `<policy>: <problem>`).
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { parse as parseYaml } from "yaml";

/**
 * The recommended deny list, every repository's default: the SHA-256 of each denied term, lower case, with its length
 * and what it is; never the term itself. A repository adds terms with the policy's `deny` and drops one with `waive`.
 */
export const RECOMMENDED_DENY = new Map([
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

/** The policy file beside this script. */
export const POLICY_FILE = fileURLToPath(new URL("public-content.policy.yaml", import.meta.url));

/** The policy with nothing added, waived or allowed: the recommended deny list alone. */
export const DEFAULT_POLICY = Object.freeze({ deny: RECOMMENDED_DENY, allow: Object.freeze([]) });

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
/** A SHA-256 as lower-case hex. */
const SHA256 = /^[0-9a-f]{64}$/;
/** An issue key (`STA-123`). */
const ISSUE = /^[A-Z][A-Z0-9]*-\d+$/;

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

/** The lengths of a deny list's terms (a word of another length is never hashed), once per list. */
const lengthsOf = new WeakMap();
function deniedLengths(deny) {
  let lengths = lengthsOf.get(deny);
  if (lengths === undefined || lengths.size !== deny.size) {
    lengths = { size: deny.size, set: new Set([...deny.values()].map((entry) => entry.length)) };
    lengthsOf.set(deny, lengths);
  }
  return lengths.set;
}

/** Why `candidate` (lower case) is denied by `deny`, or undefined. */
function denied(candidate, deny) {
  if (!deniedLengths(deny).has(candidate.length)) return undefined;
  return deny.get(hashTerm(candidate))?.reason;
}

/** True for a non-empty string. */
function filled(value) {
  return typeof value === "string" && value.trim() !== "";
}

/** The problems of one entry's keys: each key not in `known` is one. */
function unknownKeys(entry, known, where) {
  return Object.keys(entry)
    .filter((key) => !known.includes(key))
    .map((key) => `${where}: unknown key "${key}" (one of ${known.join(", ")})`);
}

/**
 * The policy a parsed `public-content.policy.yaml` document describes, and every problem with it. The effective deny
 * list is the recommended one, less its `waive` entries, plus its `deny` entries.
 *
 * - `deny`: `{ sha256, length, reason }`, a term the recommended list does not already deny (`--hash <term>`).
 * - `waive`: `{ sha256, reason, issue }`, an entry of the recommended list this repository does not deny.
 * - `allow`: `{ path | package, reason, issue }`, or `{ path, lineSha256, reason, issue }` for one line of one file.
 *
 * @example
 * parsePolicy({ deny: [{ sha256: hashTerm("acme"), length: 4, reason: "a client name" }] }).errors; // []
 */
export function parsePolicy(document) {
  const errors = [];
  const doc = document ?? {};
  if (typeof doc !== "object" || Array.isArray(doc))
    return {
      policy: DEFAULT_POLICY,
      errors: ["the policy is not a mapping of deny, waive and allow"],
    };
  errors.push(...unknownKeys(doc, ["deny", "waive", "allow"], "policy"));
  const list = (key) => {
    const value = doc[key] ?? [];
    if (Array.isArray(value) && value.every((entry) => entry !== null && typeof entry === "object"))
      return value;
    errors.push(`${key}: a list of entries`);
    return [];
  };

  const waived = new Set();
  list("waive").forEach((entry, index) => {
    const where = `waive[${index}]`;
    errors.push(...unknownKeys(entry, ["sha256", "reason", "issue"], where));
    if (!SHA256.test(entry.sha256 ?? "")) errors.push(`${where}: sha256 is not a SHA-256 in hex`);
    else if (!RECOMMENDED_DENY.has(entry.sha256))
      errors.push(
        `${where}: waives no entry of the recommended deny list (--recommended lists them)`,
      );
    else if (waived.has(entry.sha256)) errors.push(`${where}: waives the same entry twice`);
    else waived.add(entry.sha256);
    if (!filled(entry.reason)) errors.push(`${where}: needs a reason`);
    if (!ISSUE.test(entry.issue ?? ""))
      errors.push(`${where}: needs the issue that decided it (STA-123)`);
  });

  const deny = new Map([...RECOMMENDED_DENY].filter(([hash]) => !waived.has(hash)));
  list("deny").forEach((entry, index) => {
    const where = `deny[${index}]`;
    errors.push(...unknownKeys(entry, ["sha256", "length", "reason"], where));
    const lengthOk = Number.isInteger(entry.length) && entry.length > 0;
    if (!lengthOk) errors.push(`${where}: length is the term's length, a positive whole number`);
    if (!filled(entry.reason)) errors.push(`${where}: needs a reason`);
    if (!SHA256.test(entry.sha256 ?? ""))
      errors.push(`${where}: sha256 is not a SHA-256 in hex (--hash <term>)`);
    else if (RECOMMENDED_DENY.has(entry.sha256) && !waived.has(entry.sha256))
      errors.push(`${where}: already on the recommended deny list`);
    else if (deny.has(entry.sha256)) errors.push(`${where}: denies the same term twice`);
    else if (lengthOk && filled(entry.reason))
      deny.set(entry.sha256, { length: entry.length, reason: entry.reason.trim() });
  });

  const allow = [];
  list("allow").forEach((entry, index) => {
    const where = `allow[${index}]`;
    errors.push(...unknownKeys(entry, ["path", "package", "lineSha256", "reason", "issue"], where));
    const hasPath = filled(entry.path);
    const hasPackage = filled(entry.package);
    if (hasPath === hasPackage) errors.push(`${where}: names exactly one of path and package`);
    if (entry.lineSha256 !== undefined) {
      if (!SHA256.test(entry.lineSha256))
        errors.push(`${where}: lineSha256 is not a SHA-256 in hex`);
      if (!hasPath || entry.path.endsWith("/**"))
        errors.push(`${where}: a line entry names one exact file (--hash-line <path>:<n>)`);
    }
    if (!filled(entry.reason)) errors.push(`${where}: needs a reason`);
    if (!ISSUE.test(entry.issue ?? ""))
      errors.push(`${where}: needs the issue that removes it (STA-123)`);
    allow.push(entry);
  });

  return { policy: { deny, allow }, errors };
}

/** The policy in `file` and every problem with it; a file that cannot be read or parsed is one problem. */
export function readPolicy(file = POLICY_FILE) {
  let document;
  try {
    document = parseYaml(readFileSync(file, "utf8"));
  } catch (error) {
    return {
      policy: DEFAULT_POLICY,
      errors: [`cannot read the policy: ${error.message.split("\n")[0]}`],
    };
  }
  return parsePolicy(document);
}

/**
 * The findings of one line: each denied word or host, and each home folder with a real user name.
 *
 * @example
 * lineFindings("see /Users/me/x"); // []
 */
export function lineFindings(line, deny = RECOMMENDED_DENY) {
  const found = [];
  const lower = line.toLowerCase();
  for (const [word] of lower.matchAll(WORD)) {
    const why = denied(word, deny);
    if (why !== undefined) found.push(why);
  }
  for (const [host] of lower.matchAll(HOST)) {
    const labels = host.split(".");
    for (let i = 0; i < labels.length - 1; i += 1) {
      const why = denied(labels.slice(i).join("."), deny);
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
 * @param policy - `{ deny, allow }` (default: the recommended deny list, nothing allowed). An allow entry `{ path }`
 *                 (`dir/**` or exact) exempts the whole file, unread; `{ path, lineSha256 }` (an exact path) exempts
 *                 only the line of that file with that exact text.
 */
export function scanText(path, text, policy = DEFAULT_POLICY) {
  const { deny, allow } = policy;
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
  const findings = lineFindings(path, deny).map((reason) => ({ path, line: 0, reason }));
  if (text.includes("\u0000")) return findings; // binary: its name only
  text.split("\n").forEach((line, index) => {
    const found = lineFindings(line, deny);
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
 * Every finding of one tarball's files, each path `<tarball>!<path inside>`, against the policy's deny list. A tarball
 * whose `package/package.json` names a package the allow list exempts (`{ package, reason, issue }`) is not read.
 */
export function scanTarball(label, bytes, policy = DEFAULT_POLICY) {
  const files = tarballFiles(bytes);
  const manifest = files.find(([name]) => name === "package/package.json");
  let name;
  try {
    name = manifest === undefined ? undefined : JSON.parse(manifest[1]).name;
  } catch {
    name = undefined;
  }
  if (name !== undefined && policy.allow.some((entry) => entry.package === name)) return [];
  const deny = { deny: policy.deny, allow: [] };
  return files.flatMap(([path, text]) => scanText(`${label}!${path}`, text, deny));
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

const USAGE =
  "usage: guard-public-content.mjs [--policy <file>] [--files <path>… | --pack <file.tgz>…] | --hash <term> | " +
  "--hash-line <path>:<n> | --recommended";

/** Prints the usage and exits 2. */
function usage() {
  console.error(USAGE);
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let args = process.argv.slice(2);
  if (args[0] === "--hash") {
    if (args.length !== 2) usage();
    console.log(JSON.stringify({ sha256: hashTerm(args[1]), length: args[1].length, reason: "…" }));
    process.exit(0);
  }
  if (args[0] === "--hash-line") {
    const at = /^(.+):(\d+)$/.exec(args[1] ?? "");
    if (args.length !== 2 || at === null) usage();
    const [, path, n] = at;
    const line = readFileSync(path, "utf8").split("\n")[Number(n) - 1];
    if (line === undefined) {
      console.error(`guard-public-content: ${path} has no line ${n}`);
      process.exit(2);
    }
    console.log(JSON.stringify({ path, lineSha256: hashLine(line), reason: "…", issue: "STA-…" }));
    process.exit(0);
  }
  if (args[0] === "--recommended") {
    if (args.length !== 1) usage();
    for (const [sha256, entry] of RECOMMENDED_DENY)
      console.log(JSON.stringify({ sha256, ...entry }));
    process.exit(0);
  }
  let policyFile = POLICY_FILE;
  if (args[0] === "--policy") {
    if (args[1] === undefined) usage();
    policyFile = resolve(args[1]);
    args = args.slice(2);
  }
  const { policy, errors } = readPolicy(policyFile);
  if (errors.length > 0) {
    for (const problem of errors) console.error(`${policyFile}: ${problem}`);
    console.error(
      `guard-public-content: the policy is invalid (${errors.length} problem(s)); nothing was checked`,
    );
    process.exit(2);
  }
  const root = fileURLToPath(new URL("../..", import.meta.url));
  const read = (file) => {
    try {
      return readFileSync(isAbsolute(file) ? file : join(root, file), "utf8");
    } catch {
      return undefined; // deleted in the working tree, or not a file: its path is still read
    }
  };
  const findings = [];
  if (args[0] === "--pack") {
    if (args.length < 2) usage();
    for (const tarball of args.slice(1))
      findings.push(...scanTarball(tarball, readFileSync(tarball), policy));
  } else if (args[0] === "--files") {
    if (args.length < 2) usage();
    for (const given of args.slice(1)) {
      const file = relative(root, resolve(given));
      const body = read(file);
      if (body !== undefined) findings.push(...scanText(file, body, policy)); // a deleted file is not committed
    }
  } else if (args.length === 0) {
    for (const file of trackedFiles(root))
      findings.push(...scanText(file, read(file) ?? "", policy));
    findings.push(...staleLineEntries(policy.allow, read));
  } else usage();
  for (const { path, line, reason } of findings) console.error(`${path}:${line}: ${reason}`);
  if (findings.length > 0) {
    console.error(
      `guard-public-content: ${findings.length} line(s) carry internal content. Use a neutral example (acme, ` +
        "example.com, /Users/me) instead; an exemption goes in tools/scripts/public-content.policy.yaml (allow) " +
        "with its reason and issue.",
    );
    process.exit(1);
  }
  console.log("guard-public-content: no internal names, hosts or home folders");
}
