/**
 * Stackra file contract:
 * Purpose: `DOCTOR_COMMAND`, `stackra doctor [--fix] [--quick]` (`pnpm doctor`): the machine-readiness checklist,
 *          run by `DoctorCommand` through `@stackra/console` (was `tools/scripts/doctor.mjs`).
 * Boundary: data plus dispatch.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles); ADR 0282 (decision 3);
 *                     STA-1952 spec User Story 0.
 */
import { DoctorCommand } from "#node/commands/doctor.command";
import { consoleCommand } from "#node/functions/console-command.function";

/** The `stackra doctor` command. */
export const DOCTOR_COMMAND = consoleCommand(
  DoctorCommand,
  "Check the machine for what this workspace needs (--fix offers each fix, asking first)",
  "stackra doctor [--fix] [--quick]",
);
