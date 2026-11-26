/**
 * Stackra file contract:
 * Purpose: `encoreReferenceVersion(rootPackageJson, workspaceYaml)`, the `encore.dev` version a service pins
 *          literally: the root package.json's `stackra.encore`, else the default catalog's `encore.dev`
 *          (`catalogEncoreVersion`).
 * Boundary: pure. A repository whose services pin the literal and nothing references `catalog:` for `encore.dev` keeps
 *           the reference in `stackra.encore`, so no catalog entry sits unused (knip, rule-gap B-10); a repository that
 *           still keeps it in its catalog reads it from there.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09).
 */
import { catalogEncoreVersion } from "#node/functions/catalog-encore-version.function";

/**
 * The reference `encore.dev` version, or undefined when neither file names one.
 *
 * @param rootPackageJson - the root package.json's text; undefined when the file is missing.
 * @param workspaceYaml - `pnpm-workspace.yaml`'s text; undefined when the file is missing.
 * @example
 * encoreReferenceVersion('{ "stackra": { "encore": "1.58.8" } }', undefined); // "1.58.8"
 */
export function encoreReferenceVersion(
  rootPackageJson: string | undefined,
  workspaceYaml: string | undefined,
): string | undefined {
  const root = JSON.parse(rootPackageJson ?? "{}") as {
    readonly stackra?: { readonly encore?: unknown };
  };
  const pinned = root.stackra?.encore;
  return typeof pinned === "string" ? pinned : catalogEncoreVersion(workspaceYaml);
}
