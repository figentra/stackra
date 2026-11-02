/**
 * Stackra file contract:
 * Purpose: `DoctorCommand`, `stackra doctor [--fix] [--quick]`: the machine-readiness checklist of the workspace it
 *          runs in, chosen by what the workspace needs (`doctorNeeds`): every problem explained with its fix. `--fix`
 *          offers each failing check's command and runs it only after a yes; `--quick` keeps the checks
 *          `stackra dev` runs before it starts. Exits 1 when a required check fails.
 * Boundary: the checks are read-only; only an accepted `--fix` command changes the machine, and without a terminal
 *           every prompt answers no, so nothing is installed. Agents never run `--fix` installs on the owner's Mac.
 *           Secrets: forbidden: nothing secret is read or printed (see `doctorChecks`).
 * Runtime: node
 * Governing contract: ADR 0027; ADR 0121; STA-1952 spec User Story 0 and FR-014 to FR-019; ADR 0515.
 */
import { spawnSync } from "node:child_process";

import { Command, Option, type CommandIo } from "@stackra/console";

import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import { doctorExitCode } from "#node/doctor/functions/doctor-exit-code.function";
import { readDoctorWorkspace } from "#node/doctor/functions/read-doctor-workspace.function";
import { renderDoctor } from "#node/doctor/functions/render-doctor.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Checks the machine for what the workspace needs. */
export class DoctorCommand extends Command({
  name: "doctor",
  description: "Check the machine for what this workspace needs, and how to fix what is missing",
  bin: true,
}) {
  /** Offer each fix, asking before running it. */
  @Option({ description: "Offer each fix and run it after a yes" })
  fix = false;

  /** Only what `stackra dev` checks before it starts. */
  @Option({ description: "Only the checks stackra dev runs: mise tools, Docker, ports" })
  quick = false;

  /** The folder it checks: the `stackra` CLI sets its own cwd here (`consoleCommand`), so no `process.cwd()`. */
  cwd = process.cwd();

  /** Runs the checklist, then the accepted fixes. */
  async handle(io: CommandIo): Promise<number> {
    const root = workspaceRoot(this.cwd);
    const results = await doctorChecks(root, readDoctorWorkspace(root), { quick: this.quick });
    // shortcut: rendered here until STA-1966's `io.output.checklist(rows)` lands; switch to it then.
    if (io.json) io.output.json(results);
    else for (const line of renderDoctor(results).split("\n")) io.output.line(line);
    if (!this.fix) return doctorExitCode(results);
    const offered = new Set<string>();
    for (const result of results) {
      if (result.status === "ok" || result.run === undefined) continue;
      const command = result.run.join(" ");
      // Several checks share one fix (`mise install`); offer it once.
      if (offered.has(command)) continue;
      offered.add(command);
      if (
        !(await io.prompt.confirm({
          message: `${result.name}: run \`${command}\`?`,
          default: false,
        }))
      )
        continue;
      const [program = "", ...args] = result.run;
      const status = spawnSync(program, args, { cwd: root, stdio: "inherit" }).status;
      if (status === 0) io.output.success(`${command} finished`);
      else io.output.error(`${command} failed; fix it by hand: ${result.fix ?? command}`);
    }
    io.output.line("Re-run `stackra doctor` to check again.");
    return doctorExitCode(results);
  }
}
