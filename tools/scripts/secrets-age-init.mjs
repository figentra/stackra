#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm secrets:age-init`, run once by the owner (ADR 0525 decision 2): makes the break-glass `age` key pair
 *   that every `figentra/secrets` file is also encrypted to, so the owner can decrypt with no cloud at all.
 * Boundary: `age-keygen` (pinned in mise.toml) writes the private key to a 0600 file under `~/.stackra/`; the public
 *   key goes beside it as `.pub`. Nothing is uploaded: the owner moves the private key into a password manager and
 *   deletes the file; figentra/infra takes the public key into `.sops.yaml`.
 * Runtime: node
 * Governing contract: ADR 0525.
 * Input: optional `--out <path>` for the private key file (default `~/.stackra/age-break-glass.key`).
 * Output: the public key and the next steps. Exit 1 when the file exists, `age-keygen` fails or an agent runs it.
 * Secrets: the private key is written only by `age-keygen` into its file, never printed; only the public key is.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Refusal, cliFailure, cliRunner, isAgentRun } from "./secrets-sops.mjs";

const PUBLIC_RX = /\bage1[02-9ac-hj-np-z]{58}\b/;

/** Make the key pair; returns the exit code. Tests pass `home`, `run` and `env`. */
export function main(
  argv,
  {
    home = homedir(),
    run = cliRunner,
    env = process.env,
    write = (s) => process.stdout.write(s),
  } = {},
) {
  const say = (s) => write(`${s}\n`);
  let o;
  try {
    ({ values: o } = parseArgs({ args: argv, options: { out: { type: "string" } } }));
  } catch {
    say("usage: pnpm secrets:age-init [--out <path>]");
    return 2;
  }
  const out = o.out ?? join(home, ".stackra", "age-break-glass.key");
  try {
    if (isAgentRun(env))
      throw new Refusal("the break-glass key is the owner's; run it yourself in a terminal");
    if (existsSync(out))
      throw new Refusal(`${out} already exists; move it to your password manager first`);
    mkdirSync(dirname(out), { recursive: true, mode: 0o700 });
    const made = run("age-keygen", ["-o", out]);
    if (made.status !== 0) throw cliFailure("keygen", "age-keygen", made);
    const pub = run("age-keygen", ["-y", out]);
    const key = pub.status === 0 ? pub.stdout.match(PUBLIC_RX)?.[0] : undefined;
    if (!key) throw new Refusal("keygen: could not read the public key back");
    writeFileSync(`${out}.pub`, `${key}\n`, { mode: 0o644 });
    say(`Public key: ${key}`);
    say(`Private key file: ${out} (only you; agents are blocked from *.key files)`);
    say("Next: 1) store the private key file in your password manager;");
    say(`      2) delete it: rm ${out}`);
    say(`      3) give the public key to figentra/infra for .sops.yaml (it is in ${out}.pub).`);
    return 0;
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    say(`secrets-age-init: refused: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.exitCode = main(process.argv.slice(2));
