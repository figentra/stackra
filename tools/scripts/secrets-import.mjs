#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: move secret values a human dropped into ~/Secrets-inbox/ into Infisical without any value ever reaching
 *   stdout, stderr, argv, the audit log or the caller (`pnpm secrets:import`, ADR 0257). Verifies by SHA-256 read-back
 *   inside this process, deletes the inbox file on success, keeps it on failure.
 * Input: files directly in $HOME/Secrets-inbox/ (file name = secret name, one extension stripped); optional
 *   `<NAME>.target.yaml` sidecar with `env` / `path`; flags --env --path --name --dry-run --list --confirm --actor.
 * Output: one line per secret NAME with the target and a value-free result; exit 1 when any secret failed.
 * Secrets: reads values; never prints, logs or passes one on argv. The Infisical CLI's stdout/stderr are captured
 *   and only classified into fixed messages. Safe for any caller: hooks cannot tell agents apart, so the script is
 *   the boundary.
 *
 * Usage:
 *   pnpm secrets:import --list                       # inbox file NAMES, nothing else
 *   pnpm secrets:import --dry-run [FILE…]            # validate, reach Infisical, would-overwrite; prod: prints a token
 *   pnpm secrets:import [FILE…] [--env e --path p --name N] [--confirm <token>] [--actor <agent>]
 */
import { spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parse as parseYaml } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const MAX_BYTES = 64 * 1024;
export const TOKEN_TTL_MS = 30 * 60 * 1000;
const NAME_RX = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;
export const ENVS = ["dev", "staging", "prod"];
// The vault layout (rules/secrets.md): /agents and /ci, plus sub-folders.
const PATH_RX = /^\/(?:agents|ci)(?:\/[a-z0-9-]+)*$/;
const SIDECAR = ".target.yaml";
export const isProd = (env) => /^prod(uction)?$/i.test(env);
const sha256 = (data) => createHash("sha256").update(data).digest("hex");

/** An error whose message is a fixed, value-free string. */
class Refusal extends Error {}

/** The inbox entries: secret files to import, and value-free problems. Never opens a file. */
export function scanInbox(inbox) {
  const st = lstatSync(inbox, { throwIfNoEntry: false });
  if (!st) return { entries: [], problems: [{ file: inbox, error: "inbox does not exist" }] };
  if (st.isSymbolicLink() || !st.isDirectory())
    return { entries: [], problems: [{ file: inbox, error: "inbox is not a real directory" }] };
  const entries = [];
  const problems = [];
  for (const file of readdirSync(inbox).sort()) {
    if (file.startsWith(".") || file.endsWith(SIDECAR)) continue;
    const s = lstatSync(join(inbox, file));
    const name = file.replace(/\.[^.]*$/, "");
    if (s.isSymbolicLink()) problems.push({ file, error: "symlink refused" });
    else if (s.isDirectory()) problems.push({ file, error: "directory refused" });
    else if (!s.isFile()) problems.push({ file, error: "not a regular file" });
    else if (s.size > MAX_BYTES) problems.push({ file, error: `larger than ${MAX_BYTES} bytes` });
    else if (!NAME_RX.test(name)) problems.push({ file, error: "name is not SCREAMING_SNAKE" });
    else entries.push({ file, name });
  }
  return { entries, problems };
}

/** `<NAME>.target.yaml` → { env?, path? }. Throws a Refusal on a bad sidecar. */
export function readSidecar(inbox, name) {
  const p = join(inbox, name + SIDECAR);
  const st = lstatSync(p, { throwIfNoEntry: false });
  if (!st) return {};
  if (!st.isFile()) throw new Refusal("sidecar is not a regular file");
  let data;
  try {
    data = parseYaml(readFileSync(p, "utf8")) ?? {};
  } catch {
    throw new Refusal("sidecar is not valid YAML");
  }
  const extra = Object.keys(data).filter((k) => k !== "env" && k !== "path");
  if (extra.length) throw new Refusal(`sidecar has unknown keys: ${extra.join(", ")}`);
  return data;
}

/** Check a resolved target; returns it or throws a Refusal. */
export function checkTarget({ name, env, path }) {
  if (!NAME_RX.test(name)) throw new Refusal("name is not SCREAMING_SNAKE");
  if (!ENVS.includes(env)) throw new Refusal(`env must be one of ${ENVS.join(", ")}`);
  if (!PATH_RX.test(path)) throw new Refusal("path must be /agents or /ci (or a sub-folder)");
  return { name, env, path };
}

