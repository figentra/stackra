/**
 * Stackra file contract:
 * Purpose: `previewDatabaseOf(root, branch)`, how the preview of the git branch `branch` gets its database, from
 *          `environments.preview.shared.database`: by default a fresh database filled with the `demo` seed profile;
 *          with `from: branch`, a Neon branch `preview-<branch>` of the configured parent.
 * Boundary: pure; reads the parsed root runway only. Creating the branch is a `PreviewDatabaseBrancher`'s, seeding is
 *           `stackra seed-pack`'s (`previewSeedStep`), and both run in the preview deploy job.
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (decision 1: Neon is allowed), ADR 0190 (seed-pack profiles), ADR 0296 (decision 2).
 */
import { PREVIEW_DATABASE_SCHEMA } from "#core/constants/preview-database-schema.constant";
import { PreviewDatabaseSource } from "#core/enums/preview-database-source.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { PreviewDatabase } from "#core/types/preview-database.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** The longest branch name kept: a Postgres host label and most dashboards fit 63 characters. */
const NAME_LIMIT = 63;

/**
 * The preview database of `branch`.
 *
 * @param root - the parsed root runway.
 * @param branch - the pull request's git branch (`feat/checkout`).
 * @throws RunwayInvalidError when the preview's database block is invalid, or `branch` has no letter or digit.
 * @example
 * previewDatabaseOf(root, "feat/checkout"); // { from: "seed-pack", profile: "demo" }
 * // with from: branch → { from: "branch", provider: "neon", project, parent: "main", name: "preview-feat-checkout" }
 */
export function previewDatabaseOf(root: RootRunway, branch: string): PreviewDatabase {
  const path = `environments.${RunwayEnvironment.Preview}.shared.database`;
  const result = PREVIEW_DATABASE_SCHEMA.safeParse(
    root.environments[RunwayEnvironment.Preview]?.shared?.database ?? {},
  );
  if (!result.success)
    throw new RunwayInvalidError(
      "root runway",
      result.error.issues.map((issue) => ({
        path: [path, ...issue.path.map(String)].join("."),
        message: issue.message,
      })),
    );
  const database = result.data;
  if (database.from === PreviewDatabaseSource.SeedPack || database.branch === undefined)
    return { from: "seed-pack", profile: database.profile };

  const slug = branch
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
  if (slug === "")
    throw new RunwayInvalidError("git branch", [
      { path: "branch", message: `${branch} has no letter or digit to name a preview branch` },
    ]);
  return {
    from: "branch",
    provider: database.branch.provider,
    project: database.branch.project,
    parent: database.branch.parent,
    name: `preview-${slug}`.slice(0, NAME_LIMIT).replace(/-+$/, ""),
  };
}
