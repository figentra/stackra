/**
 * Stackra file contract:
 * Purpose: `catalogEncoreVersion(workspaceYaml)`, the `encore.dev` version of the default catalog in
 *          `pnpm-workspace.yaml`, the one a service pins literally.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09).
 */
import { parse } from "yaml";

/**
 * The default catalog's `encore.dev` version, or undefined when there is none.
 *
 * @param workspaceYaml - `pnpm-workspace.yaml`'s text; undefined when the file is missing.
 * @example
 * catalogEncoreVersion("catalog:\n  encore.dev: 1.58.8\n"); // "1.58.8"
 */
export function catalogEncoreVersion(workspaceYaml: string | undefined): string | undefined {
  const workspace = (parse(workspaceYaml ?? "") ?? {}) as {
    readonly catalog?: Readonly<Record<string, unknown>>;
  };
  const version = workspace.catalog?.["encore.dev"];
  return version === undefined ? undefined : String(version);
}
