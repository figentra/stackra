/**
 * Stackra file contract:
 * Purpose: `expectedName(dir)`, the npm name a member's placement implies: packages @stackra/<name>, apps @figentra/<dir>,
 *          services @figentra/service-<dir>, workers @figentra/worker-<dir>.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0284 (workers); ADR 0461 (no `@stackra-pro` member here).
 */

/**
 * The npm name the member at `dir` must carry, or null when its placement implies none.
 *
 * @param dir - repository-relative, forward slashes.
 * @example
 * expectedName("services/notes"); // "@figentra/service-notes"
 */
export function expectedName(dir: string): string | null {
  const base = dir.split("/").at(-1) ?? "";
  if (dir.startsWith("apps/")) return `@figentra/${base}`;
  if (dir.startsWith("services/")) return `@figentra/service-${base}`;
  if (dir.startsWith("workers/")) return `@figentra/worker-${base}`;
  if (dir.startsWith("packages/tooling/")) return `@stackra/${base}-config`;
  if (dir.startsWith("packages/")) return `@stackra/${base}`;
  return null;
}
