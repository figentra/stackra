/**
 * Stackra file contract:
 * Purpose: `isRunwayFile(path)`, whether a path is a `runway.yaml` (or a misnamed `runway.yml`) in repo-owned YAML.
 * Boundary: pure; vendored and archived copies are not ours.
 * Runtime: node
 * Governing contract: ADR 0296.
 */
import { isRepoOwnedYaml } from "#node/functions/is-repo-owned-yaml.function";

/**
 * True for a repo-owned runway file.
 *
 * @param path - repository-relative.
 * @example
 * isRunwayFile("services/notes/runway.yml"); // true (and then refused for its name)
 */
export function isRunwayFile(path: string): boolean {
  return isRepoOwnedYaml(path) && /(?:^|\/)runway\.ya?ml$/.test(path);
}
