/**
 * Stackra file contract:
 * Purpose: `catalogEncoreVersion(workspaceYaml)`, the `encore.dev` version of the default catalog in
 *          `pnpm-workspace.yaml`, the one a service pins literally. pnpm writes the default catalog either as the
 *          top-level `catalog:` block or as `catalogs.default`; both are read, the top-level block first.
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
    readonly catalogs?: Readonly<Record<string, Readonly<Record<string, unknown>> | undefined>>;
  };
  const version =
    workspace.catalog?.["encore.dev"] ?? workspace.catalogs?.["default"]?.["encore.dev"];
  return version === undefined ? undefined : String(version);
}
