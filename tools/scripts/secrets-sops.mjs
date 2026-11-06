/**
 * Stackra file contract:
 * Purpose: the one SOPS writer and reader for `figentra/secrets` (ADR 0525), shared by `secrets:put`,
 *   `secrets:generate`, `secrets:migrate`, `secrets:import --scope`, `secrets:catalog` and `secrets-exec.mjs`.
 *   One file per secret, `<scope>/<NAME>.enc.yaml`, so a writer needs only KMS Encrypter: it never decrypts, and so
 *   it never sees, any other value (a shared file would make every writer a reader, because sops recomputes its MAC
 *   over every plaintext value).
 * Boundary: the sops, git and gh CLIs, always with output captured and classified into fixed messages; a temporary
 *   clone of `figentra/secrets`; a pull request there that merges itself behind the policy gate (ADR 0523).
 * Runtime: node
 * Governing contract: ADR 0525 (SOPS and Cloud KMS replace Infisical); ADR 0257 (nobody reads a value); ADR 0267.
 * Input: `{ scope, name, value }` entries; the value is a Buffer that lives only in this process.
 * Output: names, scopes, file paths and the pull request URL; never a value, a hash or ciphertext.
 * Secrets: a value goes to sops on stdin only, never on argv, in a file or in a log. Plaintext never touches disk.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

/** An error whose message is a fixed, value-free string, safe to print. */
export class Refusal extends Error {}

/** A secret name: SCREAMING_SNAKE. */
export const NAME_RX = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/**
 * A scope is a folder of `figentra/secrets`; `.sops.yaml` picks its KMS key by path:
 * `agents`, `ci/<build|deploy|production|flow>[/<folder>…]` or `products/<product>/<dev|staging|production>`.
 */
export const SCOPE_RX =
  /^(?:agents|ci\/(?:build|deploy|production|flow)(?:\/[a-z0-9-]+)*|products\/[a-z0-9-]+\/(?:dev|staging|production))$/;

/** Scopes an agent never writes: the gate and the registry release keys (the owner's keeper rule, 2026-10-31). */
export const AGENT_DENIED_SCOPES = [/^ci\/flow(?:\/|$)/, /(?:^|\/)registry(?:\/|$)/];

/** The secrets repository a write opens its pull request against. */
export const SECRETS_REPO = "figentra/secrets";

/** True when an agent runs the script (Claude Code, OpenCode or a Stackra agent run). */
export const isAgentRun = (env) =>
  Boolean(env.CLAUDECODE || env.OPENCODE || env.AI_AGENT || env.STACKRA_AGENT);

/** The file that holds one secret, relative to the repository root. */
export const secretFile = (scope, name) => `${scope}/${name}.enc.yaml`;

/** First 8 hex characters of a value's SHA-256: the most a log or a comparison may show (ADR 0173, 2026-11-04). */
export const shortHash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 8);

/** Check a name and scope (and, for an agent, the denied scopes); returns `{ scope, name }` or throws a Refusal. */
export function checkTarget({ scope, name }, { agent = false } = {}) {
  if (!NAME_RX.test(String(name))) throw new Refusal("name is not SCREAMING_SNAKE");
  if (!SCOPE_RX.test(String(scope)))
    throw new Refusal(
      "scope must be agents, ci/<build|deploy|production|flow>[/folder] or products/<product>/<dev|staging|production>",
    );
  if (agent && AGENT_DENIED_SCOPES.some((rx) => rx.test(scope)))
    throw new Refusal("an agent never writes a gate or registry key; the owner runs it");
  return { scope, name };
}

/**
 * Default runner: a CLI with every byte of output captured, never inherited. `input` goes to stdin, which is how a
 * value reaches sops.
 */