/** Raw bytes → { value, hash }: UTF-8, no NUL, one trailing newline stripped (editors add it), not empty. */
function toValue(buf) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    throw new Refusal("not UTF-8 text");
  }
  if (text.includes("\0")) throw new Refusal("contains a NUL byte");
  const value = Buffer.from(text.replace(/\r?\n$/, ""), "utf8");
  if (value.length === 0) throw new Refusal("empty");
  return { value, hash: sha256(value) };
}

/** Drain a stream (any async iterable of bytes) with the same cap as a file. */
async function readStream(stream) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_BYTES) throw new Refusal(`larger than ${MAX_BYTES} bytes`);
    chunks.push(Buffer.from(chunk));
  }
  return toValue(Buffer.concat(chunks));
}

/**
 * Read one inbox file without following a symlink. The caller never prints the value or its hash.
 */
export function readValue(file) {
  let fd;
  try {
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch {
    throw new Refusal("cannot open (symlink or missing)");
  }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) throw new Refusal("not a regular file");
    if (st.size > MAX_BYTES) throw new Refusal(`larger than ${MAX_BYTES} bytes`);
    const buf = Buffer.alloc(st.size);
    readSync(fd, buf, 0, st.size, 0);
    return toValue(buf);
  } finally {
    closeSync(fd);
  }
}

/** Default runner: the Infisical CLI with every byte of output captured, never inherited. */
export function cliRunner(args) {
  const r = spawnSync("infisical", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 4 * MAX_BYTES,
  });
  return { status: r.error ? 127 : r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Map a failed CLI call to a fixed message. The CLI's own text is inspected, never repeated. */
function cliFailure(what, r) {
  if (r.status === 127) return new Refusal(`${what}: infisical CLI not found (mise install)`);
  const err = `${r.stderr}\n${r.stdout}`;
  if (/log ?in|authenticat|unauthori[sz]ed|expired/i.test(err))
    return new Refusal(`${what}: not logged in to Infisical (run \`infisical login\`)`);
  if (/dial|timeout|connection|network|no such host/i.test(err))
    return new Refusal(`${what}: Infisical unreachable`);
  if (/folder|path/i.test(err)) return new Refusal(`${what}: the folder does not exist`);
  return new Refusal(`${what}: infisical exited ${r.status}`);
}

const scope = (t) => [`--env=${t.env}`, `--path=${t.path}`, "--silent"];

/** SHA-256 of the stored value, or null when the secret does not exist. Proves Infisical is reachable. */
export function remoteHash(t, runner) {
  const r = runner([
    "secrets",
    "get",
    t.name,
    ...scope(t),
    "--output=json",
    "--expand=false",
    "--include-imports=false",
    "--secret-overriding=false",
  ]);
  if (r.status !== 0) throw cliFailure("read", r);
  let rows;
  try {
    rows = JSON.parse(r.stdout);
  } catch {
    throw new Refusal("read: unexpected infisical output");
  }
  const row = (Array.isArray(rows) ? rows : [rows]).find(
    (x) => (x?.secretKey ?? x?.key) === t.name,
  );
  const value = row?.secretValue ?? row?.value;
  if (value === undefined || value === "*not found*" || row?.type === "*not found*") return null;
  return sha256(Buffer.from(String(value), "utf8"));
}

/**
 * The pinned CLI (0.44.2, mise.toml) documents `NAME=@/path/to/file` in `secrets set --help`; check the
 * installed one does too before writing, so an older CLI fails here instead of storing the literal path.
 */
export function checkFileSyntax(runner) {
  const r = runner(["secrets", "set", "--help"]);
  if (r.status !== 0 || !/=@/.test(`${r.stdout}${r.stderr}`))
    throw new Refusal("this infisical CLI does not support NAME=@file; mise install (0.44.2)");
}

const TEMP_PREFIX = ".import-";
let liveTemp;

/** Remove temp dirs a killed run left behind (dot-entries, so --list and imports skip them). */
export function cleanStaleTemps(inbox) {
  if (!existsSync(inbox)) return;
  for (const f of readdirSync(inbox))
    if (f.startsWith(TEMP_PREFIX)) rmSync(join(inbox, f), { recursive: true, force: true });
}

/**
 * Write through `NAME=@file` so the value is never on argv. The 0600 temp file lives in a dot-dir inside
 * the inbox (already hook-guarded, never synced), is removed at once, on a signal, or at the next start.
 */
export function writeSecret(t, value, runner, inbox) {
  mkdirSync(inbox, { recursive: true, mode: 0o700 });
  const dir = mkdtempSync(join(inbox, TEMP_PREFIX));
  liveTemp = dir;
  try {
    const file = join(dir, "value");
    writeFileSync(file, value, { mode: 0o600 });
    const r = runner(["secrets", "set", `${t.name}=@${file}`, ...scope(t), "--type=shared"]);
    if (r.status !== 0) throw cliFailure("write", r);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    liveTemp = undefined;
  }
}

// --- production confirmation ------------------------------------------------------------------------
/** ~/.stackra, created or tightened to 0700. */
function stateDir(home) {
  const dir = join(home, ".stackra");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  return dir;
}

/** Per-machine HMAC key, so a token reveals nothing about the value hash it binds. */
function confirmKey(home) {
  const p = join(stateDir(home), "secrets-confirm.key");
  if (!existsSync(p)) writeFileSync(p, randomBytes(32), { mode: 0o600, flag: "wx" });
  return readFileSync(p);
}

/** One-time token binding name, env, path, value hash and issue time. */
export function confirmToken(home, t, hash, now = Date.now()) {
  const issued = Math.floor(now / 1000).toString(36);
  const mac = createHmac("sha256", confirmKey(home))
    .update([t.name, t.env, t.path, hash, issued].join("\n"))
    .digest("hex")
    .slice(0, 20);
  return `${issued}-${mac}`;
}

/** null when the token is valid and unused, else a value-free reason. */
export function checkConfirm(home, token, t, hash, now = Date.now()) {
  if (!token) return "production write needs --confirm <token> from a dry run the owner approved";
  const issuedMs = parseInt(token.split("-")[0], 36) * 1000;
  if (!(now - issuedMs >= 0 && now - issuedMs <= TOKEN_TTL_MS))
    return "confirm token expired; run the dry run again";
  if (confirmToken(home, t, hash, issuedMs) !== token)
    return "confirm token does not match this name, env, path and file";
  if (auditLines(home).some((l) => l.confirm === token && l.action === "confirm-used"))
    return "confirm token already used";
  return null;
}

// --- audit ------------------------------------------------------------------------------------------
const auditPath = (home) => join(home, ".stackra", "secrets-audit.log");
function auditLines(home) {
  if (!existsSync(auditPath(home))) return [];
  return readFileSync(auditPath(home), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return {};
      }
    });
}
/** Append-only, names only. */
function audit(home, entry) {
  stateDir(home);
  appendFileSync(
    auditPath(home),
    JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n",
    {
      mode: 0o600,
    },
  );
}

