/**
 * Stackra file contract:
 * Purpose: `devReady(cwd, io)`, the quick doctor `stackra dev` runs before it starts anything: the mise tools, and for
 *          the members at or under `cwd` a running Docker engine (services) and free dev ports. Resolves false and
 *          prints the failures with their fixes when one fails, so dev stops early with a clear message.
 * Boundary: read-only checks (see `doctorChecks`); prints only failures.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-019.
 */
import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import { readDoctorWorkspace } from "#node/doctor/functions/read-doctor-workspace.function";
import { renderDoctor } from "#node/doctor/functions/render-doctor.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliIo } from "#node/types/cli-io.type";

/**
 * Whether the machine is ready to serve the members at or under `cwd`.
 *
 * @param cwd - where `stackra dev` runs.
 * @param io - where the failures are printed.
 * @example
 * if (!(await devReady(cwd, io))) return 1;
 */
export async function devReady(cwd: string, io: CliIo): Promise<boolean> {
  const root = workspaceRoot(cwd);
  const failing = (
    await doctorChecks(root, readDoctorWorkspace(root, cwd), { quick: true })
  ).filter((result) => result.status === "fail");
  if (failing.length === 0) return true;
  io.err(
    `stackra dev stopped before starting anything:\n${renderDoctor(failing)}\nRun \`stackra doctor\` for the full checklist.\n`,
  );
  return false;
}
