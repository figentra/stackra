/**
 * Stackra file contract:
 * Purpose: `npmMetadataFor(dir)`, the npm metadata fields a Stackra member at `dir` carries: `repository` (with its
 *          `directory`), `homepage`, `bugs`, `author` and `engines`, in that key order. A member published to npmjs
 *          (`UNSCOPED_PACKAGES`) points at `NPMJS_REPOSITORY`, the repository that signs its provenance.
 * Boundary: pure; the values come from `MEMBER_METADATA` and `NPMJS_REPOSITORY`.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0199 (amendment of 2026-11-27); STA-2897.
 */
import { MEMBER_METADATA } from "#node/constants/member-metadata.constant";
import { NPMJS_REPOSITORY } from "#node/constants/npmjs-repository.constant";
import { UNSCOPED_PACKAGES } from "#node/constants/unscoped-packages.constant";

/**
 * The npm metadata of the member at `dir`.
 *
 * @param dir - repository-relative, forward slashes (`packages/data/storage`).
 * @example
 * npmMetadataFor("services/health").homepage; // "https://github.com/figentra/stackra/tree/main/services/health#readme"
 * npmMetadataFor("packages/developer/create-stackra").repository.url; // "git+https://github.com/stackra-inc/stackra.git"
 */
export function npmMetadataFor(dir: string): {
  readonly repository: { readonly type: "git"; readonly url: string; readonly directory: string };
  readonly homepage: string;
  readonly bugs: { readonly url: string };
  readonly author: string;
  readonly engines: { readonly node: string };
} {
  // An npmjs provenance publish is refused unless `repository.url` names the repository that signed it.
  const home = Object.hasOwn(UNSCOPED_PACKAGES, dir) ? NPMJS_REPOSITORY : MEMBER_METADATA;
  return {
    repository: { type: "git", url: home.repositoryUrl, directory: dir },
    homepage: `${home.treeUrl}${dir}#readme`,
    bugs: { url: home.bugsUrl },
    author: MEMBER_METADATA.author,
    engines: { node: MEMBER_METADATA.node },
  };
}