export function cliRunner(command, args, { cwd, input } = {}) {
  const r = spawnSync(command, args, {
    cwd,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 1024 * 1024,
  });
  return { status: r.error ? 127 : r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Map a failed CLI call to a fixed message; the CLI's own text is inspected, never repeated. */
export function cliFailure(what, command, r) {
  if (r.status === 127) return new Refusal(`${what}: ${command} not found (mise install)`);
  const err = `${r.stderr}\n${r.stdout}`;
  if (/permission|denied|403|unauthenticated|credentials|login/i.test(err))
    return new Refusal(`${what}: ${command} was refused (sign in, or this identity lacks the key)`);
  if (/no matching creation rules|creation_rules/i.test(err))
    return new Refusal(`${what}: .sops.yaml has no rule for this scope`);
  return new Refusal(`${what}: ${command} exited ${r.status}`);
}

/**
 * Encrypt one value into the text of its `.enc.yaml` file. The plaintext document goes to sops on stdin; the file
 * name override makes `.sops.yaml` pick the scope's key and the owner's `age` recipient. Needs KMS Encrypter only.
 */
export function encryptValue({ scope, name, value }, { cwd, run = cliRunner }) {
  const doc = JSON.stringify({ [name]: Buffer.from(value).toString("utf8") });
  const r = run(
    "sops",
    [
      "encrypt",
      "--filename-override",
      secretFile(scope, name),
      "--input-type",
      "json",
      "--output-type",
      "yaml",
      "/dev/stdin",
    ],
    { cwd, input: doc },
  );
  if (r.status !== 0) throw cliFailure("encrypt", "sops", r);
  if (!/\nsops:\n/.test(`\n${r.stdout}`))
    throw new Refusal("encrypt: sops returned no sops metadata");
  return r.stdout;
}

/**
 * Decrypt one secret file into its value, in memory. Only `secrets-exec.mjs` (scope `agents`, for MCP servers) and
 * CI jobs call this; nothing prints the result.
 */
export function decryptFile(file, name, { cwd, run = cliRunner }) {
  const r = run("sops", ["decrypt", "--output-type", "json", file], { cwd });
  if (r.status !== 0) throw cliFailure("decrypt", "sops", r);
  let doc;
  try {
    doc = JSON.parse(r.stdout);
  } catch {
    throw new Refusal("decrypt: unexpected sops output");
  }
  if (typeof doc?.[name] !== "string")
    throw new Refusal("decrypt: the file does not hold its own name");
  return doc[name];
}

/** Every secret NAME in a checkout, by scope, from file names alone (no decrypt). */
export function listNames(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).toSorted((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (entry.name.startsWith(".")) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".enc.yaml")) {
        const scope = relative(root, dir);
        const name = entry.name.slice(0, -".enc.yaml".length);
        if (SCOPE_RX.test(scope) && NAME_RX.test(name)) out.push({ scope, name });
      }
    }
  };
  if (existsSync(root)) walk(root);
  return out;
}

/** Run a git or gh step in the clone; throws a fixed Refusal on failure. */
function step(run, command, args, cwd, what) {
  const r = run(command, args, { cwd });
  if (r.status !== 0) throw cliFailure(what, command, r);
  return r.stdout.trim();
}

/**
 * Write secrets into `figentra/secrets` through one self-merging pull request. Each entry is
 * `{ scope, name, value }`; `replace: false` refuses a name that already has a file (generate without --rotate).
 * Returns `{ written: [{ scope, name, replaced }], url }`; never a value.
 */
export function publish(
  entries,
  {
    actor = "unknown",
    title,
    replace = true,
    repo = SECRETS_REPO,
    run = cliRunner,
    now = Date.now,
    extraFiles = {},
  } = {},
) {
  if (!entries.length) throw new Refusal("nothing to write");
  const clone = mkdtempSync(join(tmpdir(), "figentra-secrets-"));
  try {
    step(run, "gh", ["repo", "clone", repo, clone, "--", "--depth", "1"], undefined, "clone");
    const written = [];
    for (const e of entries) {
      const file = secretFile(e.scope, e.name);
      const replaced = existsSync(join(clone, file));
      if (replaced && !replace)
        throw new Refusal(`${e.name} already exists in ${e.scope}; use --rotate`);
      const text = encryptValue(e, { cwd: clone, run });
      mkdirSync(dirname(join(clone, file)), { recursive: true });
      writeFileSync(join(clone, file), text);
      written.push({ scope: e.scope, name: e.name, replaced });
    }
    for (const [path, text] of Object.entries(extraFiles)) {
      mkdirSync(dirname(join(clone, path)), { recursive: true });
      writeFileSync(join(clone, path), text);
    }
    const names = written.map((w) => `${w.scope}/${w.name}`);
    const subject =
      title ?? `secrets: set ${names.length === 1 ? names[0] : `${names.length} names`}`;
    const branch = `secrets/${actor.replaceAll(/[^a-z0-9-]/gi, "-")}-${now().toString(36)}`;
    step(run, "git", ["switch", "-c", branch], clone, "branch");
    step(run, "git", ["add", "--all"], clone, "stage");
    const body = `${subject}\n\nNames only:\n${names.map((n) => `- ${n}`).join("\n")}\n\nActor: ${actor}\n`;
    step(run, "git", ["commit", "--quiet", "--message", body], clone, "commit");
    step(run, "git", ["push", "--quiet", "--set-upstream", "origin", branch], clone, "push");
    const url = step(
      run,
      "gh",
      ["pr", "create", "--repo", repo, "--head", branch, "--title", subject, "--body", body],
      clone,
      "pull request",
    );
    step(run, "gh", ["pr", "merge", url, "--auto", "--squash"], clone, "auto-merge");
    return { written, url };
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
}
