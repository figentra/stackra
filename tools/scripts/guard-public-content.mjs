#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: keep internal content out of the public repository and its published tarballs (STA-2876, STA-2911). It reads
 *          every tracked file's path and text (with `--files`, only the files given, as the pre-commit hook does; with
 *          `--pack`, every file inside the given `.tgz` tarballs) and refuses two kinds of line: a denied term (an
 *          internal product, person, host or cloud account id) and a home folder with a real user name
 *          (`/Users/<name>/`, `/home/<name>/`). Secret-shaped strings are gitleaks' job (`.gitleaks.toml`: lefthook
 *          pre-commit and the Quality Gate's `pnpm secrets:scan`).
 * Boundary: read-only. Two policy files. The public one, `public-content.policy.yaml` beside this script (`--policy
 *           <file>` names another), only `allow`s: a repository `path`, one line of a file by its `lineSha256`, or a
 *           tarball's `package`, each with its reason and the issue that removes it. The denied terms are in a private
 *           policy outside this repository (`--private-policy <file>`, or the file `PUBLIC_CONTENT_PRIVATE_POLICY_FILE`
 *           names), as `deny` entries: the SHA-256 of the term's lower-case spelling, its length and a reason. A hash
 *           of a short name is recovered by hashing guesses, so neither this file nor the public policy holds a
 *           denied term or its hash, and the public policy refuses a `deny` entry. Without a private policy the guard
 *           says so and checks home folders and the allow list only; a private policy that is named but cannot be
 *           read, or any invalid policy, stops every scan (exit 2), so a typo never turns the guard off. `--hash
 *           <term>` prints a private `deny` entry. A word is checked whole (letters and digits), and a dotted host by
 *           each of its suffixes of two labels or more. No line is exempt by its wording: an approval line that names
 *           a person is a finding like any other unless a line entry exempts it (STA-2905). A line entry whose line
 *           is gone is reported, so the allow list only shrinks. `--hash-line <path>:<n>` prints the entry for one
 *           line.
 * Runtime: node
 * Governing contract: ADR 0291 (porting provenance: a port keeps its reference, not its source's private paths);
 *                     ADR 0453 (the registry ships what the tarball holds); STA-2876; STA-2911 (the policy files).
 * Usage: `guard-public-content.mjs [--policy <file>] [--private-policy <file>]` (tracked files), `… --files <path>…`
 *        (those files), `… --pack <file.tgz>…` (tarballs), `--hash <term>`, `--hash-line <path>:<n>`.
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

/** The public policy file beside this script: allow entries only. */
export const POLICY_FILE = fileURLToPath(new URL("public-content.policy.yaml", import.meta.url));

/** The environment variable that names the private policy file (the denied terms), when no flag does. */
export const PRIVATE_POLICY_ENV = "PUBLIC_CONTENT_PRIVATE_POLICY_FILE";

/** Nothing denied, nothing allowed: the policy without either file. */
export const EMPTY_POLICY = Object.freeze({ deny: new Map(), allow: Object.freeze([]) });

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

/** The list `doc[key]` (empty when absent), or empty with a problem when it is not a list of entries. */
function listOf(doc, key, errors) {
  const value = doc[key] ?? [];
  if (Array.isArray(value) && value.every((entry) => entry !== null && typeof entry === "object"))
    return value;
  errors.push(`${key}: a list of entries`);
  return [];
}

/** The problems of one entry's keys: each key not in `known` is one. */
function unknownKeys(entry, known, where) {
  return Object.keys(entry)
    .filter((key) => !known.includes(key))
    .map((key) => `${where}: unknown key "${key}" (one of ${known.join(", ")})`);
}

/**
 * The public policy a parsed `public-content.policy.yaml` document describes, and every problem with it: its `allow`
 * entries, `{ path | package, reason, issue }` or `{ path, lineSha256, reason, issue }` for one line of one file. A
 * `deny` entry here is a problem: the denied terms belong in the private policy.
 *
 * @example
 * parsePolicy({ allow: [{ path: "dir/**", reason: "why", issue: "STA-1" }] }).errors; // []
 */
export function parsePolicy(document) {
  const errors = [];
  const doc = document ?? {};
  if (typeof doc !== "object" || Array.isArray(doc))
    return { policy: EMPTY_POLICY, errors: ["the policy is not a mapping with an allow list"] };
  if ("deny" in doc)
    errors.push(
      "deny: denied terms go in the private policy, never in this public file (a hash of a short name is " +
        "recovered by hashing guesses)",
    );
  const others = Object.fromEntries(Object.entries(doc).filter(([key]) => key !== "deny"));
  errors.push(...unknownKeys(others, ["allow"], "policy"));
  const allow = [];
  listOf(doc, "allow", errors).forEach((entry, index) => {
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
  return { policy: { deny: new Map(), allow }, errors };
}

/**
 * The deny list a parsed private policy document describes, and every problem with it: its `deny` entries,
 * `{ sha256, length, reason }` (`--hash <term>` prints one).
 *
 * @example
 * parsePrivatePolicy({ deny: [{ sha256: hashTerm("acme"), length: 4, reason: "a client name" }] }).errors; // []
 */
export function parsePrivatePolicy(document) {
  const errors = [];
  const doc = document ?? {};
  if (typeof doc !== "object" || Array.isArray(doc))
    return { deny: new Map(), errors: ["the private policy is not a mapping with a deny list"] };
  errors.push(...unknownKeys(doc, ["deny"], "private policy"));
  const deny = new Map();
  listOf(doc, "deny", errors).forEach((entry, index) => {
    const where = `deny[${index}]`;
    errors.push(...unknownKeys(entry, ["sha256", "length", "reason"], where));
    const lengthOk = Number.isInteger(entry.length) && entry.length > 0;
    if (!lengthOk) errors.push(`${where}: length is the term's length, a positive whole number`);
    if (!filled(entry.reason)) errors.push(`${where}: needs a reason`);
    if (!SHA256.test(entry.sha256 ?? ""))
      errors.push(`${where}: sha256 is not a SHA-256 in hex (--hash <term>)`);
    else if (deny.has(entry.sha256)) errors.push(`${where}: denies the same term twice`);
    else if (lengthOk && filled(entry.reason))
      deny.set(entry.sha256, { length: entry.length, reason: entry.reason.trim() });
  });
  return { deny, errors };
}

/** The parsed YAML of `file`, or the one problem that kept it from being read. */
function readYaml(file, what) {
  try {
    return { document: parseYaml(readFileSync(file, "utf8")) };
  } catch (error) {
    return { problem: `cannot read the ${what}: ${error.message.split("\n")[0]}` };
  }
}

/**
 * The policy of the public file and, when one is named, the private file, with every problem as
 * `{ file, problem }`. `hasPrivate` says whether denied terms are checked at all.
 */
export function readPolicy(file = POLICY_FILE, privateFile = undefined) {
  const errors = [];
  const pub = readYaml(file, "policy");
  let policy = EMPTY_POLICY;
  if (pub.problem !== undefined) errors.push({ file, problem: pub.problem });
  else {
    const parsed = parsePolicy(pub.document);
    errors.push(...parsed.errors.map((problem) => ({ file, problem })));
    policy = parsed.policy;
  }
  if (privateFile === undefined) return { policy, errors, hasPrivate: false };
  const own = readYaml(privateFile, "private policy");
  if (own.problem !== undefined) {
    errors.push({ file: privateFile, problem: own.problem });
    return { policy, errors, hasPrivate: true };
  }
  const parsed = parsePrivatePolicy(own.document);
  errors.push(...parsed.errors.map((problem) => ({ file: privateFile, problem })));
  return { policy: { deny: parsed.deny, allow: policy.allow }, errors, hasPrivate: true };
}

/**
 * The findings of one line: each denied word or host, and each home folder with a real user name.
 *
 * @example
 * lineFindings("see /Users/me/x"); // []
 */
export function lineFindings(line, deny = EMPTY_POLICY.deny) {
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
 * @param policy - `{ deny, allow }` (default: nothing denied, nothing allowed). An allow entry `{ path }`
 *                 (`dir/**` or exact) exempts the whole file, unread; `{ path, lineSha256 }` (an exact path) exempts
 *                 only the line of that file with that exact text.
 */
export function scanText(path, text, policy = EMPTY_POLICY) {
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
export function scanTarball(label, bytes, policy = EMPTY_POLICY) {
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
  "usage: guard-public-content.mjs [--policy <file>] [--private-policy <file>] [--files <path>… | --pack <file.tgz>…]" +
  " | --hash <term> | --hash-line <path>:<n>";

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
  let policyFile = POLICY_FILE;
  const fromEnv = process.env[PRIVATE_POLICY_ENV];
  let privateFile = fromEnv === undefined || fromEnv === "" ? undefined : resolve(fromEnv);
  for (;;) {
    if (args[0] === "--policy") {
      if (args[1] === undefined) usage();
      policyFile = resolve(args[1]);
    } else if (args[0] === "--private-policy") {
      if (args[1] === undefined) usage();
      privateFile = resolve(args[1]);
    } else break;
    args = args.slice(2);
  }
  const { policy, errors, hasPrivate } = readPolicy(policyFile, privateFile);
  if (errors.length > 0) {
    for (const { file, problem } of errors) console.error(`${file}: ${problem}`);
    console.error(
      `guard-public-content: the policy is invalid (${errors.length} problem(s)); nothing was checked`,
    );
    process.exit(2);
  }
  if (!hasPrivate)
    console.error(
      `guard-public-content: no private policy (--private-policy or ${PRIVATE_POLICY_ENV}): denied terms are not ` +
        "checked, home folders are",
    );
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
  console.log(
    hasPrivate
      ? "guard-public-content: no internal names, hosts or home folders"
      : "guard-public-content: no home folders (denied terms not checked: no private policy)",
  );
}
