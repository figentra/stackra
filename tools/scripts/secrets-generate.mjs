#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm secrets:generate NAME --scope S` (ADR 0525 kind (a), "generated"): a random machine secret, such as a
 *   webhook or signing secret, made in memory and written encrypted into `figentra/secrets` through a self-merging
 *   pull request. No human sees it. `--rotate` replaces an existing one; without it an existing name is refused.
 * Boundary: `node:crypto` for the value and `secrets-sops.mjs` `publish` for the write. Third-party credentials (store
 *   keys, API tokens) are never generated here: they are minted (kind (b)) or put (kind (c)).
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0257; ADR 0480 (the vault keeper's generate, now writing sops).
 * Input: NAME, `--scope <scope>`, `--bytes <16..128>` (default 32), `--encoding base64url|hex` (default base64url),
 *   `--rotate`, `--actor <agent>`; or `--missing [--dry-run]`: every `kind: generated` catalog name with no file in
 *   one of its `scopes`, in one pull request (`generator: vapid` makes a Web Push key pair; `generator: ed25519`
 *   a signing key, printing only its public half and key id). NAME takes its catalog entry's generator: an ed25519
 *   name (with `--rotate`, a rotation) is a new pair whose public half and day-dated key id are printed; a vapid name
 *   is refused (its halves rotate together through `--missing`).
 * Output: one line with the name, the scope, "added" or "rotated" and the pull request URL; exit 1 on a refusal.
 * Secrets: the value exists only in this process and on sops' stdin; it is never printed, logged or on argv.
 */
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { audit } from "./secrets-import.mjs";
import { parse } from "yaml";
import {
  Refusal,
  SECRETS_REPO,
  checkTarget,
  cliFailure,
  cliRunner,
  isAgentRun,
  listNames,
  publish,
} from "./secrets-sops.mjs";

export const ENCODINGS = ["base64url", "hex"];

/** A random value of `bytes` bytes in `encoding`; throws a Refusal on a bad size or encoding. */
export function generateValue(bytes = 32, encoding = "base64url") {
  if (!Number.isInteger(bytes) || bytes < 16 || bytes > 128)
    throw new Refusal("--bytes must be an integer from 16 to 128");
  if (!ENCODINGS.includes(encoding))
    throw new Refusal(`--encoding must be one of ${ENCODINGS.join(", ")}`);
  return Buffer.from(randomBytes(bytes).toString(encoding), "utf8");
}

/** A Web Push (VAPID) pair: the public key is the uncompressed P-256 point, the private key is `d`, both base64url. */
export function vapidPair() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pub = publicKey.export({ format: "jwk" });
  const point = Buffer.concat([
    Buffer.from([4]),
    Buffer.from(pub.x, "base64url"),
    Buffer.from(pub.y, "base64url"),
  ]);
  return {
    publicKey: Buffer.from(point.toString("base64url"), "utf8"),
    privateKey: Buffer.from(privateKey.export({ format: "jwk" }).d, "utf8"),
  };
}

/**
 * An Ed25519 signing pair: the private key as PKCS#8 DER (Web Crypto `importKey("pkcs8", …, "Ed25519")`), the public
 * key as its raw 32 bytes; both base64url. The public half is not secret.
 */
export function ed25519Pair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    privateKey: Buffer.from(
      privateKey.export({ format: "der", type: "pkcs8" }).toString("base64url"),
      "utf8",
    ),
    publicKey: publicKey.export({ format: "jwk" }).x,
  };
}

/**
 * `<keyIdPrefix or the scope's product>-<env>-<yyyymm>`, kebab-case: the key id a producer's `events.keys` names. A
 * rotation (`day`) takes `<yyyymmdd>`, so the new key never shares the id of the one it replaces, which a producer
 * keeps listed until its consumers move.
 */
