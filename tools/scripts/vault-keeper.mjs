#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm vault`, the vault-keeper's tool (ADR 0480, extending ADR 0257). Names in, names out:
 *     preflight --env e [--root dir]    every secret a deploy or a store release of `e` needs, by NAME and path:
 *                                       present, missing or placeholder, and where CI may read them (PLACEMENT).
 *                                       Exit 1 when any is missing or a placeholder.
 *     generate NAME --env e --path p    a random machine secret (--project P for a /ci path, ADR 0512) (--bytes 32, --encoding base64url|hex), written blind
 *              [--rotate]               into Infisical through the import core below; --rotate replaces an existing
 *                                       one, without it an existing secret is refused. --dry-run first; for prod the
 *                                       dry run prints a one-time --confirm token (the owner's yes, as ADR 0257).
 * Boundary: the Infisical CLI (output captured, never inherited) and the runway and store files for the declared
 *   names. Third-party credentials (store keys, API tokens) are never generated here: they come through the inbox.
 * Runtime: node
 * Governing contract: ADR 0480; ADR 0257; ADR 0173.
 * Secrets: reads values only inside this process, to decide "present" and "placeholder"; prints, logs and passes on
 *   argv only names, paths and fixed words.
 */
import { spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parse } from "yaml";
// The runway readers live in @stackra/runway (its `runway` binary); loaded from source, as plain Node strips the types
// (ADR 0421 decision 2), so this script needs no build (STA-1859).
import { deployPlan } from "../../packages/developer/runway/src/node/functions/deploy-plan.function.ts";
import { readRunways } from "../../packages/developer/runway/src/node/functions/read-runways.function.ts";
import {
  MAX_BYTES,
  TEMP_PREFIX,
  audit,
  auditLines,
  cleanStaleTemps,
  stateDir,
  toValue,
} from "./secrets-import.mjs";
import { NAME_RX, Refusal } from "./secrets-sops.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sha256 = (data) => createHash("sha256").update(data).digest("hex");

// --- Infisical (the vault-keeper is the last Infisical client in tools/scripts; secrets:import, secrets:generate and
// secrets:catalog cover the same ground on figentra/secrets, ADR 0525) ---------------------------------------------
export const TOKEN_TTL_MS = 30 * 60 * 1000;
export const ENVS = ["dev", "staging", "prod"];
// The vault layout (rules/secrets.md): /agents and /ci, plus sub-folders.
const PATH_RX = /^\/(?:agents|ci|runtime|box)(?:\/[a-z0-9-]+)*$/;
/** The projects a write may target (ADR 0512, one project per reader): slug → Infisical project id, not a secret. */
export const PROJECTS = {
  agents: "c008ea1e-c997-4d15-90b2-9eb75dcb0896",
  "ci-build": "0f940219-c073-4071-a1bf-1eacc725201a",
  "ci-deploy": "f9f11e24-e2e1-45bb-aa89-d98d14887fdd",
  registry: "6c1f114a-1247-407a-8ad5-51057c602f1a",
  flow: "86c297d4-ce42-4e94-b4b3-810a715812f2",
  stackra: "dd4724f4-7b9a-46ae-a899-b34af2d626b2",
  // One runtime project per product (`/runtime/<member>`); the slug is the product key.
  academorix: "b4a65c75-0127-4f73-baf6-3dd638a5e620",
  billing: "7898394a-7f4d-4ef5-95de-03badaf0ea69",
  commerce: "0aa24cb1-ba4f-4e8d-b0d3-9e4c5ddd3de0",
  invoicing: "28649a4f-9b29-4924-a590-ab63c603d812",
  juristra: "dbe78769-862b-4885-b4f2-d869538cab92",
  jute: "a0dbbbcf-84de-485e-b591-eb4e8d8cf4eb",
  mezzora: "c92ac0dd-01a6-489d-b323-75ed0bcc3d8d",
  organza: "8ed3df61-f708-4cc6-8d1c-d6b91989307c",
  os: "7871f337-a3f8-48df-a169-12ebc8c98d59",
  pay: "8edd11a5-fcd8-456f-9589-261db1302386",
  tamo: "90e28980-14fe-431f-85d8-75186bb1f43e",
  velora: "3c19ec55-1611-4b6c-96e5-e65dd1b3fda9",
};
export const isProd = (env) => /^prod(uction)?$/i.test(env);

/** Check a resolved target; returns it or throws a Refusal. */
export function checkTarget({ name, env, path, project }) {
  if (!NAME_RX.test(name)) throw new Refusal("name is not SCREAMING_SNAKE");
  if (!ENVS.includes(env)) throw new Refusal(`env must be one of ${ENVS.join(", ")}`);
  if (!PATH_RX.test(path))
    throw new Refusal("path must be /agents, /ci, /runtime or /box (or a sub-folder)");
  // `/agents` lives in the agents project; any other path exists in several projects, so it must say which.
  project ??= /^\/agents(?:\/|$)/.test(path) ? "agents" : undefined;
  if (!project)
    throw new Refusal(
      "a non-/agents target names its project (--project or the sidecar's project)",
    );
  if (!Object.hasOwn(PROJECTS, project))
    throw new Refusal(`project must be one of ${Object.keys(PROJECTS).join(", ")}`);
  return { name, env, path, project };
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

const scopeArgs = (t) => [
  `--projectId=${PROJECTS[t.project]}`,
  `--env=${t.env}`,
  `--path=${t.path}`,
  "--silent",
];

/** SHA-256 of the stored value, or null when the secret does not exist. Proves Infisical is reachable. */
export function remoteHash(t, runner) {
  const r = runner([
    "secrets",
    "get",
    t.name,
    ...scopeArgs(t),
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

let liveTemp;

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
    const r = runner(["secrets", "set", `${t.name}=@${file}`, ...scopeArgs(t), "--type=shared"]);
    if (r.status !== 0) throw cliFailure("write", r);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    liveTemp = undefined;
  }
}

/** Per-machine HMAC key, so a token reveals nothing about the value hash it binds. */
function confirmKey(home) {
  const p = join(stateDir(home), "secrets-confirm.key");
  if (!existsSync(p)) writeFileSync(p, randomBytes(32), { mode: 0o600, flag: "wx" });
  return readFileSync(p);
}

/** One-time token binding name, project, env, path, value hash and issue time. */
export function confirmToken(home, t, hash, now = Date.now()) {
  const issued = Math.floor(now / 1000).toString(36);
  const mac = createHmac("sha256", confirmKey(home))
    .update([t.name, t.project, t.env, t.path, hash, issued].join("\n"))
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
    return "confirm token does not match this name, project, env, path and file";
  if (auditLines(home).some((l) => l.confirm === token && l.action === "confirm-used"))
    return "confirm token already used";
  return null;
}

/**
 * The import core: production confirmation, write, read-back verification. Returns the hash that was
 * there before (null = new). Throws a Refusal; never returns or prints the value.
 */
function store(t, { value, hash }, { confirm, bindHash, home, runner, now, actor, inbox }) {
  if (isProd(t.env)) {
    // A generated value has no hash before its dry run; vault-keeper binds the token to the operation instead.
    const why = checkConfirm(home, confirm, t, bindHash ?? hash, now());
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
 * Programmatic entry (a future local request page, vault-keeper): stream a value straight into Infisical.
 * Returns only { name, ok, reason }; the reason is a fixed, value-free string. `bindHash` replaces the value hash
 * the production token is checked against (a generated value is unknown at its dry run).
 */
export async function importSecret({
  name,
  project,
  env = "dev",
  path = "/agents",
  valueStream,
  actor = "unknown",
  confirm,
  bindHash,
  home = homedir(),
  runner = cliRunner,
  now = Date.now,
}) {
  const label = NAME_RX.test(String(name)) ? name : "(invalid name)";
  const inbox = join(home, "Secrets-inbox");
  try {
    // The temp value file goes inside the inbox: refuse one that is a symlink or not a folder.
    const st = lstatSync(inbox, { throwIfNoEntry: false });
    if (st && (st.isSymbolicLink() || !st.isDirectory()))
      throw new Refusal("inbox is not a real directory");
    cleanStaleTemps(inbox);
    const t = checkTarget({ name, env, path, project });
    store(t, await readStream(valueStream), { confirm, bindHash, home, runner, now, actor, inbox });
    audit(home, { actor, name, project: t.project, env, path, action: "import", result: "ok" });
    return { name: label, ok: true };
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    audit(home, {
      actor,
      name: label,
      project,
      env,
      path,
      action: "import",
      result: "refused",
      reason: error.message,
    });
    return { name: label, ok: false, reason: error.message };
  }
}

const USAGE =
  "usage: pnpm vault preflight --env e [--root dir] | generate NAME --env e --path p [--project P] [--rotate] [--bytes n] [--encoding base64url|hex] [--dry-run] [--confirm t]";
/** The store root kit (ADR 0480): one-time owner keys, read by runway-store.yml from this project and path. */
export const STORE_PROJECT = "ci-deploy";
export const STORE_PATH = "/ci/store";
/** The build tokens every CI job reads from ci-build (ADR 0512); any other CI name is a deploy credential. */
const BUILD_TOKENS = {
  UNIWIND_AUTH_TOKEN: "/ci",
  STACKRA_REGISTRY_TOKEN: "/ci/registry",
  TURBO_API: "/ci/turbo",
  TURBO_TEAM: "/ci/turbo",
  TURBO_TOKEN: "/ci/turbo",
  TURBO_REMOTE_CACHE_SIGNATURE_KEY: "/ci/turbo",
};
/** `{ project, path }` of a runway CI name: ci-build for the build tokens, ci-deploy `/ci` otherwise. */
export const ciHome = (name) =>
  Object.hasOwn(BUILD_TOKENS, name)
    ? { project: "ci-build", path: BUILD_TOKENS[name] }
    : { project: "ci-deploy", path: "/ci" };
export const STORE_KIT = [
  "ASC_API_KEY_ID",
  "ASC_API_ISSUER_ID",
  "ASC_API_PRIVATE_KEY",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
  "EXPO_TOKEN",
];
const PLACEHOLDER =
  /^(?:placeholder|changeme|change-me|todo|tbd|xxx+|dummy|fake|test|none|null|-)$/i;
const RUNWAY_ENV = { dev: "dev", staging: "staging", prod: "production" };
/**
 * Where a CI job may read each environment's secrets (owner decision 2026-10-29): production secrets (the Cloudflare
 * token, the store and signing keys, production API keys) only in each repository's `production` GitHub environment,
 * never repository-wide, through an Infisical identity that trusts only `environment:production`. stackra-pro's
 * publish credentials sit in its `release` environment instead.
 */
export const PLACEMENT = {
  dev: "repository-wide or in a dev environment",
  staging: "repository-wide or in a staging environment",
  prod: "only in the GitHub environment `production`",
};

/** `{ name, project, path, why }` for every secret `env` needs: runway CI and member secrets, and the mobile apps' store secrets. */
export function declared(env, { root = ROOT } = {}) {
  const out = [];
  const runways = readRunways(root);
  if (runways.root.environments?.[RUNWAY_ENV[env]]) {
    const p = deployPlan(RUNWAY_ENV[env], runways);
    for (const name of p.ci) out.push({ name, ...ciHome(name), why: "runway ci" });
    // shortcut: runtime secrets carry no project until runway sync binds the product's project (STA-606).
    for (const s of p.sync.filter((x) => x.kind === "secret"))
      out.push({
        name: s.name,
        project: null,
        path: s.path ?? "/runtime",
        why: `runway ${s.member}`,
      });
  }
  // Every mobile app the runway declares (ADR 0441): the root kit once, and each app's review secret names.
  const apps = Object.entries(runways.root.mobile ?? {});
  if (env === "prod" && apps.length)
    for (const name of STORE_KIT)
      out.push({ name, project: STORE_PROJECT, path: STORE_PATH, why: "store root kit" });
  for (const [app, entry] of env === "prod" ? apps : []) {
    const file = entry.store && join(root, entry.store, "store.yaml");
    const r = file && existsSync(file) ? (parse(readFileSync(file, "utf8"))?.review ?? {}) : {};
    for (const name of [
      r.demoAccount?.usernameSecret,
      r.demoAccount?.passwordSecret,
      r.contact?.emailSecret,
      r.contact?.phoneSecret,
      r.seed?.tokenSecret,
    ])
      if (name)
        out.push({ name, project: STORE_PROJECT, path: STORE_PATH, why: `store review ${app}` });
  }
  return out.filter(
    (d, i) =>
      out.findIndex((x) => x.name === d.name && x.project === d.project && x.path === d.path) === i,
  );
}

/** Name → "present" | "placeholder" for one folder. The values are looked at here and dropped. */
export function inventory(env, path, runner = cliRunner, project = null) {
  const scope = project ? [`--projectId=${PROJECTS[project]}`] : [];
  const r = runner([
    "export",
    "--format=json",
    ...scope,
    `--env=${env}`,
    `--path=${path}`,
    "--silent",
  ]);
  if (r.status !== 0)
    throw new Error(`cannot read ${env}:${path} (infisical exited ${r.status}; logged in?)`);
  let rows;
  try {
    rows = JSON.parse(r.stdout);
  } catch {
    throw new Error(`unexpected infisical output for ${env}:${path}`);
  }
  const state = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const value = String(row?.value ?? row?.secretValue ?? "").trim();
    state.set(
      row?.key ?? row?.secretKey,
      value === "" || PLACEHOLDER.test(value) ? "placeholder" : "present",
    );
  }
  return state;
}

/** Runs the command; returns the exit code. Tests inject `runner`, `home`, `root` and `write`. */
export async function main(
  argv,
  {
    runner = cliRunner,
    home = homedir(),
    root = ROOT,
    now = Date.now,
    write = (s) => process.stdout.write(s),
  } = {},
) {
  const say = (s) => write(`${s}\n`);
  let args;
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        project: { type: "string" },
        env: { type: "string" },
        path: { type: "string" },
        root: { type: "string" },
        bytes: { type: "string", default: "32" },
        encoding: { type: "string", default: "base64url" },
        rotate: { type: "boolean" },
        "dry-run": { type: "boolean" },
        confirm: { type: "string" },
      },
    });
  } catch {
    say(USAGE); // parseArgs would echo the offending argument; never repeat it
    return 2;
  }
  const {
    values: o,
    positionals: [cmd, name],
  } = args;
  if (!ENVS.includes(o.env)) {
    say(`vault: --env must be one of ${ENVS.join(", ")}`);
    return 2;
  }

  if (cmd === "preflight") {
    const need = declared(o.env, { root: o.root ? resolve(o.root) : root });
    const byPath = new Map();
    let bad = 0;
    for (const d of need) {
      let state;
      try {
        const key = `${d.project}:${d.path}`;
        if (!byPath.has(key)) byPath.set(key, inventory(o.env, d.path, runner, d.project));
        state = byPath.get(key).get(d.name) ?? "missing";
      } catch (error) {
        say(`vault: ${error.message}`);
        return 1;
      }
      if (state !== "present") bad++;
      say(
        `${state.padEnd(11)} ${d.name}  ${o.env}:${d.path}  (${d.why})  [${d.project ?? "product"}]`,
      );
    }
    say(`preflight ${o.env}: ${need.length} declared, ${bad} missing or placeholder`);
    say(`placement: CI reads ${o.env} secrets ${PLACEMENT[o.env]}`);
    return bad ? 1 : 0;
  }

  if (cmd === "generate") {
    let t;
    try {
      t = checkTarget({ name, env: o.env, path: o.path ?? "/ci", project: o.project });
    } catch (error) {
      say(`vault: ${error.message}`);
      return 2;
    }
    const bytes = Number(o.bytes);
    if (
      !Number.isInteger(bytes) ||
      bytes < 16 ||
      bytes > 128 ||
      !["base64url", "hex"].includes(o.encoding)
    ) {
      say("vault: --bytes is 16 to 128 and --encoding base64url or hex");
      return 2;
    }
    const label = `${t.name}  ${t.project}/${t.env}:${t.path}`;
    let exists;
    try {
      exists = remoteHash(t, runner) !== null;
    } catch (error) {
      say(`${label}  refused: ${error.message}`);
      return 1;
    }
    if (exists && !o.rotate) {
      say(`${label}  refused: exists; pass --rotate to replace it`);
      return 1;
    }
    if (!exists && o.rotate) {
      say(`${label}  refused: nothing to rotate`);
      return 1;
    }
    const intent = createHash("sha256")
      .update(
        [
          "generate",
          t.name,
          t.project,
          t.env,
          t.path,
          o.rotate ? "rotate" : "create",
          bytes,
          o.encoding,
        ].join("\n"),
      )
      .digest("hex");
    if (o["dry-run"]) {
      say(`${label}  ok  would-${o.rotate ? "rotate" : "create"}`);
      if (isProd(t.env))
        say(
          `  production: ask the owner; on yes re-run with --confirm ${confirmToken(home, t, intent, now())} (valid 30 min)`,
        );
      return 0;
    }
    const value = randomBytes(bytes).toString(o.encoding);
    const r = await importSecret({
      ...t,
      valueStream: Readable.from([Buffer.from(value)]),
      actor: "vault-keeper",
      confirm: o.confirm,
      bindHash: intent,
      home,
      runner,
      now,
    });
    say(r.ok ? `${label}  ${o.rotate ? "rotated" : "created"}` : `${label}  refused: ${r.reason}`);
    return r.ok ? 0 : 1;
  }

  say(USAGE);
  return 2;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Remove the temp dir if a signal interrupts a write, then exit with the signal's code.
  for (const [sig, code] of [
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ])
    // oxlint-disable-next-line no-loop-func -- reason: the handler must read the live `liveTemp` when the signal arrives
    process.once(sig, () => {
      if (liveTemp) rmSync(liveTemp, { recursive: true, force: true });
      process.exit(code);
    });
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch {
    process.stdout.write("vault: internal error (no detail printed by design)\n");
    process.exitCode = 1;
  }
}
