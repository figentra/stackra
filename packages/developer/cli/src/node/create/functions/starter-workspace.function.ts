/**
 * Stackra file contract:
 * Purpose: `starterWorkspace(files)`, the `DoctorWorkspace` of an app not written yet, from the files `starterFiles`
 *          returned: every package.json, the root scripts and runway, and each member's dev port,
 *          so `stackra create` runs the doctor's checks for exactly what the chosen profile needs.
 * Boundary: pure; an unreadable file counts as absent.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-015 and FR-019.
 */
import { parse } from "yaml";

import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";

const decoder = new TextDecoder();

/**
 * The doctor's view of an app's files.
 *
 * @param files - the app's files by POSIX path.
 * @example
 * doctorNeeds(starterWorkspace(starterFiles(starter, options)));
 */
export function starterWorkspace(files: ReadonlyMap<string, Uint8Array>): DoctorWorkspace {
  const read = (path: string, parser: (text: string) => unknown): unknown => {
    const bytes = files.get(path);
    try {
      return bytes === undefined ? undefined : parser(decoder.decode(bytes));
    } catch {
      return undefined;
    }
  };
  const root = read("package.json", JSON.parse) as
    | { readonly scripts?: Record<string, unknown> }
    | undefined;
  const manifests = [...files.keys()]
    .filter((path) => path.endsWith("package.json") && !path.includes("node_modules/"))
    .map((path) => read(path, JSON.parse))
    .filter((manifest) => manifest !== undefined);
  const devPorts = [...files.keys()]
    .filter((path) => path !== "runway.yaml" && path.endsWith("/runway.yaml"))
    .flatMap((path) => {
      const port = (
        read(path, parse) as { environments?: { dev?: { port?: unknown } } } | undefined
      )?.environments?.dev?.port;
      return typeof port === "number" ? [port] : [];
    });
  return {
    manifests,
    scripts: root?.scripts ?? {},
    runway: read("runway.yaml", parse),
    devPorts,
  };
}
