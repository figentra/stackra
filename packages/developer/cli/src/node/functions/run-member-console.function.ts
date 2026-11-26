/**
 * Stackra file contract:
 * Purpose: `runMemberConsole(root, member, argv, err, cwd)`, one run of a member's generated console entry
 *          (`.stackra/entry/console.ts`) with `argv`, resolving with the command's exit code: what
 *          `stackra console <member>` and a member command run at the top level (`stackra db:status`) both do. The
 *          command runs in its member: in `cwd` when the person stands inside the member, else in the member's root,
 *          so a command whose default folder is the current one (`db:status --cwd`) acts on its own member.
 * Boundary: loads the entry through Vite's module runner in the member's folder and runs no gen; resolves 2 and says so
 *           on `err` when the member has no console entry (it declares no command, or gen has not run). It changes
 *           the process's working directory only for the entry's import and run, and puts it back however they end.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0295 (generated entries); STA-1731 spec FR-009; STA-2888.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { runnerImport } from "vite";

import { isWithin } from "#node/functions/is-within.function";

/** What a generated console entry exports. */
interface ConsoleEntry {
  /** Runs the console with `argv`; resolves to the exit code. */
  readonly run: (argv: readonly string[]) => Promise<number>;
}

/**
 * Runs the console of the member at `root`.
 *
 * @param root - the absolute member root.
 * @param member - how the person named it, for the message when it has no console entry.
 * @param argv - the console's command line (`["db:status", "--json"]`).
 * @param err - where that message goes.
 * @param cwd - where the person stands; the command runs there when it is inside the member.
 * @example
 * await runMemberConsole("/repo/services/orders", "orders", ["db:status", "--json"], io.err, "/repo"); // 0
 */
export async function runMemberConsole(
  root: string,
  member: string,
  argv: readonly string[],
  err: (text: string) => void,
  cwd: string,
): Promise<number> {
  const entry = join(root, ".stackra", "entry", "console.ts");
  if (!existsSync(entry)) {
    err(
      `stackra console: ${member} has no console entry (.stackra/entry/console.ts): it declares no command, or \`stackra gen\` has not run\n`,
    );
    return 2;
  }
  // The generated entry reads its folder from the process, when it builds its console on import (an option's
  // default, `db:status --cwd`) and when it runs, so both happen where the command should act.
  const folder = isWithin(root, cwd) ? cwd : root;
  const previous = process.cwd();
  if (folder !== previous) process.chdir(folder);
  try {
    // Node's type stripping refuses decorators, so the entry loads through Vite with the house decorator transform.
    const { module } = await runnerImport<ConsoleEntry>(entry, {
      root,
      configFile: false,
      logLevel: "silent",
      oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } },
    });
    return await module.run(argv);
  } finally {
    if (process.cwd() !== previous) process.chdir(previous);
  }
}
