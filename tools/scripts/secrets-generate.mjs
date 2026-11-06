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
 *   `--rotate`, `--actor <agent>`.
 * Output: one line with the name, the scope, "added" or "rotated" and the pull request URL; exit 1 on a refusal.
 * Secrets: the value exists only in this process and on sops' stdin; it is never printed, logged or on argv.
 */
import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { audit } from "./secrets-import.mjs";
import { Refusal, checkTarget, isAgentRun, publish } from "./secrets-sops.mjs";

export const ENCODINGS = ["base64url", "hex"];

/** A random value of `bytes` bytes in `encoding`; throws a Refusal on a bad size or encoding. */
export function generateValue(bytes = 32, encoding = "base64url") {
  if (!Number.isInteger(bytes) || bytes < 16 || bytes > 128)
    throw new Refusal("--bytes must be an integer from 16 to 128");
  if (!ENCODINGS.includes(encoding))
    throw new Refusal(`--encoding must be one of ${ENCODINGS.join(", ")}`);
  return Buffer.from(randomBytes(bytes).toString(encoding), "utf8");
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
      },
    });
  } catch {
    say("secrets-generate: unknown flag");
    return 2;
  }
  const { values: o, positionals } = args;
  if (positionals.length !== 1) {
    say(
      "usage: pnpm secrets:generate NAME --scope <scope> [--bytes 32] [--encoding base64url|hex] [--rotate]",
    );
    return 2;
  }
  const actor = o.actor ?? env.STACKRA_AGENT ?? "owner";
  const action = o.rotate ? "rotate" : "generate";
  let label = "(invalid name)";
  try {
    const t = checkTarget({ scope: o.scope, name: positionals[0] }, { agent: isAgentRun(env) });
    label = `${t.name}  ${t.scope}`;
    const value = generateValue(
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
