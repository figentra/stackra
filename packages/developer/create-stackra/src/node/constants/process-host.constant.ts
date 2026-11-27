/**
 * Stackra file contract:
 * Purpose: `PROCESS_HOST`, the real `BootstrapHost`: this process's environment, Node version, binary and platform,
 *          `fs.existsSync`, its standard streams, and `child_process.spawn` with the streams inherited and no shell.
 *          A child ended by a signal exits 128 plus the signal number, as a shell reports it.
 * Boundary: the one place `create-stackra` touches the machine; it starts only what `runCreateStackra` names.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

import { exitCode } from "#node/functions/exit-code.function";
import type { BootstrapHost } from "#node/types/bootstrap-host.type";

/** This process as a `BootstrapHost`. */
export const PROCESS_HOST: BootstrapHost = {
  env: process.env,
  nodeVersion: process.versions.node,
  execPath: process.execPath,
  platform: process.platform,
  exists: existsSync,
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
  run: (command, args, env) =>
    new Promise((resolve, reject) => {
      const child = spawn(command, args, { env, stdio: "inherit", shell: false });
      child.once("error", reject);
      child.once("exit", (code, signal) => resolve(exitCode(code, signal)));
    }),
};
