/**
 * Stackra file contract:
 * Purpose: `recordLine(build)`, the JSON line `stackra eas-preflight record` appends: when, platform, profile, sha,
 *          build id and rollout id (moved from `tools/scripts/eas-preflight.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0180 (mobile builds and updates); ADR 0170 (deploy from a commit of main); STA-1577.
 */

/**
 * One record line, newline-terminated.
 *
 * @param build - the build facts; `buildId` is required.
 * @throws Error when `buildId` is missing.
 * @example
 * recordLine({ at, platform: "android", sha: "abc", buildId: "b1" }); // '{"at":…,"buildId":"b1","rolloutId":null}\n'
 */
export function recordLine(build: {
  readonly at?: string | undefined;
  readonly platform: string | undefined;
  readonly profile?: string | undefined;
  readonly sha: string;
  readonly buildId?: string | undefined;
  readonly rolloutId?: string | undefined;
}): string {
  const { at, platform, profile, sha, buildId, rolloutId } = build;
  if (!buildId) throw new Error("--build-id is required");
  return `${JSON.stringify({ at, platform, profile: profile ?? null, sha, buildId, rolloutId: rolloutId ?? null })}\n`;
}
