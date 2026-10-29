#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm vault`, the vault-keeper's tool (ADR 0480, extending ADR 0257). Names in, names out:
 *     preflight --env e [--root dir]    every secret a deploy or a store release of `e` needs, by NAME and path:
 *                                       present, missing or placeholder, and where CI may read them (PLACEMENT).
 *                                       Exit 1 when any is missing or a placeholder.
 *     generate NAME --env e --path p    a random machine secret (--bytes 32, --encoding base64url|hex), written blind
 *              [--rotate]               into Infisical through secrets-import's core; --rotate replaces an existing
 *                                       one, without it an existing secret is refused. --dry-run first; for prod the
 *                                       dry run prints a one-time --confirm token (the owner's yes, as ADR 0257).
 * Boundary: the Infisical CLI (output captured, never inherited) and the runway and store files for the declared
 *   names. Third-party credentials (store keys, API tokens) are never generated here: they come through the inbox.
 * Runtime: node
 * Governing contract: ADR 0480; ADR 0257; ADR 0173.
 * Secrets: reads values only inside this process, to decide "present" and "placeholder"; prints, logs and passes on
 *   argv only names, paths and fixed words.
 */
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parse } from "yaml";
import { plan, readRunways } from "./runway.mjs";
import {
  ENVS,
  checkTarget,
  cliRunner,
  confirmToken,
  importSecret,
  isProd,
  remoteHash,
} from "./secrets-import.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const USAGE =
  "usage: pnpm vault preflight --env e [--root dir] | generate NAME --env e --path p [--rotate] [--bytes n] [--encoding base64url|hex] [--dry-run] [--confirm t]";
/** The store root kit (ADR 0480): one-time owner keys, read by runway-store.yml from this path. */
export const STORE_PATH = "/ci/store";
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

/** `{ name, path, why }` for every secret `env` needs: runway CI and member secrets, and the mobile apps' store secrets. */
export function declared(env, { root = ROOT } = {}) {
  const out = [];
  const runways = readRunways(root);
  if (runways.root.environments?.[RUNWAY_ENV[env]]) {
    const p = plan(RUNWAY_ENV[env], runways);
    const ci = runways.root.providers?.infisical?.paths?.ci ?? "/ci";
    for (const name of p.ci) out.push({ name, path: ci, why: "runway ci" });
    for (const s of p.sync.filter((x) => x.kind === "secret"))
      out.push({ name: s.name, path: s.path ?? ci, why: `runway ${s.member}` });
  }
  // Every mobile app the runway declares (ADR 0441): the root kit once, and each app's review secret names.
  const apps = Object.entries(runways.root.mobile ?? {});
  if (env === "prod" && apps.length)
    for (const name of STORE_KIT) out.push({ name, path: STORE_PATH, why: "store root kit" });
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
      if (name) out.push({ name, path: STORE_PATH, why: `store review ${app}` });
  }
  return out.filter((d, i) => out.findIndex((x) => x.name === d.name && x.path === d.path) === i);
}

/** Name → "present" | "placeholder" for one folder. The values are looked at here and dropped. */
export function inventory(env, path, runner = cliRunner) {
  const r = runner(["export", "--format=json", `--env=${env}`, `--path=${path}`, "--silent"]);
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
        if (!byPath.has(d.path)) byPath.set(d.path, inventory(o.env, d.path, runner));
        state = byPath.get(d.path).get(d.name) ?? "missing";
      } catch (error) {
        say(`vault: ${error.message}`);
        return 1;
      }
      if (state !== "present") bad++;
      say(`${state.padEnd(11)} ${d.name}  ${o.env}:${d.path}  (${d.why})`);
    }
    say(`preflight ${o.env}: ${need.length} declared, ${bad} missing or placeholder`);
    say(`placement: CI reads ${o.env} secrets ${PLACEMENT[o.env]}`);
    return bad ? 1 : 0;
  }

  if (cmd === "generate") {
    let t;
    try {
      t = checkTarget({ name, env: o.env, path: o.path ?? "/ci" });
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
    const label = `${t.name}  ${t.env}:${t.path}`;
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
        ["generate", t.name, t.env, t.path, o.rotate ? "rotate" : "create", bytes, o.encoding].join(
          "\n",
        ),
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
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch {
    process.stdout.write("vault: internal error (no detail printed by design)\n");
    process.exitCode = 1;
  }
}