/**
 * The import core: production confirmation, write, read-back verification. Returns the hash that was
 * there before (null = new). Throws a Refusal; never returns or prints the value.
 */
function store(t, { value, hash }, { confirm, home, runner, now, actor, inbox }) {
  if (isProd(t.env)) {
    const why = checkConfirm(home, confirm, t, hash, now());
    if (why) throw new Refusal(why);
    // Spend the token before anything can fail or crash, so it can never be replayed.
    audit(home, { actor, name: t.name, env: t.env, path: t.path, action: "confirm-used", confirm });
  }
  const before = remoteHash(t, runner);
  if (before !== hash) {
    checkFileSyntax(runner);
    writeSecret(t, value, runner, inbox);
  }
  if (remoteHash(t, runner) !== hash) throw new Refusal("read-back hash does not match");
  return before;
}

/**
 * Programmatic entry (a future local request page): stream a value straight into Infisical.
 * Returns only { name, ok, reason }; the reason is a fixed, value-free string.
 */
export async function importSecret({
  name,
  env = "dev",
  path = "/agents",
  valueStream,
  actor = "unknown",
  confirm,
  home = homedir(),
  runner = cliRunner,
  now = Date.now,
}) {
  const label = NAME_RX.test(String(name)) ? name : "(invalid name)";
  const inbox = join(home, "Secrets-inbox");
  try {
    cleanStaleTemps(inbox);
    const t = checkTarget({ name, env, path });
    store(t, await readStream(valueStream), { confirm, home, runner, now, actor, inbox });
    audit(home, { actor, name, env, path, action: "import", result: "ok" });
    return { name: label, ok: true };
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    audit(home, {
      actor,
      name: label,
      env,
      path,
      action: "import",
      result: "refused",
      reason: error.message,
    });
    return { name: label, ok: false, reason: error.message };
  }
}

