/**
 * Stackra file contract:
 * Purpose: `releaseNotePath(version)`, the upgrade note page that covers a release: its release line's page under
 *          `RELEASE_NOTES_FOLDER`, `0-<minor>.mdx` before 1.0.0 (a minor is the breaking slot there) and `<major>.mdx`
 *          from 1.0.0 on.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); STA-2835.
 */
import { RELEASE_NOTES_FOLDER } from "#node/constants/release-notes-folder.constant";

/**
 * The repository-relative path of the note for `version`.
 *
 * @param version - an `x.y.z` version.
 * @example
 * releaseNotePath("0.33.1"); // "apps/docs/src/docs/customers/upgrading/0-33.mdx"
 * releaseNotePath("2.1.0"); // "apps/docs/src/docs/customers/upgrading/2.mdx"
 */
export function releaseNotePath(version: string): string {
  const [major = "0", minor = "0"] = version.split(".");
  return `${RELEASE_NOTES_FOLDER}/${major === "0" ? `0-${minor}` : major}.mdx`;
}
