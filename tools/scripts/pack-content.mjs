/**
 * Stackra file contract:
 * Purpose: what a published tarball may hold, in one place for the workspace pack hook (`.pnpmfile.mjs`) and the
 *          tarball scanner (`scan-tarballs.mjs`): no test file (a `__tests__`, `__fixtures__`, `__snapshots__` or
 *          `__mocks__` folder, a `*.test.*`, `*.spec.*`, `*.test-d.*` or `*.bench.*` file) and no secret-shaped
 *          string (a private key block, a JWT, a payment, cloud, Git host, chat, mail or AI provider key). The
 *          samples in our tests are fake, but a consumer's scanner (Trivy, GitHub secret scanning of vendored code)
 *          cannot tell, and the tests were 5,641 files of the 0.33.1 tarballs (STA-2917).
 * Boundary: read-only; node built-ins only, because the pack hook imports it and pnpm loads the hook before any
 *           install. `packCandidates` lists what a package's `files` puts in its tarball as a superset of what
 *           `pnpm pack` takes (it ignores `.npmignore`), so a check over it never misses a shipped file. A finding
 *           names the file, the line and the kind of string, never the string itself.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks on the packed tarball); ADR 0453 (the registry ships what the
 *                     tarball holds); ADR 0022 (tests live in tests folders); STA-2917.
 * Secrets: forbidden. The rules below match the shape of a secret; no value is stored or printed.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix } from "node:path";

/**
 * The `files` entries the pack hook adds to every packed manifest, so `src` ships without its tests: npm and pnpm
 * read a `files` entry that starts with `!` as an exclusion.
 */
export const TEST_EXCLUDES = Object.freeze([
  "!**/__tests__",
  "!**/__fixtures__",
  "!**/__snapshots__",
  "!**/__mocks__",
  "!**/*.test.*",
  "!**/*.spec.*",
  "!**/*.test-d.*",
  "!**/*.bench.*",
]);

/** A folder that only tests use, at any depth. */
const TEST_FOLDER = /(?:^|\/)__(?:tests|fixtures|snapshots|mocks)__(?:\/|$)/;

/** A test, spec, type-test or benchmark file by its name (`a.test.ts`, `a.spec.mjs`, `a.test-d.ts`, `a.bench.ts`). */
const TEST_FILE = /^.+\.(?:test|spec|test-d|bench)\.[^/]+$/;

/**
 * Whether `path` (relative, `/`-separated) is a test file or sits in a test-only folder.
 * @example
 * isTestPath("src/core/__tests__/a.test.ts"); // true
 * isTestPath("src/e2e/test/test.constant.ts"); // false
 */
export function isTestPath(path) {
  return TEST_FOLDER.test(path) || TEST_FILE.test(posix.basename(path));
}

/**
 * The secret shapes a published file must not hold, each with its id and what it is. Each needs the full shape of a
 * real credential (prefix and length), so a rule that only describes one (a redaction pattern such as
 * `sk_live_[0-9a-zA-Z]+`) does not match.
 */
