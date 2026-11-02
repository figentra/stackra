/**
 * Stackra file contract:
 * Purpose: `readDoctorWorkspace(root, within?)`, the `DoctorWorkspace` of the pnpm workspace at `root`: the root and
 *          member package.json files (only the members at or under `within`, when given, so `stackra dev` in one
 *          member checks that member's needs), the root scripts, the root runway, `.infisical.yaml` and each member's
 *          dev port.
 * Boundary: reads files; writes nothing. An unreadable runway is treated as absent.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-015 and FR-019.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { parse } from "yaml";

import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";
import { readManifestMembers } from "#node/functions/read-workspace-members.function";

/** A YAML file, parsed, or undefined when it is absent or unreadable. */
function readYaml(path: string): unknown {
  try {
    return existsSync(path) ? (parse(readFileSync(path, "utf8")) as unknown) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The workspace at `root` as the doctor sees it.
 *
 * @param root - the workspace root.
 * @param within - a folder inside it; only the members at or under it count.
 * @example
 * doctorNeeds(readDoctorWorkspace("/repo"));
 */
export function readDoctorWorkspace(root: string, within = root): DoctorWorkspace {
  const scope = relative(root, within);
  const all = existsSync(join(root, "pnpm-workspace.yaml")) ? readManifestMembers(root) : [];
  const members = all.filter(
    (member) => scope === "" || member.dir === scope || member.dir.startsWith(`${scope}/`),
  );
  const rootManifest = existsSync(join(root, "package.json"))
    ? (JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
        readonly scripts?: Record<string, unknown>;
      })
    : {};
  const devPorts = members.flatMap((member) => {
    const runway = readYaml(join(root, member.dir, "runway.yaml")) as
      | { readonly environments?: { readonly dev?: { readonly port?: unknown } } }
      | undefined;
    const port = runway?.environments?.dev?.port;
    return typeof port === "number" ? [port] : [];
  });
  return {
    manifests: [
      ...(scope === "" ? [rootManifest] : []),
      ...members.map((member) => member.manifest),
    ],
    scripts: rootManifest.scripts ?? {},
    runway: readYaml(join(root, "runway.yaml")),
    infisical: existsSync(join(root, ".infisical.yaml")),
    devPorts,
  };
}
