#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm secrets:put NAME --scope S` (ADR 0525 kind (c), "human"): the owner gives one value that nobody can
 *   generate or mint, and it lands encrypted in `figentra/secrets` through a self-merging pull request. The agent
 *   that asked sees names only.
 * Boundary: the value comes from `~/Secrets-inbox/<NAME>[.ext]` (deleted on success, kept on failure) or, with no
 *   inbox file, from a hidden prompt on the terminal; it is written by `secrets-sops.mjs` `publish`.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0257 (the inbox, nobody reads a value).
 * Input: NAME, `--scope <scope>`, optional `--actor <agent>`.
 * Output: one line with the name, the scope, "added" or "replaced" and the pull request URL; exit 1 on a refusal.
 * Secrets: the value is read into memory and handed to sops on stdin; it is never echoed, printed, logged or on argv.
 */
import { unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { audit, readValue, scanInbox } from "./secrets-import.mjs";
import { Refusal, checkTarget, isAgentRun, publish } from "./secrets-sops.mjs";

/**
 * Read one line from the terminal with echo off. Enter ends it; Ctrl-C cancels; Backspace deletes. A multi-line
 * value (a PEM key) goes through the inbox instead.
 */
export function promptHidden(label, { input = process.stdin, output = process.stderr } = {}) {
  if (!input.isTTY)
    return Promise.reject(
      new Refusal("no terminal for a hidden prompt; drop the file in ~/Secrets-inbox/ instead"),
    );
  output.write(label);
  input.setRawMode(true);
  input.resume();
  const bytes = [];
  return new Promise((resolve, reject) => {
    const done = (fn, arg) => {
      input.setRawMode(false);
      input.pause();
      input.off("data", onData);
      output.write("\n");
      fn(arg);
    };
    function onData(buf) {
      for (const byte of buf) {
        if (byte === 3) return done(reject, new Refusal("cancelled"));
        if (byte === 13 || byte === 10) return done(resolve, Buffer.from(bytes));
        if (byte === 127 || byte === 8) bytes.pop();
        else bytes.push(byte);
      }
    }
    input.on("data", onData);
  });
}

/** A prompted value: UTF-8, no NUL, not empty. */
export function checkPrompted(buf) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    throw new Refusal("not UTF-8 text");
  }
  if (text.includes("\0")) throw new Refusal("contains a NUL byte");
  if (!text.length) throw new Refusal("empty");
  return Buffer.from(text, "utf8");
}

/**
 * Put one value. Returns the exit code; `say` gets value-free lines only. Tests pass `home`, `run`, `prompt` and
 * `env`.
 */
export async function main(
  argv,
  {
    home = homedir(),
    run,
    prompt = promptHidden,
    env = process.env,
    write = (s) => process.stdout.write(s),
  } = {},
) {
  // oxlint-disable-next-line no-control-regex -- stripping control characters is the point
  const say = (s) => write(s.replaceAll(/[\u0000-\u001f\u007f-\u009f]/g, "?") + "\n");
  let args;
  try {
    args = parseArgs({
      args: argv,
      allowPositionals: true,
      options: { scope: { type: "string" }, actor: { type: "string" } },
    });
  } catch {
    // parseArgs echoes the offending argument; never repeat it, it could be a pasted value.
    say(
      "secrets-put: unknown flag (there is no --value; you will be prompted, or use ~/Secrets-inbox/)",
    );
    return 2;
  }
  const { values: o, positionals } = args;
  const actor = o.actor ?? env.STACKRA_AGENT ?? "owner";
  const [name] = positionals;
  if (positionals.length !== 1) {
    say("usage: pnpm secrets:put NAME --scope <scope>");
    return 2;
  }
  const inbox = join(home, "Secrets-inbox");
  let label = "(invalid name)";
  try {
    const t = checkTarget({ scope: o.scope, name }, { agent: isAgentRun(env) });
    label = `${t.name}  ${t.scope}`;
    const entry = scanInbox(inbox).entries.find((e) => e.name === t.name);
    const value = entry
      ? readValue(join(inbox, entry.file)).value
      : checkPrompted(await prompt(`${t.name} (${t.scope}), paste and press Enter (hidden): `));
    const { written, url } = publish([{ ...t, value }], { actor, run });
    if (entry) unlinkSync(join(inbox, entry.file));
    audit(home, { actor, name: t.name, scope: t.scope, action: "put", result: "ok" });
    say(
      `${label}  ${written[0].replaced ? "replaced" : "added"}${entry ? "; inbox file deleted" : ""}  ${url}`,
    );
    return 0;
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    audit(home, {
      actor,
      name: label,
      scope: o.scope,
      action: "put",
      result: "refused",
      reason: error.message,
    });
    say(`${label}  refused: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch {
    // An unexpected error's message could carry content; report nothing but the fact.
    process.stdout.write("secrets-put: internal error (no detail printed by design)\n");
    process.exitCode = 1;
  }
}