export const keyIdFor = (scope, prefix, now = new Date(), { day = false } = {}) => {
  const parts = scope.split("/");
  const owner = prefix ?? (parts[0] === "products" ? parts[1] : parts.slice(0, -1).join("-"));
  return `${owner}-${parts.at(-1)}-${now
    .toISOString()
    .slice(0, day ? 10 : 7)
    .replaceAll("-", "")}`;
};

/**
 * The `kind: generated` values `catalog.yaml` asks for that have no file yet: `[{ scope, name, value }]`. An entry's
 * `scopes` say where it belongs; `bytes` and `encoding` shape a random value; `generator: ed25519` stores a signing
 * key and returns its public half and key id in `public` (optional `keyIdPrefix`); `generator: vapid` makes the
 * `<PREFIX>_PUBLIC_KEY` and `<PREFIX>_PRIVATE_KEY` pair together. Never replaces an existing file.
 */
export function missingEntries(
  catalog,
  files,
  make = { random: generateValue, vapid: vapidPair, ed25519: ed25519Pair, now: () => new Date() },
) {
  const have = new Set(files.map((f) => `${f.scope}/${f.name}`));
  const out = [];
  for (const [name, e] of Object.entries(catalog ?? {})) {
    if (e?.kind !== "generated") continue;
    for (const scope of e.scopes ?? []) {
      const key = `${scope}/${name}`;
      if (have.has(key)) continue;
      if (e.generator === "vapid") {
        const m = /^(.+)_(?:PUBLIC|PRIVATE)_KEY$/.exec(name);
        if (!m) throw new Refusal(`${name}: a vapid name ends in _PUBLIC_KEY or _PRIVATE_KEY`);
        const pair = [`${m[1]}_PUBLIC_KEY`, `${m[1]}_PRIVATE_KEY`];
        if (pair.some((n) => catalog[n]?.generator !== "vapid"))
          throw new Refusal(`${m[1]}: both halves need generator: vapid`);
        if (pair.some((n) => have.has(`${scope}/${n}`)))
          throw new Refusal(`${scope}: one half of ${m[1]} exists; rotate the pair together`);
        const v = make.vapid();
        out.push(
          { scope, name: pair[0], value: v.publicKey },
          { scope, name: pair[1], value: v.privateKey },
        );
        pair.forEach((n) => have.add(`${scope}/${n}`));
      } else if (e.generator === "ed25519") {
        const k = make.ed25519();
        out.push({
          scope,
          name,
          value: k.privateKey,
          public: { key: k.publicKey, keyId: keyIdFor(scope, e.keyIdPrefix, make.now()) },
        });
        have.add(key);
      } else if (e.generator === undefined || e.generator === "random") {
        out.push({ scope, name, value: make.random(e.bytes ?? 32, e.encoding ?? "base64url") });
        have.add(key);
      } else throw new Refusal(`${name}: unknown generator`);
    }
  }
  return out;
}

