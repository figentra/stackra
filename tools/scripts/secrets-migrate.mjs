#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm secrets:migrate` (ADR 0525, plan phase P3): move every Infisical value into `figentra/secrets`, one
 *   SOPS file per secret, in one self-merging pull request. Names map one to one; the pull request carries
 *   `migration/hashes.yaml` (each name's 8-hex SHA-256 prefix, ADR 0173's limit), which a CI job with decrypt rights
 *   compares against the files. Infisical is not changed.
 * Boundary: the Infisical REST API under the owner's own login (`infisical user get token`, captured, never printed)
 *   and `secrets-sops.mjs` `publish`. `--plan` reads names only; `--write` reads values into memory.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0257 (nobody reads a value).
 * Input: `--plan` (default) or `--write`; `--domain <url>` (default https://eu.infisical.com).
 * Output: names, scopes and counts: per scope how many names, plus every unmapped, excluded, conflicting and empty
 *   source by name. Exit 1 when anything is unmapped or in conflict, so nothing is dropped silently; an exclusion is a
 *   recorded decision (PLACED, NOT_SECRETS, excludedReason) and does not block.
 * Secrets: values exist only in this process and on sops' stdin; the token is sent in a header, never on argv.
 */
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { stringify } from "yaml";
import { audit } from "./secrets-import.mjs";
import { Refusal, cliFailure, cliRunner, isAgentRun, publish, shortHash } from "./secrets-sops.mjs";

const CI_PROJECTS = {
  "ci-build": "build",
  "ci-deploy": "deploy",
  "ci-production": "production",
  flow: "flow",
};
const PRODUCT_ENVS = {
  dev: "dev",
  staging: "staging",
  prod: "production",
  production: "production",
};
/** Projects with no runtime folder to map: listed so the plan says so instead of guessing. */
const NOT_PRODUCTS = new Set(["stackra", "registry"]);

/**
 * The sops scope for one Infisical source, or null when no rule maps it:
 * agents `/agents…` → `agents`; ci-build, ci-deploy, ci-production and flow `prod` `/ci[/x]` → `ci/<kind>[/x]`;
 * a product project's `/runtime[/member]` → `products/<product>/<dev|staging|production>`.
 */
export function scopeFor(project, env, path) {
  if (project === "agents") return /^\/agents(?:\/|$)/.test(path) ? "agents" : null;
  if (Object.hasOwn(CI_PROJECTS, project)) {
    const m = /^\/ci((?:\/[a-z0-9-]+)*)$/.exec(path);
    return env === "prod" && m ? `ci/${CI_PROJECTS[project]}${m[1]}` : null;
  }
  if (NOT_PRODUCTS.has(project) || !/^[a-z0-9-]+$/.test(project)) return null;
  return /^\/runtime(?:\/[a-z0-9-]+)?$/.test(path) && PRODUCT_ENVS[env]
    ? `products/${project}/${PRODUCT_ENVS[env]}`
    : null;
}

/** Single sources the leader placed by hand (2026-11-06), keyed `<project>/<env>:<path> <NAME>`. */
export const PLACED = {
  "stackra/prod:/ci BETTERSTACK_API_TOKEN": "ci/deploy",
  "stackra/prod:/ci/registry REGISTRY_ISSUER_TOKEN": "ci/production/registry",
};
/** Ids, not secrets (leader, 2026-11-06): figentra/infra keeps them as variables or stack config. */
export const NOT_SECRETS = new Set([
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_ZONE_ID_ACADEMORIX",
  "CLOUDFLARE_ZONE_ID_FIGENTRA",
]);

/** Why a source is left out on purpose, or null. Reported by name; never blocks a write. */
export function excludedReason(r) {
  if (NOT_SECRETS.has(r.name)) return "an id, not a secret: figentra/infra keeps it as a variable";
  if (r.project === "academorix-legacy") return "stays in the owner's backup (Q13)";
  if (r.project === "stackra")
    return "old shared project: its other names are copies in agents and ci-*";
  return null;
}

/**
 * Fold Infisical rows into sops entries. Two sources landing on one scope and name (two members of a product) merge
 * when their values match and conflict when they differ; a conflict writes neither. Returns names-only problems.
 */
export function plan(rows) {
  const byKey = new Map();
  const unmapped = [];
  const excluded = [];
  const empty = [];
  for (const r of rows) {
    const where = `${r.project}/${r.env}:${r.path} ${r.name}`;
    const reason = PLACED[where] ? null : excludedReason(r);
    const scope = reason ? null : (PLACED[where] ?? scopeFor(r.project, r.env, r.path));
    if (reason) excluded.push(`${where} (${reason})`);
    else if (!scope) unmapped.push(where);
    else if (r.value !== undefined && r.value.length === 0) empty.push(where);
    else {
      const key = `${scope}/${r.name}`;
      const hash = r.value === undefined ? undefined : shortHash(r.value);
      const seen = byKey.get(key);
      if (!seen) byKey.set(key, { scope, name: r.name, value: r.value, hash, from: [where] });
      else {
        seen.from.push(where);
        // With names only (--plan) a repeat can't be compared yet; --write compares the values.
        if (hash === undefined) seen.duplicate = true;
        else if (seen.hash !== hash) seen.conflict = true;
      }
    }
  }
  const entries = [...byKey.values()].filter((e) => !e.conflict);
  const list = (flag) =>
    [...byKey.values()]
      .filter((e) => e[flag])
      .map((e) => `${e.scope}/${e.name}: ${e.from.join(" + ")}`);
  return {
    entries,
    unmapped,
    excluded,
    empty,
    conflicts: list("conflict"),
    duplicates: list("duplicate"),
  };
}

/** The owner's Infisical user token, captured from the CLI. */
export function userToken(domain, run = cliRunner) {
  const r = run("infisical", ["user", "get", "token", "--plain", "--domain", domain]);
  if (r.status !== 0) throw cliFailure("login", "infisical", r);
  const token = r.stdout.trim().split("\n").at(-1)?.trim();
  if (!token?.startsWith("eyJ"))
    throw new Refusal(`not logged in to ${domain}; run \`infisical login --domain ${domain}\``);
  return token;
}

/** Every secret row of every Secret Manager project and environment: `{ project, env, path, name, value? }`. */
export async function readInfisical({ domain, token, withValues, fetchImpl = fetch }) {
  const get = async (path) => {
    const res = await fetchImpl(`${domain}/api${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Refusal(`infisical api: ${res.status} on ${path.split("?")[0]}`);
    return res.json();
  };
  const rows = [];
  const { projects = [] } = await get("/v1/projects");
  for (const p of projects.filter((x) => x.type === "secret-manager"))
    for (const { slug: env } of p.environments ?? []) {
      const q = new URLSearchParams({
        projectId: p.id,
        environment: env,
        secretPath: "/",
        recursive: "true",
        viewSecretValue: String(withValues),
        includeImports: "false",
        expandSecretReferences: "false",
      });
      const { secrets = [] } = await get(`/v4/secrets?${q}`);
      for (const s of secrets)
        rows.push({
          project: p.slug,
          env,
          path: s.secretPath ?? "/",
          name: s.secretKey,
          ...(withValues ? { value: Buffer.from(String(s.secretValue ?? ""), "utf8") } : {}),
        });
    }
  return rows;
}

/** Plan or write; returns the exit code. Tests pass `run`, `fetchImpl`, `env` and `home`. */
export async function main(
  argv,
  {
    run,
    fetchImpl,
    env = process.env,
    home = homedir(),
    write = (s) => process.stdout.write(s),
  } = {},
) {
  const say = (s) => write(`${s}\n`);
  let o;
  try {
    ({ values: o } = parseArgs({
      args: argv,
      options: {
        plan: { type: "boolean" },
        write: { type: "boolean" },
        domain: { type: "string" },
      },
    }));
  } catch {
    say("usage: pnpm secrets:migrate [--plan | --write] [--domain <url>]");
    return 2;
  }
  const domain = o.domain ?? "https://eu.infisical.com";
  try {
    if (o.write && isAgentRun(env))
      throw new Refusal("--write reads every value under the owner's login; the owner runs it");
    const token = userToken(domain, run);
    const rows = await readInfisical({ domain, token, withValues: Boolean(o.write), fetchImpl });
    const { entries, unmapped, excluded, empty, conflicts, duplicates } = plan(rows);
    const scopes = Map.groupBy(entries, (e) => e.scope);
    for (const [scope, list] of [...scopes].toSorted(([a], [b]) => a.localeCompare(b)))
      say(`${scope}: ${list.length} name(s)`);
    for (const u of unmapped) say(`unmapped: ${u}`);
    for (const x of excluded) say(`excluded: ${x}`);
    for (const e of empty) say(`empty, skipped: ${e}`);
    for (const c of conflicts) say(`conflict: ${c}`);
    for (const d of duplicates) say(`repeated, values compared at --write: ${d}`);
    say(
      `${entries.length} to write, ${unmapped.length} unmapped, ${excluded.length} excluded, ${conflicts.length} in conflict, ${empty.length} empty`,
    );
    if (!o.write) return unmapped.length || conflicts.length ? 1 : 0;
    if (unmapped.length || conflicts.length)
      throw new Refusal("resolve every unmapped source and conflict first (nothing written)");
    const hashes = Object.fromEntries(entries.map((e) => [`${e.scope}/${e.name}`, e.hash]));
    const { url } = publish(entries, {
      actor: "owner",
      run,
      title: `secrets: migrate ${entries.length} names from Infisical`,
      extraFiles: {
        "migration/hashes.yaml": `# 8-hex SHA-256 prefixes, compared by CI after decrypt (ADR 0525).\n${stringify(hashes)}`,
      },
    });
    audit(home, { actor: "owner", action: "migrate", result: "ok", count: entries.length });
    say(`written: ${url}`);
    return 0;
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    say(`secrets-migrate: refused: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch {
    process.stdout.write("secrets-migrate: internal error (no detail printed by design)\n");
    process.exitCode = 1;
  }
}
