/**
 * Stackra file contract:
 * Purpose: `publishShell(request)`, puts a new release of one web shell line on its canary: writes
 *          `shell:<surface>:<line>` as the current release with the new one under `canary`, its scopes and start,
 *          and answers that canary for `promoteCanary`.
 * Boundary: writes through the `EdgeKvWriter` port only. The OS deploy uploads the shell's files and runs
 *           `checkShellCompatibility` before it; the Worker rolls out in stages separately (Cloudflare gradual
 *           deployments, infra-cloudflare).
 * Runtime: node
 * Governing contract: app-shells 4.1 (step 4), 5.3 and 16 (point 3: the shells get their own canary); owner
 *                     decision D6; ADR 0323 and R-59 (scope).
 */
import { EdgeKvPrefix } from "@stackra/app/contracts";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import type { EdgeCanary } from "#node/types/edge-canary.type";
import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";
import type { EdgeShellRow } from "#node/types/edge-shell-row.type";
import type { ShellPublishRequest } from "#node/types/shell-publish-request.type";

/**
 * The canary started.
 *
 * @throws RunwayInvalidError when the surface or line is not a key part or no canary scope is given.
 * @example
 * const canary = await publishShell({ kv, surface: "console", line: "3", current, next, canaryScopes });
 */
export async function publishShell(
  request: ShellPublishRequest,
): Promise<EdgeCanary<EdgeShellRelease>> {
  const issues: RunwayIssue[] = [];
  if (!/^[a-z][a-z0-9-]*$/.test(request.surface))
    issues.push({ path: "surface", message: "Expected a surface code" });
  if (!/^[0-9]+$/.test(request.line)) issues.push({ path: "line", message: "Expected a major" });
  if (request.canaryScopes.length === 0)
    issues.push({ path: "canaryScopes", message: "Name the internal and demo scopes (D6)" });
  if (issues.length > 0) throw new RunwayInvalidError("shell publish", issues);
  const canary: EdgeCanary<EdgeShellRelease> = {
    ...request.next,
    scopes: [...request.canaryScopes],
    since: (request.now ?? new Date()).toISOString(),
  };
  const row: EdgeShellRow = { ...request.current, canary };
  await request.kv.put(
    `${EdgeKvPrefix.Shell}:${request.surface}:${request.line}`,
    JSON.stringify(row),
  );
  return canary;
}
