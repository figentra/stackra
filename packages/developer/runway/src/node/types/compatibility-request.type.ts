/**
 * Stackra file contract:
 * Purpose: `CompatibilityRequest`, one run of the shell compatibility gate: the product checkouts to build, the next
 *          shell's import map file and the shell lines the edge will serve.
 * Boundary: type only; `checkShellCompatibility` takes it. Each checkout is a product repository the OS release job
 *           cloned; the build runs there through the command runner.
 * Runtime: node
 * Governing contract: app-shells 15 (point 7: build every product bundle against the next shell; refuse a release
 *                     whose target the edge does not serve) and 16 (point 3).
 */
import type { CommandRunner } from "#node/types/command-runner.type";

/** One compatibility check of the next shell against every product. */
export type CompatibilityRequest = {
  /** Product repository folders. */
  readonly repositories: readonly string[];
  /** The next shell's import map JSON file (`{ "imports": { … } }`). */
  readonly importMap: string;
  /** The shell lines the edge will serve, `<surface>@<major>`. */
  readonly served: readonly string[];
  /** The build command; `EDGE_PUBLISH_SETTINGS.compatibility.command` when absent. */
  readonly command?: string;
  /** Its arguments, `{importMap}` replaced by the import map path; the setting's when absent. */
  readonly args?: readonly string[];
  /** The command runner; `runCommand` when absent. */
  readonly run?: CommandRunner;
};
