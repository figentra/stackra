/**
 * Stackra file contract:
 * Purpose: `npmMetadataFor(dir)`, the npm metadata fields a Stackra member at `dir` carries: `repository` (with its
 *          `directory`), `homepage`, `bugs`, `author` and `engines`, in that key order.
 * Boundary: pure; the values come from `MEMBER_METADATA`.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27).
 */
import { MEMBER_METADATA } from "#node/constants/member-metadata.constant";

/**
 * The npm metadata of the member at `dir`.
 *
 * @param dir - repository-relative, forward slashes (`packages/data/storage`).
 * @example
 * npmMetadataFor("services/health").homepage; // "https://github.com/figentra/stackra/tree/main/services/health#readme"
 */
export function npmMetadataFor(dir: string): {
  readonly repository: { readonly type: "git"; readonly url: string; readonly directory: string };
  readonly homepage: string;
  readonly bugs: { readonly url: string };
  readonly author: string;
  readonly engines: { readonly node: string };
} {
  return {
    repository: { type: "git", url: MEMBER_METADATA.repositoryUrl, directory: dir },
    homepage: `${MEMBER_METADATA.treeUrl}${dir}#readme`,
    bugs: { url: MEMBER_METADATA.bugsUrl },
    author: MEMBER_METADATA.author,
    engines: { node: MEMBER_METADATA.node },
  };
}
