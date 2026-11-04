/**
 * Stackra file contract:
 * Purpose: `RunwayEnvCheckCommand`, `runway env check` (`runway env:check`): the names-only environment check
 *          (`checkEnv`) of the repository: every declared name has an Infisical home, and raw reads of undeclared
 *          names are reported. Exits 1 on an error; warnings pass.
 * Boundary: names only; no login, no Infisical call, never a value. The Quality Gate runs it on every pull request.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { Command, type CommandIo } from "@stackra/console";

import { checkEnv } from "#node/functions/check-env.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Checks the repository's environment names. */
export class RunwayEnvCheckCommand extends Command({
  name: "env:check",
  description:
    "Check that every environment name is declared and has an Infisical home (names only)",
  examples: ["runway env check"],
}) {
  /** The check; a test replaces it. */
  check: typeof checkEnv = checkEnv;

  /** Prints each finding and resolves with 1 when one is an error, else 0. */
  handle(io: CommandIo): number {
    const findings = this.check(repositoryRoot(io.cwd));
    for (const { level, name, where, message } of findings) {
      const line = `${name} (${where}) ${message}`;
      if (level === "error") io.output.error(line);
      else io.output.warn(line);
    }
    const errors = findings.filter((finding) => finding.level === "error").length;
    if (errors === 0) io.output.success(`env names: no errors, ${findings.length} warnings`);
    return errors === 0 ? 0 : 1;
  }
}