/** The catalog and the file names of `figentra/secrets`, from a shallow clone removed before it returns. */
function readSecretsRepo(run) {
  const clone = mkdtempSync(join(tmpdir(), "figentra-secrets-read-"));
  try {
    const r = run("gh", ["repo", "clone", SECRETS_REPO, clone, "--", "--depth", "1"]);
    if (r.status !== 0) throw cliFailure("clone", "gh", r);
    const file = join(clone, "catalog.yaml");
    return {
      catalog: existsSync(file) ? (parse(readFileSync(file, "utf8")) ?? {}) : {},
      files: listNames(clone),
    };
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
}

/** `--missing`: read the catalog and files from a shallow clone, then write every missing value in one PR. */
function generateMissing({ dryRun, actor, home, run = cliRunner, env, say }) {
  const { catalog, files } = readSecretsRepo(run);
  const entries = missingEntries(catalog, files).map((e) => ({
    ...checkTarget(e, { agent: isAgentRun(env) }),
    value: e.value,
    public: e.public,
  }));
  if (!entries.length) {
    say("secrets-generate: nothing missing");
    return 0;
  }
  if (dryRun) {
    for (const e of entries) say(`${e.name}  ${e.scope}  would add`);
    return 0;
  }
  const { url } = publish(entries, {
    actor,
    run,
    replace: false,
    title: `secrets: generate ${entries.length} missing values`,
  });
  for (const e of entries) {
    audit(home, { actor, name: e.name, scope: e.scope, action: "generate", result: "ok" });
    say(`${e.name}  ${e.scope}  added  ${url}`);
    // The public half only (not secret), for the producer's runway.yaml `events.keys`.
    if (e.public) say(`  public key ${e.public.key}  key id ${e.public.keyId}`);
  }
  return 0;
}

/** Generate one secret; returns the exit code. Tests pass `home`, `run` and `env`. */
export function main(
  argv,
  { home = homedir(), run, env = process.env, write = (s) => process.stdout.write(s) } = {},
) {
  const say = (s) => write(`${s}\n`);
  let args;
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        scope: { type: "string" },
        bytes: { type: "string" },
        encoding: { type: "string" },
        rotate: { type: "boolean" },
        actor: { type: "string" },
        missing: { type: "boolean" },
        "dry-run": { type: "boolean" },
      },
    });
  } catch {
    say("secrets-generate: unknown flag");
    return 2;
  }
  const { values: o, positionals } = args;
  if (o.missing && !positionals.length)
    try {
      return generateMissing({
        dryRun: o["dry-run"],
        actor: o.actor ?? env.STACKRA_AGENT ?? "owner",
        home,
        run,
        env,
        say,
      });
    } catch (error) {
      if (!(error instanceof Refusal)) throw error;
      say(`secrets-generate: refused: ${error.message}`);
      return 1;
    }
  if (positionals.length !== 1) {
    say(
      "usage: pnpm secrets:generate NAME --scope <scope> [--bytes 32] [--encoding base64url|hex] [--rotate]\n" +
        "       pnpm secrets:generate --missing [--dry-run]",
    );
    return 2;
  }
  const actor = o.actor ?? env.STACKRA_AGENT ?? "owner";
  const action = o.rotate ? "rotate" : "generate";
  let label = "(invalid name)";
  try {
    const t = checkTarget({ scope: o.scope, name: positionals[0] }, { agent: isAgentRun(env) });
    label = `${t.name}  ${t.scope}`;
    // The catalog's generator decides the shape: a signing key is never replaced by a random value.
    const entry = readSecretsRepo(run ?? cliRunner).catalog[t.name];
    if (entry?.generator === "vapid")
      throw new Refusal(
        "a VAPID pair rotates both halves together: remove both, then run --missing",
      );
    let value;
    let signing;
    if (entry?.generator === "ed25519") {
      if (o.bytes !== undefined || o.encoding !== undefined)
        throw new Refusal("an ed25519 key takes no --bytes or --encoding");
      const k = ed25519Pair();
      value = k.privateKey;
      signing = {
        key: k.publicKey,
        keyId: keyIdFor(t.scope, entry.keyIdPrefix, new Date(), { day: Boolean(o.rotate) }),
      };
    } else
      value = generateValue(
        o.bytes === undefined ? 32 : Number(o.bytes),
        o.encoding ?? "base64url",
      );
    const { written, url } = publish([{ ...t, value }], {
      actor,
      run,
      replace: Boolean(o.rotate),
      title: `secrets: ${action} ${t.scope}/${t.name}`,
    });
    audit(home, { actor, name: t.name, scope: t.scope, action, result: "ok" });
    say(`${label}  ${written[0].replaced ? "rotated" : "added"}  ${url}`);
    // The public half only (not secret): list it first in the producer's `events.keys`, keeping the old key until
    // its consumers move.
    if (signing) say(`  public key ${signing.key}  key id ${signing.keyId}`);
    return 0;
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    audit(home, {
      actor,
      name: label,
      scope: o.scope,
      action,
      result: "refused",
      reason: error.message,
    });
    say(`${label}  refused: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch {
    process.stdout.write("secrets-generate: internal error (no detail printed by design)\n");
    process.exitCode = 1;
  }
}
