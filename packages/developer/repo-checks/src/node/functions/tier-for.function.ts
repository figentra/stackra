/**
 * Stackra file contract:
 * Purpose: `tierFor(dir)`, the one turbo tier tag a member's directory implies; null for the repository root.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0003 (tiers); ADR 0284 (a Worker reuses the app tier).
 */

/**
 * The tier tag of the member at `dir`: `tier:app`, `tier:config`, `tier:lib`, `tier:service`, `unknown`, or null for
 * the repository root.
 *
 * @param dir - repository-relative, forward slashes; "" for the root.
 * @example
 * tierFor("workers/edge"); // "tier:app"
 */
export function tierFor(dir: string): string | null {
  if (dir === "") return null;
  if (dir.startsWith("apps/")) return "tier:app";
  // ADR 0284: a Cloudflare Worker member is deployed like an app and reuses its tier.
  if (dir.startsWith("workers/")) return "tier:app";
  if (dir.startsWith("packages/tooling/")) return "tier:config";
  if (dir.startsWith("packages/")) return "tier:lib";
  if (dir.startsWith("services/")) return "tier:service";
  return "unknown";
}
