#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `node tools/scripts/record-terminal-demo.mjs --out <file.json> -- <command…>` (STA-2041): runs a real CLI
 *          command in a fresh temporary folder and writes its session as `TerminalLine[]` JSON for `TerminalDemo`: the
 *          command first, then each printed line, classed as `success` (✓ or ✔), `prompt` (?), `choice` (❯) or
 *          `output`. Colour codes are stripped, and the temporary folder's path is written as `~`.
 * Boundary: runs the command non-interactively (`CI=1`, no TTY) and writes only `--out`. Run it on the testbed, never
 *           on a workstation: `stackra create` installs dependencies. Nothing it records is edited by hand.
 * Runtime: node
 * Governing contract: STA-2041 (the landing's terminal is recorded from the real CLI, never invented); ADR 0515
 *          (`stackra create`).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// oxlint-disable-next-line no-control-regex -- reason: matching the ANSI escape is the point of the pattern
const ANSI = /\u001B\[[0-9;?]*[ -/]*[@-~]/g;

/** The session of `command` printing `text`, as TerminalLine[]; `home` is replaced by `~`. */
export function toLines(command, text, home) {
  const lines = [{ kind: "command", text: command }];
  for (const raw of text.replace(ANSI, "").split(/\r?\n/)) {
    const line = (home ? raw.split(home).join("~") : raw).trimEnd();
    if (line.trim() === "") continue;
    const start = line.trimStart();
    if (/^[✓✔]/.test(start)) lines.push({ kind: "success", text: start.slice(1).trimStart() });
    else if (start.startsWith("?"))
      lines.push({ kind: "prompt", text: start.slice(1).trimStart() });
    else if (start.startsWith("❯"))
      lines.push({ kind: "choice", text: start.slice(1).trimStart() });
    else lines.push({ kind: "output", text: line });
  }
  return lines;
}

/** Runs the command line in a temporary folder and writes its session to `out`. */
function main(argv) {
  const split = argv.indexOf("--");
  const outAt = argv.indexOf("--out");
  const out = outAt === -1 ? undefined : argv[outAt + 1];
  const command = split === -1 ? [] : argv.slice(split + 1);
  if (!out || command.length === 0) {
    console.error("usage: record-terminal-demo.mjs --out <file.json> -- <command…>");
    return 2;
  }
  const home = mkdtempSync(join(tmpdir(), "stackra-demo-"));
  try {
    const [program, ...args] = command;
    const run = spawnSync(program, args, {
      cwd: home,
      encoding: "utf8",
      env: { ...process.env, CI: "1", FORCE_COLOR: "0", NO_COLOR: "1" },
    });
    if (run.error || run.status !== 0) {
      console.error(run.error?.message ?? `${command.join(" ")} exited with ${run.status}`);
      console.error(run.stderr);
      return 1;
    }
    const lines = toLines(command.join(" "), `${run.stdout}\n${run.stderr}`, home);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(lines, null, 2)}\n`);
    console.log(`${out}: ${lines.length} lines`);
    return 0;
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  process.exitCode = main(process.argv.slice(2));