// --- main -------------------------------------------------------------------------------------------
/** Runs the command; returns the exit code. `home` decides the inbox and the audit log (tests pass a temp dir). */
export function main(
  argv,
  {
    home = homedir(),
    runner = cliRunner,
    now = Date.now,
    write = (s) => process.stdout.write(s),
  } = {},
) {
  // Strip control characters: a crafted file name must not drive the terminal.
  // oxlint-disable-next-line no-control-regex -- matching control characters is the point
  const say = (s) => write(s.replace(/[\u0000-\u001f\u007f-\u009f]/g, "?") + "\n");
  let args;
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        "dry-run": { type: "boolean" },
        list: { type: "boolean" },
        env: { type: "string" },
        path: { type: "string" },
        name: { type: "string" },
        confirm: { type: "string" },
        actor: { type: "string" },
      },
    });
  } catch {
    // parseArgs echoes the offending argument; never repeat it, it could be a pasted value.
    say("secrets-import: unknown flag (there is no --value; drop a file into ~/Secrets-inbox/)");
    return 2;
  }
  const { values: o, positionals } = args;
  const actor = o.actor ?? process.env.STACKRA_AGENT ?? "unknown";
  const inbox = join(home, "Secrets-inbox");
  cleanStaleTemps(inbox);
  const { entries, problems } = scanInbox(inbox);

  if (o.list) {
    for (const e of entries) say(e.file);
    for (const p of problems) say(`${p.file}  (refused: ${p.error})`);
    audit(home, { actor, action: "list", result: "ok", count: entries.length });
    return 0;
  }

  const refused = (f) => problems.some((p) => p.file === f);
  const picked = positionals.length
    ? positionals
        .filter((f) => !refused(f))
        .map((f) => entries.find((e) => e.file === f || e.name === f) ?? { missing: f })
    : entries;
  if (o.name !== undefined && !NAME_RX.test(o.name)) {
    say("secrets-import: --name is not SCREAMING_SNAKE (not repeated here)");
    return 2;
  }
  if (o.name && picked.length !== 1) {
    say("secrets-import: --name needs exactly one inbox file");
    return 2;
  }
  const shown = problems.filter((p) => !positionals.length || positionals.includes(p.file));
  for (const p of shown) say(`${p.file}  refused: ${p.error}`);
  let failed = shown.length;
  if (!picked.length && !failed) say("secrets-import: inbox is empty");

  for (const e of picked) {
    if (e.missing) {
      // Only a NAME was typed; it is safe to repeat only when it looks like one.
      say(`${NAME_RX.test(e.missing) ? e.missing : "(file)"}  refused: not in the inbox`);
      failed++;
      continue;
    }
    let t = { name: o.name ?? e.name, env: "dev", path: "/agents" };
    const action = o["dry-run"] ? "dry-run" : "import";
    try {
      const side = readSidecar(inbox, e.name);
      t = checkTarget({
        name: t.name,
        env: o.env ?? side.env ?? t.env,
        path: o.path ?? side.path ?? t.path,
      });
      const read = readValue(join(inbox, e.file));
      const label = `${t.name}  ${t.env}:${t.path}`;
      if (o["dry-run"]) {
        const before = remoteHash(t, runner);
        say(
          `${label}  ok  would-overwrite: ${before === null ? "no" : before === read.hash ? "no (identical)" : "yes"}`,
        );
        if (isProd(t.env)) {
          const token = confirmToken(home, t, read.hash, now());
          say(`  production: ask the owner; on yes re-run with --confirm ${token} (valid 30 min)`);
        }
        audit(home, { actor, name: t.name, env: t.env, path: t.path, action, result: "ok" });
        continue;
      }
      const before = store(t, read, { confirm: o.confirm, home, runner, now, actor, inbox });
      audit(home, { actor, name: t.name, env: t.env, path: t.path, action, result: "ok" });
      unlinkSync(join(inbox, e.file));
      rmSync(join(inbox, e.name + SIDECAR), { force: true });
      const how = before === null ? "" : before === read.hash ? " (unchanged)" : " (overwritten)";
      say(`${label}  imported${how}; inbox file deleted`);
    } catch (error) {
      if (!(error instanceof Refusal)) throw error;
      failed++;
      say(`${t.name}  ${t.env}:${t.path}  refused: ${error.message}`);
      audit(home, {
        actor,
        name: t.name,
        env: t.env,
        path: t.path,
        action,
        result: "refused",
        reason: error.message,
      });
    }
  }
  return failed ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Remove the temp dir if a signal interrupts a write, then exit with the signal's code.
  for (const [sig, code] of [
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ])
    process.once(sig, () => {
      if (liveTemp) rmSync(liveTemp, { recursive: true, force: true });
      process.exit(code);
    });
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch {
    // An unexpected error's message or stack could carry file content; report nothing but the fact.
    process.stdout.write("secrets-import: internal error (no detail printed by design)\n");
    process.exitCode = 1;
  }
}
