/**
 * Stackra file contract:
 * Purpose: `preflightProblems(state)`, every reason a local EAS build must not start: an unknown platform, a dirty
 *          tree, a HEAD that is not the deployed sha, or too little free disk (moved from
 *          `tools/scripts/eas-preflight.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0180 (mobile builds and updates); ADR 0170 (deploy from a commit of main); STA-1577.
 */
import { MIN_FREE_BYTES } from "#node/eas-preflight/constants/min-free-bytes.constant";

/** One gibibyte. */
const GB = 1024 ** 3;

/**
 * The refusals; empty when the build may start.
 *
 * @param state - the platform, whether the tree is dirty, HEAD, the deployed sha and the free bytes.
 * @example
 * preflightProblems({ platform: "ios", dirty: false, head: "a", deployedSha: "a", freeBytes: 30 * 1024 ** 3 }); // []
 */
export function preflightProblems(state: {
  readonly platform: string | undefined;
  readonly dirty: boolean;
  readonly head: string;
  readonly deployedSha: string;
  readonly freeBytes: number;
}): string[] {
  const { platform, dirty, head, deployedSha, freeBytes } = state;
  const out: string[] = [];
  const need = platform === undefined ? undefined : MIN_FREE_BYTES[platform];
  if (need === undefined) return [`unknown platform "${platform}" (ios or android)`];
  if (dirty) out.push("the working tree has uncommitted changes; build from a clean checkout");
  if (head !== deployedSha)
    out.push(
      `HEAD ${head} is not the deployed sha ${deployedSha}; check out the deployed commit or pass --deployed-sha`,
    );
  if (freeBytes < need)
    out.push(
      `${(freeBytes / GB).toFixed(1)} GB free; a local ${platform} build needs ${need / GB} GB`,
    );
  return out;
}
