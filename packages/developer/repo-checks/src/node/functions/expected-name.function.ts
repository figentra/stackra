/**
 * Stackra file contract:
 * Purpose: `expectedName(dir)`, the npm name a member's placement implies: packages @stackra/<name>, apps @figentra/<dir>,
 *          services @figentra/service-<dir>, workers @figentra/worker-<dir>.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0284 (workers); owner decision 6 (the Pro wrapper's scope).
 */
import { PRO_WRAPPER } from "#node/constants/pro-wrapper.constant";

/**
 * The npm name the member at `dir` must carry, or null when its placement implies none.
 *
 * @param dir - repository-relative, forward slashes.
 * @example
 * expectedName("services/notes"); // "@figentra/service-notes"
 */
export function expectedName(dir: string): string | null {
  const base = dir.split("/").at(-1) ?? "";
  // The one Pro package lives in a `@stackra-pro` scope whose name is not its folder's (owner 6).
  if (dir === PRO_WRAPPER.dir) return PRO_WRAPPER.name;
  if (dir.startsWith("apps/")) return `@figentra/${base}`;
  if (dir.startsWith("services/")) return `@figentra/service-${base}`;
  if (dir.startsWith("workers/")) return `@figentra/worker-${base}`;
  if (dir.startsWith("packages/tooling/")) return `@stackra/${base}-config`;
  if (dir.startsWith("packages/")) return `@stackra/${base}`;
  return null;
}