export const SECRET_RULES = Object.freeze([
  {
    id: "private-key",
    what: "a private key block",
    pattern: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/,
  },
  {
    id: "jwt",
    what: "a JSON Web Token",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  },
  {
    id: "stripe-key",
    what: "a Stripe secret, restricted or webhook key",
    pattern: /\b(?:[sr]k_(?:live|test)_[0-9A-Za-z]{16,}|whsec_[0-9A-Za-z]{24,})/,
  },
  {
    id: "aws-access-key",
    what: "an AWS access key id",
    pattern: /\b(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b/,
  },
  {
    id: "github-token",
    what: "a GitHub token",
    pattern: /\b(?:gh[pousr]_[0-9A-Za-z]{36,}|github_pat_[0-9A-Za-z_]{40,})/,
  },
  { id: "gitlab-token", what: "a GitLab token", pattern: /\bglpat-[0-9A-Za-z_-]{20,}/ },
  { id: "npm-token", what: "an npm token", pattern: /\bnpm_[0-9A-Za-z]{36}\b/ },
  { id: "slack-token", what: "a Slack token", pattern: /\bxox[abposr]-[0-9A-Za-z-]{10,}/ },
  {
    id: "slack-webhook",
    what: "a Slack incoming webhook",
    pattern: /hooks\.slack\.com\/services\/T[0-9A-Z]{6,}\/B[0-9A-Z]{6,}\/[0-9A-Za-z]{20,}/,
  },
  { id: "google-api-key", what: "a Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  {
    id: "sendgrid-key",
    what: "a SendGrid key",
    pattern: /\bSG\.[0-9A-Za-z_-]{22}\.[0-9A-Za-z_-]{43}\b/,
  },
  {
    id: "anthropic-key",
    what: "an Anthropic API key",
    pattern: /\bsk-ant-[a-z0-9]+-[0-9A-Za-z_-]{32,}/,
  },
  {
    id: "openai-key",
    what: "an OpenAI API key",
    pattern: /\bsk-(?:proj-|svcacct-|admin-)?[0-9A-Za-z_-]{20,}T3BlbkFJ[0-9A-Za-z_-]{20,}/,
  },
]);

/** The first 8 KB holds a NUL byte: an image, font or other binary file, which no rule reads. */
function isBinary(buffer) {
  return buffer.subarray(0, 8192).includes(0);
}

/**
 * The secret shapes in one file's bytes, one finding per rule and line, as `{ line, rule, what }`.
 * @example
 * secretFindings(readFileSync("dist/index.mjs")); // [{ line: 12, rule: "jwt", what: "a JSON Web Token" }]
 */
export function secretFindings(buffer) {
  if (isBinary(buffer)) return [];
  const findings = [];
  buffer
    .toString("utf8")
    .split("\n")
    .forEach((text, index) => {
      for (const { id, what, pattern } of SECRET_RULES)
        if (pattern.test(text)) findings.push({ line: index + 1, rule: id, what });
    });
  return findings;
}

/** Folders `pnpm pack` never takes from a member. */
const NEVER_PACKED = new Set(["node_modules", ".git"]);

/** Every file under `dir`, as paths relative to `root` (`/`-separated) in name order; a missing `dir` has none. */
function walk(root, dir = "") {
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch {
    return [];
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return entries.flatMap((entry) => {
    const path = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return NEVER_PACKED.has(entry.name) ? [] : walk(root, path);
    return entry.isFile() ? [path] : [];
  });
}

/** A `files` glob (`*`, `**`, `?`) as a regular expression over a relative path. */
function globPattern(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*" && glob[i + 1] === "*") {
      source += ".*";
      i += 1;
    } else if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else source += char.replaceAll(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`);
}

/** The file always packed whatever `files` says: the manifest, the readme, the licence, the changelog. */
const ALWAYS_PACKED = /^(?:package\.json|(?:readme|licen[cs]e|changelog|notice)(?:\..*)?)$/i;

/**
 * The files `pkg` (its manifest) packs from `dir`, relative and `/`-separated: each positive `files` entry (a file,
 * a folder with everything under it, or a glob matching either), the files npm always packs, minus every path the
 * negative entries' test rules exclude. Without `files`, everything but `node_modules` and `.git`. A superset of the
 * tarball's list, never smaller.
 */
export function packCandidates(pkg, dir) {
  const all = walk(dir);
  if (!Array.isArray(pkg.files)) return all;
  const excludesTests = TEST_EXCLUDES.every((entry) => pkg.files.includes(entry));
  const matchers = pkg.files
    .filter((entry) => typeof entry === "string" && !entry.startsWith("!"))
    .map((entry) => entry.replace(/^\.\//, "").replace(/\/+$/, ""))
    .filter((entry) => entry.length > 0)
    .map(globPattern);
  const packed = (path) => {
    const parts = path.split("/");
    return parts.some((_, end) =>
      matchers.some((matcher) => matcher.test(parts.slice(0, end + 1).join("/"))),
    );
  };
  return all.filter(
    (path) => (ALWAYS_PACKED.test(path) || packed(path)) && !(excludesTests && isTestPath(path)),
  );
}

/**
 * Why the package in `dir` must not be packed as `pkg` says: each test file and each secret-shaped string among
 * `packCandidates`, as `<path>:<line>: <reason>` lines (line 0 is the path itself). Empty when it may.
 */
export function packFindings(pkg, dir) {
  const findings = [];
  const advice = Array.isArray(pkg.files) ? "" : " (add a `files` list to package.json)";
  for (const path of packCandidates(pkg, dir)) {
    if (isTestPath(path)) findings.push(`${path}:0: a test file${advice}`);
    let size;
    try {
      size = statSync(join(dir, path)).size;
    } catch {
      continue;
    }
    if (size === 0) continue;
    for (const { line, rule, what } of secretFindings(readFileSync(join(dir, path))))
      findings.push(`${path}:${line}: ${what} (${rule})`);
  }
  return findings;
}
