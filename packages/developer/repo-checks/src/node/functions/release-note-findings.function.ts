/**
 * Stackra file contract:
 * Purpose: `releaseNoteFindings(context)`, the `release-notes` rule of the `config` phase: reads the repository's
 *          `CHANGELOG.md` files, its pending `.changeset/*.md` and its upgrade notes, and reports each breaking
 *          `@stackra/*` release without a complete note (`breakingReleases`, `checkReleaseNotes`). `pnpm validate`
 *          runs it through `stackra validate --repository`, so the pull request that adds a breaking changeset and the
 *          version pull request are both held.
 * Boundary: reads the listed files; returns findings and never prints. A repository with no `@stackra/*` changelog or
 *           changeset (a product) has nothing to report.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); ADR 0025 (decision 5); ADR 0282 (decision 3); STA-2835.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RELEASE_NOTES_FOLDER } from "#node/constants/release-notes-folder.constant";
import { breakingReleases } from "#node/functions/breaking-releases.function";
import { checkReleaseNotes } from "#node/functions/check-release-notes.function";
import type { RawFinding } from "#node/types/raw-finding.type";
import type { ReleaseSource } from "#node/types/release-source.type";
import type { RepoContext } from "#node/types/repo-context.type";

/**
 * The release-note findings of the repository.
 *
 * @param context - the root and its file list.
 * @example
 * releaseNoteFindings(readRepoContext(root)); // [] when every breaking release has its note
 */
export function releaseNoteFindings(context: RepoContext): RawFinding[] {
  const { root, files } = context;
  const read = (path: string): ReleaseSource => ({
    path,
    text: readFileSync(join(root, path), "utf8"),
  });
  const changelogs = files.filter((path) => /(^|\/)CHANGELOG\.md$/.test(path)).map(read);
  const changesets = files
    .filter((path) => /^\.changeset\/[^/]+\.md$/.test(path) && path !== ".changeset/README.md")
    .map(read);
  const notes = new Map(
    files
      .filter((path) => path.startsWith(`${RELEASE_NOTES_FOLDER}/`) && path.endsWith(".mdx"))
      .map((path) => [path, read(path).text]),
  );
  return checkReleaseNotes(breakingReleases(changelogs, changesets), notes).map((text) => ({
    rule: "release-notes",
    dir: "",
    text,
  }));
}
