#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: move secret values a human dropped into ~/Secrets-inbox/ into `figentra/secrets` as SOPS files (ADR 0525)
 *   without any value ever reaching stdout, stderr, argv, the audit log or the caller (`pnpm secrets:import`,
 *   ADR 0257). The files go through one self-merging pull request; each inbox file is deleted once it is open, and
 *   kept on a refusal.
 * Boundary: the inbox, `secrets-sops.mjs` (sops on stdin, git and gh) and the audit line only; no value leaves this
 *   process.
 * Runtime: node
 * Governing contract: ADR 0257 (secret manager agent and the secrets inbox); ADR 0525 (SOPS replaces Infisical).
 * Input: files directly in $HOME/Secrets-inbox/ (file name = secret name, one extension stripped) with `--scope`, or
 *   scope-shaped folders under it with `--tree`; flags --scope --tree --name --dry-run --list --actor.
 * Output: one line per secret NAME with its scope and a value-free result; exit 1 when any secret failed.
 * Secrets: reads values; never prints, logs or passes one on argv. sops gets each value on stdin. Safe for any
 *   caller: hooks cannot tell agents apart, so the script is the boundary, and an agent never writes a gate,
 *   registry or infra scope (`AGENT_DENIED_SCOPES`).
 *
 * Usage:
 *   pnpm secrets:import --scope <scope> [FILE…] [--name N]   # into figentra/secrets, names only in the output
 *   pnpm secrets:import --tree [--dry-run]                   # every <scope>/<NAME> folder file, one pull request
 *   pnpm secrets:import --list                               # inbox file NAMES, nothing else
 *   pnpm secrets:import --scope <scope> --dry-run [FILE…]    # validate names and scope, write nothing
 */
import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  rmdirSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  NAME_RX,
  Refusal,
  checkTarget as checkSopsTarget,
  isAgentRun,
  publish as publishSops,
} from "./secrets-sops.mjs";

export const MAX_BYTES = 64 * 1024;
const SIDECAR = ".target.yaml";
const sha256 = (data) => createHash("sha256").update(data).digest("hex");

const NOT_A_DIRECTORY = "inbox is not a real directory";

