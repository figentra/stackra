/**
 * Stackra file contract:
 * Purpose: `workspaceFits(root, workspace)`, whether a workspace has a `CommandFit`: a mobile app (the root runway's
 *          `mobile`, or a member on react-native), web surfaces (the root runway's `surfaces`), a product (either),
 *          seed packs (`<root>/seed-packs/`), or a package (a member named so, or depending on it in any section).
 * Boundary: reads only `workspace` and whether `<root>/seed-packs` exists.
 * Runtime: node
 * Governing contract: STA-2872 spec FR-002.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { doctorNeeds } from "#node/doctor/functions/doctor-needs.function";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";
import type { CommandFit } from "#node/types/command-fit.type";

/** The value as a record, or an empty one. */
const record = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/** The dependency sections of a manifest. */
const SECTIONS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

/**
 * The fit test of the workspace at `root`.
 *
 * @param root - the workspace root (for the `seed-packs/` folder).
 * @param workspace - the workspace as `readDoctorWorkspace` reads it.
 * @example
 * workspaceFits(root, readDoctorWorkspace(root))("@stackra/search"); // true when a member uses @stackra/search
 */
export function workspaceFits(
  root: string,
  workspace: DoctorWorkspace,
): (fit: CommandFit) => boolean {
  const runway = record(workspace.runway);
  const surfaces = Object.keys(record(runway["surfaces"])).length > 0;
  const mobile =
    Object.keys(record(runway["mobile"])).length > 0 || doctorNeeds(workspace).has("mobile");
  const uses = (name: string) =>
    workspace.manifests.some(
      (manifest) =>
        record(manifest)["name"] === name ||
        SECTIONS.some((section) => record(record(manifest)[section])[name] !== undefined),
    );
  // The named fits; any other fit is a package name.
  const named: Readonly<Record<string, () => boolean>> = {
    mobile: () => mobile,
    surfaces: () => surfaces,
    product: () => surfaces || mobile,
    "seed-packs": () => existsSync(join(root, "seed-packs")),
  };
  return (fit) => named[fit]?.() ?? uses(fit);
}
