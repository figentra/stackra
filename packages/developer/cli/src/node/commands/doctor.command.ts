/**
 * Stackra file contract:
 * Purpose: `DoctorCommand`, `stackra doctor [--fix] [--quick]`: the machine-readiness checklist of the workspace it
 *          runs in, chosen by what the workspace needs (`doctorNeeds`), drawn as a grouped checklist (its rows are the
 *          `--json` data, `run` included): every problem explained with its fix. `--fix` offers each failing check's
 *          command and runs it only after a yes; `--quick` keeps the checks `stackra dev` runs before it starts. Exits
 *          1 when a required check fails; a warning never fails it.
 * Boundary: the checks are read-only; only an accepted `--fix` command changes the machine, and without a terminal
 *           every prompt answers no, so nothing is installed. Agents never run `--fix` installs on the owner's Mac.
 *           Secrets: forbidden: nothing secret is read or printed (see `doctorChecks`).
 * Runtime: node
 * Governing contract: ADR 0027; ADR 0121; STA-1952 spec User Story 0 and FR-014 to FR-019; ADR 0515; STA-1966.
 */
import { Command, Option, type CommandIo } from "@stackra/console";

import { DOCTOR_GROUPS } from "#node/doctor/constants/doctor-groups.constant";
import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import { doctorGroup } from "#node/doctor/functions/doctor-group.function";
import { readDoctorWorkspace } from "#node/doctor/functions/read-doctor-workspace.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";

/** Checks the machine for what the workspace needs. */
export class DoctorCommand extends Command({
  name: "doctor",
  description: "Check the machine for what this workspace needs, and how to fix what is missing",
  bin: true,
  tool: { readOnly: true },
}) {
  /** Offer each fix, asking before running it. */
  @Option({ description: "Offer each fix and run it after a yes" })
  fix = false;

  /** Only what `stackra dev` checks before it starts. */
  @Option({ description: "Only the checks stackra dev runs: mise tools, Docker, ports" })
  quick = false;

  /** Runs the checklist, then the accepted fixes. */
  async handle(io: CommandIo): Promise<void> {
    const root = workspaceRoot(io.cwd);
    const results = await doctorChecks(root, readDoctorWorkspace(root), { quick: this.quick });
    // A failed row ends the run with 1 and a warning never does; `run` rides along as a row field for --json.
    io.output.checklist({
      rows: results.map(({ detail, fix, run, ...result }) => ({
        ...result,
        group: doctorGroup(result.name),
        ...(detail === undefined ? {} : { detail }),
        ...(fix === undefined ? {} : { fix }),
        ...(run === undefined ? {} : { run }),
      })),
      groups: [...DOCTOR_GROUPS],
    });
    if (!this.fix) return;
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
      const { code } = await io.process.run(program, args, {
        cwd: root,
        interactive: true,
        check: false,
      });
      if (code === 0) io.output.success(`${command} finished`);
      else io.output.error(`${command} failed; fix it by hand: ${result.fix ?? command}`);
    }
    io.output.line("Re-run `stackra doctor` to check again.");
  }
}