/** The inbox entries: secret files to import, and value-free problems. Never opens a file. */
export function scanInbox(inbox) {
  const st = lstatSync(inbox, { throwIfNoEntry: false });
  if (!st) return { entries: [], problems: [{ file: inbox, error: "inbox does not exist" }] };
  if (st.isSymbolicLink() || !st.isDirectory())
    return { entries: [], problems: [{ file: inbox, error: NOT_A_DIRECTORY }] };
  const entries = [];
  const problems = [];
  for (const file of readdirSync(inbox).toSorted()) {
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

/** Raw bytes → { value, hash }: UTF-8, no NUL, one trailing newline stripped (editors add it), not empty. */
export function toValue(buf) {
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

/** The prefix of a temp dir a value write leaves in the inbox (vault-keeper's Infisical write). */
export const TEMP_PREFIX = ".import-";

/** Remove temp dirs a killed run left behind (dot-entries, so --list and imports skip them). */
export function cleanStaleTemps(inbox) {
  if (!lstatSync(inbox, { throwIfNoEntry: false })?.isDirectory()) return; // absent, or a symlink

  for (const f of readdirSync(inbox))
    if (f.startsWith(TEMP_PREFIX)) rmSync(join(inbox, f), { recursive: true, force: true });
}

/** ~/.stackra, created or tightened to 0700. */
export function stateDir(home) {
  const dir = join(home, ".stackra");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  return dir;
}

// --- audit ------------------------------------------------------------------------------------------
const auditPath = (home) => join(home, ".stackra", "secrets-audit.log");
export function auditLines(home) {
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
export function audit(home, entry) {
  stateDir(home);
  appendFileSync(
    auditPath(home),
    JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n",
    {
      mode: 0o600,
    },
  );
}

// --- main -------------------------------------------------------------------------------------------
/** Runs the command; returns the exit code. `home` decides the inbox and the audit log (tests pass a temp dir). */
export function main(
  argv,
  { home = homedir(), write = (s) => process.stdout.write(s), env = process.env, sopsRun } = {},
) {
  // Strip control characters: a crafted file name must not drive the terminal.
  // oxlint-disable-next-line no-control-regex -- matching control characters is the point
  const say = (s) => write(s.replaceAll(/[\u0000-\u001f\u007f-\u009f]/g, "?") + "\n");
  let args;
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        "dry-run": { type: "boolean" },
        list: { type: "boolean" },
        name: { type: "string" },
        actor: { type: "string" },
        scope: { type: "string" },
        tree: { type: "boolean" },
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
  if (o.tree)
    return importTree(inbox, { dryRun: o["dry-run"], actor, home, say, run: sopsRun, env });
  const { entries, problems } = scanInbox(inbox);

  if (o.list) {
    for (const e of entries) say(e.file);
    for (const p of problems) say(`${p.file}  (refused: ${p.error})`);
    // A missing inbox is just empty; one that is a symlink or not a folder is refused, and that is a failure.
    const refused = problems.some((p) => p.file === inbox && p.error === NOT_A_DIRECTORY);
    audit(home, {
      actor,
      action: "list",
      result: refused ? "refused" : "ok",
      count: entries.length,
    });
    return refused ? 1 : 0;
  }
  if (o.scope === undefined) {
    say("secrets-import: --scope <scope> or --tree is required (figentra/secrets, ADR 0525)");
    return 2;
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
  const failed = shown.length;
  if (!picked.length && !failed) say("secrets-import: inbox is empty");

  return importToSops(picked, {
    scope: o.scope,
    name: o.name,
    dryRun: o["dry-run"],
    actor,
    home,
    inbox,
    say,
    run: sopsRun,
    env,
    failed,
  });
}

/**
 * `--scope`: the picked inbox files go to `figentra/secrets` in one self-merging pull request (ADR 0525). The inbox
 * file and its sidecar are deleted only after the pull request is open. Returns the exit code.
 */
function importToSops(
  picked,
  { scope: toScope, name, dryRun, actor, home, inbox, say, run, env, failed },
) {
  const entries = [];
  for (const e of picked) {
    if (e.missing) {
      say(`${NAME_RX.test(e.missing) ? e.missing : "(file)"}  refused: not in the inbox`);
      failed++;
      continue;
    }
    try {
      const t = checkSopsTarget(
        { scope: toScope, name: name ?? e.name },
        { agent: isAgentRun(env) },
      );
      entries.push({
        ...t,
        value: readValue(join(inbox, e.file)).value,
        file: e.file,
        stem: e.name,
      });
    } catch (error) {
      if (!(error instanceof Refusal)) throw error;
      failed++;
      say(`${NAME_RX.test(e.name) ? e.name : "(file)"}  ${toScope}  refused: ${error.message}`);
    }
  }
  if (dryRun) {
    for (const e of entries) say(`${e.name}  ${e.scope}  ok (dry run, nothing written)`);
    return failed ? 1 : 0;
  }
  if (!entries.length) return failed ? 1 : 0;
  try {
    const { written, url } = publishSops(entries, { actor, run });
    for (const [i, e] of entries.entries()) {
      unlinkSync(join(inbox, e.file));
      rmSync(join(inbox, e.stem + SIDECAR), { force: true });
      audit(home, { actor, name: e.name, scope: e.scope, action: "import-sops", result: "ok" });
      say(
        `${e.name}  ${e.scope}  ${written[i].replaced ? "replaced" : "added"}; inbox file deleted  ${url}`,
      );
    }
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    failed += entries.length;
    for (const e of entries) {
      audit(home, {
        actor,
        name: e.name,
        scope: e.scope,
        action: "import-sops",
        result: "refused",
        reason: error.message,
      });
      say(`${e.name}  ${e.scope}  refused: ${error.message}`);
    }
  }
  return failed ? 1 : 0;
}

/**
 * The inbox's scope-shaped folders (`--tree`): `<scope>/<NAME>[.ext]` → `{ file, name, scope }`, and value-free
 * problems. Files directly in the inbox belong to the flat modes and are skipped. Never opens a file.
 */
export function scanTree(inbox) {
  const entries = [];
  const problems = [];
  const st = lstatSync(inbox, { throwIfNoEntry: false });
  if (!st || st.isSymbolicLink() || !st.isDirectory())
    return { entries, problems: [{ file: inbox, error: NOT_A_DIRECTORY }] };
  const walk = (rel, depth) => {
    for (const f of readdirSync(join(inbox, rel)).toSorted()) {
      if (f.startsWith(".") || f.endsWith(SIDECAR)) continue;
      const file = rel ? `${rel}/${f}` : f;
      const s = lstatSync(join(inbox, file));
      if (s.isSymbolicLink()) problems.push({ file, error: "symlink refused" });
      else if (s.isDirectory()) {
        if (depth < 6) walk(file, depth + 1);
        else problems.push({ file, error: "folders nested too deep" });
      } else if (!rel) continue;
      else if (!s.isFile()) problems.push({ file, error: "not a regular file" });
      else if (s.size > MAX_BYTES) problems.push({ file, error: `larger than ${MAX_BYTES} bytes` });
      else entries.push({ file, name: f.replace(/\.[^.]*$/, ""), scope: rel });
    }
  };
  walk("", 0);
  return { entries, problems };
}

/**
 * `--tree`: every file under a scope-shaped folder goes to that scope, all in one pull request. Each file is deleted
 * once the pull request is open, then any folder left empty. Returns the exit code; prints names and scopes only.
 */
function importTree(inbox, { dryRun, actor, home, say, run, env }) {
  const { entries: found, problems } = scanTree(inbox);
  let failed = problems.length;
  for (const p of problems) say(`${p.file}  refused: ${p.error}`);
  const entries = [];
  for (const e of found)
    try {
      const t = checkSopsTarget({ scope: e.scope, name: e.name }, { agent: isAgentRun(env) });
      entries.push({ ...t, file: e.file, value: readValue(join(inbox, e.file)).value });
    } catch (error) {
      if (!(error instanceof Refusal)) throw error;
      failed++;
      say(`${NAME_RX.test(e.name) ? e.name : "(file)"}  (folder)  refused: ${error.message}`);
    }
  if (!found.length && !failed) say("secrets-import: no scope folders in the inbox");
  if (dryRun) for (const e of entries) say(`${e.name}  ${e.scope}  ok (dry run, nothing written)`);
  if (failed && !dryRun) say("secrets-import: nothing written; fix the refusals first");
  if (dryRun || failed) return failed ? 1 : 0;
  if (!entries.length) return 0;
  try {
    const { written, url } = publishSops(entries, {
      actor,
      run,
      title: `secrets: import ${entries.length} names from the inbox tree`,
    });
    for (const [i, e] of entries.entries()) {
      unlinkSync(join(inbox, e.file));
      audit(home, { actor, name: e.name, scope: e.scope, action: "import-tree", result: "ok" });
      say(`${e.name}  ${e.scope}  ${written[i].replaced ? "replaced" : "added"}  ${url}`);
    }
    for (const dir of [...new Set(entries.map((e) => e.scope))].toSorted().toReversed())
      for (let d = dir; d && d !== "."; d = dirname(d)) {
        if (readdirSync(join(inbox, d)).length) break;
        rmdirSync(join(inbox, d));
      }
    say(`secrets-import: ${entries.length} imported; inbox files deleted`);
    return 0;
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    for (const e of entries)
      audit(home, {
        actor,
        name: e.name,
        scope: e.scope,
        action: "import-tree",
        result: "refused",
        reason: error.message,
      });
    say(`secrets-import: refused: ${error.message} (nothing deleted)`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch {
    // An unexpected error's message or stack could carry file content; report nothing but the fact.
    process.stdout.write("secrets-import: internal error (no detail printed by design)\n");
    process.exitCode = 1;
  }
}
