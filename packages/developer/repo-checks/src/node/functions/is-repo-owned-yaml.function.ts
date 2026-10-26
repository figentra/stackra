/**
 * Stackra file contract:
 * Purpose: `isRepoOwnedYaml(path)`, whether a YAML file is the repository's own: generated or vendored YAML is not.
 * Boundary: pure. pnpm-workspace.yaml joins the owned set when STA-300 lands.
 * Runtime: node
 * Governing contract: the YAML standard (STA-299).
 */

/** Generated or vendored YAML the flow-map rule does not own. */
const YAML_NOT_OWNED = [
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^\.specify\//,
  /^\.(agents|claude)\/(skills|reference)\//,
  /^\.old\//,
];

/**
 * True for a `.yaml`/`.yml` path the repository owns.
 *
 * @param path - repository-relative.
 * @example
 * isRepoOwnedYaml("pnpm-lock.yaml"); // false
 */
export function isRepoOwnedYaml(path: string): boolean {
  return /\.ya?ml$/.test(path) && !YAML_NOT_OWNED.some((re) => re.test(path));
}
