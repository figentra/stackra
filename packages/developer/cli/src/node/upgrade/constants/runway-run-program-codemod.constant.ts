/**
 * Stackra file contract:
 * Purpose: `RUNWAY_RUN_PROGRAM_CODEMOD`, 0.10.0: runway's `runCommand` is renamed `runProgram`; the codemod renames
 *          the import and its uses.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset c4348cd.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** runCommand of @stackra/runway/node is renamed runProgram. */
export const RUNWAY_RUN_PROGRAM_CODEMOD: UpgradeCodemod = {
  id: "runway-run-program",
  version: "0.10.0",
  title: "runCommand of @stackra/runway/node is renamed runProgram",
  note: "Runway's child-process helper is runProgram, so runCommand is @stackra/console's alone (ADR 0294 decisions 15 and 23). Behaviour is unchanged. The codemod renames the import from @stackra/runway/node and its uses; @stackra/console's runCommand is left alone.",
  source: "c4348cd, STA-2040",
  renames: [
    {
      name: "runCommand",
      from: ["@stackra/runway/node"],
      to: "@stackra/runway/node",
      rename: "runProgram",
    },
  ],
};
